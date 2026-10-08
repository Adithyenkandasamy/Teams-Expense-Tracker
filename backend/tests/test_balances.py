"""Tests for group balances."""

from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.models.expense import Expense
from app.models.group import Group
from app.models.user import User


@pytest.mark.asyncio
async def test_get_group_balances(
    client_alice: AsyncClient,
    client_bob: AsyncClient,
    group_with_bob: Group,
    test_expense: Expense,
    user_alice: User,
    user_bob: User,
):
    """Alice paid ₹100 split 50/50 with Bob.

    Alice should see Bob owes her ₹50.
    Bob should see he owes Alice ₹50.
    """
    # Check Alice's balance
    response_alice = await client_alice.get(
        f"/api/v1/groups/{group_with_bob.id}/balances"
    )
    assert response_alice.status_code == 200
    data_alice = response_alice.json()
    assert Decimal(str(data_alice["total_owed_to_you"])) == Decimal("50.00")
    assert Decimal(str(data_alice["total_you_owe"])) == Decimal("0")
    assert Decimal(str(data_alice["net_balance"])) == Decimal("50.00")

    # Check Bob's balance
    response_bob = await client_bob.get(
        f"/api/v1/groups/{group_with_bob.id}/balances"
    )
    assert response_bob.status_code == 200
    data_bob = response_bob.json()
    assert Decimal(str(data_bob["total_owed_to_you"])) == Decimal("0")
    assert Decimal(str(data_bob["total_you_owe"])) == Decimal("50.00")
    assert Decimal(str(data_bob["net_balance"])) == Decimal("-50.00")
