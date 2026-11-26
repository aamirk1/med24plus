import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/cart_service.dart';
import '../../../core/services/catalog_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_empty_widget.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/counter_badges.dart';
import '../../../core/widgets/product_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  Timer? _debounce;
  List<MobileProduct> _results = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    final prods = await CatalogService.instance.getProducts();
    if (mounted) {
      setState(() => _results = prods);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String val) {
    setState(() => _query = val);
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () async {
      setState(() => _isSearching = true);
      final products = await CatalogService.instance.getProducts(search: val);
      if (mounted) {
        setState(() {
          _results = products;
          _isSearching = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
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
          padding: const EdgeInsets.only(right: 4, left: 14),
          child: TextField(
            controller: _searchController,
            autofocus: true,
            onChanged: _onSearchChanged,
            style: const TextStyle(fontSize: 13, color: AppColors.mainText),
            decoration: InputDecoration(
              hintText: AppStrings.searchHint,
              hintStyle:
                  const TextStyle(color: AppColors.secondaryText, fontSize: 13),
              prefixIcon: const Icon(Icons.search,
                  size: 20, color: AppColors.secondaryText),
              suffixIcon: _query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        _onSearchChanged('');
                      },
                    )
                  : null,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
      body: Column(
        children: [
          if (_isSearching)
            const LinearProgressIndicator(
              minHeight: 2,
              color: AppColors.primary,
              backgroundColor: AppColors.primaryLight,
            ),
          Expanded(
            child: _results.isEmpty
                ? const AppEmptyWidget(
                    icon: Icons.search_off_rounded,
                    title: 'No Medicines Found',
                    message:
                        'Try searching by active salt composition or generic name.',
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.70,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final product = _results[index];
                      return AnimatedFadeSlide(
                        delay: Duration(milliseconds: index * 20),
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
                  ),
          ),
        ],
      ),
    );
  }
}
