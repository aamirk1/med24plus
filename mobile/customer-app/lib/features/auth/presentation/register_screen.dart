import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_text_field.dart';
import 'bloc/auth_bloc.dart';
import 'bloc/auth_event.dart';
import 'bloc/auth_state.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _agreeTerms = true;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;
    final email = _emailController.text.trim();

    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the dispensing terms to continue'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (name.isEmpty || phone.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all mandatory fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (password.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password must be at least 8 characters long'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<AuthBloc>().add(
          RegisterRequested(
            fullName: name,
            phone: phone,
            password: password,
            confirmPassword: confirmPassword,
            email: email.isNotEmpty ? email : null,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Account verified & saved! Welcome, ${state.user.fullName ?? 'Patient'}!'),
              backgroundColor: AppColors.primary,
            ),
          );
          context.go('/home');
        } else if (state is AuthUnauthenticated && state.message != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message!),
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
            title: const Text('Create Patient Profile'),
            backgroundColor: Colors.transparent,
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AnimatedFadeSlide(
                    delay: Duration(milliseconds: 20),
                    child: Center(
                      child: AppLogo(
                        size: 64,
                        borderRadius: 16,
                        withShadow: true,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const AnimatedFadeSlide(
                    delay: Duration(milliseconds: 30),
                    child: Text(
                      'Register with Med24Plus',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const AnimatedFadeSlide(
                    delay: Duration(milliseconds: 60),
                    child: Text(
                      'Get verified prescription deliveries & doorstep refills',
                      style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
                    ),
                  ),
                  const SizedBox(height: 24),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 90),
                    child: AppTextField(
                      label: 'Full Patient Name *',
                      hint: 'e.g. Rahul Verma',
                      controller: _nameController,
                      prefixIcon: const Icon(Icons.person_outline, size: 18),
                    ),
                  ),
                  const SizedBox(height: 16),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 120),
                    child: AppTextField(
                      label: 'Mobile Number *',
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
                    delay: const Duration(milliseconds: 150),
                    child: AppTextField(
                      label: 'Email Address (Optional)',
                      hint: 'For GST cash memo delivery',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: const Icon(Icons.mail_outline, size: 18),
                    ),
                  ),
                  const SizedBox(height: 16),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 180),
                    child: AppTextField(
                      label: 'Create Password *',
                      hint: 'Min 8 chars, uppercase, digit & symbol',
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
                  const SizedBox(height: 16),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 210),
                    child: AppTextField(
                      label: 'Confirm Password *',
                      hint: 'Re-enter your password',
                      controller: _confirmPasswordController,
                      obscureText: _obscurePassword,
                      prefixIcon: const Icon(Icons.lock_outline, size: 18),
                    ),
                  ),
                  const SizedBox(height: 16),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 240),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Checkbox(
                          value: _agreeTerms,
                          onChanged: (val) => setState(() => _agreeTerms = val ?? true),
                          activeColor: AppColors.primary,
                        ),
                        const Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(top: 10),
                            child: Text(
                              'I agree to the Terms of Service & Drugs and Cosmetics Act Prescription Dispensing Policy.',
                              style: TextStyle(fontSize: 11, color: AppColors.secondaryText, height: 1.4),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 270),
                    child: AppButton(
                      text: isLoading ? 'Registering...' : 'Register Account',
                      isFullWidth: true,
                      isLoading: isLoading,
                      onPressed: isLoading ? null : _handleRegister,
                    ),
                  ),
                  const SizedBox(height: 16),

                  AnimatedFadeSlide(
                    delay: const Duration(milliseconds: 300),
                    child: Center(
                      child: TextButton(
                        onPressed: () => context.pop(),
                        child: const Text(
                          'Already have an account? Sign In',
                          style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                        ),
                      ),
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
