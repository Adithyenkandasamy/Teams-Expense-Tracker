"""Receipt cleanup worker — deletes Cloudinary assets after retention period."""

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cloudinary import delete_image
from app.models.enums import ExpenseStatus
from app.models.expense import Expense

logger = logging.getLogger(__name__)


async def run_receipt_cleanup_worker(db: AsyncSession) -> int:
    """Find closed expenses past retention period and delete Cloudinary receipts.

    Idempotent: if cloudinary_public_id is already NULL, the expense is skipped.
    Returns the number of receipts cleaned up.
    """
    now = datetime.now(UTC)

    result = await db.execute(
        select(Expense).where(
            Expense.status == ExpenseStatus.CLOSED.value,
            Expense.receipt_delete_at <= now,
            Expense.cloudinary_public_id.isnot(None),
        )
    )
    expenses = list(result.scalars().all())

    if not expenses:
        logger.info("Receipt cleanup: no receipts to clean up")
        return 0

    cleaned = 0
    for expense in expenses:
        public_id = expense.cloudinary_public_id
        if public_id is None:
            # Already cleaned — idempotent
            continue

        try:
            deleted = delete_image(public_id)
            if deleted:
                logger.info(f"Receipt cleanup: deleted Cloudinary asset {public_id}")
            else:
                logger.warning(
                    f"Receipt cleanup: Cloudinary reported no deletion for {public_id}"
                )
        except Exception as e:
            logger.error(f"Receipt cleanup: failed to delete {public_id}: {e}")
            continue

        # Clear the URL and public_id in the database
        expense.receipt_url = None
        expense.cloudinary_public_id = None
        cleaned += 1

    await db.commit()
    logger.info(f"Receipt cleanup: cleaned {cleaned} receipts")
    return cleaned
