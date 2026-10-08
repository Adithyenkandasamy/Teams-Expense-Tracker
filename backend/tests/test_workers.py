"""Tests for background workers: ReminderWorker and ReceiptCleanupWorker."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ExpenseStatus, PaymentStatus
from app.models.expense import DeadlineHistory, Expense, ExpenseSplit
from app.models.group import Group
from app.models.user import User
from app.workers.receipt_cleanup_worker import run_receipt_cleanup_worker
from app.workers.reminder_worker import run_reminder_worker


@pytest.mark.asyncio
async def test_reminder_worker_extends_deadline_and_creates_history(
    db_session: AsyncSession,
    group_with_bob: Group,
    user_alice: User,
    user_bob: User,
):
    """Reminder worker should extend deadline and create DeadlineHistory for overdue expenses."""
    past = datetime.now(UTC) - timedelta(hours=2)
    expense = Expense(
        group_id=group_with_bob.id,
        created_by=user_alice.id,
        paid_by=user_alice.id,
        amount=Decimal("100.00"),
        description="Electricity bill",
        initial_deadline=past,
        current_deadline=past,
        next_reminder_at=past,
        status=ExpenseStatus.ACTIVE.value,
    )
    db_session.add(expense)
    await db_session.flush()

    # Bob's split is PENDING (unpaid)
    split_bob = ExpenseSplit(
        expense_id=expense.id,
        user_id=user_bob.id,
        amount=Decimal("50.00"),
        status=PaymentStatus.PENDING.value,
    )
    # Alice's split is PAID
    split_alice = ExpenseSplit(
        expense_id=expense.id,
        user_id=user_alice.id,
        amount=Decimal("50.00"),
        status=PaymentStatus.PAID.value,
        paid_at=past,
    )
    db_session.add_all([split_bob, split_alice])
    await db_session.flush()

    # Run worker with notification mocked
    with patch(
        "app.services.notification_service.NotificationService.notify_payment_reminder"
    ) as mock_remind, patch(
        "app.services.notification_service.NotificationService.notify_deadline_extended"
    ) as mock_extend:
        processed = await run_reminder_worker(db_session)
        assert processed == 1

        # Check deadline was extended
        await db_session.refresh(expense)
        curr = (
            expense.current_deadline.replace(tzinfo=UTC)
            if expense.current_deadline.tzinfo is None
            else expense.current_deadline
        )
        assert curr > past

        # Check DeadlineHistory record was created
        history_result = await db_session.execute(
            select(DeadlineHistory).where(DeadlineHistory.expense_id == expense.id)
        )
        histories = list(history_result.scalars().all())
        assert len(histories) == 1
        old_d = (
            histories[0].old_deadline.replace(tzinfo=UTC)
            if histories[0].old_deadline.tzinfo is None
            else histories[0].old_deadline
        )
        assert old_d == past

        # Verify notifications were triggered
        assert mock_remind.called
        assert mock_extend.called


@pytest.mark.asyncio
async def test_receipt_cleanup_worker_idempotent(
    db_session: AsyncSession,
    group_with_bob: Group,
    user_alice: User,
):
    """Receipt cleanup worker deletes Cloudinary images past retention and is idempotent."""
    past = datetime.now(UTC) - timedelta(days=3)
    expense = Expense(
        group_id=group_with_bob.id,
        created_by=user_alice.id,
        paid_by=user_alice.id,
        amount=Decimal("50.00"),
        description="Old receipt expense",
        initial_deadline=past,
        current_deadline=past,
        status=ExpenseStatus.CLOSED.value,
        closed_at=past,
        receipt_delete_at=past,
        receipt_url="https://res.cloudinary.com/test/image/upload/v1/receipt.jpg",
        cloudinary_public_id="expense_receipts/receipt_123",
    )
    db_session.add(expense)
    await db_session.flush()

    with patch("app.workers.receipt_cleanup_worker.delete_image", return_value=True) as mock_del:
        # First run: cleans up 1 receipt
        cleaned_first = await run_receipt_cleanup_worker(db_session)
        assert cleaned_first == 1
        assert mock_del.called

        await db_session.refresh(expense)
        assert expense.receipt_url is None
        assert expense.cloudinary_public_id is None

        # Second run: idempotent — 0 receipts to clean
        cleaned_second = await run_receipt_cleanup_worker(db_session)
        assert cleaned_second == 0
