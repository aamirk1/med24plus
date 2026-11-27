import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/address_service.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/order_service.dart';
import '../../../core/services/razorpay_payment_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/coupon_input_card.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _selectedPayment = 'razorpay';
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
        const SnackBar(
          content: Text(
              'Delivery address is mandatory. Please add your address to proceed.'),
          backgroundColor: AppColors.error,
          duration: Duration(seconds: 4),
        ),
      );
      _showAddAddressSheet(context);
      return;
    }

    setState(() => _isPlacingOrder = true);

    final result = await OrderService.instance.createOrder(
      addressId: _selectedAddress!.id,
      paymentMethod: _selectedPayment == 'razorpay' ? 'razorpay' : 'cod',
      items: cart.items,
      couponCode: cart.appliedCouponCode,
      discountAmount: cart.couponDiscount,
    );

    setState(() => _isPlacingOrder = false);

    if (!mounted) return;

    if (!result.success || result.order == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.errorMessage ?? 'Failed to place order. Please try again.',
          ),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 4),
          action: result.isAuthError
              ? SnackBarAction(
                  label: 'Sign In',
                  textColor: Colors.white,
                  onPressed: () => context.push('/login'),
                )
              : null,
        ),
      );
      return;
    }

    final createdOrder = result.order!;

    // Handle Payment Modes
    if (_selectedPayment == 'razorpay') {
      await RazorpayPaymentService.instance.startCheckout(
        context: context,
        order: createdOrder,
        onSuccess: () {
          // Successfully paid: now clear cart and confirm order placement!
          cart.clearCart();
          _showConfirmationDialog(createdOrder, isPaid: true);
        },
        onFailure: (err) {
          // Payment not completed or cancelled: cart remains intact, order is not completed
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Payment was cancelled or unsuccessful. Order was not placed. You may retry payment or select Cash on Delivery.',
                ),
                backgroundColor: AppColors.error,
                duration: Duration(seconds: 4),
              ),
            );
          }
        },
      );
    } else {
      // Cash on Delivery
      cart.clearCart();
      _showConfirmationDialog(createdOrder, isPaid: false);
    }
  }

  void _showConfirmationDialog(MobileOrder order, {required bool isPaid}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.check_circle_rounded,
                color: AppColors.success, size: 24),
            const SizedBox(width: 8),
            Text(
              isPaid ? 'Order Confirmed & Paid!' : 'Order Placed (COD)',
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.mainText),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isPaid
                  ? 'Your medication order has been confirmed with secure Razorpay payment.'
                  : 'Your order has been registered for Cash on Delivery. Please keep exact cash ready.',
              style: const TextStyle(
                  fontSize: 12, height: 1.4, color: AppColors.secondaryText),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(8),
                border:
                    Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order Number: ${order.orderNumber}',
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryDark),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Total: ₹${order.totalAmount.toStringAsFixed(0)}',
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.secondaryText),
                  ),
                ],
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
            child: const Text('All Orders',
                style: TextStyle(color: AppColors.secondaryText)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              context.go('/order/${order.id}');
            },
            child: const Text('Track Order',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
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
                    const Icon(Icons.remove_shopping_cart_outlined,
                        size: 48, color: AppColors.secondaryText),
                    const SizedBox(height: 16),
                    const Text(
                      'Your cart is empty',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.mainText),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Add items to your cart before proceeding to checkout.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 12, color: AppColors.secondaryText),
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
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: AppColors.primary),
                            ),
                          )
                        : address != null
                            ? Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on,
                                              color: AppColors.primary,
                                              size: 18),
                                          const SizedBox(width: 6),
                                          Text(
                                            'Delivery to ${address.label}',
                                            style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.mainText),
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
                                          child: const Text('Change',
                                              style: TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.primary)),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    '${address.recipientName} • ${address.phone}',
                                    style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.mainText),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${address.addressLine}, ${address.city} - ${address.pincode}',
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.secondaryText),
                                  ),
                                ],
                              )
                            : Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                      color: const Color(0xFFFCA5A5)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Row(
                                      children: [
                                        Icon(Icons.location_off_outlined,
                                            color: AppColors.error, size: 20),
                                        SizedBox(width: 8),
                                        Text(
                                          'Delivery Address Required',
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.error),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    const Text(
                                      'A delivery address is mandatory before placing your order. Please add your address.',
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: AppColors.secondaryText),
                                    ),
                                    const SizedBox(height: 10),
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.primary,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                      ),
                                      onPressed: () =>
                                          _showAddAddressSheet(context),
                                      icon: const Icon(Icons.add_location_alt,
                                          size: 16),
                                      label: const Text('Add Address Now',
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
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
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.mainText),
                            ),
                            Text(
                              '${cart.items.length} items',
                              style: const TextStyle(
                                  fontSize: 11, color: AppColors.secondaryText),
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
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.mainText),
                                    ),
                                  ),
                                  Text(
                                    '₹${(item.product.sellingPrice * item.quantity).toStringAsFixed(0)}',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.mainText),
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
                        const Row(
                          children: [
                            Icon(Icons.payment,
                                size: 18, color: AppColors.primary),
                            SizedBox(width: 8),
                            Text(
                              'Select Payment Mode',
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.mainText),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildPaymentOption(
                          'razorpay',
                          'Razorpay Secure Gateway',
                          'UPI (Google Pay, PhonePe, Paytm), Cards & NetBanking',
                          Icons.shield_outlined,
                          isRecommended: true,
                        ),
                        const Divider(height: 16, color: AppColors.border),
                        _buildPaymentOption(
                          'COD',
                          'Cash on Delivery (COD)',
                          'Pay in cash upon doorstep delivery of medicines',
                          Icons.local_shipping_outlined,
                        ),
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
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.mainText),
                        ),
                        const SizedBox(height: 12),
                        _buildSummaryRow('Item Total (MRP)',
                            '₹${mrpTotal.toStringAsFixed(0)}'),
                        const SizedBox(height: 6),
                        _buildSummaryRow('Pharmacy Discount',
                            '-₹${savings.toStringAsFixed(0)}',
                            isDiscount: true),
                        if (couponDiscount > 0) ...[
                          const SizedBox(height: 6),
                          _buildSummaryRow(
                            'Coupon Savings (${cart.appliedCouponCode})',
                            '-₹${couponDiscount.toStringAsFixed(0)}',
                            isDiscount: true,
                          ),
                        ],
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
                                  FadeTransition(
                                      opacity: animation, child: child),
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

                // Place Order / Payment Gateway Button
                AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 300),
                  child: AppButton(
                    text: _isPlacingOrder
                        ? (_selectedPayment == 'cod'
                            ? 'Placing Order (COD)...'
                            : 'Initializing Secure Razorpay...')
                        : address == null
                            ? 'Add Delivery Address to Proceed'
                            : (_selectedPayment == 'cod'
                                ? 'Confirm & Place Order (COD)'
                                : 'Proceed to Pay with Razorpay (₹${totalPayable.toStringAsFixed(0)})'),
                    icon: address == null
                        ? const Icon(Icons.add_location_alt_outlined,
                            size: 18, color: Colors.white)
                        : null,
                    isFullWidth: true,
                    onPressed: _isPlacingOrder
                        ? null
                        : address == null
                            ? () => _showAddAddressSheet(context)
                            : _placeOrder,
                  ),
                ),
              ],
            ),
          ),
        );
      },
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
            fontWeight:
                isDiscount || isFree ? FontWeight.bold : FontWeight.normal,
            color: valueColor,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentOption(
    String value,
    String title,
    String subtitle,
    IconData icon, {
    bool isRecommended = false,
  }) {
    final isSelected = _selectedPayment == value;
    return AnimatedTapScale(
      onTap: () => setState(() => _selectedPayment = value),
      scaleDown: 0.98,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primaryLight.withValues(alpha: 0.35)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) =>
                    ScaleTransition(scale: animation, child: child),
                child: Icon(
                  isSelected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_off,
                  key: ValueKey<bool>(isSelected),
                  size: 18,
                  color:
                      isSelected ? AppColors.primary : AppColors.secondaryText,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Icon(icon,
                size: 20,
                color:
                    isSelected ? AppColors.primary : AppColors.secondaryText),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w500,
                          color: isSelected
                              ? AppColors.primaryDark
                              : AppColors.mainText,
                        ),
                      ),
                      if (isRecommended) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'RECOMMENDED',
                            style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF15803D)),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.secondaryText),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddAddressSheet(BuildContext context) {
    final nameCtrl = TextEditingController(text: 'Customer');
    final phoneCtrl = TextEditingController(text: '9876543210');
    final lineCtrl = TextEditingController(text: 'Flat 101, Sagar Darshan');
    final areaCtrl = TextEditingController(text: 'Bandra West');
    final pinCtrl = TextEditingController(text: '400050');
    String selectedType = 'Home';
    bool isDefault = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Add Mumbai Delivery Address',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ChoiceChip(
                      label: const Text('Home'),
                      selected: selectedType == 'Home',
                      onSelected: (val) {
                        if (val) setModalState(() => selectedType = 'Home');
                      },
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Office / Work'),
                      selected: selectedType == 'Office',
                      onSelected: (val) {
                        if (val) setModalState(() => selectedType = 'Office');
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Recipient Full Name',
                    border: OutlineInputBorder(),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: '10-Digit Mobile Number',
                    border: OutlineInputBorder(),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: lineCtrl,
                  decoration: const InputDecoration(
                    labelText: 'House / Flat / Building Name',
                    border: OutlineInputBorder(),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: areaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Street / Area / Locality (Mumbai)',
                    border: OutlineInputBorder(),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: pinCtrl,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: const InputDecoration(
                          labelText: 'PIN Code',
                          counterText: '',
                          border: OutlineInputBorder(),
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        initialValue: 'Mumbai',
                        enabled: false,
                        decoration: const InputDecoration(
                          labelText: 'City',
                          border: OutlineInputBorder(),
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        initialValue: 'Maharashtra',
                        enabled: false,
                        decoration: const InputDecoration(
                          labelText: 'State',
                          border: OutlineInputBorder(),
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Checkbox(
                      value: isDefault,
                      onChanged: (val) =>
                          setModalState(() => isDefault = val ?? true),
                    ),
                    const Text('Set as default delivery address',
                        style: TextStyle(fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    text: 'Save & Deliver Here',
                    onPressed: () async {
                      if (pinCtrl.text.trim().length != 6) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text(
                                  'Please enter a valid 6-digit Mumbai PIN code')),
                        );
                        return;
                      }
                      final fullAddressLine = areaCtrl.text.trim().isNotEmpty
                          ? '${lineCtrl.text.trim()}, ${areaCtrl.text.trim()}'
                          : lineCtrl.text.trim();

                      final newAddress = MobileAddress(
                        id: 'mumbai_${DateTime.now().millisecondsSinceEpoch}',
                        label: selectedType,
                        recipientName: nameCtrl.text.trim(),
                        phone: phoneCtrl.text.trim(),
                        addressLine: fullAddressLine,
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: pinCtrl.text.trim(),
                        isDefault: isDefault,
                      );

                      Navigator.pop(ctx);
                      await AddressService.instance.addAddress(newAddress);
                      await _loadAddresses();

                      if (!mounted) return;
                      setState(() {
                        _selectedAddress = newAddress;
                      });
                      ScaffoldMessenger.of(this.context).showSnackBar(
                        const SnackBar(
                          content: Text(
                              'Delivery address added successfully! You can now place your order.'),
                          backgroundColor: AppColors.primary,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
