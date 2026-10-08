"""Tests for expense creation, listing, and lifecycle."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.models.enums import ExpenseStatus
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

    and Bob becomes the expense creator (leader).
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

    # Check penny-exact split: 99.99 / 2 = 50.00 and 49.99
    split_amounts = [Decimal(s["amount"]) for s in data["splits"]]
    assert sum(split_amounts) == Decimal("99.99")


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
    assert data[0]["id"] == str(test_expense.id)
