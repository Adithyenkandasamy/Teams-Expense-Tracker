"""Expense service — business logic for expenses, splits, and payments."""

import uuid
from datetime import UTC, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.enums import ExpenseStatus, PaymentStatus
from app.models.expense import DeadlineHistory, Expense, ExpenseSplit, PaymentProof
from app.models.user import User
from app.schemas.expense import ExpenseCreate
from app.services.group_service import GroupService


def _split_amount_equally(total: Decimal, num_users: int) -> list[Decimal]:
    """Split a total amount equally, distributing remainder cents fairly.

    Uses integer-cent arithmetic so the sum of splits == total exactly.
    """
    if num_users <= 0:
        raise BadRequestError("Must split between at least one user")

    # Work in cents to avoid floating-point issues
    total_cents = int((total * 100).to_integral_value(rounding=ROUND_HALF_UP))
    base_cents = total_cents // num_users
    remainder = total_cents % num_users

    amounts: list[Decimal] = []
    for i in range(num_users):
        cents = base_cents + (1 if i < remainder else 0)
        amounts.append(Decimal(cents) / Decimal(100))
    return amounts


class ExpenseService:
    """Handles expense-related business logic."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.group_service = GroupService(db)

    async def create_expense(
        self,
        group_id: uuid.UUID,
        data: ExpenseCreate,
        creator: User,
    ) -> Expense:
        """Create a new expense with calculated splits."""
        # Verify creator is a group member
        await self.group_service.verify_membership(group_id, creator.id)

        # Verify paid_by is a group member
        await self.group_service.verify_membership(group_id, data.paid_by)

        # Verify all split users are group members
        for user_id in data.split_between:
            await self.group_service.verify_membership(group_id, user_id)

        expense = Expense(
            group_id=group_id,
            created_by=creator.id,
            paid_by=data.paid_by,
            amount=data.amount,
            description=data.description,
            category=data.category,
            initial_deadline=data.deadline,
            current_deadline=data.deadline,
            next_reminder_at=data.deadline,
            status=ExpenseStatus.ACTIVE.value,
        )
        self.db.add(expense)
        await self.db.flush()

        # Calculate equal splits
        split_amounts = _split_amount_equally(data.amount, len(data.split_between))

        for i, user_id in enumerate(data.split_between):
            split = ExpenseSplit(
                expense_id=expense.id,
                user_id=user_id,
                amount=split_amounts[i],
                status=PaymentStatus.PENDING.value,
            )
            self.db.add(split)

        await self.db.flush()
        return await self.get_expense_by_id(expense.id)

    async def get_expense_by_id(self, expense_id: uuid.UUID) -> Expense:
        """Get an expense by ID or raise NotFoundError."""
        result = await self.db.execute(
            select(Expense)
            .options(
                selectinload(Expense.splits).selectinload(ExpenseSplit.user),
                selectinload(Expense.splits).selectinload(ExpenseSplit.payment_proofs),
                selectinload(Expense.creator),
                selectinload(Expense.payer),
            )
            .where(Expense.id == expense_id)
        )
        expense = result.scalar_one_or_none()
        if expense is None:
            raise NotFoundError("Expense not found")
        return expense

    async def get_group_expenses(self, group_id: uuid.UUID) -> list[Expense]:
        """Get all expenses for a group."""
        result = await self.db.execute(
            select(Expense)
            .options(
                selectinload(Expense.splits).selectinload(ExpenseSplit.user),
                selectinload(Expense.splits).selectinload(ExpenseSplit.payment_proofs),
                selectinload(Expense.creator),
                selectinload(Expense.payer),
            )
            .where(Expense.group_id == group_id)
            .order_by(Expense.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_split_by_id(self, split_id: uuid.UUID) -> ExpenseSplit:
        """Get an expense split by ID or raise NotFoundError."""
        result = await self.db.execute(
            select(ExpenseSplit)
            .options(
                selectinload(ExpenseSplit.user),
                selectinload(ExpenseSplit.payment_proofs),
            )
            .where(ExpenseSplit.id == split_id)
        )
        split = result.scalar_one_or_none()
        if split is None:
            raise NotFoundError("Expense split not found")
        return split

    async def submit_payment(
        self,
        split_id: uuid.UUID,
        user: User,
        image_url: str | None = None,
        cloudinary_public_id: str | None = None,
    ) -> ExpenseSplit:
        """Submit payment confirmation for a split.

        Only the split owner can submit.
        """
        split = await self.get_split_by_id(split_id)

        # Only the split owner can submit payment
        if split.user_id != user.id:
            raise ForbiddenError("You can only submit payment for your own split")

        # Must be in PENDING or REJECTED status to submit
        if split.status not in (PaymentStatus.PENDING.value, PaymentStatus.REJECTED.value):
            raise BadRequestError(
                f"Cannot submit payment for split with status {split.status}"
            )

        now = datetime.now(UTC)
        split.status = PaymentStatus.PAYMENT_SUBMITTED.value
        split.payment_submitted_at = now

        # Store payment proof if provided
        if image_url and cloudinary_public_id:
            proof = PaymentProof(
                expense_split_id=split.id,
                uploaded_by=user.id,
                image_url=image_url,
                cloudinary_public_id=cloudinary_public_id,
            )
            self.db.add(proof)

        await self.db.flush()
        return await self.get_split_by_id(split.id)

    async def approve_payment(
        self, split_id: uuid.UUID, leader: User
    ) -> ExpenseSplit:
        """Approve a submitted payment. Only the expense leader can approve."""
        split = await self.get_split_by_id(split_id)
        expense = await self.get_expense_by_id(split.expense_id)

        # Only the expense creator (leader) can approve
        if expense.created_by != leader.id:
            raise ForbiddenError("Only the expense leader can approve payments")

        if split.status != PaymentStatus.PAYMENT_SUBMITTED.value:
            raise BadRequestError("Can only approve a submitted payment")

        now = datetime.now(UTC)
        split.status = PaymentStatus.PAID.value
        split.paid_at = now

        await self.db.flush()

        # Check if all splits are now paid → mark expense READY_TO_CLOSE
        await self._check_all_paid(expense)

        return await self.get_split_by_id(split.id)

    async def reject_payment(
        self, split_id: uuid.UUID, leader: User
    ) -> ExpenseSplit:
        """Reject a submitted payment. Only the expense leader can reject."""
        split = await self.get_split_by_id(split_id)
        expense = await self.get_expense_by_id(split.expense_id)

        if expense.created_by != leader.id:
            raise ForbiddenError("Only the expense leader can reject payments")

        if split.status != PaymentStatus.PAYMENT_SUBMITTED.value:
            raise BadRequestError("Can only reject a submitted payment")

        split.status = PaymentStatus.REJECTED.value
        split.payment_submitted_at = None

        await self.db.flush()
        return await self.get_split_by_id(split.id)

    async def close_expense(
        self, expense_id: uuid.UUID, leader: User
    ) -> Expense:
        """Close an expense. Only the leader can close, and all splits must be PAID."""
        expense = await self.get_expense_by_id(expense_id)

        if expense.created_by != leader.id:
            raise ForbiddenError("Only the expense leader can close the expense")

        if expense.status == ExpenseStatus.CLOSED.value:
            raise BadRequestError("Expense is already closed")

        # Verify ALL splits are PAID
        result = await self.db.execute(
            select(ExpenseSplit).where(ExpenseSplit.expense_id == expense.id)
        )
        splits = list(result.scalars().all())

        unpaid = [s for s in splits if s.status != PaymentStatus.PAID.value]
        if unpaid:
            raise BadRequestError(
                f"Cannot close expense: {len(unpaid)} split(s) are not paid"
            )

        settings = get_settings()
        now = datetime.now(UTC)

        expense.status = ExpenseStatus.CLOSED.value
        expense.closed_at = now
        expense.receipt_delete_at = now + timedelta(days=settings.receipt_retention_days)

        await self.db.flush()
        return await self.get_expense_by_id(expense.id)

    async def update_receipt(
        self,
        expense_id: uuid.UUID,
        user: User,
        receipt_url: str,
        cloudinary_public_id: str,
    ) -> Expense:
        """Update the receipt for an expense."""
        expense = await self.get_expense_by_id(expense_id)

        if expense.created_by != user.id:
            raise ForbiddenError("Only the expense leader can update the receipt")

        expense.receipt_url = receipt_url
        expense.cloudinary_public_id = cloudinary_public_id

        await self.db.flush()
        return expense

    async def _check_all_paid(self, expense: Expense) -> None:
        """If all splits are PAID, set expense status to READY_TO_CLOSE."""
        result = await self.db.execute(
            select(ExpenseSplit).where(ExpenseSplit.expense_id == expense.id)
        )
        splits = list(result.scalars().all())

        if all(s.status == PaymentStatus.PAID.value for s in splits):
            expense.status = ExpenseStatus.READY_TO_CLOSE.value
            await self.db.flush()

    async def extend_deadline(
        self,
        expense: Expense,
        reason: str = "Auto-extended: unpaid splits remain",
    ) -> DeadlineHistory:
        """Extend an expense's deadline by the configured interval."""
        settings = get_settings()
        now = datetime.now(UTC)

        old_deadline = expense.current_deadline
        new_deadline = now + timedelta(hours=settings.default_reminder_interval_hours)

        # Record history
        history = DeadlineHistory(
            expense_id=expense.id,
            old_deadline=old_deadline,
            new_deadline=new_deadline,
            reason=reason,
        )
        self.db.add(history)

        expense.current_deadline = new_deadline
        expense.next_reminder_at = new_deadline

        await self.db.flush()
        return history
