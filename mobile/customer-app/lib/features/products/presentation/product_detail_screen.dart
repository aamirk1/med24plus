import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/brand_substitutes_widget.dart';
import '../../../core/widgets/counter_badges.dart';
import '../../../core/widgets/price_widget.dart';
import '../../../core/widgets/quantity_selector.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;
  late MobileProduct _activeProduct;
  BrandSubstituteOption? _selectedSubstitute;

  @override
  void initState() {
    super.initState();
    _activeProduct = MockData.products.firstWhere(
      (p) => p.id == widget.productId,
      orElse: () => MockData.products.first,
    );
  }

  @override
  Widget build(BuildContext context) {
    final substituteOptions = MockData.getSubstitutesForProduct(_activeProduct.id);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : context.go('/home'),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.local_hospital_rounded, color: AppColors.primary, size: 18),
            ),
            const SizedBox(width: 8),
            const Text(
              'Med24Plus',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.mainText,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, size: 22),
            onPressed: () => context.push('/search'),
          ),
          const CartBadgeIcon(iconSize: 22),
          const SizedBox(width: 4),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Hero Image Container
            Hero(
              tag: 'product_card_img_${_activeProduct.id}',
              child: Container(
                height: 220,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Icon(
                        Icons.medication_rounded,
                        size: 88,
                        color: AppColors.primary.withValues(alpha: 0.35),
                      ),
                    ),
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.secondaryLight,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.secondary.withValues(alpha: 0.4)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Rx',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: AppColors.secondaryDark,
                              ),
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Required',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: AppColors.secondaryDark,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: AppBadge.schedule(_activeProduct.schedule),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Product Title & Generic / Strength
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 60),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _selectedSubstitute != null ? _selectedSubstitute!.name : _activeProduct.name,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: AppColors.mainText,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_activeProduct.saltComposition} | ${_activeProduct.dosageForm}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.secondaryText,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Rating Row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.star_rounded, size: 13, color: Color(0xFFD97706)),
                            const SizedBox(width: 3),
                            Text(
                              '${_activeProduct.rating}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF92400E),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '(${_activeProduct.reviewsCount} Reviews)',
                        style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Pricing Row
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 90),
              child: PriceWidget(
                sellingPrice: _selectedSubstitute != null ? _selectedSubstitute!.sellingPrice : _activeProduct.sellingPrice,
                mrp: _selectedSubstitute != null ? _selectedSubstitute!.mrp : _activeProduct.mrp,
                discountPercent: _selectedSubstitute != null ? _selectedSubstitute!.savingsPercent : _activeProduct.discountPercent,
                fontSize: 22,
              ),
            ),
            const SizedBox(height: 14),

            // 3-Pillar Trust Strip (100% Genuine, Pharmacist Verified, Easy Returns)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Row(
                    children: [
                      Icon(Icons.verified_outlined, size: 14, color: AppColors.secondary),
                      SizedBox(width: 4),
                      Text(
                        '100% Genuine',
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.mainText),
                      ),
                    ],
                  ),
                  Text('•', style: TextStyle(color: AppColors.border)),
                  Row(
                    children: [
                      Icon(Icons.person_pin_outlined, size: 14, color: AppColors.primary),
                      SizedBox(width: 4),
                      Text(
                        'Pharmacist Verified',
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.mainText),
                      ),
                    ],
                  ),
                  Text('•', style: TextStyle(color: AppColors.border)),
                  Row(
                    children: [
                      Icon(Icons.replay_rounded, size: 14, color: AppColors.secondaryDark),
                      SizedBox(width: 4),
                      Text(
                        'Easy Returns',
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.mainText),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ================================================================
            // COMPARE BRAND SUBSTITUTION SECTION (Matches Screenshot 2)
            // ================================================================
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 120),
              child: BrandSubstitutesWidget(
                options: substituteOptions,
                activeSalt: _activeProduct.saltComposition.split(' ')[0],
                strength: '500 mg',
                onOptionSelected: (selected) {
                  setState(() {
                    _selectedSubstitute = selected;
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      duration: const Duration(milliseconds: 1500),
                      content: Text('Switched to ${selected.name} • Save ₹${selected.savingsAmount.toInt()}!'),
                      backgroundColor: AppColors.secondaryDark,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // Clinical Schedule Notice
            if (_activeProduct.requiresPrescription) ...[
              AnimatedFadeSlide(
                delay: const Duration(milliseconds: 150),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.receipt_long, color: AppColors.warning, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Prescription Required (Rule 65)',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.warning,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'A valid prescription from a Registered Medical Practitioner is mandatory for dispensing this drug.',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.warning.withValues(alpha: 0.9),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Active Salt Composition
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 180),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Therapeutic Salt Composition',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _activeProduct.saltComposition,
                    style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Description
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 210),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Product Overview',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _activeProduct.description,
                    style: const TextStyle(fontSize: 12, color: AppColors.secondaryText, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            QuantitySelector(
              quantity: _quantity,
              onQuantityChanged: (q) => setState(() => _quantity = q),
            ),
            const SizedBox(width: 10),
            // Add to Cart Button (Outlined)
            Expanded(
              flex: 1,
              child: OutlinedButton.icon(
                onPressed: () {
                  final displayName = _selectedSubstitute?.name ?? _activeProduct.name;
                  CartService.instance.addItem(_activeProduct, _quantity);
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('$displayName (x$_quantity) added to cart'),
                      duration: const Duration(seconds: 2),
                      action: SnackBarAction(
                        label: 'VIEW CART',
                        textColor: AppColors.secondary,
                        onPressed: () => context.push('/cart'),
                      ),
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary, width: 1.5),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.shopping_cart_outlined, size: 16),
                label: const Text(
                  'Add to Cart',
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Buy Now Button (Solid Emerald Teal)
            Expanded(
              flex: 1,
              child: ElevatedButton(
                onPressed: () {
                  context.push('/cart');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
                child: const Text(
                  'Buy Now',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
