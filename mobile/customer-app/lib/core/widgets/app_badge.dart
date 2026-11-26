import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

enum AppBadgeVariant { success, warning, danger, info, neutral }

class AppBadge extends StatelessWidget {
  final String label;
  final AppBadgeVariant variant;
  final IconData? icon;

  const AppBadge({
    super.key,
    required this.label,
    this.variant = AppBadgeVariant.neutral,
    this.icon,
  });

  factory AppBadge.schedule(String schedule) {
    switch (schedule.toUpperCase()) {
      case 'SCHEDULE_H':
      case 'SCHEDULE_H1':
        return const AppBadge(
          label: 'Rx Required',
          variant: AppBadgeVariant.warning,
          icon: Icons.receipt_long_outlined,
        );
      case 'AYUSH':
        return const AppBadge(
          label: 'AYUSH / Herbal',
          variant: AppBadgeVariant.success,
          icon: Icons.eco_outlined,
        );
      case 'DEVICE':
        return const AppBadge(
          label: 'Medical Device',
          variant: AppBadgeVariant.info,
          icon: Icons.medical_services_outlined,
        );
      default:
        return const AppBadge(
          label: 'OTC',
          variant: AppBadgeVariant.neutral,
        );
    }
  }

  factory AppBadge.orderStatus(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return AppBadge(
          label: status,
          variant: AppBadgeVariant.success,
          icon: Icons.check_circle_outline,
        );
      case 'out for delivery':
      case 'dispatched':
        return AppBadge(
          label: status,
          variant: AppBadgeVariant.info,
          icon: Icons.delivery_dining_outlined,
        );
      case 'packed':
      case 'pending review':
        return AppBadge(
          label: status,
          variant: AppBadgeVariant.warning,
          icon: Icons.hourglass_top_outlined,
        );
      case 'cancelled':
      case 'rejected':
        return AppBadge(
          label: status,
          variant: AppBadgeVariant.danger,
          icon: Icons.cancel_outlined,
        );
      default:
        return AppBadge(label: status, variant: AppBadgeVariant.neutral);
    }
  }

  @override
  Widget build(BuildContext context) {
    final (bgColor, textColor, borderColor) = switch (variant) {
      AppBadgeVariant.success => (
          AppColors.success.withValues(alpha: 0.1),
          AppColors.success,
          AppColors.success.withValues(alpha: 0.25),
        ),
      AppBadgeVariant.warning => (
          AppColors.warning.withValues(alpha: 0.1),
          AppColors.warning,
          AppColors.warning.withValues(alpha: 0.25),
        ),
      AppBadgeVariant.danger => (
          AppColors.danger.withValues(alpha: 0.1),
          AppColors.danger,
          AppColors.danger.withValues(alpha: 0.25),
        ),
      AppBadgeVariant.info => (
          AppColors.secondary.withValues(alpha: 0.1),
          AppColors.secondary,
          AppColors.secondary.withValues(alpha: 0.25),
        ),
      AppBadgeVariant.neutral => (
          AppColors.secondaryText.withValues(alpha: 0.1),
          AppColors.secondaryText,
          AppColors.border,
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

