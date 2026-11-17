# Med24Plus — Checkout Validation Workflow

## 1. Overview

The Checkout Validation pipeline validates a customer's cart, selected delivery address, statutory drug requirements, and current stock availability prior to order generation.

Checkout validation generates a **15-minute authoritative quote** persisted in the `checkout_validations` table.

---

## 2. Validation Pipeline Stages

The `CheckoutService.validate_checkout()` executes 6 sequential verification stages:

```
[Customer Selects Delivery Address]
                 |
                 v
   +------------------------------------+
   | 1. Cart & Item Verification        |
   |    - Cart exists and is active?    |
   |    - Has at least 1 item?          |
   +-----------------+------------------+
                     | Pass
                     v
   +------------------------------------+
   | 2. Product Eligibility & Stock     |
   |    - Products active & not expired?|
   |    - Sellable inventory >= qty?    |
   |    - Exclude quarantined/damaged   |
   +-----------------+------------------+
                     | Pass
                     v
   +------------------------------------+
   | 3. Price & Snapshot Changes        |
   |    - Compare snapshot vs current   |
   |    - Check acknowledge_price_change|
   +-----------------+------------------+
                     | Pass
                     v
   +------------------------------------+
   | 4. Rule 65 Prescription Gating     |
   |    - Any Schedule H / H1 / X items?|
   |    - Customer has approved Rx?     |
   |    - Rx valid & not expired?       |
   +-----------------+------------------+
                     | Pass
                     v
   +------------------------------------+
   | 5. Serviceability & Geofencing     |
   |    - Address PIN in delivery zone? |
   |    - Turnaround estimated (4 hrs)  |
   +-----------------+------------------+
                     | Pass
                     v
   +------------------------------------+
   | 6. Authoritative Pricing & Quote   |
   |    - Centralized Decimal arithmetic|
   |    - GST extraction (CGST + SGST)  |
   |    - Persist CheckoutValidation    |
   |    - 15-Minute Expiry Set          |
   +------------------------------------+
```

---

## 3. Validation States & Eligibility

The evaluation yields one of three validation states:

| Validation Status | `is_eligible_for_checkout` | Meaning | Example Causes |
|---|---|---|---|
| `valid` | `true` | All checks passed. Customer may proceed directly to Phase 8 payment. | In-stock OTC medicines to a serviceable Bengaluru PIN code. |
| `valid_with_warnings` | `true` | Non-blocking issues present. Proceed allowed after customer acknowledgment. | Price changes acknowledged by customer, or cold-chain delivery advisory. |
| `blocked` | `false` | Critical blocker prevents order creation. Order creation cannot proceed. | Unserviceable PIN code, out of stock, or unapproved prescription for Schedule H medicine. |

---

## 4. API Endpoints

### 4.1 Validate Checkout
- **Method**: `POST`
- **URL**: `/api/v1/checkout/validate`
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Request Body:
```json
{
  "delivery_address_id": "a9108c56-6218-4c91-9e6b-a279be72d37c",
  "acknowledge_price_changes": false
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Checkout validation completed successfully.",
  "data": {
    "id": "c3e12019-38b4-4b5b-8012-6f91f7a0129a",
    "cart_id": "e8a2a8b3-3df8-4cf5-b1a7-64df594589d1",
    "customer_id": "402096f4-18fa-4e78-831e-ee09819ee15e",
    "delivery_address_id": "a9108c56-6218-4c91-9e6b-a279be72d37c",
    "selected_address": {
      "id": "a9108c56-6218-4c91-9e6b-a279be72d37c",
      "recipient_name": "Aarav Sharma",
      "phone": "9845122340",
      "address_line1": "Flat 402, Green Glen Heights",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560103",
      "country": "India",
      "address_type": "home",
      "is_default": true
    },
    "validation_status": "valid",
    "is_eligible_for_checkout": true,
    "is_address_serviceable": true,
    "serviceability_message": "Delivery available in Bengaluru (Estimated: 4 Hours).",
    "estimated_delivery_hours": 4,
    "subtotal": 540.00,
    "discount_total": 50.00,
    "tax_total": 57.86,
    "delivery_fee": 0.00,
    "grand_total": 540.00,
    "tax_breakdown": {
      "taxable_subtotal": 482.14,
      "cgst_amount": 28.93,
      "sgst_amount": 28.93,
      "igst_amount": 0.00,
      "total_tax": 57.86
    },
    "items": [...],
    "warnings": [],
    "blocking_errors": [],
    "validation_errors": [],
    "calculated_at": "2026-11-17T05:15:00Z",
    "expires_at": "2026-11-17T05:30:00Z"
  }
}
```

---

### 4.2 Check Pincode Serviceability
- **Method**: `GET`
- **URL**: `/api/v1/checkout/serviceability/{pincode}`
- **Description**: Public endpoint to check if an Indian postal code is within the active delivery geofence before address entry.
