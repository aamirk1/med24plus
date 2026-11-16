# Med24Plus — Security Guidelines & Best Practices

## 1. Overview
Med24Plus is engineered to handle sensitive healthcare data, prescription records, and pharmaceutical transactions in strict compliance with the **Drugs and Cosmetics Act, 1940**, the **Drugs and Cosmetics Rules, 1945**, the **Information Technology Act, 2000**, and the **Digital Personal Data Protection Act (DPDP Act), 2023**.

Security is applied in depth across all architectural layers: backend services, client applications (web and mobile), data persistence, and transit.

---

## 2. Password Security & Cryptography

### Argon2id Hashing Standard
All passwords are encrypted using **Argon2id** (RFC 9106 recommended parameters), which provides maximum resistance against both GPU-based parallel brute-force attacks and side-channel timing attacks:
- **Memory Cost (`time_cost`)**: 3 iterations
- **Memory Usage (`memory_cost`)**: 65,536 KiB (64 MiB)
- **Parallelism (`parallelism`)**: 4 concurrent threads
- **Salt Generation**: Cryptographically secure 16-byte random salt per hash (generated via `os.urandom`)

### Password Policy Validation
Every password submitted during registration or password change/reset must satisfy the following criteria:
1. **Length**: Minimum 8 characters, maximum 128 characters.
2. **Complexity**:
   - At least one uppercase Latin character (`A-Z`).
   - At least one lowercase Latin character (`a-z`).
   - At least one numeric digit (`0-9`).
   - At least one special symbol (`!@#$%^&*()_+-=[]{}|;:,.<>?`).
3. **Common Dictionary Blacklist**: Passwords matching commonly compromised sequences (e.g., `Password@123`, `Admin@1234`, `Welcome@123`, `Med24@123`) are explicitly rejected.
4. **Data Isolation**: Plaintext passwords are never logged, persisted in application state, or included in API error responses.

---

## 3. Account Lockout & Brute-Force Defense

To mitigate credential stuffing and automated password guessing:
- **Failure Threshold**: 5 consecutive failed login attempts on a single user account.
- **Lockout Duration**: 15 minutes (`900 seconds`).
- **Mechanism**: The `users.failed_login_attempts` counter increments on each invalid credential attempt. Upon reaching the threshold:
  - `users.is_locked` is flagged `True`.
  - `users.locked_until` is set to `UTC now + 15 minutes`.
  - An audit event `ACCOUNT_LOCKOUT` is recorded in `authentication_events`.
- **Automatic Cooldown**: Once the 15-minute window expires, the user may authenticate; on successful login, `failed_login_attempts` and `locked_until` are automatically reset to 0 and `NULL`.

---

## 4. Rate Limiting Architecture

Med24Plus utilizes a **Sliding Window Counter** rate limiter implemented in `app/middleware/rate_limit.py`:
- **Primary Backend**: Distributed Redis instance.
- **Failover / Local Mode**: In-memory sliding window cache with automatic expired timestamp cleanup.
- **Protection Tiers**:
  - `POST /api/v1/auth/login`: 5 requests per minute per IP.
  - `POST /api/v1/auth/register`: 3 requests per minute per IP.
  - `POST /api/v1/auth/otp/send`: 3 requests per 5 minutes per phone/email.
  - `POST /api/v1/auth/otp/verify`: 5 attempts per OTP lifespan.
  - General API routes: 60 requests per minute per client.

---

## 5. Security Headers & Browser Hardening

The FastAPI `SecurityHeadersMiddleware` intercepts all outgoing HTTP responses and injects defense-in-depth headers:

| Header | Production Value | Purpose |
| :--- | :--- | :--- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http: https:; frame-ancestors 'none';` | Blocks XSS and unauthorized resource inclusion. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing exploits. |
| `X-Frame-Options` | `DENY` | Prevents Clickjacking attacks by forbidding iframe embedding. |
| `X-XSS-Protection` | `1; mode=block` | Enables legacy browser reflective XSS filtering. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Enforces HTTPS connections and prevents downgrade attacks. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects patient and prescription URLs from leaking in HTTP referrers. |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` | Disables access to sensitive hardware APIs unless explicitly required. |

---

## 6. Cookie & Token Security

- **Access Tokens**: Short-lived (15 minutes), passed via `Authorization: Bearer <token>` header. Contains user ID, roles, permissions, and family identifier.
- **Refresh Tokens**: Long-lived (7 days), stored in secure cookies for web clients or secure device storage for mobile clients:
  - `HttpOnly = True`: Inaccessible via client-side JavaScript, neutralizing token theft via XSS.
  - `Secure = True`: Transmitted exclusively over TLS encrypted channels (enabled in staging/production).
  - `SameSite = "lax"`: Protects against Cross-Site Request Forgery (CSRF).
  - `Path = "/api/v1/auth"`: Restricts cookie transmission strictly to authentication management endpoints.

---

## 7. Mobile Device Security (Flutter)

In the Med24Plus Flutter mobile application:
- **Storage Layer**: Credentials and tokens are persisted using `flutter_secure_storage`:
  - **Android**: Uses **Android KeyStore** with AES-256 GCM encryption via `EncryptedSharedPreferences`.
  - **iOS**: Uses the **Apple Keychain Services API** with `kSecAttrAccessibleAfterFirstUnlock`.
- **Memory Hygiene**: Tokens are stored strictly in dedicated repositories; plaintext credentials are wiped from controllers immediately following BLoC event processing.
- **Network Interception**: Centralized `ApiClient` with Dio interceptors handles proactive header attachment and atomic token refresh without exposing tokens to arbitrary screen widgets.

---

## 8. Authentication Audit Ledger (`authentication_events`)

Every security-sensitive event is logged to the immutable `authentication_events` PostgreSQL table:
- **Event Types**: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_RESET`, `TOKEN_REUSE_DETECTED`, `ACCOUNT_LOCKOUT`, `REGISTRATION`.
- **Metadata Captured**: Timestamp (`created_at`), User ID (or target identifier if unauthenticated), Client IP address, User-Agent string, Event Details (JSON payload).
- **Statutory Review**: Audit entries provide legal non-repudiation and forensic audit trails required by pharmacy licensing authorities for schedule drug dispensations.

