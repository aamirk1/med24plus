import uuid
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkout import CheckoutSetting, ServiceablePincode
from app.schemas.serviceability import (
    CheckoutSettingsUpdate,
    ServiceablePincodeCreate,
    ServiceablePincodeUpdate,
)


class ServiceabilityRepository:
    """Async repository for delivery geofencing and checkout operational settings."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =========================================================================
    # Pincode Serviceability
    # =========================================================================

    async def get_by_pincode(self, pincode: str) -> Optional[ServiceablePincode]:
        """Find serviceable pincode record."""
        stmt = select(ServiceablePincode).where(ServiceablePincode.pincode == pincode.strip())
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_active_by_pincode(self, pincode: str) -> Optional[ServiceablePincode]:
        """Find active serviceable pincode record."""
        stmt = select(ServiceablePincode).where(
            ServiceablePincode.pincode == pincode.strip(),
            ServiceablePincode.is_active == True,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, pincode_id: uuid.UUID) -> Optional[ServiceablePincode]:
        """Fetch serviceable pincode by primary key."""
        stmt = select(ServiceablePincode).where(ServiceablePincode.id == pincode_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_pincodes(
        self,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[ServiceablePincode], int]:
        """List and search serviceable pincodes with pagination."""
        stmt = select(ServiceablePincode)
        if is_active is not None:
            stmt = stmt.where(ServiceablePincode.is_active == is_active)
        if search:
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                (ServiceablePincode.pincode.ilike(term))
                | (ServiceablePincode.area_name.ilike(term))
                | (ServiceablePincode.city.ilike(term))
            )

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = (await self.db.execute(count_stmt)).scalar() or 0

        # Paginate
        stmt = stmt.order_by(ServiceablePincode.pincode.asc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count

    async def create_pincode(self, data: ServiceablePincodeCreate) -> ServiceablePincode:
        """Add new serviceable pincode."""
        pin = ServiceablePincode(
            pincode=data.pincode.strip(),
            area_name=data.area_name.strip() if data.area_name else None,
            city=data.city.strip(),
            state=data.state.strip(),
            is_active=data.is_active,
            estimated_delivery_hours=data.estimated_delivery_hours,
            min_order_value=data.min_order_value,
        )
        self.db.add(pin)
        await self.db.flush()
        return pin

    async def update_pincode(
        self, pin: ServiceablePincode, data: ServiceablePincodeUpdate
    ) -> ServiceablePincode:
        """Update pincode configuration."""
        if data.area_name is not None:
            pin.area_name = data.area_name.strip() if data.area_name else None
        if data.city is not None:
            pin.city = data.city.strip()
        if data.state is not None:
            pin.state = data.state.strip()
        if data.is_active is not None:
            pin.is_active = data.is_active
        if data.estimated_delivery_hours is not None:
            pin.estimated_delivery_hours = data.estimated_delivery_hours
        if data.min_order_value is not None:
            pin.min_order_value = data.min_order_value

        await self.db.flush()
        return pin

    async def delete_pincode(self, pin: ServiceablePincode) -> None:
        """Permanently delete a pincode entry."""
        await self.db.delete(pin)
        await self.db.flush()

    # =========================================================================
    # Checkout Operational Settings
    # =========================================================================

    async def get_or_create_settings(self) -> CheckoutSetting:
        """Retrieve existing single-row checkout settings or initialize with defaults."""
        stmt = select(CheckoutSetting).order_by(CheckoutSetting.created_at.asc())
        result = await self.db.execute(stmt)
        settings = result.scalars().first()

        if not settings:
            settings = CheckoutSetting(
                standard_delivery_fee=Decimal("40.00"),
                free_delivery_threshold=Decimal("499.00"),
                express_cold_chain_fee=Decimal("99.00"),
                minimum_cart_value=Decimal("100.00"),
                max_quantity_per_product=10,
                is_serviceability_enforced=True,
            )
            self.db.add(settings)
            await self.db.flush()

        return settings

    async def update_settings(
        self, data: CheckoutSettingsUpdate, acting_user_id: Optional[uuid.UUID] = None
    ) -> CheckoutSetting:
        """Update checkout settings."""
        settings = await self.get_or_create_settings()

        if data.standard_delivery_fee is not None:
            settings.standard_delivery_fee = data.standard_delivery_fee
        if data.free_delivery_threshold is not None:
            settings.free_delivery_threshold = data.free_delivery_threshold
        if data.express_cold_chain_fee is not None:
            settings.express_cold_chain_fee = data.express_cold_chain_fee
        if data.minimum_cart_value is not None:
            settings.minimum_cart_value = data.minimum_cart_value
        if data.max_quantity_per_product is not None:
            settings.max_quantity_per_product = data.max_quantity_per_product
        if data.is_serviceability_enforced is not None:
            settings.is_serviceability_enforced = data.is_serviceability_enforced

        if acting_user_id:
            settings.updated_by_id = acting_user_id

        await self.db.flush()
        return settings
