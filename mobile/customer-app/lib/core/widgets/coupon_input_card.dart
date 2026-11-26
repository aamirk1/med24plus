import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../services/cart_service.dart';
import 'animated_entry.dart';

class CouponInputCard extends StatefulWidget {
  final bool showSuggestions;

  const CouponInputCard({
    super.key,
    this.showSuggestions = true,
  });

  @override
  State<CouponInputCard> createState() => _CouponInputCardState();
}

class _CouponInputCardState extends State<CouponInputCard> {
  final TextEditingController _controller = TextEditingController();
  String? _errorMessage;
  bool _isApplying = false;

  @override
  void initState() {
    super.initState();
    CartService.instance.fetchActiveCoupons();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon(String code) async {
    if (code.trim().isEmpty) {
      setState(() => _errorMessage = 'Please enter a coupon code');
      return;
    }

    setState(() {
      _isApplying = true;
      _errorMessage = null;
    });

    FocusScope.of(context).unfocus();

    final result = await CartService.instance.applyCoupon(code);

    if (!mounted) return;

    setState(() {
      _isApplying = false;
      if (!result.isValid) {
        _errorMessage = result.message;
      } else {
        _errorMessage = null;
        _controller.clear();
      }
    });

    if (result.isValid) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded,
                  color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(result.message)),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
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
        final appliedCode = cart.appliedCouponCode;
        final discount = cart.couponDiscount;
        final desc = cart.couponDescription;
        final availableCoupons = cart.availableCoupons;

        return Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: appliedCode != null
                  ? AppColors.secondary.withValues(alpha: 0.5)
                  : AppColors.border,
              width: appliedCode != null ? 1.5 : 1.0,
            ),
            boxShadow: appliedCode != null
                ? [
                    BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.secondary.withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ).boxShadow!.first,
                  ]
                : null,
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: (appliedCode != null
                              ? AppColors.secondary
                              : AppColors.primary)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.local_offer_rounded,
                      size: 18,
                      color: appliedCode != null
                          ? AppColors.secondary
                          : AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    appliedCode != null ? 'Applied Coupon' : 'Coupons & Offers',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.mainText,
                    ),
                  ),
                  if (appliedCode != null) ...[
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.savingsBadgeBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'SAVED ₹${discount.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.savingsBadgeText,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),

              if (appliedCode != null) ...[
                // Applied Coupon Card
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.secondaryLight.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.secondary.withValues(alpha: 0.3),
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  appliedCode,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                    color: AppColors.secondaryDark,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(
                                  Icons.check_circle_rounded,
                                  size: 16,
                                  color: AppColors.success,
                                ),
                              ],
                            ),
                            if (desc != null && desc.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                desc,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.secondaryText,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      AnimatedTapScale(
                        onTap: () {
                          cart.removeCoupon();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Coupon removed'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                                color: AppColors.error.withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.close_rounded,
                                  size: 14, color: AppColors.error),
                              SizedBox(width: 4),
                              Text(
                                'Remove',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.error,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Input Row
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: _errorMessage != null
                                ? AppColors.error
                                : AppColors.border,
                          ),
                        ),
                        child: TextField(
                          controller: _controller,
                          textCapitalization: TextCapitalization.characters,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                            color: AppColors.mainText,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Enter coupon code',
                            hintStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.normal,
                              color: AppColors.secondaryText
                                  .withValues(alpha: 0.7),
                            ),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 12),
                            isDense: true,
                          ),
                          onSubmitted: _applyCoupon,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    AnimatedTapScale(
                      onTap: _isApplying
                          ? null
                          : () => _applyCoupon(_controller.text),
                      child: Container(
                        height: 44,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        alignment: Alignment.center,
                        child: _isApplying
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'APPLY',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.info_outline_rounded,
                          size: 14, color: AppColors.error),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ],
          ),
        );
      },
    );
  }
}
