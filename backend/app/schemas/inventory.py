import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ==============================================================================
# Inventory Batch Schemas
# ==============================================================================

class InventoryBatchBase(BaseModel):
    product_id: uuid.UUID = Field(..., description="Target product UUID")
    batch_number: str = Field(..., min_length=1, max_length=100, description="Manufacturer batch / lot number")
    manufacturing_date: date = Field(..., description="Date of manufacture")
    expiry_date: date = Field(..., description="Statutory expiry date")
    received_quantity: int = Field(..., gt=0, description="Total units received")
    purchase_price: Decimal = Field(..., ge=0, description="Wholesale purchase price per unit (INR)")
    batch_mrp: Decimal = Field(..., ge=0, description="Maximum Retail Price marked on pack (INR)")
    supplier_name: Optional[str] = Field(None, max_length=200, description="Authorized supplier / distributor")
    supplier_invoice_number: Optional[str] = Field(None, max_length=100)
    storage_location: Optional[str] = Field(None, max_length=100, description="Warehouse bin / rack location")

    @model_validator(mode="after")
    def validate_dates(self) -> "InventoryBatchBase":
        if self.expiry_date <= self.manufacturing_date:
            raise ValueError("Expiry date must be strictly after manufacturing date.")
        return self


class InventoryBatchCreate(InventoryBatchBase):
    pass


class InventoryBatchUpdate(BaseModel):
    storage_location: Optional[str] = Field(None, max_length=100)
    supplier_name: Optional[str] = Field(None, max_length=200)
    supplier_invoice_number: Optional[str] = Field(None, max_length=100)


class InventoryBatchStatusUpdate(BaseModel):
    batch_status: str = Field(..., description="active, quarantined, recalled, depleted, expired")


class InventoryBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    batch_number: str
    manufacturing_date: date
    expiry_date: date
    received_quantity: int
    available_quantity: int
    reserved_quantity: int
    damaged_quantity: int
    quarantined_quantity: int
    sellable_quantity: int = 0
    purchase_price: Decimal
    batch_mrp: Decimal
    supplier_name: Optional[str] = None
    supplier_invoice_number: Optional[str] = None
    batch_status: str
    storage_location: Optional[str] = None
    is_expired: bool = False
    days_to_expiry: int = 0
    created_at: datetime


# ==============================================================================
# Stock Receiving Schemas
# ==============================================================================

class StockReceiveRequest(BaseModel):
    product_id: uuid.UUID = Field(..., description="Product UUID")
    batch_number: str = Field(..., min_length=1, max_length=100)
    received_quantity: int = Field(..., gt=0, description="Number of units received")
    manufacturing_date: date
    expiry_date: date
    purchase_price: Decimal = Field(..., ge=0)
    batch_mrp: Decimal = Field(..., ge=0)
    supplier_name: Optional[str] = Field(None, max_length=200)
    supplier_invoice_number: Optional[str] = Field(None, max_length=100)
    storage_location: Optional[str] = Field(None, max_length=100)
    reference_number: Optional[str] = Field(None, max_length=100, description="Purchase order or consignment ref")
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self) -> "StockReceiveRequest":
        if self.expiry_date <= self.manufacturing_date:
            raise ValueError("Expiry date must be strictly after manufacturing date.")
        return self


class StockReceiveResponse(BaseModel):
    batch_id: uuid.UUID
    product_id: uuid.UUID
    batch_number: str
    quantity_received: int
    new_available_quantity: int
    movement_id: uuid.UUID
    received_at: datetime


# ==============================================================================
# Stock Adjustment Schemas
# ==============================================================================

class StockAdjustmentCreate(BaseModel):
    product_id: uuid.UUID
    batch_id: uuid.UUID
    adjustment_type: str = Field(..., description="increase, decrease, damaged, expired, correction")
    quantity: int = Field(..., gt=0, description="Units to adjust")
    reason: str = Field(..., min_length=3, max_length=100, description="Auditable justification")
    notes: Optional[str] = None


class StockAdjustmentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    batch_id: uuid.UUID
    product_id: uuid.UUID
    system_quantity: int
    counted_quantity: int
    quantity_delta: int
    discrepancy_reason: Optional[str] = None


class StockAdjustmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    adjustment_number: str
    reason: str
    notes: Optional[str] = None
    status: str
    requested_by_id: uuid.UUID
    approved_by_id: Optional[uuid.UUID] = None
    applied_at: Optional[datetime] = None
    created_at: datetime
    items: List[StockAdjustmentItemResponse] = Field(default_factory=list)


# ==============================================================================
# Stock Movement Schemas
# ==============================================================================

class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    batch_id: uuid.UUID
    batch_number: Optional[str] = None
    product_id: uuid.UUID
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    movement_type: str
    quantity: int
    balance_after: int
    reference_type: Optional[str] = None
    reference_id: Optional[uuid.UUID] = None
    performed_by_id: Optional[uuid.UUID] = None
    performed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


# ==============================================================================
# Inventory Summary & Product Inventory Schemas
# ==============================================================================

class ProductInventoryResponse(BaseModel):
    product_id: uuid.UUID
    product_name: str
    product_sku: str
    category_name: Optional[str] = None
    dosage_form: str
    total_received: int
    total_available: int
    total_reserved: int
    total_damaged: int
    total_quarantined: int
    total_sellable: int
    reorder_level: int
    is_low_stock: bool
    is_out_of_stock: bool
    active_batches_count: int
    expiring_soon_count: int
    expired_batches_count: int


class InventoryOverallSummaryResponse(BaseModel):
    total_catalog_products: int
    total_active_batches: int
    total_received_units: int
    total_available_units: int
    total_reserved_units: int
    total_damaged_units: int
    total_quarantined_units: int
    total_sellable_units: int
    low_stock_products_count: int
    out_of_stock_products_count: int
    expiring_30_days_count: int
    expired_batches_count: int


# ==============================================================================
# Expiry Tracking Schemas
# ==============================================================================

class ExpiryBatchItem(BaseModel):
    batch_id: uuid.UUID
    batch_number: str
    product_id: uuid.UUID
    product_name: str
    product_sku: str
    manufacturing_date: date
    expiry_date: date
    available_quantity: int
    reserved_quantity: int
    damaged_quantity: int
    quarantined_quantity: int
    batch_status: str
    days_to_expiry: int
    storage_location: Optional[str] = None


class ExpirySummaryResponse(BaseModel):
    expired_count: int
    expired_units: int
    expiring_7_days_count: int
    expiring_7_days_units: int
    expiring_15_days_count: int
    expiring_15_days_units: int
    expiring_30_days_count: int
    expiring_30_days_units: int
    expiring_60_days_count: int
    expiring_60_days_units: int
    expiring_90_days_count: int
    expiring_90_days_units: int


# ==============================================================================
# Stock Alert Schemas
# ==============================================================================

class StockAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    batch_id: Optional[uuid.UUID] = None
    batch_number: Optional[str] = None
    alert_type: str
    message: str
    is_resolved: bool
    resolved_by_id: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class StockAlertSummaryResponse(BaseModel):
    total_unresolved: int
    low_stock_count: int
    out_of_stock_count: int
    expiry_warning_count: int


class StockAlertResolveRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Resolution notes")


# ==============================================================================
# Inventory Valuation Schemas
# ==============================================================================

class StockStatusValuation(BaseModel):
    quantity: int
    purchase_value: Decimal
    mrp_value: Decimal


class ProductValuationItem(BaseModel):
    product_id: uuid.UUID
    product_name: str
    product_sku: str
    total_quantity: int
    sellable_quantity: int
    purchase_value: Decimal
    mrp_value: Decimal


class InventoryValuationResponse(BaseModel):
    as_of: datetime
    total_physical_units: int
    total_purchase_valuation: Decimal
    total_mrp_valuation: Decimal
    by_status: Dict[str, StockStatusValuation]
    top_products: List[ProductValuationItem] = Field(default_factory=list)
    valuation_policy_notes: str


# ==============================================================================
# FEFO Allocation Schemas
# ==============================================================================

class FEFOAllocatedBatch(BaseModel):
    batch_id: uuid.UUID
    batch_number: str
    expiry_date: date
    allocated_quantity: int
    unit_mrp: Decimal
    purchase_price: Decimal
    storage_location: Optional[str] = None


class FEFOAllocationResult(BaseModel):
    product_id: uuid.UUID
    requested_quantity: int
    total_allocated: int
    is_fully_allocated: bool
    shortfall: int
    batches: List[FEFOAllocatedBatch]

