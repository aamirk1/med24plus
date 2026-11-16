import math
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.permissions import PermissionEnum
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedData, PaginationMeta
from app.schemas.inventory import (
    ExpiryBatchItem,
    ExpirySummaryResponse,
    FEFOAllocationResult,
    InventoryBatchCreate,
    InventoryBatchResponse,
    InventoryBatchStatusUpdate,
    InventoryBatchUpdate,
    InventoryOverallSummaryResponse,
    InventoryValuationResponse,
    ProductInventoryResponse,
    StockAdjustmentCreate,
    StockAdjustmentResponse,
    StockAlertResolveRequest,
    StockAlertResponse,
    StockAlertSummaryResponse,
    StockMovementResponse,
    StockReceiveRequest,
    StockReceiveResponse,
)
from app.services.fefo_allocation_service import fefo_allocation_service
from app.services.inventory_service import InventoryService

router = APIRouter()


# ==============================================================================
# 1. Product-Wise Inventory Overview & Global Summary
# ==============================================================================

@router.get(
    "/summary",
    response_model=APIResponse[InventoryOverallSummaryResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def get_inventory_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """Retrieve global warehouse stock metrics, sellable capacity, and expiry counts."""
    service = InventoryService(db)
    data = await service.inv_repo.get_inventory_overall_summary()
    return APIResponse(
        success=True,
        message="Inventory summary retrieved successfully.",
        data=InventoryOverallSummaryResponse(**data),
    )


@router.get(
    "/valuation",
    response_model=APIResponse[InventoryValuationResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_VALUATION_READ.value))],
)
async def get_inventory_valuation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_VALUATION_READ.value)),
):
    """
    Statutory pharmacy inventory valuation report.
    Calculates cost valuation (purchase price) and retail valuation (MRP) across stock states.
    """
    service = InventoryService(db)
    data = await service.inv_repo.get_valuation_report()
    return APIResponse(
        success=True,
        message="Inventory valuation report generated successfully.",
        data=InventoryValuationResponse(**data),
    )


@router.get(
    "",
    response_model=APIResponse[PaginatedData[ProductInventoryResponse]],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def list_product_inventory(
    search: Optional[str] = Query(None, description="Search product name or SKU"),
    is_low_stock: Optional[bool] = Query(None, description="Filter products below reorder threshold"),
    is_out_of_stock: Optional[bool] = Query(None, description="Filter products with zero sellable stock"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """List product-level inventory status with active batch counts and sellable capacity."""
    service = InventoryService(db)
    items, total = await service.inv_repo.list_product_inventory(
        search=search,
        is_low_stock=is_low_stock,
        is_out_of_stock=is_out_of_stock,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Product inventory retrieved successfully.",
        data=PaginatedData(
            items=[ProductInventoryResponse(**i) for i in items],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


# ==============================================================================
# 2. Stock Receiving
# ==============================================================================

@router.post(
    "/receive-stock",
    response_model=APIResponse[StockReceiveResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_RECEIVE.value))],
)
async def receive_stock(
    data: StockReceiveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_RECEIVE.value)),
):
    """
    Receive inbound supplier medication consignment.
    Appends or creates batch, logs immutable stock movement, and updates inventory.
    """
    service = InventoryService(db)
    resp = await service.receive_stock(data, acting_user_id=current_user.id)
    await db.commit()
    return APIResponse(
        success=True,
        message=f"Received {data.received_quantity} units under batch {data.batch_number} successfully.",
        data=resp,
    )


# ==============================================================================
# 3. Batch Management
# ==============================================================================

@router.get(
    "/batches",
    response_model=APIResponse[PaginatedData[InventoryBatchResponse]],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def list_batches(
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by product UUID"),
    batch_status: Optional[str] = Query(None, description="active, quarantined, recalled, depleted, expired"),
    is_expired: Optional[bool] = Query(None, description="Filter expired status"),
    search: Optional[str] = Query(None, description="Search batch number, product, supplier"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """List physical medication batches with statutory expiry dates and sellable capacity."""
    service = InventoryService(db)
    items, total = await service.list_batches(
        product_id=product_id,
        batch_status=batch_status,
        is_expired=is_expired,
        search=search,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Batches retrieved successfully.",
        data=PaginatedData(
            items=items,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


@router.get(
    "/batches/{batch_id}",
    response_model=APIResponse[InventoryBatchResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def get_batch_by_id(
    batch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """Retrieve individual batch details."""
    service = InventoryService(db)
    batch = await service.get_batch(batch_id)
    return APIResponse(
        success=True,
        message="Batch retrieved successfully.",
        data=batch,
    )


@router.post(
    "/batches",
    response_model=APIResponse[InventoryBatchResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_BATCH_MANAGE.value))],
)
async def create_batch(
    data: InventoryBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_BATCH_MANAGE.value)),
):
    """Provision a new statutory medication batch."""
    service = InventoryService(db)
    receive_req = StockReceiveRequest(
        product_id=data.product_id,
        batch_number=data.batch_number,
        received_quantity=data.received_quantity,
        manufacturing_date=data.manufacturing_date,
        expiry_date=data.expiry_date,
        purchase_price=data.purchase_price,
        batch_mrp=data.batch_mrp,
        supplier_name=data.supplier_name,
        supplier_invoice_number=data.supplier_invoice_number,
        storage_location=data.storage_location,
        notes="Batch provisioned via batch management API",
    )
    recv_resp = await service.receive_stock(receive_req, acting_user_id=current_user.id)
    await db.commit()
    batch_resp = await service.get_batch(recv_resp.batch_id)
    return APIResponse(
        success=True,
        message="Batch created and inward movement recorded.",
        data=batch_resp,
    )


@router.put(
    "/batches/{batch_id}",
    response_model=APIResponse[InventoryBatchResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_BATCH_MANAGE.value))],
)
async def update_batch(
    batch_id: uuid.UUID,
    data: InventoryBatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_BATCH_MANAGE.value)),
):
    """Update batch location or supplier reference."""
    service = InventoryService(db)
    batch = await service.update_batch_details(batch_id, data)
    await db.commit()
    return APIResponse(
        success=True,
        message="Batch details updated.",
        data=batch,
    )


@router.patch(
    "/batches/{batch_id}/status",
    response_model=APIResponse[InventoryBatchResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_BATCH_MANAGE.value))],
)
async def update_batch_status(
    batch_id: uuid.UUID,
    data: InventoryBatchStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_BATCH_MANAGE.value)),
):
    """Update batch status (quarantine, recall, activate, deplete)."""
    service = InventoryService(db)
    batch = await service.set_batch_status(batch_id, data.batch_status, acting_user_id=current_user.id)
    await db.commit()
    return APIResponse(
        success=True,
        message=f"Batch status updated to '{data.batch_status}'.",
        data=batch,
    )


# ==============================================================================
# 4. Stock Adjustments (Audits)
# ==============================================================================

@router.post(
    "/adjustments",
    response_model=APIResponse[StockAdjustmentResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_ADJUST.value))],
)
async def create_stock_adjustment(
    data: StockAdjustmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_ADJUST.value)),
):
    """Perform formal physical audit stock adjustment with audit logging."""
    service = InventoryService(db)
    adj = await service.create_stock_adjustment(data, staff_user_id=current_user.id)
    await db.commit()
    full_adj = await service.inv_repo.get_adjustment_by_id(adj.id)
    return APIResponse(
        success=True,
        message=f"Stock adjustment {adj.adjustment_number} applied successfully.",
        data=StockAdjustmentResponse.model_validate(full_adj),
    )


@router.get(
    "/adjustments",
    response_model=APIResponse[PaginatedData[StockAdjustmentResponse]],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def list_stock_adjustments(
    status: Optional[str] = Query(None, description="Filter status (applied, draft)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """List historical stock adjustment requests and items."""
    service = InventoryService(db)
    items, total = await service.inv_repo.list_adjustments(status=status, page=page, page_size=page_size)
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Stock adjustments retrieved successfully.",
        data=PaginatedData(
            items=[StockAdjustmentResponse.model_validate(a) for a in items],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


@router.get(
    "/adjustments/{adjustment_id}",
    response_model=APIResponse[StockAdjustmentResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def get_stock_adjustment(
    adjustment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """Retrieve adjustment detail with all line item discrepancy notes."""
    service = InventoryService(db)
    adj = await service.inv_repo.get_adjustment_by_id(adjustment_id)
    if not adj:
        return APIResponse(success=False, message="Adjustment not found.", data=None)
    return APIResponse(
        success=True,
        message="Adjustment retrieved successfully.",
        data=StockAdjustmentResponse.model_validate(adj),
    )


# ==============================================================================
# 5. Stock Movement Ledger (Audit History)
# ==============================================================================

@router.get(
    "/stock-movements",
    response_model=APIResponse[PaginatedData[StockMovementResponse]],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_MOVEMENT_READ.value))],
)
async def list_stock_movements(
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by product UUID"),
    batch_id: Optional[uuid.UUID] = Query(None, description="Filter by batch UUID"),
    movement_type: Optional[str] = Query(None, description="INWARD_PURCHASE, DAMAGE_WRITEOFF, etc."),
    start_date: Optional[datetime] = Query(None, description="Filter start timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter end timestamp"),
    performed_by_id: Optional[uuid.UUID] = Query(None, description="Filter staff member"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_MOVEMENT_READ.value)),
):
    """Query immutable stock movement double-entry audit ledger."""
    service = InventoryService(db)
    items, total = await service.inv_repo.list_movements(
        product_id=product_id,
        batch_id=batch_id,
        movement_type=movement_type,
        start_date=start_date,
        end_date=end_date,
        performed_by_id=performed_by_id,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Stock movements retrieved successfully.",
        data=PaginatedData(
            items=[StockMovementResponse(**m) for m in items],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


# ==============================================================================
# 6. Expiry Management
# ==============================================================================

@router.get(
    "/expiry/summary",
    response_model=APIResponse[ExpirySummaryResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_EXPIRY_READ.value))],
)
async def get_expiry_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_EXPIRY_READ.value)),
):
    """Summary counts of batches and physical units in 7, 15, 30, 60, 90 day brackets."""
    service = InventoryService(db)
    summary = await service.inv_repo.get_expiry_summary()
    return APIResponse(
        success=True,
        message="Expiry summary calculated successfully.",
        data=ExpirySummaryResponse(**summary),
    )


@router.get(
    "/expiry",
    response_model=APIResponse[PaginatedData[ExpiryBatchItem]],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_EXPIRY_READ.value))],
)
async def list_expiries(
    days_ahead: Optional[int] = Query(None, description="Days to expiry horizon (e.g. 7, 15, 30, 60, 90)"),
    is_expired: bool = Query(False, description="Whether to list expired stock only"),
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by product UUID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_EXPIRY_READ.value)),
):
    """List batches nearing expiry or already expired, sorted chronologically."""
    service = InventoryService(db)
    items, total = await service.inv_repo.list_expiries(
        product_id=product_id,
        days_ahead=days_ahead,
        is_expired=is_expired,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Expiry list retrieved successfully.",
        data=PaginatedData(
            items=[ExpiryBatchItem(**i) for i in items],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


# ==============================================================================
# 7. Low-Stock Alerts
# ==============================================================================

@router.get(
    "/alerts/summary",
    response_model=APIResponse[StockAlertSummaryResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def get_alerts_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """Summary counts of unresolved inventory warnings."""
    service = InventoryService(db)
    summary = await service.inv_repo.get_alerts_summary()
    return APIResponse(
        success=True,
        message="Alert summary retrieved successfully.",
        data=StockAlertSummaryResponse(**summary),
    )


@router.get(
    "/alerts",
    response_model=APIResponse[PaginatedData[StockAlertResponse]],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def list_stock_alerts(
    is_resolved: Optional[bool] = Query(False, description="Filter resolution status (defaults to unresolved)"),
    alert_type: Optional[str] = Query(None, description="LOW_STOCK, OUT_OF_STOCK, EXPIRY_WARNING"),
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by product UUID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """List operational warnings for inventory replenishment."""
    service = InventoryService(db)
    items, total = await service.inv_repo.list_alerts(
        is_resolved=is_resolved,
        alert_type=alert_type,
        product_id=product_id,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    formatted = [
        StockAlertResponse(
            id=a.id,
            product_id=a.product_id,
            product_name=a.product.name if a.product else None,
            product_sku=a.product.sku if a.product else None,
            batch_id=a.batch_id,
            batch_number=a.batch.batch_number if a.batch else None,
            alert_type=a.alert_type,
            message=a.message,
            is_resolved=a.is_resolved,
            resolved_by_id=a.resolved_by_id,
            resolved_at=a.resolved_at,
            created_at=a.created_at,
        )
        for a in items
    ]

    return APIResponse(
        success=True,
        message="Stock alerts retrieved successfully.",
        data=PaginatedData(
            items=formatted,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


@router.patch(
    "/alerts/{alert_id}/resolve",
    response_model=APIResponse[StockAlertResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_ALERT_MANAGE.value))],
)
async def resolve_stock_alert(
    alert_id: uuid.UUID,
    data: Optional[StockAlertResolveRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_ALERT_MANAGE.value)),
):
    """Mark an inventory warning as investigated and resolved."""
    service = InventoryService(db)
    alert = await service.resolve_alert(alert_id, user_id=current_user.id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Alert marked as resolved.",
        data=StockAlertResponse(
            id=alert.id,
            product_id=alert.product_id,
            product_name=alert.product.name if alert.product else None,
            product_sku=alert.product.sku if alert.product else None,
            batch_id=alert.batch_id,
            batch_number=alert.batch.batch_number if alert.batch else None,
            alert_type=alert.alert_type,
            message=alert.message,
            is_resolved=alert.is_resolved,
            resolved_by_id=alert.resolved_by_id,
            resolved_at=alert.resolved_at,
            created_at=alert.created_at,
        ),
    )


# ==============================================================================
# 8. FEFO Allocation Preview Service Endpoint
# ==============================================================================

@router.get(
    "/fefo-preview",
    response_model=APIResponse[FEFOAllocationResult],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def preview_fefo_allocation(
    product_id: uuid.UUID = Query(..., description="Target medication UUID"),
    quantity: int = Query(..., gt=0, description="Quantity to simulate allocation for"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """
    Simulate statutory First Expiry, First Out (FEFO) allocation without committing stock.
    Demonstrates earliest expiring batch sequencing under Rule 65.
    """
    res = await fefo_allocation_service.allocate_product_stock(
        db=db,
        product_id=product_id,
        requested_quantity=quantity,
        lock_for_update=False,
        raise_if_insufficient=False,
    )
    return APIResponse(
        success=True,
        message="FEFO allocation calculated successfully.",
        data=res,
    )


# ==============================================================================
# 9. Individual Product Inventory
# ==============================================================================

@router.get(
    "/{product_id}",
    response_model=APIResponse[ProductInventoryResponse],
    dependencies=[Depends(require_permission(PermissionEnum.INVENTORY_READ.value))],
)
async def get_product_inventory(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.INVENTORY_READ.value)),
):
    """Retrieve inventory and batch health metrics for a single product."""
    service = InventoryService(db)
    items, total = await service.inv_repo.list_product_inventory(page=1, page_size=1)
    # Target search by product_id
    product = await service.product_repo.get_by_id(product_id)
    if not product:
        return APIResponse(success=False, message="Product not found.", data=None)

    items, _ = await service.inv_repo.list_product_inventory(search=product.sku, page=1, page_size=1)
    if not items:
        return APIResponse(success=False, message="Inventory details not found.", data=None)

    return APIResponse(
        success=True,
        message="Product inventory retrieved successfully.",
        data=ProductInventoryResponse(**items[0]),
    )

