"""Schemas for combined personal and group spending analytics."""

from decimal import Decimal

from pydantic import BaseModel


class MonthlySpendingBucket(BaseModel):
    month: str
    personal_total: Decimal
    group_total: Decimal
    your_group_share: Decimal


class SpendingCategory(BaseModel):
    category: str
    personal_total: Decimal
    your_group_share: Decimal


class MonthlySpendingResponse(BaseModel):
    months: list[MonthlySpendingBucket]
    categories: list[SpendingCategory]
