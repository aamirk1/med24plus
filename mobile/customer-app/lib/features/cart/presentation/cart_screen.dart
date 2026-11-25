import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/coupon_input_card.dart';
import '../../../core/widgets/quantity_selector.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    CartService.instance.fetchServerCart();
  }

  void _removeItem(BuildContext context, int index) {
    final cart = CartService.instance;
    final removed = cart.items[index];
    cart.removeAt(index);

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${removed.product.name} removed from cart'),
        duration: const Duration(seconds: 3),
        action: SnackBarAction(
          label: 'UNDO',
          textColor: AppColors.secondary,
          onPressed: () {
            cart.insertItem(index, removed);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: CartService.instance,
      builder: (context, _) {
        final cart = CartService.instance;
        final items = cart.items;

        if (items.isEmpty) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              title: const Text('Shopping Cart'),
            ),
            body: _buildEmptyCart(context),
          );
        }

        final subtotal = cart.subtotal;
        final mrpTotal = cart.mrpTotal;
        final savings = cart.savings;
        final couponDiscount = cart.couponDiscount;
        final totalPayable = cart.totalPayable;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            title: Text('Shopping Cart (${items.length})'),
            actions: [
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
                            cart.clearCart();
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
                      children: List.generate(items.length, (index) {
                        final entry = items[index];
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
                              onDismissed: (_) => _removeItem(context, index),
                              child: _buildCartRow(context, entry, index),
                            ),
                          ],
                        );
                      }),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Coupon Code Input Card
                const AnimatedFadeSlide(
                  delay: Duration(milliseconds: 100),
                  child: CouponInputCard(),
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
                        if (couponDiscount > 0) ...[
                          const SizedBox(height: 6),
                          _buildSummaryRow(
                            'Coupon Discount (${cart.appliedCouponCode})',
                            '-₹${couponDiscount.toStringAsFixed(0)}',
                            isDiscount: true,
                          ),
                        ],
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
                                '₹${totalPayable.toStringAsFixed(0)}',
                                key: ValueKey<double>(totalPayable),
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
                    text: 'Proceed to Checkout (₹${totalPayable.toStringAsFixed(0)})',
                    isFullWidth: true,
                    onPressed: () => context.push('/checkout'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyCart(BuildContext context) {
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
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.mainText,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Explore medications, wellness essentials, and healthcare diagnostics.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.secondaryText,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            AppButton(
              text: 'Browse Medicines',
              onPressed: () => context.go('/home'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartRow(BuildContext context, CartItem entry, int index) {
    final cart = CartService.instance;
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: const Icon(Icons.medication_outlined,
                color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.mainText),
                ),
                Text(
                  '${entry.product.brand} • ${entry.product.packSize}',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      '₹${entry.product.sellingPrice.toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '₹${entry.product.mrp.toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.secondaryText,
                          decoration: TextDecoration.lineThrough),
                    ),
                  ],
                ),
              ],
            ),
          ),
          QuantitySelector(
            quantity: entry.quantity,
            onQuantityChanged: (newQty) {
              cart.updateQuantity(entry.product.id, newQty);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value,
      {bool isDiscount = false, bool isFree = false}) {
    Color valueColor = AppColors.mainText;
    if (isDiscount) valueColor = AppColors.secondary;
    if (isFree) valueColor = AppColors.success;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isDiscount || isFree ? FontWeight.bold : FontWeight.normal,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
