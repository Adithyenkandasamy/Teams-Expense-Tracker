"""Request and response schemas for personal savings targets."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, model_validator


class SavingsTargetCreate(BaseModel):
    """Fields required to create a savings target for the signed-in user."""

    name: str = Field(min_length=1, max_length=120)
    target_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    saved_amount: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)
    funding_mode: str = Field(default="MANUAL")
    target_date: date | None = None

    @field_validator("name")
    @classmethod
    def require_non_blank_name(cls, value: str) -> str:
        """Trim a target name and reject values containing only whitespace."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Target name cannot be blank")
        return cleaned

    @field_validator("funding_mode")
    @classmethod
    def validate_funding_mode(cls, value: str) -> str:
        value = value.upper()
        if value not in {"MANUAL", "WALLET"}:
            raise ValueError("Funding mode must be MANUAL or WALLET")
        if value == "WALLET":
            raise ValueError("Wallet-linked targets are unavailable until a wallet is configured")
        return value

    @field_validator("target_date")
    @classmethod
    def require_future_date(cls, value: date | None) -> date | None:
        if value is not None and value < date.today():
            raise ValueError("Target date must be today or in the future")
        return value


class SavingsTargetUpdate(BaseModel):
    """Optional fields that can be updated on an owned savings target."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    target_amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    saved_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    target_date: date | None = None

    @field_validator("name")
    @classmethod
    def require_non_blank_name(cls, value: str | None) -> str | None:
        """Trim an updated name and reject values containing only whitespace."""
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Target name cannot be blank")
        return cleaned

    @field_validator("target_date")
    @classmethod
    def require_future_date(cls, value: date | None) -> date | None:
        if value is not None and value < date.today():
            raise ValueError("Target date must be today or in the future")
        return value

    @model_validator(mode="after")
    def require_an_update(self) -> "SavingsTargetUpdate":
        """Reject empty PATCH requests so accidental no-op updates are visible."""
        if not self.model_fields_set:
            raise ValueError("At least one savings target field must be provided")
        if any(getattr(self, field_name) is None for field_name in self.model_fields_set):
            raise ValueError("Savings target fields cannot be null")
        return self


class SavingsTargetResponse(BaseModel):
    """Savings target fields returned to its owner."""

    id: uuid.UUID
    name: str
    target_amount: Decimal
    saved_amount: Decimal
    funding_mode: str
    target_date: date | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SavingsTargetEntryCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    note: str | None = Field(default=None, max_length=255)


class SavingsTargetEntryResponse(BaseModel):
    id: uuid.UUID
    target_id: uuid.UUID
    entry_type: str
    amount: Decimal
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SavingsTargetSummary(BaseModel):
    total_saved: Decimal
    active_targets: int
    completed_targets: int
    total_remaining: Decimal
