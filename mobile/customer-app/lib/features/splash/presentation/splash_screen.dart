import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/secure_storage_service.dart';
import '../../auth/presentation/bloc/auth_bloc.dart';
import '../../auth/presentation/bloc/auth_state.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final AnimationController _introController;
  late final AnimationController _progressController;

  late final Animation<double> _iconScale;
  late final Animation<double> _iconFade;
  late final Animation<Offset> _titleSlide;
  late final Animation<double> _titleFade;
  late final Animation<Offset> _taglineSlide;
  late final Animation<double> _taglineFade;
  late final Animation<double> _badgeFade;

  String _statusMessage = 'Securing encrypted channel...';
  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();

    // 1. Continuous breathing pulse animation for ambient glow rings
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    // 2. Choreographed entrance sequence (1800ms)
    _introController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    // Icon scale & fade with snappy spring curve
    _iconScale = Tween<double>(begin: 0.2, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.0, 0.55, curve: Curves.easeOutBack),
      ),
    );
    _iconFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.0, 0.40, curve: Curves.easeIn),
      ),
    );

    // Title entrance
    _titleSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.35),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.35, 0.70, curve: Curves.easeOutCubic),
      ),
    );
    _titleFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.35, 0.65, curve: Curves.easeIn),
      ),
    );

    // Tagline entrance
    _taglineSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.35),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.50, 0.85, curve: Curves.easeOutCubic),
      ),
    );
    _taglineFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.50, 0.80, curve: Curves.easeIn),
      ),
    );

    // Pharmacy credential badge
    _badgeFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.65, 1.0, curve: Curves.easeIn),
      ),
    );

    // 3. Status capsule progress controller
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..forward();

    // Start intro sequence
    _introController.forward();

    // Check credentials and navigate after smooth splash presentation
    _initiateSessionCheckAndNavigate();
  }

  Future<void> _initiateSessionCheckAndNavigate() async {
    // Stage 1 status update
    await Future.delayed(const Duration(milliseconds: 700));
    if (mounted) {
      setState(() {
        _statusMessage = 'Checking verified pharmacy credentials...';
      });
    }

    // Check flutter_secure_storage for saved session or credentials
    final secureStorage = SecureStorageService();
    final hasSession = await secureStorage.hasValidSession();
    final hasSavedCreds = await secureStorage.hasSavedCredentials();
    final savedId = await secureStorage.getSavedIdentifier();

    // Stage 2 status update
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() {
        if (hasSession || hasSavedCreds) {
          _statusMessage = savedId != null
              ? 'Welcome back, $savedId'
              : 'Session verified. Welcome back!';
        } else {
          _statusMessage = 'Welcome to Med24Plus Healthcare';
        }
      });
    }

    // Ensure full animation duration for delightful user experience
    await Future.delayed(const Duration(milliseconds: 900));

    if (mounted && !_hasNavigated) {
      _hasNavigated = true;
      try {
        context.go('/home');
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _introController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated && mounted) {
          setState(() {
            _statusMessage = 'Welcome back, ${state.user.fullName ?? 'Patient'}!';
          });
        }
      },
      child: Scaffold(
        body: Stack(
          children: [
            // 1. Serene Dark Emerald Healthcare Mesh Gradient
            Container(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0.0, -0.2),
                  radius: 1.3,
                  colors: [
                    Color(0xFF0A5C43), // Rich emerald teal
                    Color(0xFF063E2D), // Deep forest medicine
                    Color(0xFF032219), // Midnight pharmacy dark
                  ],
                ),
              ),
            ),

            // 2. Ambient Floating Glowing Orbs (Pulse Animated)
            AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                final pulse = _pulseController.value;
                return Stack(
                  children: [
                    // Top ambient blur orb
                    Positioned(
                      top: -60 + (pulse * 15),
                      right: -40,
                      child: Container(
                        width: 260,
                        height: 260,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF10B981).withOpacity(0.12 + (pulse * 0.06)),
                        ),
                      ),
                    ),
                    // Bottom ambient blur orb
                    Positioned(
                      bottom: -80 - (pulse * 15),
                      left: -60,
                      child: Container(
                        width: 300,
                        height: 300,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF047857).withOpacity(0.18 + (pulse * 0.05)),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),

            // 3. Central Brand Composition
            SafeArea(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Spacer(flex: 3),

                      // Animated Pulse Rings & Hero App Icon
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          final pulse = _pulseController.value;
                          return Stack(
                            alignment: Alignment.center,
                            children: [
                              // Outer expanding pulse ring
                              Container(
                                width: 140 + (pulse * 24),
                                height: 140 + (pulse * 24),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: const Color(0xFF34D399)
                                        .withOpacity(0.18 * (1.0 - pulse)),
                                    width: 1.8,
                                  ),
                                ),
                              ),

                              // Inner soft pulse ring
                              Container(
                                width: 120 + (pulse * 12),
                                height: 120 + (pulse * 12),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: const Color(0xFF059669)
                                      .withOpacity(0.14 + (pulse * 0.08)),
                                ),
                              ),

                              // Scaled Hero Icon Card
                              ScaleTransition(
                                scale: _iconScale,
                                child: FadeTransition(
                                  opacity: _iconFade,
                                  child: Container(
                                    width: 104,
                                    height: 104,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(26),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF059669)
                                              .withOpacity(0.40),
                                          blurRadius: 36,
                                          offset: const Offset(0, 16),
                                        ),
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.20),
                                          blurRadius: 12,
                                          offset: const Offset(0, 6),
                                        ),
                                      ],
                                      border: Border.all(
                                        color: Colors.white.withOpacity(0.9),
                                        width: 2.0,
                                      ),
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(24),
                                      child: Image.asset(
                                        'assets/images/app_icon.png',
                                        width: 104,
                                        height: 104,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => Container(
                                          decoration: BoxDecoration(
                                            color: AppColors.primaryLight,
                                            borderRadius: BorderRadius.circular(24),
                                          ),
                                          child: const Icon(
                                            Icons.local_hospital_rounded,
                                            size: 52,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),

                      const SizedBox(height: 32),

                      // Brand Name Animated Entrance
                      SlideTransition(
                        position: _titleSlide,
                        child: FadeTransition(
                          opacity: _titleFade,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Med',
                                style: TextStyle(
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.8,
                                  color: Colors.white.withOpacity(0.95),
                                ),
                              ),
                              const Text(
                                '24',
                                style: TextStyle(
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.8,
                                  color: Color(0xFF34D399), // Emerald 400
                                ),
                              ),
                              Text(
                                'Plus',
                                style: TextStyle(
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.8,
                                  color: Colors.white.withOpacity(0.95),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 8),

                      // Tagline Entrance
                      SlideTransition(
                        position: _taglineSlide,
                        child: FadeTransition(
                          opacity: _taglineFade,
                          child: const Text(
                            AppStrings.appTagline,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              letterSpacing: 0.4,
                              color: Color(0xFFA7F3D0), // Soft mint
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Licensed Pharmacy Trust Badge
                      FadeTransition(
                        opacity: _badgeFade,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF34D399).withOpacity(0.25),
                              width: 1,
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.verified_user_rounded,
                                size: 14,
                                color: Color(0xFF34D399),
                              ),
                              SizedBox(width: 7),
                              Text(
                                'PCI Licensed Pharmacy • 24/7 Dispensing',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFFE6F4EF),
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const Spacer(flex: 3),

                      // 4. Modern Capsule Progress & Realtime Status
                      FadeTransition(
                        opacity: _badgeFade,
                        child: Column(
                          children: [
                            // Capsule Shimmer Progress Line
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                width: 140,
                                height: 4,
                                color: Colors.white.withOpacity(0.12),
                                child: AnimatedBuilder(
                                  animation: _progressController,
                                  builder: (context, child) {
                                    return FractionallySizedBox(
                                      alignment: Alignment.centerLeft,
                                      widthFactor: _progressController.value,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [
                                              Color(0xFF34D399),
                                              Color(0xFF6EE7B7),
                                            ],
                                          ),
                                          borderRadius: BorderRadius.circular(10),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF34D399)
                                                  .withOpacity(0.6),
                                              blurRadius: 6,
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),

                            const SizedBox(height: 12),

                            // Dynamic Status Text
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 300),
                              child: Text(
                                _statusMessage,
                                key: ValueKey<String>(_statusMessage),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.white.withOpacity(0.75),
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 28),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
