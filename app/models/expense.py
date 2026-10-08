"""Expense, ExpenseSplit, PaymentProof, and DeadlineHistory models."""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ExpenseStatus, PaymentStatus


class Expense(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A shared expense within a group."""

    __tablename__ = "expenses"

    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    paid_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=2), nullable=False
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Deadline fields
    initial_deadline: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    current_deadline: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    next_reminder_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ExpenseStatus.ACTIVE.value
    )

    # Receipt
    receipt_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cloudinary_public_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Closing
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    receipt_delete_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    group = relationship("Group", back_populates="expenses", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    payer = relationship("User", foreign_keys=[paid_by], lazy="selectin")
    splits = relationship("ExpenseSplit", back_populates="expense", lazy="selectin")
    deadline_history = relationship(
        "DeadlineHistory", back_populates="expense", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Expense {self.description} amount={self.amount}>"


class ExpenseSplit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An individual user's share of an expense."""

    __tablename__ = "expense_splits"

    expense_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=2), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=PaymentStatus.PENDING.value
    )
    payment_submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    expense = relationship("Expense", back_populates="splits", lazy="selectin")
    user = relationship("User", lazy="selectin")
    payment_proofs = relationship(
        "PaymentProof", back_populates="expense_split", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<ExpenseSplit user={self.user_id} amount={self.amount}>"


class PaymentProof(UUIDPrimaryKeyMixin, Base):
    """Proof of payment uploaded by a user."""

    __tablename__ = "payment_proofs"

    expense_split_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("expense_splits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    cloudinary_public_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    expense_split = relationship(
        "ExpenseSplit", back_populates="payment_proofs", lazy="selectin"
    )
    uploader = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<PaymentProof split={self.expense_split_id}>"


class DeadlineHistory(UUIDPrimaryKeyMixin, Base):
    """Record of deadline extensions for an expense."""

    __tablename__ = "deadline_history"

    expense_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_deadline: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    new_deadline: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    expense = relationship("Expense", back_populates="deadline_history", lazy="selectin")

    def __repr__(self) -> str:
        return f"<DeadlineHistory expense={self.expense_id}>"
