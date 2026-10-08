"""Balance routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.balance import GroupBalanceResponse
from app.services.balance_service import BalanceService
from app.services.group_service import GroupService

router = APIRouter(tags=["balances"])


@router.get(
    "/groups/{group_id}/balances",
    response_model=GroupBalanceResponse,
)
async def get_group_balances(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GroupBalanceResponse:
    """Get balance summary for the current user within a group."""
    # Verify membership
    group_service = GroupService(db)
    await group_service.verify_membership(group_id, current_user.id)

    balance_service = BalanceService(db)
    return await balance_service.get_group_balances(group_id, current_user)
