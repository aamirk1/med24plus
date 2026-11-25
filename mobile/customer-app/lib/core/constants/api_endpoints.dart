class ApiEndpoints {
  ApiEndpoints._();

  // Live Production Server API (https://med24plus-api.serwex.in)
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://med24plus-api.serwex.in/api/v1',
  );

  // Authentication & Session
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

  // Catalog, Categories & Products
  static const String products = '/products';
  static const String categories = '/categories';
  static const String brands = '/brands';
  static String productDetail(String id) => '/products/$id';
  static String productSubstitutes(String id) => '/products/$id/substitutes';

  // Cart & Checkout
  static const String cart = '/cart';
  static const String cartItems = '/cart/items';
  static const String checkoutPrepare = '/checkout/prepare';
  static const String checkoutValidate = '/checkout/validate';

  // Customer Orders (Phase 8 FEFO Statutory Dispensing)
  static const String orders = '/orders';
  static String orderDetail(String id) => '/orders/$id';
  static String orderTracking(String id) => '/orders/$id/tracking';

  // Delivery Addresses
  static const String addresses = '/addresses';
  static String addressDetail(String id) => '/addresses/$id';

  // Prescriptions Vault (Rule 65)
  static const String prescriptions = '/prescriptions';
  static const String prescriptionsUpload = '/prescriptions/upload';

  // Notifications & Device Tokens
  static const String registerDeviceToken = '/notifications/device-token';
  static const String deleteDeviceToken = '/notifications/device-token';
  static const String notifications = '/notifications';
  static const String unreadNotificationsCount = '/notifications/unread-count';
  static const String markAllNotificationsRead = '/notifications/mark-all-read';

  // Store Licensing & Compliance
  static const String settings = '/settings';
  static const String membership = '/membership';
}
