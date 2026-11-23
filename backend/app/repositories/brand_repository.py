import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand import Brand
from app.models.product import Product


class BrandRepository:
    """Async database repository for Pharmaceutical & Healthcare Brands."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, brand_id: uuid.UUID) -> Optional[Brand]:
        """Fetch brand by UUID."""
        stmt = (
            select(Brand)
            .where(Brand.id == brand_id, Brand.is_deleted == False)  # noqa: E712
            .execution_options(populate_existing=True)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_slug(self, slug: str) -> Optional[Brand]:
        """Fetch brand by unique slug."""
        stmt = select(Brand).where(Brand.slug == slug.lower().strip(), Brand.is_deleted == False)  # noqa: E712
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_name(self, name: str) -> Optional[Brand]:
        """Fetch brand by name (case-insensitive)."""
        stmt = select(Brand).where(
            func.lower(Brand.name) == name.lower().strip(),
            Brand.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_brands(
        self,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Brand], int]:
        """List brands with filters and pagination."""
        stmt = select(Brand).where(Brand.is_deleted == False)  # noqa: E712

        if is_active is not None:
            stmt = stmt.where(Brand.is_active == is_active)

        if search:
            search_term = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Brand.name).like(search_term),
                    func.lower(Brand.manufacturer_name).like(search_term),
                    func.lower(Brand.slug).like(search_term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        # Pagination & sorting
        offset = (page - 1) * page_size
        stmt = stmt.order_by(Brand.name.asc()).offset(offset).limit(page_size)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total_items

    async def count_products_in_brand(self, brand_id: uuid.UUID) -> int:
        """Count products referencing this brand."""
        stmt = (
            select(func.count(Product.id))
            .where(Product.brand_id == brand_id, Product.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def create(self, brand: Brand) -> Brand:
        """Persist a new brand."""
        self.db.add(brand)
        await self.db.flush()
        fresh = await self.get_by_id(brand.id)
        return fresh if fresh is not None else brand

    async def update(self, brand: Brand) -> Brand:
        """Flush changes to an existing brand."""
        await self.db.flush()
        fresh = await self.get_by_id(brand.id)
        return fresh if fresh is not None else brand

