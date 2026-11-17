"""phase8_order_management

Revision ID: 8e4f3a2b1c9d
Revises: 7d3e2a1b9c8f
Create Date: 2026-11-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8e4f3a2b1c9d'
down_revision: Union[str, None] = '7d3e2a1b9c8f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB, "postgresql")


def upgrade() -> None:
    # 1. Add Phase 8 columns to orders table
    op.add_column('orders', sa.Column('currency', sa.String(length=10), server_default='INR', nullable=False))
    op.add_column('orders', sa.Column('placed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.add_column('orders', sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('idempotency_key', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_orders_idempotency_key'), 'orders', ['idempotency_key'], unique=False)

    # 2. Add Phase 8 columns to order_items table
    op.add_column('order_items', sa.Column('strength_snapshot', sa.String(length=100), nullable=True))
    op.add_column('order_items', sa.Column('pack_size_snapshot', sa.String(length=100), nullable=True))
    op.add_column('order_items', sa.Column('discount_amount', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False))
    op.add_column('order_items', sa.Column('taxable_amount', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False))
    op.add_column('order_items', sa.Column('prescription_required', sa.Boolean(), server_default=sa.text('false'), nullable=False))

    # 3. Add Phase 8 columns to order_status_history table
    op.add_column('order_status_history', sa.Column('actor_role', sa.String(length=50), nullable=True))
    op.add_column('order_status_history', sa.Column('reason', sa.String(length=255), nullable=True))

    # 4. Create order_batch_allocations table
    op.create_table(
        'order_batch_allocations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('order_id', sa.Uuid(), nullable=False),
        sa.Column('order_item_id', sa.Uuid(), nullable=False),
        sa.Column('batch_id', sa.Uuid(), nullable=False),
        sa.Column('allocated_quantity', sa.Integer(), nullable=False),
        sa.Column('released_quantity', sa.Integer(), server_default='0', nullable=False),
        sa.Column('consumed_quantity', sa.Integer(), server_default='0', nullable=False),
        sa.Column('allocation_status', sa.String(length=30), server_default='allocated', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('allocated_quantity > 0', name='check_order_batch_alloc_qty_pos'),
        sa.CheckConstraint('released_quantity >= 0', name='check_order_batch_rel_qty_non_neg'),
        sa.CheckConstraint('consumed_quantity >= 0', name='check_order_batch_con_qty_non_neg'),
        sa.CheckConstraint('released_quantity + consumed_quantity <= allocated_quantity', name='check_order_batch_qty_sum_valid'),
        sa.ForeignKeyConstraint(['batch_id'], ['inventory_batches.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_order_batch_allocations_order_id'), 'order_batch_allocations', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_batch_allocations_order_item_id'), 'order_batch_allocations', ['order_item_id'], unique=False)
    op.create_index(op.f('ix_order_batch_allocations_batch_id'), 'order_batch_allocations', ['batch_id'], unique=False)
    op.create_index(op.f('ix_order_batch_allocations_allocation_status'), 'order_batch_allocations', ['allocation_status'], unique=False)

    # 5. Create inventory_reservations table
    op.create_table(
        'inventory_reservations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('order_id', sa.Uuid(), nullable=False),
        sa.Column('order_item_id', sa.Uuid(), nullable=False),
        sa.Column('batch_id', sa.Uuid(), nullable=False),
        sa.Column('reserved_quantity', sa.Integer(), nullable=False),
        sa.Column('released_quantity', sa.Integer(), server_default='0', nullable=False),
        sa.Column('consumed_quantity', sa.Integer(), server_default='0', nullable=False),
        sa.Column('status', sa.String(length=30), server_default='active', nullable=False),
        sa.Column('reserved_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('released_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('reserved_quantity > 0', name='check_inv_res_qty_pos'),
        sa.CheckConstraint('released_quantity >= 0', name='check_inv_res_rel_qty_non_neg'),
        sa.CheckConstraint('consumed_quantity >= 0', name='check_inv_res_con_qty_non_neg'),
        sa.CheckConstraint('released_quantity + consumed_quantity <= reserved_quantity', name='check_inv_res_qty_sum_valid'),
        sa.ForeignKeyConstraint(['batch_id'], ['inventory_batches.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_inventory_reservations_order_id'), 'inventory_reservations', ['order_id'], unique=False)
    op.create_index(op.f('ix_inventory_reservations_order_item_id'), 'inventory_reservations', ['order_item_id'], unique=False)
    op.create_index(op.f('ix_inventory_reservations_batch_id'), 'inventory_reservations', ['batch_id'], unique=False)
    op.create_index(op.f('ix_inventory_reservations_status'), 'inventory_reservations', ['status'], unique=False)
    op.create_index('ix_inv_reservations_status_batch', 'inventory_reservations', ['status', 'batch_id'], unique=False)

    # 6. Create order_cancellations table
    op.create_table(
        'order_cancellations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('order_id', sa.Uuid(), nullable=False),
        sa.Column('requested_by_id', sa.Uuid(), nullable=True),
        sa.Column('cancellation_reason', sa.Text(), nullable=False),
        sa.Column('cancellation_type', sa.String(length=50), server_default='customer_requested', nullable=False),
        sa.Column('approved_by_id', sa.Uuid(), nullable=True),
        sa.Column('cancellation_status', sa.String(length=30), server_default='completed', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id', name='uq_order_cancellations_order_id'),
    )
    op.create_index(op.f('ix_order_cancellations_order_id'), 'order_cancellations', ['order_id'], unique=True)

    # 7. Create invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('order_id', sa.Uuid(), nullable=False),
        sa.Column('invoice_number', sa.String(length=50), nullable=False),
        sa.Column('invoice_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('invoice_type', sa.String(length=30), server_default='tax_invoice', nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('discount_total', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_total', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('delivery_fee', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('grand_total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('document_storage_key', sa.String(length=500), nullable=True),
        sa.Column('pharmacy_details_snapshot', json_type, nullable=False),
        sa.Column('customer_details_snapshot', json_type, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('grand_total >= 0', name='check_invoice_grand_total_non_neg'),
        sa.CheckConstraint('subtotal >= 0', name='check_invoice_subtotal_non_neg'),
        sa.CheckConstraint('tax_total >= 0', name='check_invoice_tax_non_neg'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id', name='uq_invoices_order_id'),
    )
    op.create_index(op.f('ix_invoices_invoice_number'), 'invoices', ['invoice_number'], unique=True)
    op.create_index(op.f('ix_invoices_order_id'), 'invoices', ['order_id'], unique=True)

    # 8. Create order_idempotency_records table
    op.create_table(
        'order_idempotency_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('idempotency_key', sa.String(length=255), nullable=False),
        sa.Column('customer_id', sa.Uuid(), nullable=False),
        sa.Column('request_hash', sa.String(length=64), nullable=False),
        sa.Column('order_id', sa.Uuid(), nullable=True),
        sa.Column('response_payload', json_type, nullable=True),
        sa.Column('status', sa.String(length=30), server_default='processing', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key', 'customer_id', name='uq_order_idempotency_key_customer'),
    )
    op.create_index(op.f('ix_order_idempotency_records_idempotency_key'), 'order_idempotency_records', ['idempotency_key'], unique=False)
    op.create_index(op.f('ix_order_idempotency_records_customer_id'), 'order_idempotency_records', ['customer_id'], unique=False)
    op.create_index(op.f('ix_order_idempotency_records_expires_at'), 'order_idempotency_records', ['expires_at'], unique=False)


def downgrade() -> None:
    op.drop_table('order_idempotency_records')
    op.drop_table('invoices')
    op.drop_table('order_cancellations')
    op.drop_table('inventory_reservations')
    op.drop_table('order_batch_allocations')

    op.drop_column('order_status_history', 'reason')
    op.drop_column('order_status_history', 'actor_role')

    op.drop_column('order_items', 'prescription_required')
    op.drop_column('order_items', 'taxable_amount')
    op.drop_column('order_items', 'discount_amount')
    op.drop_column('order_items', 'pack_size_snapshot')
    op.drop_column('order_items', 'strength_snapshot')

    op.drop_index(op.f('ix_orders_idempotency_key'), table_name='orders')
    op.drop_column('orders', 'idempotency_key')
    op.drop_column('orders', 'completed_at')
    op.drop_column('orders', 'cancelled_at')
    op.drop_column('orders', 'confirmed_at')
    op.drop_column('orders', 'placed_at')
    op.drop_column('orders', 'currency')
