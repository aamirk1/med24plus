import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/app_logo.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('About Med24Plus'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  const AppLogo(
                    size: 72,
                    borderRadius: 18,
                    withShadow: true,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    AppStrings.appName,
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    AppStrings.appTagline,
                    style:
                        TextStyle(fontSize: 12, color: AppColors.secondaryText),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Med24Plus is a licensed single retail community pharmacy operating in India under the Drugs and Cosmetics Act, 1940 and Rules, 1945. All prescription medications are compounded, checked, and dispensed under the active supervision of Pharmacy Council of India registered pharmacists.',
                    style: TextStyle(
                        fontSize: 12,
                        color: AppColors.secondaryText,
                        height: 1.5),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Statutory License Credentials
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
                    'Statutory Drug Licensing Details',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText),
                  ),
                  const SizedBox(height: 12),
                  _buildLicRow('Form 20 Drug License', 'KA-BLR-20B-849201'),
                  _buildLicRow('Form 21 Drug License', 'KA-BLR-21B-849202'),
                  _buildLicRow('GSTIN', '29AABCM9482Q1Z8'),
                  _buildLicRow('FSSAI Food License', '11224334000192'),
                  _buildLicRow('Supervising Pharmacist',
                      'Ramesh Sharma (PCI-REG-94821)'),
                  _buildLicRow('Registered Pharmacy',
                      'Koramangala 4th Block, Bengaluru'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLicRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.secondaryText,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.mainText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
