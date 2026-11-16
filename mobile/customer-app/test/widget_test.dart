import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/app/app.dart';
import 'package:customer_app/core/constants/app_strings.dart';

void main() {
  testWidgets('App renders home screen with Med24Plus branding and Rx upload CTA', (WidgetTester tester) async {
    await tester.pumpWidget(const OnlinePharmacyApp());
    await tester.pumpAndSettle();

    // Verify brand tagline
    expect(find.text(AppStrings.appTagline), findsOneWidget);

    // Verify regulatory statutory license notice
    expect(find.text(AppStrings.licenseNotice), findsOneWidget);

    // Verify prescription action button
    expect(find.text('Upload Doctor Rx'), findsOneWidget);

    // Verify category header
    expect(find.text(AppStrings.popularCategories), findsOneWidget);
  });
}

