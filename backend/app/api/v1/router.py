from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin_auth,
    auth,
    brands,
    categories,
    delivery_auth,
    health,
    inventory,
    pharmacist_auth,
    products,
    users,
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
