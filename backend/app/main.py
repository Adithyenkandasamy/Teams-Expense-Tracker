"""FastAPI application factory."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.workers.scheduler import start_background_workers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — start background workers on startup (non-serverless)."""
    import os
    logger.info("Starting application")
    if not os.environ.get("VERCEL"):
        await start_background_workers()
    yield
    logger.info("Shutting down application")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    is_production = settings.environment.lower() == "production" or not settings.debug
    docs_url = None if is_production else "/docs"
    redoc_url = None if is_production else "/redoc"
    openapi_url = None if is_production else "/openapi.json"

    app = FastAPI(
        title="Roommate Expense Tracker API",
        description="Backend API for a roommate expense-sharing mobile application",
        version="1.0.0",
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check
    @app.get("/health", tags=["health"])
    async def health_check() -> dict:
        return {"status": "healthy", "version": "1.0.0"}

    # API routes
    app.include_router(api_v1_router)

    return app


app = create_app()
