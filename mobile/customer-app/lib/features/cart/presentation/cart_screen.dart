import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/quantity_selector.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

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

  Widget _buildCartRow(BuildContext context, CartItem entry, int index) {
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
                  CartService.instance.updateQuantity(entry.product.id, q);
                },
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _removeItem(context, index),
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
