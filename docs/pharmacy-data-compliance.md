# Med24Plus Indian Pharmacy Data & Regulatory Compliance Architecture

This document details the architectural mechanisms within the database to support compliance with Indian pharmacy laws, specifically the **Drugs and Cosmetics Act, 1940**, the **Drugs and Cosmetics Rules, 1945**, and applicable GST and IT regulations.

---

## 1. Compliance Disclaimer & Boundary
> [!IMPORTANT]
> The existence of compliance fields, tables, and constraints in the Med24Plus database does **not** constitute legal authorization to dispense medicines. Commercial operations require valid Form 20 and Form 21 licenses issued by the State Drug Control Administration and physical supervision by a qualified Registered Pharmacist. The software enforces operational guardrails to facilitate compliance.

---

## 2. Statutory Classifications & Handling

### 2.1 Drug Schedules under the Drugs and Cosmetics Rules, 1945
The `products.schedule_classification` column enforces regulatory constraints:

| Schedule Type | Legal Requirements | Med24Plus Implementation |
| :--- | :--- | :--- |
| **OTC (Over The Counter)** | No prescription required. General retail sale permitted. | `requires_prescription = False`, `is_restricted = False`. Instant cart addition allowed. |
| **Schedule H** | Must not be sold without prescription of a Registered Medical Practitioner (RMP). | `requires_prescription = True`. Order transitions to `rx_review` state; cart checkout blocked without uploaded Rx. |
| **Schedule H1** | Strict 3rd-generation antibiotics and habit-forming drugs. Separate register with 3-year record retention mandatory under Rule 65. | `requires_prescription = True`. Detailed `dispensing_audit_logs` record doctor name, registration number, patient name, and batch number. |
| **Schedule X** | Psychotropic and narcotic formulations. Triple-copy prescription requirement; strict physical retail custody. | **`is_restricted = True` by default**. Online cart addition and digital dispensing are hard-blocked at the schema and application level. |
| **Schedule G** | Hormonal and specific internal substances requiring cautionary labeling. | `requires_prescription = True`, highlighted with warning badges. |

---

## 3. Registered Pharmacist Verification under Rule 65

Rule 65 of the Drugs and Cosmetics Rules, 1945, mandates that all prescription medicines must be compounded and dispensed under the direct personal supervision of a **Registered Pharmacist**.

### Explicit Verification Controls:
1. Entering a registration number does **not** automatically verify a pharmacist account.
2. In `pharmacist_profiles`:
   - `is_verified` defaults strictly to `False`.
   - `verified_by_id` stores the administrative user who verified credentials against the State Pharmacy Council register.
   - `verified_at` records the UTC timestamp of authorization.
   - Prescriptions can only be reviewed and signed off by pharmacists where `is_verified = True` and `employment_status = 'active'`.

---

## 4. Prescription Privacy & Security Architecture

1. **Zero Database File Storage**: Binary image or PDF data is never stored in PostgreSQL.
2. **Private Storage Object Keys**: The `prescriptions.storage_object_key` column stores only private object storage paths.
3. **No Public URLs**: Prescriptions are never exposed via public CDNs or predictable HTTP routes. Access is restricted to short-lived (15-minute) pre-signed URLs generated only for authenticated pharmacists.
4. **Retention**: Prescriptions cannot be deleted while associated orders exist (`ondelete="RESTRICT"`).
5. **No Synthetic Personal Data in Production**: Demo seeds use strictly fictional doctor names, registration numbers, and mock formulations.

---

## 5. Indian GST (Goods and Services Tax) Compliance

Indian retail pharmacy sales require statutory tax invoice breakdowns:
- **HSN Codes**: Typically `3004` (Medicaments consisting of mixed or unmixed products for therapeutic uses).
- **Intra-State Sales**: Split equally into Central GST (`cgst_amount`) and State GST (`sgst_amount`).
- **Inter-State Sales**: Recorded as Integrated GST (`igst_amount`).
- **Snapshot Immutability**: All rates (`gst_rate_snapshot`, `hsn_code_snapshot`) are locked into `order_items` at the moment of invoice generation to preserve statutory tax records regardless of subsequent catalog changes.

---

## 6. Cold Chain Temperature Compliance

Certain biologicals (e.g. Insulins, Vaccines) require constant 2°C to 8°C storage:
- `products.is_cold_chain = True` flags special handling.
- `orders.is_cold_chain_required = True` automatically enforces insulated packaging.
- `deliveries.temperature_on_handover_celsius` captures recorded handover temperature at delivery.

