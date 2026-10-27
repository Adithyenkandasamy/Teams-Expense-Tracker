"""Indexes for common group and expense read paths."""

from collections.abc import Sequence

from alembic import op

revision: str = "002_read_path_indexes"
down_revision: str | None = "001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_group_members_user_id_group_id",
        "group_members",
        ["user_id", "group_id"],
    )
    op.create_index(
        "ix_expenses_group_id_created_at",
        "expenses",
        ["group_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_expenses_group_id_created_at", table_name="expenses")
    op.drop_index("ix_group_members_user_id_group_id", table_name="group_members")
