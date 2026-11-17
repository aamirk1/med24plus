"""Order management module."""
from app.modules.orders.routes.customer_orders import router as customer_router
from app.modules.orders.routes.pharmacist_orders import router as pharmacist_router
from app.modules.orders.routes.admin_orders import router as admin_router

__all__ = [
    "customer_router",
    "pharmacist_router",
    "admin_router",
]
