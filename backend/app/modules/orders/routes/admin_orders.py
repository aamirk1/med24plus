from datetime import datetime
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.permissions import RoleEnum
from app.models.user import User
from app.modules.orders.services.invoice_service import InvoiceService
from app.modules.orders.services.order_cancellation_service import OrderCancellationService
from app.modules.orders.services.order_state_machine import OrderStateMachine
from app.repositories.order_repository import OrderRepository
from app.schemas.order import (
    AdminOrderMetrics,
    InvoiceResponse,
    OrderCancelRequest,
    OrderListResponse,
    OrderResponse,
    OrderStatusHistoryResponse,
    OrderStatusUpdateRequest,
)

router = APIRouter()

ALLOWED_ADMIN_ROLES = (
    RoleEnum.SUPER_ADMIN.value,
    RoleEnum.ADMIN.value,
    RoleEnum.STAFF.value,
    RoleEnum.PHARMACIST.value,
)


@router.get(
    "/metrics",
    response_model=AdminOrderMetrics,
    summary="Get aggregated order counts across lifecycle statuses for KPI cards",
)
async def get_order_metrics(
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    counts = await repo.get_admin_metrics()
    return AdminOrderMetrics(**counts)


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List all pharmacy orders with server-side filtering and search",
)
async def list_admin_orders(
    search: Optional[str] = Query(None, description="Search by order number, customer name, phone, or email"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by order status"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    customer_id: Optional[uuid.UUID] = Query(None, description="Filter by customer ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    orders, total = await repo.get_admin_orders(
        search=search,
        status=status_filter,
        payment_status=payment_status,
        customer_id=customer_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )

    items = []
    for o in orders:
        dto = OrderResponse.model_validate(o)
        if o.customer:
            dto.customer_name = o.customer.full_name
            dto.customer_phone = o.customer.phone
            dto.customer_email = o.customer.email
        dto.item_count = len(o.items)
        items.append(dto)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return OrderListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get full order details for administrative management and dispensing audit",
)
async def get_admin_order_detail(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(order_id, load_relations=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    dto = OrderResponse.model_validate(order)
    if order.customer:
        dto.customer_name = order.customer.full_name
        dto.customer_phone = order.customer.phone
        dto.customer_email = order.customer.email
    dto.item_count = len(order.items)
    return dto


@router.post(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Update order lifecycle status according to validated state machine",
)
async def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdateRequest,
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(order_id, load_relations=True, lock_for_update=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    state_machine = OrderStateMachine(db)
    order = await state_machine.transition_order(
        order=order,
        new_status=payload.new_status,
        acting_user=current_user,
        notes=payload.notes,
        reason=payload.reason,
    )

    dto = OrderResponse.model_validate(order)
    if order.customer:
        dto.customer_name = order.customer.full_name
        dto.customer_phone = order.customer.phone
        dto.customer_email = order.customer.email
    dto.item_count = len(order.items)
    return dto


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancel order by authorized staff/admin prior to dispatch",
)
async def admin_cancel_order(
    order_id: uuid.UUID,
    payload: OrderCancelRequest,
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    cancel_service = OrderCancellationService(db)
    order = await cancel_service.cancel_order(
        order_id=order_id,
        reason=payload.reason,
        acting_user=current_user,
        cancellation_type="admin_cancelled",
    )

    dto = OrderResponse.model_validate(order)
    if order.customer:
        dto.customer_name = order.customer.full_name
        dto.customer_phone = order.customer.phone
        dto.customer_email = order.customer.email
    dto.item_count = len(order.items)
    return dto


@router.get(
    "/{order_id}/history",
    response_model=list[OrderStatusHistoryResponse],
    summary="Get complete audit and status transition history for an order",
)
async def get_admin_order_history(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(order_id, load_relations=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    results = []
    for h in order.status_history:
        dto = OrderStatusHistoryResponse.model_validate(h)
        if h.changed_by:
            dto.changed_by_name = h.changed_by.full_name
        results.append(dto)
    return results


@router.post(
    "/{order_id}/generate-invoice",
    response_model=InvoiceResponse,
    summary="Generate or regenerate statutory Form 20 tax invoice for order",
)
async def generate_order_invoice(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(order_id, load_relations=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    inv_service = InvoiceService(db)
    invoice = await inv_service.generate_invoice_for_order(order, acting_user=current_user)
    dto = InvoiceResponse.model_validate(invoice)
    dto.has_pdf = invoice.document_storage_key is not None
    return dto
