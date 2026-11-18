import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  static const String _keyAccessToken = 'med24_access_token';
  static const String _keyRefreshToken = 'med24_refresh_token';
  static const String _keyUserData = 'med24_user_data';
  static const String _keySavedIdentifier = 'med24_saved_identifier';
  static const String _keySavedPassword = 'med24_saved_password';
  static const String _keyIsRemembered = 'med24_remember_me';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _keyAccessToken, value: accessToken);
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: _keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  Future<void> saveUserData(String userDataJson) async {
    await _storage.write(key: _keyUserData, value: userDataJson);
  }

  Future<String?> getUserData() async {
    return await _storage.read(key: _keyUserData);
  }

  Future<void> saveCredentials({
    required String identifier,
    String? password,
  }) async {
    await _storage.write(key: _keySavedIdentifier, value: identifier);
    if (password != null && password.isNotEmpty) {
      await _storage.write(key: _keySavedPassword, value: password);
    }
    await _storage.write(key: _keyIsRemembered, value: 'true');
  }

  Future<String?> getSavedIdentifier() async {
    return await _storage.read(key: _keySavedIdentifier);
  }

  Future<String?> getSavedPassword() async {
    return await _storage.read(key: _keySavedPassword);
  }

  Future<bool> hasSavedCredentials() async {
    final identifier = await getSavedIdentifier();
    final password = await getSavedPassword();
    return identifier != null &&
        identifier.isNotEmpty &&
        password != null &&
        password.isNotEmpty;
  }

  Future<void> clearCredentials() async {
    await _storage.delete(key: _keySavedIdentifier);
    await _storage.delete(key: _keySavedPassword);
    await _storage.delete(key: _keyIsRemembered);
  }

  Future<void> clearSession() async {
    await _storage.delete(key: _keyAccessToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyUserData);
  }

  Future<void> clearAll() async {
    await _storage.delete(key: _keyAccessToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyUserData);
    await _storage.delete(key: _keySavedIdentifier);
    await _storage.delete(key: _keySavedPassword);
    await _storage.delete(key: _keyIsRemembered);
  }

  Future<bool> hasValidSession() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
