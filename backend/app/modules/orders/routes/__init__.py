from app.modules.orders.routes.admin_orders import router as admin_orders_router
from app.modules.orders.routes.customer_orders import router as customer_orders_router
from app.modules.orders.routes.pharmacist_orders import router as pharmacist_orders_router

__all__ = [
    "customer_orders_router",
    "pharmacist_orders_router",
    "admin_orders_router",
]
