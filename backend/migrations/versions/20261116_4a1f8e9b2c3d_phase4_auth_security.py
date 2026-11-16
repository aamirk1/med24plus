"""phase4_auth_security

Revision ID: 4a1f8e9b2c3d
Revises: 1924f031a0a0
Create Date: 2026-11-16 13:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4a1f8e9b2c3d'
down_revision: Union[str, None] = '1924f031a0a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add family_id to user_sessions
    op.add_column('user_sessions', sa.Column('family_id', sa.Uuid(), nullable=True))
    op.create_index(op.f('ix_user_sessions_family_id'), 'user_sessions', ['family_id'], unique=False)

    # 2. Create otp_verifications
    op.create_table(
        'otp_verifications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('target', sa.String(length=100), nullable=False),
        sa.Column('otp_hash', sa.String(length=255), nullable=False),
        sa.Column('purpose', sa.String(length=50), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_otp_verifications_id'), 'otp_verifications', ['id'], unique=False)
    op.create_index(op.f('ix_otp_verifications_target'), 'otp_verifications', ['target'], unique=False)
    op.create_index(op.f('ix_otp_verifications_purpose'), 'otp_verifications', ['purpose'], unique=False)
    op.create_index(op.f('ix_otp_verifications_expires_at'), 'otp_verifications', ['expires_at'], unique=False)
    op.create_index('ix_otp_target_purpose', 'otp_verifications', ['target', 'purpose'], unique=False)

    # 3. Create authentication_events
    op.create_table(
        'authentication_events',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('identifier', sa.String(length=100), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_authentication_events_id'), 'authentication_events', ['id'], unique=False)
    op.create_index(op.f('ix_authentication_events_identifier'), 'authentication_events', ['identifier'], unique=False)
    op.create_index(op.f('ix_authentication_events_event_type'), 'authentication_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_authentication_events_user_id'), 'authentication_events', ['user_id'], unique=False)
    op.create_index('ix_auth_events_identifier_type', 'authentication_events', ['identifier', 'event_type'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_auth_events_identifier_type', table_name='authentication_events')
    op.drop_index(op.f('ix_authentication_events_user_id'), table_name='authentication_events')
    op.drop_index(op.f('ix_authentication_events_event_type'), table_name='authentication_events')
    op.drop_index(op.f('ix_authentication_events_identifier'), table_name='authentication_events')
    op.drop_index(op.f('ix_authentication_events_id'), table_name='authentication_events')
    op.drop_table('authentication_events')

    op.drop_index('ix_otp_target_purpose', table_name='otp_verifications')
    op.drop_index(op.f('ix_otp_verifications_expires_at'), table_name='otp_verifications')
    op.drop_index(op.f('ix_otp_verifications_purpose'), table_name='otp_verifications')
    op.drop_index(op.f('ix_otp_verifications_target'), table_name='otp_verifications')
    op.drop_index(op.f('ix_otp_verifications_id'), table_name='otp_verifications')
    op.drop_table('otp_verifications')

    op.drop_index(op.f('ix_user_sessions_family_id'), table_name='user_sessions')
    op.drop_column('user_sessions', 'family_id')

