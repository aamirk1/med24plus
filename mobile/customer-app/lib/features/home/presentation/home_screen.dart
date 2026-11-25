import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/catalog_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/counter_badges.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/smart_savings_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<MobileProduct> _products = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final products = await CatalogService.instance.getProducts();
    if (mounted) {
      setState(() {
        _products = products;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: _loadProducts,
          child: CustomScrollView(
          slivers: [
            // ================================================================
            // Top App Bar with Logo, Notification Badge (2), Cart (1) & Search
            // ================================================================
            SliverToBoxAdapter(
              child: Container(
                color: AppColors.surface,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Brand Header Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            AppLogo(
                              size: 38,
                              borderRadius: 8,
                            ),
                            SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  AppStrings.appName,
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.mainText,
                                    letterSpacing: -0.4,
                                  ),
                                ),
                                Text(
                                  AppStrings.appTagline,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppColors.secondaryText,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Row(
                          children: [
                            NotificationBadgeIcon(),
                            CartBadgeIcon(),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Search Trigger Bar with Mic Icon
                    AnimatedTapScale(
                      onTap: () => context.push('/search'),
                      scaleDown: 0.98,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.search_rounded, size: 20, color: AppColors.secondaryText),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Search medicines, health products...',
                                style: TextStyle(fontSize: 12.5, color: AppColors.secondaryText),
                              ),
                            ),
                            Icon(Icons.mic_none_rounded, size: 20, color: AppColors.secondaryText),
                          ],
                        ),
                      ),
                    ),
                    if (_isLoading) ...[
                      const SizedBox(height: 6),
                      const ClipRRect(
                        borderRadius: BorderRadius.all(Radius.circular(2)),
                        child: LinearProgressIndicator(
                          minHeight: 2,
                          color: AppColors.primary,
                          backgroundColor: AppColors.primaryLight,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // ================================================================
            // Quick Navigation Horizontal Category Pills
            // ================================================================
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.only(bottom: 12),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      _buildQuickPill(context, 'Medicines', Icons.medication_rounded, '/products?category=Medicines'),
                      _buildQuickPill(context, 'Lab Tests', Icons.science_outlined, '/products?category=Diagnostics'),
                      _buildQuickPill(context, 'Consult Doctor', Icons.person_search_outlined, '/products?category=Doctor'),
                      _buildQuickPill(context, 'Wellness', Icons.spa_outlined, '/products?category=Wellness'),
                      _buildQuickPill(context, 'Health Products', Icons.medical_services_outlined, '/products?category=Devices'),
                    ],
                  ),
                ),
              ),
            ),

            // ================================================================
            // Hero Promo Banner: Up to 20%+ OFF on Medicines
            // ================================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Container(
                  constraints: const BoxConstraints(minHeight: 135),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.bannerBlueDark, AppColors.bannerBlueLight],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Stack(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 14, 110, 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Up to',
                              style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            const Text(
                              '20%+ OFF',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const Text(
                              'on Medicines & More',
                              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: () => context.push('/products'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                minimumSize: const Size(80, 28),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                elevation: 0,
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text('Shop Now', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  SizedBox(width: 4),
                                  Icon(Icons.arrow_forward_rounded, size: 12),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        right: 14,
                        top: 0,
                        bottom: 0,
                        child: Center(
                          child: Container(
                            width: 90,
                            height: 90,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Icon(Icons.vaccines_rounded, color: Colors.white, size: 48),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ================================================================
            // SMART SAVINGS - COMPARE BRAND SUBSTITUTES (Matches Screenshot 1)
            // ================================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: SmartSavingsCard(
                  onTap: () => context.push('/product/p-azithral'),
                ),
              ),
            ),

            // ================================================================
            // Quick Prescription Upload Notice
            // ================================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.secondaryDark, AppColors.secondary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 28),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Have a Doctor Prescription?',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Upload doctor Rx for Rule 65 verified dispensing',
                              style: TextStyle(fontSize: 10.5, color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => context.push('/prescription-upload'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppColors.secondaryDark,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                        child: const Text('Upload Rx', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ================================================================
            // Popular Categories Section
            // ================================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      AppStrings.popularCategories,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.push('/categories'),
                      child: const Row(
                        children: [
                          Text(
                            'View All',
                            style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                          ),
                          SizedBox(width: 2),
                          Icon(Icons.arrow_forward_ios_rounded, size: 10, color: AppColors.primary),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Popular Categories Horizontal Grid
            SliverToBoxAdapter(
              child: SizedBox(
                height: 90,
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildCategoryTile(context, 'Medicines', Icons.medication_rounded),
                    _buildCategoryTile(context, 'Lab Tests', Icons.science_outlined),
                    _buildCategoryTile(context, 'Wellness', Icons.favorite_border_rounded),
                    _buildCategoryTile(context, 'Health Products', Icons.medical_services_outlined),
                    _buildCategoryTile(context, 'Ayurveda', Icons.spa_outlined),
                  ],
                ),
              ),
            ),

            // ================================================================
            // 3-Pillar Trust Strip (Genuine Medicines, Fast Delivery, 24x7)
            // ================================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _TrustItem(icon: Icons.verified_user_rounded, title: '100% Genuine', sub: 'Medicines'),
                      _TrustItem(icon: Icons.local_shipping_rounded, title: 'Fast Delivery', sub: 'Across Mumbai'),
                      _TrustItem(icon: Icons.support_agent_rounded, title: 'Expert Support', sub: '24x7 Active'),
                    ],
                  ),
                ),
              ),
            ),

            // ================================================================
            // Med24Plus Member Plan Banner
            // ================================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFE8F7F3), Color(0xFFE6F3FB)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.secondary.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.secondary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.card_giftcard_rounded, color: AppColors.secondary, size: 24),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Join Med24Plus Member Plan',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.mainText,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Get up to 26% OFF + Free Welcome Kit',
                              style: TextStyle(fontSize: 10.5, color: AppColors.secondaryText),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => context.push('/about'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.bannerBlueDark,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                        child: const Text('Know More >', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ================================================================
            // Frequently Dispensed Medicines Header
            // ================================================================
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Frequently Dispensed Medicines',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.push('/products'),
                      child: const Text(
                        'View All',
                        style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Products Grid
            if (_isLoading)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                ),
              )
            else if (_products.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.inventory_2_outlined, size: 40, color: AppColors.secondaryText),
                        const SizedBox(height: 12),
                        const Text(
                          'No Products Available',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.mainText),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Catalog medicines are loading or being restocked. Tap below to refresh.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _loadProducts,
                          icon: const Icon(Icons.refresh, size: 16),
                          label: const Text('Refresh Catalog', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.58,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final product = _products[index];
                      return AnimatedFadeSlide(
                        delay: Duration(milliseconds: index * 30),
                        child: ProductCard(
                          product: product,
                          onTap: () => context.push('/product/${product.id}'),
                          onAddToCart: () {
                            CartService.instance.addItem(product);
                            ScaffoldMessenger.of(context).hideCurrentSnackBar();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${product.name} added to cart'),
                                duration: const Duration(seconds: 2),
                                action: SnackBarAction(
                                  label: 'VIEW CART',
                                  textColor: AppColors.secondary,
                                  onPressed: () => context.push('/cart'),
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                    childCount: _products.length,
                  ),
                ),
              ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 28),
            ),
          ],
        ),
      ),
    ),
  );
}

  Widget _buildQuickPill(BuildContext context, String title, IconData icon, String route) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: () => context.push(route),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFBAE6FD)),
          ),
          child: Row(
            children: [
              Icon(icon, size: 15, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.mainText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryTile(BuildContext context, String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: InkWell(
        onTap: () => context.push('/products?category=$title'),
        borderRadius: BorderRadius.circular(12),
        child: Column(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: Icon(icon, color: AppColors.primary, size: 26),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.mainText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;

  const _TrustItem({required this.icon, required this.title, required this.sub});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.secondary),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppColors.mainText),
            ),
            Text(
              sub,
              style: const TextStyle(fontSize: 9.5, color: AppColors.secondaryText),
            ),
          ],
        ),
      ],
    );
  }
}
