import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'main_navigation_shell.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../features/categories/presentation/categories_screen.dart';
import '../../features/products/presentation/product_list_screen.dart';
import '../../features/products/presentation/product_detail_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/checkout/presentation/checkout_screen.dart';
import '../../features/profile/presentation/addresses_screen.dart';
import '../../features/prescriptions/presentation/prescription_upload_screen.dart';
import '../../features/orders/presentation/order_history_screen.dart';
import '../../features/orders/presentation/order_detail_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/common/presentation/about_screen.dart';
import '../../features/common/presentation/contact_screen.dart';
import '../../features/membership/presentation/membership_plans_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

/// Helper function producing a fluid, GPU-accelerated slide-fade page transition (60/120fps).
CustomTransitionPage<void> _buildSmoothTransitionPage({
  required BuildContext context,
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 260),
    reverseTransitionDuration: const Duration(milliseconds: 220),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return FadeTransition(
        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(curved),
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.04, 0.0),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}

class AppRouter {
  AppRouter._();

  static void navigateToHomeOnSessionExpired() {
    try {
      router.go('/home');
      final context = _rootNavigatorKey.currentContext;
      if (context != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Your login session has expired for your protection. Please sign in again.',
              style: TextStyle(fontSize: 12.5),
            ),
            duration: Duration(seconds: 4),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {}
  }

  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        name: 'splash',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const SplashScreen(),
        ),
      ),

      // Onboarding
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const OnboardingScreen(),
        ),
      ),

      // Auth Routes
      GoRoute(
        path: '/login',
        name: 'login',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const RegisterScreen(),
        ),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgot_password',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const ForgotPasswordScreen(),
        ),
      ),

      // Main Shell Route with 5 Bottom Navigation Branches
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainNavigationShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Home
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                name: 'home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),

          // Branch 1: Categories
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/categories',
                name: 'categories',
                builder: (context, state) => const CategoriesScreen(),
              ),
            ],
          ),

          // Branch 2: Search
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/search',
                name: 'search',
                builder: (context, state) => const SearchScreen(),
              ),
            ],
          ),

          // Branch 3: Orders
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/orders',
                name: 'orders',
                builder: (context, state) => const OrderHistoryScreen(),
              ),
            ],
          ),

          // Branch 4: Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // Standalone Fullscreen Flow Routes with Fluid Animated Transitions
      GoRoute(
        path: '/products',
        name: 'products',
        pageBuilder: (context, state) {
          final cat = state.uri.queryParameters['category'];
          final catId = state.uri.queryParameters['categoryId'];
          return _buildSmoothTransitionPage(
            context: context,
            state: state,
            child: ProductListScreen(category: cat, categoryId: catId),
          );
        },
      ),
      GoRoute(
        path: '/product/:id',
        name: 'product_detail',
        pageBuilder: (context, state) {
          final id = state.pathParameters['id'] ?? 'p-1';
          return _buildSmoothTransitionPage(
            context: context,
            state: state,
            child: ProductDetailScreen(productId: id),
          );
        },
      ),
      GoRoute(
        path: '/cart',
        name: 'cart',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const CartScreen(),
        ),
      ),
      GoRoute(
        path: '/checkout',
        name: 'checkout',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const CheckoutScreen(),
        ),
      ),
      GoRoute(
        path: '/addresses',
        name: 'addresses',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const AddressesScreen(),
        ),
      ),
      GoRoute(
        path: '/prescription-upload',
        name: 'prescription_upload',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const PrescriptionUploadScreen(),
        ),
      ),
      GoRoute(
        path: '/order/:id',
        name: 'order_detail',
        pageBuilder: (context, state) {
          final id = state.pathParameters['id'] ?? 'ord-1';
          return _buildSmoothTransitionPage(
            context: context,
            state: state,
            child: OrderDetailScreen(orderId: id),
          );
        },
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const NotificationsScreen(),
        ),
      ),
      GoRoute(
        path: '/about',
        name: 'about',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const AboutScreen(),
        ),
      ),
      GoRoute(
        path: '/contact',
        name: 'contact',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const ContactScreen(),
        ),
      ),
      GoRoute(
        path: '/membership',
        name: 'membership',
        pageBuilder: (context, state) => _buildSmoothTransitionPage(
          context: context,
          state: state,
          child: const MembershipPlansScreen(),
        ),
      ),
    ],
  );
}
