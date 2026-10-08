"""Expense schemas."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.user import UserResponse


class ExpenseCreate(BaseModel):
    """Request body for creating a new expense."""

    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str = Field(min_length=1, max_length=500)
    category: str | None = Field(None, max_length=100)
    paid_by: uuid.UUID
    split_between: list[uuid.UUID] = Field(min_length=1)
    deadline: datetime

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("split_between")
    @classmethod
    def validate_split_users(cls, v: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(v) != len(set(v)):
            raise ValueError("Duplicate users in split_between")
        return v


class ExpenseSplitResponse(BaseModel):
    """An individual split in an expense."""

    id: uuid.UUID
    expense_id: uuid.UUID
    user_id: uuid.UUID
    amount: Decimal
    status: str
    payment_submitted_at: datetime | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    user: UserResponse | None = None

    model_config = {"from_attributes": True}


class ExpenseResponse(BaseModel):
    """Expense data returned in API responses."""

    id: uuid.UUID
    group_id: uuid.UUID
    created_by: uuid.UUID
    paid_by: uuid.UUID
    amount: Decimal
    description: str
    category: str | None = None
    initial_deadline: datetime
    current_deadline: datetime
    next_reminder_at: datetime | None = None
    status: str
    receipt_url: str | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
    splits: list[ExpenseSplitResponse] = []
    creator: UserResponse | None = None
    payer: UserResponse | None = None

    model_config = {"from_attributes": True}


class PaymentSubmission(BaseModel):
    """Request body for submitting payment confirmation."""

    note: str | None = Field(None, max_length=500)


class PaymentAction(BaseModel):
    """Request body for approving/rejecting a payment."""

    note: str | None = Field(None, max_length=500)


class PaymentProofResponse(BaseModel):
    """Payment proof data."""

    id: uuid.UUID
    expense_split_id: uuid.UUID
    uploaded_by: uuid.UUID
    image_url: str
    created_at: datetime

    model_config = {"from_attributes": True}
