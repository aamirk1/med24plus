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
    ORDERS_VIEW_OWN = "orders.view_own"
    ORDERS_CREATE = "orders.create"
    ORDERS_CANCEL_OWN = "orders.cancel_own"
    PRESCRIPTION_READ_OWN = "prescription.read_own"
    PRESCRIPTION_VIEW_OWN = "prescriptions.view_own"
    PRESCRIPTION_UPLOAD = "prescriptions.upload"
    PRESCRIPTION_CANCEL_OWN = "prescriptions.cancel_own"
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
    ORDERS_VIEW_ALL = "orders.view_all"
    ORDERS_VIEW_DETAILS = "orders.view_details"
    ORDERS_UPDATE_STATUS = "orders.update_status"
    ORDERS_REVIEW = "orders.review"
    ORDERS_APPROVE = "orders.approve"
    ORDERS_REJECT = "orders.reject"
    ORDERS_REQUEST_CLARIFICATION = "orders.request_clarification"
    ORDERS_CANCEL = "orders.cancel"
    ORDERS_VIEW_HISTORY = "orders.view_history"
    ORDERS_VIEW_INVOICE = "orders.view_invoice"
    ORDERS_MANAGE_INVOICE = "orders.manage_invoice"
    CUSTOMERS_READ = "customers.read"
    STAFF_MANAGE = "staff.manage"
    REPORTS_READ = "reports.read"
    SETTINGS_MANAGE = "settings.manage"
    SETTINGS_READ = "settings.read"
    SYSTEM_SETTINGS_READ = "settings.read"
    SYSTEM_SETTINGS_UPDATE = "settings.manage"

    # Pharmacist & Prescription Verification permissions
    PRESCRIPTIONS_READ = "prescriptions.read"
    PRESCRIPTIONS_VIEW_ALL = "prescriptions.view_all"
    PRESCRIPTIONS_VIEW_QUEUE = "prescriptions.view_queue"
    PRESCRIPTIONS_REVIEW = "prescriptions.review"
    PRESCRIPTIONS_APPROVE = "prescriptions.approve"
    PRESCRIPTIONS_REJECT = "prescriptions.reject"
    PRESCRIPTIONS_REQUEST_CLARIFICATION = "prescriptions.request_clarification"
    PRESCRIPTIONS_VIEW_HISTORY = "prescriptions.view_history"
    PRESCRIPTIONS_MANAGE = "prescriptions.manage"
    DISPENSING_READ = "dispensing.read"

    # Delivery Partner permissions
    DELIVERY_READ_ASSIGNED = "delivery.read_assigned"
    DELIVERY_UPDATE_ASSIGNED_STATUS = "delivery.update_assigned_status"

    # Payment Gateway & Financial Management permissions (Phase 9)
    PAYMENTS_VIEW_OWN = "payments.view_own"
    PAYMENTS_INITIATE = "payments.initiate"
    PAYMENTS_VERIFY_OWN = "payments.verify_own"
    PAYMENTS_VIEW_ALL = "payments.view_all"
    PAYMENTS_VIEW_DETAILS = "payments.view_details"
    PAYMENTS_MANAGE = "payments.manage"
    PAYMENTS_REFUND = "payments.refund"
    PAYMENTS_VIEW_REFUNDS = "payments.view_refunds"
    PAYMENTS_MANAGE_REFUNDS = "payments.manage_refunds"
    PAYMENTS_RECONCILE = "payments.reconcile"
    PAYMENTS_RESOLVE_DISCREPANCIES = "payments.resolve_discrepancies"
    PAYMENTS_MANAGE_SETTINGS = "payments.manage_settings"


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
        PermissionEnum.ORDERS_VIEW_OWN.value,
        PermissionEnum.ORDERS_CREATE.value,
        PermissionEnum.ORDERS_CANCEL_OWN.value,
        PermissionEnum.ORDERS_VIEW_INVOICE.value,
        PermissionEnum.ORDERS_VIEW_HISTORY.value,
        PermissionEnum.PRESCRIPTION_READ_OWN.value,
        PermissionEnum.PRESCRIPTION_VIEW_OWN.value,
        PermissionEnum.PRESCRIPTION_UPLOAD.value,
        PermissionEnum.PRESCRIPTION_CANCEL_OWN.value,
        PermissionEnum.NOTIFICATION_READ_OWN.value,
        PermissionEnum.PAYMENTS_VIEW_OWN.value,
        PermissionEnum.PAYMENTS_INITIATE.value,
        PermissionEnum.PAYMENTS_VERIFY_OWN.value,
    ],
    RoleEnum.PHARMACIST.value: [
        PermissionEnum.PRESCRIPTIONS_READ.value,
        PermissionEnum.PRESCRIPTIONS_VIEW_ALL.value,
        PermissionEnum.PRESCRIPTIONS_VIEW_QUEUE.value,
        PermissionEnum.PRESCRIPTIONS_REVIEW.value,
        PermissionEnum.PRESCRIPTIONS_APPROVE.value,
        PermissionEnum.PRESCRIPTIONS_REJECT.value,
        PermissionEnum.PRESCRIPTIONS_REQUEST_CLARIFICATION.value,
        PermissionEnum.PRESCRIPTIONS_VIEW_HISTORY.value,
        PermissionEnum.DISPENSING_READ.value,
        PermissionEnum.ORDERS_VIEW_ALL.value,
        PermissionEnum.ORDERS_VIEW_DETAILS.value,
        PermissionEnum.ORDERS_REVIEW.value,
        PermissionEnum.ORDERS_APPROVE.value,
        PermissionEnum.ORDERS_REJECT.value,
        PermissionEnum.ORDERS_REQUEST_CLARIFICATION.value,
        PermissionEnum.ORDERS_VIEW_HISTORY.value,
        PermissionEnum.ORDERS_VIEW_INVOICE.value,
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
        PermissionEnum.ORDERS_VIEW_ALL.value,
        PermissionEnum.ORDERS_VIEW_DETAILS.value,
        PermissionEnum.ORDERS_UPDATE_STATUS.value,
        PermissionEnum.ORDERS_CANCEL.value,
        PermissionEnum.ORDERS_VIEW_HISTORY.value,
        PermissionEnum.ORDERS_VIEW_INVOICE.value,
        PermissionEnum.ORDERS_MANAGE_INVOICE.value,
        PermissionEnum.CUSTOMERS_READ.value,
        PermissionEnum.PAYMENTS_VIEW_ALL.value,
        PermissionEnum.PAYMENTS_VIEW_DETAILS.value,
        PermissionEnum.PAYMENTS_VIEW_REFUNDS.value,
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
        PermissionEnum.ORDERS_VIEW_ALL.value,
        PermissionEnum.ORDERS_VIEW_DETAILS.value,
        PermissionEnum.ORDERS_UPDATE_STATUS.value,
        PermissionEnum.ORDERS_REVIEW.value,
        PermissionEnum.ORDERS_APPROVE.value,
        PermissionEnum.ORDERS_REJECT.value,
        PermissionEnum.ORDERS_REQUEST_CLARIFICATION.value,
        PermissionEnum.ORDERS_CANCEL.value,
        PermissionEnum.ORDERS_VIEW_HISTORY.value,
        PermissionEnum.ORDERS_VIEW_INVOICE.value,
        PermissionEnum.ORDERS_MANAGE_INVOICE.value,
        PermissionEnum.CUSTOMERS_READ.value,
        PermissionEnum.PRESCRIPTIONS_READ.value,
        PermissionEnum.PRESCRIPTIONS_VIEW_ALL.value,
        PermissionEnum.PRESCRIPTIONS_VIEW_QUEUE.value,
        PermissionEnum.PRESCRIPTIONS_VIEW_HISTORY.value,
        PermissionEnum.PRESCRIPTIONS_MANAGE.value,
        PermissionEnum.STAFF_MANAGE.value,
        PermissionEnum.REPORTS_READ.value,
        PermissionEnum.SETTINGS_MANAGE.value,
        PermissionEnum.PAYMENTS_VIEW_ALL.value,
        PermissionEnum.PAYMENTS_VIEW_DETAILS.value,
        PermissionEnum.PAYMENTS_MANAGE.value,
        PermissionEnum.PAYMENTS_REFUND.value,
        PermissionEnum.PAYMENTS_VIEW_REFUNDS.value,
        PermissionEnum.PAYMENTS_MANAGE_REFUNDS.value,
        PermissionEnum.PAYMENTS_RECONCILE.value,
        PermissionEnum.PAYMENTS_RESOLVE_DISCREPANCIES.value,
        PermissionEnum.PAYMENTS_MANAGE_SETTINGS.value,
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

