import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Permission, Role, RolePermission


class RoleRepository:
    """Async database operations for roles and permissions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_slug(self, slug: str) -> Optional[Role]:
        """Fetch role by slug with permissions loaded."""
        stmt = (
            select(Role)
            .options(
                selectinload(Role.role_permissions).selectinload(RolePermission.permission)
            )
            .where(Role.slug == slug)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_all_roles(self) -> List[Role]:
        """Fetch all roles."""
        stmt = select(Role).order_by(Role.name)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_role_if_not_exists(self, name: str, slug: str, description: Optional[str] = None) -> Role:
        """Idempotently create a role."""
        role = await self.get_by_slug(slug)
        if not role:
            role = Role(name=name, slug=slug, description=description, is_system_role=True)
            self.db.add(role)
            await self.db.flush()
        return role

    async def get_permission_by_slug(self, slug: str) -> Optional[Permission]:
        """Fetch permission by slug."""
        stmt = select(Permission).where(Permission.slug == slug)
        result = await self.db.execute(stmt)
        return result.scalars().first()

