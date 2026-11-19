class ApiEndpoints {
  ApiEndpoints._();

  // Live Production Server API (https://med24plus-api.serwex.in)
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://med24plus-api.serwex.in/api/v1',
  );

  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String logoutAll = '/auth/logout-all';
  static const String sendOtp = '/auth/otp/send';
  static const String verifyOtp = '/auth/otp/verify';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String changePassword = '/auth/change-password';

  // Firebase Phone Auth OTP
  static const String firebaseVerifyOtp = '/auth/firebase/verify-otp';

  // Notifications & Device Tokens
  static const String registerDeviceToken = '/notifications/device-token';
  static const String deleteDeviceToken = '/notifications/device-token';
  static const String notifications = '/notifications';
  static const String unreadNotificationsCount = '/notifications/unread-count';
  static const String markAllNotificationsRead = '/notifications/mark-all-read';
}
