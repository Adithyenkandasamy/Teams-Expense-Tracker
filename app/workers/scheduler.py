"""Background scheduler that runs workers on a loop."""

import asyncio
import logging

from app.core.database import get_session_factory
from app.workers.receipt_cleanup_worker import run_receipt_cleanup_worker
from app.workers.reminder_worker import run_reminder_worker

logger = logging.getLogger(__name__)

REMINDER_INTERVAL_SECONDS = 300  # 5 minutes
CLEANUP_INTERVAL_SECONDS = 3600  # 1 hour


async def _run_periodic(coro_factory, interval: int, name: str) -> None:
    """Run a coroutine periodically with error handling."""
    factory = get_session_factory()
    while True:
        try:
            async with factory() as session:
                count = await coro_factory(session)
                logger.info(f"Worker '{name}' completed, processed {count} items")
        except Exception as e:
            logger.error(f"Worker '{name}' error: {e}", exc_info=True)
        await asyncio.sleep(interval)


async def start_background_workers() -> None:
    """Launch all background workers as asyncio tasks."""
    logger.info("Starting background workers")
    asyncio.create_task(
        _run_periodic(run_reminder_worker, REMINDER_INTERVAL_SECONDS, "reminder")
    )
    asyncio.create_task(
        _run_periodic(run_receipt_cleanup_worker, CLEANUP_INTERVAL_SECONDS, "receipt_cleanup")
    )
