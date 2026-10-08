"""Enum types used across models."""

import enum


class GroupRole(enum.StrEnum):
    """Roles within a group."""

    OWNER = "OWNER"
    MEMBER = "MEMBER"


class ExpenseStatus(enum.StrEnum):
    """Lifecycle status of an expense."""

    ACTIVE = "ACTIVE"
    READY_TO_CLOSE = "READY_TO_CLOSE"
    CLOSED = "CLOSED"


class PaymentStatus(enum.StrEnum):
    """Payment status for an expense split."""

    PENDING = "PENDING"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED"
    PAID = "PAID"
    REJECTED = "REJECTED"
