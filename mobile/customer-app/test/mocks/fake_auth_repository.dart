import 'package:customer_app/features/auth/domain/entities/user_entity.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';

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
  Future<bool> hasSavedSession() async {
    return currentUser != null;
  }
}

