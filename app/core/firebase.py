"""Firebase Admin SDK initialization and token verification."""

import firebase_admin
from firebase_admin import auth, credentials, messaging

from app.core.config import get_settings

_firebase_app: firebase_admin.App | None = None


def get_firebase_app() -> firebase_admin.App:
    """Initialize and return the Firebase Admin app (singleton)."""
    global _firebase_app
    if _firebase_app is None:
        settings = get_settings()
        cred = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "private_key": settings.firebase_private_key.replace("\\n", "\n"),
                "client_email": settings.firebase_client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims.

    Raises ValueError if the token is invalid or expired.
    """
    get_firebase_app()
    decoded = auth.verify_id_token(id_token)
    return decoded


def send_fcm_message(message: messaging.Message) -> str:
    """Send a single FCM message. Returns the message ID."""
    get_firebase_app()
    return messaging.send(message)


def send_fcm_multicast(message: messaging.MulticastMessage) -> messaging.BatchResponse:
    """Send an FCM multicast message. Returns the batch response."""
    get_firebase_app()
    return messaging.send_each_for_multicast(message)
