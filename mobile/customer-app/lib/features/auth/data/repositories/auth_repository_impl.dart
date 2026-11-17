import 'dart:convert';
import '../../../../core/services/secure_storage_service.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  @override
  Future<UserEntity> login({
    required String identifier,
    required String password,
  }) async {
    final tokenData = await remoteDataSource.login(identifier, password);

    // Save tokens in secure storage
    await secureStorage.saveTokens(
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    );

    if (tokenData.user != null) {
      await secureStorage.saveUserData(jsonEncode(tokenData.user!.toJson()));
      return tokenData.user!;
    }

    final user = await remoteDataSource.getMe();
    await secureStorage.saveUserData(jsonEncode(user.toJson()));
    return user;
  }

  @override
  Future<UserEntity> register({
    required String fullName,
    required String phone,
    required String password,
    required String confirmPassword,
    String? email,
  }) async {
    final user = await remoteDataSource.register(
      fullName: fullName,
      phone: phone,
      password: password,
      confirmPassword: confirmPassword,
      email: email,
    );
    return user;
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    final hasSession = await secureStorage.hasValidSession();
    if (!hasSession) {
      return null;
    }

    try {
      final user = await remoteDataSource.getMe();
      await secureStorage.saveUserData(jsonEncode(user.toJson()));
      return user;
    } catch (_) {
      // Try to read cached user data if offline
      final cached = await secureStorage.getUserData();
      if (cached != null) {
        return UserModel.fromJson(jsonDecode(cached) as Map<String, dynamic>);
      }
      return null;
    }
  }

  @override
  Future<void> logout() async {
    await remoteDataSource.logout();
    await secureStorage.clearAll();
  }

  @override
  Future<String?> sendOtp({
    required String target,
    required String purpose,
  }) async {
    return await remoteDataSource.sendOtp(target, purpose);
  }

  @override
  Future<bool> verifyOtp({
    required String target,
    required String otpCode,
    required String purpose,
  }) async {
    return await remoteDataSource.verifyOtp(target, otpCode, purpose);
  }

  @override
  Future<bool> resetPassword({
    required String identifier,
    required String otpCode,
    required String newPassword,
    required String confirmPassword,
  }) async {
    return await remoteDataSource.resetPassword(
      identifier: identifier,
      otpCode: otpCode,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );
  }

  @override
  Future<UserEntity> loginWithFirebaseOtp({
    required String firebaseIdToken,
  }) async {
    final result = await remoteDataSource.verifyFirebaseOtp(
      firebaseIdToken: firebaseIdToken,
      purpose: 'login',
    );

    final tokenData = result['tokens'] as Map<String, dynamic>?;
    if (tokenData != null) {
      await secureStorage.saveTokens(
        accessToken: tokenData['access_token'] as String,
        refreshToken: tokenData['refresh_token'] as String,
      );
    }

    final userJson = result['user'] as Map<String, dynamic>?;
    if (userJson != null) {
      final user = UserModel.fromJson(userJson);
      await secureStorage.saveUserData(jsonEncode(user.toJson()));
      return user;
    }

    final user = await remoteDataSource.getMe();
    await secureStorage.saveUserData(jsonEncode(user.toJson()));
    return user;
  }

  @override
  Future<bool> verifyFirebaseOtp({
    required String firebaseIdToken,
    required String purpose,
    String? newPassword,
    String? confirmPassword,
  }) async {
    final result = await remoteDataSource.verifyFirebaseOtp(
      firebaseIdToken: firebaseIdToken,
      purpose: purpose,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );
    return result['verified'] == true;
  }

  @override
  Future<void> registerDeviceToken({
    required String fcmToken,
    String deviceType = 'android',
  }) async {
    await remoteDataSource.registerDeviceToken(
      fcmToken: fcmToken,
      deviceType: deviceType,
    );
  }

  @override
  Future<bool> hasSavedSession() async {
    return await secureStorage.hasValidSession();
  }
}

