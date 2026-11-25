import 'dart:async';
import 'package:dio/dio.dart';
import '../../app/router/app_router.dart';
import '../constants/api_endpoints.dart';
import '../services/secure_storage_service.dart';

class ApiClient {
  static ApiClient? _instance;
  static ApiClient get instance => _instance ??= ApiClient();

  late final Dio dio;
  final SecureStorageService secureStorage;

  Completer<bool>? _refreshCompleter;

  ApiClient({
    Dio? dioClient,
    SecureStorageService? storageService,
  }) : secureStorage = storageService ?? SecureStorageService() {
    dio = dioClient ??
        Dio(
          BaseOptions(
            baseUrl: ApiEndpoints.baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );

    _setupInterceptors();
    _instance ??= this;
  }

  void _setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Attach Bearer token if available
          final accessToken = await secureStorage.getAccessToken();
          if (accessToken != null && accessToken.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final requestPath = error.requestOptions.path;

          // Check if this error is an unauthenticated 401 on an API request (excluding auth endpoints)
          final isAuthEndpoint = requestPath.contains('/auth/login') ||
              requestPath.contains('/auth/register') ||
              requestPath.contains('/auth/refresh');

          if (error.response?.statusCode == 401 && !isAuthEndpoint) {
            final refreshed = await _performTokenRefresh();
            if (refreshed) {
              // Retry the original request with new token
              final newAccessToken = await secureStorage.getAccessToken();
              final opts = Options(
                method: error.requestOptions.method,
                headers: {
                  ...error.requestOptions.headers,
                  'Authorization': 'Bearer $newAccessToken',
                },
              );

              try {
                final response = await dio.request(
                  error.requestOptions.path,
                  data: error.requestOptions.data,
                  queryParameters: error.requestOptions.queryParameters,
                  options: opts,
                );
                return handler.resolve(response);
              } on DioException catch (retryErr) {
                return handler.reject(retryErr);
              }
            } else {
              // Refresh failed, clear session and redirect on home screen instead of login page
              await secureStorage.clearAll();
              AppRouter.navigateToHomeOnSessionExpired();
            }
          }

          return handler.next(error);
        },
      ),
    );
  }

  Future<bool> _performTokenRefresh() async {
    // If a refresh is already in-flight, await its completion to prevent race conditions
    if (_refreshCompleter != null) {
      return await _refreshCompleter!.future;
    }

    _refreshCompleter = Completer<bool>();

    try {
      final refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _refreshCompleter!.complete(false);
        _refreshCompleter = null;
        return false;
      }

      // Create isolated Dio client to avoid recursive interceptor loops
      final refreshDio = Dio(BaseOptions(baseUrl: ApiEndpoints.baseUrl));
      final response = await refreshDio.post(
        ApiEndpoints.refresh,
        data: {'refresh_token': refreshToken},
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final newAccess = data['access_token'] as String;
        final newRefresh = data['refresh_token'] as String;

        await secureStorage.saveTokens(
          accessToken: newAccess,
          refreshToken: newRefresh,
        );

        _refreshCompleter!.complete(true);
        _refreshCompleter = null;
        return true;
      }
    } catch (_) {
      // Failed to rotate refresh token
    }

    _refreshCompleter?.complete(false);
    _refreshCompleter = null;
    return false;
  }
}

