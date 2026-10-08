"""Reminder worker — extends deadlines and sends FCM reminders for overdue expenses."""

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ExpenseStatus, PaymentStatus
from app.models.expense import Expense, ExpenseSplit
from app.services.expense_service import ExpenseService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


async def run_reminder_worker(db: AsyncSession) -> int:
    """Find overdue expenses and extend deadlines, send reminders.

    Returns the number of expenses processed.
    """
    now = datetime.now(UTC)

    # Find active expenses where next_reminder_at has passed
    result = await db.execute(
        select(Expense).where(
            Expense.status == ExpenseStatus.ACTIVE.value,
            Expense.next_reminder_at <= now,
        )
    )
    expenses = list(result.scalars().all())

    if not expenses:
        logger.info("Reminder worker: no overdue expenses found")
        return 0

    expense_service = ExpenseService(db)
    notification_service = NotificationService(db)
    processed = 0

    for expense in expenses:
        # Find unpaid splits
        split_result = await db.execute(
            select(ExpenseSplit).where(
                ExpenseSplit.expense_id == expense.id,
                ExpenseSplit.status.in_([
                    PaymentStatus.PENDING.value,
                    PaymentStatus.REJECTED.value,
                ]),
            )
        )
        unpaid_splits = list(split_result.scalars().all())

        if not unpaid_splits:
            # All paid, but expense wasn't marked — update it
            await expense_service._check_all_paid(expense)
            continue

        # Extend deadline
        await expense_service.extend_deadline(expense)

        # Send reminder to unpaid users
        unpaid_user_ids = [s.user_id for s in unpaid_splits]
        await notification_service.notify_payment_reminder(
            user_ids=unpaid_user_ids,
            expense_description=expense.description,
        )
        await notification_service.notify_deadline_extended(
            user_ids=unpaid_user_ids,
            expense_description=expense.description,
        )

        processed += 1
        logger.info(
            f"Reminder worker: extended deadline for expense {expense.id}, "
            f"notified {len(unpaid_user_ids)} users"
        )

    await db.commit()
    return processed
