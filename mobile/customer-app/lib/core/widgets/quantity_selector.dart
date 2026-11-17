import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'animated_entry.dart';

class QuantitySelector extends StatelessWidget {
  final int quantity;
  final ValueChanged<int> onQuantityChanged;
  final int minQuantity;
  final int maxQuantity;

  const QuantitySelector({
    super.key,
    required this.quantity,
    required this.onQuantityChanged,
    this.minQuantity = 1,
    this.maxQuantity = 10,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedTapScale(
            onTap: quantity > minQuantity ? () => onQuantityChanged(quantity - 1) : null,
            scaleDown: 0.85,
            child: Container(
              padding: const EdgeInsets.all(8),
              child: Icon(
                Icons.remove,
                size: 14,
                color: quantity > minQuantity
                    ? AppColors.mainText
                    : AppColors.secondaryText.withValues(alpha: 0.4),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              transitionBuilder: (child, animation) {
                return ScaleTransition(
                  scale: animation,
                  child: FadeTransition(opacity: animation, child: child),
                );
              },
              child: Text(
                '$quantity',
                key: ValueKey<int>(quantity),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.mainText,
                ),
              ),
            ),
          ),
          AnimatedTapScale(
            onTap: quantity < maxQuantity ? () => onQuantityChanged(quantity + 1) : null,
            scaleDown: 0.85,
            child: Container(
              padding: const EdgeInsets.all(8),
              child: Icon(
                Icons.add,
                size: 14,
                color: quantity < maxQuantity
                    ? AppColors.mainText
                    : AppColors.secondaryText.withValues(alpha: 0.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
