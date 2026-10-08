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
    4. Since Alice's split was already PAID as the leader, all splits are now PAID.
    5. Expense reaches READY_TO_CLOSE.
    6. Non-leader (Bob) tries to close expense -> 403 Forbidden.
    7. Expense leader (Alice) closes expense -> CLOSED.
    """
    bob_split = next(s for s in test_expense.splits if s.user_id == user_bob.id)

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

    # 4. Since Alice's split was already PAID as the leader, all splits are now PAID
    # Check expense details - should be READY_TO_CLOSE
    response = await client_alice.get(f"/api/v1/expenses/{test_expense.id}")
    assert response.status_code == 200
    assert response.json()["status"] == ExpenseStatus.READY_TO_CLOSE.value

    # 5. Non-leader Bob tries to close expense -> 403 Forbidden
    response = await client_bob.post(f"/api/v1/expenses/{test_expense.id}/close")
    assert response.status_code == 403

    # 6. Expense leader Alice closes the expense
    response = await client_alice.post(f"/api/v1/expenses/{test_expense.id}/close")
    assert response.status_code == 200
    assert response.json()["status"] == ExpenseStatus.CLOSED.value
    assert response.json()["closed_at"] is not None


@pytest.mark.asyncio
async def test_cannot_close_expense_while_unpaid_splits_exist(
    client_alice: AsyncClient,
    test_expense: Expense,
):
    """Expense leader cannot close an expense while unpaid splits remain."""
    # Bob has not paid yet
    response = await client_alice.post(f"/api/v1/expenses/{test_expense.id}/close")
    assert response.status_code == 400
    assert "not paid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unauthorized_payment_submission(
    client_alice: AsyncClient,
    test_expense: Expense,
    user_bob: User,
):
    """Alice cannot submit payment on behalf of Bob."""
    bob_split = next(s for s in test_expense.splits if s.user_id == user_bob.id)
    response = await client_alice.post(f"/api/v1/splits/{bob_split.id}/payment")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_group_leader_cannot_approve_other_expense(
    client_alice: AsyncClient,
    client_bob: AsyncClient,
    group_with_bob,
    user_alice: User,
    user_bob: User,
):
    """Alice is the group owner/leader. Bob creates an expense and is the expense leader.

    Alice CANNOT approve Bob's expense payments, only Bob can!
    """
    from datetime import UTC, datetime, timedelta

    deadline = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    # Bob creates expense
    exp_res = await client_bob.post(
        f"/api/v1/groups/{group_with_bob.id}/expenses",
        json={
            "amount": "200.00",
            "description": "Bob's Dinner",
            "paid_by": str(user_bob.id),
            "split_between": [str(user_alice.id), str(user_bob.id)],
            "deadline": deadline,
        },
    )
    assert exp_res.status_code == 201
    expense_data = exp_res.json()
    alice_split_id = next(
        s["id"] for s in expense_data["splits"] if s["user_id"] == str(user_alice.id)
    )

    # Alice submits payment for her split
    sub_res = await client_alice.post(f"/api/v1/splits/{alice_split_id}/payment")
    assert sub_res.status_code == 200

    # Group owner Alice tries to approve payment on Bob's expense -> 403 Forbidden!
    appr_res = await client_alice.post(f"/api/v1/splits/{alice_split_id}/approve")
    assert appr_res.status_code == 403

    # Expense leader Bob approves it -> 200 OK!
    bob_appr_res = await client_bob.post(f"/api/v1/splits/{alice_split_id}/approve")
    assert bob_appr_res.status_code == 200


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
