from datetime import datetime
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.modules.orders.services.invoice_service import InvoiceService
from app.modules.orders.services.order_cancellation_service import OrderCancellationService
from app.modules.orders.services.order_creation_service import OrderCreationService
from app.repositories.order_repository import OrderRepository
from app.schemas.order import (
    InvoiceResponse,
    OrderCancelRequest,
    OrderCreateRequest,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
    OrderStatusHistoryResponse,
)

router = APIRouter()


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create persistent medication order from validated checkout",
)
async def create_order(
    payload: OrderCreateRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Convert validated customer cart into a persistent statutory order.
    Enforces idempotency, recalculates pricing, allocates inventory via FEFO,
    and creates batch reservations atomically.
    """
    service = OrderCreationService(db)
    result = await service.create_order_from_cart(
        customer=current_user,
        payload=payload,
        idempotency_key=idempotency_key,
    )
    return result


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List customer's orders with pagination and status filters",
)
async def list_customer_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    orders, total = await repo.get_customer_orders(
        customer_id=current_user.id,
        status=status_filter,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )

    items = []
    for o in orders:
        dto = OrderResponse.model_validate(o)
        dto.customer_name = current_user.full_name
        dto.customer_phone = current_user.phone
        dto.customer_email = current_user.email
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
    summary="Get customer's specific order by UUID or order number",
)
async def get_order_detail(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = None
    try:
        parsed_uuid = uuid.UUID(order_id)
        order = await repo.get_by_id(parsed_uuid, load_relations=True)
    except (ValueError, TypeError):
        pass

    if not order:
        order = await repo.get_by_order_number(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "You can only view your own orders.", "error": {"code": "FORBIDDEN_ORDER_ACCESS"}},
        )

    dto = OrderResponse.model_validate(order)
    dto.customer_name = current_user.full_name
    dto.customer_phone = current_user.phone
    dto.customer_email = current_user.email
    dto.item_count = len(order.items)
    return dto


@router.get(
    "/{order_id}/items",
    response_model=list[OrderItemResponse],
    summary="Get line items for customer's order",
)
async def get_order_items(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(order_id, load_relations=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "Access forbidden.", "error": {"code": "FORBIDDEN_ORDER_ACCESS"}},
        )

    return [OrderItemResponse.model_validate(item) for item in order.items]


@router.get(
    "/{order_id}/history",
    response_model=list[OrderStatusHistoryResponse],
    summary="Get status transition history for customer's order",
)
async def get_order_history(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(order_id, load_relations=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "Access forbidden.", "error": {"code": "FORBIDDEN_ORDER_ACCESS"}},
        )

    # Filter out internal notes for customer view
    results = []
    for h in order.status_history:
        dto = OrderStatusHistoryResponse.model_validate(h)
        if h.actor_role in {"admin", "staff"} and h.actor_role != "pharmacist":
            dto.notes = None
        results.append(dto)
    return results


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancel order by customer prior to dispatch",
)
async def cancel_order(
    order_id: uuid.UUID,
    payload: OrderCancelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cancel_service = OrderCancellationService(db)
    order = await cancel_service.cancel_order(
        order_id=order_id,
        reason=payload.reason,
        acting_user=current_user,
        cancellation_type="customer_requested",
    )
    dto = OrderResponse.model_validate(order)
    dto.customer_name = current_user.full_name
    dto.customer_phone = current_user.phone
    dto.customer_email = current_user.email
    dto.item_count = len(order.items)
    return dto


@router.get(
    "/{order_id}/invoice",
    summary="Download or view invoice PDF for order",
)
async def download_invoice(
    order_id: uuid.UUID,
    format: str = Query("pdf", description="Format: pdf or json"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(order_id, load_relations=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
        )

    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "Access forbidden.", "error": {"code": "FORBIDDEN_ORDER_ACCESS"}},
        )

    inv_service = InvoiceService(db)
    invoice = order.invoice
    if not invoice:
        # Generate on demand
        invoice = await inv_service.generate_invoice_for_order(order, acting_user=current_user)

    if format.lower() == "json":
        dto = InvoiceResponse.model_validate(invoice)
        dto.has_pdf = invoice.document_storage_key is not None
        return dto

    pdf_bytes = inv_service.get_invoice_pdf_bytes(invoice)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{invoice.invoice_number}.pdf"',
        },
    )
