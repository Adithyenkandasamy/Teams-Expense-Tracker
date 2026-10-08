"""User model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Application user linked to a Firebase UID."""

    __tablename__ = "users"

    firebase_uid: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    upi_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    upi_qr_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    profile_image: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Relationships
    group_memberships = relationship("GroupMember", back_populates="user", lazy="selectin")
    device_tokens = relationship("DeviceToken", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
