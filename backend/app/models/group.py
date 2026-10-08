"""Group and GroupMember models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import GroupRole


class Group(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A group of roommates sharing expenses."""

    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    invite_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    leader_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Relationships
    members = relationship("GroupMember", back_populates="group", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    group_leader = relationship("User", foreign_keys=[leader_id], lazy="selectin")
    expenses = relationship("Expense", back_populates="group", lazy="select")

    def __repr__(self) -> str:
        return f"<Group {self.name}>"


class GroupMember(UUIDPrimaryKeyMixin, Base):
    """Association between a user and a group."""

    __tablename__ = "group_members"

    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default=GroupRole.MEMBER.value
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )

    # Relationships
    group = relationship("Group", back_populates="members", lazy="selectin")
    user = relationship("User", back_populates="group_memberships", lazy="selectin")

    def __repr__(self) -> str:
        return f"<GroupMember group={self.group_id} user={self.user_id}>"
