import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/models/membership_plan.dart';
import '../../../core/services/membership_service.dart';
import '../../../core/services/razorpay_payment_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/app_text_field.dart';

class MembershipPlansScreen extends StatefulWidget {
  const MembershipPlansScreen({super.key});

  @override
  State<MembershipPlansScreen> createState() => _MembershipPlansScreenState();
}

class _MembershipPlansScreenState extends State<MembershipPlansScreen> {
  List<MembershipPlan> _plans = [];
  bool _isLoading = true;
  String? _selectedPlanId;

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  Future<void> _loadPlans() async {
    setState(() => _isLoading = true);
    final plans = await MembershipService.instance.getActivePlans();
    if (mounted) {
      setState(() {
        _plans = plans;
        _isLoading = false;
        if (_plans.isNotEmpty && _selectedPlanId == null) {
          // Default selection to "Most Popular" or first plan
          final popular = _plans.firstWhere(
            (p) => p.badge?.toLowerCase().contains('popular') == true,
            orElse: () => _plans.first,
          );
          _selectedPlanId = popular.id;
        }
      });
    }
  }

  void _showSubscribeConfirmation(BuildContext context, MembershipPlan plan) {
    final emailController = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              16,
              20,
              MediaQuery.of(sheetContext).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: const Color(0xFFFDBA74), width: 1.2),
                        ),
                        child: const Center(
                          child: Icon(Icons.workspace_premium_rounded,
                              color: Color(0xFFD97706), size: 24),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              plan.name,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: AppColors.mainText,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${plan.durationMonths} Months Plan • ₹${plan.price.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: AppColors.border),
                  const SizedBox(height: 14),
                  const Text(
                    'Membership Benefits Included:',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.mainText,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildBenefitLine(
                      'Flat ${plan.medicineDiscountPercent}% OFF on all medicines & refills'),
                  _buildBenefitLine(
                      'Up to ${plan.diagnosticDiscountPercent}% OFF Diagnostic Lab Tests'),
                  if (plan.freeDelivery)
                    _buildBenefitLine('Zero Delivery Charges on all orders'),
                  if (plan.welcomeKit != null && plan.welcomeKit!.isNotEmpty)
                    _buildBenefitLine('Welcome Gift: ${plan.welcomeKit}'),
                  _buildBenefitLine(
                      '24/7 Dedicated Supervising Pharmacist support'),
                  const SizedBox(height: 14),

                  // Email input field for Certificate delivery
                  AppTextField(
                    label: 'Email Address for VIP Certificate',
                    hint: 'e.g. yourname@gmail.com',
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: const Icon(Icons.email_outlined, size: 18),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Your digital membership certificate and validity receipt will be delivered here.',
                    style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
                  ),
                  const SizedBox(height: 18),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Payable Amount',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.secondaryText,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Row(
                        children: [
                          if (plan.originalPrice > plan.price) ...[
                            Text(
                              '₹${plan.originalPrice.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.secondaryText,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                            const SizedBox(width: 6),
                          ],
                          Text(
                            '₹${plan.price.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Proceed to Razorpay Payment
                  AppButton(
                    text: 'Proceed to Pay with Razorpay',
                    isFullWidth: true,
                    onPressed: () async {
                      final email = emailController.text.trim();
                      Navigator.pop(sheetContext);

                      // 1. Show Connecting Dialog
                      showDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (_) => const Center(
                          child: Card(
                            child: Padding(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 24, vertical: 20),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircularProgressIndicator(
                                      color: AppColors.primary),
                                  SizedBox(width: 16),
                                  Text(
                                    'Connecting to Razorpay...',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );

                      // 2. Initialize Razorpay order on backend
                      final session = await MembershipService.instance
                          .createMembershipOrderSession(
                        planId: plan.id,
                        email: email,
                      );

                      if (context.mounted) {
                        Navigator.of(context, rootNavigator: true).pop();
                      }

                      if (session == null) {
                        if (context.mounted) {
                          AppSnackBar.showError(
                            context,
                            'Could not initialize Razorpay payment. Please try again.',
                          );
                        }
                        return;
                      }

                      if (!context.mounted) return;

                      Map<String, dynamic>? activatedMembership;

                      // 3. Launch Razorpay payment sheet
                      final success = await RazorpayPaymentService.instance
                          .startMembershipCheckout(
                        context: context,
                        session: session,
                        onVerifyPayment: ({
                          required String razorpayOrderId,
                          required String razorpayPaymentId,
                          required String razorpaySignature,
                        }) async {
                          final result = await MembershipService.instance
                              .verifyAndActivateMembership(
                            planId: plan.id,
                            razorpayOrderId: razorpayOrderId,
                            razorpayPaymentId: razorpayPaymentId,
                            razorpaySignature: razorpaySignature,
                            email: email,
                          );
                          if (result != null) {
                            activatedMembership = result;
                            return true;
                          }
                          return false;
                        },
                        onFailure: (err) {
                          if (context.mounted) {
                            AppSnackBar.showError(context, err);
                          }
                        },
                      );

                      if (success &&
                          context.mounted &&
                          activatedMembership != null) {
                        _showMembershipCertificateDialog(
                          context,
                          plan,
                          activatedMembership!,
                        );
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showMembershipCertificateDialog(
    BuildContext context,
    MembershipPlan plan,
    Map<String, dynamic> data,
  ) {
    final membershipNum =
        data['membership_number']?.toString() ?? 'MED24-VIP-ACTIVE';
    final startDate = data['start_date_formatted']?.toString() ?? 'Today';
    final endDate = data['end_date_formatted']?.toString() ?? '1 Year Later';
    final certSent = data['certificate_sent'] == true;
    final email = data['customer_email']?.toString() ?? '';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) {
        return Dialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          backgroundColor: Colors.white,
          insetPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top VIP Badge
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                    border:
                        Border.all(color: const Color(0xFFFBBF24), width: 1.5),
                  ),
                  child: const Center(
                    child: Icon(Icons.workspace_premium_rounded,
                        color: Color(0xFFD97706), size: 34),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'VIP Membership Activated!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppColors.mainText,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Your benefits are now live and applied to your account.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: AppColors.secondaryText,
                  ),
                ),
                const SizedBox(height: 18),

                // Digital Certificate Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border, width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            plan.name,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              '● ACTIVE',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF16A34A),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Divider(height: 1, color: AppColors.border),
                      const SizedBox(height: 8),
                      _buildCertRow('Certificate No:', membershipNum),
                      _buildCertRow('Valid From:', startDate),
                      _buildCertRow('Valid Until:', endDate),
                      _buildCertRow('Medicine Savings:',
                          '${plan.medicineDiscountPercent}% Flat OFF'),
                      _buildCertRow('Lab Diagnostics:',
                          '${plan.diagnosticDiscountPercent}% OFF'),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // Certificate Email Notice
                if (email.isNotEmpty)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: certSent
                          ? const Color(0xFFF0FDF4)
                          : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: certSent
                            ? const Color(0xFFBBF7D0)
                            : const Color(0xFFBFDBFE),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          certSent
                              ? Icons.mark_email_read_rounded
                              : Icons.email_outlined,
                          size: 16,
                          color: certSent
                              ? const Color(0xFF16A34A)
                              : AppColors.primary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            certSent
                                ? 'Certificate delivered to $email'
                                : 'Certificate queued for $email',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: certSent
                                  ? const Color(0xFF15803D)
                                  : AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 20),

                // Done Button
                AppButton(
                  text: 'Start Shopping with VIP Savings',
                  isFullWidth: true,
                  onPressed: () {
                    Navigator.pop(dialogCtx);
                    context.push('/products');
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCertRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.secondaryText)),
          Text(value,
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.mainText)),
        ],
      ),
    );
  }

  Widget _buildBenefitLine(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle_rounded,
              color: AppColors.success, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12.5,
                color: AppColors.mainText,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Med24Plus Membership'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.mainText,
        elevation: 0.5,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : RefreshIndicator(
              onRefresh: _loadPlans,
              color: AppColors.primary,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  // VIP Hero Header
                  _buildHeroHeader(),
                  const SizedBox(height: 20),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Choose Your Plan',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.mainText,
                          letterSpacing: -0.3,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${_plans.length} Available Plans',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Plans Cards
                  ..._plans.asMap().entries.map((entry) {
                    final index = entry.key;
                    final plan = entry.value;
                    final isSelected = plan.id == _selectedPlanId;
                    return AnimatedFadeSlide(
                      delay: Duration(milliseconds: index * 40),
                      child: _buildPlanCard(plan, isSelected),
                    );
                  }),

                  const SizedBox(height: 24),
                  // Trust & Guarantee Strip
                  _buildTrustStrip(),
                ],
              ),
            ),
    );
  }

  Widget _buildHeroHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF034E61),
            Color(0xFF06677F),
            Color(0xFF0D9488),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF034E61).withValues(alpha: 0.25),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFBBF24).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFFFBBF24).withValues(alpha: 0.5),
                          width: 1,
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.workspace_premium_rounded,
                              color: Color(0xFFFDE68A), size: 14),
                          SizedBox(width: 4),
                          Text(
                            'VIP Care Club',
                            style: TextStyle(
                              color: Color(0xFFFDE68A),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.stars_rounded,
                        color: Color(0xFFFDE68A), size: 28),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'More Savings. More Care.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Unlock higher discounts on medicines, zero delivery fees, and free home diagnostic checkup kits.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12.5,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildHeroBadge(
                        Icons.medication_rounded, 'Up to 30% OFF Meds'),
                    _buildHeroBadge(
                        Icons.biotech_rounded, '60% OFF Diagnostics'),
                    _buildHeroBadge(
                        Icons.delivery_dining_rounded, 'Free Delivery'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFF5EEAD4), size: 13),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(MembershipPlan plan, bool isSelected) {
    final isPopular = plan.badge?.toLowerCase().contains('popular') == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isSelected
              ? AppColors.primary
              : isPopular
                  ? const Color(0xFFF59E0B)
                  : AppColors.border,
          width: isSelected || isPopular ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: (isSelected ? AppColors.primary : Colors.black)
                .withValues(alpha: isSelected ? 0.08 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Header Bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.06)
                  : isPopular
                      ? const Color(0xFFFFFBEB)
                      : const Color(0xFFF8FAFC),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (plan.badge != null && plan.badge!.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isPopular
                                ? const Color(0xFFF59E0B)
                                : AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            plan.badge!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                      Text(
                        plan.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.mainText,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      children: [
                        if (plan.originalPrice > plan.price) ...[
                          Text(
                            '₹${plan.originalPrice.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.secondaryText,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          '₹${plan.price.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'for ${plan.durationMonths} Months',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.secondaryText,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Discount Highlights Badges
                Row(
                  children: [
                    _buildPillTag(
                      '${plan.medicineDiscountPercent}% OFF Meds',
                      const Color(0xFF0284C7),
                      const Color(0xFFE0F2FE),
                    ),
                    const SizedBox(width: 8),
                    _buildPillTag(
                      '${plan.diagnosticDiscountPercent}% OFF Labs',
                      const Color(0xFF0D9488),
                      const Color(0xFFCCFBF1),
                    ),
                    if (plan.freeDelivery) ...[
                      const SizedBox(width: 8),
                      _buildPillTag(
                        'Free Delivery',
                        const Color(0xFF16A34A),
                        const Color(0xFFDCFCE7),
                      ),
                    ],
                  ],
                ),

                // Welcome Kit
                if (plan.welcomeKit != null && plan.welcomeKit!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.card_giftcard_rounded,
                            color: Color(0xFFD97706), size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Kit: ${plan.welcomeKit}',
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 12),

                // Perks
                ...plan.perks.map((perk) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(top: 2),
                            child: Icon(Icons.check_rounded,
                                color: AppColors.success, size: 14),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              perk,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.mainText,
                                height: 1.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),

                const SizedBox(height: 14),
                // Action Button
                AnimatedTapScale(
                  onTap: () {
                    setState(() => _selectedPlanId = plan.id);
                    _showSubscribeConfirmation(context, plan);
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? const LinearGradient(
                              colors: [Color(0xFF034E61), Color(0xFF0A7B8E)],
                            )
                          : null,
                      color: isSelected ? null : AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.25),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            isSelected
                                ? 'Activate This Plan'
                                : 'Choose ${plan.name}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded,
                              color: Colors.white, size: 14),
                        ],
                      ),
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

  Widget _buildPillTag(String text, Color textCol, Color bgCol) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgCol,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textCol,
          fontSize: 10.5,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildTrustStrip() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: const Row(
        children: [
          Icon(Icons.verified_user_rounded, color: AppColors.primary, size: 28),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '100% Genuine Pharmacy Guarantee',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                    color: AppColors.mainText,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'All medications supervised by licensed registered pharmacists.',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.secondaryText,
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
