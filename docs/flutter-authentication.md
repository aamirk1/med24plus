# Med24Plus — Flutter Mobile Authentication Architecture

## 1. Architectural Philosophy
The Med24Plus Flutter mobile customer application implements a clean, layered, feature-based **BLoC (Business Logic Component)** architecture using `flutter_bloc` and `Equatable`. 

In accordance with architectural standards:
- **No Riverpod or Provider-based State Replacement**: State management remains 100% standard Flutter BLoC.
- **Strict Separation of Concerns**: UI widgets do not communicate directly with repositories or network clients; all actions are dispatched as immutable Events, and UI reacts solely to emitted immutable States.
- **Security by Design**: Tokens are never stored in `SharedPreferences`; all sensitive credentials utilize platform secure enclaves via `flutter_secure_storage`.

---

## 2. Directory & Component Structure
Authentication logic is encapsulated inside `lib/features/auth/` and `lib/core/`:

```
mobile/customer-app/lib/
├── core/
│   ├── constants/
│   │   └── api_endpoints.dart          # Base URL and auth routes
│   ├── network/
│   │   └── api_client.dart             # Centralized Dio HTTP client & refresh interceptors
│   └── services/
│       └── secure_storage_service.dart # Keychain / EncryptedSharedPreferences wrapper
└── features/auth/
    ├── data/
    │   ├── datasources/
    │   │   └── auth_remote_data_source.dart
    │   ├── models/
    │   │   ├── auth_tokens_model.dart
    │   │   └── user_model.dart
    │   └── repositories/
    │       └── auth_repository_impl.dart
    ├── domain/
    │   ├── entities/
    │   │   └── user_entity.dart
    │   └── repositories/
    │       └── auth_repository.dart
    └── presentation/
        ├── bloc/
        │   ├── auth_bloc.dart
        │   ├── auth_event.dart
        │   └── auth_state.dart
        ├── login_screen.dart
        ├── register_screen.dart
        └── forgot_password_screen.dart
```

---

## 3. BLoC State & Event Contract

### Events (`auth_event.dart`)
1. `AppStarted`: Fired on application launch to inspect stored tokens, restore session, or transition to unauthenticated state.
2. `LoginSubmitted(identifier, password, otp)`: Dispatched when user submits credentials or OTP on login screen.
3. `RegisterSubmitted(fullName, phone, email, password, confirmPassword)`: Dispatched on customer sign-up.
4. `SendOtpSubmitted(phoneOrEmail, purpose)`: Triggers OTP dispatch for phone verification or password recovery.
5. `ResetPasswordSubmitted(identifier, otp, newPassword, confirmPassword)`: Completes password reset flow.
6. `LogoutSubmitted()`: Clears local tokens and invalidates server-side session.

### States (`auth_state.dart`)
1. `AuthInitial`: Baseline uninitialized state.
2. `AuthLoading`: Emitted during asynchronous network or cryptographic operations.
3. `Authenticated(UserEntity user)`: Emitted upon successful verification; triggers navigation to Home or Profile.
4. `Unauthenticated()`: Emitted when no valid session exists or after logout; presents Login screen.
5. `AuthFailure(String message)`: Emitted on validation errors, network failures, or invalid credentials; displays user-friendly snackbars.
6. `OtpSentState(String identifier, String? devOtp)`: Indicates OTP dispatch success, with optional dev-mode test OTP for local sandbox testing.
7. `PasswordResetSuccess()`: Confirms password change completion and redirects user to sign-in.

---

## 4. Centralized Dio Client & Token Refresh Concurrency

### The Concurrent Refresh Race Problem
When multiple asynchronous API calls execute concurrently with an expired 15-minute access token, naive interceptors make multiple simultaneous calls to `/api/v1/auth/refresh`. Under token rotation with reuse detection, the second refresh request is flagged as an invalid replay attack, causing the server to revoke the entire session family and force-logout the user.

### The Solution: Completer Locking
In `lib/core/network/api_client.dart`, refresh requests are locked using Dart's asynchronous `Completer<String?>`:

```dart
Completer<String?>? _refreshCompleter;

Future<String?> _performTokenRefresh() async {
  if (_refreshCompleter != null) {
    // A refresh is already in progress — wait for its result
    return _refreshCompleter!.future;
  }

  _refreshCompleter = Completer<String?>();
  try {
    final refreshToken = await _storageService.getRefreshToken();
    if (refreshToken == null) {
      _refreshCompleter!.complete(null);
      return null;
    }

    final response = await _dio.post(
      ApiEndpoints.refresh,
      data: {'refresh_token': refreshToken},
    );

    if (response.statusCode == 200) {
      final newAccessToken = response.data['data']['access_token'] as String;
      final newRefreshToken = response.data['data']['refresh_token'] as String;

      await _storageService.saveTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      );

      _refreshCompleter!.complete(newAccessToken);
      return newAccessToken;
    } else {
      _refreshCompleter!.complete(null);
      return null;
    }
  } catch (e) {
    _refreshCompleter!.complete(null);
    return null;
  } finally {
    _refreshCompleter = null;
  }
}
```

### Auto-Retry on 401
When an endpoint responds with HTTP 401:
1. The interceptor calls `_performTokenRefresh()`.
2. All concurrent requests wait on `_refreshCompleter!.future`.
3. Upon completion, the interceptor updates the failed request's `Authorization: Bearer <new_token>` header and seamlessly re-executes the request with `_dio.fetch(error.requestOptions)`.
4. If token refresh fails (e.g. token expired beyond 7 days or revoked), local tokens are purged and the application emits `Unauthenticated()`.

---

## 5. Secure Token Storage

Tokens are persisted using `SecureStorageService`:
- **Android**: Uses `AndroidOptions(encryptedSharedPreferences: true)`.
- **iOS**: Uses `IOSOptions(accessibility: KeychainAccessibility.first_unlock)`.
- Stored keys: `access_token`, `refresh_token`, and cached user identity.

---

## 6. Testing & Quality Assurance

The mobile authentication suite includes:
- **Unit Tests (`test/unit/auth_bloc_test.dart`)**: Verifies all state transitions for `AppStarted`, `LoginSubmitted`, `RegisterSubmitted`, `SendOtpSubmitted`, `ResetPasswordSubmitted`, and `LogoutSubmitted` using `bloc_test`.
- **Mock Repositories (`test/mocks/fake_auth_repository.dart`)**: Full mock implementation of `AuthRepository` enabling headless unit tests without network dependencies.
- **Widget Regressions (`test/phase2_ui_test.dart`)**: Verified that Phase 2 screen layouts continue to render accurately with `AuthBloc` providers injected.
- **Static Analysis**: `flutter analyze` passes with **0 issues found**.

