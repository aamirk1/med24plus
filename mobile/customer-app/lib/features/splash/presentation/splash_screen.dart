import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/secure_storage_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _introController;
  late final AnimationController _pulseController;
  late final AnimationController _floatController;

  // Staggered Entrance Animations
  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<Offset> _brandSlide;
  late final Animation<double> _brandFade;
  late final Animation<double> _swooshWidth;
  late final Animation<Offset> _pillarsSlide;
  late final Animation<double> _pillarsFade;
  late final Animation<Offset> _bottomArtSlide;
  late final Animation<double> _bottomArtFade;
  late final Animation<double> _loadingFade;

  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();

    // Set status bar to dark icons for clean white background
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
    );

    // 1. Continuous breathing & floating controllers
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    )..repeat(reverse: true);

    // 2. Choreographed entrance sequence (1200ms)
    _introController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    // Cross logo pop-in (0% - 50%)
    _logoScale = Tween<double>(begin: 0.55, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.0, 0.55, curve: Curves.easeOutBack),
      ),
    );
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.0, 0.40, curve: Curves.easeIn),
      ),
    );

    // Brand name & tagline slide-up (25% - 70%)
    _brandSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.28),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.25, 0.70, curve: Curves.easeOutCubic),
      ),
    );
    _brandFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.25, 0.65, curve: Curves.easeIn),
      ),
    );

    // Green swoosh underline expand (45% - 85%)
    _swooshWidth = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.45, 0.85, curve: Curves.easeOutQuad),
      ),
    );

    // 3 Pillars entrance (50% - 88%)
    _pillarsSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.25),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.50, 0.88, curve: Curves.easeOutCubic),
      ),
    );
    _pillarsFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.50, 0.82, curve: Curves.easeIn),
      ),
    );

    // Bottom 3D medicines & wave slide-up (40% - 95%)
    _bottomArtSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.20),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.40, 0.95, curve: Curves.easeOutCubic),
      ),
    );
    _bottomArtFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.40, 0.85, curve: Curves.easeIn),
      ),
    );

    // Loading indicator & text fade in (70% - 100%)
    _loadingFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.70, 1.0, curve: Curves.easeIn),
      ),
    );

    _introController.forward();
    _checkSessionAndNavigate();
  }

  Future<void> _checkSessionAndNavigate() async {
    final secureStorage = SecureStorageService();
    // Allow patient to enjoy the smooth, choreographed splash animation (2.2s)
    await Future.wait([
      secureStorage.hasValidSession(),
      Future.delayed(const Duration(milliseconds: 2200)),
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
    _introController.dispose();
    _pulseController.dispose();
    _floatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Soft Clinical Gradient Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFFF7FBFE),
                  Color(0xFFFFFFFF),
                  Color(0xFFF4F9FD),
                ],
                stops: [0.0, 0.45, 1.0],
              ),
            ),
          ),

          // 2. Animated Floating Medical Crosses (+) in Background
          AnimatedBuilder(
            animation: _floatController,
            builder: (context, child) {
              final float = _floatController.value;
              return Stack(
                children: [
                  // Top-Left Large Teal Cross
                  Positioned(
                    top: 50 + (float * 10),
                    left: -20 - (float * 6),
                    child: _buildMedicalCross(
                      size: 96,
                      color: const Color(0xFF5EEAD4).withValues(alpha: 0.32),
                    ),
                  ),

                  // Top-Right Soft Blue Cross
                  Positioned(
                    top: 100 - (float * 8),
                    right: 24 + (float * 4),
                    child: _buildMedicalCross(
                      size: 44,
                      color: const Color(0xFFBAE6FD).withValues(alpha: 0.45),
                    ),
                  ),

                  // Middle-Left Subtle Cross
                  Positioned(
                    top: size.height * 0.28 + (float * 6),
                    left: 20,
                    child: _buildMedicalCross(
                      size: 28,
                      color: const Color(0xFFCCFBF1).withValues(alpha: 0.50),
                    ),
                  ),

                  // Middle-Right Subtle Cross
                  Positioned(
                    top: size.height * 0.26 - (float * 6),
                    right: 28,
                    child: _buildMedicalCross(
                      size: 32,
                      color: const Color(0xFFE0F2FE).withValues(alpha: 0.55),
                    ),
                  ),
                ],
              );
            },
          ),

          // 3. Bottom 3D Medicines Illustration & Curved Wave (Pinned to bottom)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SlideTransition(
              position: _bottomArtSlide,
              child: FadeTransition(
                opacity: _bottomArtFade,
                child: AnimatedBuilder(
                  animation: _floatController,
                  builder: (context, child) {
                    final float = _floatController.value;
                    return Transform.translate(
                      offset: Offset(0, float * 3.0),
                      child: Stack(
                        alignment: Alignment.bottomCenter,
                        children: [
                          Image.asset(
                            'assets/images/splash_bottom_clean.png',
                            fit: BoxFit.fitWidth,
                            width: size.width,
                            errorBuilder: (_, __, ___) =>
                                const SizedBox(height: 200),
                          ),

                          // Real Animated Loading Spinner & Text over the bottom wave
                          Positioned(
                            bottom: 28,
                            child: FadeTransition(
                              opacity: _loadingFade,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Rotating smooth spinner
                                  const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.4,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  AnimatedBuilder(
                                    animation: _pulseController,
                                    builder: (context, child) {
                                      return Opacity(
                                        opacity: 0.85 +
                                            (_pulseController.value * 0.15),
                                        child: const Text(
                                          'Loading...',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            letterSpacing: 0.4,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          // 4. Foreground Content: Brand & 3 Pillars
          SafeArea(
            child: Column(
              children: [
                SizedBox(height: size.height * 0.05),

                // Med24Plus Cross Logo with Leaf
                ScaleTransition(
                  scale: _logoScale,
                  child: FadeTransition(
                    opacity: _logoFade,
                    child: AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        final pulse = _pulseController.value;
                        return Transform.scale(
                          scale: 1.0 + (pulse * 0.025),
                          child: Container(
                            width: 104,
                            height: 94,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Image.asset(
                              'assets/images/splash_logo.png',
                              fit: BoxFit.contain,
                              errorBuilder: (_, __, ___) =>
                                  _buildFallbackLogo(),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Brand Name: Med24Plus Typography
                SlideTransition(
                  position: _brandSlide,
                  child: FadeTransition(
                    opacity: _brandFade,
                    child: Column(
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              'Med',
                              style: TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF003882), // Deep Navy Blue
                                letterSpacing: -0.6,
                              ),
                            ),
                            Text(
                              '24',
                              style: TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.w900,
                                color:
                                    Color(0xFF00C853), // Radiant Emerald Green
                                letterSpacing: -0.6,
                              ),
                            ),
                            Text(
                              'Plus',
                              style: TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF003882), // Deep Navy Blue
                                letterSpacing: -0.6,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),

                        // Tagline: Health. Always Within Reach.
                        const Text(
                          'Health. Always Within Reach.',
                          style: TextStyle(
                            fontSize: 16.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0A2540),
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 6),

                        // Green Curved Swoosh Underline
                        AnimatedBuilder(
                          animation: _swooshWidth,
                          builder: (context, child) {
                            return CustomPaint(
                              size: Size(150 * _swooshWidth.value, 8),
                              painter: _GreenSwooshPainter(
                                progress: _swooshWidth.value,
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // 5. Middle 3 Pillars Strip (Order Medicines | Delivered Fast | Trusted & Safe)
                SlideTransition(
                  position: _pillarsSlide,
                  child: FadeTransition(
                    opacity: _pillarsFade,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _buildPillarItem(
                            icon: Icons.medication_outlined,
                            line1: 'Order',
                            line2: 'Medicines',
                          ),
                          _buildVerticalDivider(),
                          _buildPillarItem(
                            icon: Icons.two_wheeler_rounded,
                            line1: 'Get it',
                            line2: 'Delivered Fast',
                          ),
                          _buildVerticalDivider(),
                          _buildPillarItem(
                            icon: Icons.verified_user_outlined,
                            line1: 'Trusted &',
                            line2: 'Safe',
                          ),
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

  Widget _buildPillarItem({
    required IconData icon,
    required String line1,
    required String line2,
  }) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            child: Icon(icon, color: const Color(0xFF0B5ED7), size: 26),
          ),
          const SizedBox(height: 6),
          Text(
            line1,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0A2540),
              height: 1.15,
            ),
          ),
          Text(
            line2,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0A2540),
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalDivider() {
    return Container(
      height: 38,
      width: 1.2,
      color: const Color(0xFFE2E8F0),
    );
  }

  Widget _buildMedicalCross({required double size, required Color color}) {
    return CustomPaint(
      size: Size(size, size),
      painter: _CrossPainter(color: color),
    );
  }

  Widget _buildFallbackLogo() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0B5ED7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(
        child: Icon(Icons.add_rounded, color: Colors.white, size: 48),
      ),
    );
  }
}

/// Custom painter for soft background medical plus crosses with rounded corners
class _CrossPainter extends CustomPainter {
  final Color color;
  const _CrossPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final w = size.width;
    final h = size.height;
    final armThickness = w * 0.36;
    final radius = Radius.circular(w * 0.12);

    // Horizontal arm
    final hRect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset(w / 2, h / 2),
        width: w,
        height: armThickness,
      ),
      radius,
    );

    // Vertical arm
    final vRect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset(w / 2, h / 2),
        width: armThickness,
        height: h,
      ),
      radius,
    );

    canvas.drawRRect(hRect, paint);
    canvas.drawRRect(vRect, paint);
  }

  @override
  bool shouldRepaint(covariant _CrossPainter oldDelegate) =>
      color != oldDelegate.color;
}

/// Custom painter for the vibrant green curved swoosh underline accent
class _GreenSwooshPainter extends CustomPainter {
  final double progress;
  const _GreenSwooshPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0.0) return;

    final paint = Paint()
      ..shader = const LinearGradient(
        colors: [
          Color(0xFF00C853),
          Color(0xFF00E676),
          Color(0xFF00B368),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final startX = (1.0 - progress) * (size.width / 2);
    final endX = size.width - startX;

    path.moveTo(startX, size.height * 0.8);
    path.quadraticBezierTo(
      size.width * 0.5,
      size.height * 0.1,
      endX,
      size.height * 0.8,
    );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _GreenSwooshPainter oldDelegate) =>
      progress != oldDelegate.progress;
}
