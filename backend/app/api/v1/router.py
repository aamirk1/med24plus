from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin_auth,
    admin_prescriptions,
    auth,
    brands,
    categories,
    delivery_auth,
    health,
    inventory,
    pharmacist_auth,
    prescriptions,
    products,
    users,
    addresses,
    cart,
    checkout,
    admin_checkout,
    notifications,
    upload,
    settings,
    membership,
    coupons,
)
from app.modules.orders.routes import (
    admin_orders_router,
    customer_orders_router,
    pharmacist_orders_router,
)

api_router = APIRouter()

# Health & Status
api_router.include_router(health.router, tags=["Health"])

# Core Authentication & Session Management
api_router.include_router(auth.router, prefix="/auth", tags=["Customer Authentication"])

# Admin & Staff Access
api_router.include_router(admin_auth.router, prefix="/admin/auth", tags=["Admin Authentication"])

# Pharmacist Operations Access
api_router.include_router(pharmacist_auth.router, prefix="/pharmacist/auth", tags=["Pharmacist Authentication"])

# Delivery Fleet Access
api_router.include_router(delivery_auth.router, prefix="/delivery/auth", tags=["Delivery Partner Authentication"])

# User Profile & Addresses
api_router.include_router(users.router, prefix="/users", tags=["Users & Profiles"])
api_router.include_router(users.admin_router, prefix="/admin/users", tags=["Admin Users"])

# Public Product Catalog & Taxonomy
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(brands.router, prefix="/brands", tags=["Brands"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])

# Admin Catalog Management
api_router.include_router(categories.admin_router, prefix="/admin/categories", tags=["Admin Categories"])
api_router.include_router(brands.admin_router, prefix="/admin/brands", tags=["Admin Brands"])
api_router.include_router(products.admin_router, prefix="/admin/products", tags=["Admin Products"])
api_router.include_router(upload.admin_router, prefix="/admin/upload", tags=["Media Upload"])

# Admin Inventory & Batch Management
api_router.include_router(inventory.router, prefix="/admin/inventory", tags=["Admin Inventory"])

# Customer Prescriptions Vault & Uploads (Rule 65)
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Customer Prescriptions"])

# Pharmacist Clinical Review & Verification Workbench (Rule 65)
api_router.include_router(admin_prescriptions.router, prefix="/admin/prescriptions", tags=["Pharmacist Verification Queue"])

# Customer Delivery Addresses
api_router.include_router(addresses.router, prefix="/addresses", tags=["Delivery Addresses"])

# Notifications & Firebase Push Alerts
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications & Push Alerts"])

# Customer Shopping Cart
api_router.include_router(cart.router, prefix="/cart", tags=["Customer Shopping Cart"])

# Checkout Preparation & Validation
api_router.include_router(checkout.router, prefix="/checkout", tags=["Checkout Preparation"])

# Admin Checkout Rules & Delivery Serviceability
api_router.include_router(admin_checkout.router, prefix="/admin", tags=["Admin Checkout & Serviceability"])

# Phase 8: Order Management, FEFO Allocations & Statutory Dispensing
api_router.include_router(customer_orders_router, prefix="/orders", tags=["Customer Orders"])
api_router.include_router(pharmacist_orders_router, prefix="/pharmacist/orders", tags=["Pharmacist Order Review"])
api_router.include_router(admin_orders_router, prefix="/admin/orders", tags=["Admin Orders Management"])

# Store Settings & Drug Licensing (Public & Admin)
api_router.include_router(settings.router, prefix="/settings", tags=["Store Settings"])
api_router.include_router(settings.admin_router, prefix="/admin/settings", tags=["Admin Store Settings"])

# Med24Plus Membership Plans (Public & Admin)
api_router.include_router(membership.router, prefix="/membership", tags=["Membership"])
api_router.include_router(membership.admin_router, prefix="/admin/membership", tags=["Admin Membership"])

# Promotional Marketing Coupons & Discounts (Public & Admin)
api_router.include_router(coupons.router, prefix="/coupons", tags=["Customer Coupons & Offers"])
api_router.include_router(coupons.admin_router, prefix="/admin/coupons", tags=["Admin Marketing Coupons"])
api_router.include_router(coupons.admin_router, prefix="/marketing/coupons", tags=["Marketing Coupons"])


