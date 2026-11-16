# Med24Plus — Session Management & Token Rotation Architecture

## 1. Overview
Med24Plus employs a state-of-the-art dual-token architecture (short-lived access tokens + rotating refresh tokens) backed by database persistence and cryptographic token family tracking. This architecture provides immediate revocation capability while maintaining high-performance stateless API request validation.

---

## 2. Token Lifecycle & Specifications

| Dimension | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Lifespan** | 15 Minutes (`900 seconds`) | 7 Days (`604,800 seconds`) |
| **Format** | Signed JSON Web Token (JWT) | Signed JWT with Cryptographic Nonce (`jti`) |
| **Algorithm** | HS256 / RS256 configured via `settings.JWT_ALGORITHM` | HS256 / RS256 with SHA-256 database hashing |
| **Payload Claims** | `sub` (User ID), `email`, `phone`, `roles`, `permissions`, `type: "access"`, `family_id` | `sub` (User ID), `jti` (unique UUID), `type: "refresh"`, `family_id` |
| **Transmission** | `Authorization: Bearer <token>` HTTP header | Secure HttpOnly Cookie (Web) or encrypted storage (Mobile) |
| **Database Storage**| None (Stateless verification) | SHA-256 hash in `user_sessions.token_hash` |

---

## 3. Database Schema: `user_sessions`

Active refresh tokens and client device sessions are managed through the `user_sessions` table:

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_family_id ON user_sessions(family_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
```

---

## 4. Refresh Token Rotation & Reuse Detection

### Standard Rotation Flow
1. Client sends `POST /api/v1/auth/refresh` with current refresh token.
2. Server decodes JWT signature and extracts `sub`, `jti`, and `family_id`.
3. Server computes SHA-256 hash of the received refresh token and looks up `user_sessions`.
4. If session is valid and active (`is_revoked = False` and `expires_at > UTC now`):
   - The current session is marked revoked: `is_revoked = True`.
   - A new refresh token is minted with a new `jti` and the **same** `family_id`.
   - A new session row is inserted into `user_sessions` with the new token hash.
   - A new 15-minute access token is issued.
   - Both tokens are returned to the client.

### Replay Attack & Reuse Detection
If an attacker intercepts an old refresh token and attempts to exchange it after the legitimate client has already rotated it:
1. Server receives the old refresh token and finds its session record in `user_sessions`.
2. The server detects that `is_revoked == True`.
3. **Immediate Threat Response**:
   - The server flags this as a replay/compromise event (`TOKEN_REUSE_DETECTED`).
   - The server executes a cascade revocation query:
     ```sql
     UPDATE user_sessions SET is_revoked = TRUE WHERE family_id = :compromised_family_id;
     ```
   - All tokens belonging to that device family are invalidated instantly.
   - An audit record is logged in `authentication_events` with client IP and User-Agent.
   - The server rejects the request with HTTP 401 Unauthorized.

---

## 5. Logout & Session Invalidation

### Single Device Logout (`POST /api/v1/auth/logout`)
- The client presents its current access token or refresh token.
- The corresponding session row in `user_sessions` is set to `is_revoked = True`.
- Web refresh cookies are cleared via `Set-Cookie: refresh_token=; Max-Age=0; Path=/api/v1/auth`.
- An audit entry `LOGOUT` is logged.

### All Devices Logout (`POST /api/v1/auth/logout-all`)
- Ideal when a user suspects account compromise or changes their password.
- The server revokes all active sessions for the user:
  ```sql
  UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = :user_id AND is_revoked = FALSE;
  ```
- Any access token presented will be rejected once its 15-minute validity window expires, and no refresh tokens will be accepted.

---

## 6. Device Metadata Tracking
To comply with medical traceability and data security guidelines:
- Every session logs `ip_address`, `user_agent`, and friendly `device_info`.
- `last_active` is updated whenever a session is verified or rotated.
- Expired and revoked sessions older than 30 days are automatically archived via database maintenance jobs.

