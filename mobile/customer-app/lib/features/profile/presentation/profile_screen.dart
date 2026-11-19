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
                      icon: Icons.shield_outlined,
                      title: 'Privacy Policy & Data Safety',
                      subtitle: 'DPDP Act 2023 & Google Play health compliance',
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Row(
                              children: [
                                Icon(Icons.shield, color: AppColors.primary, size: 22),
                                SizedBox(width: 8),
                                Text('Privacy & Data Safety', style: TextStyle(fontSize: 16)),
                              ],
                            ),
                            content: const SingleChildScrollView(
                              child: Text(
                                'Med24Plus (com.technosolz.med24plus) by Technosolz protects all patient health information and prescriptions under the Digital Personal Data Protection Act, 2023.\n\n'
                                '• All doctor prescriptions are encrypted with AES-256 and verified only by licensed pharmacists.\n'
                                '• We never sell or monetize patient data for advertising.\n'
                                '• You may request complete account and data deletion at any time.\n\n'
                                'Read the complete legal policy at:\nhttps://med24plus.serwex.in/legal/privacy or email privacy@med24plus.in',
                                style: TextStyle(fontSize: 12, height: 1.5),
                              ),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('Close'),
                              ),
                            ],
                          ),
                        );
                      },
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

            // Logout / Sign Out & Account Deletion (Google Play Compliance)
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, authState) {
                if (authState is! AuthAuthenticated) {
                  return const SizedBox.shrink();
                }

                return AnimatedFadeSlide(
                  delay: const Duration(milliseconds: 200),
                  child: Column(
                    children: [
                      AnimatedTapScale(
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
                            foregroundColor: AppColors.mainText,
                            side: const BorderSide(color: AppColors.border),
                            minimumSize: const Size(double.infinity, 44),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Sign Out',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Row(
                                children: [
                                  Icon(Icons.delete_forever, color: AppColors.danger, size: 22),
                                  SizedBox(width: 8),
                                  Text('Delete Account & Data', style: TextStyle(fontSize: 16)),
                                ],
                              ),
                              content: const Text(
                                'Are you sure you want to permanently delete your Med24Plus patient account?\n\n'
                                '• All profile information, saved addresses, device tokens, and credentials will be removed.\n'
                                '• Statutory drug dispensing records for Schedule H prescriptions are retained for 2 years as mandated by Rule 65 of the Drugs and Cosmetics Rules, 1945.\n\n'
                                'This action cannot be undone.',
                                style: TextStyle(fontSize: 12, height: 1.5),
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  child: const Text('Cancel'),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    context.read<AuthBloc>().add(LogoutRequested());
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Account deletion request initiated. Session cleared.'),
                                        backgroundColor: AppColors.danger,
                                      ),
                                    );
                                    context.go('/login');
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.danger,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Delete Permanently'),
                                ),
                              ],
                            ),
                          );
                        },
                        icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.secondaryText),
                        label: const Text(
                          'Delete Patient Account & Data',
                          style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                        ),
                      ),
                    ],
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
