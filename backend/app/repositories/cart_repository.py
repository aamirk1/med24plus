import uuid
from decimal import Decimal
from typing import Optional
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart, CartItem
from app.models.product import Product


class CartRepository:
    """Async database repository for shopping cart operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_cart(
        self, customer_id: uuid.UUID, load_items: bool = True
    ) -> Optional[Cart]:
        """Fetch customer's currently active shopping cart with eager-loaded items and products."""
        stmt = (
            select(Cart)
            .where(
                Cart.customer_id == customer_id,
                Cart.status == "active",
            )
            .execution_options(populate_existing=True)
        )
        if load_items:
            stmt = stmt.options(
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.category),
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.brand),
            )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_or_create_active_cart(self, customer_id: uuid.UUID) -> Cart:
        """Retrieve existing active cart or initialize a fresh active cart."""
        cart = await self.get_active_cart(customer_id, load_items=True)
        if not cart:
            cart = Cart(
                customer_id=customer_id,
                status="active",
            )
            self.db.add(cart)
            await self.db.flush()
            # Re-fetch with relationships loaded
            cart = await self.get_active_cart(customer_id, load_items=True)
        return cart

    async def get_cart_item(
        self, cart_id: uuid.UUID, item_id: uuid.UUID
    ) -> Optional[CartItem]:
        """Fetch specific cart item by ID ensuring cart scoping."""
        stmt = (
            select(CartItem)
            .where(
                CartItem.id == item_id,
                CartItem.cart_id == cart_id,
            )
            .options(
                selectinload(CartItem.product).selectinload(Product.images),
                selectinload(CartItem.product).selectinload(Product.category),
                selectinload(CartItem.product).selectinload(Product.brand),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_cart_item_by_product(
        self, cart_id: uuid.UUID, product_id: uuid.UUID
    ) -> Optional[CartItem]:
        """Find existing cart item for a product to merge quantities."""
        stmt = (
            select(CartItem)
            .where(
                CartItem.cart_id == cart_id,
                CartItem.product_id == product_id,
            )
            .options(
                selectinload(CartItem.product),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def add_item(
        self,
        cart: Cart,
        product_id: uuid.UUID,
        quantity: int,
        unit_price_snapshot: Decimal,
    ) -> CartItem:
        """Create new cart item with price snapshot."""
        item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
            unit_price_snapshot=unit_price_snapshot,
        )
        self.db.add(item)
        await self.db.flush()
        return item

    async def update_item_quantity(self, item: CartItem, quantity: int) -> CartItem:
        """Update cart item quantity."""
        item.quantity = quantity
        await self.db.flush()
        return item

    async def remove_item(self, item: CartItem) -> None:
        """Delete single cart item."""
        await self.db.delete(item)
        await self.db.flush()

    async def clear_cart(self, cart_id: uuid.UUID) -> None:
        """Delete all items in a cart."""
        stmt = delete(CartItem).where(CartItem.cart_id == cart_id)
        await self.db.execute(stmt)
        await self.db.flush()

    async def update_snapshot_price(self, item: CartItem, new_price: Decimal) -> None:
        """Refresh price snapshot when acknowledged by user."""
        item.unit_price_snapshot = new_price
        await self.db.flush()
        