"""Firebase Admin SDK initialization and token verification."""

import os

import firebase_admin
from firebase_admin import auth, credentials, messaging

from app.core.config import get_settings

_firebase_app: firebase_admin.App | None = None


def get_firebase_app() -> firebase_admin.App:
    """Initialize and return the Firebase Admin app (singleton)."""
    global _firebase_app
    if _firebase_app is None:
        settings = get_settings()
        path = settings.firebase_credentials_path
        if path:
            if not os.path.isabs(path):
                candidates = [
                    os.path.abspath(path),
                    os.path.join("/app", path),
                    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), path),
                ]
                for candidate in candidates:
                    if os.path.exists(candidate):
                        path = candidate
                        break
        if path and os.path.exists(path):
            cred = credentials.Certificate(path)
        elif (
            settings.firebase_project_id
            and settings.firebase_private_key
            and settings.firebase_client_email
        ):
            cred = credentials.Certificate(
                {
                    "type": "service_account",
                    "project_id": settings.firebase_project_id,
                    "private_key": settings.firebase_private_key.replace("\\n", "\n"),
                    "client_email": settings.firebase_client_email,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            )
        else:
            try:
                cred = credentials.ApplicationDefault()
            except Exception:
                cred = None

        if cred is not None:
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            _firebase_app = firebase_admin.initialize_app()
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
