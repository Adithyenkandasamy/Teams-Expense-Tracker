"""Tests for split payment submission, leader approval, rejection, and expense closure."""


import pytest
from httpx import AsyncClient

from app.models.enums import ExpenseStatus, PaymentStatus
from app.models.expense import Expense
from app.models.user import User


@pytest.mark.asyncio
async def test_submit_payment_and_leader_approve_and_close(
    client_alice: AsyncClient,
    client_bob: AsyncClient,
    test_expense: Expense,
    user_alice: User,
    user_bob: User,
):
    """Test full payment cycle:

    1. Bob submits payment confirmation for his split.
    2. Bob cannot approve his own payment (only expense leader Alice can approve).
    3. Expense leader (Alice) approves Bob's payment.
    4. Expense leader (Alice) approves her own split if needed, making all splits PAID.
    5. Expense reaches READY_TO_CLOSE.
    6. Non-leader (Bob) tries to close expense -> 403 Forbidden.
    7. Expense leader (Alice) closes expense -> CLOSED.
    """
    # Find Bob's split and Alice's split
    bob_split = next(s for s in test_expense.splits if s.user_id == user_bob.id)
    alice_split = next(s for s in test_expense.splits if s.user_id == user_alice.id)

    # 1. Bob submits payment
    response = await client_bob.post(f"/api/v1/splits/{bob_split.id}/payment")
    assert response.status_code == 200
    assert response.json()["status"] == PaymentStatus.PAYMENT_SUBMITTED.value

    # 2. Bob (non-leader) tries to approve the payment -> 403 Forbidden
    response = await client_bob.post(f"/api/v1/splits/{bob_split.id}/approve")
    assert response.status_code == 403

    # 3. Alice (the expense leader) approves Bob's payment
    response = await client_alice.post(f"/api/v1/splits/{bob_split.id}/approve")
    assert response.status_code == 200
    assert response.json()["status"] == PaymentStatus.PAID.value

    # 4. Settle Alice's split as well so all splits become PAID
    # Alice submits and approves her own split
    await client_alice.post(f"/api/v1/splits/{alice_split.id}/payment")
    response = await client_alice.post(f"/api/v1/splits/{alice_split.id}/approve")
    assert response.status_code == 200

    # 5. Check expense details - should be READY_TO_CLOSE
    response = await client_alice.get(f"/api/v1/expenses/{test_expense.id}")
    assert response.status_code == 200
    assert response.json()["status"] == ExpenseStatus.READY_TO_CLOSE.value

    # 6. Non-leader Bob tries to close expense -> 403 Forbidden
    response = await client_bob.post(f"/api/v1/expenses/{test_expense.id}/close")
    assert response.status_code == 403

    # 7. Expense leader Alice closes the expense
    response = await client_alice.post(f"/api/v1/expenses/{test_expense.id}/close")
    assert response.status_code == 200
    assert response.json()["status"] == ExpenseStatus.CLOSED.value
    assert response.json()["closed_at"] is not None


@pytest.mark.asyncio
async def test_leader_reject_payment_allows_resubmission(
    client_alice: AsyncClient,
    client_bob: AsyncClient,
    test_expense: Expense,
    user_bob: User,
):
    """Expense leader rejects payment proof, allowing user to resubmit."""
    bob_split = next(s for s in test_expense.splits if s.user_id == user_bob.id)

    # Bob submits payment
    response = await client_bob.post(f"/api/v1/splits/{bob_split.id}/payment")
    assert response.status_code == 200

    # Alice (expense leader) rejects payment
    response = await client_alice.post(f"/api/v1/splits/{bob_split.id}/reject")
    assert response.status_code == 200
    assert response.json()["status"] == PaymentStatus.REJECTED.value

    # Bob can re-submit payment after rejection
    response = await client_bob.post(f"/api/v1/splits/{bob_split.id}/payment")
    assert response.status_code == 200
    assert response.json()["status"] == PaymentStatus.PAYMENT_SUBMITTED.value
