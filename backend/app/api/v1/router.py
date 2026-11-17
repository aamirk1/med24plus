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

# Public Product Catalog & Taxonomy
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(brands.router, prefix="/brands", tags=["Brands"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])

# Admin Catalog Management
api_router.include_router(categories.admin_router, prefix="/admin/categories", tags=["Admin Categories"])
api_router.include_router(brands.admin_router, prefix="/admin/brands", tags=["Admin Brands"])
api_router.include_router(products.admin_router, prefix="/admin/products", tags=["Admin Products"])

# Admin Inventory & Batch Management
api_router.include_router(inventory.router, prefix="/admin/inventory", tags=["Admin Inventory"])

# Customer Prescriptions Vault & Uploads (Rule 65)
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Customer Prescriptions"])

# Pharmacist Clinical Review & Verification Workbench (Rule 65)
api_router.include_router(admin_prescriptions.router, prefix="/admin/prescriptions", tags=["Pharmacist Verification Queue"])

# Customer Delivery Addresses
api_router.include_router(addresses.router, prefix="/addresses", tags=["Delivery Addresses"])

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
