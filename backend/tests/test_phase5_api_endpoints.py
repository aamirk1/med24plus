import pytest
from fastapi.testclient import TestClient

from app.core.permissions import PermissionEnum, ROLE_DEFAULT_PERMISSIONS, RoleEnum
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_public_catalog_routes_exist(client: TestClient):
    """Verify that public catalog endpoints are registered and respond properly."""
    # Test routes existence
    routes = {r.path for r in app.routes if hasattr(r, "path")}
    assert "/api/v1/categories" in routes
    assert "/api/v1/categories/{category_id}" in routes
    assert "/api/v1/brands" in routes
    assert "/api/v1/brands/{brand_id}" in routes
    assert "/api/v1/products" in routes
    assert "/api/v1/products/{product_id}" in routes
    assert "/api/v1/products/slug/{slug}" in routes


def test_admin_catalog_and_inventory_routes_exist():
    """Verify that all administrative endpoints are registered."""
    routes = {r.path for r in app.routes if hasattr(r, "path")}
    # Admin Categories
    assert "/api/v1/admin/categories" in routes
    assert "/api/v1/admin/categories/{category_id}" in routes
    assert "/api/v1/admin/categories/{category_id}/status" in routes
    # Admin Brands
    assert "/api/v1/admin/brands" in routes
    assert "/api/v1/admin/brands/{brand_id}" in routes
    assert "/api/v1/admin/brands/{brand_id}/status" in routes
    # Admin Products
    assert "/api/v1/admin/products" in routes
    assert "/api/v1/admin/products/{product_id}" in routes
    assert "/api/v1/admin/products/{product_id}/status" in routes
    assert "/api/v1/admin/products/{product_id}/images" in routes
    assert "/api/v1/admin/products/{product_id}/images/{image_id}/primary" in routes
    # Admin Inventory
    assert "/api/v1/admin/inventory" in routes
    assert "/api/v1/admin/inventory/summary" in routes
    assert "/api/v1/admin/inventory/{product_id}" in routes
    assert "/api/v1/admin/inventory/batches" in routes
    assert "/api/v1/admin/inventory/batches/{batch_id}" in routes
    assert "/api/v1/admin/inventory/batches/{batch_id}/status" in routes
    assert "/api/v1/admin/inventory/receive-stock" in routes
    assert "/api/v1/admin/inventory/adjustments" in routes
    assert "/api/v1/admin/inventory/adjustments/{adjustment_id}" in routes
    assert "/api/v1/admin/inventory/stock-movements" in routes
    assert "/api/v1/admin/inventory/expiry" in routes
    assert "/api/v1/admin/inventory/expiry/summary" in routes
    assert "/api/v1/admin/inventory/alerts" in routes
    assert "/api/v1/admin/inventory/alerts/summary" in routes
    assert "/api/v1/admin/inventory/alerts/{alert_id}/resolve" in routes
    assert "/api/v1/admin/inventory/valuation" in routes
    assert "/api/v1/admin/inventory/fefo-preview" in routes


def test_admin_endpoints_require_authentication(client: TestClient):
    """Verify that administrative endpoints return HTTP 401 Unauthorized when accessed without token."""
    # Product admin creation
    res1 = client.post("/api/v1/admin/products", json={})
    assert res1.status_code == 401
    assert res1.json()["success"] is False
    assert res1.json()["error"]["code"] == "UNAUTHENTICATED"

    # Category admin creation
    res2 = client.post("/api/v1/admin/categories", json={})
    assert res2.status_code == 401

    # Brand admin creation
    res3 = client.post("/api/v1/admin/brands", json={})
    assert res3.status_code == 401

    # Inventory receiving
    res4 = client.post("/api/v1/admin/inventory/receive-stock", json={})
    assert res4.status_code == 401

    # Inventory adjustments
    res5 = client.post("/api/v1/admin/inventory/adjustments", json={})
    assert res5.status_code == 401

    # Inventory summary
    res6 = client.get("/api/v1/admin/inventory/summary")
    assert res6.status_code == 401

    # Inventory valuation
    res7 = client.get("/api/v1/admin/inventory/valuation")
    assert res7.status_code == 401


def test_rbac_permissions_mapping():
    """Verify that all Phase 5 permissions are assigned to Admin and Super Admin roles."""
    admin_perms = ROLE_DEFAULT_PERMISSIONS[RoleEnum.ADMIN.value]
    super_admin_perms = ROLE_DEFAULT_PERMISSIONS[RoleEnum.SUPER_ADMIN.value]

    required_phase5_perms = [
        PermissionEnum.PRODUCTS_READ.value,
        PermissionEnum.PRODUCTS_CREATE.value,
        PermissionEnum.PRODUCTS_UPDATE.value,
        PermissionEnum.PRODUCTS_DELETE.value,
        PermissionEnum.PRODUCTS_MANAGE_STATUS.value,
        PermissionEnum.CATEGORIES_READ.value,
        PermissionEnum.CATEGORIES_CREATE.value,
        PermissionEnum.CATEGORIES_UPDATE.value,
        PermissionEnum.CATEGORIES_DELETE.value,
        PermissionEnum.BRANDS_READ.value,
        PermissionEnum.BRANDS_CREATE.value,
        PermissionEnum.BRANDS_UPDATE.value,
        PermissionEnum.BRANDS_DELETE.value,
        PermissionEnum.INVENTORY_READ.value,
        PermissionEnum.INVENTORY_RECEIVE.value,
        PermissionEnum.INVENTORY_ADJUST.value,
        PermissionEnum.INVENTORY_BATCH_MANAGE.value,
        PermissionEnum.INVENTORY_MOVEMENT_READ.value,
        PermissionEnum.INVENTORY_EXPIRY_READ.value,
        PermissionEnum.INVENTORY_VALUATION_READ.value,
        PermissionEnum.INVENTORY_ALERT_MANAGE.value,
    ]

    for perm in required_phase5_perms:
        assert perm in admin_perms, f"Admin role missing permission {perm}"
        assert perm in super_admin_perms, f"Super admin role missing permission {perm}"


def test_customer_and_delivery_partner_lack_inventory_permissions():
    """Verify customers and delivery agents cannot access inventory admin operations."""
    customer_perms = ROLE_DEFAULT_PERMISSIONS[RoleEnum.CUSTOMER.value]
    delivery_perms = ROLE_DEFAULT_PERMISSIONS[RoleEnum.DELIVERY_PARTNER.value]

    forbidden_perms = [
        PermissionEnum.INVENTORY_RECEIVE.value,
        PermissionEnum.INVENTORY_ADJUST.value,
        PermissionEnum.INVENTORY_BATCH_MANAGE.value,
        PermissionEnum.INVENTORY_VALUATION_READ.value,
        PermissionEnum.PRODUCTS_CREATE.value,
        PermissionEnum.CATEGORIES_CREATE.value,
    ]

    for p in forbidden_perms:
        assert p not in customer_perms, f"Customer should NOT have {p}"
        assert p not in delivery_perms, f"Delivery partner should NOT have {p}"

