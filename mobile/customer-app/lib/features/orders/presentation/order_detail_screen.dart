import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/order_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_badge.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late MobileOrder _order;

  @override
  void initState() {
    super.initState();
    _order = MockData.orders.firstWhere(
      (o) => o.id == widget.orderId,
      orElse: () => MockData.orders.first,
    );
    _loadLiveOrder();
  }

  Future<void> _loadLiveOrder() async {
    final live = await OrderService.instance.getOrderById(widget.orderId);
    if (mounted && live != null) {
      setState(() => _order = live);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;

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
                        AppBadge.orderStatus(order.status),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('Placed on ${order.date}', style: const TextStyle(fontSize: 11, color: AppColors.secondaryText)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // FEFO Dispensing Batch Notice
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 100),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: AppColors.primary, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Form 20 Statutory Retail Cash Memo generated. Verified by Registered Pharmacist (PCI-REG-94821).',
                        style: TextStyle(fontSize: 11, color: AppColors.primaryDark, height: 1.3),
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
                    const Padding(
                      padding: EdgeInsets.all(14),
                      child: Text(
                        'Dispensed Medicines',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                      ),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildItemRow(
                      'Accu-Chek Active Blood Glucose Strips',
                      'Batch: ACC-26-904 | Exp: Apr 2028',
                      'Qty: 1',
                      '₹945',
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildItemRow(
                      'Calcirol D3 60,000 IU Oral Solution',
                      'Batch: CAL-26-118 | Exp: Oct 2027',
                      'Qty: 2',
                      '₹210',
                    ),
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
                    _buildBillRow('Item Subtotal', '₹1,155'),
                    const SizedBox(height: 6),
                    _buildBillRow('Delivery', 'FREE (Compliant Cold-Chain)'),
                    const SizedBox(height: 6),
                    _buildBillRow('Payment Mode', order.paymentMethod),
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
                Text(qty, style: const TextStyle(fontSize: 10, color: AppColors.secondaryText)),
              ],
            ),
          ),
          Text(price, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText)),
        ],
      ),
    );
  }

  Widget _buildBillRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.secondaryText)),
        Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.mainText)),
      ],
    );
  }
}
