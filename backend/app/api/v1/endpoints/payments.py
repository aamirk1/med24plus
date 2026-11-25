import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, Header, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.order import Order
from app.models.user import User
from app.schemas.common import APIResponse
from app.services.razorpay_service import RazorpayService

router = APIRouter()


class RazorpayOrderCreateRequest(BaseModel):
    order_id: uuid.UUID = Field(..., description="UUID of the confirmed order to be paid")


class RazorpayPaymentVerifyRequest(BaseModel):
    order_id: uuid.UUID = Field(..., description="UUID of the order")
    razorpay_order_id: str = Field(..., description="Razorpay order id (order_...)")
    razorpay_payment_id: str = Field(..., description="Razorpay payment id (pay_...)")
    razorpay_signature: str = Field(..., description="Cryptographic HMAC-SHA256 signature from Razorpay")


@router.post(
    "/create-order",
    response_model=APIResponse[Dict[str, Any]],
    summary="Initialize Razorpay payment order for an order",
)
async def create_razorpay_order(
    payload: RazorpayOrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Order).where(Order.id == payload.order_id)
    order = (await db.execute(stmt)).scalars().first()

    if not order:
        return APIResponse(success=False, message="Order not found.", data=None)

    if order.customer_id != current_user.id:
        return APIResponse(success=False, message="You can only pay for your own orders.", data=None)

    service = RazorpayService(db)
    rzp_data = await service.create_razorpay_order(order, current_user)

    return APIResponse(
        success=True,
        message="Payment session created successfully.",
        data=rzp_data,
    )


@router.post(
    "/verify",
    response_model=APIResponse[Dict[str, Any]],
    summary="Verify cryptographic HMAC-SHA256 signature and capture payment",
)
async def verify_payment(
    payload: RazorpayPaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = RazorpayService(db)
    result = await service.verify_and_capture(
        order_id=payload.order_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
        current_user=current_user,
    )

    return APIResponse(
        success=True,
        message=result.get("message", "Payment verified successfully."),
        data=result,
    )


@router.post(
    "/webhook",
    summary="Razorpay asynchronous webhook listener",
)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header("", alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db),
):
    body_bytes = await request.body()
    service = RazorpayService(db)
    return await service.handle_webhook(body_bytes, x_razorpay_signature)
