import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.address import UserAddress
from app.models.role import Role, UserRole
from app.models.staff import PharmacistProfile, StaffProfile
from app.models.user import User, UserProfile


class UserRepository:
    """Async database operations for User and UserProfile models."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Fetch user by primary key with roles and profile loaded."""
        stmt = (
            select(User)
            .options(
                selectinload(User.profile),
                selectinload(User.user_roles).selectinload(UserRole.role),
                selectinload(User.pharmacist_profile),
                selectinload(User.staff_profile),
            )
            .where(User.id == user_id, User.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_phone(self, phone: str) -> Optional[User]:
        """Fetch user by unique phone number."""
        stmt = (
            select(User)
            .options(
                selectinload(User.profile),
                selectinload(User.user_roles).selectinload(UserRole.role),
                selectinload(User.pharmacist_profile),
                selectinload(User.staff_profile),
            )
            .where(User.phone == phone, User.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by unique email address."""
        if not email:
            return None
        stmt = (
            select(User)
            .options(
                selectinload(User.profile),
                selectinload(User.user_roles).selectinload(UserRole.role),
                selectinload(User.pharmacist_profile),
                selectinload(User.staff_profile),
            )
            .where(User.email == email.lower(), User.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_user(
        self,
        phone: str,
        hashed_password: Optional[str] = None,
        full_name: Optional[str] = None,
        email: Optional[str] = None,
        is_phone_verified: bool = False,
        is_email_verified: bool = False,
    ) -> User:
        """Create a new user record with default profile."""
        user = User(
            phone=phone,
            email=email.lower() if email else None,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_phone_verified=is_phone_verified,
            is_email_verified=is_email_verified,
            status="active",
        )
        self.db.add(user)
        await self.db.flush()

        # Initialize empty customer profile
        profile = UserProfile(user_id=user.id)
        self.db.add(profile)
        await self.db.flush()
        return user

    async def assign_role(self, user_id: uuid.UUID, role_id: uuid.UUID, assigned_by_id: Optional[uuid.UUID] = None) -> UserRole:
        """Assign a role to a user."""
        assignment = UserRole(
            user_id=user_id,
            role_id=role_id,
            assigned_by_id=assigned_by_id,
        )
        self.db.add(assignment)
        await self.db.flush()
        return assignment

    async def get_user_role_slugs(self, user: User) -> List[str]:
        """Extract role slugs for the user."""
        if not user.user_roles:
            return []
        return [ur.role.slug for ur in user.user_roles if ur.role]

    async def get_addresses(self, user_id: uuid.UUID) -> List[UserAddress]:
        """Fetch user delivery addresses."""
        stmt = select(UserAddress).where(UserAddress.user_id == user_id).order_id(UserAddress.is_default.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

