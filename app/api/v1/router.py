"""V1 API router — aggregates all sub-routers."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.balances import router as balances_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.groups import router as groups_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.splits import router as splits_router
from app.api.v1.users import router as users_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(groups_router)
api_v1_router.include_router(expenses_router)
api_v1_router.include_router(splits_router)
api_v1_router.include_router(balances_router)
api_v1_router.include_router(notifications_router)
