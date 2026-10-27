"""Personal expense tracking endpoints."""

import calendar
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.personal_expense import PersonalExpense
from app.models.user import User
from app.schemas.personal_expense import PersonalExpenseCreate, PersonalExpenseResponse

router = APIRouter(prefix="/personal-expenses", tags=["personal expenses"])
APP_TIMEZONE = ZoneInfo("Asia/Kolkata")


@router.get("", response_model=list[PersonalExpenseResponse])
async def list_personal_expenses(
    year: int = Query(ge=2000, le=2100),
    month: int = Query(ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PersonalExpenseResponse]:
    """List the current user's expenses for the selected month."""
    last_day = calendar.monthrange(year, month)[1]
    start = datetime(year, month, 1, tzinfo=APP_TIMEZONE)
    end = datetime(year, month, last_day, 23, 59, 59, 999999, tzinfo=APP_TIMEZONE)
    result = await db.execute(
        select(PersonalExpense)
        .where(
            PersonalExpense.user_id == current_user.id,
            PersonalExpense.spent_at >= start,
            PersonalExpense.spent_at <= end,
        )
        .order_by(PersonalExpense.spent_at.desc())
    )
    return [PersonalExpenseResponse.model_validate(row) for row in result.scalars()]


@router.post("", response_model=PersonalExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_personal_expense(
    data: PersonalExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PersonalExpenseResponse:
    expense = PersonalExpense(
        user_id=current_user.id,
        amount=data.amount,
        description=data.description.strip(),
        category=data.category.strip() or "Other",
        spent_at=data.spent_at or datetime.now(APP_TIMEZONE),
    )
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return PersonalExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_personal_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(PersonalExpense).where(
            PersonalExpense.id == expense_id,
            PersonalExpense.user_id == current_user.id,
        )
    )
    expense = result.scalar_one_or_none()
    if expense is None:
        raise HTTPException(status_code=404, detail="Personal expense not found")
    await db.delete(expense)
