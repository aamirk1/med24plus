from enum import Enum
from typing import Dict, List, Set


class RoleEnum(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    PHARMACIST = "pharmacist"
    STAFF = "staff"
    DELIVERY_PARTNER = "delivery_partner"
    CUSTOMER = "customer"


class PermissionEnum(str, Enum):
    # Customer permissions
    PROFILE_READ = "profile.read"
    PROFILE_UPDATE = "profile.update"
    ADDRESS_READ = "address.read"
    ADDRESS_CREATE = "address.create"
    ADDRESS_UPDATE = "address.update"
    ADDRESS_DELETE = "address.delete"
    ORDER_READ_OWN = "order.read_own"
    PRESCRIPTION_READ_OWN = "prescription.read_own"
    NOTIFICATION_READ_OWN = "notification.read_own"

    # Admin & Catalog permissions
    DASHBOARD_READ = "dashboard.read"
    USERS_READ = "users.read"
    USERS_MANAGE = "users.manage"
    PRODUCTS_READ = "products.read"
    PRODUCTS_CREATE = "products.create"
    PRODUCTS_UPDATE = "products.update"
    PRODUCTS_DELETE = "products.delete"
    PRODUCTS_MANAGE_STATUS = "products.manage_status"
    PRODUCTS_MANAGE = "products.manage"

    CATEGORIES_READ = "categories.read"
    CATEGORIES_CREATE = "categories.create"
    CATEGORIES_UPDATE = "categories.update"
    CATEGORIES_DELETE = "categories.delete"
    CATEGORIES_MANAGE = "categories.manage"

    BRANDS_READ = "brands.read"
    BRANDS_CREATE = "brands.create"
    BRANDS_UPDATE = "brands.update"
    BRANDS_DELETE = "brands.delete"
    BRANDS_MANAGE = "brands.manage"

    INVENTORY_READ = "inventory.read"
    INVENTORY_RECEIVE = "inventory.receive"
    INVENTORY_ADJUST = "inventory.adjust"
    INVENTORY_BATCH_MANAGE = "inventory.batch_manage"
    INVENTORY_MOVEMENT_READ = "inventory.movement_read"
    INVENTORY_EXPIRY_READ = "inventory.expiry_read"
    INVENTORY_VALUATION_READ = "inventory.valuation_read"
    INVENTORY_ALERT_MANAGE = "inventory.alert_manage"
    INVENTORY_MANAGE = "inventory.manage"

    ORDERS_READ = "orders.read"
    ORDERS_MANAGE = "orders.manage"
    CUSTOMERS_READ = "customers.read"
    PRESCRIPTIONS_READ = "prescriptions.read"
    STAFF_MANAGE = "staff.manage"
    REPORTS_READ = "reports.read"
    SETTINGS_MANAGE = "settings.manage"

    # Pharmacist permissions
    PRESCRIPTIONS_REVIEW = "prescriptions.review"
    PRESCRIPTIONS_APPROVE = "prescriptions.approve"
    PRESCRIPTIONS_REJECT = "prescriptions.reject"
    DISPENSING_READ = "dispensing.read"

    # Delivery Partner permissions
    DELIVERY_READ_ASSIGNED = "delivery.read_assigned"
    DELIVERY_UPDATE_ASSIGNED_STATUS = "delivery.update_assigned_status"


# Default permission mappings by role
ROLE_DEFAULT_PERMISSIONS: Dict[str, List[str]] = {
    RoleEnum.CUSTOMER.value: [
        PermissionEnum.PROFILE_READ.value,
        PermissionEnum.PROFILE_UPDATE.value,
        PermissionEnum.ADDRESS_READ.value,
        PermissionEnum.ADDRESS_CREATE.value,
        PermissionEnum.ADDRESS_UPDATE.value,
        PermissionEnum.ADDRESS_DELETE.value,
        PermissionEnum.ORDER_READ_OWN.value,
        PermissionEnum.PRESCRIPTION_READ_OWN.value,
        PermissionEnum.NOTIFICATION_READ_OWN.value,
    ],
    RoleEnum.PHARMACIST.value: [
        PermissionEnum.PRESCRIPTIONS_READ.value,
        PermissionEnum.PRESCRIPTIONS_REVIEW.value,
        PermissionEnum.PRESCRIPTIONS_APPROVE.value,
        PermissionEnum.PRESCRIPTIONS_REJECT.value,
        PermissionEnum.DISPENSING_READ.value,
        PermissionEnum.INVENTORY_READ.value,
        PermissionEnum.INVENTORY_EXPIRY_READ.value,
        PermissionEnum.INVENTORY_MOVEMENT_READ.value,
        PermissionEnum.PRODUCTS_READ.value,
    ],
    RoleEnum.DELIVERY_PARTNER.value: [
        PermissionEnum.DELIVERY_READ_ASSIGNED.value,
        PermissionEnum.DELIVERY_UPDATE_ASSIGNED_STATUS.value,
    ],
    RoleEnum.STAFF.value: [
        PermissionEnum.DASHBOARD_READ.value,
        PermissionEnum.PRODUCTS_READ.value,
        PermissionEnum.CATEGORIES_READ.value,
        PermissionEnum.BRANDS_READ.value,
        PermissionEnum.INVENTORY_READ.value,
        PermissionEnum.INVENTORY_EXPIRY_READ.value,
        PermissionEnum.ORDERS_READ.value,
        PermissionEnum.CUSTOMERS_READ.value,
    ],
    RoleEnum.ADMIN.value: [
        PermissionEnum.DASHBOARD_READ.value,
        PermissionEnum.USERS_READ.value,
        PermissionEnum.USERS_MANAGE.value,
        PermissionEnum.PRODUCTS_READ.value,
        PermissionEnum.PRODUCTS_CREATE.value,
        PermissionEnum.PRODUCTS_UPDATE.value,
        PermissionEnum.PRODUCTS_DELETE.value,
        PermissionEnum.PRODUCTS_MANAGE_STATUS.value,
        PermissionEnum.PRODUCTS_MANAGE.value,
        PermissionEnum.CATEGORIES_READ.value,
        PermissionEnum.CATEGORIES_CREATE.value,
        PermissionEnum.CATEGORIES_UPDATE.value,
        PermissionEnum.CATEGORIES_DELETE.value,
        PermissionEnum.CATEGORIES_MANAGE.value,
        PermissionEnum.BRANDS_READ.value,
        PermissionEnum.BRANDS_CREATE.value,
        PermissionEnum.BRANDS_UPDATE.value,
        PermissionEnum.BRANDS_DELETE.value,
        PermissionEnum.BRANDS_MANAGE.value,
        PermissionEnum.INVENTORY_READ.value,
        PermissionEnum.INVENTORY_RECEIVE.value,
        PermissionEnum.INVENTORY_ADJUST.value,
        PermissionEnum.INVENTORY_BATCH_MANAGE.value,
        PermissionEnum.INVENTORY_MOVEMENT_READ.value,
        PermissionEnum.INVENTORY_EXPIRY_READ.value,
        PermissionEnum.INVENTORY_VALUATION_READ.value,
        PermissionEnum.INVENTORY_ALERT_MANAGE.value,
        PermissionEnum.INVENTORY_MANAGE.value,
        PermissionEnum.ORDERS_READ.value,
        PermissionEnum.ORDERS_MANAGE.value,
        PermissionEnum.CUSTOMERS_READ.value,
        PermissionEnum.PRESCRIPTIONS_READ.value,
        PermissionEnum.STAFF_MANAGE.value,
        PermissionEnum.REPORTS_READ.value,
        PermissionEnum.SETTINGS_MANAGE.value,
    ],
    RoleEnum.SUPER_ADMIN.value: [
        # Super admin has all permissions
        perm.value for perm in PermissionEnum
    ],
}


def get_permissions_for_roles(roles: List[str]) -> Set[str]:
    """Collate unique permissions for a list of assigned roles."""
    permissions: Set[str] = set()
    for role in roles:
        if role in ROLE_DEFAULT_PERMISSIONS:
            permissions.update(ROLE_DEFAULT_PERMISSIONS[role])
    return permissions

