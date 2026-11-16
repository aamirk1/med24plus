import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.serviceability import (
    CheckoutSettingsResponse,
    CheckoutSettingsUpdate,
    ServiceablePincodeCreate,
    ServiceablePincodeResponse,
    ServiceablePincodeUpdate,
)
from app.services.serviceability_service import ServiceabilityService

router = APIRouter()

ADMIN_STAFF_ROLES = [RoleEnum.SUPER_ADMIN.value, RoleEnum.ADMIN.value, RoleEnum.STAFF.value]
ADMIN_ONLY_ROLES = [RoleEnum.SUPER_ADMIN.value, RoleEnum.ADMIN.value]


@router.get(
    "/checkout-settings",
    response_model=APIResponse[CheckoutSettingsResponse],
    summary="Get pharmacy checkout configuration",
)
async def get_admin_checkout_settings(
    current_user: User = Depends(require_role(*ADMIN_STAFF_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve operational settings including delivery fees, free delivery tiers, and item limits."""
    service = ServiceabilityService(db)
    settings = await service.get_settings()
    return APIResponse(
        success=True,
        message="Checkout settings retrieved.",
        data=settings,
    )


@router.patch(
    "/checkout-settings",
    response_model=APIResponse[CheckoutSettingsResponse],
    summary="Update pharmacy checkout configuration",
)
async def update_admin_checkout_settings(
    payload: CheckoutSettingsUpdate,
    current_user: User = Depends(require_role(*ADMIN_ONLY_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Modify delivery charges, free delivery thresholds, or maximum quantity constraints."""
    service = ServiceabilityService(db)
    settings = await service.update_settings(payload, acting_user_id=current_user.id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Checkout settings updated successfully.",
        data=settings,
    )


@router.get(
    "/serviceability",
    response_model=APIResponse[List[ServiceablePincodeResponse]],
    summary="List serviceable delivery PIN codes",
)
async def list_serviceable_pincodes(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search pincode, city, or area"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_role(*ADMIN_STAFF_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """List and search postal codes configured within the pharmacy's delivery geofence."""
    service = ServiceabilityService(db)
    pincodes, total = await service.list_serviceable_pincodes(
        is_active=is_active,
        search=search,
        page=page,
        page_size=page_size,
    )
    return APIResponse(
        success=True,
        message="Serviceable PIN codes retrieved.",
        data=pincodes,
    )


@router.post(
    "/serviceability",
    response_model=APIResponse[ServiceablePincodeResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add new serviceable delivery PIN code",
)
async def create_serviceable_pincode(
    payload: ServiceablePincodeCreate,
    current_user: User = Depends(require_role(*ADMIN_ONLY_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Add a new Indian postal code to the pharmacy's express delivery zone."""
    service = ServiceabilityService(db)
    pincode = await service.create_serviceable_pincode(payload)
    await db.commit()
    return APIResponse(
        success=True,
        message="Serviceable PIN code added successfully.",
        data=pincode,
    )


@router.patch(
    "/serviceability/{pincode_id}",
    response_model=APIResponse[ServiceablePincodeResponse],
    summary="Update serviceable delivery PIN code",
)
async def update_serviceable_pincode(
    pincode_id: uuid.UUID,
    payload: ServiceablePincodeUpdate,
    current_user: User = Depends(require_role(*ADMIN_ONLY_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Modify turnaround hours, area name, or active status of a delivery PIN code."""
    service = ServiceabilityService(db)
    pincode = await service.update_serviceable_pincode(pincode_id, payload)
    await db.commit()
    return APIResponse(
        success=True,
        message="Serviceable PIN code updated successfully.",
        data=pincode,
    )


@router.delete(
    "/serviceability/{pincode_id}",
    response_model=APIResponse[dict],
    summary="Delete serviceable delivery PIN code",
)
async def delete_serviceable_pincode(
    pincode_id: uuid.UUID,
    current_user: User = Depends(require_role(*ADMIN_ONLY_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Remove a postal code from the delivery serviceability network."""
    service = ServiceabilityService(db)
    await service.delete_serviceable_pincode(pincode_id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Serviceable PIN code removed successfully.",
        data={"deleted": True, "id": str(pincode_id)},
    )
