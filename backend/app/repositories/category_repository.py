import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.product import Product


class CategoryRepository:
    """Async database repository for Product Categories."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, category_id: uuid.UUID, load_subcategories: bool = True) -> Optional[Category]:
        """Fetch category by UUID with optional subcategories preloaded."""
        stmt = select(Category).where(Category.id == category_id, Category.is_deleted == False)  # noqa: E712
        if load_subcategories:
            stmt = stmt.options(selectinload(Category.subcategories))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        """Fetch category by unique slug."""
        stmt = (
            select(Category)
            .options(selectinload(Category.subcategories))
            .where(Category.slug == slug.lower().strip(), Category.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_name(self, name: str) -> Optional[Category]:
        """Fetch category by case-insensitive name."""
        stmt = select(Category).where(
            func.lower(Category.name) == name.lower().strip(),
            Category.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_categories(
        self,
        is_active: Optional[bool] = None,
        parent_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        only_root: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Category], int]:
        """List categories with filters and pagination."""
        stmt = select(Category).where(Category.is_deleted == False)  # noqa: E712

        if is_active is not None:
            stmt = stmt.where(Category.is_active == is_active)

        if only_root:
            stmt = stmt.where(Category.parent_id == None)  # noqa: E711
        elif parent_id is not None:
            stmt = stmt.where(Category.parent_id == parent_id)

        if search:
            search_term = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Category.name).like(search_term),
                    func.lower(Category.slug).like(search_term),
                    func.lower(Category.description).like(search_term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        # Pagination and order
        offset = (page - 1) * page_size
        stmt = (
            stmt.options(selectinload(Category.subcategories))
            .order_by(Category.sort_order.asc(), Category.name.asc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total_items

    async def count_products_in_category(self, category_id: uuid.UUID) -> int:
        """Count products referencing this category."""
        stmt = (
            select(func.count(Product.id))
            .where(Product.category_id == category_id, Product.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def has_circular_parent(self, category_id: uuid.UUID, new_parent_id: uuid.UUID) -> bool:
        """
        Check if setting new_parent_id creates a circular ancestry loop.
        Walks up the parent chain from new_parent_id to check if category_id is encountered.
        """
        if category_id == new_parent_id:
            return True

        curr_id = new_parent_id
        visited = set()
        while curr_id:
            if curr_id in visited or curr_id == category_id:
                return True
            visited.add(curr_id)
            parent_cat = await self.get_by_id(curr_id, load_subcategories=False)
            if not parent_cat or not parent_cat.parent_id:
                break
            curr_id = parent_cat.parent_id

        return False

    async def create(self, category: Category) -> Category:
        """Persist a new category."""
        self.db.add(category)
        await self.db.flush()
        category.subcategories = []
        return category

    async def update(self, category: Category) -> Category:
        """Flush changes to an existing category."""
        await self.db.flush()
        await self.db.refresh(category)
        return category

