import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkout import CheckoutSetting, ServiceablePincode
from app.repositories.serviceability_repository import ServiceabilityRepository
from app.schemas.serviceability import (
    CheckoutSettingsResponse,
    CheckoutSettingsUpdate,
    ServiceabilityCheckResponse,
    ServiceablePincodeCreate,
    ServiceablePincodeResponse,
    ServiceablePincodeUpdate,
)


class ServiceabilityService:
    """Service governing delivery area serviceability checks and checkout rules."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ServiceabilityRepository(db)

    async def check_pincode_serviceability(self, pincode: str) -> ServiceabilityCheckResponse:
        """
        Evaluate if a given Indian postal code falls within the pharmacy's delivery geofence.
        """
        clean_pin = pincode.strip()
        pin_record = await self.repo.get_by_pincode(clean_pin)

        if not pin_record or not pin_record.is_active:
            return ServiceabilityCheckResponse(
                pincode=clean_pin,
                is_serviceable=False,
                message=f"PIN code {clean_pin} is currently outside our immediate delivery network.",
            )

        return ServiceabilityCheckResponse(
            pincode=clean_pin,
            is_serviceable=True,
            city=pin_record.city,
            state=pin_record.state,
            area_name=pin_record.area_name,
            estimated_delivery_hours=pin_record.estimated_delivery_hours,
            message=f"Express delivery available in {pin_record.area_name or pin_record.city} within {pin_record.estimated_delivery_hours} hours.",
        )

    async def get_settings(self) -> CheckoutSettingsResponse:
        """Fetch current pharmacy checkout configuration."""
        settings = await self.repo.get_or_create_settings()
        _, count = await self.repo.list_pincodes(is_active=True, page_size=1)
        resp = CheckoutSettingsResponse.model_validate(settings)
        resp.serviceable_pincodes_count = count
        return resp

    async def update_settings(
        self, data: CheckoutSettingsUpdate, acting_user_id: Optional[uuid.UUID] = None
    ) -> CheckoutSettingsResponse:
        """Update checkout configuration (Admin only)."""
        settings = await self.repo.update_settings(data, acting_user_id=acting_user_id)
        _, count = await self.repo.list_pincodes(is_active=True, page_size=1)
        resp = CheckoutSettingsResponse.model_validate(settings)
        resp.serviceable_pincodes_count = count
        return resp

    async def list_serviceable_pincodes(
        self,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[ServiceablePincodeResponse], int]:
        """List serviceable PIN codes."""
        records, total = await self.repo.list_pincodes(
            is_active=is_active,
            search=search,
            page=page,
            page_size=page_size,
        )
        return [ServiceablePincodeResponse.model_validate(r) for r in records], total

    async def create_serviceable_pincode(self, data: ServiceablePincodeCreate) -> ServiceablePincodeResponse:
        """Add new postal code to service zone."""
        existing = await self.repo.get_by_pincode(data.pincode)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "message": f"PIN code {data.pincode} is already configured in the serviceability matrix.",
                    "error": {"code": "PINCODE_ALREADY_EXISTS"},
                },
            )
        pin = await self.repo.create_pincode(data)
        return ServiceablePincodeResponse.model_validate(pin)

    async def update_serviceable_pincode(
        self, pincode_id: uuid.UUID, data: ServiceablePincodeUpdate
    ) -> ServiceablePincodeResponse:
        """Update existing PIN code configuration."""
        pin = await self.repo.get_by_id(pincode_id)
        if not pin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Serviceable PIN code entry not found.",
                    "error": {"code": "PINCODE_NOT_FOUND"},
                },
            )
        pin = await self.repo.update_pincode(pin, data)
        return ServiceablePincodeResponse.model_validate(pin)

    async def delete_serviceable_pincode(self, pincode_id: uuid.UUID) -> None:
        """Remove a PIN code from service zone."""
        pin = await self.repo.get_by_id(pincode_id)
        if not pin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Serviceable PIN code entry not found.",
                    "error": {"code": "PINCODE_NOT_FOUND"},
                },
            )
        await self.repo.delete_pincode(pin)
