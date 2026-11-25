import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/product_card.dart';

class ProductListScreen extends StatefulWidget {
  final String? category;

  const ProductListScreen({super.key, this.category});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  String _selectedSchedule = 'ALL';

  static const List<Map<String, String>> _filterOptions = [
    {'value': 'ALL', 'label': 'All Drugs'},
    {'value': 'OTC', 'label': 'OTC Non-Rx'},
    {'value': 'SCHEDULE_H', 'label': 'Schedule H (Rx)'},
    {'value': 'DEVICE', 'label': 'Medical Devices'},
    {'value': 'AYUSH', 'label': 'Ayurveda & AYUSH'},
  ];

  @override
  Widget build(BuildContext context) {
    final title = widget.category ?? 'All Medicines & Essentials';

    final products = MockData.products.where((p) {
      final matchesCat = widget.category == null || p.category == widget.category;
      final matchesSched = _selectedSchedule == 'ALL' || p.schedule == _selectedSchedule;
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
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined, size: 22),
            onPressed: () => context.push('/cart'),
          ),
        ],
      ),
      body: Column(
        children: [
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

          // Animated Grid
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: products.isEmpty
                  ? Center(
                      key: const ValueKey('no_products_found'),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.medication_outlined,
                            size: 48,
                            color: AppColors.secondaryText.withValues(alpha: 0.4),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'No formulations found in this category',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.secondaryText,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  : GridView.builder(
                      key: ValueKey('product_grid_$_selectedSchedule'),
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.58,
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
                            onTap: () => context.push('/product/${product.id}'),
                            onAddToCart: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('${product.name} added to cart')),
                              );
                            },
                          ),
                        );
                      },
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
