import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../mock/mock_data.dart';
import 'animated_entry.dart';
import 'app_badge.dart';
import 'price_widget.dart';

class ProductCard extends StatelessWidget {
  final MobileProduct product;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final String? heroTag;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.onAddToCart,
    this.heroTag,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedTapScale(
      onTap: onTap,
      scaleDown: 0.97,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Placeholder with Badge
            _buildImageWidget(),
            const SizedBox(height: 6),

            // Brand & Salt
            Text(
              product.brand,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.secondaryText,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),

            // Name
            Text(
              product.name,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.mainText,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),

            // Pack size
            Text(
              product.packSize,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.secondaryText,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),

            // Price & Add Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                PriceWidget(
                  sellingPrice: product.sellingPrice,
                  mrp: product.mrp,
                  fontSize: 13,
                ),
                AnimatedTapScale(
                  onTap: onAddToCart,
                  scaleDown: 0.90,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                    ),
                    child: const Text(
                      'ADD',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageWidget() {
    final imageStack = Stack(
      children: [
        Container(
          height: 98,
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Icon(
              Icons.medication_liquid_outlined,
              size: 38,
              color: AppColors.primary.withValues(alpha: 0.3),
            ),
          ),
        ),
        Positioned(
          top: 6,
          left: 6,
          child: AppBadge.schedule(product.schedule),
        ),
      ],
    );

    if (heroTag != null) {
      return Hero(
        tag: heroTag!,
        child: imageStack,
      );
    }
    return imageStack;
  }
}
