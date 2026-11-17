import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<UserEntity> login({
    required String identifier,
    required String password,
  });

  Future<UserEntity> register({
    required String fullName,
    required String phone,
    required String password,
    required String confirmPassword,
    String? email,
  });

  Future<UserEntity?> getCurrentUser();

  Future<void> logout();

  Future<String?> sendOtp({
    required String target,
    required String purpose,
  });

  Future<bool> verifyOtp({
    required String target,
    required String otpCode,
    required String purpose,
  });

  Future<bool> resetPassword({
    required String identifier,
    required String otpCode,
    required String newPassword,
    required String confirmPassword,
  });

  Future<UserEntity> loginWithFirebaseOtp({
    required String firebaseIdToken,
  });

  Future<bool> verifyFirebaseOtp({
    required String firebaseIdToken,
    required String purpose,
    String? newPassword,
    String? confirmPassword,
  });

  Future<void> registerDeviceToken({
    required String fcmToken,
    String deviceType = 'android',
  });

  Future<bool> hasSavedSession();
}

