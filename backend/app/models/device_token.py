"""DeviceToken model for FCM push notifications."""

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DeviceToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """FCM device token for a user's device."""

    __tablename__ = "device_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    device_type: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Relationships
    user = relationship("User", back_populates="device_tokens", lazy="selectin")

    def __repr__(self) -> str:
        return f"<DeviceToken user={self.user_id}>"
