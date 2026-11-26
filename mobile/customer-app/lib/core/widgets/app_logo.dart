import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

/// Reusable Med24Plus branded logo widget displaying `assets/images/app_logo.png`
/// with optional shadows, borders, rounded corners, or circular framing.
class AppLogo extends StatelessWidget {
  final double? size;
  final double? width;
  final double? height;
  final double borderRadius;
  final BoxFit fit;
  final bool circular;
  final bool withShadow;
  final Border? border;
  final Color? backgroundColor;

  const AppLogo({
    super.key,
    this.size,
    this.width,
    this.height,
    this.borderRadius = 12,
    this.fit = BoxFit.contain,
    this.circular = false,
    this.withShadow = false,
    this.border,
    this.backgroundColor,
  });

  /// Factory for a small app bar logo (size: 34)
  const AppLogo.appBar({super.key})
      : size = 34,
        width = null,
        height = null,
        borderRadius = 8,
        fit = BoxFit.contain,
        circular = false,
        withShadow = false,
        border = null,
        backgroundColor = null;

  /// Factory for a splash screen hero logo (size: 110)
  const AppLogo.splash({super.key})
      : size = 110,
        width = null,
        height = null,
        borderRadius = 24,
        fit = BoxFit.contain,
        circular = false,
        withShadow = true,
        border = null,
        backgroundColor = Colors.white;

  /// Factory for auth screens (size: 72)
  const AppLogo.auth({super.key})
      : size = 72,
        width = null,
        height = null,
        borderRadius = 18,
        fit = BoxFit.contain,
        circular = false,
        withShadow = true,
        border = null,
        backgroundColor = Colors.white;

  @override
  Widget build(BuildContext context) {
    final effectiveWidth = width ?? size ?? 48;
    final effectiveHeight = height ?? size ?? 48;

    final imageWidget = Image.asset(
      'assets/images/splash_logo.png',
      width: effectiveWidth,
      height: effectiveHeight,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => Image.asset(
        'assets/images/app_logo.png',
        width: effectiveWidth,
        height: effectiveHeight,
        fit: fit,
        errorBuilder: (_, __, ___) => _buildFallback(effectiveWidth, effectiveHeight),
      ),
    );

    if (!withShadow && border == null && backgroundColor == null) {
      if (circular) {
        return ClipOval(child: SizedBox(width: effectiveWidth, height: effectiveHeight, child: imageWidget));
      }
      return ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: SizedBox(width: effectiveWidth, height: effectiveHeight, child: imageWidget),
      );
    }

    return Container(
      width: effectiveWidth,
      height: effectiveHeight,
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        shape: circular ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: circular ? null : BorderRadius.circular(borderRadius),
        border: border ??
            Border.all(
              color: AppColors.primaryLight.withValues(alpha: 0.5),
              width: 1.2,
            ),
        boxShadow: withShadow
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: circular ? BorderRadius.circular(effectiveWidth / 2) : BorderRadius.circular(borderRadius),
        child: Padding(
          padding: EdgeInsets.all(effectiveWidth * 0.06),
          child: imageWidget,
        ),
      ),
    );
  }

  Widget _buildFallback(double w, double h) {
    return Container(
      width: w,
      height: h,
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Center(
        child: Icon(
          Icons.local_hospital_rounded,
          color: AppColors.primary,
          size: w * 0.55,
        ),
      ),
    );
  }
}
