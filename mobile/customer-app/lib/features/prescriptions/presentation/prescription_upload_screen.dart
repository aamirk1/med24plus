import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';

class PrescriptionUploadScreen extends StatefulWidget {
  const PrescriptionUploadScreen({super.key});

  @override
  State<PrescriptionUploadScreen> createState() =>
      _PrescriptionUploadScreenState();
}

class _PrescriptionUploadScreenState extends State<PrescriptionUploadScreen> {
  String? _selectedFileName;
  bool _isUploading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Upload Doctor Prescription'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Rule 65 Statutory Notice
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 50),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.shield_outlined,
                        color: AppColors.primary, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Drugs & Cosmetics Act, 1940 — Rule 65',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryDark),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'A valid digital image of a signed prescription issued by a Registered Medical Practitioner is legally required before Schedule H/H1 drugs can be dispensed.',
                            style: TextStyle(
                                fontSize: 10,
                                color: AppColors.primaryDark,
                                height: 1.4),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Upload Box Area
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 100),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border, width: 1.5),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.cloud_upload_outlined,
                        size: 32,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Select Prescription File',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.mainText),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Upload clear camera photos, JPEG, PNG, or PDF (Max 10MB)',
                      style:
                          TextStyle(fontSize: 11, color: AppColors.secondaryText),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedTapScale(
                          onTap: () {
                            setState(() => _selectedFileName =
                                'camera_photo_rx_${DateTime.now().millisecondsSinceEpoch}.jpg');
                          },
                          child: OutlinedButton.icon(
                            onPressed: () {
                              setState(() => _selectedFileName =
                                  'camera_photo_rx_${DateTime.now().millisecondsSinceEpoch}.jpg');
                            },
                            icon: const Icon(Icons.camera_alt_outlined, size: 16),
                            label: const Text('Camera',
                                style: TextStyle(fontSize: 12)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        AnimatedTapScale(
                          onTap: () {
                            setState(() => _selectedFileName =
                                'doctor_prescription_${DateTime.now().millisecondsSinceEpoch}.pdf');
                          },
                          child: OutlinedButton.icon(
                            onPressed: () {
                              setState(() => _selectedFileName =
                                  'doctor_prescription_${DateTime.now().millisecondsSinceEpoch}.pdf');
                            },
                            icon:
                                const Icon(Icons.photo_library_outlined, size: 16),
                            label: const Text('Gallery / PDF',
                                style: TextStyle(fontSize: 12)),
                          ),
                        ),
                      ],
                    ),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 250),
                      transitionBuilder: (child, animation) {
                        return FadeTransition(
                          opacity: animation,
                          child: SizeTransition(
                            sizeFactor: animation,
                            child: child,
                          ),
                        );
                      },
                      child: _selectedFileName == null
                          ? const SizedBox.shrink(key: ValueKey('empty_file'))
                          : Padding(
                              key: ValueKey(_selectedFileName),
                              padding: const EdgeInsets.only(top: 16),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AppColors.background,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.check_circle,
                                        color: AppColors.success, size: 16),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _selectedFileName!,
                                        style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.mainText),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.close,
                                          size: 16, color: AppColors.secondaryText),
                                      onPressed: () =>
                                          setState(() => _selectedFileName = null),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Prescription Guidelines List
            const AnimatedFadeSlide(
              delay: Duration(milliseconds: 140),
              child: Text(
                'Prescription Guidelines for Quick Approval:',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.mainText),
              ),
            ),
            const SizedBox(height: 10),
            _buildGuidelineItem(
                '1. Doctor name, qualification, and State Medical Council registration number are visible.',
                const Duration(milliseconds: 170)),
            _buildGuidelineItem(
                '2. Patient full name and date of consultation are legible.',
                const Duration(milliseconds: 200)),
            _buildGuidelineItem(
                '3. Medicine name, dosage, frequency, and duration are clearly written.',
                const Duration(milliseconds: 230)),
            _buildGuidelineItem(
                '4. Doctor official signature and clinic/hospital seal are present.',
                const Duration(milliseconds: 260)),
            const SizedBox(height: 28),

            // Submit Button
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 290),
              child: AppButton(
              text: 'Submit Prescription to Pharmacist',
              isFullWidth: true,
              isLoading: _isUploading,
              onPressed: _selectedFileName == null
                  ? null
                  : () async {
                      final router = GoRouter.of(context);
                      setState(() => _isUploading = true);
                      await Future.delayed(const Duration(milliseconds: 1200));
                      if (!context.mounted) return;
                      setState(() => _isUploading = false);
                      showDialog(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Row(
                            children: [
                              Icon(Icons.check_circle,
                                  color: AppColors.success),
                              SizedBox(width: 8),
                              Text('Rx Uploaded!',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold)),
                            ],
                          ),
                          content: const Text(
                            'Prescription token RX-2026-1183 generated. Our Registered Pharmacist will verify this within 15 minutes.',
                            style: TextStyle(fontSize: 12, height: 1.4),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () {
                                Navigator.of(ctx).pop();
                                router.pop();
                              },
                              child: const Text('Done',
                                  style: TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.bold)),
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

  Widget _buildGuidelineItem(String text, Duration delay) {
    return AnimatedFadeSlide(
      delay: delay,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.check_circle_outline,
                size: 14, color: AppColors.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.secondaryText, height: 1.3),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
