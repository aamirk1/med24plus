# Med24Plus Authorization & Role-Based Access Control (RBAC)

## 1. Access Control Hierarchy

Med24Plus operates a multi-tier, role-based authorization system tailored to the regulatory demands of a licensed Indian retail pharmacy:

```
                  +-------------------+
                  |    super_admin    | (Global Bypass / System Setup)
                  +-------------------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
   +---------------+                 +---------------+
   |     admin     |                 |  pharmacist   | (Statutory Rule 65)
   +---------------+                 +---------------+
           |                                 |
   +---------------+                 +---------------+
   |     staff     |                 |delivery_partner
   +---------------+                 +---------------+
                            |
                            v
                    +---------------+
                    |   customer    |
                    +---------------+
```

---

## 2. Roles & Permissions Matrix

| Module | Permission Slug | Customer | Pharmacist | Delivery | Staff | Admin | Super Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Profile** | `profile.read` | Yes | Yes | Yes | Yes | Yes | Yes |
| | `profile.update` | Yes | Yes | Yes | Yes | Yes | Yes |
| **Addresses** | `address.read` | Yes | Yes | No | Yes | Yes | Yes |
| | `address.create` / `update` / `delete` | Yes | No | No | No | Yes | Yes |
| **Orders** | `order.read_own` | Yes | No | No | No | No | Yes |
| | `orders.read` | No | No | No | Yes | Yes | Yes |
| | `orders.manage` | No | No | No | No | Yes | Yes |
| **Prescriptions**| `prescription.read_own` | Yes | No | No | No | No | Yes |
| | `prescriptions.read` | No | Yes | No | No | Yes | Yes |
| | `prescriptions.review` | No | Yes | No | No | No | Yes |
| | `prescriptions.approve` | No | Yes | No | No | No | Yes |
| | `prescriptions.reject` | No | Yes | No | No | No | Yes |
| **Dispensing** | `dispensing.read` | No | Yes | No | No | No | Yes |
| **Inventory** | `inventory.read` | No | Yes | No | Yes | Yes | Yes |
| | `inventory.manage` | No | No | No | No | Yes | Yes |
| **Catalog** | `products.read` | Public | Yes | No | Yes | Yes | Yes |
| | `products.manage` | No | No | No | No | Yes | Yes |
| | `categories.manage` | No | No | No | No | Yes | Yes |
| **Delivery** | `delivery.read_assigned` | No | No | Yes | No | Yes | Yes |
| | `delivery.update_assigned_status`| No | No | Yes | No | Yes | Yes |
| **Users & Staff**| `users.read` / `manage` | No | No | No | No | Yes | Yes |
| | `staff.manage` | No | No | No | No | Yes | Yes |
| **Governance** | `reports.read` | No | No | No | No | Yes | Yes |
| | `settings.manage` | No | No | No | No | Yes | Yes |

---

## 3. Registered Pharmacist Verification Gating (Rule 65)

Under Rule 65 of the **Drugs and Cosmetics Rules, 1945**, Schedule H/H1/X medicines cannot be verified or billed without the active supervision of a qualified Registered Pharmacist whose council license has been validated.

### Implementation Architecture
1. Possessing the `pharmacist` role is **insufficient on its own**.
2. The user must have a linked `pharmacist_profiles` record.
3. The flag `pharmacist_profiles.is_verified` must be `True`, set only when an administrator or compliance officer audits the State Pharmacy Council registration number.
4. Any attempt by an unverified pharmacist to access restricted clinical endpoints (e.g. `/api/v1/pharmacist/auth/workspace`) is intercepted by `require_verified_pharmacist` and rejected with:
   ```json
   {
     "success": false,
     "message": "Pharmacist account is pending statutory council verification under Rule 65.",
     "error": { "code": "PHARMACIST_NOT_VERIFIED" }
   }
   ```

---

## 4. Resource Isolation & Multi-Tenant Patient Safety

- A patient can **never** inspect or mutate another patient's profile, saved delivery addresses, or prescription records simply by altering an ID parameter.
- The `check_resource_owner` invariant requires matching the current user's authenticated `id` against the resource's `customer_id` or `user_id`.
- Soft-deleted addresses or inactive sessions are filtered at the database repository query layer (`is_deleted == False`).

