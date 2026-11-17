import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import 'bloc/auth_bloc.dart';
import 'bloc/auth_event.dart';
import 'bloc/auth_state.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  bool _codeSent = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleSendCode() {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your registered mobile number'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<AuthBloc>().add(
          SendOtpRequested(target: phone, purpose: 'password_reset'),
        );
  }

  void _handleResetPassword() {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    final newPass = _newPasswordController.text;
    final confirmPass = _confirmPasswordController.text;

    if (otp.isEmpty || newPass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (newPass != confirmPass) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<AuthBloc>().add(
          PasswordResetRequested(
            identifier: phone,
            otpCode: otp,
            newPassword: newPass,
            confirmPassword: confirmPass,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is OtpSentState) {
          setState(() {
            _codeSent = true;
            if (state.devOtp != null) {
              _otpController.text = state.devOtp!;
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                state.devOtp != null
                    ? 'OTP sent! Dev code: ${state.devOtp}'
                    : 'Verification code dispatched to your mobile.',
              ),
              backgroundColor: AppColors.primary,
            ),
          );
        } else if (state is PasswordResetSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.primary,
            ),
          );
          context.pop();
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
            title: const Text('Reset Access'),
            backgroundColor: Colors.transparent,
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AnimatedFadeSlide(
                    delay: Duration(milliseconds: 40),
                    child: Text(
                      'Forgot Your Password?',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 70),
                    child: Text(
                      !_codeSent
                          ? 'Enter your registered 10-digit mobile number. We will send a secure verification code.'
                          : 'Enter the verification OTP and set your new password.',
                      style: const TextStyle(fontSize: 13, color: AppColors.secondaryText, height: 1.4),
                    ),
                  ),
                  const SizedBox(height: 32),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 100),
                    child: AppTextField(
                      label: 'Registered Mobile Number',
                      hint: '10-digit mobile number',
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      readOnly: _codeSent,
                      prefixIcon: const Icon(Icons.phone_outlined, size: 18),
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (_codeSent) ...[
                    AnimatedFadeSlide(
                      delay: const Duration(milliseconds: 60),
                      child: AppTextField(
                        label: 'Verification OTP Code',
                        hint: '6-digit code',
                        controller: _otpController,
                        keyboardType: TextInputType.number,
                        prefixIcon: const Icon(Icons.security_outlined, size: 18),
                      ),
                    ),
                    const SizedBox(height: 16),

                    AnimatedFadeSlide(
                      delay: const Duration(milliseconds: 90),
                      child: AppTextField(
                        label: 'New Password',
                        hint: 'At least 8 chars',
                        controller: _newPasswordController,
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
                    const SizedBox(height: 16),

                    AnimatedFadeSlide(
                      delay: const Duration(milliseconds: 120),
                      child: AppTextField(
                        label: 'Confirm New Password',
                        hint: 'Re-enter password',
                        controller: _confirmPasswordController,
                        obscureText: _obscurePassword,
                        prefixIcon: const Icon(Icons.lock_outline, size: 18),
                      ),
                    ),
                    const SizedBox(height: 24),

                    AnimatedFadeSlide(
                      delay: const Duration(milliseconds: 150),
                      child: AppButton(
                        text: isLoading ? 'Resetting Password...' : 'Confirm & Reset Password',
                        isFullWidth: true,
                        isLoading: isLoading,
                        onPressed: isLoading ? null : _handleResetPassword,
                      ),
                    ),
                  ] else ...[
                    AnimatedFadeSlide(
                      delay: const Duration(milliseconds: 130),
                      child: AppButton(
                        text: isLoading ? 'Dispatching OTP...' : 'Send Reset Code',
                        isFullWidth: true,
                        isLoading: isLoading,
                        onPressed: isLoading ? null : _handleSendCode,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
