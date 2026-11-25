import 'dart:async';
import 'dart:developer' as developer;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../firebase_options.dart';
import '../constants/api_endpoints.dart';
import '../network/api_client.dart';
import 'notification_service.dart';

/// Top-level background message handler invoked by native Android/iOS
/// when a push notification is received while the application is in the background or terminated.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }
    developer.log(
      'Background push notification received: ${message.messageId} | ${message.notification?.title}',
      name: 'PushNotificationService',
    );
  } catch (e) {
    developer.log('Error in background message handler: $e', name: 'PushNotificationService');
  }
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  FirebaseMessaging? _messaging;
  ApiClient? _apiClient;
  String? _fcmToken;
  bool _isInitialized = false;

  String? get fcmToken => _fcmToken;
  bool get isInitialized => _isInitialized;

  /// Callback stream for UI components listening for new foreground notifications
  final StreamController<RemoteMessage> _onMessageController = StreamController<RemoteMessage>.broadcast();
  Stream<RemoteMessage> get onMessageStream => _onMessageController.stream;

  /// Initialize Firebase Messaging, request notification permissions,
  /// retrieve FCM device token, and register device with the Med24Plus backend.
  Future<void> initialize({required ApiClient apiClient}) async {
    _apiClient = apiClient;

    try {
      // 1. Ensure Firebase Core is initialized
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
      }

      _messaging = FirebaseMessaging.instance;

      // 2. Request user permissions (required for iOS & Android 13+)
      final settings = await _messaging!.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      developer.log(
        'FCM Permission authorization status: ${settings.authorizationStatus}',
        name: 'PushNotificationService',
      );

      // 3. Register background handler
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 4. Configure foreground presentation options
      await _messaging!.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // 5. Retrieve device FCM token
      _fcmToken = await _messaging!.getToken();
      developer.log('FCM Device Registration Token: $_fcmToken', name: 'PushNotificationService');

      if (_fcmToken != null) {
        await syncDeviceToken(force: false);
      }

      // 6. Listen for token refreshes
      _messaging!.onTokenRefresh.listen((newToken) async {
        _fcmToken = newToken;
        developer.log('FCM Device Token refreshed: $newToken', name: 'PushNotificationService');
        await syncDeviceToken(force: true);
      });

      // 7. Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        developer.log(
          'Foreground message received: ${message.notification?.title} - ${message.notification?.body}',
          name: 'PushNotificationService',
        );
        NotificationService.instance.addNotification(
          title: message.notification?.title ?? 'Med24Plus Notification',
          message: message.notification?.body ?? '',
          time: 'Just now',
        );
        _onMessageController.add(message);
      });

      // 8. Notification open / tap listener
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        developer.log(
          'Notification tapped while app was in background: ${message.data}',
          name: 'PushNotificationService',
        );
        _handleNotificationClick(message.data);
      });

      // 9. Check if app was opened from a terminated state notification
      final initialMessage = await _messaging!.getInitialMessage();
      if (initialMessage != null) {
        developer.log(
          'App launched from terminated state via notification: ${initialMessage.data}',
          name: 'PushNotificationService',
        );
        _handleNotificationClick(initialMessage.data);
      }

      _isInitialized = true;
    } catch (e) {
      // Graceful fallback for local development or environments without google-services.json
      developer.log(
        'PushNotificationService initialization deferred/simulated: $e',
        name: 'PushNotificationService',
      );
      _isInitialized = false;
    }
  }

  /// Sync FCM device token with backend.
  /// If [force] is true (e.g. during login or register), immediately registers with the backend.
  /// If [force] is false, checks if 5 days have passed since the last successful sync.
  Future<void> syncDeviceToken({ApiClient? client, bool force = false}) async {
    final activeClient = client ?? _apiClient;
    if (activeClient == null) {
      developer.log('Skipping device token sync: ApiClient not initialized.', name: 'PushNotificationService');
      return;
    }

    try {
      final storage = activeClient.secureStorage;
      final hasSession = await storage.hasValidSession();
      if (!hasSession) {
        developer.log('Skipping device token sync: User not signed in yet.', name: 'PushNotificationService');
        return;
      }

      // Check 5-day periodic threshold if not forced
      if (!force) {
        final lastUpdateMs = await storage.getLastFcmUpdateTimestamp();
        final savedToken = await storage.getSyncedFcmToken();
        if (lastUpdateMs != null) {
          final lastDate = DateTime.fromMillisecondsSinceEpoch(lastUpdateMs);
          final daysSince = DateTime.now().difference(lastDate).inDays;
          if (daysSince < 5 && savedToken != null && savedToken == _fcmToken) {
            developer.log('FCM token is up-to-date (last synced $daysSince days ago). Skipping sync.', name: 'PushNotificationService');
            return;
          }
        }
      }

      // Retrieve latest token if available
      if (_messaging != null) {
        try {
          final token = await _messaging!.getToken();
          if (token != null && token.isNotEmpty) {
            _fcmToken = token;
          }
        } catch (_) {}
      }

      final tokenToSync = _fcmToken;
      if (tokenToSync == null || tokenToSync.isEmpty) {
        developer.log('No FCM token available to sync.', name: 'PushNotificationService');
        return;
      }

      await activeClient.dio.post(
        ApiEndpoints.registerDeviceToken,
        data: {
          'fcm_token': tokenToSync,
          'device_type': 'android',
        },
      );

      await storage.saveLastFcmUpdateTimestamp(DateTime.now().millisecondsSinceEpoch);
      await storage.saveSyncedFcmToken(tokenToSync);
      developer.log('Device FCM token successfully synced to backend (force=$force).', name: 'PushNotificationService');
    } catch (e) {
      developer.log('Failed to register device token with backend: $e', name: 'PushNotificationService');
    }
  }

  /// Deactivate device token on sign out
  Future<void> unregisterDeviceToken() async {
    if (_fcmToken == null || _apiClient == null) return;
    try {
      await _apiClient!.dio.delete(
        ApiEndpoints.deleteDeviceToken,
        queryParameters: {'fcm_token': _fcmToken},
      );
      developer.log('Device FCM token unregistered from backend.', name: 'PushNotificationService');
    } catch (e) {
      developer.log('Error unregistering device token: $e', name: 'PushNotificationService');
    }
  }

  void _handleNotificationClick(Map<String, dynamic> data) {
    // Custom deep-linking handling based on payload:
    // e.g. reference_type == 'order' -> navigate to /order/:id
    final refType = data['reference_type'];
    final refId = data['reference_id'];
    developer.log('Deep-link action for type: $refType, id: $refId', name: 'PushNotificationService');
  }

  void dispose() {
    _onMessageController.close();
  }
}
