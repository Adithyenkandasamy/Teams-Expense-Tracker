"""Group routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupDetailResponse,
    GroupJoin,
    GroupMemberResponse,
    GroupResponse,
)
from app.services.group_service import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupResponse, status_code=201)
async def create_group(
    data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GroupResponse:
    """Create a new group."""
    service = GroupService(db)
    group = await service.create_group(data, current_user)
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        invite_code=group.invite_code,
        created_by=group.created_by,
        created_at=group.created_at,
        updated_at=group.updated_at,
        member_count=1,
    )


@router.get("", response_model=list[GroupResponse])
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[GroupResponse]:
    """List all groups the current user belongs to."""
    service = GroupService(db)
    groups = await service.get_user_groups(current_user)
    result = []
    for group in groups:
        result.append(
            GroupResponse(
                id=group.id,
                name=group.name,
                description=group.description,
                invite_code=group.invite_code,
                created_by=group.created_by,
                created_at=group.created_at,
                updated_at=group.updated_at,
                member_count=len(group.members) if group.members else 0,
            )
        )
    return result


@router.get("/{group_id}", response_model=GroupDetailResponse)
async def get_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GroupDetailResponse:
    """Get a specific group with members."""
    service = GroupService(db)
    await service.verify_membership(group_id, current_user.id)
    group = await service.get_group_by_id(group_id)
    members = await service.get_group_members(group_id)
    return GroupDetailResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        invite_code=group.invite_code,
        created_by=group.created_by,
        created_at=group.created_at,
        updated_at=group.updated_at,
        member_count=len(members),
        members=[GroupMemberResponse.model_validate(m) for m in members],
    )


@router.post("/join", response_model=GroupMemberResponse, status_code=200)
async def join_group_by_code(
    data: GroupJoin,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GroupMemberResponse:
    """Join a group using an invite code."""
    service = GroupService(db)
    member = await service.join_group(data.invite_code, current_user)
    return GroupMemberResponse.model_validate(member)


@router.post("/{group_id}/join", response_model=GroupMemberResponse, status_code=201)
async def join_group(
    group_id: uuid.UUID,
    data: GroupJoin,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GroupMemberResponse:
    """Join a group using an invite code."""
    service = GroupService(db)
    member = await service.join_group(data.invite_code, current_user)
    return GroupMemberResponse.model_validate(member)


@router.get("/{group_id}/members", response_model=list[GroupMemberResponse])
async def list_group_members(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[GroupMemberResponse]:
    """List all members of a group."""
    service = GroupService(db)
    await service.verify_membership(group_id, current_user.id)
    members = await service.get_group_members(group_id)
    return [GroupMemberResponse.model_validate(m) for m in members]
