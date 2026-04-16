"""add_ai_audit_logs

Revision ID: c3d4e5f6a7b8
Revises: b1b2ed85ef1b
Create Date: 2026-04-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'c3d4e5f6a7b8'
down_revision = 'b1b2ed85ef1b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'ai_audit_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('agent_name', sa.String(255), nullable=False),
        sa.Column('domain_id', sa.String(100), nullable=False),
        sa.Column('model_version', sa.String(100), nullable=False),
        sa.Column('action', sa.String(500), nullable=False),
        sa.Column('input_context', sa.Text, nullable=False),
        sa.Column('output_summary', sa.Text, nullable=False),
        sa.Column('confidence_score', sa.Float, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='auto_executed'),
        sa.Column('triggered_by', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_ai_audit_logs_agent_name', 'ai_audit_logs', ['agent_name'])
    op.create_index('ix_ai_audit_logs_domain_id', 'ai_audit_logs', ['domain_id'])
    op.create_index('ix_ai_audit_logs_status', 'ai_audit_logs', ['status'])
    op.create_index('ix_ai_audit_logs_triggered_by', 'ai_audit_logs', ['triggered_by'])
    op.create_index('ix_ai_audit_logs_created_at', 'ai_audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_ai_audit_logs_created_at')
    op.drop_index('ix_ai_audit_logs_triggered_by')
    op.drop_index('ix_ai_audit_logs_status')
    op.drop_index('ix_ai_audit_logs_domain_id')
    op.drop_index('ix_ai_audit_logs_agent_name')
    op.drop_table('ai_audit_logs')
