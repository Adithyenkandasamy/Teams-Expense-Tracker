"""Add target modes, dates, status, and auditable entries."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision: str = "005_savings_target_entries"
down_revision: str | None = "004_savings_targets"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "savings_targets",
        sa.Column("funding_mode", sa.String(20), nullable=False, server_default="MANUAL"),
    )
    op.add_column("savings_targets", sa.Column("target_date", sa.Date(), nullable=True))
    op.add_column(
        "savings_targets",
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
    )
    op.create_table(
        "savings_target_entries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "target_id",
            UUID(as_uuid=True),
            sa.ForeignKey("savings_targets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("entry_type", sa.String(20), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("note", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_savings_target_entries_target_created",
        "savings_target_entries",
        ["target_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_savings_target_entries_target_created", table_name="savings_target_entries")
    op.drop_table("savings_target_entries")
    op.drop_column("savings_targets", "status")
    op.drop_column("savings_targets", "target_date")
    op.drop_column("savings_targets", "funding_mode")
