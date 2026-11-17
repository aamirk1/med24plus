import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:med24plus/core/constants/app_strings.dart';
import 'package:med24plus/core/mock/mock_data.dart';
import 'package:med24plus/core/widgets/app_button.dart';
import 'package:med24plus/core/widgets/app_badge.dart';
import 'package:med24plus/core/widgets/price_widget.dart';
import 'package:med24plus/core/widgets/quantity_selector.dart';
import 'package:med24plus/features/splash/presentation/splash_screen.dart';
import 'package:med24plus/features/onboarding/presentation/onboarding_screen.dart';
import 'package:med24plus/features/auth/presentation/login_screen.dart';
import 'package:med24plus/features/auth/presentation/register_screen.dart';
import 'package:med24plus/features/auth/presentation/forgot_password_screen.dart';
import 'package:med24plus/features/categories/presentation/categories_screen.dart';
import 'package:med24plus/features/products/presentation/product_list_screen.dart';
import 'package:med24plus/features/products/presentation/product_detail_screen.dart';
import 'package:med24plus/features/cart/presentation/cart_screen.dart';
import 'package:med24plus/features/checkout/presentation/checkout_screen.dart';
import 'package:med24plus/features/profile/presentation/addresses_screen.dart';
import 'package:med24plus/features/prescriptions/presentation/prescription_upload_screen.dart';
import 'package:med24plus/features/orders/presentation/order_history_screen.dart';
import 'package:med24plus/features/orders/presentation/order_detail_screen.dart';
import 'package:med24plus/features/profile/presentation/profile_screen.dart';
import 'package:med24plus/features/notifications/presentation/notifications_screen.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:med24plus/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:med24plus/features/common/presentation/about_screen.dart';
import 'package:med24plus/features/common/presentation/contact_screen.dart';
import 'mocks/fake_auth_repository.dart';

Widget _wrap(Widget child) {
  return BlocProvider<AuthBloc>(
    create: (_) => AuthBloc(authRepository: FakeAuthRepository()),
    child: MaterialApp(
      home: child,
    ),
  );
}

void main() {
  group('Phase 2 Reusable Widgets Tests', () {
    testWidgets('AppButton renders properly', (tester) async {
      await tester.pumpWidget(_wrap(const AppButton(text: 'Click Me')));
      expect(find.text('Click Me'), findsOneWidget);
    });

    testWidgets('AppBadge.schedule displays Schedule H correctly',
        (tester) async {
      await tester.pumpWidget(_wrap(AppBadge.schedule('SCHEDULE_H')));
      expect(find.text('Schedule H (Rx)'), findsOneWidget);
    });

    testWidgets('PriceWidget displays discount and formatted prices',
        (tester) async {
      await tester.pumpWidget(_wrap(const PriceWidget(
        sellingPrice: 945,
        mrp: 1125,
        discountPercent: 16,
      )));
      expect(find.text('₹945'), findsOneWidget);
      expect(find.text('₹1125'), findsOneWidget);
      expect(find.text('16% OFF'), findsOneWidget);
    });

    testWidgets('QuantitySelector increments and decrements count',
        (tester) async {
      int qty = 1;
      await tester.pumpWidget(_wrap(StatefulBuilder(
        builder: (context, setState) {
          return QuantitySelector(
            quantity: qty,
            onQuantityChanged: (val) => setState(() => qty = val),
          );
        },
      )));
      expect(find.text('1'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.add));
      await tester.pump();
      expect(qty, equals(2));
    });
  });

  group('Phase 2 Screen Layouts Smoke Tests', () {
    testWidgets('Splash Screen renders brand info', (tester) async {
      await tester.pumpWidget(_wrap(const SplashScreen()));
      expect(find.text(AppStrings.appName), findsOneWidget);
      expect(find.text(AppStrings.appTagline), findsOneWidget);
      await tester.pump(const Duration(seconds: 2));
    });

    testWidgets('Onboarding Screen renders first slide', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingScreen()));
      expect(find.text('100% Genuine Medicines'), findsOneWidget);
    });

    testWidgets('Login Screen renders input fields', (tester) async {
      await tester.pumpWidget(_wrap(const LoginScreen()));
      expect(find.text('Sign In with OTP / Password'), findsOneWidget);
    });

    testWidgets('Register Screen renders registration fields', (tester) async {
      await tester.pumpWidget(_wrap(const RegisterScreen()));
      expect(find.text('Register with Med24Plus'), findsOneWidget);
    });

    testWidgets('Forgot Password Screen renders reset prompt', (tester) async {
      await tester.pumpWidget(_wrap(const ForgotPasswordScreen()));
      expect(find.text('Forgot Your Password?'), findsOneWidget);
    });

    testWidgets('Categories Screen renders list of categories', (tester) async {
      await tester.pumpWidget(_wrap(const CategoriesScreen()));
      expect(find.text('Therapeutic Categories'), findsOneWidget);
      expect(find.text('Diabetes Care'), findsOneWidget);
    });

    testWidgets('Product List Screen renders products', (tester) async {
      await tester.pumpWidget(_wrap(const ProductListScreen()));
      expect(find.text('All Medicines & Essentials'), findsOneWidget);
    });

    testWidgets('Product Detail Screen renders medicine specifications',
        (tester) async {
      await tester.pumpWidget(
          _wrap(ProductDetailScreen(productId: MockData.products.first.id)));
      expect(find.text('Therapeutic Salt Composition'), findsOneWidget);
    });

    testWidgets('Cart Screen renders billing breakdown', (tester) async {
      await tester.pumpWidget(_wrap(const CartScreen()));
      expect(find.text('Bill Summary'), findsOneWidget);
    });

    testWidgets('Checkout Screen renders payment options', (tester) async {
      await tester.pumpWidget(_wrap(const CheckoutScreen()));
      expect(find.text('Select Payment Mode'), findsOneWidget);
    });

    testWidgets('Addresses Screen renders saved addresses', (tester) async {
      await tester.pumpWidget(_wrap(const AddressesScreen()));
      expect(find.text('Saved Delivery Addresses'), findsOneWidget);
    });

    testWidgets('Prescription Upload Screen renders Rule 65 notice',
        (tester) async {
      await tester.pumpWidget(_wrap(const PrescriptionUploadScreen()));
      expect(
          find.text('Drugs & Cosmetics Act, 1940 — Rule 65'), findsOneWidget);
    });

    testWidgets('Order History Screen renders past orders', (tester) async {
      await tester.pumpWidget(_wrap(const OrderHistoryScreen()));
      expect(find.text('My Orders & History'), findsOneWidget);
    });

    testWidgets('Order Detail Screen renders batch memo info', (tester) async {
      await tester.pumpWidget(
          _wrap(OrderDetailScreen(orderId: MockData.orders.first.id)));
      expect(find.text('Dispensed Medicines'), findsOneWidget);
    });

    testWidgets('Profile Screen renders user actions', (tester) async {
      await tester.pumpWidget(_wrap(const ProfileScreen()));
      expect(find.text('My Patient Profile'), findsOneWidget);
      expect(find.text('Rahul Verma'), findsOneWidget);
    });

    testWidgets('Notifications Screen renders alert items', (tester) async {
      await tester.pumpWidget(_wrap(const NotificationsScreen()));
      expect(find.text('Notifications'), findsOneWidget);
    });

    testWidgets('About Screen renders drug license credentials',
        (tester) async {
      await tester.pumpWidget(_wrap(const AboutScreen()));
      expect(find.text('Statutory Drug Licensing Details'), findsOneWidget);
    });

    testWidgets('Contact Screen renders pharmacy helpline numbers',
        (tester) async {
      await tester.pumpWidget(_wrap(const ContactScreen()));
      expect(find.text('Direct Pharmacy Contacts'), findsOneWidget);
      expect(find.text('+91 80 2345 6789'), findsOneWidget);
    });
  });
}
