import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/firebase_auth_service.dart';
import '../../../core/services/secure_storage_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_text_field.dart';
import 'bloc/auth_bloc.dart';
import 'bloc/auth_event.dart';
import 'bloc/auth_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController(text: '+919876543210');
  final TextEditingController _passwordController = TextEditingController(text: 'Password@123');
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _loadStoredCredentials();
  }

  Future<void> _loadStoredCredentials() async {
    final storage = SecureStorageService();
    final savedId = await storage.getSavedIdentifier();
    final savedPwd = await storage.getSavedPassword();
    if (mounted) {
      if (savedId != null && savedId.isNotEmpty) {
        setState(() {
          _phoneController.text = savedId;
        });
      }
      if (savedPwd != null && savedPwd.isNotEmpty) {
        setState(() {
          _passwordController.text = savedPwd;
        });
      }
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    final identifier = _phoneController.text.trim();
    final password = _passwordController.text;

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your mobile number and password'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<AuthBloc>().add(
          LoginRequested(identifier: identifier, password: password),
        );
  }

  void _showFirebasePhoneOtpSheet(BuildContext context) {
    final phoneController = TextEditingController(text: _phoneController.text);
    final otpController = TextEditingController();
    String? verificationId;
    bool isOtpSent = false;
    bool isSending = false;
    bool isVerifying = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (bottomSheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Firebase Phone OTP Sign-In',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.mainText,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.pop(bottomSheetContext),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Instant SMS verification without external SMS gateways',
                    style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                  ),
                  const SizedBox(height: 20),
                  AppTextField(
                    label: 'Mobile Number',
                    hint: '10-digit mobile number',
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    enabled: !isOtpSent,
                    prefixIcon: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Center(
                        widthFactor: 0.0,
                        child: Text(
                          '+91',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.mainText,
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (isOtpSent) ...[
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Firebase SMS Code',
                      hint: '6-digit OTP code',
                      controller: otpController,
                      keyboardType: TextInputType.number,
                      prefixIcon: const Icon(Icons.shield_outlined, size: 18),
                    ),
                  ],
                  const SizedBox(height: 20),
                  if (!isOtpSent)
                    AppButton(
                      text: isSending ? 'Sending SMS OTP...' : 'Send Firebase OTP',
                      isFullWidth: true,
                      isLoading: isSending,
                      onPressed: isSending
                          ? null
                          : () async {
                              final phone = phoneController.text.trim();
                              if (phone.isEmpty) return;
                              setSheetState(() => isSending = true);
                              await FirebaseAuthService().sendPhoneOtp(
                                phoneNumber: phone,
                                onCodeSent: (verId, resendToken) {
                                  setSheetState(() {
                                    verificationId = verId;
                                    isOtpSent = true;
                                    isSending = false;
                                  });
                                },
                                onError: (err) {
                                  setSheetState(() => isSending = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(err), backgroundColor: Colors.red),
                                  );
                                },
                              );
                            },
                    )
                  else
                    AppButton(
                      text: isVerifying ? 'Verifying...' : 'Verify & Sign In',
                      isFullWidth: true,
                      isLoading: isVerifying,
                      onPressed: isVerifying
                          ? null
                          : () async {
                              final code = otpController.text.trim();
                              if (code.isEmpty || verificationId == null) return;
                              setSheetState(() => isVerifying = true);
                              try {
                                final idToken = await FirebaseAuthService().verifyOtpAndGetIdToken(
                                  verificationId: verificationId!,
                                  smsCode: code,
                                );
                                if (context.mounted) {
                                  Navigator.pop(bottomSheetContext);
                                  context.read<AuthBloc>().add(
                                        FirebaseOtpLoginRequested(firebaseIdToken: idToken),
                                      );
                                }
                              } catch (e) {
                                setSheetState(() => isVerifying = false);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(e.toString().replaceFirst('Exception: ', '')),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              }
                            },
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Welcome back, ${state.user.fullName ?? 'Patient'}!'),
              backgroundColor: AppColors.primary,
            ),
          );
          context.go('/home');
        } else if (state is AuthFailure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.error),
              backgroundColor: Colors.red,
            ),
          );
        }
      },
      builder: (context, state) {
        final isLoading = state is AuthLoading;

        return Scaffold(
          backgroundColor: AppColors.surface,
          appBar: AppBar(
            title: const Text('Sign In'),
            backgroundColor: Colors.transparent,
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  const AnimatedFadeSlide(
                    delay: Duration(milliseconds: 20),
                    child: Center(
                      child: AppLogo.auth(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const AnimatedFadeSlide(
                    delay: Duration(milliseconds: 40),
                    child: Text(
                      'Welcome to ${AppStrings.appName}',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const AnimatedFadeSlide(
                    delay: Duration(milliseconds: 70),
                    child: Text(
                      'Access your prescription refills and chronic care orders',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 100),
                    child: AppTextField(
                      label: 'Mobile Number',
                      hint: '10-digit mobile number',
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      prefixIcon: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Center(
                          widthFactor: 0.0,
                          child: Text(
                            '+91',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.mainText,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 130),
                    child: AppTextField(
                      label: 'Password',
                      hint: 'Enter your password',
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      prefixIcon: const Icon(Icons.lock_outline, size: 18),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          size: 18,
                          color: AppColors.secondaryText,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 160),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        child: const Text(
                          'Forgot Password?',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 190),
                    child: AppButton(
                      text: isLoading ? 'Authenticating...' : 'Sign In with Password',
                      isFullWidth: true,
                      isLoading: isLoading,
                      onPressed: isLoading ? null : _handleLogin,
                    ),
                  ),
                  const SizedBox(height: 12),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 220),
                    child: AnimatedTapScale(
                      onTap: () => _showFirebasePhoneOtpSheet(context),
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          side: const BorderSide(color: AppColors.primary),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        icon: const Icon(Icons.phone_android_rounded, size: 18, color: AppColors.primary),
                        label: const Text(
                          'Sign In with Firebase Phone OTP',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                        onPressed: () => _showFirebasePhoneOtpSheet(context),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 250),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Don't have an account? ",
                          style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
                        ),
                        GestureDetector(
                          onTap: () => context.push('/register'),
                          child: const Text(
                            'Create Account',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
