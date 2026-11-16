import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ==============================================================================
# Category Schemas
# ==============================================================================

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Category display name")
    slug: Optional[str] = Field(None, max_length=150, description="URL-friendly slug (auto-generated if omitted)")
    description: Optional[str] = Field(None, description="Category description")
    image_url: Optional[str] = Field(None, max_length=500, description="Category icon or banner URL")
    parent_id: Optional[uuid.UUID] = Field(None, description="Parent category UUID for hierarchical trees")
    sort_order: int = Field(0, description="Display order sequence")
    is_active: bool = Field(True, description="Whether category is publicly visible")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryStatusUpdate(BaseModel):
    is_active: bool = Field(..., description="Target active status")


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    subcategories: List["CategoryResponse"] = Field(default_factory=list)


# ==============================================================================
# Brand Schemas
# ==============================================================================

class BrandBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Brand name")
    slug: Optional[str] = Field(None, max_length=150, description="URL-friendly brand slug")
    manufacturer_name: str = Field(..., min_length=2, max_length=200, description="Legal manufacturer entity")
    logo_url: Optional[str] = Field(None, max_length=500, description="Brand logo URL")
    description: Optional[str] = Field(None, description="Brand background details")
    country_of_origin: str = Field("India", max_length=100)
    is_active: bool = Field(True, description="Active status")


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    manufacturer_name: Optional[str] = Field(None, min_length=2, max_length=200)
    logo_url: Optional[str] = None
    description: Optional[str] = None
    country_of_origin: Optional[str] = None
    is_active: Optional[bool] = None


class BrandStatusUpdate(BaseModel):
    is_active: bool = Field(..., description="Target brand status")


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    manufacturer_name: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    country_of_origin: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ==============================================================================
# Product Image & Attribute Schemas
# ==============================================================================

class ProductImageBase(BaseModel):
    image_url: str = Field(..., max_length=500)
    alt_text: Optional[str] = Field(None, max_length=255)
    is_primary: bool = Field(False)
    sort_order: int = Field(0)


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool
    sort_order: int
    created_at: datetime


class ProductAttributeBase(BaseModel):
    attribute_key: str = Field(..., min_length=1, max_length=100)
    attribute_value: str = Field(..., min_length=1)


class ProductAttributeCreate(ProductAttributeBase):
    pass


class ProductAttributeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    attribute_key: str
    attribute_value: str
    created_at: datetime


# ==============================================================================
# Product CRUD Schemas
# ==============================================================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=250, description="Product brand name")
    slug: Optional[str] = Field(None, max_length=250, description="Unique slug")
    sku: str = Field(..., min_length=2, max_length=100, description="Stock Keeping Unit")
    generic_name: str = Field(..., min_length=2, max_length=250, description="Active pharmaceutical composition")
    composition: Optional[str] = Field(None, description="Detailed salt & excipient breakdown")
    category_id: uuid.UUID = Field(..., description="Category UUID")
    brand_id: uuid.UUID = Field(..., description="Brand UUID")
    manufacturer: str = Field(..., min_length=2, max_length=200)
    marketer: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    pack_size: str = Field(..., min_length=1, max_length=100, description="e.g. 10 Tablets / Strip, 100 ml Bottle")
    dosage_form: str = Field(..., min_length=1, max_length=50, description="e.g. Tablet, Syrup, Capsule, Ointment")
    strength: Optional[str] = Field(None, max_length=100, description="e.g. 500 mg, 10 mg/5ml")
    route_of_administration: Optional[str] = Field(None, max_length=50, description="e.g. Oral, Topical, Intravenous")
    storage_temperature: str = Field("room_temperature", max_length=50)
    is_cold_chain: bool = Field(False)
    requires_prescription: bool = Field(False)
    schedule_classification: str = Field("OTC", max_length=20, description="OTC, SCHEDULE_H, SCHEDULE_H1, SCHEDULE_X")
    is_restricted: bool = Field(False, description="Flagged under NDPS or Schedule X - restricted from sale")
    mrp: Decimal = Field(..., ge=0, description="Maximum Retail Price (INR)")
    selling_price: Decimal = Field(..., ge=0, description="Discounted Selling Price (INR)")
    hsn_code: str = Field(..., min_length=2, max_length=20, description="Harmonized System of Nomenclature code (e.g. 3004)")
    gst_rate: Decimal = Field(Decimal("12.00"), ge=0, description="GST Rate Percentage")
    is_active: bool = Field(True)

    @model_validator(mode="after")
    def validate_pricing(self) -> "ProductBase":
        if self.selling_price > self.mrp:
            raise ValueError("Selling price cannot exceed Maximum Retail Price (MRP).")
        return self


class ProductCreate(ProductBase):
    images: Optional[List[ProductImageCreate]] = None
    attributes: Optional[List[ProductAttributeCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=250)
    slug: Optional[str] = Field(None, max_length=250)
    sku: Optional[str] = Field(None, min_length=2, max_length=100)
    generic_name: Optional[str] = Field(None, min_length=2, max_length=250)
    composition: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    brand_id: Optional[uuid.UUID] = None
    manufacturer: Optional[str] = Field(None, min_length=2, max_length=200)
    marketer: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    pack_size: Optional[str] = Field(None, min_length=1, max_length=100)
    dosage_form: Optional[str] = Field(None, min_length=1, max_length=50)
    strength: Optional[str] = None
    route_of_administration: Optional[str] = None
    storage_temperature: Optional[str] = None
    is_cold_chain: Optional[bool] = None
    requires_prescription: Optional[bool] = None
    schedule_classification: Optional[str] = None
    is_restricted: Optional[bool] = None
    mrp: Optional[Decimal] = Field(None, ge=0)
    selling_price: Optional[Decimal] = Field(None, ge=0)
    hsn_code: Optional[str] = Field(None, min_length=2, max_length=20)
    gst_rate: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_prices_if_both_present(self) -> "ProductUpdate":
        if self.mrp is not None and self.selling_price is not None:
            if self.selling_price > self.mrp:
                raise ValueError("Selling price cannot exceed Maximum Retail Price (MRP).")
        return self


class ProductStatusUpdate(BaseModel):
    is_active: bool = Field(..., description="Target active status")


class ProductListItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    sku: str
    generic_name: str
    category_id: uuid.UUID
    category_name: Optional[str] = None
    brand_id: uuid.UUID
    brand_name: Optional[str] = None
    pack_size: str
    dosage_form: str
    strength: Optional[str] = None
    requires_prescription: bool
    schedule_classification: str
    is_restricted: bool
    mrp: Decimal
    selling_price: Decimal
    discount_percent: Decimal
    is_active: bool
    primary_image_url: Optional[str] = None
    # Derived from active, unexpired inventory batches:
    is_in_stock: bool = False
    sellable_quantity: int = 0
    created_at: datetime


class ProductDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    sku: str
    generic_name: str
    composition: Optional[str] = None
    category_id: uuid.UUID
    category: Optional[CategoryResponse] = None
    brand_id: uuid.UUID
    brand: Optional[BrandResponse] = None
    manufacturer: str
    marketer: Optional[str] = None
    description: Optional[str] = None
    pack_size: str
    dosage_form: str
    strength: Optional[str] = None
    route_of_administration: Optional[str] = None
    storage_temperature: str
    is_cold_chain: bool
    requires_prescription: bool
    schedule_classification: str
    is_restricted: bool
    mrp: Decimal
    selling_price: Decimal
    discount_percent: Decimal
    hsn_code: str
    gst_rate: Decimal
    is_active: bool
    images: List[ProductImageResponse] = Field(default_factory=list)
    attributes: List[ProductAttributeResponse] = Field(default_factory=list)
    # Dynamically derived stock availability:
    is_in_stock: bool = False
    sellable_quantity: int = 0
    created_at: datetime
    updated_at: datetime

