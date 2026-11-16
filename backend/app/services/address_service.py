import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import UserAddress
from app.repositories.address_repository import AddressRepository
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate


class AddressService:
    """Service managing customer delivery destinations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AddressRepository(db)

    async def list_addresses(self, user_id: uuid.UUID) -> List[AddressResponse]:
        """Fetch all saved addresses for a customer."""
        addresses = await self.repo.list_by_user(user_id)
        return [AddressResponse.model_validate(a) for a in addresses]

    async def get_address(self, address_id: uuid.UUID, user_id: uuid.UUID) -> AddressResponse:
        """Fetch specific address ensuring customer ownership."""
        addr = await self.repo.get_by_id_and_user(address_id, user_id)
        if not addr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Delivery address not found or does not belong to you.",
                    "error": {"code": "ADDRESS_NOT_FOUND"},
                },
            )
        return AddressResponse.model_validate(addr)

    async def create_address(self, user_id: uuid.UUID, data: AddressCreate) -> AddressResponse:
        """Create new delivery address."""
        addr = await self.repo.create(user_id, data)
        return AddressResponse.model_validate(addr)

    async def update_address(
        self, address_id: uuid.UUID, user_id: uuid.UUID, data: AddressUpdate
    ) -> AddressResponse:
        """Update existing delivery address."""
        addr = await self.repo.get_by_id_and_user(address_id, user_id)
        if not addr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Delivery address not found or does not belong to you.",
                    "error": {"code": "ADDRESS_NOT_FOUND"},
                },
            )
        updated = await self.repo.update(addr, data)
        return AddressResponse.model_validate(updated)

    async def set_default_address(self, address_id: uuid.UUID, user_id: uuid.UUID) -> AddressResponse:
        """Set address as default delivery destination."""
        addr = await self.repo.get_by_id_and_user(address_id, user_id)
        if not addr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Delivery address not found or does not belong to you.",
                    "error": {"code": "ADDRESS_NOT_FOUND"},
                },
            )
        updated = await self.repo.set_default(addr)
        return AddressResponse.model_validate(updated)

    async def delete_address(self, address_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Soft delete delivery address."""
        addr = await self.repo.get_by_id_and_user(address_id, user_id)
        if not addr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Delivery address not found or does not belong to you.",
                    "error": {"code": "ADDRESS_NOT_FOUND"},
                },
            )
        await self.repo.soft_delete(addr)
