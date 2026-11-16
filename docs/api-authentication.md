# Med24Plus API Authentication & Security Endpoint Reference

Base API Path: `/api/v1`

All responses follow the unified Med24Plus envelope structure:
```json
{
  "success": true,
  "message": "Human readable status string",
  "data": { ... }
}
```

Error response structure:
```json
{
  "success": false,
  "message": "Human readable error description",
  "error": {
    "code": "ERROR_CODE",
    "details": null
  }
}
```

---

## 1. Customer Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required | Rate Limit |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/auth/register` | Customer account registration with Argon2id password | No | 10/min |
| `POST` | `/auth/login` | Authenticate via mobile/email and password (sets cookie + returns Bearer tokens) | No | 10/min |
| `GET` | `/auth/me` | Fetch authenticated customer profile, roles, and status | Bearer / Cookie | None |
| `POST` | `/auth/refresh` | Rotate refresh token with reuse detection | Refresh Token | 20/min |
| `POST` | `/auth/logout` | Revoke current session and clear auth cookies | Bearer / Cookie | None |
| `POST` | `/auth/logout-all` | Invalidate all active sessions for user across all devices | Bearer / Cookie | None |
| `POST` | `/auth/otp/send` | Request 6-digit OTP code (phone_verification, email_verification, login, password_reset) | No | 5/min |
| `POST` | `/auth/otp/verify` | Verify 6-digit OTP code | No | 10/min |
| `POST` | `/auth/forgot-password`| Initiate password reset by dispatching an OTP | No | 5/min |
| `POST` | `/auth/reset-password` | Complete password reset with verified OTP | No | 5/min |
| `POST` | `/auth/change-password`| Change password for authenticated account | Bearer / Cookie | None |

---

## 2. Admin & Staff Authentication Endpoints (`/api/v1/admin/auth`)

| Method | Endpoint | Description | Permitted Roles | Rate Limit |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/admin/auth/login` | Administrative staff authentication (rejects customers) | `admin`, `super_admin`, `staff` | 5/min |
| `GET` | `/admin/auth/me` | Retrieve admin profile and operational permissions | `admin`, `super_admin`, `staff` | None |
| `POST` | `/admin/auth/logout`| Terminate admin session and clear credentials | `admin`, `super_admin`, `staff` | None |

---

## 3. Pharmacist Clinical Authentication Endpoints (`/api/v1/pharmacist/auth`)

| Method | Endpoint | Description | Gating Condition |
| :--- | :--- | :--- | :--- |
| `POST` | `/pharmacist/auth/login` | Pharmacist authentication under D&C Act | `pharmacist` role |
| `GET` | `/pharmacist/auth/me` | Retrieve pharmacist council credentials | `pharmacist` role |
| `GET` | `/pharmacist/auth/status` | Check Rule 65 statutory verification status | `pharmacist` role |
| `GET` | `/pharmacist/auth/workspace` | Clinical review workspace | **`is_verified == True` mandatory** |

---

## 4. Delivery Fleet Authentication Endpoints (`/api/v1/delivery/auth`)

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/delivery/auth/login` | Logistics driver/courier login | `delivery_partner` |
| `GET` | `/delivery/auth/me` | Retrieve courier dispatch profile | `delivery_partner` |

---

## 5. User Profiles & Addresses Endpoints (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/users/me/profile` | Retrieve customer medical/demographic profile | Authenticated User |
| `PUT` | `/users/me/profile` | Update customer demographic and medical profile | Authenticated User |
| `GET` | `/users/me/addresses` | List customer delivery addresses | Authenticated User |
| `POST` | `/users/me/addresses` | Create new delivery address | Authenticated User |
| `DELETE` | `/users/me/addresses/{id}` | Soft-delete saved delivery address (strict ownership enforced) | Authenticated User |

