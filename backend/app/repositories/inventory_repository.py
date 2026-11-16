import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy import and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.inventory import (
    Inventory,
    InventoryBatch,
    StockAdjustment,
    StockAdjustmentItem,
    StockAlert,
    StockMovement,
)
from app.models.product import Product
from app.models.user import User


class InventoryRepository:
    """Async database repository for Pharmacy Batches, Inventory aggregations, Movements, and Audits."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==========================================================================
    # 1. Batch Management
    # ==========================================================================

    async def get_batch_by_id(self, batch_id: uuid.UUID, load_product: bool = True) -> Optional[InventoryBatch]:
        """Fetch batch by UUID with optional product loading."""
        stmt = select(InventoryBatch).where(InventoryBatch.id == batch_id)
        if load_product:
            stmt = stmt.options(selectinload(InventoryBatch.product))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_batch_by_product_and_number(
        self, product_id: uuid.UUID, batch_number: str
    ) -> Optional[InventoryBatch]:
        """Look up batch by product and batch number (unique constraint)."""
        stmt = select(InventoryBatch).where(
            InventoryBatch.product_id == product_id,
            func.lower(InventoryBatch.batch_number) == batch_number.strip().lower(),
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_batches(
        self,
        product_id: Optional[uuid.UUID] = None,
        batch_status: Optional[str] = None,
        is_expired: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[InventoryBatch], int]:
        """List batches with filtering, search, and pagination."""
        stmt = select(InventoryBatch).join(Product, InventoryBatch.product_id == Product.id)

        if product_id is not None:
            stmt = stmt.where(InventoryBatch.product_id == product_id)

        if batch_status is not None:
            stmt = stmt.where(InventoryBatch.batch_status == batch_status)

        today = date.today()
        if is_expired is True:
            stmt = stmt.where(InventoryBatch.expiry_date <= today)
        elif is_expired is False:
            stmt = stmt.where(InventoryBatch.expiry_date > today)

        if search:
            search_term = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(InventoryBatch.batch_number).like(search_term),
                    func.lower(Product.name).like(search_term),
                    func.lower(Product.sku).like(search_term),
                    func.lower(InventoryBatch.supplier_name).like(search_term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        # Eager load product and order by expiry date
        offset = (page - 1) * page_size
        stmt = (
            stmt.options(selectinload(InventoryBatch.product))
            .order_by(InventoryBatch.expiry_date.asc(), InventoryBatch.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total_items

    async def create_batch(self, batch: InventoryBatch) -> InventoryBatch:
        """Persist a new batch."""
        self.db.add(batch)
        await self.db.flush()
        await self.db.refresh(batch)
        return batch

    async def update_batch(self, batch: InventoryBatch) -> InventoryBatch:
        """Flush changes to a batch."""
        await self.db.flush()
        await self.db.refresh(batch)
        return batch

    # ==========================================================================
    # 2. Inventory Aggregation & Recalculation
    # ==========================================================================

    async def get_or_create_inventory(self, product_id: uuid.UUID) -> Inventory:
        """Get or initialize the product-level inventory record."""
        stmt = select(Inventory).where(Inventory.product_id == product_id)
        result = await self.db.execute(stmt)
        inv = result.scalars().first()
        if not inv:
            inv = Inventory(
                product_id=product_id,
                total_available_quantity=0,
                total_reserved_quantity=0,
                total_damaged_quantity=0,
                total_quarantined_quantity=0,
                reorder_level=20,
                reorder_quantity=50,
                is_in_stock=False,
            )
            self.db.add(inv)
            await self.db.flush()
            await self.db.refresh(inv)
        return inv

    async def recalculate_inventory(self, product_id: uuid.UUID) -> Inventory:
        """
        Recalculate product-level inventory aggregates from physical batches.
        Updates available, reserved, damaged, quarantined, and in_stock flag.
        """
        inv = await self.get_or_create_inventory(product_id)

        stmt = select(
            func.coalesce(func.sum(InventoryBatch.available_quantity), 0).label("tot_avail"),
            func.coalesce(func.sum(InventoryBatch.reserved_quantity), 0).label("tot_res"),
            func.coalesce(func.sum(InventoryBatch.damaged_quantity), 0).label("tot_dam"),
            func.coalesce(func.sum(InventoryBatch.quarantined_quantity), 0).label("tot_quar"),
        ).where(InventoryBatch.product_id == product_id)

        result = await self.db.execute(stmt)
        tot_avail, tot_res, tot_dam, tot_quar = result.one()

        today = date.today()
        # Compute sellable from active unexpired batches
        sellable_stmt = select(
            func.coalesce(
                func.sum(InventoryBatch.available_quantity - InventoryBatch.reserved_quantity), 0
            )
        ).where(
            InventoryBatch.product_id == product_id,
            InventoryBatch.batch_status == "active",
            InventoryBatch.expiry_date > today,
            (InventoryBatch.available_quantity - InventoryBatch.reserved_quantity) > 0,
        )
        sellable_result = await self.db.execute(sellable_stmt)
        sellable = sellable_result.scalar() or 0

        inv.total_available_quantity = int(tot_avail)
        inv.total_reserved_quantity = int(tot_res)
        inv.total_damaged_quantity = int(tot_dam)
        inv.total_quarantined_quantity = int(tot_quar)
        inv.is_in_stock = bool(sellable > 0)

        await self.db.flush()
        await self.db.refresh(inv)
        return inv

    async def list_product_inventory(
        self,
        search: Optional[str] = None,
        is_low_stock: Optional[bool] = None,
        is_out_of_stock: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[dict], int]:
        """
        Product-wise inventory view aggregating batch quantities and reorder thresholds.
        """
        today = date.today()

        # Subquery for batch statistics
        batch_sub = (
            select(
                InventoryBatch.product_id,
                func.coalesce(func.sum(InventoryBatch.received_quantity), 0).label("received"),
                func.coalesce(func.sum(InventoryBatch.available_quantity), 0).label("available"),
                func.coalesce(func.sum(InventoryBatch.reserved_quantity), 0).label("reserved"),
                func.coalesce(func.sum(InventoryBatch.damaged_quantity), 0).label("damaged"),
                func.coalesce(func.sum(InventoryBatch.quarantined_quantity), 0).label("quarantined"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    InventoryBatch.batch_status == "active",
                                    InventoryBatch.expiry_date > today,
                                ),
                                InventoryBatch.available_quantity - InventoryBatch.reserved_quantity,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("sellable"),
                func.count(
                    case((InventoryBatch.batch_status == "active", InventoryBatch.id))
                ).label("active_batches"),
                func.count(
                    case(
                        (
                            and_(
                                InventoryBatch.expiry_date <= today + timedelta(days=90),
                                InventoryBatch.expiry_date > today,
                            ),
                            InventoryBatch.id,
                        )
                    )
                ).label("expiring_soon"),
                func.count(
                    case((InventoryBatch.expiry_date <= today, InventoryBatch.id))
                ).label("expired_batches"),
            )
            .group_by(InventoryBatch.product_id)
            .subquery()
        )

        query = (
            select(
                Product.id.label("product_id"),
                Product.name.label("product_name"),
                Product.sku.label("product_sku"),
                Category.name.label("category_name"),
                Product.dosage_form.label("dosage_form"),
                func.coalesce(batch_sub.c.received, 0).label("total_received"),
                func.coalesce(batch_sub.c.available, 0).label("total_available"),
                func.coalesce(batch_sub.c.reserved, 0).label("total_reserved"),
                func.coalesce(batch_sub.c.damaged, 0).label("total_damaged"),
                func.coalesce(batch_sub.c.quarantined, 0).label("total_quarantined"),
                func.coalesce(batch_sub.c.sellable, 0).label("total_sellable"),
                func.coalesce(Inventory.reorder_level, 20).label("reorder_level"),
                func.coalesce(batch_sub.c.active_batches, 0).label("active_batches_count"),
                func.coalesce(batch_sub.c.expiring_soon, 0).label("expiring_soon_count"),
                func.coalesce(batch_sub.c.expired_batches, 0).label("expired_batches_count"),
            )
            .select_from(Product)
            .outerjoin(Category, Product.category_id == Category.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(batch_sub, Product.id == batch_sub.c.product_id)
            .where(Product.is_deleted == False)  # noqa: E712
        )

        if search:
            search_term = f"%{search.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Product.name).like(search_term),
                    func.lower(Product.sku).like(search_term),
                    func.lower(Product.generic_name).like(search_term),
                )
            )

        if is_low_stock is True:
            query = query.where(
                and_(
                    func.coalesce(batch_sub.c.sellable, 0) <= func.coalesce(Inventory.reorder_level, 20),
                    func.coalesce(batch_sub.c.sellable, 0) > 0,
                )
            )

        if is_out_of_stock is True:
            query = query.where(func.coalesce(batch_sub.c.sellable, 0) == 0)

        # Count total
        count_stmt = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(Product.name.asc()).offset(offset).limit(page_size)
        result = await self.db.execute(query)
        rows = result.mappings().all()

        formatted_items = []
        for r in rows:
            sellable = int(r["total_sellable"])
            reorder = int(r["reorder_level"])
            formatted_items.append(
                {
                    "product_id": r["product_id"],
                    "product_name": r["product_name"],
                    "product_sku": r["product_sku"],
                    "category_name": r["category_name"],
                    "dosage_form": r["dosage_form"],
                    "total_received": int(r["total_received"]),
                    "total_available": int(r["total_available"]),
                    "total_reserved": int(r["total_reserved"]),
                    "total_damaged": int(r["total_damaged"]),
                    "total_quarantined": int(r["total_quarantined"]),
                    "total_sellable": sellable,
                    "reorder_level": reorder,
                    "is_low_stock": bool(0 < sellable <= reorder),
                    "is_out_of_stock": bool(sellable == 0),
                    "active_batches_count": int(r["active_batches_count"]),
                    "expiring_soon_count": int(r["expiring_soon_count"]),
                    "expired_batches_count": int(r["expired_batches_count"]),
                }
            )

        return formatted_items, total_items

    async def get_inventory_overall_summary(self) -> dict:
        """Global warehouse inventory summary metrics."""
        today = date.today()

        # Count total active products
        p_count_stmt = select(func.count(Product.id)).where(Product.is_deleted == False)  # noqa: E712
        p_res = await self.db.execute(p_count_stmt)
        total_products = p_res.scalar() or 0

        # Batch aggregates
        batch_stmt = select(
            func.count(InventoryBatch.id).label("total_batches"),
            func.count(
                case((InventoryBatch.batch_status == "active", InventoryBatch.id))
            ).label("active_batches"),
            func.coalesce(func.sum(InventoryBatch.received_quantity), 0).label("received"),
            func.coalesce(func.sum(InventoryBatch.available_quantity), 0).label("available"),
            func.coalesce(func.sum(InventoryBatch.reserved_quantity), 0).label("reserved"),
            func.coalesce(func.sum(InventoryBatch.damaged_quantity), 0).label("damaged"),
            func.coalesce(func.sum(InventoryBatch.quarantined_quantity), 0).label("quarantined"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                InventoryBatch.batch_status == "active",
                                InventoryBatch.expiry_date > today,
                            ),
                            InventoryBatch.available_quantity - InventoryBatch.reserved_quantity,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("sellable"),
            func.count(
                case(
                    (
                        and_(
                            InventoryBatch.expiry_date <= today + timedelta(days=30),
                            InventoryBatch.expiry_date > today,
                        ),
                        InventoryBatch.id,
                    )
                )
            ).label("expiring_30_days"),
            func.count(
                case((InventoryBatch.expiry_date <= today, InventoryBatch.id))
            ).label("expired_batches"),
        )
        b_res = await self.db.execute(batch_stmt)
        b_row = b_res.one()

        # Count low stock and out of stock products
        # A product is low stock if sellable <= reorder_level and > 0
        product_sellable_sub = (
            select(
                Product.id.label("p_id"),
                func.coalesce(Inventory.reorder_level, 20).label("reorder_level"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    InventoryBatch.batch_status == "active",
                                    InventoryBatch.expiry_date > today,
                                ),
                                InventoryBatch.available_quantity - InventoryBatch.reserved_quantity,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("sellable"),
            )
            .select_from(Product)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(InventoryBatch, Product.id == InventoryBatch.product_id)
            .where(Product.is_deleted == False)  # noqa: E712
            .group_by(Product.id, Inventory.reorder_level)
            .subquery()
        )

        low_stock_stmt = select(func.count(product_sellable_sub.c.p_id)).where(
            product_sellable_sub.c.sellable <= product_sellable_sub.c.reorder_level,
            product_sellable_sub.c.sellable > 0,
        )
        low_res = await self.db.execute(low_stock_stmt)
        low_stock_count = low_res.scalar() or 0

        oos_stmt = select(func.count(product_sellable_sub.c.p_id)).where(
            product_sellable_sub.c.sellable == 0
        )
        oos_res = await self.db.execute(oos_stmt)
        oos_count = oos_res.scalar() or 0

        return {
            "total_catalog_products": total_products,
            "total_active_batches": int(b_row.active_batches),
            "total_received_units": int(b_row.received),
            "total_available_units": int(b_row.available),
            "total_reserved_units": int(b_row.reserved),
            "total_damaged_units": int(b_row.damaged),
            "total_quarantined_units": int(b_row.quarantined),
            "total_sellable_units": int(b_row.sellable),
            "low_stock_products_count": low_stock_count,
            "out_of_stock_products_count": oos_count,
            "expiring_30_days_count": int(b_row.expiring_30_days),
            "expired_batches_count": int(b_row.expired_batches),
        }

    # ==========================================================================
    # 3. Stock Movement Ledger
    # ==========================================================================

    async def create_movement(self, movement: StockMovement) -> StockMovement:
        """Append an immutable audit entry to stock_movements."""
        self.db.add(movement)
        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def list_movements(
        self,
        product_id: Optional[uuid.UUID] = None,
        batch_id: Optional[uuid.UUID] = None,
        movement_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        performed_by_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[dict], int]:
        """Query immutable stock movement ledger with filters and user names."""
        stmt = (
            select(
                StockMovement.id,
                StockMovement.batch_id,
                InventoryBatch.batch_number,
                StockMovement.product_id,
                Product.name.label("product_name"),
                Product.sku.label("product_sku"),
                StockMovement.movement_type,
                StockMovement.quantity,
                StockMovement.balance_after,
                StockMovement.reference_type,
                StockMovement.reference_id,
                StockMovement.performed_by_id,
                User.phone.label("performed_by_phone"),
                StockMovement.notes,
                StockMovement.created_at,
            )
            .select_from(StockMovement)
            .join(InventoryBatch, StockMovement.batch_id == InventoryBatch.id)
            .join(Product, StockMovement.product_id == Product.id)
            .outerjoin(User, StockMovement.performed_by_id == User.id)
        )

        if product_id is not None:
            stmt = stmt.where(StockMovement.product_id == product_id)

        if batch_id is not None:
            stmt = stmt.where(StockMovement.batch_id == batch_id)

        if movement_type:
            stmt = stmt.where(StockMovement.movement_type == movement_type)

        if start_date:
            stmt = stmt.where(StockMovement.created_at >= start_date)

        if end_date:
            stmt = stmt.where(StockMovement.created_at <= end_date)

        if performed_by_id is not None:
            stmt = stmt.where(StockMovement.performed_by_id == performed_by_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        # Paginate
        offset = (page - 1) * page_size
        stmt = stmt.order_by(StockMovement.created_at.desc()).offset(offset).limit(page_size)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        formatted = [
            {
                "id": r["id"],
                "batch_id": r["batch_id"],
                "batch_number": r["batch_number"],
                "product_id": r["product_id"],
                "product_name": r["product_name"],
                "product_sku": r["product_sku"],
                "movement_type": r["movement_type"],
                "quantity": r["quantity"],
                "balance_after": r["balance_after"],
                "reference_type": r["reference_type"],
                "reference_id": r["reference_id"],
                "performed_by_id": r["performed_by_id"],
                "performed_by_name": r["performed_by_phone"],
                "notes": r["notes"],
                "created_at": r["created_at"],
            }
            for r in rows
        ]

        return formatted, total_items

    # ==========================================================================
    # 4. Stock Adjustments
    # ==========================================================================

    async def create_adjustment(self, adjustment: StockAdjustment) -> StockAdjustment:
        """Persist stock adjustment record."""
        self.db.add(adjustment)
        await self.db.flush()
        await self.db.refresh(adjustment)
        return adjustment

    async def get_adjustment_by_id(self, adjustment_id: uuid.UUID) -> Optional[StockAdjustment]:
        """Fetch adjustment by ID with line items."""
        stmt = (
            select(StockAdjustment)
            .options(selectinload(StockAdjustment.items))
            .where(StockAdjustment.id == adjustment_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_adjustments(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[StockAdjustment], int]:
        """List stock adjustments with items preloaded."""
        stmt = select(StockAdjustment)
        if status:
            stmt = stmt.where(StockAdjustment.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        offset = (page - 1) * page_size
        stmt = (
            stmt.options(selectinload(StockAdjustment.items))
            .order_by(StockAdjustment.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total_items

    # ==========================================================================
    # 5. Expiry Management
    # ==========================================================================

    async def list_expiries(
        self,
        product_id: Optional[uuid.UUID] = None,
        days_ahead: Optional[int] = None,
        is_expired: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[dict], int]:
        """List batches nearing expiry or already expired."""
        today = date.today()
        stmt = (
            select(
                InventoryBatch.id.label("batch_id"),
                InventoryBatch.batch_number,
                InventoryBatch.product_id,
                Product.name.label("product_name"),
                Product.sku.label("product_sku"),
                InventoryBatch.manufacturing_date,
                InventoryBatch.expiry_date,
                InventoryBatch.available_quantity,
                InventoryBatch.reserved_quantity,
                InventoryBatch.damaged_quantity,
                InventoryBatch.quarantined_quantity,
                InventoryBatch.batch_status,
                InventoryBatch.storage_location,
            )
            .join(Product, InventoryBatch.product_id == Product.id)
            .where(InventoryBatch.available_quantity > 0)
        )

        if product_id is not None:
            stmt = stmt.where(InventoryBatch.product_id == product_id)

        if is_expired:
            stmt = stmt.where(InventoryBatch.expiry_date <= today)
        elif days_ahead is not None:
            target_date = today + timedelta(days=days_ahead)
            stmt = stmt.where(InventoryBatch.expiry_date > today, InventoryBatch.expiry_date <= target_date)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        offset = (page - 1) * page_size
        stmt = stmt.order_by(InventoryBatch.expiry_date.asc()).offset(offset).limit(page_size)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        formatted = []
        for r in rows:
            exp_date = r["expiry_date"]
            days_diff = (exp_date - today).days
            formatted.append(
                {
                    "batch_id": r["batch_id"],
                    "batch_number": r["batch_number"],
                    "product_id": r["product_id"],
                    "product_name": r["product_name"],
                    "product_sku": r["product_sku"],
                    "manufacturing_date": r["manufacturing_date"],
                    "expiry_date": exp_date,
                    "available_quantity": r["available_quantity"],
                    "reserved_quantity": r["reserved_quantity"],
                    "damaged_quantity": r["damaged_quantity"],
                    "quarantined_quantity": r["quarantined_quantity"],
                    "batch_status": r["batch_status"],
                    "days_to_expiry": days_diff,
                    "storage_location": r["storage_location"],
                }
            )

        return formatted, total_items

    async def get_expiry_summary(self) -> dict:
        """Compute counts and physical quantities across statutory expiry brackets."""
        today = date.today()

        stmt = select(
            # Expired
            func.count(case((InventoryBatch.expiry_date <= today, InventoryBatch.id))).label("exp_cnt"),
            func.coalesce(
                func.sum(case((InventoryBatch.expiry_date <= today, InventoryBatch.available_quantity))), 0
            ).label("exp_units"),
            # <= 7 days
            func.count(
                case(
                    (
                        and_(
                            InventoryBatch.expiry_date > today,
                            InventoryBatch.expiry_date <= today + timedelta(days=7),
                        ),
                        InventoryBatch.id,
                    )
                )
            ).label("d7_cnt"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                InventoryBatch.expiry_date > today,
                                InventoryBatch.expiry_date <= today + timedelta(days=7),
                            ),
                            InventoryBatch.available_quantity,
                        )
                    )
                ),
                0,
            ).label("d7_units"),
            # <= 15 days
            func.count(
                case(
                    (
                        and_(
                            InventoryBatch.expiry_date > today,
                            InventoryBatch.expiry_date <= today + timedelta(days=15),
                        ),
                        InventoryBatch.id,
                    )
                )
            ).label("d15_cnt"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                InventoryBatch.expiry_date > today,
                                InventoryBatch.expiry_date <= today + timedelta(days=15),
                            ),
                            InventoryBatch.available_quantity,
                        )
                    )
                ),
                0,
            ).label("d15_units"),
            # <= 30 days
            func.count(
                case(
                    (
                        and_(
                            InventoryBatch.expiry_date > today,
                            InventoryBatch.expiry_date <= today + timedelta(days=30),
                        ),
                        InventoryBatch.id,
                    )
                )
            ).label("d30_cnt"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                InventoryBatch.expiry_date > today,
                                InventoryBatch.expiry_date <= today + timedelta(days=30),
                            ),
                            InventoryBatch.available_quantity,
                        )
                    )
                ),
                0,
            ).label("d30_units"),
            # <= 60 days
            func.count(
                case(
                    (
                        and_(
                            InventoryBatch.expiry_date > today,
                            InventoryBatch.expiry_date <= today + timedelta(days=60),
                        ),
                        InventoryBatch.id,
                    )
                )
            ).label("d60_cnt"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                InventoryBatch.expiry_date > today,
                                InventoryBatch.expiry_date <= today + timedelta(days=60),
                            ),
                            InventoryBatch.available_quantity,
                        )
                    )
                ),
                0,
            ).label("d60_units"),
            # <= 90 days
            func.count(
                case(
                    (
                        and_(
                            InventoryBatch.expiry_date > today,
                            InventoryBatch.expiry_date <= today + timedelta(days=90),
                        ),
                        InventoryBatch.id,
                    )
                )
            ).label("d90_cnt"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                InventoryBatch.expiry_date > today,
                                InventoryBatch.expiry_date <= today + timedelta(days=90),
                            ),
                            InventoryBatch.available_quantity,
                        )
                    )
                ),
                0,
            ).label("d90_units"),
        ).where(InventoryBatch.available_quantity > 0)

        res = await self.db.execute(stmt)
        row = res.one()

        return {
            "expired_count": int(row.exp_cnt),
            "expired_units": int(row.exp_units),
            "expiring_7_days_count": int(row.d7_cnt),
            "expiring_7_days_units": int(row.d7_units),
            "expiring_15_days_count": int(row.d15_cnt),
            "expiring_15_days_units": int(row.d15_units),
            "expiring_30_days_count": int(row.d30_cnt),
            "expiring_30_days_units": int(row.d30_units),
            "expiring_60_days_count": int(row.d60_cnt),
            "expiring_60_days_units": int(row.d60_units),
            "expiring_90_days_count": int(row.d90_cnt),
            "expiring_90_days_units": int(row.d90_units),
        }

    # ==========================================================================
    # 6. Stock Alerts
    # ==========================================================================

    async def list_alerts(
        self,
        is_resolved: Optional[bool] = None,
        alert_type: Optional[str] = None,
        product_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[StockAlert], int]:
        """List stock alerts with filters."""
        stmt = (
            select(StockAlert)
            .options(
                selectinload(StockAlert.product),
                selectinload(StockAlert.batch),
            )
        )
        if is_resolved is not None:
            stmt = stmt.where(StockAlert.is_resolved == is_resolved)
        if alert_type:
            stmt = stmt.where(StockAlert.alert_type == alert_type)
        if product_id is not None:
            stmt = stmt.where(StockAlert.product_id == product_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_items = total_result.scalar() or 0

        offset = (page - 1) * page_size
        stmt = stmt.order_by(StockAlert.created_at.desc()).offset(offset).limit(page_size)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total_items

    async def get_alert_by_id(self, alert_id: uuid.UUID) -> Optional[StockAlert]:
        """Fetch alert by ID."""
        stmt = (
            select(StockAlert)
            .options(
                selectinload(StockAlert.product),
                selectinload(StockAlert.batch),
            )
            .where(StockAlert.id == alert_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_unresolved_alert(self, product_id: uuid.UUID, alert_type: str) -> Optional[StockAlert]:
        """Check for existing unresolved alert to avoid duplicates."""
        stmt = select(StockAlert).where(
            StockAlert.product_id == product_id,
            StockAlert.alert_type == alert_type,
            StockAlert.is_resolved == False,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_alert(self, alert: StockAlert) -> StockAlert:
        """Create new alert."""
        self.db.add(alert)
        await self.db.flush()
        await self.db.refresh(alert)
        return alert

    async def resolve_alert(self, alert: StockAlert, resolved_by_id: uuid.UUID) -> StockAlert:
        """Mark alert as resolved."""
        alert.is_resolved = True
        alert.resolved_by_id = resolved_by_id
        alert.resolved_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(alert)
        return alert

    async def get_alerts_summary(self) -> dict:
        """Summary counts of unresolved alerts by category."""
        stmt = select(
            func.count(StockAlert.id).label("total"),
            func.count(
                case((StockAlert.alert_type == "LOW_STOCK", StockAlert.id))
            ).label("low_stock"),
            func.count(
                case((StockAlert.alert_type == "OUT_OF_STOCK", StockAlert.id))
            ).label("out_of_stock"),
            func.count(
                case((StockAlert.alert_type == "EXPIRY_WARNING", StockAlert.id))
            ).label("expiry_warning"),
        ).where(StockAlert.is_resolved == False)  # noqa: E712

        result = await self.db.execute(stmt)
        row = result.one()
        return {
            "total_unresolved": int(row.total),
            "low_stock_count": int(row.low_stock),
            "out_of_stock_count": int(row.out_of_stock),
            "expiry_warning_count": int(row.expiry_warning),
        }

    # ==========================================================================
    # 7. Inventory Valuation
    # ==========================================================================

    async def get_valuation_report(self) -> dict:
        """
        Compute total physical inventory valuation at purchase price and MRP using Decimal.
        Breaks down valuation across:
        - Sellable stock
        - Reserved stock
        - Damaged stock
        - Quarantined stock
        - Expired stock
        """
        today = date.today()

        stmt = select(
            InventoryBatch.available_quantity,
            InventoryBatch.reserved_quantity,
            InventoryBatch.damaged_quantity,
            InventoryBatch.quarantined_quantity,
            InventoryBatch.purchase_price,
            InventoryBatch.batch_mrp,
            InventoryBatch.batch_status,
            InventoryBatch.expiry_date,
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            Product.sku.label("product_sku"),
        ).join(Product, InventoryBatch.product_id == Product.id)

        result = await self.db.execute(stmt)
        rows = result.all()

        total_physical_units = 0
        total_purchase_val = Decimal("0.00")
        total_mrp_val = Decimal("0.00")

        status_breakdown = {
            "sellable": {"quantity": 0, "purchase_value": Decimal("0.00"), "mrp_value": Decimal("0.00")},
            "reserved": {"quantity": 0, "purchase_value": Decimal("0.00"), "mrp_value": Decimal("0.00")},
            "damaged": {"quantity": 0, "purchase_value": Decimal("0.00"), "mrp_value": Decimal("0.00")},
            "quarantined": {"quantity": 0, "purchase_value": Decimal("0.00"), "mrp_value": Decimal("0.00")},
            "expired": {"quantity": 0, "purchase_value": Decimal("0.00"), "mrp_value": Decimal("0.00")},
        }

        prod_valuation_map: Dict[uuid.UUID, dict] = {}

        for row in rows:
            p_price = Decimal(str(row.purchase_price))
            mrp = Decimal(str(row.batch_mrp))
            avail = int(row.available_quantity)
            res = int(row.reserved_quantity)
            dam = int(row.damaged_quantity)
            quar = int(row.quarantined_quantity)
            is_expired = row.expiry_date <= today
            is_active = row.batch_status == "active"

            # Sellable calculation: active, not expired, available - reserved
            sellable_qty = max(0, avail - res) if (is_active and not is_expired) else 0

            # Accumulate overall totals
            tot_batch_units = avail + dam + quar
            total_physical_units += tot_batch_units
            total_purchase_val += Decimal(tot_batch_units) * p_price
            total_mrp_val += Decimal(tot_batch_units) * mrp

            # Status breakdown
            status_breakdown["sellable"]["quantity"] += sellable_qty
            status_breakdown["sellable"]["purchase_value"] += Decimal(sellable_qty) * p_price
            status_breakdown["sellable"]["mrp_value"] += Decimal(sellable_qty) * mrp

            status_breakdown["reserved"]["quantity"] += res
            status_breakdown["reserved"]["purchase_value"] += Decimal(res) * p_price
            status_breakdown["reserved"]["mrp_value"] += Decimal(res) * mrp

            status_breakdown["damaged"]["quantity"] += dam
            status_breakdown["damaged"]["purchase_value"] += Decimal(dam) * p_price
            status_breakdown["damaged"]["mrp_value"] += Decimal(dam) * mrp

            status_breakdown["quarantined"]["quantity"] += quar
            status_breakdown["quarantined"]["purchase_value"] += Decimal(quar) * p_price
            status_breakdown["quarantined"]["mrp_value"] += Decimal(quar) * mrp

            if is_expired:
                status_breakdown["expired"]["quantity"] += avail
                status_breakdown["expired"]["purchase_value"] += Decimal(avail) * p_price
                status_breakdown["expired"]["mrp_value"] += Decimal(avail) * mrp

            # Product-wise aggregation
            pid = row.product_id
            if pid not in prod_valuation_map:
                prod_valuation_map[pid] = {
                    "product_id": pid,
                    "product_name": row.product_name,
                    "product_sku": row.product_sku,
                    "total_quantity": 0,
                    "sellable_quantity": 0,
                    "purchase_value": Decimal("0.00"),
                    "mrp_value": Decimal("0.00"),
                }
            prod_valuation_map[pid]["total_quantity"] += tot_batch_units
            prod_valuation_map[pid]["sellable_quantity"] += sellable_qty
            prod_valuation_map[pid]["purchase_value"] += Decimal(tot_batch_units) * p_price
            prod_valuation_map[pid]["mrp_value"] += Decimal(tot_batch_units) * mrp

        top_products = sorted(
            prod_valuation_map.values(),
            key=lambda x: x["purchase_value"],
            reverse=True,
        )[:20]

        return {
            "as_of": datetime.utcnow(),
            "total_physical_units": total_physical_units,
            "total_purchase_valuation": total_purchase_val,
            "total_mrp_valuation": total_mrp_val,
            "by_status": status_breakdown,
            "top_products": top_products,
            "valuation_policy_notes": (
                "Inventory valuation is computed strictly on purchase price (cost) and maximum retail price (MRP) "
                "using Decimal precision arithmetic. Sellable stock strictly excludes reserved, damaged, quarantined, "
                "and expired batches under Rule 65."
            ),
        }

