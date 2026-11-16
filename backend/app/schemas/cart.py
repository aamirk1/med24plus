import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CartItemAddRequest(BaseModel):
    product_id: uuid.UUID = Field(..., description="UUID of medicine/product to add")
    quantity: int = Field(1, gt=0, le=50, description="Requested purchase quantity (must be positive)")


class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(..., gt=0, le=50, description="Updated purchase quantity (must be strictly positive)")


class CartItemResponse(BaseModel):
    id: uuid.UUID
    cart_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_slug: str
    product_sku: str
    generic_name: str
    pack_size: str
    dosage_form: str
    strength: Optional[str] = None
    brand_name: Optional[str] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    is_cold_chain: bool = False

    # Authoritative server-side pricing
    unit_price: Decimal = Field(..., description="Current server selling price per unit")
    unit_mrp: Decimal = Field(..., description="Maximum Retail Price (statutory MRP)")
    unit_price_snapshot: Optional[Decimal] = Field(None, description="Price when originally placed in cart")
    is_price_changed: bool = Field(False, description="True if current unit price differs from cart snapshot")
    previous_price: Optional[Decimal] = Field(None, description="Previous price before price revision")

    # Quantities and line computations
    quantity: int
    subtotal: Decimal = Field(..., description="Selling price * quantity")
    mrp_subtotal: Decimal = Field(..., description="MRP * quantity")
    discount_amount: Decimal = Field(..., description="mrp_subtotal - subtotal")
    gst_rate: Decimal = Field(..., description="Applicable statutory GST percentage")
    tax_amount: Decimal = Field(..., description="GST component included in item subtotal")

    # Inventory availability
    is_available: bool = True
    sellable_stock: int = 0

    # Prescription validation
    requires_prescription: bool = False
    schedule_classification: str = "OTC"
    prescription_status: str = Field("not_required", description="not_required, eligible, prescription_required, pending_review, rejected, expired")
    prescription_reference: Optional[str] = None
    prescription_message: Optional[str] = None

    # Item validation state
    validation_status: str = Field(
        "available",
        description="available, insufficient_stock, inactive_product, price_changed, prescription_required, prescription_pending_review, prescription_rejected, prescription_expired, pharmacist_review_required"
    )
    status_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    status: str
    items: List[CartItemResponse] = []
    item_count: int = 0
    total_quantity: int = 0

    # Financial breakdown (Calculated server-side using Decimal)
    subtotal: Decimal = Field(Decimal("0.00"), description="Sum of line item selling prices")
    total_mrp: Decimal = Field(Decimal("0.00"), description="Sum of line item MRPs")
    total_discount: Decimal = Field(Decimal("0.00"), description="Total customer savings off MRP")
    taxable_amount: Decimal = Field(Decimal("0.00"), description="Net taxable amount excluding GST")
    total_tax: Decimal = Field(Decimal("0.00"), description="Total statutory GST (CGST + SGST)")
    delivery_fee: Decimal = Field(Decimal("0.00"), description="Calculated delivery charge")
    free_delivery_threshold: Decimal = Field(Decimal("499.00"), description="Threshold for zero delivery charge")
    amount_needed_for_free_delivery: Decimal = Field(Decimal("0.00"), description="Shortfall to qualify for free delivery")
    grand_total: Decimal = Field(Decimal("0.00"), description="Final payable amount (subtotal + delivery_fee)")

    # Status indicators
    has_prescription_items: bool = False
    has_cold_chain_items: bool = False
    has_price_changes: bool = False
    is_valid_for_checkout: bool = True

    warnings: List[str] = []
    blocking_errors: List[str] = []

    model_config = ConfigDict(from_attributes=True)
