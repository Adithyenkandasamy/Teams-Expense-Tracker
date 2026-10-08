"""Firebase authentication dependency for FastAPI.

Extracts and verifies the Firebase ID token from the Authorization header,
finds or creates the corresponding PostgreSQL user, and attaches it to the request.
"""

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.firebase import verify_firebase_token
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Verify Firebase token and return the authenticated PostgreSQL user.

    1. Extract Bearer token from Authorization header.
    2. Verify it with Firebase Admin SDK.
    3. Find or create user in PostgreSQL.
    4. Return the User ORM instance.
    """
    if credentials is None:
        raise UnauthorizedError("Missing authorization header")

    token = credentials.credentials
    try:
        decoded = verify_firebase_token(token)
    except Exception:
        raise UnauthorizedError("Invalid or expired Firebase token")

    firebase_uid: str = decoded.get("uid", "")
    if not firebase_uid:
        raise UnauthorizedError("Token missing uid claim")

    # Find existing user
    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_uid)
    )
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-create user from Firebase claims
        user = User(
            firebase_uid=firebase_uid,
            name=decoded.get("name", ""),
            email=decoded.get("email", ""),
            profile_image=decoded.get("picture"),
        )
        db.add(user)
        await db.flush()

    # Attach to request state for convenience
    request.state.user = user
    return user
