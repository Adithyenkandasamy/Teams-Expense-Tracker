"""Application configuration loaded from environment variables."""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = Field(alias="DATABASE_URL")

    # Firebase
    firebase_project_id: str = Field(alias="FIREBASE_PROJECT_ID")
    firebase_private_key: str = Field(alias="FIREBASE_PRIVATE_KEY")
    firebase_client_email: str = Field(alias="FIREBASE_CLIENT_EMAIL")

    # Cloudinary
    cloudinary_cloud_name: str = Field(alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(alias="CLOUDINARY_API_SECRET")

    # App Config
    default_reminder_interval_hours: int = Field(
        default=24, alias="DEFAULT_REMINDER_INTERVAL_HOURS"
    )
    receipt_retention_days: int = Field(default=2, alias="RECEIPT_RETENTION_DAYS")

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8081"],
        alias="CORS_ORIGINS",
    )

    # Environment
    environment: str = Field(default="development", alias="ENVIRONMENT")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "populate_by_name": True,
    }


_settings: Settings | None = None


def get_settings() -> Settings:
    """Get cached application settings."""
    global _settings
    if _settings is None:
        _settings = Settings()  # type: ignore[call-arg]
    return _settings
