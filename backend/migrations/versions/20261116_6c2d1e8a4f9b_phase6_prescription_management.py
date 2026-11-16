"""phase6_prescription_management

Revision ID: 6c2d1e8a4f9b
Revises: 4a1f8e9b2c3d
Create Date: 2026-11-16 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c2d1e8a4f9b'
down_revision: Union[str, None] = '4a1f8e9b2c3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create prescription_files table
    op.create_table(
        'prescription_files',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('prescription_id', sa.Uuid(), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('storage_key', sa.String(length=500), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('storage_provider', sa.String(length=50), server_default='local', nullable=False),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('file_category', sa.String(length=50), server_default='initial', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('uploaded_by_id', sa.Uuid(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prescription_files_prescription_id'), 'prescription_files', ['prescription_id'], unique=False)
    op.create_index(op.f('ix_prescription_files_uploaded_by_id'), 'prescription_files', ['uploaded_by_id'], unique=False)
    op.create_index('ix_prescription_files_rx_active', 'prescription_files', ['prescription_id', 'is_active'], unique=False)

    # 2. Make legacy file columns on prescriptions nullable for multi-file support
    op.alter_column('prescriptions', 'storage_object_key', existing_type=sa.String(length=500), nullable=True)
    op.alter_column('prescriptions', 'original_filename', existing_type=sa.String(length=255), nullable=True)
    op.alter_column('prescriptions', 'file_mime_type', existing_type=sa.String(length=100), nullable=True)
    op.alter_column('prescriptions', 'file_size_bytes', existing_type=sa.Integer(), nullable=True)

    # 3. Add workflow & decision tracking columns to prescriptions
    op.add_column('prescriptions', sa.Column('rejected_by_id', sa.Uuid(), nullable=True))
    op.add_column('prescriptions', sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('prescriptions', sa.Column('under_review_by_id', sa.Uuid(), nullable=True))
    op.add_column('prescriptions', sa.Column('under_review_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('prescriptions', sa.Column('clarification_requested_by_id', sa.Uuid(), nullable=True))
    op.add_column('prescriptions', sa.Column('clarification_requested_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('prescriptions', sa.Column('clarification_remarks', sa.Text(), nullable=True))
    op.add_column('prescriptions', sa.Column('customer_notes', sa.Text(), nullable=True))
    op.add_column('prescriptions', sa.Column('is_valid', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.add_column('prescriptions', sa.Column('invalidity_reason', sa.Text(), nullable=True))

    op.create_foreign_key('fk_prescriptions_rejected_by', 'prescriptions', 'users', ['rejected_by_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_prescriptions_under_review_by', 'prescriptions', 'users', ['under_review_by_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_prescriptions_clarification_requested_by', 'prescriptions', 'users', ['clarification_requested_by_id'], ['id'], ondelete='SET NULL')

    op.create_index('ix_prescriptions_status_created', 'prescriptions', ['prescription_status', 'created_at'], unique=False)

    # 4. Add verification fields to prescription_items
    op.add_column('prescription_items', sa.Column('pharmacist_remarks', sa.Text(), nullable=True))
    op.add_column('prescription_items', sa.Column('verification_status', sa.String(length=30), server_default='pending', nullable=False))


def downgrade() -> None:
    # 4. Remove verification fields from prescription_items
    op.drop_column('prescription_items', 'verification_status')
    op.drop_column('prescription_items', 'pharmacist_remarks')

    # 3. Remove workflow columns and constraints from prescriptions
    op.drop_index('ix_prescriptions_status_created', table_name='prescriptions')
    op.drop_constraint('fk_prescriptions_clarification_requested_by', 'prescriptions', type_='foreignkey')
    op.drop_constraint('fk_prescriptions_under_review_by', 'prescriptions', type_='foreignkey')
    op.drop_constraint('fk_prescriptions_rejected_by', 'prescriptions', type_='foreignkey')
    op.drop_column('prescriptions', 'invalidity_reason')
    op.drop_column('prescriptions', 'is_valid')
    op.drop_column('prescriptions', 'customer_notes')
    op.drop_column('prescriptions', 'clarification_remarks')
    op.drop_column('prescriptions', 'clarification_requested_at')
    op.drop_column('prescriptions', 'clarification_requested_by_id')
    op.drop_column('prescriptions', 'under_review_at')
    op.drop_column('prescriptions', 'under_review_by_id')
    op.drop_column('prescriptions', 'rejected_at')
    op.drop_column('prescriptions', 'rejected_by_id')

    # 2. Revert nullability
    op.alter_column('prescriptions', 'file_size_bytes', existing_type=sa.Integer(), nullable=False)
    op.alter_column('prescriptions', 'file_mime_type', existing_type=sa.String(length=100), nullable=False)
    op.alter_column('prescriptions', 'original_filename', existing_type=sa.String(length=255), nullable=False)
    op.alter_column('prescriptions', 'storage_object_key', existing_type=sa.String(length=500), nullable=False)

    # 1. Drop prescription_files table
    op.drop_index('ix_prescription_files_rx_active', table_name='prescription_files')
    op.drop_index(op.f('ix_prescription_files_uploaded_by_id'), table_name='prescription_files')
    op.drop_index(op.f('ix_prescription_files_prescription_id'), table_name='prescription_files')
    op.drop_table('prescription_files')

