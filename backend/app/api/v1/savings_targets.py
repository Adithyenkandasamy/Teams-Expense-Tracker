"""Authenticated savings target and contribution endpoints."""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.savings_target import SavingsTarget, SavingsTargetEntry
from app.models.user import User
from app.schemas.savings_target import (
    SavingsTargetCreate,
    SavingsTargetEntryCreate,
    SavingsTargetEntryResponse,
    SavingsTargetResponse,
    SavingsTargetSummary,
    SavingsTargetUpdate,
)

router = APIRouter(prefix="/savings-targets", tags=["savings targets"])


async def _get_owned_target(
    target_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession, *, lock: bool = False
) -> SavingsTarget:
    query = select(SavingsTarget).where(
        SavingsTarget.id == target_id, SavingsTarget.user_id == user_id
    )
    if lock:
        query = query.with_for_update()
    target = (await db.execute(query)).scalar_one_or_none()
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Savings target not found"
        )
    return target


@router.get("", response_model=list[SavingsTargetResponse])
async def list_savings_targets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SavingsTargetResponse]:
    result = await db.execute(
        select(SavingsTarget)
        .where(SavingsTarget.user_id == current_user.id)
        .order_by(SavingsTarget.created_at.desc())
    )
    return [SavingsTargetResponse.model_validate(target) for target in result.scalars()]


@router.get("/summary", response_model=SavingsTargetSummary)
async def savings_target_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavingsTargetSummary:
    result = await db.execute(
        select(SavingsTarget).where(SavingsTarget.user_id == current_user.id)
    )
    targets = list(result.scalars())
    active = [target for target in targets if target.status == "ACTIVE"]
    return SavingsTargetSummary(
        total_saved=sum((target.saved_amount for target in active), Decimal("0.00")),
        active_targets=len(active),
        completed_targets=sum(target.status == "COMPLETED" for target in targets),
        total_remaining=sum(
            (max(target.target_amount - target.saved_amount, Decimal("0.00")) for target in active),
            Decimal("0.00"),
        ),
    )


@router.post("", response_model=SavingsTargetResponse, status_code=status.HTTP_201_CREATED)
async def create_savings_target(
    data: SavingsTargetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavingsTargetResponse:
    target = SavingsTarget(
        user_id=current_user.id,
        name=data.name,
        target_amount=data.target_amount,
        saved_amount=data.saved_amount,
        funding_mode=data.funding_mode,
        target_date=data.target_date,
        status="COMPLETED" if data.saved_amount >= data.target_amount else "ACTIVE",
    )
    db.add(target)
    await db.flush()
    if data.saved_amount:
        db.add(
            SavingsTargetEntry(
                target_id=target.id,
                user_id=current_user.id,
                entry_type="INITIAL",
                amount=data.saved_amount,
            )
        )
    await db.refresh(target)
    return SavingsTargetResponse.model_validate(target)


@router.patch("/{target_id}", response_model=SavingsTargetResponse)
async def update_savings_target(
    target_id: uuid.UUID,
    data: SavingsTargetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavingsTargetResponse:
    target = await _get_owned_target(target_id, current_user.id, db, lock=True)
    changes = data.model_dump(exclude_unset=True)
    saved_amount = changes.pop("saved_amount", None)
    if saved_amount is not None and saved_amount != target.saved_amount:
        delta = saved_amount - target.saved_amount
        db.add(
            SavingsTargetEntry(
                target_id=target.id,
                user_id=current_user.id,
                entry_type="ADJUSTMENT",
                amount=delta,
                note="Legacy saved amount adjustment",
            )
        )
        target.saved_amount = saved_amount
    for field_name, value in changes.items():
        setattr(target, field_name, value)
    if target.saved_amount >= target.target_amount:
        target.status = "COMPLETED"
    elif target.status == "COMPLETED":
        target.status = "ACTIVE"
    await db.flush()
    await db.refresh(target)
    return SavingsTargetResponse.model_validate(target)


@router.post("/{target_id}/contributions", response_model=SavingsTargetResponse)
async def add_manual_contribution(
    target_id: uuid.UUID,
    data: SavingsTargetEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavingsTargetResponse:
    target = await _get_owned_target(target_id, current_user.id, db, lock=True)
    if target.funding_mode != "MANUAL":
        raise HTTPException(
            status_code=400, detail="Wallet-linked targets require a wallet allocation"
        )
    target.saved_amount += data.amount
    target.status = "COMPLETED" if target.saved_amount >= target.target_amount else "ACTIVE"
    db.add(
        SavingsTargetEntry(
            target_id=target.id,
            user_id=current_user.id,
            entry_type="CONTRIBUTION",
            amount=data.amount,
            note=data.note,
        )
    )
    await db.flush()
    await db.refresh(target)
    return SavingsTargetResponse.model_validate(target)


@router.get("/{target_id}/history", response_model=list[SavingsTargetEntryResponse])
async def target_history(
    target_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SavingsTargetEntryResponse]:
    await _get_owned_target(target_id, current_user.id, db)
    result = await db.execute(
        select(SavingsTargetEntry)
        .where(
            SavingsTargetEntry.target_id == target_id,
            SavingsTargetEntry.user_id == current_user.id,
        )
        .order_by(SavingsTargetEntry.created_at.desc())
    )
    return [SavingsTargetEntryResponse.model_validate(entry) for entry in result.scalars()]


@router.post("/{target_id}/archive", response_model=SavingsTargetResponse)
async def archive_savings_target(
    target_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavingsTargetResponse:
    target = await _get_owned_target(target_id, current_user.id, db, lock=True)
    target.status = "ARCHIVED"
    await db.flush()
    await db.refresh(target)
    return SavingsTargetResponse.model_validate(target)


@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_target(
    target_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    target = await _get_owned_target(target_id, current_user.id, db, lock=True)
    if target.funding_mode == "WALLET":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Archive wallet-linked targets after releasing their allocation",
        )
    await db.delete(target)
