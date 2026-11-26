import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.inspection import inspect


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID
    batch_id: Optional[uuid.UUID] = None
    product_name_snapshot: str
    product_sku_snapshot: str
    generic_name_snapshot: Optional[str] = None
    strength_snapshot: Optional[str] = None
    pack_size_snapshot: Optional[str] = None
    manufacturer_snapshot: str
    batch_number_snapshot: Optional[str] = None
    expiry_date_snapshot: Optional[date] = None
    hsn_code_snapshot: str
    gst_rate_snapshot: Decimal
    unit_mrp: Decimal
    unit_price: Decimal
    quantity: int
    subtotal: Decimal
    discount_amount: Decimal = Decimal("0.00")
    taxable_amount: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")
    total_amount: Decimal
    prescription_required: bool = False


class OrderBatchAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    batch_id: uuid.UUID
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    allocated_quantity: int
    released_quantity: int = 0
    consumed_quantity: int = 0
    allocation_status: str
    created_at: datetime


class InventoryReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    batch_id: uuid.UUID
    batch_number: Optional[str] = None
    reserved_quantity: int
    released_quantity: int = 0
    consumed_quantity: int = 0
    status: str
    reserved_at: datetime
    released_at: Optional[datetime] = None
    consumed_at: Optional[datetime] = None


class OrderStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    previous_status: Optional[str] = None
    new_status: str
    actor_role: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    changed_by_id: Optional[uuid.UUID] = None
    changed_by_name: Optional[str] = None
    created_at: datetime


class OrderCancellationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    requested_by_id: Optional[uuid.UUID] = None
    cancellation_reason: str
    cancellation_type: str
    approved_by_id: Optional[uuid.UUID] = None
    cancellation_status: str
    created_at: datetime


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    invoice_number: str
    invoice_date: datetime
    invoice_type: str
    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    delivery_fee: Decimal
    grand_total: Decimal
    has_pdf: bool = False
    document_storage_key: Optional[str] = None
    pharmacy_details_snapshot: Dict[str, Any] = Field(default_factory=dict)
    customer_details_snapshot: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    prescription_id: Optional[uuid.UUID] = None
    status: str
    payment_status: str
    subtotal: Decimal
    discount_amount: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")
    cgst_amount: Decimal = Decimal("0.00")
    sgst_amount: Decimal = Decimal("0.00")
    igst_amount: Decimal = Decimal("0.00")
    delivery_fee: Decimal = Decimal("0.00")
    grand_total: Decimal
    currency: str = "INR"
    delivery_address_snapshot: Dict[str, Any]
    billing_address_snapshot: Optional[Dict[str, Any]] = None
    customer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    is_cold_chain_required: bool = False
    placed_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    item_count: int = 0
    payment_method: Optional[str] = "razorpay"
    razorpay_order: Optional[Dict[str, Any]] = None
    items: List[OrderItemResponse] = Field(default_factory=list)
    cancellation: Optional[OrderCancellationResponse] = None
    invoice: Optional[InvoiceResponse] = None
    status_history: List[OrderStatusHistoryResponse] = Field(default_factory=list)
    batch_allocations: List[OrderBatchAllocationResponse] = Field(default_factory=list)
    reservations: List[InventoryReservationResponse] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def safe_from_orm(cls, data: Any) -> Any:
        if hasattr(data, "_sa_instance_state"):
            state = inspect(data)
            result = {}
            for col in state.mapper.column_attrs:
                if col.key not in state.unloaded:
                    result[col.key] = getattr(data, col.key)
            for rel in state.mapper.relationships:
                if rel.key in state.unloaded:
                    result[rel.key] = [] if rel.uselist else None
                else:
                    try:
                        result[rel.key] = getattr(data, rel.key)
                    except Exception:
                        result[rel.key] = [] if rel.uselist else None
            for key in ("customer_name", "customer_phone", "customer_email", "item_count", "payment_method", "razorpay_order"):
                val = getattr(data, key, None)
                if val is not None:
                    result[key] = val
            return result
        return data


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(1, ge=1)
    unit_price: Optional[Decimal] = None


class OrderCreateRequest(BaseModel):
    delivery_address_id: Optional[uuid.UUID] = None
    shipping_address_id: Optional[uuid.UUID] = None
    payment_method: Optional[str] = "razorpay"
    coupon_code: Optional[str] = None
    discount_amount: Optional[Decimal] = Decimal("0.00")
    items: Optional[List[OrderItemCreate]] = None
    customer_notes: Optional[str] = None
    acknowledge_price_changes: bool = False
    checkout_validation_id: Optional[uuid.UUID] = None

    @model_validator(mode="before")
    @classmethod
    def handle_address_and_items(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "shipping_address_id" in values and "delivery_address_id" not in values:
                values["delivery_address_id"] = values["shipping_address_id"]
            elif "delivery_address_id" in values and "shipping_address_id" not in values:
                values["shipping_address_id"] = values["delivery_address_id"]
        return values


class OrderCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Mandatory cancellation reason")


class OrderStatusUpdateRequest(BaseModel):
    new_status: str = Field(..., description="Target lifecycle status")
    notes: Optional[str] = None
    reason: Optional[str] = None


class PharmacistOrderReviewRequest(BaseModel):
    notes: Optional[str] = None


class PharmacistOrderRejectRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500, description="Statutory clinical rejection reason")


class PharmacistOrderClarificationRequest(BaseModel):
    clarification_notes: str = Field(..., min_length=5, max_length=500, description="Details of clinical clarification required")


class AdminOrderMetrics(BaseModel):
    total_orders: int = 0
    placed: int = 0
    pending_payment: int = 0
    payment_confirmed: int = 0
    pharmacist_review: int = 0
    processing: int = 0
    ready_for_dispatch: int = 0
    dispatched: int = 0
    delivered: int = 0
    cancelled: int = 0
    rejected: int = 0
    failed: int = 0
