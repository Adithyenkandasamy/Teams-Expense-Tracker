"""Firebase Admin SDK initialization and token verification."""

import json
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
        cred = None

        # 1. Direct JSON string (ideal for Vercel/serverless deployments)
        if settings.firebase_credentials_json:
            try:
                cert_dict = json.loads(settings.firebase_credentials_json)
                if isinstance(cert_dict.get("private_key"), str) and "\\n" in cert_dict["private_key"]:
                    cert_dict["private_key"] = cert_dict["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(cert_dict)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Error parsing FIREBASE_CREDENTIALS_JSON: {e}")

        # 2. File path on disk
        if cred is None and settings.firebase_credentials_path:
            path = settings.firebase_credentials_path
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
            if os.path.exists(path):
                cred = credentials.Certificate(path)

        # 3. Separate environment variables
        if (
            cred is None
            and settings.firebase_project_id
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

        if cred is not None:
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            try:
                default_cred = credentials.ApplicationDefault()
                _firebase_app = firebase_admin.initialize_app(default_cred)
            except Exception:
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
