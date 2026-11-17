import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/price_widget.dart';
import '../../../core/widgets/quantity_selector.dart';
import '../../../core/widgets/app_button.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final product = MockData.products.firstWhere(
      (p) => p.id == widget.productId,
      orElse: () => MockData.products.first,
    );

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(product.brand),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, size: 20),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined, size: 22),
            onPressed: () => context.push('/cart'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image Container
            Container(
              height: 220,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      Icons.medication_liquid_rounded,
                      size: 80,
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: AppBadge.schedule(product.schedule),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Brand & Pack Size
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  product.brand,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.secondary,
                  ),
                ),
                Text(
                  product.packSize,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.secondaryText,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Product Name
            Text(
              product.name,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.mainText,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 10),

            // Price Section
            PriceWidget(
              sellingPrice: product.sellingPrice,
              mrp: product.mrp,
              discountPercent: product.discountPercent,
              fontSize: 22,
            ),
            const SizedBox(height: 6),
            const Text(
              'Inclusive of all applicable Indian taxes (GST)',
              style: TextStyle(fontSize: 10, color: AppColors.secondaryText),
            ),
            const SizedBox(height: 16),

            // Clinical Schedule Notice
            if (product.requiresPrescription) ...[
              Container(
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
              const SizedBox(height: 16),
            ],

            // Active Salt Composition
            const Text(
              'Therapeutic Salt Composition',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
            ),
            const SizedBox(height: 4),
            Text(
              product.saltComposition,
              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
            ),
            const SizedBox(height: 16),

            // Description
            const Text(
              'Product Overview',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
            ),
            const SizedBox(height: 4),
            Text(
              product.description,
              style: const TextStyle(fontSize: 12, color: AppColors.secondaryText, height: 1.5),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
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
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                text: 'Add to Cart',
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${product.name} (x$_quantity) added to cart')),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

