"""Balance and notification schemas."""

import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class BalanceEntry(BaseModel):
    """Balance between two users."""

    user_id: uuid.UUID
    user_name: str
    amount: Decimal  # positive = they owe you, negative = you owe them


class GroupBalanceResponse(BaseModel):
    """Balance summary for a group."""

    group_id: uuid.UUID
    group_name: str
    total_owed_to_you: Decimal
    total_you_owe: Decimal
    net_balance: Decimal
    balances: list[BalanceEntry]


class DeviceTokenCreate(BaseModel):
    """Request body for registering a device token."""

    token: str = Field(min_length=1, max_length=512)
    device_type: str | None = Field(None, max_length=20)
