import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/counter_badges.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/app_empty_widget.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = MockData.products.where((p) {
      if (_query.isEmpty) return true;
      final q = _query.toLowerCase();
      return p.name.toLowerCase().contains(q) ||
          p.brand.toLowerCase().contains(q) ||
          p.saltComposition.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        titleSpacing: 0,
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: CartBadgeIcon(iconSize: 22),
          ),
        ],
        title: Padding(
          padding: const EdgeInsets.only(right: 8),
          child: TextField(
            controller: _searchController,
            autofocus: true,
            onChanged: (val) => setState(() => _query = val),
            style: const TextStyle(fontSize: 13, color: AppColors.mainText),
            decoration: InputDecoration(
              hintText: AppStrings.searchHint,
              hintStyle: const TextStyle(color: AppColors.secondaryText, fontSize: 13),
              prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.secondaryText),
              suffixIcon: _query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    )
                  : null,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              filled: true,
              fillColor: AppColors.background,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),
      ),
      body: filtered.isEmpty
          ? const AppEmptyWidget(
              icon: Icons.search_off_rounded,
              title: 'No Medicines Found',
              message: 'Try searching by active salt composition or generic name.',
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.58,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final product = filtered[index];
                return AnimatedFadeSlide(
                  delay: Duration(milliseconds: index * 25),
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
            ),
    );
  }
}

