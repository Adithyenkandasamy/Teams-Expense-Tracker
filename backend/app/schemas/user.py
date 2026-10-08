"""User schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """User data returned in API responses."""

    id: uuid.UUID
    firebase_uid: str
    name: str
    email: str
    phone: str | None = None
    upi_id: str | None = None
    upi_qr_url: str | None = None
    profile_image: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Fields a user can update on their own profile."""

    name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=20)
    upi_id: str | None = Field(None, max_length=255)
    upi_qr_url: str | None = Field(None, max_length=512)
    profile_image: str | None = Field(None, max_length=512)
