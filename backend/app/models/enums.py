"""Enum types used across models."""

import enum


class GroupRole(str, enum.Enum):
    """Roles within a group."""

    OWNER = "OWNER"
    LEADER = "LEADER"
    MEMBER = "MEMBER"


class ExpenseStatus(str, enum.Enum):
    """Lifecycle status of an expense."""

    ACTIVE = "ACTIVE"
    READY_TO_CLOSE = "READY_TO_CLOSE"
    CLOSED = "CLOSED"


class PaymentStatus(str, enum.Enum):
    """Payment status for an expense split."""

    PENDING = "PENDING"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED"
    PAID = "PAID"
    REJECTED = "REJECTED"
