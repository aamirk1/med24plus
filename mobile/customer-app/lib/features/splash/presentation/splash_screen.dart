import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/secure_storage_service.dart';

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

  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();

    // 1. Continuous breathing pulse for glowing ambient aura
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);

    // 2. Choreographed entrance sequence (1100ms)
    _introController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );

    _iconScale = Tween<double>(begin: 0.65, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.0, 0.65, curve: Curves.easeOutBack),
      ),
    );
    _iconFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.0, 0.45, curve: Curves.easeIn),
      ),
    );

    _titleSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.25),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.30, 0.75, curve: Curves.easeOutCubic),
      ),
    );
    _titleFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.30, 0.70, curve: Curves.easeIn),
      ),
    );

    _taglineSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.25),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.45, 0.85, curve: Curves.easeOutCubic),
      ),
    );
    _taglineFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.45, 0.80, curve: Curves.easeIn),
      ),
    );

    _badgeFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.60, 1.0, curve: Curves.easeIn),
      ),
    );

    // 3. Smooth progress line
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..forward();

    _introController.forward();
    _checkSessionAndNavigate();
  }

  Future<void> _checkSessionAndNavigate() async {
    final secureStorage = SecureStorageService();
    // Warm up session check concurrently with responsive splash duration (1.4s)
    await Future.wait([
      secureStorage.hasValidSession(),
      Future.delayed(const Duration(milliseconds: 1400)),
    ]);

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

  Widget _buildTrustPill(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.18),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF2DD4BF)),
          const SizedBox(width: 4),
          Text(
            label,
            maxLines: 1,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFallbackVectorCross() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(22),
      ),
      child: const Center(
        child: Icon(
          Icons.local_hospital_rounded,
          size: 50,
          color: AppColors.primary,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // 1. Radiant Royal Navy & Med24Plus Blue Brand Gradient
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF06182E), // Midnight Navy
                  Color(0xFF092A54), // Rich Royal Navy
                  Color(0xFF08417A), // Deep Medical Blue
                  Color(0xFF0052CC), // Vibrant Med24Plus Royal Blue
                ],
                stops: [0.0, 0.35, 0.70, 1.0],
              ),
            ),
          ),

          // 2. Dynamic Ambient Glow Orbs
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              final pulse = _pulseController.value;
              return Stack(
                children: [
                  // Top Emerald Halo Orb
                  Positioned(
                    top: -60 + (pulse * 12),
                    right: -40,
                    child: Container(
                      width: 280,
                      height: 280,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFF00A88F).withValues(alpha: 0.24 + (pulse * 0.08)),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Bottom Sky Blue Halo Orb
                  Positioned(
                    bottom: -80 - (pulse * 12),
                    left: -50,
                    child: Container(
                      width: 320,
                      height: 320,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFF38BDF8).withValues(alpha: 0.18 + (pulse * 0.06)),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Soft Center Glow behind Emblem
                  Positioned(
                    top: (size.height / 2) - 170,
                    left: (size.width / 2) - 130,
                    child: Container(
                      width: 260,
                      height: 260,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFF2DD4BF).withValues(alpha: 0.18 + (pulse * 0.06)),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // 3. Central Brand Hero Presentation
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Spacer(flex: 4),

                    // Breathing Aura Rings & Emblem Card
                    AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        final pulse = _pulseController.value;
                        return Stack(
                          alignment: Alignment.center,
                          children: [
                            // Outer Expanding Pulse Ring
                            Container(
                              width: 154 + (pulse * 22),
                              height: 154 + (pulse * 22),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFF2DD4BF).withValues(alpha: 0.22 * (1.0 - pulse)),
                                  width: 1.5,
                                ),
                              ),
                            ),

                            // Inner Soft Glow Halo
                            Container(
                              width: 130 + (pulse * 10),
                              height: 130 + (pulse * 10),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF00A88F).withValues(alpha: 0.35 + (pulse * 0.15)),
                                    blurRadius: 36,
                                    spreadRadius: 6,
                                  ),
                                ],
                              ),
                            ),

                            // Hero Logo Container
                            ScaleTransition(
                              scale: _iconScale,
                              child: FadeTransition(
                                opacity: _iconFade,
                                child: Container(
                                  width: 112,
                                  height: 112,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(28),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.28),
                                        blurRadius: 28,
                                        offset: const Offset(0, 14),
                                      ),
                                      BoxShadow(
                                        color: const Color(0xFF00A88F).withValues(alpha: 0.32),
                                        blurRadius: 22,
                                        offset: const Offset(0, 6),
                                      ),
                                    ],
                                    border: Border.all(
                                      color: Colors.white.withValues(alpha: 0.85),
                                      width: 2.2,
                                    ),
                                  ),
                                  child: Image.asset(
                                    'assets/images/app_logo.png',
                                    fit: BoxFit.contain,
                                    errorBuilder: (_, __, ___) => _buildFallbackVectorCross(),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),

                    const SizedBox(height: 30),

                    // Modern Brand Name Typography
                    SlideTransition(
                      position: _titleSlide,
                      child: FadeTransition(
                        opacity: _titleFade,
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              'Med',
                              style: TextStyle(
                                fontSize: 38,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: -0.8,
                              ),
                            ),
                            Text(
                              '24',
                              style: TextStyle(
                                fontSize: 38,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF2DD4BF), // Radiant Emerald Mint
                                letterSpacing: -0.8,
                              ),
                            ),
                            Text(
                              'Plus',
                              style: TextStyle(
                                fontSize: 38,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: -0.8,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Refined Tagline with Dot Accents
                    SlideTransition(
                      position: _taglineSlide,
                      child: FadeTransition(
                        opacity: _taglineFade,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 5,
                              height: 5,
                              decoration: const BoxDecoration(
                                color: Color(0xFF2DD4BF),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              AppStrings.appTagline.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.5,
                                color: Color(0xFFE0F2FE), // Soft Sky Tint
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              width: 5,
                              height: 5,
                              decoration: const BoxDecoration(
                                color: Color(0xFF2DD4BF),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Sleek Trust Micro-Pills (FittedBox ensures responsive fit on narrow screens)
                    FadeTransition(
                      opacity: _badgeFade,
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildTrustPill(Icons.verified_rounded, '100% Genuine'),
                            const SizedBox(width: 6),
                            _buildTrustPill(Icons.bolt_rounded, '24/7 Delivery'),
                            const SizedBox(width: 6),
                            _buildTrustPill(Icons.health_and_safety_rounded, 'Verified Doctors'),
                          ],
                        ),
                      ),
                    ),

                    const Spacer(flex: 4),

                    // Bottom Sleek Shimmer Progress Capsule
                    FadeTransition(
                      opacity: _badgeFade,
                      child: Column(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: Container(
                              width: 140,
                              height: 3.5,
                              color: Colors.white.withValues(alpha: 0.14),
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
                                            Color(0xFF2DD4BF),
                                            Color(0xFF38BDF8),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF2DD4BF).withValues(alpha: 0.7),
                                            blurRadius: 8,
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Your 24x7 Healthcare Partner',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withValues(alpha: 0.65),
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
