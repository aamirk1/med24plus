import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
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
            Container(
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
                      TextButton(
                        onPressed: () => context.push('/addresses'),
                        child: const Text('Change', style: TextStyle(fontSize: 12, color: AppColors.primary)),
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
            const SizedBox(height: 16),

            // Prescription Verification Attachment Card
            Container(
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
                      Icon(Icons.receipt_long, color: AppColors.warning, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Prescription (Rule 65 Requirement)',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.description_outlined, color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'dr_prescription_nov2026.pdf',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.mainText),
                              ),
                              Text('Attached for pharmacist audit', style: TextStyle(fontSize: 10, color: AppColors.secondaryText)),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push('/prescription-upload'),
                          child: const Text('Re-upload', style: TextStyle(fontSize: 11, color: AppColors.primary)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Payment Mode Selection
            Container(
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
            const SizedBox(height: 24),

            // Place Order Button
            AppButton(
              text: 'Place Dispensing Order (₹1,155)',
              isFullWidth: true,
              onPressed: () {
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
                      'Your order has been queued for Registered Pharmacist review per Rule 65. Order Ref: MED-2026-8820.',
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
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentRadio(String value, String title) {
    final isSelected = _selectedPayment == value;
    return InkWell(
      onTap: () => setState(() => _selectedPayment = value),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              size: 18,
              color: isSelected ? AppColors.primary : AppColors.secondaryText,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(fontSize: 12, color: AppColors.mainText),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
