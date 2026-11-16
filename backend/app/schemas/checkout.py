import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.address import AddressResponse
from app.schemas.cart import CartItemResponse


class CheckoutValidateRequest(BaseModel):
    delivery_address_id: uuid.UUID = Field(..., description="Customer delivery address UUID")
    acknowledge_price_changes: bool = Field(
        False,
        description="Whether customer acknowledges and accepts any detected price changes"
    )


class TaxBreakdown(BaseModel):
    taxable_subtotal: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    total_tax: Decimal
    rate_breakdowns: List[Dict[str, Any]] = []


class CheckoutValidationResponse(BaseModel):
    id: uuid.UUID
    cart_id: uuid.UUID
    customer_id: uuid.UUID
    delivery_address_id: Optional[uuid.UUID] = None
    selected_address: Optional[AddressResponse] = None

    # Status & Eligibility
    validation_status: str = Field(
        ...,
        description="'valid', 'valid_with_warnings', or 'blocked'"
    )
    is_eligible_for_checkout: bool = Field(
        ...,
        description="Strict Boolean indicating whether customer can proceed to subsequent order phase"
    )
    is_address_serviceable: bool = False
    serviceability_message: Optional[str] = None
    estimated_delivery_hours: Optional[int] = None

    # Authoritative monetary totals (Decimal)
    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    delivery_fee: Decimal
    grand_total: Decimal

    tax_breakdown: Dict[str, Any]
    items: List[CartItemResponse] = []

    # Diagnostics & Blocking Reasons
    warnings: List[str] = []
    blocking_errors: List[str] = []
    validation_errors: List[Dict[str, Any]] = []

    calculated_at: datetime
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckoutSummaryResponse(BaseModel):
    cart_id: uuid.UUID
    validation_status: str
    is_eligible_for_checkout: bool
    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    delivery_fee: Decimal
    grand_total: Decimal
    item_count: int
    items: List[CartItemResponse] = []
    selected_address: Optional[AddressResponse] = None
    is_address_serviceable: bool = False
    serviceability_message: Optional[str] = None
    warnings: List[str] = []
    blocking_errors: List[str] = []
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
