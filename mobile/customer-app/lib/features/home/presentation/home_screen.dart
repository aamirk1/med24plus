import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/catalog_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/counter_badges.dart';
import '../../../core/widgets/product_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<MobileProduct> _products = [];
  List<MobileCategory> _categories = [];
  List<MobileBrand> _brands = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCatalogData();
  }

  Future<void> _loadCatalogData() async {
    setState(() => _isLoading = true);
    final results = await Future.wait([
      CatalogService.instance.getProducts(),
      CatalogService.instance.getCategories(),
      CatalogService.instance.getBrands(),
    ]);

    if (mounted) {
      setState(() {
        _products = results[0] as List<MobileProduct>;
        _categories = results[1] as List<MobileCategory>;
        _brands = results[2] as List<MobileBrand>;
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
          onRefresh: _loadCatalogData,
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
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              AppLogo(
                                size: 38,
                                borderRadius: 8,
                              ),
                              SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        'Med',
                                        style: TextStyle(
                                          fontSize: 19,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF003882),
                                          letterSpacing: -0.4,
                                        ),
                                      ),
                                      Text(
                                        '24',
                                        style: TextStyle(
                                          fontSize: 19,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF00C853),
                                          letterSpacing: -0.4,
                                        ),
                                      ),
                                      Text(
                                        'Plus',
                                        style: TextStyle(
                                          fontSize: 19,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF003882),
                                          letterSpacing: -0.4,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    'Health. Always Within Reach.',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: AppColors.secondaryText,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 0.1,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Row(
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
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.search_rounded,
                                  size: 20, color: AppColors.secondaryText),
                              SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'Search medicines, health products...',
                                  style: TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.secondaryText),
                                ),
                              ),
                              Icon(Icons.mic_none_rounded,
                                  size: 20, color: AppColors.secondaryText),
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
                        _buildQuickPill(
                            context,
                            'Medicines',
                            Icons.medication_rounded,
                            '/products?category=Medicines'),
                        _buildQuickPill(
                            context,
                            'Lab Tests',
                            Icons.science_outlined,
                            '/products?category=Diagnostics'),
                        _buildQuickPill(
                            context,
                            'Consult Doctor',
                            Icons.person_search_outlined,
                            '/products?category=Doctor'),
                        _buildQuickPill(context, 'Wellness', Icons.spa_outlined,
                            '/products?category=Wellness'),
                        _buildQuickPill(
                            context,
                            'Health Products',
                            Icons.medical_services_outlined,
                            '/products?category=Devices'),
                      ],
                    ),
                  ),
                ),
              ),

              // ================================================================
              // VIP Membership Encouragement Banner
              // ================================================================
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: AnimatedTapScale(
                    onTap: () => context.push('/membership'),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 140),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF034E61),
                            Color(0xFF06677F),
                            Color(0xFF0D9488),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF034E61).withValues(alpha: 0.22),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
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
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFBBF24).withValues(alpha: 0.22),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: const Color(0xFFFBBF24).withValues(alpha: 0.5),
                                      width: 0.8,
                                    ),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.workspace_premium_rounded,
                                          color: Color(0xFFFDE68A), size: 12),
                                      SizedBox(width: 4),
                                      Text(
                                        'MED24PLUS MEMBERSHIP',
                                        style: TextStyle(
                                          color: Color(0xFFFDE68A),
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 0.4,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Save Up to 30% Extra',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.4,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Zero Delivery Fees • Free Lab Kits • Priority Care',
                                  style: TextStyle(
                                    color: Color(0xFFCCFBF1),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                ElevatedButton(
                                  onPressed: () => context.push('/membership'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: const Color(0xFF034E61),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 6),
                                    minimumSize: const Size(90, 28),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(20)),
                                    elevation: 0,
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text('Explore Plans',
                                          style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold)),
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
                                width: 84,
                                height: 84,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.10),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    width: 1.5,
                                  ),
                                ),
                                child: const Center(
                                  child: Icon(Icons.workspace_premium_rounded,
                                      color: Color(0xFFFDE68A), size: 44),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
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
                        const Icon(Icons.receipt_long_rounded,
                            color: Colors.white, size: 28),
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
                                style: TextStyle(
                                    fontSize: 10.5, color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => context.push('/prescription-upload'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.secondaryDark,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                            elevation: 0,
                          ),
                          child: const Text('Upload Rx',
                              style: TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.bold)),
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
                              style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600),
                            ),
                            SizedBox(width: 2),
                            Icon(Icons.arrow_forward_ios_rounded,
                                size: 10, color: AppColors.primary),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Popular Categories Horizontal Grid (Dynamic from DB)
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 106,
                  child: _categories.isNotEmpty
                      ? ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          itemCount: _categories.length,
                          itemBuilder: (context, index) {
                            final cat = _categories[index];
                            return _buildCategoryTile(
                                context, cat.name, _getCategoryIcon(cat.name),
                                categoryId: cat.id);
                          },
                        )
                      : ListView(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          children: [
                            _buildCategoryTile(context, 'Anti-Infective',
                                Icons.coronavirus_outlined),
                            _buildCategoryTile(
                                context, 'Pain Relief', Icons.healing_rounded),
                            _buildCategoryTile(context, 'Cardiovascular',
                                Icons.favorite_rounded),
                            _buildCategoryTile(context, 'Diabetes Care',
                                Icons.monitor_heart_outlined),
                            _buildCategoryTile(
                                context, 'Vitamins', Icons.eco_rounded),
                            _buildCategoryTile(context, 'Health Devices',
                                Icons.thermostat_outlined),
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
                    padding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _TrustItem(
                            icon: Icons.verified_user_rounded,
                            title: '100% Genuine',
                            sub: 'Medicines'),
                        _TrustItem(
                            icon: Icons.local_shipping_rounded,
                            title: 'Fast Delivery',
                            sub: 'Across Mumbai'),
                        _TrustItem(
                            icon: Icons.support_agent_rounded,
                            title: 'Expert Support',
                            sub: '24x7 Active'),
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
                      border: Border.all(
                          color: AppColors.secondary.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.secondary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.card_giftcard_rounded,
                              color: AppColors.secondary, size: 24),
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
                                style: TextStyle(
                                    fontSize: 10.5,
                                    color: AppColors.secondaryText),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => context.push('/about'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.bannerBlueDark,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                            elevation: 0,
                          ),
                          child: const Text('Know More >',
                              style: TextStyle(
                                  fontSize: 10.5, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ================================================================
              // Top Pharmaceutical Brands (Dynamic from DB)
              // ================================================================
              if (_brands.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Trusted Pharmaceutical Brands',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.mainText,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push('/products'),
                          child: const Text(
                            'All Brands',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 48,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemCount: _brands.length,
                      itemBuilder: (context, index) {
                        final brand = _brands[index];
                        return Padding(
                          padding: const EdgeInsets.only(right: 10),
                          child: InkWell(
                            onTap: () =>
                                context.push('/products?search=${brand.name}'),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Center(
                                child: Text(
                                  brand.name,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.mainText,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],

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
                          style: TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600),
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
                      child:
                          CircularProgressIndicator(color: AppColors.primary),
                    ),
                  ),
                )
              else if (_products.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 20),
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.inventory_2_outlined,
                              size: 40, color: AppColors.secondaryText),
                          const SizedBox(height: 12),
                          const Text(
                            'No Products Available',
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: AppColors.mainText),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Catalog medicines are loading or being restocked. Tap below to refresh.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                fontSize: 12, color: AppColors.secondaryText),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: _loadCatalogData,
                            icon: const Icon(Icons.refresh, size: 16),
                            label: const Text('Refresh Catalog',
                                style: TextStyle(fontSize: 12)),
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
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.70,
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
                              AppSnackBar.showCartSuccess(
                                context,
                                productName: product.name,
                                onViewCart: () => context.push('/cart'),
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

  Widget _buildQuickPill(
      BuildContext context, String title, IconData icon, String route) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: () => context.push(route),
        borderRadius: BorderRadius.circular(24),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFBAE6FD), width: 1.2),
          ),
          child: Row(
            children: [
              Icon(icon, size: 17, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.mainText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryTile(BuildContext context, String title, IconData icon, {String? categoryId}) {
    return Padding(
      padding: const EdgeInsets.only(right: 14),
      child: InkWell(
        onTap: () {
          final query = 'category=${Uri.encodeComponent(title)}${categoryId != null && categoryId.isNotEmpty ? '&categoryId=$categoryId' : ''}';
          context.push('/products?$query');
        },
        borderRadius: BorderRadius.circular(16),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border, width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Center(
                child: Icon(icon, color: AppColors.primary, size: 30),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.mainText,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('anti') ||
        lower.contains('infect') ||
        lower.contains('bacteri')) {
      return Icons.coronavirus_outlined;
    }
    if (lower.contains('pain') || lower.contains('analgesic')) {
      return Icons.healing_rounded;
    }
    if (lower.contains('cardio') ||
        lower.contains('heart') ||
        lower.contains('pressure')) {
      return Icons.favorite_rounded;
    }
    if (lower.contains('diabet') ||
        lower.contains('sugar') ||
        lower.contains('glycem')) {
      return Icons.monitor_heart_outlined;
    }
    if (lower.contains('gastro') ||
        lower.contains('acid') ||
        lower.contains('digest')) {
      return Icons.spa_rounded;
    }
    if (lower.contains('respirat') ||
        lower.contains('allergy') ||
        lower.contains('inhaler')) {
      return Icons.air_rounded;
    }
    if (lower.contains('skin') || lower.contains('derma')) {
      return Icons.face_retouching_natural_rounded;
    }
    if (lower.contains('vitamin') ||
        lower.contains('supplement') ||
        lower.contains('calcium')) {
      return Icons.eco_rounded;
    }
    if (lower.contains('women') || lower.contains('matern')) {
      return Icons.pregnant_woman_rounded;
    }
    if (lower.contains('device') ||
        lower.contains('monitor') ||
        lower.contains('strip')) {
      return Icons.thermostat_outlined;
    }
    return Icons.medication_rounded;
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;

  const _TrustItem(
      {required this.icon, required this.title, required this.sub});

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
              style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.bold,
                  color: AppColors.mainText),
            ),
            Text(
              sub,
              style: const TextStyle(
                  fontSize: 9.5, color: AppColors.secondaryText),
            ),
          ],
        ),
      ],
    );
  }
}
