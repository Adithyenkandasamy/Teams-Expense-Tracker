"""Cloudinary configuration and upload/delete helpers."""

import cloudinary
import cloudinary.uploader

from app.core.config import get_settings

_configured = False


def configure_cloudinary() -> None:
    """Configure Cloudinary SDK (idempotent)."""
    global _configured
    if not _configured:
        settings = get_settings()
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        _configured = True


def upload_image(file_data: bytes, folder: str = "expense_receipts") -> dict:
    """Upload an image to Cloudinary.

    Returns dict with 'secure_url' and 'public_id'.
    """
    configure_cloudinary()
    result = cloudinary.uploader.upload(
        file_data,
        folder=folder,
        resource_type="image",
        allowed_formats=["jpg", "jpeg", "png", "webp"],
    )
    return {
        "secure_url": result["secure_url"],
        "public_id": result["public_id"],
    }


def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by public_id.

    Returns True if deleted, False otherwise.
    """
    configure_cloudinary()
    result = cloudinary.uploader.destroy(public_id, resource_type="image")
    return result.get("result") == "ok"
