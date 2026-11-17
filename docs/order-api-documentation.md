# Med24Plus — Phase 8: Order API Documentation

## 1. Overview

The Order Management APIs provide endpoints across three primary domains:
1. **Customer Order Operations** (`/api/v1/orders`)
2. **Registered Pharmacist Review Operations** (`/api/v1/pharmacist/orders`)
3. **Admin & Fulfillment Operations** (`/api/v1/admin/orders`)

All endpoints require JWT Bearer Authentication and enforce fine-grained RBAC permissions.

---

## 2. Customer Order Endpoints

### 2.1 Place Order from Validated Checkout
- **Method**: `POST`
- **Path**: `/api/v1/orders`
- **Headers**:
  - `Authorization: Bearer <customer_token>`
  - `Idempotency-Key: <unique_client_generated_uuid>`
- **Request Body**:
```json
{
  "delivery_address_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "prescription_id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  "customer_notes": "Please ring bell on arrival",
  "acknowledge_price_changes": true
}
```
- **Response**: `201 Created` (or `200 OK` on idempotent retry)
```json
{
  "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
  "order_number": "ORD-20261117-ABCDEF",
  "customer_id": "user-uuid",
  "status": "pharmacist_review",
  "payment_status": "pending",
  "subtotal": 520.00,
  "discount_total": 45.00,
  "tax_total": 28.50,
  "delivery_fee": 30.00,
  "grand_total": 533.50,
  "currency": "INR",
  "placed_at": "2026-11-17T11:00:00Z",
  "delivery_address_snapshot": {
    "recipient_name": "Aarav Sharma",
    "phone": "+91 9876543210",
    "address_line_1": "123, 4th Cross, Indiranagar",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560038"
  },
  "items": [
    {
      "id": "item-uuid-1",
      "product_id": "prod-uuid-1",
      "product_name_snapshot": "Amoxicillin 500mg Capsule",
      "sku_snapshot": "MED-AMX-500",
      "strength_snapshot": "500mg",
      "pack_size_snapshot": "Strip of 10 Capsules",
      "quantity": 2,
      "unit_price": 260.00,
      "mrp": 290.00,
      "discount_amount": 60.00,
      "taxable_amount": 460.00,
      "tax_rate": 12.00,
      "tax_amount": 55.20,
      "line_total": 515.20,
      "prescription_required": true,
      "batch_allocations": [
        {
          "batch_id": "batch-uuid-1",
          "batch_number": "BAT-2026-001",
          "expiry_date": "2027-04-30",
          "allocated_quantity": 2
        }
      ]
    }
  ]
}
```

### 2.2 List Customer Orders
- **Method**: `GET`
- **Path**: `/api/v1/orders?page=1&page_size=20&status=all`
- **Response**: `200 OK`
```json
{
  "items": [
    {
      "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      "order_number": "ORD-20261117-ABCDEF",
      "status": "pharmacist_review",
      "payment_status": "pending",
      "grand_total": 533.50,
      "placed_at": "2026-11-17T11:00:00Z",
      "items_count": 1
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

### 2.3 Get Order Details
- **Method**: `GET`
- **Path**: `/api/v1/orders/{id}`
- **Response**: `200 OK` (Full OrderDetail schema with items, batch allocations, delivery address snapshot, and cancellation details if applicable).

### 2.4 Cancel Order (Pre-Dispatch Only)
- **Method**: `POST`
- **Path**: `/api/v1/orders/{id}/cancel`
- **Request Body**:
```json
{
  "reason": "Ordered wrong medication strength by mistake"
}
```
- **Response**: `200 OK` (Updated order with status `cancelled`).

### 2.5 Download Statutory Tax Invoice / Form 20 Cash Memo
- **Method**: `GET`
- **Path**: `/api/v1/orders/{id}/invoice`
- **Response**: `200 OK`
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="Invoice-ORD-20261117-ABCDEF.pdf"`

---

## 3. Registered Pharmacist Review Endpoints

Enforces Rule 65 of the Drugs and Cosmetics Rules, 1945. Requires `Pharmacist` or `Admin` role with `ORDERS_REVIEW` / `ORDERS_APPROVE` permissions.

### 3.1 List Orders Requiring Prescription Review
- **Method**: `GET`
- **Path**: `/api/v1/pharmacist/orders?page=1&page_size=20`
- **Response**: `200 OK` (Paginated list of orders in `pharmacist_review` status).

### 3.2 Approve Order for Dispensing
- **Method**: `POST`
- **Path**: `/api/v1/pharmacist/orders/{id}/approve`
- **Request Body**:
```json
{
  "notes": "Prescription verified against patient history. Dosage instructions validated."
}
```
- **Response**: `200 OK` (Transitions order to `processing` or `payment_confirmed`).

### 3.3 Reject Order (Rule 65 Clinical Rejection)
- **Method**: `POST`
- **Path**: `/api/v1/pharmacist/orders/{id}/reject`
- **Request Body**:
```json
{
  "rejection_reason": "Dosage frequency exceeds safe therapeutic window for pediatric patient."
}
```
- **Response**: `200 OK` (Transitions order to `rejected`, records cancellation, and releases all reserved inventory batches).

### 3.4 Request Customer Clarification
- **Method**: `POST`
- **Path**: `/api/v1/pharmacist/orders/{id}/request-clarification`
- **Request Body**:
```json
{
  "clarification_request": "Please provide the back page of the prescription showing doctor's stamp and date."
}
```
- **Response**: `200 OK` (Logs clinical audit entry and dispatches customer notification).

---

## 4. Admin & Fulfillment Endpoints

Requires `Staff` or `Admin` role with appropriate order permissions.

### 4.1 Search & List All Orders
- **Method**: `GET`
- **Path**: `/api/v1/admin/orders?page=1&page_size=20&status=processing&search=ORD-20261117`
- **Response**: `200 OK`

### 4.2 Get Order Lifecycle Metrics (KPI Cards)
- **Method**: `GET`
- **Path**: `/api/v1/admin/orders/metrics`
- **Response**: `200 OK`
```json
{
  "total_orders": 142,
  "pending_payment": 8,
  "pharmacist_review": 14,
  "processing": 22,
  "ready_for_dispatch": 11,
  "dispatched": 19,
  "delivered": 62,
  "cancelled": 6
}
```

### 4.3 Update Order Status
- **Method**: `POST`
- **Path**: `/api/v1/admin/orders/{id}/status`
- **Request Body**:
```json
{
  "new_status": "ready_for_dispatch",
  "notes": "Medication packed in cold-chain thermal pouch (2-8 deg C)."
}
```
- **Response**: `200 OK`

### 4.4 Admin Cancellation
- **Method**: `POST`
- **Path**: `/api/v1/admin/orders/{id}/cancel`
- **Request Body**:
```json
{
  "reason": "Customer called support to request order cancellation prior to dispatch."
}
```
- **Response**: `200 OK` (Releases all inventory reservations).

### 4.5 Generate / Regenerate Invoice
- **Method**: `POST`
- **Path**: `/api/v1/admin/orders/{id}/generate-invoice`
- **Response**: `200 OK` (Returns invoice metadata and storage path).
