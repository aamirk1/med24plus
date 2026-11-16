import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.brand import Brand
    from app.models.category import Category
    from app.models.inventory import Inventory, InventoryBatch, StockAlert, StockMovement
    from app.models.order import OrderItem


class Product(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Pharmaceutical and healthcare product master catalog."""
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(
        String(250),
        index=True,
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(250),
        unique=True,
        index=True,
        nullable=False,
    )
    sku: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    generic_name: Mapped[str] = mapped_column(
        String(250),
        index=True,
        nullable=False,
    )
    composition: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    brand_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("brands.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    manufacturer: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    marketer: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    pack_size: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    dosage_form: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    strength: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    route_of_administration: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    storage_temperature: Mapped[str] = mapped_column(
        String(50),
        default="room_temperature",
        nullable=False,
    )
    is_cold_chain: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    requires_prescription: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    schedule_classification: Mapped[str] = mapped_column(
        String(20),
        default="OTC",
        nullable=False,
        index=True,
    )
    is_restricted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    mrp: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    selling_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    discount_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    hsn_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    gst_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("12.00"),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    # Relationships
    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="products",
    )
    brand: Mapped["Brand"] = relationship(
        "Brand",
        back_populates="products",
    )
    images: Mapped[List["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    attributes: Mapped[List["ProductAttribute"]] = relationship(
        "ProductAttribute",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    inventory: Mapped[Optional["Inventory"]] = relationship(
        "Inventory",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
    )
    batches: Mapped[List["InventoryBatch"]] = relationship(
        "InventoryBatch",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    stock_movements: Mapped[List["StockMovement"]] = relationship(
        "StockMovement",
        back_populates="product",
    )
    stock_alerts: Mapped[List["StockAlert"]] = relationship(
        "StockAlert",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="product",
    )

    __table_args__ = (
        CheckConstraint("selling_price <= mrp", name="check_product_selling_lte_mrp"),
        CheckConstraint("mrp >= 0", name="check_product_mrp_non_negative"),
        CheckConstraint("selling_price >= 0", name="check_product_selling_non_negative"),
        CheckConstraint("gst_rate >= 0", name="check_product_gst_rate_non_negative"),
        Index("ix_products_schedule_active", "schedule_classification", "is_active"),
        Index("ix_products_category_brand", "category_id", "brand_id"),
        Index("ix_products_generic_search", "generic_name", "is_active"),
    )


class ProductImage(Base, UUIDMixin, TimestampMixin):
    """Media assets and gallery images for product presentation."""
    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    image_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    alt_text: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="images",
    )


class ProductAttribute(Base, UUIDMixin, TimestampMixin):
    """Pharmacological attributes, therapeutic indications, and patient warnings."""
    __tablename__ = "product_attributes"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    attribute_key: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    attribute_value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="attributes",
    )

    __table_args__ = (
        Index("ix_product_attributes_lookup", "product_id", "attribute_key"),
    )

