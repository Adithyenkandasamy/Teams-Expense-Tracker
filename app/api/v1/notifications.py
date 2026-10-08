"""Notification/device-token routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.balance import DeviceTokenCreate
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/device-token", status_code=201)
async def register_device_token(
    data: DeviceTokenCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Register an FCM device token for push notifications."""
    service = NotificationService(db)
    token = await service.register_device_token(current_user.id, data)
    return {"message": "Device token registered", "id": str(token.id)}
