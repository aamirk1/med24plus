import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_text_field.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final TextEditingController _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Contact & Pharmacist Helpline'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Contact Information Card
            Container(
              padding: const EdgeInsets.all(16),
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
                      AppLogo(size: 28, borderRadius: 6),
                      SizedBox(width: 8),
                      Text(
                        'Direct Pharmacy Contacts',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildContactRow(Icons.phone_outlined, 'Emergency Pharmacist Helpline', '+91 22 2345 6789'),
                  const SizedBox(height: 10),
                  _buildContactRow(Icons.mail_outline, 'Customer Support & Rx Triage', 'care@med24plus.in'),
                  const SizedBox(height: 10),
                  _buildContactRow(
                    Icons.location_on_outlined,
                    'Physical Pharmacy Address',
                    'Plot 15, Bandra Kurla Complex (BKC), Bandra East, Mumbai, Maharashtra - 400051',
                  ),
                  const SizedBox(height: 10),
                  _buildContactRow(Icons.access_time_outlined, 'Operating Dispensing Hours', '24 Hours / 7 Days'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Message Form
            Container(
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
                    'Send Inquiry to Supervising Pharmacist',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    label: 'Your Message / Clinical Question',
                    hint: 'Ask about salt interactions, dosage, or order status...',
                    controller: _messageController,
                    maxLines: 4,
                  ),
                  const SizedBox(height: 16),
                  AppButton(
                    text: 'Send Message',
                    isFullWidth: true,
                    onPressed: () {
                      _messageController.clear();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Message delivered to Duty Pharmacist.')),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 10, color: AppColors.secondaryText)),
              Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.mainText)),
            ],
          ),
        ),
      ],
    );
  }
}

