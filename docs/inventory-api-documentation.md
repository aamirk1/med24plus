# Med24Plus Pharmacy Inventory API Documentation

Comprehensive REST API reference for pharmacy inventory overview, batches, stock receiving, physical count adjustments, movement ledgers, statutory expiry monitoring, low-stock alerts, and valuation.

---

## 1. Inventory Summaries & Overview

### 1.1 Global Warehouse Metrics
- **Method**: `GET /api/v1/admin/inventory/summary`
- **Permission**: `inventory.read`
- **Response**:
```json
{
  "success": true,
  "message": "Inventory summary retrieved successfully.",
  "data": {
    "total_catalog_products": 468,
    "total_active_batches": 842,
    "total_received_units": 94500,
    "total_available_units": 45120,
    "total_reserved_units": 320,
    "total_damaged_units": 45,
    "total_quarantined_units": 150,
    "total_sellable_units": 44650,
    "low_stock_products_count": 12,
    "out_of_stock_products_count": 2,
    "expiring_30_days_count": 8,
    "expired_batches_count": 0
  }
}
```

### 1.2 Product-Wise Inventory List
- **Method**: `GET /api/v1/admin/inventory`
- **Permission**: `inventory.read`
- **Query Parameters**:
  - `search` (string): Product title or SKU.
  - `is_low_stock` (bool): Filter products below reorder threshold.
  - `is_out_of_stock` (bool): Filter products with 0 sellable units.
  - `page`, `page_size`.

### 1.3 Individual Product Inventory Status
- **Method**: `GET /api/v1/admin/inventory/{product_id}`
- **Permission**: `inventory.read`

---

## 2. Inward Stock Receiving

### 2.1 Receive Inward Stock
- **Method**: `POST /api/v1/admin/inventory/receive-stock`
- **Permission**: `inventory.receive`
- **Request Body**:
```json
{
  "product_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "batch_number": "B-2026-AUG01",
  "received_quantity": 250,
  "manufacturing_date": "2026-10-01",
  "expiry_date": "2028-09-30",
  "purchase_price": "120.00",
  "batch_mrp": "205.50",
  "supplier_name": "GlaxoSmithKline Distribution Hub",
  "supplier_invoice_number": "INV-2026-9921",
  "storage_location": "Rack-A2-Bin-4",
  "notes": "Consignment inspected and verified under cold storage standards."
}
```
- **Response**: Contains `batch_id`, `movement_id`, `new_available_quantity`, and timestamp.

---

## 3. Batch Management

### 3.1 List Batches
- **Method**: `GET /api/v1/admin/inventory/batches`
- **Permission**: `inventory.read`
- **Query Parameters**: `product_id`, `batch_status`, `is_expired`, `search`, `page`, `page_size`.

### 3.2 Get Batch by ID
- **Method**: `GET /api/v1/admin/inventory/batches/{batch_id}`
- **Permission**: `inventory.read`

### 3.3 Create Batch
- **Method**: `POST /api/v1/admin/inventory/batches`
- **Permission**: `inventory.batch_manage`

### 3.4 Update Batch Details
- **Method**: `PUT /api/v1/admin/inventory/batches/{batch_id}`
- **Permission**: `inventory.batch_manage`

### 3.5 Update Batch Status (Quarantine / Release)
- **Method**: `PATCH /api/v1/admin/inventory/batches/{batch_id}/status`
- **Permission**: `inventory.batch_manage`
- **Request Body**: `{"batch_status": "quarantined"}`

---

## 4. Stock Adjustments (Audits)

### 4.1 Apply Stock Adjustment
- **Method**: `POST /api/v1/admin/inventory/adjustments`
- **Permission**: `inventory.adjust`
- **Request Body**:
```json
{
  "product_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "batch_id": "7cc0e500-0475-48d5-b5bd-5b393f76f24a",
  "adjustment_type": "damaged",
  "quantity": 2,
  "reason": "Vial seal leakage detected during physical shelf count",
  "notes": "Withdrawn from sales rack"
}
```

### 4.2 List Historical Adjustments
- **Method**: `GET /api/v1/admin/inventory/adjustments`
- **Permission**: `inventory.read`

### 4.3 Get Adjustment Detail
- **Method**: `GET /api/v1/admin/inventory/adjustments/{adjustment_id}`
- **Permission**: `inventory.read`

---

## 5. Stock Movement Ledger

### 5.1 Query Immutable Movement Audit Log
- **Method**: `GET /api/v1/admin/inventory/stock-movements`
- **Permission**: `inventory.movement_read`
- **Query Parameters**: `product_id`, `batch_id`, `movement_type`, `start_date`, `end_date`, `performed_by_id`, `page`, `page_size`.

---

## 6. Expiry Monitoring

### 6.1 Expiry Summary (Brackets)
- **Method**: `GET /api/v1/admin/inventory/expiry/summary`
- **Permission**: `inventory.expiry_read`

### 6.2 Filter Batches by Expiry Horizon
- **Method**: `GET /api/v1/admin/inventory/expiry`
- **Permission**: `inventory.expiry_read`
- **Query Parameters**: `days_ahead` (7, 15, 30, 60, 90), `is_expired` (bool), `product_id`, `page`, `page_size`.

---

## 7. Low-Stock Alerts

### 7.1 List Alerts
- **Method**: `GET /api/v1/admin/inventory/alerts`
- **Permission**: `inventory.read`
- **Query Parameters**: `is_resolved` (bool), `alert_type` (`LOW_STOCK`, `OUT_OF_STOCK`, `EXPIRY_WARNING`), `product_id`.

### 7.2 Resolve Alert
- **Method**: `PATCH /api/v1/admin/inventory/alerts/{alert_id}/resolve`
- **Permission**: `inventory.alert_manage`
- **Request Body**: `{"notes": "Purchase order PO-2026-441 raised with distributor."}`

---

## 8. Inventory Valuation Report

### 8.1 Generate Valuation Report
- **Method**: `GET /api/v1/admin/inventory/valuation`
- **Permission**: `inventory.valuation_read`
- **Response**: Breakdown of total physical units, purchase valuation, and MRP valuation grouped across sellable, reserved, damaged, quarantined, and expired states.

