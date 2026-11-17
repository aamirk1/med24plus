import 'package:flutter_test/flutter_test.dart';
import 'package:med24plus/core/constants/app_strings.dart';
import 'package:med24plus/core/constants/app_colors.dart';

void main() {
  group('App Constants Unit Tests', () {
    test('AppStrings contains appropriate Indian pharmacy identifiers', () {
      expect(AppStrings.appName, equals('Med24Plus'));
      expect(AppStrings.licenseNotice, contains('DL-KA-2026-PHAR-008472'));
      expect(AppStrings.appTagline, equals('Health. Always Within Reach.'));
    });

    test('AppColors brand identity values match Med24Plus design palette', () {
      expect(AppColors.primaryBlue.toARGB32(), equals(0xFF0066CC));
      expect(AppColors.primaryGreen.toARGB32(), equals(0xFF00B074));
      expect(AppColors.background.toARGB32(), equals(0xFFF8FAFC));
    });
  });
}
