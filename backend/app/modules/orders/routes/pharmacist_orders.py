from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_verified_pharmacist
from app.models.user import User
from app.modules.orders.services.pharmacist_review_service import PharmacistReviewService
from app.schemas.order import (
    OrderListResponse,
    OrderResponse,
    PharmacistOrderClarificationRequest,
    PharmacistOrderRejectRequest,
    PharmacistOrderReviewRequest,
)

router = APIRouter()


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List orders requiring clinical pharmacist review under Rule 65",
)
async def list_pharmacist_review_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    service = PharmacistReviewService(db)
    orders, total = await service.get_review_queue(page=page, page_size=page_size)

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
    summary="Get detailed order view for clinical pharmacist verification",
)
async def get_pharmacist_order_detail(
    order_id: uuid.UUID,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    service = PharmacistReviewService(db)
    order = await service.get_order_review_details(order_id)
    dto = OrderResponse.model_validate(order)
    if order.customer:
        dto.customer_name = order.customer.full_name
        dto.customer_phone = order.customer.phone
        dto.customer_email = order.customer.email
    dto.item_count = len(order.items)
    return dto


@router.post(
    "/{order_id}/approve",
    response_model=OrderResponse,
    summary="Approve clinical order for dispensing under Rule 65",
)
async def approve_order_clinical(
    order_id: uuid.UUID,
    payload: PharmacistOrderReviewRequest,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    service = PharmacistReviewService(db)
    order = await service.approve_order(
        order_id=order_id,
        pharmacist_user=current_user,
        notes=payload.notes,
    )
    dto = OrderResponse.model_validate(order)
    if order.customer:
        dto.customer_name = order.customer.full_name
        dto.customer_phone = order.customer.phone
        dto.customer_email = order.customer.email
    dto.item_count = len(order.items)
    return dto


@router.post(
    "/{order_id}/reject",
    response_model=OrderResponse,
    summary="Reject clinical order with mandatory statutory reason",
)
async def reject_order_clinical(
    order_id: uuid.UUID,
    payload: PharmacistOrderRejectRequest,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    service = PharmacistReviewService(db)
    order = await service.reject_order(
        order_id=order_id,
        pharmacist_user=current_user,
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
    "/{order_id}/request-clarification",
    response_model=OrderResponse,
    summary="Request clinical clarification from customer for medication order",
)
async def request_order_clarification(
    order_id: uuid.UUID,
    payload: PharmacistOrderClarificationRequest,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    service = PharmacistReviewService(db)
    order = await service.request_clarification(
        order_id=order_id,
        pharmacist_user=current_user,
        clarification_notes=payload.clarification_notes,
    )
    dto = OrderResponse.model_validate(order)
    if order.customer:
        dto.customer_name = order.customer.full_name
        dto.customer_phone = order.customer.phone
        dto.customer_email = order.customer.email
    dto.item_count = len(order.items)
    return dto
