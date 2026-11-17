# Med24Plus — Cart API Specification

## 1. Overview

The Cart API provides customer endpoints for managing items in the shopping cart. All requests require authentication with a bearer JWT token belonging to an active customer.

**Base URL**: `/api/v1/cart`

---

## 2. Endpoints

### 2.1 Get Active Cart
- **Method**: `GET`
- **URL**: `/api/v1/cart`
- **Description**: Returns the authenticated customer's active cart. If no active cart exists, creates a new active cart and returns empty items. Recalculates all pricing, tax, and sellable inventory in real-time.

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Cart retrieved successfully.",
  "data": {
    "id": "e8a2a8b3-3df8-4cf5-b1a7-64df594589d1",
    "customer_id": "402096f4-18fa-4e78-831e-ee09819ee15e",
    "status": "active",
    "items": [
      {
        "id": "78b173cf-6202-4fc8-9f20-fa7c64a39521",
        "cart_id": "e8a2a8b3-3df8-4cf5-b1a7-64df594589d1",
        "product_id": "713baee8-ee5f-402a-9289-eb6bf24ceeb8",
        "product_name": "Paracetamol 650mg Tablets",
        "product_slug": "paracetamol-650mg-tablets",
        "product_sku": "PCM-650-TAB",
        "generic_name": "Paracetamol",
        "pack_size": "Strip of 15 Tablets",
        "dosage_form": "Tablet",
        "strength": "650mg",
        "brand_name": "Cipla Ltd",
        "is_cold_chain": false,
        "unit_price": 30.50,
        "unit_mrp": 35.00,
        "unit_price_snapshot": 30.50,
        "is_price_changed": false,
        "quantity": 2,
        "subtotal": 61.00,
        "mrp_subtotal": 70.00,
        "discount_amount": 9.00,
        "gst_rate": 12.00,
        "tax_amount": 6.54,
        "is_available": true,
        "sellable_stock": 150,
        "requires_prescription": false,
        "schedule_classification": "otc",
        "prescription_status": "not_required",
        "validation_status": "valid"
      }
    ],
    "item_count": 1,
    "total_quantity": 2,
    "subtotal": 61.00,
    "total_mrp": 70.00,
    "total_discount": 9.00,
    "taxable_amount": 54.46,
    "total_tax": 6.54,
    "delivery_fee": 40.00,
    "free_delivery_threshold": 499.00,
    "amount_needed_for_free_delivery": 438.00,
    "grand_total": 101.00,
    "has_prescription_items": false,
    "has_cold_chain_items": false,
    "has_price_changes": false,
    "is_valid_for_checkout": true,
    "warnings": [],
    "blocking_errors": []
  }
}
```

---

### 2.2 Add Item to Cart
- **Method**: `POST`
- **URL**: `/api/v1/cart/items`
- **Description**: Adds a medicine to the active cart. If the medicine already exists in the cart, increments the existing quantity up to the maximum sellable stock or anti-hoarding limit.

#### Request Body:
```json
{
  "product_id": "713baee8-ee5f-402a-9289-eb6bf24ceeb8",
  "quantity": 2
}
```

#### Response (200 OK):
Returns the updated `CartResponse`.

#### Errors:
- `400 Bad Request`: Requested quantity exceeds available sellable inventory or maximum configured limit (e.g. 10 units).
- `404 Not Found`: Product not found or inactive.

---

### 2.3 Update Item Quantity
- **Method**: `PATCH`
- **URL**: `/api/v1/cart/items/{item_id}`
- **Description**: Updates the exact quantity of an existing item in the cart. If quantity is set to 0, the item is removed.

#### Request Body:
```json
{
  "quantity": 3
}
```

#### Response (200 OK):
Returns the updated `CartResponse`.

---

### 2.4 Remove Single Item
- **Method**: `DELETE`
- **URL**: `/api/v1/cart/items/{item_id}`
- **Description**: Removes an item from the customer's active cart.

#### Response (200 OK):
Returns the updated `CartResponse`.

---

### 2.5 Clear Cart
- **Method**: `DELETE`
- **URL**: `/api/v1/cart/items`
- **Description**: Removes all items from the customer's active cart.

#### Response (200 OK):
Returns the cleared `CartResponse` with empty `items`.

---

### 2.6 Validate Cart Pre-Flight
- **Method**: `POST`
- **URL**: `/api/v1/cart/validate`
- **Description**: Performs a comprehensive pre-flight verification of the current cart against real-time stock and pricing without generating a formal checkout session.
