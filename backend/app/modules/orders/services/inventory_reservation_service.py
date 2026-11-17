from datetime import datetime, timezone
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Inventory, InventoryBatch, StockMovement
from app.models.order import (
    InventoryReservation,
    OrderBatchAllocation,
    OrderItem,
)


class ReservationError(Exception):
    """Raised when reservation state transition fails business or quantity invariants."""
    pass


class InventoryReservationService:
    """
    Manages statutory batch reservation lifecycle, concurrency protection,
    FEFO allocation persistence, and double-entry stock movement audits.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def reserve_batch_stock(
        self,
        order_id: uuid.UUID,
        order_item_id: uuid.UUID,
        batch_id: uuid.UUID,
        product_id: uuid.UUID,
        quantity: int,
        acting_user_id: Optional[uuid.UUID] = None,
    ) -> Tuple[OrderBatchAllocation, InventoryReservation]:
        """
        Create batch allocation and reservation with row-level locking.
        Increments reserved_quantity on InventoryBatch and Inventory.
        """
        if quantity <= 0:
            raise ReservationError("Reservation quantity must be strictly positive.")

        # Row-level lock batch
        stmt = select(InventoryBatch).where(InventoryBatch.id == batch_id).with_for_update()
        res = await self.db.execute(stmt)
        batch = res.scalars().first()
        if not batch:
            raise ReservationError(f"Batch {batch_id} not found.")

        sellable = batch.available_quantity - batch.reserved_quantity
        if sellable < quantity:
            raise ReservationError(
                f"Concurrent reservation conflict on batch {batch.batch_number}: "
                f"only {sellable} available, requested {quantity}."
            )

        # Update batch reservation
        batch.reserved_quantity += quantity

        # Update aggregate inventory
        inv_stmt = select(Inventory).where(Inventory.product_id == product_id).with_for_update()
        inv_res = await self.db.execute(inv_stmt)
        inv = inv_res.scalars().first()
        if inv:
            inv.total_reserved_quantity += quantity

        now_utc = datetime.now(timezone.utc)

        # Create allocation
        alloc = OrderBatchAllocation(
            order_id=order_id,
            order_item_id=order_item_id,
            batch_id=batch_id,
            allocated_quantity=quantity,
            released_quantity=0,
            consumed_quantity=0,
            allocation_status="allocated",
        )
        self.db.add(alloc)

        # Create reservation
        reservation = InventoryReservation(
            order_id=order_id,
            order_item_id=order_item_id,
            batch_id=batch_id,
            reserved_quantity=quantity,
            released_quantity=0,
            consumed_quantity=0,
            status="active",
            reserved_at=now_utc,
        )
        self.db.add(reservation)

        # Record stock movement audit
        balance_after = batch.available_quantity - batch.reserved_quantity
        movement = StockMovement(
            batch_id=batch.id,
            product_id=product_id,
            movement_type="STOCK_RESERVED",
            quantity=quantity,
            balance_after=balance_after,
            reference_type="order",
            reference_id=order_id,
            performed_by_id=acting_user_id,
            notes=f"FEFO allocation of {quantity} units for Order Item {order_item_id}",
        )
        self.db.add(movement)

        return alloc, reservation

    async def release_reservations_for_order(
        self,
        order_id: uuid.UUID,
        acting_user_id: Optional[uuid.UUID] = None,
        reason: Optional[str] = None,
    ) -> int:
        """
        Release all active, unconsumed reservations for an order (e.g. upon cancellation or pharmacist rejection).
        Restores batch availability and records stock movement.
        """
        stmt = (
            select(InventoryReservation)
            .where(
                InventoryReservation.order_id == order_id,
                InventoryReservation.status.in_(["active", "partially_released"]),
            )
            .with_for_update()
        )
        res = await self.db.execute(stmt)
        reservations = list(res.scalars().all())

        total_released = 0
        now_utc = datetime.now(timezone.utc)

        for r in reservations:
            remaining_to_release = r.reserved_quantity - r.released_quantity - r.consumed_quantity
            if remaining_to_release <= 0:
                continue

            # Lock batch
            batch_stmt = select(InventoryBatch).where(InventoryBatch.id == r.batch_id).with_for_update()
            batch_res = await self.db.execute(batch_stmt)
            batch = batch_res.scalars().first()
            if batch:
                batch.reserved_quantity = max(0, batch.reserved_quantity - remaining_to_release)

                # Update aggregate inventory
                inv_stmt = select(Inventory).where(Inventory.product_id == batch.product_id).with_for_update()
                inv_res = await self.db.execute(inv_stmt)
                inv = inv_res.scalars().first()
                if inv:
                    inv.total_reserved_quantity = max(0, inv.total_reserved_quantity - remaining_to_release)

                # Record stock movement
                balance_after = batch.available_quantity - batch.reserved_quantity
                movement = StockMovement(
                    batch_id=batch.id,
                    product_id=batch.product_id,
                    movement_type="RESERVATION_RELEASED",
                    quantity=remaining_to_release,
                    balance_after=balance_after,
                    reference_type="order",
                    reference_id=order_id,
                    performed_by_id=acting_user_id,
                    notes=f"Released {remaining_to_release} reserved units: {reason or 'Order cancelled'}",
                )
                self.db.add(movement)

            # Update reservation status
            r.released_quantity += remaining_to_release
            r.status = "released"
            r.released_at = now_utc

            total_released += remaining_to_release

        # Also mark batch allocations as released
        alloc_stmt = (
            select(OrderBatchAllocation)
            .where(
                OrderBatchAllocation.order_id == order_id,
                OrderBatchAllocation.allocation_status == "allocated",
            )
            .with_for_update()
        )
        alloc_res = await self.db.execute(alloc_stmt)
        for a in alloc_res.scalars().all():
            a.released_quantity = a.allocated_quantity
            a.allocation_status = "released"

        return total_released

    async def consume_reservations_for_order(
        self,
        order_id: uuid.UUID,
        acting_user_id: Optional[uuid.UUID] = None,
    ) -> int:
        """
        Formally consume reserved inventory upon dispatch.
        Decrements physical available_quantity and reserved_quantity.
        """
        stmt = (
            select(InventoryReservation)
            .where(
                InventoryReservation.order_id == order_id,
                InventoryReservation.status.in_(["active", "partially_released"]),
            )
            .with_for_update()
        )
        res = await self.db.execute(stmt)
        reservations = list(res.scalars().all())

        total_consumed = 0
        now_utc = datetime.now(timezone.utc)

        for r in reservations:
            remaining_to_consume = r.reserved_quantity - r.consumed_quantity - r.released_quantity
            if remaining_to_consume <= 0:
                continue

            # Lock batch
            batch_stmt = select(InventoryBatch).where(InventoryBatch.id == r.batch_id).with_for_update()
            batch_res = await self.db.execute(batch_stmt)
            batch = batch_res.scalars().first()
            if batch:
                batch.reserved_quantity = max(0, batch.reserved_quantity - remaining_to_consume)
                batch.available_quantity = max(0, batch.available_quantity - remaining_to_consume)

                # Update aggregate inventory
                inv_stmt = select(Inventory).where(Inventory.product_id == batch.product_id).with_for_update()
                inv_res = await self.db.execute(inv_stmt)
                inv = inv_res.scalars().first()
                if inv:
                    inv.total_reserved_quantity = max(0, inv.total_reserved_quantity - remaining_to_consume)
                    inv.total_available_quantity = max(0, inv.total_available_quantity - remaining_to_consume)
                    if inv.total_available_quantity <= 0:
                        inv.is_in_stock = False

                # Record stock movement
                movement = StockMovement(
                    batch_id=batch.id,
                    product_id=batch.product_id,
                    movement_type="STOCK_DISPATCHED",
                    quantity=-remaining_to_consume,
                    balance_after=batch.available_quantity,
                    reference_type="order",
                    reference_id=order_id,
                    performed_by_id=acting_user_id,
                    notes=f"Stock dispatched for Order {order_id} ({remaining_to_consume} units)",
                )
                self.db.add(movement)

            # Update reservation status
            r.consumed_quantity += remaining_to_consume
            r.status = "consumed"
            r.consumed_at = now_utc

            total_consumed += remaining_to_consume

        # Mark batch allocations as consumed
        alloc_stmt = (
            select(OrderBatchAllocation)
            .where(
                OrderBatchAllocation.order_id == order_id,
                OrderBatchAllocation.allocation_status == "allocated",
            )
            .with_for_update()
        )
        alloc_res = await self.db.execute(alloc_stmt)
        for a in alloc_res.scalars().all():
            a.consumed_quantity = a.allocated_quantity
            a.allocation_status = "consumed"

        return total_consumed
