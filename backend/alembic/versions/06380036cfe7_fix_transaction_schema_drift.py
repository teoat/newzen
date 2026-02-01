"""Fix transaction schema drift - Minimal

Revision ID: 06380036cfe7
Revises: 1662bb2a700c
Create Date: 2026-01-31 12:43:12.468968

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '06380036cfe7'
down_revision: Union[str, Sequence[str], None] = '1662bb2a700c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. AuditLog extensions
    op.add_column('auditlog', sa.Column('previous_hash', sa.String(), nullable=True))
    op.add_column('auditlog', sa.Column('hash_signature', sa.String(), nullable=True))

    # 2. Transaction extensions (The ones causing crashes)
    op.add_column('transaction', sa.Column('is_pinned', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.add_column('transaction', sa.Column('theory_notes', sa.String(), nullable=True))
    
    # 3. Document extensions
    op.add_column('document', sa.Column('is_pinned', sa.Boolean(), nullable=True, server_default=sa.text('false')))
    op.add_column('document', sa.Column('theory_notes', sa.String(), nullable=True))

    # 4. Case extensions
    op.add_column('case', sa.Column('project_id', sa.String(), nullable=True))
    op.add_column('case', sa.Column('final_report_hash', sa.String(), nullable=True))
    op.add_column('case', sa.Column('sealed_at', sa.DateTime(), nullable=True))
    op.add_column('case', sa.Column('sealed_by_id', sa.String(), nullable=True))
    
    # 5. BudgetLine extensions
    op.add_column('budgetline', sa.Column('unit_price_cco', sa.Float(), nullable=True))
    op.add_column('budgetline', sa.Column('qty_cco', sa.Float(), nullable=True))
    op.add_column('budgetline', sa.Column('total_price_cco', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('budgetline', 'total_price_cco')
    op.drop_column('budgetline', 'qty_cco')
    op.drop_column('budgetline', 'unit_price_cco')
    op.drop_column('case', 'sealed_by_id')
    op.drop_column('case', 'sealed_at')
    op.drop_column('case', 'final_report_hash')
    op.drop_column('case', 'project_id')
    op.drop_column('document', 'theory_notes')
    op.drop_column('document', 'is_pinned')
    op.drop_column('transaction', 'theory_notes')
    op.drop_column('transaction', 'is_pinned')
    op.drop_column('auditlog', 'hash_signature')
    op.drop_column('auditlog', 'previous_hash')