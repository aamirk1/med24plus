import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../mock/mock_data.dart';
import 'animated_entry.dart';
import 'price_widget.dart';

class ProductCard extends StatelessWidget {
  final MobileProduct product;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final String? heroTag;
  final bool isBestSeller;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.onAddToCart,
    this.heroTag,
    this.isBestSeller = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveHeroTag = heroTag ?? 'product_img_${product.id}';

    return AnimatedTapScale(
      onTap: onTap,
      scaleDown: 0.98,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Image Area (fills available space)
            Expanded(
              child: _buildImageWidget(effectiveHeroTag),
            ),
            const SizedBox(height: 6),

            // Brand
            Text(
              product.brand.toUpperCase(),
              style: const TextStyle(
                fontSize: 9.5,
                color: AppColors.secondaryText,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 1),

            // Product Name (2 lines max)
            Text(
              product.name,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: AppColors.mainText,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 1),

            // Pack size / Delivery indicator
            Text(
              product.packSize.isNotEmpty ? product.packSize : '1 Unit',
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.secondaryText,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 5),

            // Price & Animated Add-to-Cart Action
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: PriceWidget(
                    sellingPrice: product.sellingPrice,
                    mrp: product.mrp,
                    discountPercent: product.discountPercent,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(width: 4),
                _buildAddButton(),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageWidget(String tag) {
    final imageStack = Stack(
      children: [
        Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
          ),
          clipBehavior: Clip.antiAlias,
          child: product.imageUrl.isNotEmpty
              ? CachedNetworkImage(
                  imageUrl: product.imageUrl,
                  fit: BoxFit.contain,
                  placeholder: (context, url) => Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary.withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Center(
                    child: Icon(
                      Icons.medication_liquid_outlined,
                      size: 34,
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                )
              : Center(
                  child: Icon(
                    Icons.medication_liquid_outlined,
                    size: 34,
                    color: AppColors.primary.withValues(alpha: 0.3),
                  ),
                ),
        ),

        // Prescription Required Badge (Top Left) - Only shown if prescription is required
        if (product.requiresPrescription)
          Positioned(
            top: 5,
            left: 5,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long_rounded, size: 10, color: Color(0xFFDC2626)),
                  SizedBox(width: 2),
                  Text(
                    'Rx Required',
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFFDC2626),
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Discount Percent Pill (Top Right)
        if (product.discountPercent > 0)
          Positioned(
            top: 5,
            right: 5,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Text(
                '${product.discountPercent}% OFF',
                style: const TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF047857),
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ),

        // Best Seller Star Badge (Bottom Left)
        if (isBestSeller || product.discountPercent >= 25)
          Positioned(
            bottom: 5,
            left: 5,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Text(
                isBestSeller ? '★ Best Seller' : '★ Super Deal',
                style: const TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFB45309),
                ),
              ),
            ),
          ),
      ],
    );

    return Hero(
      tag: tag,
      child: imageStack,
    );
  }

  Widget _buildAddButton() {
    return AnimatedTapScale(
      onTap: onAddToCart,
      scaleDown: 0.88,
      child: Container(
        height: 28,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(7),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.25),
              blurRadius: 4,
              offset: const Offset(0, 1.5),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(Icons.add_rounded, size: 14, color: Colors.white),
            SizedBox(width: 2),
            Text(
              'ADD',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
