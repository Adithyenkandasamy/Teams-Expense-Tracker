"""Balance service — deterministic balance calculation."""

import uuid
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload

from app.core.exceptions import NotFoundError
from app.models.enums import ExpenseStatus, PaymentStatus
from app.models.expense import Expense, ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.balance import BalanceEntry, GroupBalanceResponse


class BalanceService:
    """Calculates balances without modifying financial records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_group_balances(
        self, group_id: uuid.UUID, current_user: User
    ) -> GroupBalanceResponse:
        """Calculate balance summary for the current user within a group.

        For each non-closed expense:
        - If current_user paid: other users' unpaid splits are owed TO current_user.
        - If someone else paid and current_user has a split: current_user owes that amount.

        Only PENDING, PAYMENT_SUBMITTED, and REJECTED splits count as outstanding.
        PAID splits are settled.
        """
        # Fetch group
        result = await self.db.execute(
            select(Group)
            .options(
                noload(Group.members),
                noload(Group.creator),
                noload(Group.group_leader),
                noload(Group.expenses),
            )
            .where(Group.id == group_id)
        )
        group = result.scalar_one_or_none()
        if group is None:
            raise NotFoundError("Group not found")

        # Fetch all outstanding splits in one query rather than one query per expense.
        result = await self.db.execute(
            select(
                Expense.paid_by,
                ExpenseSplit.user_id,
                ExpenseSplit.amount,
            )
            .join(ExpenseSplit, ExpenseSplit.expense_id == Expense.id)
            .where(
                Expense.group_id == group_id,
                Expense.status != ExpenseStatus.CLOSED.value,
                ExpenseSplit.status.in_(
                    (
                        PaymentStatus.PENDING.value,
                        PaymentStatus.PAYMENT_SUBMITTED.value,
                        PaymentStatus.REJECTED.value,
                    )
                ),
            )
        )

        # user_id -> net amount (positive = they owe current_user)
        balance_map: dict[uuid.UUID, Decimal] = defaultdict(Decimal)

        for paid_by, split_user_id, amount in result.all():
            if paid_by == current_user.id and split_user_id != current_user.id:
                # Someone else owes the current user
                balance_map[split_user_id] += amount
            elif paid_by != current_user.id and split_user_id == current_user.id:
                # Current user owes the payer
                balance_map[paid_by] -= amount

        # Build response
        total_owed_to_you = Decimal("0")
        total_you_owe = Decimal("0")
        entries: list[BalanceEntry] = []

        # Fetch user names
        member_result = await self.db.execute(
            select(GroupMember.user_id, User.name)
            .join(User, User.id == GroupMember.user_id)
            .where(GroupMember.group_id == group_id)
        )
        user_map = {user_id: name for user_id, name in member_result.all()}

        for user_id, amount in balance_map.items():
            if amount > 0:
                total_owed_to_you += amount
            elif amount < 0:
                total_you_owe += abs(amount)

            entries.append(
                BalanceEntry(
                    user_id=user_id,
                    user_name=user_map.get(user_id, "Unknown"),
                    amount=amount,
                )
            )

        return GroupBalanceResponse(
            group_id=group_id,
            group_name=group.name,
            total_owed_to_you=total_owed_to_you,
            total_you_owe=total_you_owe,
            net_balance=total_owed_to_you - total_you_owe,
            balances=entries,
        )
