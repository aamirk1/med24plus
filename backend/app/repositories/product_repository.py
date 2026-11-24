import uuid
from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventory import InventoryBatch
from app.models.order import OrderItem
from app.models.product import Product, ProductAttribute, ProductImage


class ProductRepository:
    """Async database repository for Products and catalog assets."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: uuid.UUID, load_relations: bool = True) -> Optional[Product]:
        """Fetch product by primary key."""
        stmt = select(Product).where(Product.id == product_id, Product.is_deleted == False)  # noqa: E712
        if load_relations:
            stmt = stmt.options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.images),
                selectinload(Product.attributes),
            )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_slug(self, slug: str, load_relations: bool = True, include_deleted: bool = False) -> Optional[Product]:
        """Fetch product by unique slug."""
        stmt = select(Product).where(Product.slug == slug.lower().strip())
        if not include_deleted:
            stmt = stmt.where(Product.is_deleted == False)  # noqa: E712
        if load_relations:
            stmt = stmt.options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.images),
                selectinload(Product.attributes),
            )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_sku(self, sku: str) -> Optional[Product]:
        """Fetch product by unique SKU."""
        stmt = select(Product).where(
            func.lower(Product.sku) == sku.lower().strip(),
            Product.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_sellable_stock_for_products(self, product_ids: List[uuid.UUID]) -> Dict[uuid.UUID, int]:
        """
        Dynamically compute sellable physical stock directly from valid, unexpired,
        undamaged, and non-quarantined inventory batches.
        Sellable = SUM(available_quantity - reserved_quantity) where batch_status='active' and expiry > today.
        """
        if not product_ids:
            return {}

        today = date.today()
        stmt = (
            select(
                InventoryBatch.product_id,
                func.coalesce(
                    func.sum(InventoryBatch.available_quantity - InventoryBatch.reserved_quantity),
                    0,
                ).label("sellable"),
            )
            .where(
                InventoryBatch.product_id.in_(product_ids),
                InventoryBatch.batch_status == "active",
                InventoryBatch.expiry_date > today,
                (InventoryBatch.available_quantity - InventoryBatch.reserved_quantity) > 0,
            )
            .group_by(InventoryBatch.product_id)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        stock_map = {p_id: 0 for p_id in product_ids}
        for p_id, qty in rows:
            stock_map[p_id] = int(qty)
        return stock_map

    async def list_products(
        self,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        brand_id: Optional[uuid.UUID] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        prescription_required: Optional[bool] = None,
        dosage_form: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "newest",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Product], int]:
        """
        Catalog query with filtering, sorting, and pagination.
        Eagerly loads category, brand, and images to prevent N+1 queries.
        """
        stmt = select(Product).where(Product.is_deleted == False)  # noqa: E712

        if is_active is not None:
            stmt = stmt.where(Product.is_active == is_active)

        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)

        if brand_id is not None:
            stmt = stmt.where(Product.brand_id == brand_id)

        if min_price is not None:
            stmt = stmt.where(Product.selling_price >= min_price)

        if max_price is not None:
            stmt = stmt.where(Product.selling_price <= max_price)

        if prescription_required is not None:
            stmt = stmt.where(Product.requires_prescription == prescription_required)

        if dosage_form:
            stmt = stmt.where(func.lower(Product.dosage_form) == dosage_form.strip().lower())

        if search:
            search_term = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Product.name).like(search_term),
                    func.lower(Product.generic_name).like(search_term),
                    func.lower(Product.sku).like(search_term),
                    func.lower(Product.composition).like(search_term),
                    func.lower(Product.manufacturer).like(search_term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        # Sorting logic
        if sort_by == "price_asc":
            order_clause = Product.selling_price.asc()
        elif sort_by == "price_desc":
            order_clause = Product.selling_price.desc()
        elif sort_by == "name":
            order_clause = Product.name.asc()
        else:
            # Default: newest
            order_clause = Product.created_at.desc()

        offset = (page - 1) * page_size
        stmt = (
            stmt.options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.images),
            )
            .order_by(order_clause)
            .offset(offset)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total_items

    async def count_order_references(self, product_id: uuid.UUID) -> int:
        """Count statutory order items that reference this product."""
        stmt = select(func.count(OrderItem.id)).where(OrderItem.product_id == product_id)
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def create(self, product: Product) -> Product:
        """Persist a new product."""
        self.db.add(product)
        await self.db.flush()
        return product

    async def update(self, product: Product) -> Product:
        """Flush changes to existing product."""
        await self.db.flush()
        return product

    # Image helpers
    async def add_image(self, image: ProductImage) -> ProductImage:
        """Add image to product."""
        if image.is_primary:
            # Clear existing primary images for this product
            await self.db.execute(
                update(ProductImage)
                .where(ProductImage.product_id == image.product_id)
                .values(is_primary=False)
            )
        self.db.add(image)
        await self.db.flush()
        await self.db.refresh(image)
        return image

    async def get_image_by_id(self, image_id: uuid.UUID) -> Optional[ProductImage]:
        """Fetch product image record."""
        stmt = select(ProductImage).where(ProductImage.id == image_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def set_primary_image(self, product_id: uuid.UUID, image_id: uuid.UUID) -> Optional[ProductImage]:
        """Mark an image as the primary cover image for a product."""
        # Unset all primary
        await self.db.execute(
            update(ProductImage)
            .where(ProductImage.product_id == product_id)
            .values(is_primary=False)
        )
        # Set target primary
        await self.db.execute(
            update(ProductImage)
            .where(ProductImage.id == image_id, ProductImage.product_id == product_id)
            .values(is_primary=True)
        )
        return await self.get_image_by_id(image_id)

    async def delete_image(self, image: ProductImage) -> None:
        """Remove image record."""
        await self.db.delete(image)
        await self.db.flush()

    async def get_substitutes_by_generic(
        self,
        generic_name: str,
        exclude_product_id: uuid.UUID,
        limit: int = 6,
    ) -> List[Product]:
        """Fetch active products matching generic composition/name, excluding the current product."""
        term = generic_name.strip().lower()
        # Extract the core salt name (e.g. "Azithromycin" from "Azithromycin Tablets IP")
        core_term = term.replace("tablets ip", "").replace("capsules ip", "").replace("syrup", "").strip()
        search_pattern = f"%{core_term}%" if core_term else f"%{term}%"

        stmt = (
            select(Product)
            .where(
                Product.id != exclude_product_id,
                Product.is_deleted == False,
                Product.is_active == True,
                or_(
                    func.lower(Product.generic_name) == term,
                    func.lower(Product.generic_name).like(search_pattern),
                    func.lower(Product.composition).like(search_pattern),
                ),
            )
            .options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.images),
            )
            .order_by(Product.selling_price.asc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

