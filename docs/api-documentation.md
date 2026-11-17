# Med24Plus API Documentation

## Base URL
- Local Development: `http://localhost:8024/api/v1`
- Interactive OpenAPI Swagger UI: `http://localhost:3024/docs`
- ReDoc UI: `http://localhost:3024/redoc`

---

## 1. System Endpoints

### 1.1 Health Check
- **Method**: `GET`
- **Path**: `/api/v1/health`
- **Authentication**: None
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "application": "online-pharmacy-api",
  "version": "1.0.0"
}
```

---

## 2. Planned API Endpoints (Phased Delivery)

### 2.1 Authentication & Profile (`/api/v1/auth`)
- `POST /auth/otp/send` - Trigger OTP to Indian +91 mobile number
- `POST /auth/otp/verify` - Verify OTP & return JWT access/refresh tokens
- `POST /auth/pharmacist/login` - Email/password + 2FA for licensed dispensary staff
- `GET /auth/me` - Current session user profile and permissions

### 2.2 Prescriptions (`/api/v1/prescriptions`)
- `POST /prescriptions/upload-url` - Generate secure pre-signed S3 upload link
- `POST /prescriptions/submit` - Register newly uploaded prescription
- `GET /prescriptions/my` - List customer's uploaded prescriptions
- `GET /prescriptions/queue` - *(Pharmacist only)* Pending prescription review queue
- `POST /prescriptions/{id}/verify` - *(Pharmacist only)* Approve prescription with approved drug list
- `POST /prescriptions/{id}/reject` - *(Pharmacist only)* Reject prescription with statutory reason

### 2.3 Medicines & Catalog (`/api/v1/medicines`)
- `GET /medicines` - Paginated medicine search with generic salt filters
- `GET /medicines/{id}` - Medicine details, dosage, manufacturer, and schedule
- `GET /medicines/{id}/batches` - *(Pharmacist only)* Active batch stock and expiry dates

### 2.4 Orders & Checkout (`/api/v1/orders`)
- `POST /orders/checkout` - Create medicine order with optional prescription reference
- `GET /orders/{id}` - Order details with trackable state and batch allocation
- `POST /orders/{id}/verify-payment` - Confirm Razorpay / Cashfree webhook payment

### 2.5 Dispensing & Compliance (`/api/v1/dispensing`)
- `GET /dispensing/schedule-h-register` - Download mandatory Schedule H/H1 audit register
- `POST /dispensing/{order_id}/dispatch` - Final verification and temperature check seal before dispatch

