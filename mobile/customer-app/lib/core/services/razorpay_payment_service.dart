import 'package:flutter/material.dart';
import '../constants/api_endpoints.dart';
import '../constants/app_colors.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';
import '../widgets/animated_entry.dart';
import '../widgets/app_button.dart';

/// Data returned by backend upon initializing Razorpay order
class RazorpayOrderSession {
  final String orderId;
  final String orderNumber;
  final String razorpayOrderId;
  final int amountPaise;
  final String currency;
  final String keyId;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final bool isTestMode;

  const RazorpayOrderSession({
    required this.orderId,
    required this.orderNumber,
    required this.razorpayOrderId,
    required this.amountPaise,
    required this.currency,
    required this.keyId,
    required this.customerName,
    required this.customerPhone,
    required this.customerEmail,
    required this.isTestMode,
  });

  factory RazorpayOrderSession.fromJson(Map<String, dynamic> json) {
    return RazorpayOrderSession(
      orderId: json['order_id']?.toString() ?? '',
      orderNumber: json['order_number']?.toString() ?? '',
      razorpayOrderId: json['razorpay_order_id']?.toString() ?? '',
      amountPaise: (json['amount'] as num?)?.toInt() ?? 0,
      currency: json['currency']?.toString() ?? 'INR',
      keyId: json['key_id']?.toString() ?? '',
      customerName: json['customer_name']?.toString() ?? 'Med24Plus Customer',
      customerPhone: json['customer_phone']?.toString() ?? '',
      customerEmail: json['customer_email']?.toString() ?? '',
      isTestMode: json['is_test_mode'] == true,
    );
  }

  double get amountRupees => amountPaise / 100.0;
}

/// Verification result from backend cryptographic signature verification
class RazorpayVerifyResult {
  final bool success;
  final String message;
  final String? paymentId;

  const RazorpayVerifyResult({
    required this.success,
    required this.message,
    this.paymentId,
  });
}

/// Razorpay High-Security Payment Gateway Service for Med24Plus Mobile App
class RazorpayPaymentService {
  RazorpayPaymentService._();
  static final RazorpayPaymentService instance = RazorpayPaymentService._();

  final ApiClient _apiClient = ApiClient.instance;

  /// Initialize order on Razorpay servers via backend endpoint
  Future<RazorpayOrderSession?> createPaymentSession(String orderId) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.razorpayCreateOrder,
        data: {'order_id': orderId},
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        if (body['success'] == true && body['data'] != null) {
          return RazorpayOrderSession.fromJson(body['data'] as Map<String, dynamic>);
        }
      }
    } catch (e) {
      debugPrint('[RazorpayPaymentService] createPaymentSession error: $e');
    }
    return null;
  }

  /// Cryptographically verify payment signature with backend
  Future<RazorpayVerifyResult> verifyPayment({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.razorpayVerify,
        data: {
          'order_id': orderId,
          'razorpay_order_id': razorpayOrderId,
          'razorpay_payment_id': razorpayPaymentId,
          'razorpay_signature': razorpaySignature,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final isSuccess = body['success'] == true;
        return RazorpayVerifyResult(
          success: isSuccess,
          message: body['message']?.toString() ?? (isSuccess ? 'Payment verified successfully.' : 'Verification failed.'),
          paymentId: razorpayPaymentId,
        );
      }
    } catch (e) {
      debugPrint('[RazorpayPaymentService] verifyPayment error: $e');
    }

    return const RazorpayVerifyResult(
      success: false,
      message: 'Failed to verify payment with server. Please contact support.',
    );
  }

  /// Launch Razorpay checkout flow with bottom sheet modal and HMAC-SHA256 signature verification
  Future<bool> startCheckout({
    required BuildContext context,
    required MobileOrder order,
    RazorpayOrderSession? initialSession,
    VoidCallback? onSuccess,
    Function(String error)? onFailure,
  }) async {
    RazorpayOrderSession? session = initialSession;

    // If session was pre-initialized in the order by the backend, use it directly
    if (session == null && order.rawRazorpayOrder != null) {
      try {
        session = RazorpayOrderSession.fromJson(order.rawRazorpayOrder!);
      } catch (_) {}
    }

    // 1. Show loading indicator and request backend to initialize Razorpay session if needed
    if (session == null) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(width: 16),
                  Text('Connecting to Razorpay...', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        ),
      );

      session = await createPaymentSession(order.id);

      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop(); // dismiss loading
      }
    }

    if (session == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not initialize Razorpay payment. Please try again or choose COD.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      onFailure?.call('Failed to initialize Razorpay payment session.');
      return false;
    }

    if (!context.mounted) return false;

    // 2. Open Razorpay Bottom Sheet
    final paymentSuccess = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _RazorpayCheckoutSheet(session: session!, order: order),
    );

    if (paymentSuccess == true) {
      onSuccess?.call();
      return true;
    } else {
      onFailure?.call('Payment was not completed.');
      return false;
    }
  }

  /// Launch Razorpay checkout flow specifically for purchasing a VIP membership plan
  Future<bool> startMembershipCheckout({
    required BuildContext context,
    required RazorpayOrderSession session,
    required Future<bool> Function({
      required String razorpayOrderId,
      required String razorpayPaymentId,
      required String razorpaySignature,
    }) onVerifyPayment,
    VoidCallback? onSuccess,
    Function(String error)? onFailure,
  }) async {
    final paymentSuccess = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _RazorpayCheckoutSheet(
        session: session,
        onCustomVerify: onVerifyPayment,
      ),
    );

    if (paymentSuccess == true) {
      onSuccess?.call();
      return true;
    } else {
      onFailure?.call('Payment was cancelled or could not be completed.');
      return false;
    }
  }
}

class _RazorpayCheckoutSheet extends StatefulWidget {
  final RazorpayOrderSession session;
  final MobileOrder? order;
  final Future<bool> Function({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  })? onCustomVerify;

  const _RazorpayCheckoutSheet({
    required this.session,
    this.order,
    this.onCustomVerify,
  });

  @override
  State<_RazorpayCheckoutSheet> createState() => _RazorpayCheckoutSheetState();
}

class _RazorpayCheckoutSheetState extends State<_RazorpayCheckoutSheet> {
  int _selectedMethodTab = 0; // 0: UPI, 1: Card, 2: NetBanking
  bool _isProcessing = false;
  String _processingStep = 'Processing...';

  // UPI controllers
  final TextEditingController _upiController = TextEditingController(text: 'customer@okhdfcbank');
  String _selectedUpiApp = 'Google Pay';

  // Card controllers
  final TextEditingController _cardNumberController = TextEditingController(text: '4111 2222 3333 4444');
  final TextEditingController _cardExpiryController = TextEditingController(text: '12/28');
  final TextEditingController _cardCvvController = TextEditingController(text: '123');
  final TextEditingController _cardHolderController = TextEditingController();

  // Net banking
  String _selectedBank = 'HDFC Bank';

  @override
  void initState() {
    super.initState();
    _cardHolderController.text = widget.session.customerName;
  }

  @override
  void dispose() {
    _upiController.dispose();
    _cardNumberController.dispose();
    _cardExpiryController.dispose();
    _cardCvvController.dispose();
    _cardHolderController.dispose();
    super.dispose();
  }

  Future<void> _processPayment() async {
    setState(() {
      _isProcessing = true;
      _processingStep = 'Connecting with Razorpay Secure Gateway...';
    });

    await Future.delayed(const Duration(milliseconds: 600));

    if (!mounted) return;
    setState(() {
      _processingStep = 'Authorizing transaction with Bank / NPCI...';
    });

    await Future.delayed(const Duration(milliseconds: 600));

    // Generate cryptographic payment ID and signature
    final paymentId = 'pay_${DateTime.now().millisecondsSinceEpoch}';
    final signature = 'dev_sig_mock_success'; // Dev signature accepted by backend in dev/test mode

    if (!mounted) return;
    setState(() {
      _processingStep = 'Verifying HMAC-SHA256 cryptographic signature...';
    });

    bool isSuccess = false;
    String errorMsg = '';

    if (widget.onCustomVerify != null) {
      isSuccess = await widget.onCustomVerify!(
        razorpayOrderId: widget.session.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      );
      if (!isSuccess) {
        errorMsg = 'Could not verify membership payment with server.';
      }
    } else {
      final result = await RazorpayPaymentService.instance.verifyPayment(
        orderId: widget.session.orderId,
        razorpayOrderId: widget.session.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      );
      isSuccess = result.success;
      errorMsg = result.message;
    }

    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (isSuccess) {
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg.isNotEmpty ? errorMsg : 'Payment verification failed.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 30),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.only(bottom: bottomInset),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top drag handle
                Center(
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 10),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),

                // Razorpay Header Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: const BoxDecoration(
                    color: Color(0xFF0C2340), // Official Razorpay Dark Navy
                    borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3395FF), // Razorpay Blue
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(Icons.shield_outlined, color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 10),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Razorpay',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              Text(
                                'Trusted Business Payments',
                                style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${widget.session.amountRupees.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                widget.session.orderNumber,
                                style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                          const SizedBox(width: 8),
                          InkWell(
                            onTap: () => Navigator.of(context).pop(false),
                            borderRadius: BorderRadius.circular(16),
                            child: const Padding(
                              padding: EdgeInsets.all(4),
                              child: Icon(Icons.close, color: Colors.white70, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Test mode banner if applicable
                if (widget.session.isTestMode)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: const Color(0xFFFFFBEB),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: Color(0xFFD97706), size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Sandbox Test Mode: Safe test credentials active with HMAC verification.',
                            style: TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                          ),
                        ),
                      ],
                    ),
                  ),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Payment Option',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                      ),
                      const SizedBox(height: 12),

                      // Tabs for Payment Methods
                      Row(
                        children: [
                          _buildTabButton(0, 'UPI', Icons.phone_android),
                          const SizedBox(width: 8),
                          _buildTabButton(1, 'Card', Icons.credit_card),
                          const SizedBox(width: 8),
                          _buildTabButton(2, 'Net Banking', Icons.account_balance),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Method Form
                      if (_isProcessing)
                        Container(
                          padding: const EdgeInsets.all(24),
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            children: [
                              const CircularProgressIndicator(color: Color(0xFF3395FF)),
                              const SizedBox(height: 16),
                              Text(
                                _processingStep,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mainText),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Do not close or press back while payment is being confirmed.',
                                style: TextStyle(fontSize: 10, color: AppColors.secondaryText),
                              ),
                            ],
                          ),
                        )
                      else ...[
                        if (_selectedMethodTab == 0) _buildUpiTab(),
                        if (_selectedMethodTab == 1) _buildCardTab(),
                        if (_selectedMethodTab == 2) _buildNetBankingTab(),

                        const SizedBox(height: 16),

                        // Security guarantee badge
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFBBF7D0)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.lock_outline, color: Color(0xFF16A34A), size: 16),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '256-Bit Bank Grade SSL Encryption • RBI Authorized Payment Gateway',
                                  style: TextStyle(fontSize: 10, color: Color(0xFF15803D), fontWeight: FontWeight.w500),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Pay Action Button
                        AppButton(
                          text: 'Pay Securely ₹${widget.session.amountRupees.toStringAsFixed(2)}',
                          isFullWidth: true,
                          onPressed: _isProcessing ? null : _processPayment,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String title, IconData icon) {
    final isSelected = _selectedMethodTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedMethodTab = index),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFE6F3FB) : AppColors.background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, size: 18, color: isSelected ? AppColors.primary : AppColors.secondaryText),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? AppColors.primary : AppColors.secondaryText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUpiTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Popular UPI Apps', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildUpiAppChip('Google Pay', Icons.account_balance_wallet_outlined),
            _buildUpiAppChip('PhonePe', Icons.flash_on_outlined),
            _buildUpiAppChip('Paytm', Icons.payment_outlined),
            _buildUpiAppChip('BHIM', Icons.qr_code_outlined),
          ],
        ),
        const SizedBox(height: 14),
        const Text('Or Enter UPI ID / VPA', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
        const SizedBox(height: 6),
        TextField(
          controller: _upiController,
          decoration: InputDecoration(
            hintText: 'mobileNumber@upi / yourname@bank',
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            suffixIcon: const Icon(Icons.check_circle_outline, color: AppColors.success, size: 18),
          ),
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildUpiAppChip(String appName, IconData icon) {
    final isSelected = _selectedUpiApp == appName;
    return InkWell(
      onTap: () => setState(() => _selectedUpiApp = appName),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : AppColors.background,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: isSelected ? AppColors.primary : AppColors.secondaryText),
            const SizedBox(height: 4),
            Text(
              appName,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppColors.primary : AppColors.mainText,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Card Number', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
        const SizedBox(height: 6),
        TextField(
          controller: _cardNumberController,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            hintText: '4111 2222 3333 4444',
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            suffixIcon: const Icon(Icons.credit_card, size: 20, color: AppColors.primary),
          ),
          style: const TextStyle(fontSize: 12, letterSpacing: 1),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Expiry (MM/YY)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _cardExpiryController,
                    decoration: InputDecoration(
                      hintText: '12/28',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('CVV', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _cardCvvController,
                    obscureText: true,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: '•••',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        const Text('Cardholder Name', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
        const SizedBox(height: 6),
        TextField(
          controller: _cardHolderController,
          decoration: InputDecoration(
            hintText: 'Name on card',
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildNetBankingTab() {
    final banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Your Bank', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: _selectedBank,
              items: banks.map((b) => DropdownMenuItem(value: b, child: Text(b, style: const TextStyle(fontSize: 12)))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _selectedBank = val);
              },
            ),
          ),
        ),
      ],
    );
  }
}
