"""Add compound indexes for BankTransaction and Timeline performance

Revision ID: 1662bb2a700c
Revises: 1239ad0c1d06
Create Date: 2026-01-31 07:41:15.110944

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '1662bb2a700c'
down_revision: Union[str, Sequence[str], None] = '1239ad0c1d06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add compound indices for forensic lookup patterns."""
    # BankTransaction: project_id + timestamp (Timeline/S-Curve)
    op.create_index(
        'ix_bank_transaction_project_time',
        'banktransaction',
        ['project_id', 'timestamp'],
        unique=False
    )
    
    # Transaction: project_id + timestamp (Timeline/S-Curve)
    op.create_index(
        'ix_transaction_project_time',
        'transaction',
        ['project_id', 'timestamp'],
        unique=False
    )
    
    # Transaction: project_id + receiver (Vendor Lookup)
    op.create_index(
        'ix_transaction_project_receiver',
        'transaction',
        ['project_id', 'receiver'],
        unique=False
    )


def downgrade() -> None:
    """Remove compound indices."""
    op.drop_index('ix_transaction_project_receiver', table_name='transaction')
    op.drop_index('ix_transaction_project_time', table_name='transaction')
    op.drop_index('ix_bank_transaction_project_time', table_name='banktransaction')
