import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/address_service.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/order_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/coupon_input_card.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _selectedPayment = 'UPI';
  MobileAddress? _selectedAddress;
  bool _isLoadingAddresses = true;
  bool _isPlacingOrder = false;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoadingAddresses = true);
    final addrs = await AddressService.instance.getAddresses();
    if (mounted) {
      setState(() {
        if (addrs.isNotEmpty) {
          _selectedAddress = addrs.firstWhere(
            (a) => a.isDefault,
            orElse: () => addrs.first,
          );
        } else {
          _selectedAddress = null;
        }
        _isLoadingAddresses = false;
      });
    }
  }

  Future<void> _placeOrder() async {
    final cart = CartService.instance;
    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your cart is empty')),
      );
      return;
    }

    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or add a delivery address')),
      );
      return;
    }

    setState(() => _isPlacingOrder = true);

    final success = await OrderService.instance.createOrder(
      addressId: _selectedAddress!.id,
      paymentMethod: _selectedPayment,
      items: cart.items,
      couponCode: cart.appliedCouponCode,
      discountAmount: cart.couponDiscount,
    );

    setState(() => _isPlacingOrder = false);

    if (!mounted) return;

    if (success) {
      final orderRef = 'MED-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      cart.clearCart();

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: AppColors.success, size: 24),
              SizedBox(width: 8),
              Text(
                'Order Placed!',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.mainText),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Your medication order has been registered under statutory dispensing protocol.',
                style: TextStyle(fontSize: 12, height: 1.4, color: AppColors.secondaryText),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Order Ref: $orderRef',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                context.go('/orders');
              },
              child: const Text(
                'View Orders',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to place order. Please check your network and retry.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: CartService.instance,
      builder: (context, _) {
        final cart = CartService.instance;

        if (cart.isEmpty) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(title: const Text('Checkout')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.remove_shopping_cart_outlined, size: 48, color: AppColors.secondaryText),
                    const SizedBox(height: 16),
                    const Text(
                      'Your cart is empty',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.mainText),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Add items to your cart before proceeding to checkout.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                    ),
                    const SizedBox(height: 20),
                    AppButton(
                      text: 'Browse Medicines',
                      onPressed: () => context.go('/home'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final address = _selectedAddress;
        final mrpTotal = cart.mrpTotal;
        final savings = cart.savings;
        final couponDiscount = cart.couponDiscount;
        final totalPayable = cart.totalPayable;

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
                    child: _isLoadingAddresses
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            ),
                          )
                        : address != null
                            ? Column(
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
                                        onTap: () async {
                                          await context.push('/addresses');
                                          _loadAddresses();
                                        },
                                        child: TextButton(
                                          onPressed: () async {
                                            await context.push('/addresses');
                                            _loadAddresses();
                                          },
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
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.location_off_outlined, color: AppColors.warning, size: 20),
                                      SizedBox(width: 8),
                                      Text(
                                        'No Delivery Address',
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  const Text(
                                    'Please add a delivery address to complete your order.',
                                    style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
                                  ),
                                  const SizedBox(height: 10),
                                  OutlinedButton.icon(
                                    onPressed: () async {
                                      await context.push('/addresses');
                                      _loadAddresses();
                                    },
                                    icon: const Icon(Icons.add, size: 16),
                                    label: const Text('Add Address', style: TextStyle(fontSize: 12)),
                                  ),
                                ],
                              ),
                  ),
                ),
                const SizedBox(height: 16),

                // Order Items Summary Card
                AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 100),
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
                            const Text(
                              'Order Items',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                            ),
                            Text(
                              '${cart.items.length} items',
                              style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ...cart.items.map((item) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${item.product.name} (x${item.quantity})',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12, color: AppColors.mainText),
                                    ),
                                  ),
                                  Text(
                                    '₹${(item.product.sellingPrice * item.quantity).toStringAsFixed(0)}',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mainText),
                                  ),
                                ],
                              ),
                            )),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Coupon Code Entry & Offers
                const AnimatedFadeSlide(
                  delay: Duration(milliseconds: 150),
                  child: CouponInputCard(),
                ),
                const SizedBox(height: 16),

                // Payment Mode Selection
                AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 200),
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
                const SizedBox(height: 16),

                // Bill Breakdown Card
                AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 250),
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
                          'Payment Summary',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                        ),
                        const SizedBox(height: 12),
                        _buildSummaryRow('Item Total (MRP)', '₹${mrpTotal.toStringAsFixed(0)}'),
                        const SizedBox(height: 6),
                        _buildSummaryRow('Pharmacy Discount', '-₹${savings.toStringAsFixed(0)}', isDiscount: true),
                        if (couponDiscount > 0) ...[
                          const SizedBox(height: 6),
                          _buildSummaryRow(
                            'Coupon Savings (${cart.appliedCouponCode})',
                            '-₹${couponDiscount.toStringAsFixed(0)}',
                            isDiscount: true,
                          ),
                        ],
                        const SizedBox(height: 6),
                        _buildSummaryRow('Standard Home Delivery', 'FREE', isFree: true),
                        const Divider(height: 20, color: AppColors.border),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total Payable',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.mainText),
                            ),
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 250),
                              transitionBuilder: (child, animation) => FadeTransition(opacity: animation, child: child),
                              child: Text(
                                '₹${totalPayable.toStringAsFixed(0)}',
                                key: ValueKey<double>(totalPayable),
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Place Order Button
                AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 300),
                  child: AppButton(
                    text: _isPlacingOrder
                        ? 'Placing Order...'
                        : 'Place Order (₹${totalPayable.toStringAsFixed(0)})',
                    isFullWidth: true,
                    onPressed: (_isPlacingOrder || address == null) ? null : _placeOrder,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isDiscount = false, bool isFree = false}) {
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
