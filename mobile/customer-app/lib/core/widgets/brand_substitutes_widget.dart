import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../mock/mock_data.dart';

class BrandSubstitutesWidget extends StatefulWidget {
  final List<BrandSubstituteOption> options;
  final ValueChanged<BrandSubstituteOption>? onOptionSelected;
  final String activeSalt;
  final String strength;

  const BrandSubstitutesWidget({
    super.key,
    required this.options,
    this.onOptionSelected,
    this.activeSalt = 'Azithromycin',
    this.strength = '500 mg',
  });

  @override
  State<BrandSubstitutesWidget> createState() => _BrandSubstitutesWidgetState();
}

class _BrandSubstitutesWidgetState extends State<BrandSubstitutesWidget> {
  late String _selectedOptionId;

  @override
  void initState() {
    super.initState();
    _selectedOptionId = widget.options.isNotEmpty
        ? widget.options.firstWhere((o) => o.isOriginal, orElse: () => widget.options.first).id
        : '';
  }

  void _handleSelect(BrandSubstituteOption option) {
    setState(() {
      _selectedOptionId = option.id;
    });
    widget.onOptionSelected?.call(option);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.options.isEmpty) return const SizedBox.shrink();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Icon + Title + Info Tooltip
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.secondaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.sync_alt_rounded,
                  color: AppColors.secondary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Compare Medicines (Generic Substitutes)',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                        letterSpacing: -0.2,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Same composition • Same strength • Verified by Pharmacist',
                      style: TextStyle(
                        fontSize: 10.5,
                        color: AppColors.secondaryText,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                icon: const Icon(
                  Icons.info_outline_rounded,
                  size: 18,
                  color: AppColors.secondaryText,
                ),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      title: const Text(
                        'What are Brand Substitutes?',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      content: const Text(
                        'Generic brand substitutes contain identical therapeutic molecules, active salt formulations, dosage form, and strength as prescribed, manufactured by licensed Indian pharmaceutical companies in accordance with the Drugs and Cosmetics Act.\n\nThey provide the exact same clinical benefits while helping you save up to 26%+ on your healthcare costs.',
                        style: TextStyle(fontSize: 12, height: 1.5),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text('Understood'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Option Cards List
          ...widget.options.map((option) {
            final isSelected = option.id == _selectedOptionId;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildOptionCard(option, isSelected),
            );
          }),

          const SizedBox(height: 4),

          // Salt & Strength Regulatory Info Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFBAE6FD)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_rounded, color: AppColors.primary, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(fontSize: 11, color: AppColors.mainText, height: 1.3),
                      children: [
                        const TextSpan(text: 'All these brands contain the same active salt ('),
                        TextSpan(
                          text: widget.activeSalt,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        TextSpan(text: ') with ${widget.strength} strength.'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'Know More >',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Trust Badges: Pharmacist Verified & Savings Guarantee
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.verified_user_rounded, color: AppColors.secondary, size: 18),
                      SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Trusted & Verified',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.mainText,
                              ),
                            ),
                            Text(
                              'By our licensed pharmacists',
                              style: TextStyle(
                                fontSize: 9.5,
                                color: AppColors.secondaryText,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.percent_rounded, color: AppColors.secondary, size: 18),
                      SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Save Upto 26%+',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.mainText,
                              ),
                            ),
                            Text(
                              'with Med24Plus',
                              style: TextStyle(
                                fontSize: 9.5,
                                color: AppColors.secondaryText,
                              ),
                            ),
                          ],
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

  Widget _buildOptionCard(BrandSubstituteOption option, bool isSelected) {
    return Container(
      decoration: BoxDecoration(
        color: isSelected ? AppColors.substituteActiveBg : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppColors.substituteActiveBorder : AppColors.border,
          width: isSelected ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Tag Bar (e.g. "Your Prescription", "Popular Choice", "Best Value")
          if (option.topTag != null)
            Padding(
              padding: const EdgeInsets.only(left: 12, top: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.secondary : AppColors.secondaryLight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      option.topTag!,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : AppColors.secondaryDark,
                      ),
                    ),
                  ),
                  if (isSelected)
                    Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: Container(
                        width: 18,
                        height: 18,
                        decoration: const BoxDecoration(
                          color: AppColors.secondary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 13,
                        ),
                      ),
                    ),
                ],
              ),
            ),

          // Main Row: Image + Details + Action / Badge
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Product Thumbnail box
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.medication_rounded,
                      size: 28,
                      color: isSelected ? AppColors.secondary : AppColors.secondaryText,
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Medicine Name, Generic, Price & Savings
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        option.name,
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.bold,
                          color: AppColors.mainText,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        option.genericName,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.secondaryText,
                        ),
                      ),
                      const SizedBox(height: 6),

                      Row(
                        children: [
                          Text(
                            '₹${option.sellingPrice.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.mainText,
                            ),
                          ),
                          if (option.savingsAmount > 0) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.savingsBadgeBg,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Save ₹${option.savingsAmount.toInt()} (${option.savingsPercent}%)',
                                style: const TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.savingsBadgeText,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                // Original Brand Badge or Select Button
                if (isSelected)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.savingsBadgeBg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      option.badge,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppColors.savingsBadgeText,
                      ),
                    ),
                  )
                else
                  OutlinedButton(
                    onPressed: () => _handleSelect(option),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary, width: 1.2),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      minimumSize: const Size(64, 32),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Select',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
