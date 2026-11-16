"""phase7_cart_and_checkout

Revision ID: 7d3e2a1b9c8f
Revises: 6c2d1e8a4f9b
Create Date: 2026-11-16 18:00:00.000000

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7d3e2a1b9c8f'
down_revision: Union[str, None] = '6c2d1e8a4f9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB, "postgresql")


def upgrade() -> None:
    # 1. Create carts table
    op.create_table(
        'carts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('customer_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_carts_customer_id'), 'carts', ['customer_id'], unique=False)
    op.create_index(op.f('ix_carts_status'), 'carts', ['status'], unique=False)
    op.create_index('ix_carts_customer_status', 'carts', ['customer_id', 'status'], unique=False)
    op.create_index(
        'uq_carts_customer_active',
        'carts',
        ['customer_id'],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )

    # 2. Create cart_items table
    op.create_table(
        'cart_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('cart_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price_snapshot', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('quantity > 0', name='check_cart_item_quantity_positive'),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cart_id', 'product_id', name='uq_cart_items_cart_product'),
    )
    op.create_index(op.f('ix_cart_items_cart_id'), 'cart_items', ['cart_id'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)

    # 3. Create checkout_validations table
    op.create_table(
        'checkout_validations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('customer_id', sa.Uuid(), nullable=False),
        sa.Column('cart_id', sa.Uuid(), nullable=False),
        sa.Column('delivery_address_id', sa.Uuid(), nullable=True),
        sa.Column('validation_status', sa.String(length=30), server_default='valid', nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('discount_total', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_total', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('delivery_fee', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('grand_total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('validation_errors', json_type, server_default='[]', nullable=False),
        sa.Column('item_validations', json_type, server_default='[]', nullable=False),
        sa.Column('tax_breakdown', json_type, server_default='{}', nullable=False),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['delivery_address_id'], ['user_addresses.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_checkout_validations_cart_id'), 'checkout_validations', ['cart_id'], unique=False)
    op.create_index(op.f('ix_checkout_validations_customer_id'), 'checkout_validations', ['customer_id'], unique=False)
    op.create_index(op.f('ix_checkout_validations_expires_at'), 'checkout_validations', ['expires_at'], unique=False)
    op.create_index('ix_checkout_validations_cust_cart', 'checkout_validations', ['customer_id', 'cart_id'], unique=False)

    # 4. Create serviceable_pincodes table
    op.create_table(
        'serviceable_pincodes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('pincode', sa.String(length=10), nullable=False),
        sa.Column('area_name', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), server_default='Bengaluru', nullable=False),
        sa.Column('state', sa.String(length=100), server_default='Karnataka', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('estimated_delivery_hours', sa.Integer(), server_default='4', nullable=False),
        sa.Column('min_order_value', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pincode', name='uq_serviceable_pincodes_pincode'),
    )
    op.create_index(op.f('ix_serviceable_pincodes_is_active'), 'serviceable_pincodes', ['is_active'], unique=False)
    op.create_index(op.f('ix_serviceable_pincodes_pincode'), 'serviceable_pincodes', ['pincode'], unique=False)

    # 5. Create checkout_settings table
    op.create_table(
        'checkout_settings',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('standard_delivery_fee', sa.Numeric(precision=12, scale=2), server_default='40.00', nullable=False),
        sa.Column('free_delivery_threshold', sa.Numeric(precision=12, scale=2), server_default='499.00', nullable=False),
        sa.Column('express_cold_chain_fee', sa.Numeric(precision=12, scale=2), server_default='99.00', nullable=False),
        sa.Column('minimum_cart_value', sa.Numeric(precision=12, scale=2), server_default='100.00', nullable=False),
        sa.Column('max_quantity_per_product', sa.Integer(), server_default='10', nullable=False),
        sa.Column('is_serviceability_enforced', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('updated_by_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # 6. Seed initial checkout setting record
    op.execute(
        sa.text(
            f"""
            INSERT INTO checkout_settings (
                id, standard_delivery_fee, free_delivery_threshold, express_cold_chain_fee,
                minimum_cart_value, max_quantity_per_product, is_serviceability_enforced,
                created_at, updated_at
            ) VALUES (
                '{uuid.uuid4()}', 40.00, 499.00, 99.00, 100.00, 10, true, now(), now()
            )
            """
        )
    )

    # 7. Seed initial Bengaluru serviceable pincodes
    pincodes_seed = [
        ("560001", "Bangalore GPO / MG Road"),
        ("560002", "City Market / Kalasipalyam"),
        ("560003", "Malleswaram"),
        ("560004", "Basavanagudi"),
        ("560008", "Ulsoor"),
        ("560025", "Richmond Town"),
        ("560034", "Koramangala"),
        ("560038", "Indiranagar"),
        ("560076", "BTM Layout"),
        ("560095", "Koramangala 8th Block"),
        ("560100", "Electronic City"),
        ("560102", "HSR Layout"),
        ("560103", "Bellandur"),
    ]
    for pin, area in pincodes_seed:
        op.execute(
            sa.text(
                f"""
                INSERT INTO serviceable_pincodes (
                    id, pincode, area_name, city, state, is_active,
                    estimated_delivery_hours, min_order_value, created_at, updated_at
                ) VALUES (
                    '{uuid.uuid4()}', '{pin}', '{area}', 'Bengaluru', 'Karnataka', true,
                    4, 0.00, now(), now()
                )
                """
            )
        )


def downgrade() -> None:
    op.drop_table('checkout_settings')
    op.drop_index(op.f('ix_serviceable_pincodes_pincode'), table_name='serviceable_pincodes')
    op.drop_index(op.f('ix_serviceable_pincodes_is_active'), table_name='serviceable_pincodes')
    op.drop_table('serviceable_pincodes')
    op.drop_index('ix_checkout_validations_cust_cart', table_name='checkout_validations')
    op.drop_index(op.f('ix_checkout_validations_expires_at'), table_name='checkout_validations')
    op.drop_index(op.f('ix_checkout_validations_customer_id'), table_name='checkout_validations')
    op.drop_index(op.f('ix_checkout_validations_cart_id'), table_name='checkout_validations')
    op.drop_table('checkout_validations')
    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_cart_id'), table_name='cart_items')
    op.drop_table('cart_items')
    op.drop_index('uq_carts_customer_active', table_name='carts')
    op.drop_index('ix_carts_customer_status', table_name='carts')
    op.drop_index(op.f('ix_carts_status'), table_name='carts')
    op.drop_index(op.f('ix_carts_customer_id'), table_name='carts')
    op.drop_table('carts')
