import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../models/auth_tokens_model.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<AuthTokensModel> login(String identifier, String password);
  Future<UserModel> register({
    required String fullName,
    required String phone,
    required String password,
    required String confirmPassword,
    String? email,
  });
  Future<UserModel> getMe();
  Future<void> logout();
  Future<String?> sendOtp(String target, String purpose);
  Future<bool> verifyOtp(String target, String otpCode, String purpose);
  Future<bool> resetPassword({
    required String identifier,
    required String otpCode,
    required String newPassword,
    required String confirmPassword,
  });
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<AuthTokensModel> login(String identifier, String password) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.login,
        data: {'identifier': identifier, 'password': password},
      );
      return AuthTokensModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  @override
  Future<UserModel> register({
    required String fullName,
    required String phone,
    required String password,
    required String confirmPassword,
    String? email,
  }) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.register,
        data: {
          'full_name': fullName,
          'phone': phone,
          'password': password,
          'confirm_password': confirmPassword,
          'email': email?.isNotEmpty == true ? email : null,
        },
      );
      return UserModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  @override
  Future<UserModel> getMe() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.me);
      return UserModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  @override
  Future<void> logout() async {
    try {
      final refreshToken = await apiClient.secureStorage.getRefreshToken();
      await apiClient.dio.post(
        ApiEndpoints.logout,
        data: refreshToken != null ? {'refresh_token': refreshToken} : null,
      );
    } catch (_) {
      // Ignored
    }
  }

  @override
  Future<String?> sendOtp(String target, String purpose) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.sendOtp,
        data: {'target': target, 'purpose': purpose},
      );
      return response.data['data']?['dev_otp'] as String?;
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  @override
  Future<bool> verifyOtp(String target, String otpCode, String purpose) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.verifyOtp,
        data: {
          'target': target,
          'otp_code': otpCode,
          'purpose': purpose,
        },
      );
      return response.data['data']?['verified'] == true;
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  @override
  Future<bool> resetPassword({
    required String identifier,
    required String otpCode,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.resetPassword,
        data: {
          'identifier': identifier,
          'otp_code': otpCode,
          'new_password': newPassword,
          'confirm_password': confirmPassword,
        },
      );
      return response.data['data']?['reset'] == true;
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  Exception _parseError(DioException e) {
    if (e.response?.data != null && e.response?.data is Map) {
      final msg = e.response!.data['message'] as String?;
      if (msg != null && msg.isNotEmpty) {
        return Exception(msg);
      }
    }
    return Exception(e.message ?? 'Network error occurred. Please try again.');
  }
}

