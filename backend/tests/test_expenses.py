"""Tests for expense creation, listing, validation, and lifecycle."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.models.enums import ExpenseStatus, PaymentStatus
from app.models.group import Group
from app.models.user import User


@pytest.mark.asyncio
async def test_member_can_post_expense_and_becomes_leader(
    client_bob: AsyncClient,
    group_with_bob: Group,
    user_alice: User,
    user_bob: User,
):
    """Any group member (like Bob who is a MEMBER, not group OWNER) can post an expense

    and Bob becomes the expense creator (leader). Bob's own split is marked PAID,
    while Alice's split is PENDING.
    """
    deadline = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    response = await client_bob.post(
        f"/api/v1/groups/{group_with_bob.id}/expenses",
        json={
            "amount": "99.99",
            "description": "WiFi bill",
            "category": "Utilities",
            "paid_by": str(user_bob.id),
            "split_between": [str(user_alice.id), str(user_bob.id)],
            "deadline": deadline,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "WiFi bill"
    assert data["created_by"] == str(user_bob.id)  # Bob is the expense leader!
    assert data["paid_by"] == str(user_bob.id)
    assert data["status"] == ExpenseStatus.ACTIVE.value
    assert len(data["splits"]) == 2

    # Verify leader Bob's split is automatically PAID, and Alice's is PENDING
    splits_by_user = {s["user_id"]: s for s in data["splits"]}
    assert splits_by_user[str(user_bob.id)]["status"] == PaymentStatus.PAID.value
    assert splits_by_user[str(user_bob.id)]["paid_at"] is not None
    assert splits_by_user[str(user_alice.id)]["status"] == PaymentStatus.PENDING.value

    # Check penny-exact split: 99.99 / 2 = 50.00 and 49.99
    split_amounts = [Decimal(s["amount"]) for s in data["splits"]]
    assert sum(split_amounts) == Decimal("99.99")


@pytest.mark.asyncio
async def test_creator_must_equal_paid_by(
    client_alice: AsyncClient,
    group_with_bob: Group,
    user_alice: User,
    user_bob: User,
):
    """Creating an expense where created_by != paid_by must be rejected with 400."""
    deadline = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    # Alice is calling the API (created_by = Alice), but sets paid_by = Bob
    response = await client_alice.post(
        f"/api/v1/groups/{group_with_bob.id}/expenses",
        json={
            "amount": "100.00",
            "description": "Dinner",
            "paid_by": str(user_bob.id),
            "split_between": [str(user_alice.id), str(user_bob.id)],
            "deadline": deadline,
        },
    )
    assert response.status_code == 400
    assert "created_by == paid_by" in response.json()["detail"]


@pytest.mark.asyncio
async def test_different_users_create_different_expense_leaders(
    client_alice: AsyncClient,
    client_bob: AsyncClient,
    group_with_bob: Group,
    user_alice: User,
    user_bob: User,
):
    """Alice creates expense A (Alice is leader), Bob creates expense B (Bob is leader)."""
    deadline = (datetime.now(UTC) + timedelta(days=2)).isoformat()

    # Alice creates Expense A
    res_a = await client_alice.post(
        f"/api/v1/groups/{group_with_bob.id}/expenses",
        json={
            "amount": "240.00",
            "description": "Snacks",
            "paid_by": str(user_alice.id),
            "split_between": [str(user_alice.id), str(user_bob.id)],
            "deadline": deadline,
        },
    )
    assert res_a.status_code == 201
    assert res_a.json()["created_by"] == str(user_alice.id)

    # Bob creates Expense B
    res_b = await client_bob.post(
        f"/api/v1/groups/{group_with_bob.id}/expenses",
        json={
            "amount": "800.00",
            "description": "Pizza",
            "paid_by": str(user_bob.id),
            "split_between": [str(user_alice.id), str(user_bob.id)],
            "deadline": deadline,
        },
    )
    assert res_b.status_code == 201
    assert res_b.json()["created_by"] == str(user_bob.id)


@pytest.mark.asyncio
async def test_non_member_cannot_post_expense(
    client_charlie: AsyncClient,
    group_with_bob: Group,
    user_charlie: User,
):
    """A user who is not a member of the group cannot post an expense."""
    deadline = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    response = await client_charlie.post(
        f"/api/v1/groups/{group_with_bob.id}/expenses",
        json={
            "amount": "50.00",
            "description": "Snacks",
            "paid_by": str(user_charlie.id),
            "split_between": [str(user_charlie.id)],
            "deadline": deadline,
        },
    )
    assert response.status_code in (403, 404)


@pytest.mark.asyncio
async def test_unauthorized_expense_access(
    client_charlie: AsyncClient,
    test_expense,
):
    """A non-group member cannot view expenses from that group."""
    response = await client_charlie.get(f"/api/v1/expenses/{test_expense.id}")
    assert response.status_code in (403, 404)


@pytest.mark.asyncio
async def test_list_group_expenses(
    client_alice: AsyncClient,
    group_with_bob: Group,
    test_expense,
):
    """Group members can list all expenses in the group."""
    response = await client_alice.get(
        f"/api/v1/groups/{group_with_bob.id}/expenses"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(e["id"] == str(test_expense.id) for e in data)
