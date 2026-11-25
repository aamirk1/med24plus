import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/order_service.dart';
import '../../../core/services/razorpay_payment_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  MobileOrder? _order;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLiveOrder();
  }

  Future<void> _loadLiveOrder() async {
    setState(() => _isLoading = true);
    final live = await OrderService.instance.getOrderById(widget.orderId);
    if (mounted) {
      setState(() {
        _order = live;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Order Details'),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (_order == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Order Not Found'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.secondaryText),
                const SizedBox(height: 16),
                const Text(
                  'Order Not Found',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.mainText),
                ),
                const SizedBox(height: 8),
                const Text(
                  'The requested order could not be loaded.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 20),
                AppButton(
                  text: 'View All Orders',
                  onPressed: () => context.go('/orders'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final order = _order!;
    final itemsSubtotal = order.items.isNotEmpty
        ? order.items.fold<double>(0.0, (s, i) => s + (i.unitPrice * i.quantity))
        : order.totalAmount;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(order.orderNumber),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 50),
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          order.orderNumber,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.mainText),
                        ),
                        Row(
                          children: [
                            AppBadge.orderStatus(order.status),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: order.paymentStatus.toLowerCase() == 'paid'
                                    ? const Color(0xFFDCFCE7)
                                    : const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                order.paymentStatus.toLowerCase() == 'paid' ? 'PAID' : 'PAYMENT PENDING',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: order.paymentStatus.toLowerCase() == 'paid'
                                      ? const Color(0xFF15803D)
                                      : const Color(0xFFB45309),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Placed on ${order.date}',
                      style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Pay Now with Razorpay Card (if pending and not COD)
            if (order.paymentStatus.toLowerCase() != 'paid' &&
                order.paymentMethod.toLowerCase() != 'cod') ...[
              AnimatedFadeSlide(
                delay: const Duration(milliseconds: 75),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.shield_outlined, color: Color(0xFF1D4ED8), size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Complete Payment with Razorpay',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Your statutory dispensing order is reserved. Please complete the online payment via UPI, Card, or Net Banking to begin pharmacy packing.',
                        style: TextStyle(fontSize: 11, height: 1.4, color: Color(0xFF3B82F6)),
                      ),
                      const SizedBox(height: 12),
                      AppButton(
                        text: 'Pay Now with Razorpay (₹${order.totalAmount.toStringAsFixed(0)})',
                        isFullWidth: true,
                        onPressed: () async {
                          await RazorpayPaymentService.instance.startCheckout(
                            context: context,
                            order: order,
                            onSuccess: () => _loadLiveOrder(),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Delivery Protocol Card
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 100),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.ac_unit, color: AppColors.primary, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Cold-Chain Assured Delivery (2°C - 8°C)',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Insulated packaging with calibrated temperature data-loggers.',
                            style: TextStyle(fontSize: 10, color: AppColors.secondaryText),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Items List
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 150),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Dispensed Medicines',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                          ),
                          Text(
                            '${order.items.isNotEmpty ? order.items.length : order.itemCount} items',
                            style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    if (order.items.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          '${order.itemCount} statutory medicine item(s) in this order.',
                          style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                        ),
                      )
                    else
                      ...order.items.asMap().entries.map((entry) {
                        final idx = entry.key;
                        final item = entry.value;
                        return Column(
                          children: [
                            if (idx > 0) const Divider(height: 1, color: AppColors.border),
                            _buildItemRow(
                              item.productName,
                              'Batch: ${item.batchNumber} • Exp: ${item.expiryDate}',
                              'Qty: ${item.quantity}',
                              '₹${(item.unitPrice * item.quantity).toStringAsFixed(0)}',
                            ),
                          ],
                        );
                      }),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Bill Breakdown
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 200),
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
                    const Text('Payment Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText)),
                    const SizedBox(height: 10),
                    _buildBillRow('Item Subtotal', '₹${itemsSubtotal.toStringAsFixed(0)}'),
                    if (order.couponCode != null || order.discountAmount > 0) ...[
                      const SizedBox(height: 6),
                      _buildBillRow(
                        'Coupon Discount (${order.couponCode ?? "PROMO"})',
                        '-₹${order.discountAmount > 0 ? order.discountAmount.toStringAsFixed(0) : (itemsSubtotal - order.totalAmount).clamp(0.0, double.infinity).toStringAsFixed(0)}',
                        isDiscount: true,
                      ),
                    ],
                    const SizedBox(height: 6),
                    _buildBillRow('Delivery', 'FREE (Compliant Cold-Chain)'),
                    const SizedBox(height: 6),
                    _buildBillRow('Payment Mode', order.paymentMethod),
                    const SizedBox(height: 6),
                    _buildBillRow('Payment Status', order.paymentStatus.toUpperCase()),
                    const Divider(height: 20, color: AppColors.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Amount', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.mainText)),
                        Text(
                          '₹${order.totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemRow(String title, String batch, String qty, String price) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mainText)),
                const SizedBox(height: 2),
                Text(batch, style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(price, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.mainText)),
              Text(qty, style: const TextStyle(fontSize: 10, color: AppColors.secondaryText)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(String label, String value, {bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.secondaryText)),
        Text(
          value,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isDiscount ? FontWeight.bold : FontWeight.w500,
            color: isDiscount ? AppColors.secondary : AppColors.mainText,
          ),
        ),
      ],
    );
  }
}
