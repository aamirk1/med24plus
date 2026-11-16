import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.checkout import CheckoutValidation


class CheckoutRepository:
    """Async database repository for checkout validation records and sessions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest_validation(
        self, customer_id: uuid.UUID, cart_id: uuid.UUID
    ) -> Optional[CheckoutValidation]:
        """Fetch most recent checkout validation record for a customer and cart."""
        stmt = (
            select(CheckoutValidation)
            .where(
                CheckoutValidation.customer_id == customer_id,
                CheckoutValidation.cart_id == cart_id,
            )
            .options(
                selectinload(CheckoutValidation.delivery_address),
            )
            .order_by(CheckoutValidation.calculated_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, validation_id: uuid.UUID) -> Optional[CheckoutValidation]:
        """Fetch checkout validation by primary key."""
        stmt = (
            select(CheckoutValidation)
            .where(CheckoutValidation.id == validation_id)
            .options(
                selectinload(CheckoutValidation.delivery_address),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def save_validation(self, validation: CheckoutValidation) -> CheckoutValidation:
        """Persist or update checkout validation record."""
        self.db.add(validation)
        await self.db.flush()
        return validation
