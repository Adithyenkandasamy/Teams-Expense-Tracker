"""Pytest configuration and shared fixtures.

Uses an in-memory SQLite async database for speed.
Mocks Firebase token verification to avoid needing real Firebase credentials.
"""

import os

# Set dummy environment variables for testing before other imports
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test-key")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@test.iam.gserviceaccount.com")
os.environ.setdefault("CLOUDINARY_CLOUD_NAME", "test-cloud")
os.environ.setdefault("CLOUDINARY_API_KEY", "test-key")
os.environ.setdefault("CLOUDINARY_API_SECRET", "test-secret")

from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.base import Base
from app.models.enums import ExpenseStatus, GroupRole, PaymentStatus
from app.models.expense import Expense, ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.user import User

# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def engine():
    """Create an async test engine with SQLite."""
    eng = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional async session for tests."""
    factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def user_alice(db_session: AsyncSession) -> User:
    """Create test user Alice."""
    user = User(
        firebase_uid="firebase_alice_123",
        name="Alice",
        email="alice@example.com",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def user_bob(db_session: AsyncSession) -> User:
    """Create test user Bob."""
    user = User(
        firebase_uid="firebase_bob_456",
        name="Bob",
        email="bob@example.com",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def user_charlie(db_session: AsyncSession) -> User:
    """Create test user Charlie."""
    user = User(
        firebase_uid="firebase_charlie_789",
        name="Charlie",
        email="charlie@example.com",
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# App / HTTP client fixtures
# ---------------------------------------------------------------------------


def _create_test_app(db_session: AsyncSession, current_user: User) -> FastAPI:
    """Create a test FastAPI app with overridden dependencies."""
    # Import here to avoid loading firebase on import
    from app.main import create_app

    app = create_app()

    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return current_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    return app


@pytest_asyncio.fixture
async def client_alice(
    db_session: AsyncSession, user_alice: User
) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client authenticated as Alice."""
    app = _create_test_app(db_session, user_alice)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def client_bob(
    db_session: AsyncSession, user_bob: User
) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client authenticated as Bob."""
    app = _create_test_app(db_session, user_bob)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def client_charlie(
    db_session: AsyncSession, user_charlie: User
) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client authenticated as Charlie."""
    app = _create_test_app(db_session, user_charlie)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ---------------------------------------------------------------------------
# Helper fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def test_group(db_session: AsyncSession, user_alice: User) -> Group:
    """Create a test group owned by Alice."""
    group = Group(
        name="Test Apartment",
        description="Test group",
        invite_code="TESTCODE123",
        created_by=user_alice.id,
    )
    db_session.add(group)
    await db_session.flush()

    member = GroupMember(
        group_id=group.id,
        user_id=user_alice.id,
        role=GroupRole.OWNER.value,
    )
    db_session.add(member)
    await db_session.flush()
    return group


@pytest_asyncio.fixture
async def group_with_bob(
    db_session: AsyncSession, test_group: Group, user_bob: User
) -> Group:
    """Add Bob to the test group."""
    member = GroupMember(
        group_id=test_group.id,
        user_id=user_bob.id,
        role=GroupRole.MEMBER.value,
    )
    db_session.add(member)
    await db_session.flush()
    return test_group


@pytest_asyncio.fixture
async def test_expense(
    db_session: AsyncSession,
    group_with_bob: Group,
    user_alice: User,
    user_bob: User,
) -> Expense:
    """Create a test expense of ₹100 created by Alice, split between Alice and Bob."""
    now = datetime.now(UTC)
    expense = Expense(
        group_id=group_with_bob.id,
        created_by=user_alice.id,
        paid_by=user_alice.id,
        amount=Decimal("100.00"),
        description="Test groceries",
        category="Food",
        initial_deadline=now + timedelta(days=1),
        current_deadline=now + timedelta(days=1),
        next_reminder_at=now + timedelta(days=1),
        status=ExpenseStatus.ACTIVE.value,
    )
    db_session.add(expense)
    await db_session.flush()

    split_alice = ExpenseSplit(
        expense_id=expense.id,
        user_id=user_alice.id,
        amount=Decimal("50.00"),
        status=PaymentStatus.PAID.value,
        paid_at=now,
    )
    split_bob = ExpenseSplit(
        expense_id=expense.id,
        user_id=user_bob.id,
        amount=Decimal("50.00"),
        status=PaymentStatus.PENDING.value,
    )
    db_session.add_all([split_alice, split_bob])
    await db_session.flush()

    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    res = await db_session.execute(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.id == expense.id)
    )
    return res.scalar_one()
