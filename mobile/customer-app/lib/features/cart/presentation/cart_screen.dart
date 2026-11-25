import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/quantity_selector.dart';

class _CartEntry {
  final MobileProduct product;
  int quantity;

  _CartEntry({required this.product, required this.quantity});
}

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late List<_CartEntry> _cartItems;

  @override
  void initState() {
    super.initState();
    _cartItems = [
      _CartEntry(product: MockData.products[0], quantity: 1), // Accu-Chek
      _CartEntry(product: MockData.products[1], quantity: 2), // Calcirol D3
    ];
  }

  void _removeItem(int index) {
    final removed = _cartItems[index];
    setState(() {
      _cartItems.removeAt(index);
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${removed.product.name} removed from cart'),
        duration: const Duration(seconds: 3),
        action: SnackBarAction(
          label: 'UNDO',
          textColor: AppColors.secondary,
          onPressed: () {
            setState(() {
              _cartItems.insert(index, removed);
            });
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_cartItems.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Shopping Cart'),
        ),
        body: _buildEmptyCart(),
      );
    }

    final subtotal = _cartItems.fold<double>(
      0.0,
      (sum, item) => sum + (item.product.sellingPrice * item.quantity),
    );
    final mrpTotal = _cartItems.fold<double>(
      0.0,
      (sum, item) => sum + (item.product.mrp * item.quantity),
    );
    final savings = mrpTotal - subtotal;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Shopping Cart (${_cartItems.length})'),
        actions: [
          if (_cartItems.isNotEmpty)
            TextButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Clear Shopping Cart?'),
                    content: const Text(
                        'Are you sure you want to remove all items from your cart?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.of(ctx).pop();
                          setState(() => _cartItems.clear());
                        },
                        child: const Text('Clear All',
                            style: TextStyle(color: AppColors.error)),
                      ),
                    ],
                  ),
                );
              },
              child: const Text('Clear All',
                  style: TextStyle(color: AppColors.error, fontSize: 12)),
            ),
        ],
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
                  children: List.generate(_cartItems.length, (index) {
                    final entry = _cartItems[index];
                    return Column(
                      children: [
                        if (index > 0)
                          const Divider(height: 1, color: AppColors.border),
                        Dismissible(
                          key: Key('cart_item_${entry.product.id}'),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            color: AppColors.error.withValues(alpha: 0.12),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Icon(Icons.delete_outline_rounded,
                                    color: AppColors.error, size: 22),
                                SizedBox(width: 6),
                                Text('Delete',
                                    style: TextStyle(
                                        color: AppColors.error,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12)),
                              ],
                            ),
                          ),
                          onDismissed: (_) => _removeItem(index),
                          child: _buildCartRow(entry, index),
                        ),
                      ],
                    );
                  }),
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

  Widget _buildEmptyCart() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.4),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shopping_cart_outlined,
                size: 44,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Your Shopping Cart is Empty',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.mainText,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Explore our pharmacy catalog to add medicines and healthcare essentials.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.secondaryText,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            AppButton(
              text: 'Explore Products',
              onPressed: () => context.push('/products'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartRow(_CartEntry entry, int index) {
    final product = entry.product;
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
                  overflow: TextOverflow.ellipsis,
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
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              QuantitySelector(
                quantity: entry.quantity,
                onQuantityChanged: (q) {
                  setState(() {
                    entry.quantity = q;
                  });
                },
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _removeItem(index),
                borderRadius: BorderRadius.circular(4),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.delete_outline_rounded,
                          size: 14, color: AppColors.error),
                      SizedBox(width: 3),
                      Text(
                        'Remove',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
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
