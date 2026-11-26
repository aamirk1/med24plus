import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class PriceWidget extends StatelessWidget {
  final double sellingPrice;
  final double? mrp;
  final int? discountPercent;
  final double fontSize;

  const PriceWidget({
    super.key,
    required this.sellingPrice,
    this.mrp,
    this.discountPercent,
    this.fontSize = 14,
  });

  @override
  Widget build(BuildContext context) {
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Text(
            '₹${sellingPrice.toStringAsFixed(0)}',
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.bold,
              color: AppColors.mainText,
            ),
          ),
          if (mrp != null && mrp! > sellingPrice) ...[
            const SizedBox(width: 4),
            Text(
              '₹${mrp!.toStringAsFixed(0)}',
              style: TextStyle(
                fontSize: fontSize * 0.78,
                decoration: TextDecoration.lineThrough,
                color: AppColors.secondaryText,
              ),
            ),
          ],
          if (discountPercent != null && discountPercent! > 0) ...[
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '$discountPercent% OFF',
                style: const TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
