import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

enum SnackBarType { success, cart, error, info, warning }

class AppSnackBar {
  AppSnackBar._();

  /// Displays an animated, swipe-dismissible floating SnackBar with customizable actions and styling.
  static void show(
    BuildContext context, {
    required String message,
    SnackBarType type = SnackBarType.info,
    String? title,
    String? actionLabel,
    VoidCallback? onAction,
    Duration duration = const Duration(seconds: 3),
    IconData? icon,
    bool showCloseButton = true,
  }) {
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;

    messenger.hideCurrentSnackBar();

    final config = _getStyleConfig(type);

    messenger.showSnackBar(
      SnackBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        behavior: SnackBarBehavior.floating,
        dismissDirection: DismissDirection.horizontal,
        duration: duration,
        padding: EdgeInsets.zero,
        margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        content: _AnimatedSnackBarContent(
          message: message,
          title: title,
          type: type,
          config: config,
          icon: icon ?? config.defaultIcon,
          actionLabel: actionLabel,
          onAction: onAction,
          showCloseButton: showCloseButton,
          onDismiss: () => messenger.hideCurrentSnackBar(),
        ),
      ),
    );
  }

  /// Specialized quick method for "Added to cart" notifications with "VIEW CART" action
  static void showCartSuccess(
    BuildContext context, {
    required String productName,
    int quantity = 1,
    required VoidCallback onViewCart,
  }) {
    final qtyText = quantity > 1 ? ' (x$quantity)' : '';
    show(
      context,
      message: '$productName$qtyText added to cart',
      type: SnackBarType.cart,
      actionLabel: 'VIEW CART',
      onAction: onViewCart,
      duration: const Duration(seconds: 3),
    );
  }

  /// Convenience helper for success messages
  static void showSuccess(
    BuildContext context,
    String message, {
    String? title,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    show(
      context,
      message: message,
      title: title,
      type: SnackBarType.success,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  /// Convenience helper for error messages
  static void showError(
    BuildContext context,
    String message, {
    String? title,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    show(
      context,
      message: message,
      title: title,
      type: SnackBarType.error,
      actionLabel: actionLabel,
      onAction: onAction,
      duration: const Duration(seconds: 4),
    );
  }

  /// Convenience helper for informational messages
  static void showInfo(
    BuildContext context,
    String message, {
    String? title,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    show(
      context,
      message: message,
      title: title,
      type: SnackBarType.info,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  /// Convenience helper for warnings
  static void showWarning(
    BuildContext context,
    String message, {
    String? title,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    show(
      context,
      message: message,
      title: title,
      type: SnackBarType.warning,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  static _SnackBarConfig _getStyleConfig(SnackBarType type) {
    switch (type) {
      case SnackBarType.cart:
        return _SnackBarConfig(
          backgroundColor: const Color(0xFF0F172A),
          borderColor: const Color(0xFF1E293B),
          accentColor: AppColors.secondary,
          iconBgColor: AppColors.secondary.withValues(alpha: 0.18),
          iconColor: const Color(0xFF34D399),
          defaultIcon: Icons.shopping_bag_outlined,
          textColor: Colors.white,
          actionBgColor: AppColors.secondary,
          actionTextColor: Colors.white,
        );
      case SnackBarType.success:
        return _SnackBarConfig(
          backgroundColor: const Color(0xFF0F172A),
          borderColor: const Color(0xFF1E293B),
          accentColor: AppColors.success,
          iconBgColor: AppColors.success.withValues(alpha: 0.2),
          iconColor: const Color(0xFF4ADE80),
          defaultIcon: Icons.check_circle_rounded,
          textColor: Colors.white,
          actionBgColor: AppColors.success,
          actionTextColor: Colors.white,
        );
      case SnackBarType.error:
        return _SnackBarConfig(
          backgroundColor: const Color(0xFF1E1418),
          borderColor: const Color(0xFF4C1D24),
          accentColor: AppColors.danger,
          iconBgColor: AppColors.danger.withValues(alpha: 0.2),
          iconColor: const Color(0xFFF87171),
          defaultIcon: Icons.error_outline_rounded,
          textColor: const Color(0xFFFEE2E2),
          actionBgColor: AppColors.danger,
          actionTextColor: Colors.white,
        );
      case SnackBarType.warning:
        return _SnackBarConfig(
          backgroundColor: const Color(0xFF1C1917),
          borderColor: const Color(0xFF442D15),
          accentColor: AppColors.warning,
          iconBgColor: AppColors.warning.withValues(alpha: 0.2),
          iconColor: const Color(0xFFFBBF24),
          defaultIcon: Icons.warning_amber_rounded,
          textColor: const Color(0xFFFEF3C7),
          actionBgColor: AppColors.warning,
          actionTextColor: Colors.black,
        );
      case SnackBarType.info:
        return _SnackBarConfig(
          backgroundColor: const Color(0xFF0B1E38),
          borderColor: const Color(0xFF1E3A5F),
          accentColor: AppColors.primary,
          iconBgColor: AppColors.primary.withValues(alpha: 0.25),
          iconColor: const Color(0xFF60A5FA),
          defaultIcon: Icons.info_outline_rounded,
          textColor: Colors.white,
          actionBgColor: AppColors.primary,
          actionTextColor: Colors.white,
        );
    }
  }
}

class _SnackBarConfig {
  final Color backgroundColor;
  final Color borderColor;
  final Color accentColor;
  final Color iconBgColor;
  final Color iconColor;
  final IconData defaultIcon;
  final Color textColor;
  final Color actionBgColor;
  final Color actionTextColor;

  _SnackBarConfig({
    required this.backgroundColor,
    required this.borderColor,
    required this.accentColor,
    required this.iconBgColor,
    required this.iconColor,
    required this.defaultIcon,
    required this.textColor,
    required this.actionBgColor,
    required this.actionTextColor,
  });
}

class _AnimatedSnackBarContent extends StatefulWidget {
  final String message;
  final String? title;
  final SnackBarType type;
  final _SnackBarConfig config;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool showCloseButton;
  final VoidCallback onDismiss;

  const _AnimatedSnackBarContent({
    required this.message,
    this.title,
    required this.type,
    required this.config,
    required this.icon,
    this.actionLabel,
    this.onAction,
    required this.showCloseButton,
    required this.onDismiss,
  });

  @override
  State<_AnimatedSnackBarContent> createState() => _AnimatedSnackBarContentState();
}

class _AnimatedSnackBarContentState extends State<_AnimatedSnackBarContent>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );

    _scaleAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutBack,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeIn,
    );

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          decoration: BoxDecoration(
            color: widget.config.backgroundColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: widget.config.borderColor, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icon with circular container
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: widget.config.iconBgColor,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(
                  widget.icon,
                  color: widget.config.iconColor,
                  size: 19,
                ),
              ),
              const SizedBox(width: 10),

              // Title and Message
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (widget.title != null && widget.title!.isNotEmpty) ...[
                      Text(
                        widget.title!,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: widget.config.accentColor,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 1),
                    ],
                    Text(
                      widget.message,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: widget.config.textColor,
                        height: 1.25,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),

              // Action button (e.g. VIEW CART)
              if (widget.actionLabel != null && widget.onAction != null) ...[
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    widget.onDismiss();
                    widget.onAction!();
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: widget.config.actionBgColor,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      widget.actionLabel!,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: widget.config.actionTextColor,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                ),
              ],

              // Close / Dismiss button
              if (widget.showCloseButton) ...[
                const SizedBox(width: 4),
                InkWell(
                  onTap: widget.onDismiss,
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(4.0),
                    child: Icon(
                      Icons.close_rounded,
                      color: widget.config.textColor.withValues(alpha: 0.5),
                      size: 18,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
