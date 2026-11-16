import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.checkout import (
    CheckoutSummaryResponse,
    CheckoutValidateRequest,
    CheckoutValidationResponse,
)
from app.schemas.common import APIResponse
from app.services.checkout_service import CheckoutService

router = APIRouter()


@router.get(
    "/summary",
    response_model=APIResponse[CheckoutSummaryResponse],
    summary="Get checkout preparation summary",
)
async def get_checkout_summary(
    address_id: Optional[uuid.UUID] = Query(None, description="Optional address to evaluate"),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve real-time checkout summary including item totals, statutory tax estimation,
    default address serviceability, and prescription validation prerequisites.
    """
    service = CheckoutService(db)
    summary = await service.get_checkout_summary(current_user.id, address_id)
    return APIResponse(
        success=True,
        message="Checkout summary generated.",
        data=summary,
    )


@router.post(
    "/validate",
    response_model=APIResponse[CheckoutValidationResponse],
    status_code=status.HTTP_200_OK,
    summary="Validate cart, inventory, prescription, and address for checkout",
)
async def validate_checkout(
    payload: CheckoutValidateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute comprehensive multi-factor checkout validation pipeline.
    Validates product availability, sellable stock, prescription approvals, and address serviceability.
    
    IMPORTANT: Returns quote valid for 15 minutes. Does not reserve inventory or create an order.
    """
    service = CheckoutService(db)
    validation_response = await service.validate_checkout(current_user.id, payload)
    return APIResponse(
        success=True,
        message=(
            "Checkout validation successful. Ready to proceed."
            if validation_response.is_eligible_for_checkout
            else "Checkout validation blocked. Please resolve listed errors."
        ),
        data=validation_response,
    )
