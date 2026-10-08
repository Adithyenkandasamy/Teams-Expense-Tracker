"""Tests for Cloudinary receipt upload/delete and FCM NotificationService."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cloudinary import delete_image, upload_image
from app.models.device_token import DeviceToken
from app.models.expense import Expense
from app.models.user import User
from app.services.notification_service import NotificationService


@pytest.mark.asyncio
async def test_fcm_notification_service_sends_to_device_tokens(
    db_session: AsyncSession,
    user_alice: User,
):
    """Notification service finds device tokens and sends notifications via Firebase messaging."""
    # Register a token for Alice
    token = DeviceToken(
        user_id=user_alice.id,
        token="fcm_fake_device_token_xyz",
        device_type="android",
    )
    db_session.add(token)
    await db_session.flush()

    service = NotificationService(db_session)

    with patch("app.services.notification_service.send_fcm_multicast") as mock_send:
        mock_send.return_value = MagicMock(success_count=1)
        await service.send_to_users(
            user_ids=[user_alice.id],
            title="Test Title",
            body="Test Body",
            data={"type": "TEST"},
        )
        assert mock_send.called
        sent_message = mock_send.call_args[0][0]
        assert "fcm_fake_device_token_xyz" in sent_message.tokens


@pytest.mark.asyncio
async def test_fcm_notification_methods(
    db_session: AsyncSession,
    user_bob: User,
):
    """Test notification service convenience helper methods."""
    service = NotificationService(db_session)

    with patch.object(service, "send_to_users", return_value=1) as mock_send:
        await service.notify_new_expense([user_bob.id], "Dinner", "500")
        assert mock_send.called

        await service.notify_payment_submitted(user_bob.id, "Alice", "Dinner")
        assert mock_send.called

        await service.notify_payment_accepted(user_bob.id, "Dinner")
        assert mock_send.called

        await service.notify_payment_rejected(user_bob.id, "Dinner")
        assert mock_send.called

        await service.notify_expense_ready_to_close(user_bob.id, "Dinner")
        assert mock_send.called

        await service.notify_expense_closed([user_bob.id], "Dinner")
        assert mock_send.called


def test_cloudinary_upload_and_delete_helpers():
    """Verify Cloudinary upload and delete wrapper functions."""
    with patch("cloudinary.uploader.upload") as mock_up, patch(
        "cloudinary.uploader.destroy"
    ) as mock_destroy:
        mock_up.return_value = {
            "secure_url": "https://res.cloudinary.com/demo/image.png",
            "public_id": "test_folder/sample",
        }
        mock_destroy.return_value = {"result": "ok"}

        result = upload_image(b"fake_image_bytes", folder="receipts")
        assert result["secure_url"] == "https://res.cloudinary.com/demo/image.png"
        assert result["public_id"] == "test_folder/sample"

        deleted = delete_image("test_folder/sample")
        assert deleted is True


@pytest.mark.asyncio
async def test_upload_receipt_endpoint(
    client_alice: AsyncClient,
    test_expense: Expense,
):
    """Expense leader can upload a receipt image for their expense."""
    fake_image_bytes = b"fake-jpg-content"

    with patch(
        "app.api.v1.expenses.upload_image",
        return_value={
            "secure_url": "https://res.cloudinary.com/demo/receipt_abc.jpg",
            "public_id": "receipts/receipt_abc",
        },
    ):
        response = await client_alice.post(
            f"/api/v1/expenses/{test_expense.id}/receipt",
            files={"file": ("receipt.jpg", fake_image_bytes, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["receipt_url"] == "https://res.cloudinary.com/demo/receipt_abc.jpg"
