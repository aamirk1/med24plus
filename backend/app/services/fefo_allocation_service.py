import uuid
from datetime import date
from typing import List, Optional
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import InventoryBatch
from app.schemas.inventory import FEFOAllocatedBatch, FEFOAllocationResult


class InsufficientStockError(Exception):
    """Raised when available sellable batch stock is less than requested quantity."""
    def __init__(self, product_id: uuid.UUID, requested: int, available: int):
        self.product_id = product_id
        self.requested = requested
        self.available = available
        self.shortfall = requested - available
        super().__init__(
            f"Insufficient sellable stock for product {product_id}. "
            f"Requested {requested}, but only {available} units available in valid FEFO batches."
        )


class FEFOAllocationService:
    """
    Statutory First Expiry, First Out (FEFO) dispensing engine.
    Ensures medicine allocations always select the earliest expiring, unquarantined,
    undamaged, and non-expired batches first under Rule 65.
    """

    @staticmethod
    def calculate_allocation_from_batches(
        product_id: uuid.UUID,
        batches: List[InventoryBatch],
        requested_quantity: int,
        reference_date: Optional[date] = None,
    ) -> FEFOAllocationResult:
        """
        Pure computational FEFO allocation algorithm.
        Sorts active batches by expiry_date ascending, filters expired/quarantined units,
        and assigns requested quantity sequentially.
        """
        if requested_quantity <= 0:
            raise ValueError("Requested quantity must be a strictly positive integer.")

        today = reference_date or date.today()
        allocated_batches: List[FEFOAllocatedBatch] = []
        remaining_to_allocate = requested_quantity

        # Filter valid batches: active, expiry > today, sellable capacity > 0
        valid_batches = [
            b for b in batches
            if b.batch_status == "active"
            and b.expiry_date > today
            and (b.available_quantity - b.reserved_quantity) > 0
        ]

        # Sort by earliest expiry date first, then creation timestamp
        sorted_batches = sorted(
            valid_batches,
            key=lambda b: (b.expiry_date, getattr(b, "created_at", None) or b.id)
        )

        for batch in sorted_batches:
            if remaining_to_allocate <= 0:
                break

            sellable_in_batch = batch.available_quantity - batch.reserved_quantity
            qty_from_batch = min(remaining_to_allocate, sellable_in_batch)

            allocated_batches.append(
                FEFOAllocatedBatch(
                    batch_id=batch.id,
                    batch_number=batch.batch_number,
                    expiry_date=batch.expiry_date,
                    allocated_quantity=qty_from_batch,
                    unit_mrp=batch.batch_mrp,
                    purchase_price=batch.purchase_price,
                    storage_location=batch.storage_location,
                )
            )

            remaining_to_allocate -= qty_from_batch

        total_allocated = requested_quantity - remaining_to_allocate
        is_fully_allocated = remaining_to_allocate == 0

        return FEFOAllocationResult(
            product_id=product_id,
            requested_quantity=requested_quantity,
            total_allocated=total_allocated,
            is_fully_allocated=is_fully_allocated,
            shortfall=remaining_to_allocate if remaining_to_allocate > 0 else 0,
            batches=allocated_batches,
        )

    async def allocate_product_stock(
        self,
        db: AsyncSession,
        product_id: uuid.UUID,
        requested_quantity: int,
        lock_for_update: bool = False,
        raise_if_insufficient: bool = False,
    ) -> FEFOAllocationResult:
        """
        Database-backed FEFO allocation query.
        Queries candidate batches for a given product matching statutory criteria.
        Optional row-level locking (FOR UPDATE) is provided for transactional safety.
        """
        today = date.today()

        stmt = (
            select(InventoryBatch)
            .where(
                and_(
                    InventoryBatch.product_id == product_id,
                    InventoryBatch.batch_status == "active",
                    InventoryBatch.expiry_date > today,
                    (InventoryBatch.available_quantity - InventoryBatch.reserved_quantity) > 0,
                )
            )
            .order_by(InventoryBatch.expiry_date.asc(), InventoryBatch.created_at.asc())
        )

        if lock_for_update:
            # Row-level lock batches to prevent race conditions during concurrent stock reservations
            stmt = stmt.with_for_update()

        result = await db.execute(stmt)
        candidate_batches = list(result.scalars().all())

        allocation_result = self.calculate_allocation_from_batches(
            product_id=product_id,
            batches=candidate_batches,
            requested_quantity=requested_quantity,
            reference_date=today,
        )

        if raise_if_insufficient and not allocation_result.is_fully_allocated:
            raise InsufficientStockError(
                product_id=product_id,
                requested=requested_quantity,
                available=allocation_result.total_allocated,
            )

        return allocation_result


fefo_allocation_service = FEFOAllocationService()

