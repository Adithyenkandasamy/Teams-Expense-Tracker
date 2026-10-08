"""Auth routes."""

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the currently authenticated user."""
    return current_user


@router.post("/dev-token")
async def create_dev_token() -> dict:
    """Generate a Firebase custom token for mobile Expo Go development."""
    from app.core.config import get_settings
    from app.core.exceptions import ForbiddenError
    from app.core.firebase import get_firebase_app
    from firebase_admin import auth as fb_auth

    settings = get_settings()
    if settings.environment != "development":
        raise ForbiddenError("Only available in development")

    get_firebase_app()
    token_bytes = fb_auth.create_custom_token(
        "kJw8Q888D1M4hjeZRsr2wuQSw9H2",
        {"email": "aadithyen1@gmail.com", "name": "Adithyen"},
    )
    custom_token = token_bytes.decode("utf-8") if isinstance(token_bytes, bytes) else token_bytes
    return {"custom_token": custom_token}

