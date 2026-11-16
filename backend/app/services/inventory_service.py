import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import (
    Inventory,
    InventoryBatch,
    StockAdjustment,
    StockAdjustmentItem,
    StockAlert,
    StockMovement,
)
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.inventory import (
    InventoryBatchCreate,
    InventoryBatchResponse,
    InventoryBatchUpdate,
    InventoryValuationResponse,
    StockAdjustmentCreate,
    StockAdjustmentResponse,
    StockReceiveRequest,
    StockReceiveResponse,
)


class InventoryService:
    """Domain service managing Batches, Stock Movements, Adjustments, Expiry, and Valuations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.inv_repo = InventoryRepository(db)
        self.product_repo = ProductRepository(db)

    # ==========================================================================
    # 1. Stock Receiving
    # ==========================================================================

    async def receive_stock(
        self, data: StockReceiveRequest, acting_user_id: Optional[uuid.UUID] = None
    ) -> StockReceiveResponse:
        """
        Record inbound pharmaceutical stock consignment.
        Creates or updates batch, posts immutable movement ledger, and recalculates inventory.
        """
        # 1. Validate Product
        product = await self.product_repo.get_by_id(data.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product not found.", "error": {"code": "PRODUCT_NOT_FOUND"}},
            )

        # 2. Validate Dates
        if data.expiry_date <= data.manufacturing_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": "Statutory expiry date must be strictly after manufacturing date.",
                    "error": {"code": "INVALID_BATCH_DATES"},
                },
            )

        # 3. Locate existing batch or create new
        batch = await self.inv_repo.get_batch_by_product_and_number(data.product_id, data.batch_number)
        if batch:
            # Batch already exists - append inward stock
            batch.received_quantity += data.received_quantity
            batch.available_quantity += data.received_quantity
            if data.purchase_price > 0:
                batch.purchase_price = data.purchase_price
            if data.batch_mrp > 0:
                batch.batch_mrp = data.batch_mrp
            if data.storage_location:
                batch.storage_location = data.storage_location
            batch = await self.inv_repo.update_batch(batch)
        else:
            batch = InventoryBatch(
                product_id=data.product_id,
                batch_number=data.batch_number.strip().upper(),
                manufacturing_date=data.manufacturing_date,
                expiry_date=data.expiry_date,
                received_quantity=data.received_quantity,
                available_quantity=data.received_quantity,
                reserved_quantity=0,
                damaged_quantity=0,
                quarantined_quantity=0,
                purchase_price=data.purchase_price,
                batch_mrp=data.batch_mrp,
                supplier_name=data.supplier_name,
                supplier_invoice_number=data.supplier_invoice_number,
                batch_status="active",
                storage_location=data.storage_location,
            )
            batch = await self.inv_repo.create_batch(batch)

        # 4. Post Immutable Stock Movement Entry
        movement = StockMovement(
            batch_id=batch.id,
            product_id=data.product_id,
            movement_type="INWARD_PURCHASE",
            quantity=data.received_quantity,
            balance_after=batch.available_quantity,
            reference_type="STOCK_RECEIVE",
            reference_id=batch.id,
            performed_by_id=acting_user_id,
            notes=data.notes or f"Received {data.received_quantity} units under batch {batch.batch_number}",
        )
        movement = await self.inv_repo.create_movement(movement)

        # 5. Transactionally update aggregated inventory table
        await self.inv_repo.recalculate_inventory(data.product_id)

        # 6. Check if any unresolved out of stock alerts can be resolved
        await self._auto_resolve_stock_alerts_if_replenished(data.product_id)

        return StockReceiveResponse(
            batch_id=batch.id,
            product_id=batch.product_id,
            batch_number=batch.batch_number,
            quantity_received=data.received_quantity,
            new_available_quantity=batch.available_quantity,
            movement_id=movement.id,
            received_at=movement.created_at,
        )

    # ==========================================================================
    # 2. Stock Adjustment
    # ==========================================================================

    async def create_stock_adjustment(
        self, data: StockAdjustmentCreate, staff_user_id: uuid.UUID
    ) -> StockAdjustment:
        """
        Execute formal stock audit adjustment.
        Prevents negative stock, writes immutable ledger, and recalculates inventory.
        """
        batch = await self.inv_repo.get_batch_by_id(data.batch_id)
        if not batch or batch.product_id != data.product_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Inventory batch not found.", "error": {"code": "BATCH_NOT_FOUND"}},
            )

        system_qty = batch.available_quantity
        adj_type = data.adjustment_type.lower()
        quantity = data.quantity

        movement_type = "stock_adjusted"

        if adj_type == "increase":
            batch.available_quantity += quantity
            counted_qty = system_qty + quantity
            delta = quantity
        elif adj_type == "decrease":
            if batch.available_quantity < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": f"Cannot decrease stock by {quantity}: current available quantity is only {batch.available_quantity}.",
                        "error": {"code": "INSUFFICIENT_STOCK_FOR_ADJUSTMENT"},
                    },
                )
            batch.available_quantity -= quantity
            counted_qty = system_qty - quantity
            delta = -quantity
        elif adj_type == "damaged":
            if batch.available_quantity < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": f"Cannot mark {quantity} units damaged: current available quantity is {batch.available_quantity}.",
                        "error": {"code": "INSUFFICIENT_STOCK_FOR_ADJUSTMENT"},
                    },
                )
            batch.available_quantity -= quantity
            batch.damaged_quantity += quantity
            counted_qty = system_qty - quantity
            delta = -quantity
            movement_type = "DAMAGE_WRITEOFF"
        elif adj_type == "expired":
            if batch.available_quantity < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": f"Cannot mark {quantity} units expired: current available quantity is {batch.available_quantity}.",
                        "error": {"code": "INSUFFICIENT_STOCK_FOR_ADJUSTMENT"},
                    },
                )
            batch.available_quantity -= quantity
            counted_qty = system_qty - quantity
            delta = -quantity
            movement_type = "stock_expired"
            if batch.available_quantity == 0:
                batch.batch_status = "expired"
        elif adj_type == "correction":
            # Direct count adjustment
            batch.available_quantity = quantity
            counted_qty = quantity
            delta = quantity - system_qty
            movement_type = "stock_correction"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Unknown adjustment type '{data.adjustment_type}'. Allowed: increase, decrease, damaged, expired, correction.",
                    "error": {"code": "INVALID_ADJUSTMENT_TYPE"},
                },
            )

        # Flush batch
        await self.inv_repo.update_batch(batch)

        # Create Adjustment record
        adj_number = f"ADJ-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        adjustment = StockAdjustment(
            adjustment_number=adj_number,
            reason=data.reason,
            notes=data.notes,
            status="applied",
            requested_by_id=staff_user_id,
            approved_by_id=staff_user_id,
            applied_at=datetime.utcnow(),
        )

        item = StockAdjustmentItem(
            batch_id=batch.id,
            product_id=data.product_id,
            system_quantity=system_qty,
            counted_quantity=counted_qty,
            quantity_delta=delta,
            discrepancy_reason=data.reason,
        )
        adjustment.items.append(item)
        adjustment = await self.inv_repo.create_adjustment(adjustment)

        # Record movement
        movement = StockMovement(
            batch_id=batch.id,
            product_id=data.product_id,
            movement_type=movement_type,
            quantity=delta,
            balance_after=batch.available_quantity,
            reference_type="STOCK_ADJUSTMENT",
            reference_id=adjustment.id,
            performed_by_id=staff_user_id,
            notes=f"Adjustment {adj_number} ({adj_type}): {data.reason}",
        )
        await self.inv_repo.create_movement(movement)

        # Recalculate inventory
        await self.inv_repo.recalculate_inventory(data.product_id)

        # Evaluate low-stock alerts
        await self.evaluate_and_generate_alerts(data.product_id)

        return adjustment

    # ==========================================================================
    # 3. Batch Management
    # ==========================================================================

    async def list_batches(
        self,
        product_id: Optional[uuid.UUID] = None,
        batch_status: Optional[str] = None,
        is_expired: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[InventoryBatchResponse], int]:
        batches, total = await self.inv_repo.list_batches(
            product_id=product_id,
            batch_status=batch_status,
            is_expired=is_expired,
            search=search,
            page=page,
            page_size=page_size,
        )
        today = date.today()
        items = []
        for b in batches:
            sellable = max(0, b.available_quantity - b.reserved_quantity) if b.batch_status == "active" and b.expiry_date > today else 0
            is_exp = b.expiry_date <= today
            days_diff = (b.expiry_date - today).days

            items.append(
                InventoryBatchResponse(
                    id=b.id,
                    product_id=b.product_id,
                    product_name=b.product.name if b.product else None,
                    product_sku=b.product.sku if b.product else None,
                    batch_number=b.batch_number,
                    manufacturing_date=b.manufacturing_date,
                    expiry_date=b.expiry_date,
                    received_quantity=b.received_quantity,
                    available_quantity=b.available_quantity,
                    reserved_quantity=b.reserved_quantity,
                    damaged_quantity=b.damaged_quantity,
                    quarantined_quantity=b.quarantined_quantity,
                    sellable_quantity=sellable,
                    purchase_price=b.purchase_price,
                    batch_mrp=b.batch_mrp,
                    supplier_name=b.supplier_name,
                    supplier_invoice_number=b.supplier_invoice_number,
                    batch_status=b.batch_status,
                    storage_location=b.storage_location,
                    is_expired=is_exp,
                    days_to_expiry=days_diff,
                    created_at=b.created_at,
                )
            )

        return items, total

    async def get_batch(self, batch_id: uuid.UUID) -> InventoryBatchResponse:
        batch = await self.inv_repo.get_batch_by_id(batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Batch not found.", "error": {"code": "BATCH_NOT_FOUND"}},
            )
        today = date.today()
        sellable = max(0, batch.available_quantity - batch.reserved_quantity) if batch.batch_status == "active" and batch.expiry_date > today else 0
        is_exp = batch.expiry_date <= today
        days_diff = (batch.expiry_date - today).days

        return InventoryBatchResponse(
            id=batch.id,
            product_id=batch.product_id,
            product_name=batch.product.name if batch.product else None,
            product_sku=batch.product.sku if batch.product else None,
            batch_number=batch.batch_number,
            manufacturing_date=batch.manufacturing_date,
            expiry_date=batch.expiry_date,
            received_quantity=batch.received_quantity,
            available_quantity=batch.available_quantity,
            reserved_quantity=batch.reserved_quantity,
            damaged_quantity=batch.damaged_quantity,
            quarantined_quantity=batch.quarantined_quantity,
            sellable_quantity=sellable,
            purchase_price=batch.purchase_price,
            batch_mrp=batch.batch_mrp,
            supplier_name=batch.supplier_name,
            supplier_invoice_number=batch.supplier_invoice_number,
            batch_status=batch.batch_status,
            storage_location=batch.storage_location,
            is_expired=is_exp,
            days_to_expiry=days_diff,
            created_at=batch.created_at,
        )

    async def update_batch_details(self, batch_id: uuid.UUID, data: InventoryBatchUpdate) -> InventoryBatchResponse:
        batch = await self.inv_repo.get_batch_by_id(batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Batch not found.", "error": {"code": "BATCH_NOT_FOUND"}},
            )
        if data.storage_location is not None:
            batch.storage_location = data.storage_location
        if data.supplier_name is not None:
            batch.supplier_name = data.supplier_name
        if data.supplier_invoice_number is not None:
            batch.supplier_invoice_number = data.supplier_invoice_number

        batch = await self.inv_repo.update_batch(batch)
        return await self.get_batch(batch.id)

    async def set_batch_status(
        self, batch_id: uuid.UUID, new_status: str, acting_user_id: Optional[uuid.UUID] = None
    ) -> InventoryBatchResponse:
        valid_statuses = {"active", "quarantined", "recalled", "depleted", "expired"}
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Invalid batch status '{new_status}'. Allowed: {', '.join(valid_statuses)}.",
                    "error": {"code": "INVALID_BATCH_STATUS"},
                },
            )

        batch = await self.inv_repo.get_batch_by_id(batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Batch not found.", "error": {"code": "BATCH_NOT_FOUND"}},
            )

        old_status = batch.batch_status
        batch.batch_status = new_status
        batch = await self.inv_repo.update_batch(batch)

        # Log movement or audit note
        movement = StockMovement(
            batch_id=batch.id,
            product_id=batch.product_id,
            movement_type=f"STATUS_{new_status.upper()}",
            quantity=0,
            balance_after=batch.available_quantity,
            reference_type="BATCH_STATUS_CHANGE",
            reference_id=batch.id,
            performed_by_id=acting_user_id,
            notes=f"Batch status updated from {old_status} to {new_status}",
        )
        await self.inv_repo.create_movement(movement)

        # Recalculate inventory sellable stock
        await self.inv_repo.recalculate_inventory(batch.product_id)

        return await self.get_batch(batch.id)

    # ==========================================================================
    # 4. Low-Stock Alerts
    # ==========================================================================

    async def evaluate_and_generate_alerts(self, product_id: uuid.UUID) -> None:
        """Inspect product sellable stock and generate alerts if low or depleted."""
        stock_map = await self.product_repo.get_sellable_stock_for_products([product_id])
        sellable = stock_map.get(product_id, 0)
        inv = await self.inv_repo.get_or_create_inventory(product_id)
        product = await self.product_repo.get_by_id(product_id, load_relations=False)
        if not product:
            return

        if sellable == 0:
            existing = await self.inv_repo.get_unresolved_alert(product_id, "OUT_OF_STOCK")
            if not existing:
                alert = StockAlert(
                    product_id=product_id,
                    alert_type="OUT_OF_STOCK",
                    message=f"Product '{product.name}' (SKU: {product.sku}) is completely out of sellable stock.",
                    is_resolved=False,
                )
                await self.inv_repo.create_alert(alert)
        elif sellable <= inv.reorder_level:
            existing = await self.inv_repo.get_unresolved_alert(product_id, "LOW_STOCK")
            if not existing:
                alert = StockAlert(
                    product_id=product_id,
                    alert_type="LOW_STOCK",
                    message=f"Product '{product.name}' (SKU: {product.sku}) has {sellable} units left, below reorder threshold of {inv.reorder_level}.",
                    is_resolved=False,
                )
                await self.inv_repo.create_alert(alert)

    async def _auto_resolve_stock_alerts_if_replenished(self, product_id: uuid.UUID) -> None:
        """Resolve out-of-stock and low-stock alerts when stock is replenished."""
        stock_map = await self.product_repo.get_sellable_stock_for_products([product_id])
        sellable = stock_map.get(product_id, 0)
        inv = await self.inv_repo.get_or_create_inventory(product_id)

        if sellable > inv.reorder_level:
            # Resolve low stock and out of stock
            for alert_type in ["OUT_OF_STOCK", "LOW_STOCK"]:
                alert = await self.inv_repo.get_unresolved_alert(product_id, alert_type)
                if alert:
                    alert.is_resolved = True
                    alert.resolved_at = datetime.utcnow()
                    await self.inv_repo.db.flush()
        elif sellable > 0:
            # Resolve out of stock only
            alert = await self.inv_repo.get_unresolved_alert(product_id, "OUT_OF_STOCK")
            if alert:
                alert.is_resolved = True
                alert.resolved_at = datetime.utcnow()
                await self.inv_repo.db.flush()

    async def resolve_alert(self, alert_id: uuid.UUID, user_id: uuid.UUID) -> StockAlert:
        alert = await self.inv_repo.get_alert_by_id(alert_id)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Alert not found.", "error": {"code": "ALERT_NOT_FOUND"}},
            )
        return await self.inv_repo.resolve_alert(alert, user_id)

