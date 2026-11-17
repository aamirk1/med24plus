import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/quantity_selector.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  int _item1Qty = 1;
  int _item2Qty = 2;

  @override
  Widget build(BuildContext context) {
    final item1 = MockData.products[0]; // Accu-Chek
    final item2 = MockData.products[1]; // Calcirol D3

    final subtotal =
        (item1.sellingPrice * _item1Qty) + (item2.sellingPrice * _item2Qty);
    final mrpTotal = (item1.mrp * _item1Qty) + (item2.mrp * _item2Qty);
    final savings = mrpTotal - subtotal;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Shopping Cart'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Cart Items List
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 50),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildCartRow(
                        item1, _item1Qty, (q) => setState(() => _item1Qty = q)),
                    const Divider(height: 1, color: AppColors.border),
                    _buildCartRow(
                        item2, _item2Qty, (q) => setState(() => _item2Qty = q)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Prescription Reminder Banner
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 100),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                  border:
                      Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined,
                        color: AppColors.primary, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'This order contains Schedule H medicines. You can attach a doctor prescription in the next checkout step.',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppColors.primaryDark,
                            height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Bill Breakdown Card
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 150),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Bill Summary',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.mainText),
                    ),
                    const SizedBox(height: 12),
                    _buildSummaryRow(
                        'Item Total (MRP)', '₹${mrpTotal.toStringAsFixed(0)}'),
                    const SizedBox(height: 6),
                    _buildSummaryRow(
                        'Pharmacy Discount', '-₹${savings.toStringAsFixed(0)}',
                        isDiscount: true),
                    const SizedBox(height: 6),
                    _buildSummaryRow('Estimated GST (Included)',
                        '₹${(subtotal * 0.12).toStringAsFixed(0)}'),
                    const SizedBox(height: 6),
                    _buildSummaryRow('Standard Home Delivery', 'FREE',
                        isFree: true),
                    const Divider(height: 20, color: AppColors.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Payable',
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.mainText),
                        ),
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 250),
                          transitionBuilder: (child, animation) =>
                              FadeTransition(opacity: animation, child: child),
                          child: Text(
                            '₹${subtotal.toStringAsFixed(0)}',
                            key: ValueKey<double>(subtotal),
                            style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Checkout CTA
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 200),
              child: AppButton(
                text: 'Proceed to Checkout (₹${subtotal.toStringAsFixed(0)})',
                isFullWidth: true,
                onPressed: () => context.push('/checkout'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartRow(
      MobileProduct product, int quantity, ValueChanged<int> onQtyChanged) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.medication_outlined,
                color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.mainText),
                  maxLines: 2,
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${product.sellingPrice.toStringAsFixed(0)} each',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.secondaryText),
                ),
              ],
            ),
          ),
          QuantitySelector(
            quantity: quantity,
            onQuantityChanged: onQtyChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value,
      {bool isDiscount = false, bool isFree = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style:
                const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          transitionBuilder: (child, animation) =>
              FadeTransition(opacity: animation, child: child),
          child: Text(
            value,
            key: ValueKey<String>(value),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color:
                  isDiscount || isFree ? AppColors.success : AppColors.mainText,
            ),
          ),
        ),
      ],
    );
  }
}
