"""Tests for group management."""

import pytest
from httpx import AsyncClient

from app.models.enums import GroupRole
from app.models.group import Group
from app.models.user import User


@pytest.mark.asyncio
async def test_create_group(client_alice: AsyncClient):
    """Authenticated user should be able to create a group and become OWNER."""
    response = await client_alice.post(
        "/api/v1/groups",
        json={"name": "Baker Street Apt", "description": "Flat 221B"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Baker Street Apt"
    assert data["description"] == "Flat 221B"
    assert "invite_code" in data
    assert data["member_count"] == 1

    # Fetch group details
    group_id = data["id"]
    detail_res = await client_alice.get(f"/api/v1/groups/{group_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["members"]) == 1
    assert detail["members"][0]["role"] == GroupRole.OWNER.value


@pytest.mark.asyncio
async def test_join_group(
    client_bob: AsyncClient, test_group: Group, user_bob: User
):
    """User should be able to join an existing group using its invite code."""
    response = await client_bob.post(
        "/api/v1/groups/join",
        json={"invite_code": test_group.invite_code},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["group_id"] == str(test_group.id)
    assert data["user_id"] == str(user_bob.id)
    assert data["role"] == GroupRole.MEMBER.value


@pytest.mark.asyncio
async def test_join_group_invalid_code(client_bob: AsyncClient):
    """Joining with an invalid invite code should fail."""
    response = await client_bob.post(
        "/api/v1/groups/join",
        json={"invite_code": "NONEXISTENT999"},
    )
    assert response.status_code == 404
