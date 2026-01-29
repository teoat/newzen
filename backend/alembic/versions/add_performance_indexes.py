"""Add performance indexes for transaction queries

Revision ID: perf_indexes_001
Revises: 9ec1d705c983
Create Date: 2026-01-29 14:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'perf_indexes_001'
down_revision = '9ec1d705c983'
branch_labels = None
depends_on = None


def upgrade():
    """Add indexes to improve query performance."""
    # Transaction table indexes
    op.create_index(
        'ix_transaction_sender',
        'transaction',
        ['sender'],
        unique=False
    )
    op.create_index(
        'ix_transaction_receiver',
        'transaction',
        ['receiver'],
        unique=False
    )
    op.create_index(
        'ix_transaction_timestamp',
        'transaction',
        ['timestamp'],
        unique=False
    )
    op.create_index(
        'ix_transaction_risk_score',
        'transaction',
        ['risk_score'],
        unique=False
    )
    
    # UserQueryPattern indexes for pattern detection
    op.create_index(
        'ix_userquerypattern_user_project',
        'user_query_patterns',
        ['user_id', 'project_id'],
        unique=False
    )
    op.create_index(
        'ix_userquerypattern_frequency',
        'user_query_patterns',
        ['query_frequency'],
        unique=False
    )
    
    # FraudAlert indexes for faster alert retrieval
    op.create_index(
        'ix_fraudalert_severity',
        'fraudalert',
        ['severity'],
        unique=False
    )


def downgrade():
    """Remove performance indexes."""
    op.drop_index('ix_transaction_sender', table_name='transaction')
    op.drop_index('ix_transaction_receiver', table_name='transaction')
    op.drop_index('ix_transaction_timestamp', table_name='transaction')
    op.drop_index('ix_transaction_risk_score', table_name='transaction')
    op.drop_index(
        'ix_userquerypattern_user_project',
        table_name='user_query_patterns'
    )
    op.drop_index(
        'ix_userquerypattern_frequency',
        table_name='user_query_patterns'
    )
    op.drop_index('ix_fraudalert_severity', table_name='fraudalert')
