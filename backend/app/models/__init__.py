"""Med24Plus Database Models Registration Module."""

from app.models.address import UserAddress
from app.models.audit_log import AuditLog
from app.models.base import (
    Base,
    AuditMixin,
    JSONB_COMPAT,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDMixin,
)
from app.models.brand import Brand
from app.models.category import Category
from app.models.delivery import Delivery, DeliveryPartner, DeliveryStatusHistory
from app.models.inventory import (
    Inventory,
    InventoryBatch,
    StockAdjustment,
    StockAdjustmentItem,
    StockAlert,
    StockMovement,
)
from app.models.notification import Notification, NotificationPreference
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.payment import Payment, PaymentTransaction, Refund
from app.models.prescription import (
    Prescription,
    PrescriptionItem,
    PrescriptionReviewLog,
)
from app.models.product import Product, ProductAttribute, ProductImage
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.staff import (
    PharmacistProfile,
    PharmacistQualification,
    StaffProfile,
)
from app.models.user import User, UserProfile, UserSession

__all__ = [
    "Base",
    "UUIDMixin",
    "TimestampMixin",
    "SoftDeleteMixin",
    "AuditMixin",
    "JSONB_COMPAT",
    "User",
    "UserProfile",
    "UserSession",
    "Role",
    "Permission",
    "RolePermission",
    "UserRole",
    "UserAddress",
    "StaffProfile",
    "PharmacistProfile",
    "PharmacistQualification",
    "Category",
    "Brand",
    "Product",
    "ProductImage",
    "ProductAttribute",
    "Inventory",
    "InventoryBatch",
    "StockMovement",
    "StockAdjustment",
    "StockAdjustmentItem",
    "StockAlert",
    "Prescription",
    "PrescriptionItem",
    "PrescriptionReviewLog",
    "Order",
    "OrderItem",
    "OrderStatusHistory",
    "Payment",
    "Refund",
    "PaymentTransaction",
    "DeliveryPartner",
    "Delivery",
    "DeliveryStatusHistory",
    "Notification",
    "NotificationPreference",
    "AuditLog",
]

