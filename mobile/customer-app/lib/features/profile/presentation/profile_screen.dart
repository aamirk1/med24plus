import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../auth/presentation/bloc/auth_bloc.dart';
import '../../auth/presentation/bloc/auth_event.dart';
import '../../auth/presentation/bloc/auth_state.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Patient Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Header Card
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, authState) {
                final user = authState is AuthAuthenticated ? authState.user : null;
                final name = user?.fullName ?? 'Patient Guest';
                final contact = user?.phone ?? user?.email ?? 'Sign in to access prescription records';
                final initial = (name.isNotEmpty ? name[0] : 'P').toUpperCase();

                return AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 50),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryLight,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              initial,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.mainText,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                contact,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.secondaryText,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (user == null)
                          TextButton(
                            onPressed: () => context.push('/login'),
                            child: const Text('Sign In', style: TextStyle(fontSize: 12)),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),

            // Profile Menu Options
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 100),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildMenuItem(
                      icon: Icons.receipt_long_outlined,
                      title: 'My Orders & Dispensing History',
                      subtitle: 'Track past orders and Form 20 cash memos',
                      onTap: () => context.push('/orders'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuItem(
                      icon: Icons.document_scanner_outlined,
                      title: 'Uploaded Prescriptions',
                      subtitle: 'Manage doctor prescriptions & approvals',
                      onTap: () => context.push('/prescription-upload'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuItem(
                      icon: Icons.location_on_outlined,
                      title: 'Saved Delivery Addresses',
                      subtitle: 'Manage home & work addresses',
                      onTap: () => context.push('/addresses'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuItem(
                      icon: Icons.notifications_none_outlined,
                      title: 'Prescription & Delivery Alerts',
                      subtitle: 'SMS, WhatsApp, and refill notifications',
                      onTap: () => context.push('/notifications'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Support & Legal Group
            AnimatedFadeSlide(
              delay: const Duration(milliseconds: 150),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _buildMenuItem(
                      icon: Icons.info_outline_rounded,
                      title: 'About Med24Plus Pharmacy',
                      subtitle: 'Drug license credentials & pharmacist oversight',
                      onTap: () => context.push('/about'),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    _buildMenuItem(
                      icon: Icons.headset_mic_outlined,
                      title: 'Helpline & Pharmacist Consultation',
                      subtitle: 'Contact duty pharmacist or report grievances',
                      onTap: () => context.push('/contact'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Logout / Sign Out
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, authState) {
                if (authState is! AuthAuthenticated) {
                  return const SizedBox.shrink();
                }

                return AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 200),
                  child: AnimatedTapScale(
                    onTap: () {
                      context.read<AuthBloc>().add(LogoutRequested());
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Logged out of Med24Plus.')),
                      );
                      context.go('/login');
                    },
                    child: OutlinedButton(
                      onPressed: () {
                        context.read<AuthBloc>().add(LogoutRequested());
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Logged out of Med24Plus.')),
                        );
                        context.go('/login');
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger,
                        side: const BorderSide(color: AppColors.danger),
                        minimumSize: const Size(double.infinity, 44),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Sign Out',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return AnimatedTapScale(
      onTap: onTap,
      scaleDown: 0.98,
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        title: Text(title,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.mainText)),
        subtitle: Text(subtitle,
            style: const TextStyle(fontSize: 10, color: AppColors.secondaryText)),
        trailing: const Icon(Icons.chevron_right,
            size: 18, color: AppColors.secondaryText),
        onTap: onTap,
      ),
    );
  }
}
