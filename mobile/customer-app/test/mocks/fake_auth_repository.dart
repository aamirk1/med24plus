import 'package:med24plus/features/auth/domain/entities/user_entity.dart';
import 'package:med24plus/features/auth/domain/repositories/auth_repository.dart';

class FakeAuthRepository implements AuthRepository {
  UserEntity? currentUser = const UserEntity(
    id: 'test-user-id',
    fullName: 'Demo Customer',
    phone: '+919876543210',
    email: 'customer@med24plus.in',
    isActive: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    status: 'active',
    roles: ['customer'],
  );

  @override
  Future<UserEntity> login({
    required String identifier,
    required String password,
  }) async {
    return currentUser!;
  }

  @override
  Future<UserEntity> register({
    required String fullName,
    required String phone,
    required String password,
    required String confirmPassword,
    String? email,
  }) async {
    return currentUser!;
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    return currentUser;
  }

  @override
  Future<void> logout() async {
    currentUser = null;
  }

  @override
  Future<String?> sendOtp({
    required String target,
    required String purpose,
  }) async {
    return '123456';
  }

  @override
  Future<bool> verifyOtp({
    required String target,
    required String otpCode,
    required String purpose,
  }) async {
    return otpCode == '123456';
  }

  @override
  Future<bool> resetPassword({
    required String identifier,
    required String otpCode,
    required String newPassword,
    required String confirmPassword,
  }) async {
    return true;
  }

  @override
  Future<UserEntity> loginWithFirebaseOtp({
    required String firebaseIdToken,
  }) async {
    return currentUser!;
  }

  @override
  Future<bool> verifyFirebaseOtp({
    required String firebaseIdToken,
    required String purpose,
    String? newPassword,
    String? confirmPassword,
  }) async {
    return true;
  }

  @override
  Future<void> registerDeviceToken({
    required String fcmToken,
    String deviceType = 'android',
  }) async {}

  @override
  Future<bool> hasSavedSession() async {
    return currentUser != null;
  }
}

