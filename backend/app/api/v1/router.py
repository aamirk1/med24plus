from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin_auth,
    auth,
    delivery_auth,
    health,
    pharmacist_auth,
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
