import uuid
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import UserAddress
from app.schemas.address import AddressCreate, AddressUpdate


class AddressRepository:
    """Async database repository for customer delivery addresses."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_user(self, user_id: uuid.UUID) -> List[UserAddress]:
        """Fetch all active (non-deleted) addresses for a customer, defaults first."""
        stmt = (
            select(UserAddress)
            .where(
                UserAddress.user_id == user_id,
                UserAddress.is_deleted == False,  # noqa: E712
            )
            .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_and_user(self, address_id: uuid.UUID, user_id: uuid.UUID) -> Optional[UserAddress]:
        """Fetch a specific non-deleted address ensuring user ownership isolation."""
        stmt = select(UserAddress).where(
            UserAddress.id == address_id,
            UserAddress.user_id == user_id,
            UserAddress.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, address_id: uuid.UUID) -> Optional[UserAddress]:
        """Fetch a specific non-deleted address by ID."""
        stmt = select(UserAddress).where(
            UserAddress.id == address_id,
            UserAddress.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_default_by_user(self, user_id: uuid.UUID) -> Optional[UserAddress]:
        """Retrieve customer's designated default delivery address."""
        stmt = select(UserAddress).where(
            UserAddress.user_id == user_id,
            UserAddress.is_default == True,  # noqa: E712
            UserAddress.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def count_by_user(self, user_id: uuid.UUID) -> int:
        """Count active addresses for a customer."""
        stmt = select(UserAddress).where(
            UserAddress.user_id == user_id,
            UserAddress.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return len(result.scalars().all())

    async def unset_default_for_user(self, user_id: uuid.UUID) -> None:
        """Clear default flag on all customer addresses."""
        stmt = (
            update(UserAddress)
            .where(UserAddress.user_id == user_id)
            .values(is_default=False)
        )
        await self.db.execute(stmt)

    async def create(self, user_id: uuid.UUID, data: AddressCreate) -> UserAddress:
        """Persist a new address record."""
        # If this is the user's first address or is marked default, unset other defaults
        existing_count = await self.count_by_user(user_id)
        is_default = data.is_default or (existing_count == 0)

        if is_default:
            await self.unset_default_for_user(user_id)

        address = UserAddress(
            user_id=user_id,
            recipient_name=data.recipient_name.strip(),
            recipient_phone=data.phone.strip(),
            address_line1=data.address_line1.strip(),
            address_line2=data.address_line2.strip() if data.address_line2 else None,
            landmark=data.landmark.strip() if data.landmark else None,
            city=data.city.strip(),
            state=data.state.strip(),
            pincode=data.pincode.strip(),
            address_type=data.address_type,
            is_default=is_default,
        )
        self.db.add(address)
        await self.db.flush()
        return address

    async def update(self, address: UserAddress, data: AddressUpdate) -> UserAddress:
        """Update address fields."""
        if data.is_default is True and not address.is_default:
            await self.unset_default_for_user(address.user_id)
            address.is_default = True
        elif data.is_default is False and address.is_default:
            address.is_default = False

        if data.recipient_name is not None:
            address.recipient_name = data.recipient_name.strip()
        if data.phone is not None:
            address.recipient_phone = data.phone.strip()
        if data.address_line1 is not None:
            address.address_line1 = data.address_line1.strip()
        if data.address_line2 is not None:
            address.address_line2 = data.address_line2.strip() if data.address_line2 else None
        if data.landmark is not None:
            address.landmark = data.landmark.strip() if data.landmark else None
        if data.city is not None:
            address.city = data.city.strip()
        if data.state is not None:
            address.state = data.state.strip()
        if data.pincode is not None:
            address.pincode = data.pincode.strip()
        if data.address_type is not None:
            address.address_type = data.address_type

        await self.db.flush()
        return address

    async def set_default(self, address: UserAddress) -> UserAddress:
        """Set address as default and unset all others."""
        await self.unset_default_for_user(address.user_id)
        address.is_default = True
        await self.db.flush()
        await self.db.refresh(address)
        return address

    async def soft_delete(self, address: UserAddress) -> None:
        """Soft delete address."""
        from datetime import datetime
        address.is_deleted = True
        address.deleted_at = datetime.utcnow()
        await self.db.flush()
