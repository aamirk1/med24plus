# Med24Plus Authentication Architecture Blueprint

## 1. Architectural Overview & Design Philosophy

Med24Plus employs a zero-trust, stateless JWT authentication architecture backed by stateful database session tracking for rotation and immediate revocation. The platform serves three distinct client surfaces across India:
1. **Next.js 14 Customer Web Platform**: Authenticated via secure, HttpOnly, SameSite cookies.
2. **Next.js 14 Pharmacist & Operations Console**: Authenticated via secure, HttpOnly cookies with strict RBAC.
3. **Flutter Mobile Application**: Authenticated via Bearer tokens stored securely in `flutter_secure_storage`.

---

## 2. Token Architecture & Lifecycle

```
[Client Login / OTP Verification]
               |
               v
     +-------------------+
     | FastAPI Auth Core |
     +-------------------+
        /             \
       v               v
 [Access Token]   [Refresh Token]
 (15-min JWT)     (7-day JWT)
 (Bearer/Cookie)  (Hashed in DB)
```

### 2.1 Short-Lived Access Tokens
- **Lifespan**: 15 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 15`).
- **Signature**: Signed with `HS256` (or asymmetric RS256) using a 256-bit cryptographically secure secret.
- **Claims**:
  - `sub`: User UUIDv4 primary key.
  - `roles`: List of assigned system role slugs (`customer`, `pharmacist`, `admin`, etc.).
  - `permissions`: Fine-grained operational permissions (`profile.read`, `prescriptions.review`).
  - `type`: Explicitly set to `"access"` to prevent token substitution attacks.
  - `jti`: Unique token identifier (UUIDv4) for auditability.
  - `iat` & `exp`: UTC issuance and expiration timestamps.
- **Security Constraint**: Contains zero personally identifiable medical data or passwords.

### 2.2 Rotatable Refresh Tokens & Reuse Detection
- **Lifespan**: 7 days (`REFRESH_TOKEN_EXPIRE_DAYS = 7`).
- **Database Storage**: Never stored in plaintext. Only the SHA-256 hash of the token (`hash_token(raw_refresh_token)`) is persisted in `user_sessions.session_token_hash`.
- **Token Family Rotation**: Each refresh token belongs to a `family_id` (UUIDv4).
- **Rotation Mechanics**:
  1. Client presents refresh token to `POST /api/v1/auth/refresh`.
  2. Server decodes claims and hashes the incoming token.
  3. Server locates the matching record in `user_sessions`.
  4. **Reuse Detection**: If the session is already marked `is_revoked = True`, a compromised or intercepted token replay is detected. The server immediately executes `revoke_family(family_id)`, invalidating **all active sessions** in that family and returning HTTP 401.
  5. If valid, the current session is marked `is_revoked = True` and a brand new refresh token (same family ID) and access token are issued.

---

## 3. Password Security Architecture (Argon2id)

Passwords are protected using the **Argon2id** algorithm (RFC 9106), the state-of-the-art password hashing function resistant to GPU and side-channel attacks:

```python
hasher = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MiB
    parallelism=1,
    hash_len=32,
    type=Type.ID,
)
```

### Password Policy
- **Minimum Length**: 8 characters (maximum 128 characters).
- **Complexity**: At least one uppercase letter `[A-Z]`, one lowercase letter `[a-z]`, one digit `[0-9]`, and one special character `[!@#$%^&*...]`.
- **Blacklist**: Rejects common, easily guessed passwords (`password123`, `admin123`, etc.).
- **Timing Defense**: Authentication attempts on non-existent accounts execute a dummy Argon2id verification to prevent username enumeration via timing attacks.

---

## 4. OTP Verification Architecture

Used for phone number verification, password resets, and fast customer login.

```
[User Action] ---> [Generate 6-Digit OTP] ---> [Hash: SHA-256(Target + Purpose + OTP)] ---> [DB Record]
                                      |
                     [Provider Dispatch: SMS/WhatsApp / Dev Mode]
```

- **Entropy**: Cryptographically secure numeric generation (`secrets.choice("0123456789")`).
- **Storage**: Plaintext OTP is never written to disk or logs. The record stores:
  `SHA-256(f"{target}:{purpose}:{otp}")`.
- **Lifespan**: Short expiry (5 minutes).
- **Rate Limiting**: Cooldown of 60 seconds between resend requests.
- **Brute-Force Protection**: Capped at 5 attempts (`max_attempts = 5`). Upon 5 failed attempts, the OTP record is permanently invalidated (`is_used = True`).
- **Development Isolation**: In `development` mode, the generated OTP is logged and surfaced strictly through development payloads to facilitate zero-cost local testing without paid SMS gateways.

