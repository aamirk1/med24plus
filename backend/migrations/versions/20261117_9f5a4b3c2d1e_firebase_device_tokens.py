"""firebase_device_tokens

Revision ID: 9f5a4b3c2d1e
Revises: 8e4f3a2b1c9d
Create Date: 2026-11-17 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9f5a4b3c2d1e'
down_revision: Union[str, None] = '8e4f3a2b1c9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_device_tokens table for Firebase Cloud Messaging (FCM)
    op.create_table(
        'user_device_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('fcm_token', sa.String(length=500), nullable=False),
        sa.Column('device_type', sa.String(length=50), server_default='android', nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('fcm_token')
    )
    op.create_index(op.f('ix_user_device_tokens_id'), 'user_device_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_user_device_tokens_user_id'), 'user_device_tokens', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_device_tokens_fcm_token'), 'user_device_tokens', ['fcm_token'], unique=True)
    op.create_index('ix_user_device_tokens_user_active', 'user_device_tokens', ['user_id', 'is_active'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_user_device_tokens_user_active', table_name='user_device_tokens')
    op.drop_index(op.f('ix_user_device_tokens_fcm_token'), table_name='user_device_tokens')
    op.drop_index(op.f('ix_user_device_tokens_user_id'), table_name='user_device_tokens')
    op.drop_index(op.f('ix_user_device_tokens_id'), table_name='user_device_tokens')
    op.drop_table('user_device_tokens')
