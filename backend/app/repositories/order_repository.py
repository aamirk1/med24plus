import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import (
    Invoice,
    InventoryReservation,
    Order,
    OrderBatchAllocation,
    OrderCancellation,
    OrderIdempotencyRecord,
    OrderItem,
    OrderStatusHistory,
)
from app.models.user import User


class OrderRepository:
    """Repository handling all database queries and transactions for orders and lifecycle models."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(
        self,
        order_id: uuid.UUID,
        load_relations: bool = True,
        lock_for_update: bool = False,
    ) -> Optional[Order]:
        """Fetch order by UUID with optional eager loading and row-level locking."""
        stmt = select(Order).where(Order.id == order_id)
        if lock_for_update:
            stmt = stmt.with_for_update()

        if load_relations:
            stmt = stmt.options(
                selectinload(Order.customer),
                selectinload(Order.items).selectinload(OrderItem.batch),
                selectinload(Order.items).selectinload(OrderItem.batch_allocations),
                selectinload(Order.items).selectinload(OrderItem.reservations),
                selectinload(Order.status_history).selectinload(OrderStatusHistory.changed_by),
                selectinload(Order.batch_allocations).selectinload(OrderBatchAllocation.batch),
                selectinload(Order.reservations).selectinload(InventoryReservation.batch),
                selectinload(Order.cancellation),
                selectinload(Order.invoice),
                selectinload(Order.prescription),
            )

        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        """Fetch order by unique order number."""
        stmt = (
            select(Order)
            .where(Order.order_number == order_number)
            .options(
                selectinload(Order.customer),
                selectinload(Order.items),
                selectinload(Order.status_history),
                selectinload(Order.batch_allocations),
                selectinload(Order.reservations),
                selectinload(Order.cancellation),
                selectinload(Order.invoice),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_customer_orders(
        self,
        customer_id: uuid.UUID,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Order], int]:
        """Fetch paginated orders for a customer with filters."""
        query = select(Order).where(Order.customer_id == customer_id)

        if status:
            query = query.where(Order.status == status)
        if start_date:
            query = query.where(Order.created_at >= start_date)
        if end_date:
            query = query.where(Order.created_at <= end_date)

        # Count total
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await self.db.execute(count_stmt)
        total = count_res.scalar_one()

        # Fetch page with eager loaded items
        offset = (page - 1) * page_size
        query = (
            query.options(
                selectinload(Order.items),
                selectinload(Order.status_history),
                selectinload(Order.cancellation),
                selectinload(Order.invoice),
            )
            .order_by(desc(Order.created_at))
            .offset(offset)
            .limit(page_size)
        )

        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def get_admin_orders(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        customer_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Order], int]:
        """Fetch paginated orders for admin with search and filters."""
        query = select(Order).join(Order.customer)

        if search:
            search_clean = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Order.order_number.ilike(search_clean),
                    User.full_name.ilike(search_clean),
                    User.phone.ilike(search_clean),
                    User.email.ilike(search_clean),
                )
            )

        if status:
            query = query.where(Order.status == status)
        if payment_status:
            query = query.where(Order.payment_status == payment_status)
        if customer_id:
            query = query.where(Order.customer_id == customer_id)
        if start_date:
            query = query.where(Order.created_at >= start_date)
        if end_date:
            query = query.where(Order.created_at <= end_date)

        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await self.db.execute(count_stmt)
        total = count_res.scalar_one()

        offset = (page - 1) * page_size
        query = (
            query.options(
                selectinload(Order.customer),
                selectinload(Order.items),
                selectinload(Order.status_history),
                selectinload(Order.batch_allocations),
                selectinload(Order.reservations),
                selectinload(Order.cancellation),
                selectinload(Order.invoice),
            )
            .order_by(desc(Order.created_at))
            .offset(offset)
            .limit(page_size)
        )

        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def get_orders_for_pharmacist_review(
        self,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Order], int]:
        """Fetch orders awaiting pharmacist review under Rule 65."""
        query = select(Order).where(Order.status == "pharmacist_review")

        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await self.db.execute(count_stmt)
        total = count_res.scalar_one()

        offset = (page - 1) * page_size
        query = (
            query.options(
                selectinload(Order.customer),
                selectinload(Order.items),
                selectinload(Order.prescription),
                selectinload(Order.status_history),
                selectinload(Order.batch_allocations),
                selectinload(Order.reservations),
            )
            .order_by(desc(Order.created_at))
            .offset(offset)
            .limit(page_size)
        )

        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def get_admin_metrics(self) -> Dict[str, int]:
        """Count orders across lifecycle statuses for administrative dashboard KPI cards."""
        stmt = select(Order.status, func.count(Order.id)).group_by(Order.status)
        result = await self.db.execute(stmt)
        status_counts = dict(result.all())

        total = sum(status_counts.values())

        return {
            "total_orders": total,
            "placed": status_counts.get("placed", 0),
            "pending_payment": status_counts.get("pending_payment", 0),
            "payment_confirmed": status_counts.get("payment_confirmed", 0),
            "pharmacist_review": status_counts.get("pharmacist_review", 0),
            "processing": status_counts.get("processing", 0),
            "ready_for_dispatch": status_counts.get("ready_for_dispatch", 0),
            "dispatched": status_counts.get("dispatched", 0),
            "delivered": status_counts.get("delivered", 0),
            "cancelled": status_counts.get("cancelled", 0),
            "rejected": status_counts.get("rejected", 0),
            "failed": status_counts.get("failed", 0),
        }

    # =========================================================================
    # Idempotency Records
    # =========================================================================

    async def get_idempotency_record(
        self,
        idempotency_key: str,
        customer_id: uuid.UUID,
    ) -> Optional[OrderIdempotencyRecord]:
        """Lookup idempotency record for given key and customer."""
        stmt = select(OrderIdempotencyRecord).where(
            and_(
                OrderIdempotencyRecord.idempotency_key == idempotency_key,
                OrderIdempotencyRecord.customer_id == customer_id,
            )
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def create_idempotency_record(self, record: OrderIdempotencyRecord) -> OrderIdempotencyRecord:
        self.db.add(record)
        await self.db.flush()
        return record

    # =========================================================================
    # Invoice Operations
    # =========================================================================

    async def get_invoice_by_order_id(self, order_id: uuid.UUID) -> Optional[Invoice]:
        stmt = select(Invoice).where(Invoice.order_id == order_id)
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_invoice_by_number(self, invoice_number: str) -> Optional[Invoice]:
        stmt = select(Invoice).where(Invoice.invoice_number == invoice_number)
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def create_invoice(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        await self.db.flush()
        return invoice
