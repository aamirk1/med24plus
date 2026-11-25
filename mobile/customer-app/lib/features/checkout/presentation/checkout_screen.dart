import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/order_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _selectedPayment = 'UPI';

  @override
  Widget build(BuildContext context) {
    final address = MockData.addresses.first;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Checkout & Order'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Delivery Address Card
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 50),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.location_on, color: AppColors.primary, size: 18),
                            const SizedBox(width: 6),
                            Text(
                              'Delivery to ${address.label}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                            ),
                          ],
                        ),
                        AnimatedTapScale(
                          onTap: () => context.push('/addresses'),
                          child: TextButton(
                            onPressed: () => context.push('/addresses'),
                            child: const Text('Change', style: TextStyle(fontSize: 12, color: AppColors.primary)),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${address.recipientName} • ${address.phone}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.mainText),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${address.addressLine}, ${address.city} - ${address.pincode}',
                      style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Payment Mode Selection
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 150),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select Payment Mode',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                    ),
                    const SizedBox(height: 10),
                    _buildPaymentRadio('UPI', 'UPI / QR (Google Pay, PhonePe, Paytm)'),
                    const Divider(height: 1, color: AppColors.border),
                    _buildPaymentRadio('CARD', 'Credit / Debit Cards (Visa, Mastercard, RuPay)'),
                    const Divider(height: 1, color: AppColors.border),
                    _buildPaymentRadio('COD', 'Cash on Delivery (Verified Orders)'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Place Order Button
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 200),
              child: AppButton(
                text: 'Place Order (₹1,155)',
                isFullWidth: true,
                onPressed: () async {
                  await OrderService.instance.createOrder(
                    addressId: address.id,
                    paymentMethod: _selectedPayment,
                    items: CartService.instance.items,
                  );
                  CartService.instance.clearCart();
                  if (!context.mounted) return;
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Row(
                        children: [
                          Icon(Icons.check_circle, color: AppColors.success),
                          SizedBox(width: 8),
                          Text('Order Placed!', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      content: const Text(
                        'Your order has been placed successfully. Order Ref: MED-2026-8820.',
                        style: TextStyle(fontSize: 12, height: 1.4),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () {
                            Navigator.of(ctx).pop();
                            context.go('/orders');
                          },
                          child: const Text('View Orders', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentRadio(String value, String title) {
    final isSelected = _selectedPayment == value;
    return AnimatedTapScale(
      onTap: () => setState(() => _selectedPayment = value),
      scaleDown: 0.98,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight.withValues(alpha: 0.3) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
              child: Icon(
                isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                key: ValueKey<bool>(isSelected),
                size: 18,
                color: isSelected ? AppColors.primary : AppColors.secondaryText,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? AppColors.primaryDark : AppColors.mainText,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
