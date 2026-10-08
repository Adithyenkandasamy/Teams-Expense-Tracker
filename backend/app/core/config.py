"""Application configuration loaded from environment variables."""

import glob
from typing import Any

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/expense_tracker",
        alias="DATABASE_URL",
    )

    # Firebase
    firebase_credentials_json: str | None = Field(
        default=None, alias="FIREBASE_CREDENTIALS_JSON"
    )
    firebase_credentials_path: str | None = Field(
        default=None, alias="FIREBASE_CREDENTIALS_PATH"
    )
    firebase_project_id: str | None = Field(default=None, alias="FIREBASE_PROJECT_ID")
    firebase_private_key: str | None = Field(default=None, alias="FIREBASE_PRIVATE_KEY")
    firebase_client_email: str | None = Field(default=None, alias="FIREBASE_CLIENT_EMAIL")

    # Cloudinary
    cloudinary_cloud_name: str = Field(default="demo", alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(default="demo_key", alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(default="demo_secret", alias="CLOUDINARY_API_SECRET")

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
        "extra": "ignore",
    }

    @model_validator(mode="before")
    @classmethod
    def populate_database_url_and_firebase(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Auto-detect database URL from Supabase env vars if not explicitly set
            if not data.get("DATABASE_URL") and not data.get("database_url"):
                pg_url = (
                    data.get("POSTGRES_URL_NON_POOLING")
                    or data.get("POSTGRES_URL")
                    or data.get("POSTGRES_PRISMA_URL")
                )
                if pg_url:
                    clean_url = (
                        pg_url.replace("postgres://", "postgresql+asyncpg://")
                        .replace("postgresql://", "postgresql+asyncpg://")
                    )
                    if "sslmode=require" in clean_url:
                        clean_url = clean_url.replace("sslmode=require", "ssl=require")
                    clean_url = (
                        clean_url.replace("&pgbouncer=true", "")
                        .replace("?pgbouncer=true&", "?")
                        .replace("?pgbouncer=true", "")
                        .replace("&supa=base-pooler.x", "")
                    )
                    data["DATABASE_URL"] = clean_url

            # Auto-detect Firebase service account JSON if present in project root
            if not data.get("FIREBASE_CREDENTIALS_PATH") and not data.get(
                "firebase_credentials_path"
            ):
                json_files = glob.glob("*firebase-adminsdk*.json")
                if json_files:
                    data["FIREBASE_CREDENTIALS_PATH"] = json_files[0]

            # Auto-detect Cloudinary cloud name if set as CLOUDINARY_FOLDER or missing
            if not data.get("CLOUDINARY_CLOUD_NAME") or data.get("CLOUDINARY_CLOUD_NAME") == "demo":
                if data.get("CLOUDINARY_FOLDER"):
                    data["CLOUDINARY_CLOUD_NAME"] = data["CLOUDINARY_FOLDER"]
                else:
                    data["CLOUDINARY_CLOUD_NAME"] = "jgfbygec"

        return data


_settings: Settings | None = None


def get_settings() -> Settings:
    """Get cached application settings."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
