"""Split/payment routes."""

import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cloudinary import upload_image
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.expense import ExpenseSplitResponse, PaymentAction
from app.services.expense_service import ExpenseService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/splits", tags=["splits"])


@router.post("/{split_id}/payment", response_model=ExpenseSplitResponse)
async def submit_payment(
    split_id: uuid.UUID,
    file: UploadFile | None = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseSplitResponse:
    """Submit payment confirmation for a split, with optional proof image."""
    image_url: str | None = None
    cloudinary_public_id: str | None = None

    if file is not None:
        file_data = await file.read()
        result = upload_image(file_data, folder="payment_proofs")
        image_url = result["secure_url"]
        cloudinary_public_id = result["public_id"]

    expense_service = ExpenseService(db)
    split = await expense_service.submit_payment(
        split_id=split_id,
        user=current_user,
        image_url=image_url,
        cloudinary_public_id=cloudinary_public_id,
    )

    # Notify the expense leader
    expense = await expense_service.get_expense_by_id(split.expense_id)
    notification_service = NotificationService(db)
    await notification_service.notify_payment_submitted(
        leader_id=expense.created_by,
        payer_name=current_user.name,
        expense_description=expense.description,
    )

    return ExpenseSplitResponse.model_validate(split)


@router.post("/{split_id}/approve", response_model=ExpenseSplitResponse)
async def approve_payment(
    split_id: uuid.UUID,
    data: PaymentAction | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseSplitResponse:
    """Approve a submitted payment. Only the expense leader can approve."""
    expense_service = ExpenseService(db)
    split = await expense_service.approve_payment(split_id, current_user)

    # Notify the split owner
    expense = await expense_service.get_expense_by_id(split.expense_id)
    notification_service = NotificationService(db)
    await notification_service.notify_payment_accepted(
        user_id=split.user_id,
        expense_description=expense.description,
    )

    # If expense is now READY_TO_CLOSE, notify leader
    from app.models.enums import ExpenseStatus

    if expense.status == ExpenseStatus.READY_TO_CLOSE.value:
        await notification_service.notify_expense_ready_to_close(
            leader_id=expense.created_by,
            expense_description=expense.description,
        )

    return ExpenseSplitResponse.model_validate(split)


@router.post("/{split_id}/reject", response_model=ExpenseSplitResponse)
async def reject_payment(
    split_id: uuid.UUID,
    data: PaymentAction | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseSplitResponse:
    """Reject a submitted payment. Only the expense leader can reject."""
    expense_service = ExpenseService(db)
    split = await expense_service.reject_payment(split_id, current_user)

    # Notify the split owner
    expense = await expense_service.get_expense_by_id(split.expense_id)
    notification_service = NotificationService(db)
    await notification_service.notify_payment_rejected(
        user_id=split.user_id,
        expense_description=expense.description,
    )

    return ExpenseSplitResponse.model_validate(split)
