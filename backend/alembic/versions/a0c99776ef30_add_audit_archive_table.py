"""Add audit archive table - Minimal

Revision ID: a0c99776ef30
Revises: 06380036cfe7
Create Date: 2026-01-31 12:43:12.468968

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a0c99776ef30'
down_revision: Union[str, Sequence[str], None] = '06380036cfe7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. AuditLog Archive
    op.create_table('audit_log_archive',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('field_name', sa.String(), nullable=True),
        sa.Column('old_value', sa.String(), nullable=True),
        sa.Column('new_value', sa.String(), nullable=True),
        sa.Column('changed_by_user_id', sa.String(), nullable=True),
        sa.Column('change_reason', sa.String(), nullable=True),
        sa.Column('previous_hash', sa.String(), nullable=True),
        sa.Column('hash_signature', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('archived_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Add missing fields to BankTransaction
    op.add_column('banktransaction', sa.Column('project_id', sa.String(), nullable=True))
    op.add_column('banktransaction', sa.Column('booking_date', sa.DateTime(), nullable=True))
    op.add_column('banktransaction', sa.Column('batch_reference', sa.String(), nullable=True))
    op.add_column('banktransaction', sa.Column('embeddings_json', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('banktransaction', 'embeddings_json')
    op.drop_column('banktransaction', 'batch_reference')
    op.drop_column('banktransaction', 'booking_date')
    op.drop_column('banktransaction', 'project_id')
    op.drop_table('audit_log_archive')