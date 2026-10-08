"""Group schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class GroupCreate(BaseModel):
    """Request body for creating a new group."""

    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)


class GroupResponse(BaseModel):
    """Group data returned in API responses."""

    id: uuid.UUID
    name: str
    description: str | None = None
    invite_code: str
    created_by: uuid.UUID
    leader_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    member_count: int | None = None

    model_config = {"from_attributes": True}


class GroupDetailResponse(GroupResponse):
    """Group with members list."""

    members: list["GroupMemberResponse"] = []


class GroupJoin(BaseModel):
    """Request body for joining a group via invite code."""

    invite_code: str = Field(min_length=1, max_length=20)


class GroupMemberResponse(BaseModel):
    """A group member entry."""

    id: uuid.UUID
    group_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    joined_at: datetime
    user: UserResponse | None = None

    model_config = {"from_attributes": True}
