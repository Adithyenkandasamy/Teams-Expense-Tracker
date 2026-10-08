"""Notification service — FCM push notification logic."""

import logging
import uuid

from firebase_admin import messaging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.firebase import send_fcm_multicast
from app.models.device_token import DeviceToken
from app.schemas.balance import DeviceTokenCreate

logger = logging.getLogger(__name__)


class NotificationService:
    """Sends push notifications via Firebase Cloud Messaging."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register_device_token(
        self, user_id: uuid.UUID, data: DeviceTokenCreate
    ) -> DeviceToken:
        """Register or update a device token for a user."""
        # Check if token already exists
        result = await self.db.execute(
            select(DeviceToken).where(DeviceToken.token == data.token)
        )
        existing = result.scalar_one_or_none()

        if existing is not None:
            # Update ownership if needed
            existing.user_id = user_id
            existing.device_type = data.device_type
            await self.db.flush()
            return existing

        device_token = DeviceToken(
            user_id=user_id,
            token=data.token,
            device_type=data.device_type,
        )
        self.db.add(device_token)
        await self.db.flush()
        return device_token

    async def _get_user_tokens(self, user_id: uuid.UUID) -> list[str]:
        """Get all FCM tokens for a user."""
        result = await self.db.execute(
            select(DeviceToken.token).where(DeviceToken.user_id == user_id)
        )
        return list(result.scalars().all())

    async def _get_multiple_user_tokens(self, user_ids: list[uuid.UUID]) -> list[str]:
        """Get FCM tokens for multiple users."""
        if not user_ids:
            return []
        result = await self.db.execute(
            select(DeviceToken.token).where(DeviceToken.user_id.in_(user_ids))
        )
        return list(result.scalars().all())

    async def send_to_user(
        self, user_id: uuid.UUID, title: str, body: str, data: dict[str, str] | None = None
    ) -> None:
        """Send a notification to all of a user's devices."""
        tokens = await self._get_user_tokens(user_id)
        if not tokens:
            logger.info(f"No device tokens for user {user_id}, skipping notification")
            return
        await self._send_multicast(tokens, title, body, data)

    async def send_to_users(
        self,
        user_ids: list[uuid.UUID],
        title: str,
        body: str,
        data: dict[str, str] | None = None,
    ) -> None:
        """Send a notification to multiple users' devices."""
        tokens = await self._get_multiple_user_tokens(user_ids)
        if not tokens:
            logger.info("No device tokens for target users, skipping notification")
            return
        await self._send_multicast(tokens, title, body, data)

    async def _send_multicast(
        self, tokens: list[str], title: str, body: str, data: dict[str, str] | None = None
    ) -> None:
        """Send a multicast FCM message."""
        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                tokens=tokens,
            )
            response = send_fcm_multicast(message)
            logger.info(
                f"FCM multicast sent: {response.success_count} success, "
                f"{response.failure_count} failures"
            )
        except Exception as e:
            logger.error(f"FCM send error: {e}")

    # --- Convenience methods for specific notification types ---

    async def notify_new_expense(
        self, user_ids: list[uuid.UUID], expense_description: str, amount: str
    ) -> None:
        await self.send_to_users(
            user_ids,
            title="New Expense",
            body=f"New expense: {expense_description} — ₹{amount}",
            data={"type": "new_expense"},
        )

    async def notify_payment_reminder(
        self, user_ids: list[uuid.UUID], expense_description: str
    ) -> None:
        await self.send_to_users(
            user_ids,
            title="Payment Reminder",
            body=f"Reminder: You still owe for '{expense_description}'",
            data={"type": "payment_reminder"},
        )

    async def notify_payment_submitted(
        self, leader_id: uuid.UUID, payer_name: str, expense_description: str
    ) -> None:
        await self.send_to_user(
            leader_id,
            title="Payment Submitted",
            body=f"{payer_name} submitted payment for '{expense_description}'",
            data={"type": "payment_submitted"},
        )

    async def notify_payment_accepted(
        self, user_id: uuid.UUID, expense_description: str
    ) -> None:
        await self.send_to_user(
            user_id,
            title="Payment Accepted",
            body=f"Your payment for '{expense_description}' was accepted",
            data={"type": "payment_accepted"},
        )

    async def notify_payment_rejected(
        self, user_id: uuid.UUID, expense_description: str
    ) -> None:
        await self.send_to_user(
            user_id,
            title="Payment Rejected",
            body=f"Your payment for '{expense_description}' was rejected. Please resubmit.",
            data={"type": "payment_rejected"},
        )

    async def notify_expense_ready_to_close(
        self, leader_id: uuid.UUID, expense_description: str
    ) -> None:
        await self.send_to_user(
            leader_id,
            title="Expense Ready to Close",
            body=f"All payments received for '{expense_description}'. You can close it now.",
            data={"type": "expense_ready_to_close"},
        )

    async def notify_expense_closed(
        self, user_ids: list[uuid.UUID], expense_description: str
    ) -> None:
        await self.send_to_users(
            user_ids,
            title="Expense Closed",
            body=f"Expense '{expense_description}' has been closed",
            data={"type": "expense_closed"},
        )

    async def notify_deadline_extended(
        self, user_ids: list[uuid.UUID], expense_description: str
    ) -> None:
        await self.send_to_users(
            user_ids,
            title="Deadline Extended",
            body=f"The deadline for '{expense_description}' has been extended",
            data={"type": "deadline_extended"},
        )

    async def notify_group_invitation(
        self, user_id: uuid.UUID, group_name: str, inviter_name: str
    ) -> None:
        await self.send_to_user(
            user_id,
            title="Group Invitation",
            body=f"{inviter_name} invited you to join '{group_name}'",
            data={"type": "group_invitation"},
        )
