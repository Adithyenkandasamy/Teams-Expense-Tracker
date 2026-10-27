"""Group service — business logic for group operations."""

import secrets
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, noload, selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.enums import GroupRole
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import GroupCreate


def _generate_invite_code() -> str:
    """Generate a URL-safe invite code."""
    return secrets.token_urlsafe(8)[:12].upper()


class GroupService:
    """Handles group-related business logic."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_group(self, data: GroupCreate, creator: User) -> Group:
        """Create a new group and add the creator as OWNER."""
        group = Group(
            name=data.name,
            description=data.description,
            invite_code=_generate_invite_code(),
            created_by=creator.id,
        )
        self.db.add(group)
        await self.db.flush()

        # Add creator as OWNER
        member = GroupMember(
            group_id=group.id,
            user_id=creator.id,
            role=GroupRole.OWNER.value,
        )
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(group)
        return group

    async def get_group_by_id(self, group_id: uuid.UUID) -> Group:
        """Get a group by ID or raise NotFoundError."""
        result = await self.db.execute(
            select(Group)
            .options(
                noload(Group.members),
                noload(Group.creator),
                noload(Group.group_leader),
                noload(Group.expenses),
            )
            .where(Group.id == group_id)
        )
        group = result.scalar_one_or_none()
        if group is None:
            raise NotFoundError("Group not found")
        return group

    async def get_user_groups(self, user: User) -> list[Group]:
        """Get all groups the user is a member of."""
        result = await self.db.execute(
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == user.id)
        )
        return list(result.scalars().all())

    async def get_user_groups_with_counts(self, user: User) -> list[tuple[Group, int]]:
        """Get a user's groups and member counts without loading member objects."""
        user_membership = aliased(GroupMember)
        result = await self.db.execute(
            select(Group, func.count(GroupMember.id))
            .join(user_membership, user_membership.group_id == Group.id)
            .outerjoin(GroupMember, GroupMember.group_id == Group.id)
            .where(user_membership.user_id == user.id)
            .group_by(Group.id)
            .options(
                noload(Group.members),
                noload(Group.creator),
                noload(Group.group_leader),
                noload(Group.expenses),
            )
        )
        return [(group, member_count) for group, member_count in result.all()]

    async def join_group(self, invite_code: str, user: User) -> GroupMember:
        """Join a group using an invite code."""
        result = await self.db.execute(
            select(Group)
            .options(
                noload(Group.members),
                noload(Group.creator),
                noload(Group.group_leader),
                noload(Group.expenses),
            )
            .where(Group.invite_code == invite_code)
        )
        group = result.scalar_one_or_none()
        if group is None:
            raise NotFoundError("Invalid invite code")

        # Check if already a member
        existing = await self.db.execute(
            select(GroupMember)
            .options(noload(GroupMember.group), noload(GroupMember.user))
            .where(
                GroupMember.group_id == group.id,
                GroupMember.user_id == user.id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ConflictError("You are already a member of this group")

        member = GroupMember(
            group_id=group.id,
            user_id=user.id,
            role=GroupRole.MEMBER.value,
        )
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def get_group_members(self, group_id: uuid.UUID) -> list[GroupMember]:
        """Get all members of a group."""
        result = await self.db.execute(
            select(GroupMember)
            .options(
                noload(GroupMember.group),
                selectinload(GroupMember.user).options(
                    noload(User.group_memberships), noload(User.device_tokens)
                ),
            )
            .where(GroupMember.group_id == group_id)
        )
        return list(result.scalars().all())

    async def verify_membership(self, group_id: uuid.UUID, user_id: uuid.UUID) -> GroupMember:
        """Verify user is a member of the group, or raise ForbiddenError."""
        result = await self.db.execute(
            select(GroupMember)
            .options(noload(GroupMember.group), noload(GroupMember.user))
            .where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
            )
        )
        member = result.scalar_one_or_none()
        if member is None:
            raise ForbiddenError("You are not a member of this group")
        return member
