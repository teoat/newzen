"""add_composite_indices_for_performance

Revision ID: 21eab98782c5
Revises: perf_indexes_001
Create Date: 2026-01-30 16:26:49.518695

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '21eab98782c5'
down_revision: Union[str, Sequence[str], None] = 'perf_indexes_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add composite indices for performance optimization."""
    # Composite index for Velocity Scans (project_id + receiver + timestamp)
    op.create_index(
        'ix_transaction_velocity_scan',
        'transaction',
        ['project_id', 'receiver', 'timestamp'],
        unique=False
    )
    
    # Composite index for Sender analysis
    op.create_index(
        'ix_transaction_sender_analysis',
        'transaction',
        ['project_id', 'sender', 'timestamp'],
        unique=False
    )
    
    # Composite index for Case filtering
    op.create_index(
        'ix_transaction_case_time',
        'transaction',
        ['case_id', 'timestamp'],
        unique=False
    )


def downgrade() -> None:
    """Remove composite indices."""
    op.drop_index('ix_transaction_case_time', table_name='transaction')
    op.drop_index('ix_transaction_sender_analysis', table_name='transaction')
    op.drop_index('ix_transaction_velocity_scan', table_name='transaction')
