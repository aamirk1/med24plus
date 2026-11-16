import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate
from app.schemas.common import APIResponse
from app.services.address_service import AddressService

router = APIRouter()


@router.get(
    "",
    response_model=APIResponse[List[AddressResponse]],
    summary="List saved customer addresses",
)
async def list_addresses(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all active delivery addresses saved for authenticated customer."""
    service = AddressService(db)
    addresses = await service.list_addresses(current_user.id)
    return APIResponse(
        success=True,
        message="Saved delivery addresses retrieved.",
        data=addresses,
    )


@router.post(
    "",
    response_model=APIResponse[AddressResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add new customer delivery address",
)
async def create_address(
    payload: AddressCreate,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new delivery address for the authenticated customer."""
    service = AddressService(db)
    address = await service.create_address(current_user.id, payload)
    await db.commit()
    return APIResponse(
        success=True,
        message="Delivery address added successfully.",
        data=address,
    )


@router.get(
    "/{address_id}",
    response_model=APIResponse[AddressResponse],
    summary="Get single customer delivery address",
)
async def get_address(
    address_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve address details ensuring strict customer ownership."""
    service = AddressService(db)
    address = await service.get_address(address_id, current_user.id)
    return APIResponse(
        success=True,
        message="Delivery address retrieved.",
        data=address,
    )


@router.patch(
    "/{address_id}",
    response_model=APIResponse[AddressResponse],
    summary="Update customer delivery address",
)
async def update_address(
    address_id: uuid.UUID,
    payload: AddressUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Update fields on an existing customer delivery address."""
    service = AddressService(db)
    address = await service.update_address(address_id, current_user.id, payload)
    await db.commit()
    return APIResponse(
        success=True,
        message="Delivery address updated successfully.",
        data=address,
    )


@router.delete(
    "/{address_id}",
    response_model=APIResponse[dict],
    summary="Delete customer delivery address",
)
async def delete_address(
    address_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete customer address."""
    service = AddressService(db)
    await service.delete_address(address_id, current_user.id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Delivery address removed successfully.",
        data={"deleted": True, "id": str(address_id)},
    )


@router.post(
    "/{address_id}/set-default",
    response_model=APIResponse[AddressResponse],
    summary="Set address as default delivery destination",
)
async def set_default_address(
    address_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Set an address as the default delivery destination for future orders."""
    service = AddressService(db)
    address = await service.set_default_address(address_id, current_user.id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Default delivery address set successfully.",
        data=address,
    )
