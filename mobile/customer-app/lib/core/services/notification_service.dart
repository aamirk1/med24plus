import 'package:flutter/foundation.dart';
import '../mock/mock_data.dart';

class NotificationService extends ChangeNotifier {
  static final NotificationService instance = NotificationService._internal();

  NotificationService._internal() {
    _notifications = List.from(MockData.notifications);
  }

  late List<MobileNotification> _notifications;

  List<MobileNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  int get totalCount => _notifications.length;

  bool get isEmpty => _notifications.isEmpty;

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

  void removeNotification(String id) {
    _notifications.removeWhere((n) => n.id == id);
    notifyListeners();
  }

  void clearAll() {
    _notifications.clear();
    notifyListeners();
  }
}
