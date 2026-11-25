import 'package:flutter/foundation.dart';
import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';

class NotificationService extends ChangeNotifier {
  static final NotificationService instance = NotificationService._internal();

  final ApiClient _apiClient = ApiClient.instance;

  NotificationService._internal() {
    _notifications = [];
  }

  late List<MobileNotification> _notifications;

  List<MobileNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  int get totalCount => _notifications.length;

  bool get isEmpty => _notifications.isEmpty;

  /// Fetch notifications from backend
  Future<void> fetchNotifications() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.notifications);
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'];
        List itemsJson = [];
        if (data is Map && data.containsKey('items')) {
          itemsJson = data['items'] as List;
        } else if (data is List) {
          itemsJson = data;
        }

        if (itemsJson.isNotEmpty) {
          _notifications = itemsJson.map((item) {
            final m = item as Map<String, dynamic>;
            return MobileNotification(
              id: m['id']?.toString() ?? '',
              title: m['title']?.toString() ?? 'Med24Plus Alert',
              message: m['message']?.toString() ?? '',
              time: m['created_at']?.toString().split('T').first ?? 'Today',
              isRead: m['is_read'] == true,
            );
          }).toList();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index >= 0 && !_notifications[index].isRead) {
      final old = _notifications[index];
      _notifications[index] = MobileNotification(
        id: old.id,
        title: old.title,
        message: old.message,
        time: old.time,
        isRead: true,
      );
      notifyListeners();
    }
  }

  void markAllAsRead() {
    bool hasUnread = _notifications.any((n) => !n.isRead);
    if (!hasUnread) return;

    _notifications = _notifications.map((n) {
      return MobileNotification(
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.time,
        isRead: true,
      );
    }).toList();
    notifyListeners();

    try {
      _apiClient.dio.post(ApiEndpoints.markAllNotificationsRead);
    } catch (_) {}
  }

  void clearAll() {
    _notifications.clear();
    notifyListeners();
  }

  void addNotification({
    required String title,
    required String message,
    String time = 'Just now',
  }) {
    _notifications.insert(
      0,
      MobileNotification(
        id: 'notif-${DateTime.now().millisecondsSinceEpoch}',
        title: title,
        message: message,
        time: time,
        isRead: false,
      ),
    );
    notifyListeners();
  }
}
