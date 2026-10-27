"""Schemas for personal expense tracking."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PersonalExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str = Field(min_length=1, max_length=255)
    category: str = Field(default="Other", min_length=1, max_length=100)
    spent_at: datetime | None = None


class PersonalExpenseResponse(BaseModel):
    id: uuid.UUID
    amount: Decimal
    description: str
    category: str
    spent_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
