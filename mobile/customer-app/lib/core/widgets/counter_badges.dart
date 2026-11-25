import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_colors.dart';
import '../services/cart_service.dart';
import '../services/notification_service.dart';

/// Interactive Dynamic Cart Badge with Live Counter
class CartBadgeIcon extends StatelessWidget {
  final Color? iconColor;
  final double iconSize;
  final VoidCallback? onTap;

  const CartBadgeIcon({
    super.key,
    this.iconColor,
    this.iconSize = 24,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: CartService.instance,
      builder: (context, _) {
        final count = CartService.instance.distinctCount;
        return Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: Icon(
                Icons.shopping_cart_outlined,
                size: iconSize,
                color: iconColor ?? AppColors.mainText,
              ),
              onPressed: onTap ?? () => context.push('/cart'),
            ),
            if (count > 0)
              Positioned(
                right: 6,
                top: 6,
                child: TweenAnimationBuilder<double>(
                  key: ValueKey<int>(count),
                  tween: Tween<double>(begin: 0.6, end: 1.0),
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutBack,
                  builder: (context, scale, child) {
                    return Transform.scale(
                      scale: scale,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        decoration: BoxDecoration(
                          color: AppColors.secondary,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.secondary.withValues(alpha: 0.4),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            count > 99 ? '99+' : '$count',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              height: 1.0,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        );
      },
    );
  }
}

/// Interactive Dynamic Notification Badge with Live Unread Counter
class NotificationBadgeIcon extends StatelessWidget {
  final Color? iconColor;
  final double iconSize;
  final VoidCallback? onTap;

  const NotificationBadgeIcon({
    super.key,
    this.iconColor,
    this.iconSize = 24,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: NotificationService.instance,
      builder: (context, _) {
        final count = NotificationService.instance.unreadCount;
        return Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: Icon(
                Icons.notifications_none_rounded,
                size: iconSize,
                color: iconColor ?? AppColors.mainText,
              ),
              onPressed: onTap ?? () => context.push('/notifications'),
            ),
            if (count > 0)
              Positioned(
                right: 6,
                top: 6,
                child: TweenAnimationBuilder<double>(
                  key: ValueKey<int>(count),
                  tween: Tween<double>(begin: 0.6, end: 1.0),
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutBack,
                  builder: (context, scale, child) {
                    return Transform.scale(
                      scale: scale,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        decoration: BoxDecoration(
                          color: AppColors.danger,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.danger.withValues(alpha: 0.4),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            count > 99 ? '99+' : '$count',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              height: 1.0,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        );
      },
    );
  }
}
