"""Async CRUD endpoints for private savings targets."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.savings_target import SavingsTarget
from app.models.user import User
from app.schemas.savings_target import (
    SavingsTargetCreate,
    SavingsTargetResponse,
    SavingsTargetUpdate,
)

router = APIRouter(prefix="/savings-targets", tags=["savings targets"])


@router.get("", response_model=list[SavingsTargetResponse])
async def list_savings_targets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SavingsTargetResponse]:
    """Return all savings targets owned by the authenticated user."""
    result = await db.execute(
        select(SavingsTarget)
        .where(SavingsTarget.user_id == current_user.id)
        .order_by(SavingsTarget.created_at.desc())
    )
    return [SavingsTargetResponse.model_validate(target) for target in result.scalars()]


@router.post("", response_model=SavingsTargetResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_target(
    data: SavingsTargetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavingsTargetResponse:
    """Create a savings target that belongs to the authenticated user."""
    target = SavingsTarget(
        user_id=current_user.id,
        name=data.name.strip(),
        target_amount=data.target_amount,
        saved_amount=data.saved_amount,
    )
    db.add(target)
    await db.flush()
    await db.refresh(target)
    return SavingsTargetResponse.model_validate(target)


@router.patch("/{target_id}", response_model=SavingsTargetResponse)
async def update_savings_target(
    target_id: uuid.UUID,
    data: SavingsTargetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavingsTargetResponse:
    """Update fields on one savings target owned by the authenticated user."""
    result = await db.execute(
        select(SavingsTarget).where(
            SavingsTarget.id == target_id,
            SavingsTarget.user_id == current_user.id,
        )
    )
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings target not found")

    for field_name, value in data.model_dump(exclude_unset=True).items():
        if field_name == "name" and value is not None:
            value = value.strip()
        setattr(target, field_name, value)
    await db.flush()
    await db.refresh(target)
    return SavingsTargetResponse.model_validate(target)


@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_target(
    target_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete one savings target owned by the authenticated user."""
    result = await db.execute(
        select(SavingsTarget).where(
            SavingsTarget.id == target_id,
            SavingsTarget.user_id == current_user.id,
        )
    )
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings target not found")
    await db.delete(target)
