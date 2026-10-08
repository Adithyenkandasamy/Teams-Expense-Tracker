"""Tests for Firebase authentication dependency."""

from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import get_db


@pytest.mark.asyncio
async def test_auth_missing_token(db_session):
    """Request without Authorization header should return 401."""
    from app.main import create_app

    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/users/me")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_auth_invalid_token(db_session):
    """Request with invalid Firebase token should return 401."""
    from app.main import create_app

    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.dependencies.auth.verify_firebase_token", side_effect=ValueError("Invalid")):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/users/me",
                headers={"Authorization": "Bearer invalid_token"},
            )
            assert resp.status_code == 401


@pytest.mark.asyncio
async def test_auth_valid_token_creates_user(db_session):
    """Valid Firebase token should auto-create a user."""
    from app.main import create_app

    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    decoded_token = {
        "uid": "new_firebase_user_123",
        "name": "New User",
        "email": "newuser@example.com",
        "picture": "https://example.com/photo.jpg",
    }

    with patch("app.dependencies.auth.verify_firebase_token", return_value=decoded_token):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/users/me",
                headers={"Authorization": "Bearer valid_token"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["email"] == "newuser@example.com"
            assert data["firebase_uid"] == "new_firebase_user_123"
