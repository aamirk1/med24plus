import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../mock/mock_data.dart';
import 'animated_entry.dart';

class CategoryCard extends StatelessWidget {
  final MobileCategory category;
  final VoidCallback? onTap;

  const CategoryCard({
    super.key,
    required this.category,
    this.onTap,
  });

  IconData _getIconData(String icon, String name) {
    final lowerName = name.toLowerCase();
    if (lowerName.contains('anti') || lowerName.contains('infect')) {
      return Icons.coronavirus_outlined;
    }
    if (lowerName.contains('pain') || lowerName.contains('analgesic')) {
      return Icons.healing_rounded;
    }
    if (lowerName.contains('vitamin') || lowerName.contains('supplement') || lowerName.contains('calcium')) {
      return Icons.eco_rounded;
    }
    if (lowerName.contains('device') || lowerName.contains('monitor') || lowerName.contains('glucometer')) {
      return Icons.thermostat_outlined;
    }
    if (lowerName.contains('heart') || lowerName.contains('pressure') || lowerName.contains('cardio')) {
      return Icons.favorite_rounded;
    }
    if (lowerName.contains('stomach') || lowerName.contains('acid') || lowerName.contains('gastro') || lowerName.contains('antacid')) {
      return Icons.spa_rounded;
    }
    if (lowerName.contains('baby') || lowerName.contains('mother')) {
      return Icons.child_care_rounded;
    }
    if (lowerName.contains('skin') || lowerName.contains('derma')) {
      return Icons.face_retouching_natural_rounded;
    }
    return Icons.medication_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedTapScale(
      onTap: onTap,
      scaleDown: 0.94,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
              ),
              child: Center(
                child: Icon(
                  _getIconData(category.icon, category.name),
                  color: AppColors.primary,
                  size: 26,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              category.name,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.mainText,
                height: 1.25,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              '${category.count} medicines',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.secondaryText,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
