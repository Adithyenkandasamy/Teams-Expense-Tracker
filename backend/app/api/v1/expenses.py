"""Expense routes."""

import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cloudinary import upload_image
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseResponse
from app.services.expense_service import ExpenseService
from app.services.group_service import GroupService
from app.services.notification_service import NotificationService

router = APIRouter(tags=["expenses"])


@router.post(
    "/groups/{group_id}/expenses",
    response_model=ExpenseResponse,
    status_code=201,
)
async def create_expense(
    group_id: uuid.UUID,
    data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseResponse:
    """Create a new expense in a group."""
    expense_service = ExpenseService(db)
    expense = await expense_service.create_expense(group_id, data, current_user)

    # Send notifications to split users safely
    try:
        notification_service = NotificationService(db)
        await notification_service.notify_new_expense(
            user_ids=data.split_between,
            expense_description=data.description,
            amount=str(data.amount),
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Could not dispatch new expense notification: {e}")

    return ExpenseResponse.model_validate(expense)


@router.get(
    "/groups/{group_id}/expenses",
    response_model=list[ExpenseResponse],
)
async def list_group_expenses(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ExpenseResponse]:
    """List all expenses in a group."""
    group_service = GroupService(db)
    await group_service.verify_membership(group_id, current_user.id)

    expense_service = ExpenseService(db)
    expenses = await expense_service.get_group_expenses(group_id)
    return [ExpenseResponse.model_validate(e) for e in expenses]


@router.get(
    "/expenses/{expense_id}",
    response_model=ExpenseResponse,
)
async def get_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseResponse:
    """Get a specific expense."""
    expense_service = ExpenseService(db)
    expense = await expense_service.get_expense_by_id(expense_id)

    # Verify membership in the expense's group
    group_service = GroupService(db)
    await group_service.verify_membership(expense.group_id, current_user.id)

    return ExpenseResponse.model_validate(expense)


@router.post("/expenses/{expense_id}/close", response_model=ExpenseResponse)
async def close_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseResponse:
    """Close an expense. Only the leader can close, and all splits must be PAID."""
    expense_service = ExpenseService(db)
    expense = await expense_service.close_expense(expense_id, current_user)

    # Notify all split users
    notification_service = NotificationService(db)
    split_user_ids = [s.user_id for s in expense.splits]
    await notification_service.notify_expense_closed(
        user_ids=split_user_ids,
        expense_description=expense.description,
    )

    return ExpenseResponse.model_validate(expense)


@router.post(
    "/expenses/{expense_id}/receipt",
    response_model=ExpenseResponse,
)
async def upload_receipt(
    expense_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseResponse:
    """Upload a receipt image for an expense."""
    expense_service = ExpenseService(db)
    expense = await expense_service.get_expense_by_id(expense_id)

    # Verify membership
    group_service = GroupService(db)
    await group_service.verify_membership(expense.group_id, current_user.id)

    # Upload to Cloudinary
    file_data = await file.read()
    result = upload_image(file_data)

    expense = await expense_service.update_receipt(
        expense_id=expense_id,
        user=current_user,
        receipt_url=result["secure_url"],
        cloudinary_public_id=result["public_id"],
    )
    return ExpenseResponse.model_validate(expense)
