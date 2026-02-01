"""Drop banktransaction table

Revision ID: b94845a15544
Revises: 9416ac1bb2e3
Create Date: 2026-02-01 07:28:25.411875

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b94845a15544'
down_revision: Union[str, Sequence[str], None] = '9416ac1bb2e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('banktransaction')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('banktransaction',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False),
        sa.Column('bank_name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('booking_date', sa.DateTime(), nullable=True),
        sa.Column('batch_reference', sa.String(), nullable=True),
        sa.Column('embeddings_json', sa.JSON(), nullable=True)
    )
