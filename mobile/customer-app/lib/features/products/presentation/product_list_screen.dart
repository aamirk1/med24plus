import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/catalog_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/counter_badges.dart';
import '../../../core/widgets/product_card.dart';

class ProductListScreen extends StatefulWidget {
  final String? category;
  final String? categoryId;

  const ProductListScreen({super.key, this.category, this.categoryId});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  String _selectedSchedule = 'ALL';
  List<MobileProduct> _allProducts = [];
  bool _isLoading = true;

  static const List<Map<String, String>> _filterOptions = [
    {'value': 'ALL', 'label': 'All Products'},
    {'value': 'RX', 'label': 'Prescription (Rx)'},
    {'value': 'OTC', 'label': 'Over-The-Counter'},
    {'value': 'DEVICE', 'label': 'Medical Devices'},
    {'value': 'AYUSH', 'label': 'Ayurveda & Herbal'},
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final products = await CatalogService.instance
        .getProducts(categoryId: widget.categoryId);
    if (mounted) {
      setState(() {
        _allProducts = products;
        _isLoading = false;
      });
    }
  }

  bool _categorySemanticMatch(
    String query,
    String pCat,
    String pName,
    String pGeneric,
    String pDesc,
  ) {
    final q = query.toLowerCase();
    final combined = '$pCat $pName $pGeneric $pDesc'.toLowerCase();

    if (q.contains('anti') || q.contains('infect') || q.contains('bacteri')) {
      return combined.contains('antibiotic') ||
          combined.contains('antibacterial') ||
          combined.contains('antifungal') ||
          combined.contains('antiviral') ||
          combined.contains('infect') ||
          combined.contains('amoxi') ||
          combined.contains('azithro') ||
          combined.contains('cefix') ||
          combined.contains('cipro') ||
          combined.contains('augmentin');
    }
    if (q.contains('pain') || q.contains('analgesic') || q.contains('fever')) {
      return combined.contains('pain') ||
          combined.contains('fever') ||
          combined.contains('antipyretic') ||
          combined.contains('nsaid') ||
          combined.contains('paracetamol') ||
          combined.contains('ibuprofen') ||
          combined.contains('aceclofenac') ||
          combined.contains('diclofenac') ||
          combined.contains('dolo') ||
          combined.contains('crocin');
    }
    if (q.contains('cardio') || q.contains('heart') || q.contains('pressure')) {
      return combined.contains('cardio') ||
          combined.contains('heart') ||
          combined.contains('pressure') ||
          combined.contains('hypertens') ||
          combined.contains('statin') ||
          combined.contains('cholesterol') ||
          combined.contains('telmisartan') ||
          combined.contains('atorvastatin') ||
          combined.contains('amlodipine');
    }
    if (q.contains('diabet') || q.contains('sugar') || q.contains('glycem')) {
      return combined.contains('diabet') ||
          combined.contains('sugar') ||
          combined.contains('glycem') ||
          combined.contains('metformin') ||
          combined.contains('glimepiride') ||
          combined.contains('vildagliptin') ||
          combined.contains('insulin');
    }
    if (q.contains('gastro') ||
        q.contains('digest') ||
        q.contains('acid') ||
        q.contains('stomach')) {
      return combined.contains('gastro') ||
          combined.contains('digest') ||
          combined.contains('acid') ||
          combined.contains('pantoprazole') ||
          combined.contains('rabeprazole') ||
          combined.contains('omeprazole') ||
          combined.contains('antacid');
    }
    if (q.contains('vitamin') ||
        q.contains('supplement') ||
        q.contains('mineral')) {
      return combined.contains('vitamin') ||
          combined.contains('calcium') ||
          combined.contains('zinc') ||
          combined.contains('mineral') ||
          combined.contains('supplement') ||
          combined.contains('iron');
    }
    if (q.contains('ayush') || q.contains('herbal') || q.contains('ayurved')) {
      return combined.contains('ayush') ||
          combined.contains('herbal') ||
          combined.contains('ayurved') ||
          combined.contains('dabur') ||
          combined.contains('himalaya');
    }
    if (q.contains('device') || q.contains('monitor') || q.contains('surgic')) {
      return combined.contains('device') ||
          combined.contains('monitor') ||
          combined.contains('meter') ||
          combined.contains('strip') ||
          combined.contains('omron') ||
          combined.contains('thermometer');
    }
    if (q.contains('thyroid') || q.contains('endocrin') || q.contains('hormon')) {
      return combined.contains('thyroid') ||
          combined.contains('thyroxine') ||
          combined.contains('eltroxin');
    }
    if (q.contains('thinner') || q.contains('coagulant') || q.contains('clot')) {
      return combined.contains('thinner') ||
          combined.contains('coagulant') ||
          combined.contains('aspirin') ||
          combined.contains('clopidogrel') ||
          combined.contains('ecosprin');
    }
    if (q.contains('cholesterol') || q.contains('lipid') || q.contains('statin')) {
      return combined.contains('cholesterol') ||
          combined.contains('lipid') ||
          combined.contains('statin') ||
          combined.contains('atorvastatin') ||
          combined.contains('rosuvastatin');
    }
    if (q.contains('parasit') || q.contains('worm') || q.contains('helminth')) {
      return combined.contains('parasit') ||
          combined.contains('worm') ||
          combined.contains('albendazole') ||
          combined.contains('ivermectin');
    }

    return false;
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.category ?? 'All Medicines & Essentials';

    final selectedCategory = widget.category?.trim();
    final selectedCatId = widget.categoryId?.trim();

    final hasCategoryFilter = (selectedCategory != null &&
            selectedCategory.isNotEmpty &&
            selectedCategory != 'Medicines' &&
            selectedCategory != 'All Medicines & Essentials') ||
        (selectedCatId != null && selectedCatId.isNotEmpty);

    final products = _allProducts.where((p) {
      bool matchesCat = true;
      if (hasCategoryFilter) {
        // 1. Direct Category ID match if both product and query have categoryId
        final bool idMatches = selectedCatId != null &&
            selectedCatId.isNotEmpty &&
            p.categoryId.isNotEmpty &&
            p.categoryId == selectedCatId;

        // 2. Name or semantic mapping match
        final queryCat = (selectedCategory ?? '').toLowerCase();
        final pCat = p.category.toLowerCase();
        final pName = p.name.toLowerCase();
        final pDesc = p.description.toLowerCase();
        final pGeneric = p.saltComposition.toLowerCase();

        final bool nameMatches = queryCat.isNotEmpty &&
            (pCat.contains(queryCat) ||
                queryCat.contains(pCat) ||
                _categorySemanticMatch(queryCat, pCat, pName, pGeneric, pDesc));

        // 3. Match against selectedCatId if it is a slug/name
        final bool slugMatches = selectedCatId != null &&
            selectedCatId.isNotEmpty &&
            (pCat.contains(selectedCatId.toLowerCase()) ||
                _categorySemanticMatch(selectedCatId.toLowerCase(), pCat, pName, pGeneric, pDesc));

        matchesCat = idMatches || nameMatches || slugMatches;
      }

      bool matchesSched = true;
      if (_selectedSchedule == 'RX') {
        matchesSched = p.requiresPrescription || p.schedule.contains('H');
      } else if (_selectedSchedule == 'OTC') {
        matchesSched = !p.requiresPrescription && p.schedule == 'OTC';
      } else if (_selectedSchedule != 'ALL') {
        matchesSched = p.schedule == _selectedSchedule;
      }
      return matchesCat && matchesSched;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, size: 22),
            onPressed: () => context.push('/search'),
          ),
          const CartBadgeIcon(iconSize: 22),
        ],
      ),
      body: Column(
        children: [
          if (_isLoading)
            const LinearProgressIndicator(
              minHeight: 2,
              color: AppColors.primary,
              backgroundColor: AppColors.primaryLight,
            ),

          // Animated Filter Tabs
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: _filterOptions.map((opt) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _buildAnimatedTabChip(opt['value']!, opt['label']!),
                  );
                }).toList(),
              ),
            ),
          ),

          // Animated Grid with Pull to Refresh
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _loadProducts,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: products.isEmpty
                    ? ListView(
                        children: [
                          SizedBox(
                              height:
                                  MediaQuery.of(context).size.height * 0.25),
                          Center(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 24),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 60,
                                    height: 60,
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryLight,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Icon(
                                      Icons.medication_outlined,
                                      size: 32,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  Text(
                                    'No medicines found in $title',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.mainText,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  const Text(
                                    'Explore our master catalog to browse all available healthcare products.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.secondaryText,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: () {
                                      context.pushReplacement('/products');
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 18, vertical: 8),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text(
                                      'View All Medicines',
                                      style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      )
                    : GridView.builder(
                        key: ValueKey('product_grid_$_selectedSchedule'),
                        padding: const EdgeInsets.all(16),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.70,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: products.length,
                        itemBuilder: (context, index) {
                          final product = products[index];
                          return AnimatedFadeSlide(
                            delay: Duration(milliseconds: index * 25),
                            child: ProductCard(
                              product: product,
                              onTap: () =>
                                  context.push('/product/${product.id}'),
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
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedTabChip(String value, String label) {
    final isSelected = _selectedSchedule == value;

    return AnimatedTapScale(
      onTap: () => setState(() => _selectedSchedule = value),
      scaleDown: 0.94,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 180),
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.secondaryText,
          ),
          child: Text(label),
        ),
      ),
    );
  }
}
