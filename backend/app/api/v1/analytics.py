"""Aggregated spending analytics endpoints."""

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.expense import Expense, ExpenseSplit
from app.models.group import GroupMember
from app.models.personal_expense import PersonalExpense
from app.models.user import User
from app.schemas.analytics import (
    MonthlySpendingBucket,
    MonthlySpendingResponse,
    SpendingCategory,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])
APP_TIMEZONE = ZoneInfo("Asia/Kolkata")


def _month_key(value: datetime) -> str:
    return value.strftime("%Y-%m")


@router.get("/monthly", response_model=MonthlySpendingResponse)
async def get_monthly_spending(
    months: int = Query(default=6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MonthlySpendingResponse:
    """Return personal, group, and user-share totals for recent months."""
    now = datetime.now(APP_TIMEZONE)
    current_month = datetime(now.year, now.month, 1, tzinfo=APP_TIMEZONE)
    month_starts = [
        datetime(
            current_month.year + (current_month.month - 1 - offset) // 12,
            (current_month.month - 1 - offset) % 12 + 1,
            1,
            tzinfo=APP_TIMEZONE,
        )
        for offset in range(months - 1, -1, -1)
    ]
    start = month_starts[0]
    month_map = {
        _month_key(month_start): {
            "personal_total": 0,
            "group_total": 0,
            "your_group_share": 0,
        }
        for month_start in month_starts
    }

    personal_month = func.date_trunc(
        "month", func.timezone(APP_TIMEZONE.key, PersonalExpense.spent_at)
    ).label("month")
    personal_result = await db.execute(
        select(personal_month, func.sum(PersonalExpense.amount))
        .where(
            PersonalExpense.user_id == current_user.id,
            PersonalExpense.spent_at >= start,
        )
        .group_by(personal_month)
    )
    for month_value, total in personal_result.all():
        month_map[_month_key(month_value)]["personal_total"] = total or 0

    expense_month = func.date_trunc(
        "month", func.timezone(APP_TIMEZONE.key, Expense.created_at)
    ).label("month")
    group_result = await db.execute(
        select(expense_month, func.sum(Expense.amount))
        .join(GroupMember, GroupMember.group_id == Expense.group_id)
        .where(GroupMember.user_id == current_user.id, Expense.created_at >= start)
        .group_by(expense_month)
    )
    for month_value, total in group_result.all():
        month_map[_month_key(month_value)]["group_total"] = total or 0

    share_result = await db.execute(
        select(expense_month, func.sum(ExpenseSplit.amount))
        .join(ExpenseSplit, ExpenseSplit.expense_id == Expense.id)
        .where(
            ExpenseSplit.user_id == current_user.id,
            Expense.created_at >= start,
        )
        .group_by(expense_month)
    )
    for month_value, total in share_result.all():
        month_map[_month_key(month_value)]["your_group_share"] = total or 0

    month_end = now
    personal_categories_result = await db.execute(
        select(PersonalExpense.category, func.sum(PersonalExpense.amount))
        .where(
            PersonalExpense.user_id == current_user.id,
            PersonalExpense.spent_at >= current_month,
            PersonalExpense.spent_at <= month_end,
        )
        .group_by(PersonalExpense.category)
    )
    category_map: dict[str, dict[str, object]] = {}
    for category, total in personal_categories_result.all():
        category_map.setdefault(category or "Other", {"personal_total": 0, "your_group_share": 0})[
            "personal_total"
        ] = total or 0

    shared_categories_result = await db.execute(
        select(Expense.category, func.sum(ExpenseSplit.amount))
        .join(ExpenseSplit, ExpenseSplit.expense_id == Expense.id)
        .join(GroupMember, GroupMember.group_id == Expense.group_id)
        .where(
            GroupMember.user_id == current_user.id,
            ExpenseSplit.user_id == current_user.id,
            Expense.created_at >= current_month,
            Expense.created_at <= month_end,
        )
        .group_by(Expense.category)
    )
    for category, total in shared_categories_result.all():
        category_map.setdefault(category or "Other", {"personal_total": 0, "your_group_share": 0})[
            "your_group_share"
        ] = total or 0

    buckets = [
        MonthlySpendingBucket(month=month, **totals)
        for month, totals in month_map.items()
    ]
    categories = [
        SpendingCategory(category=category, **totals)
        for category, totals in sorted(
            category_map.items(),
            key=lambda row: float(row[1]["personal_total"] + row[1]["your_group_share"]),
            reverse=True,
        )
    ]
    return MonthlySpendingResponse(months=buckets, categories=categories)
