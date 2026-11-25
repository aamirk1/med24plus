import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/widgets/animated_entry.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    NotificationService.instance.fetchNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: NotificationService.instance,
      builder: (context, _) {
        final notifService = NotificationService.instance;
        final list = notifService.notifications;
        final unread = notifService.unreadCount;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            title: Text(unread > 0 ? 'Notifications ($unread)' : 'Notifications'),
            actions: [
              if (unread > 0)
                TextButton(
                  onPressed: () => notifService.markAllAsRead(),
                  child: const Text(
                    'Mark all read',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              if (list.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear_all_rounded, size: 22),
                  tooltip: 'Clear all notifications',
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Clear All Notifications?'),
                        content: const Text(
                            'Are you sure you want to dismiss all notifications?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.of(ctx).pop();
                              notifService.clearAll();
                            },
                            child: const Text('Clear',
                                style: TextStyle(color: AppColors.error)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
          body: RefreshIndicator(
            color: AppColors.primary,
            onRefresh: notifService.fetchNotifications,
            child: list.isEmpty
                ? _buildEmptyNotifications()
                : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final notif = list[index];
                    return AnimatedFadeSlide(
                      delay: Duration(milliseconds: index * 35),
                      child: AnimatedTapScale(
                        scaleDown: 0.98,
                        onTap: () {
                          notifService.markAsRead(notif.id);
                          _showNotificationDetail(context, notif.title, notif.message, notif.time);
                        },
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: notif.isRead
                                ? AppColors.surface
                                : AppColors.primaryLight.withValues(alpha: 0.4),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: notif.isRead
                                  ? AppColors.border
                                  : AppColors.primary.withValues(alpha: 0.3),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: notif.isRead
                                      ? AppColors.primaryLight
                                      : AppColors.secondary.withValues(alpha: 0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  notif.isRead
                                      ? Icons.notifications_none_rounded
                                      : Icons.notifications_active_rounded,
                                  size: 18,
                                  color: notif.isRead
                                      ? AppColors.secondaryText
                                      : AppColors.secondary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            notif.title,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: notif.isRead
                                                  ? FontWeight.w600
                                                  : FontWeight.bold,
                                              color: AppColors.mainText,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Row(
                                          children: [
                                            Text(
                                              notif.time,
                                              style: const TextStyle(
                                                fontSize: 10,
                                                color: AppColors.secondaryText,
                                              ),
                                            ),
                                            if (!notif.isRead) ...[
                                              const SizedBox(width: 6),
                                              Container(
                                                width: 7,
                                                height: 7,
                                                decoration: const BoxDecoration(
                                                  color: AppColors.danger,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      notif.message,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: notif.isRead
                                            ? AppColors.secondaryText
                                            : AppColors.mainText,
                                        height: 1.35,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyNotifications() {
    return ListView(
      children: [
        const SizedBox(height: 120),
        Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.notifications_off_outlined,
                    size: 38,
                    color: AppColors.secondaryText,
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'No Notifications',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.mainText,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'You are all caught up! Order updates and refill reminders will appear here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.secondaryText,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showNotificationDetail(BuildContext context, String title, String message, String time) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: AppColors.surface,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                  ),
                  Text(time, style: const TextStyle(fontSize: 11, color: AppColors.secondaryText)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                message,
                style: const TextStyle(fontSize: 13, color: AppColors.mainText, height: 1.4),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Dismiss'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
