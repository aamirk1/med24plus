import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/catalog_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/category_card.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<MobileCategory> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() => _isLoading = true);
    final cats = await CatalogService.instance.getCategories();
    if (mounted) {
      setState(() {
        _categories = cats;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Therapeutic Categories'),
        centerTitle: false,
      ),
      body: Column(
        children: [
          if (_isLoading)
            const LinearProgressIndicator(
              minHeight: 2,
              color: AppColors.primary,
              backgroundColor: AppColors.primaryLight,
            ),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _loadCategories,
              child: _categories.isEmpty && !_isLoading
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.category_outlined, size: 48, color: AppColors.secondaryText),
                            const SizedBox(height: 16),
                            const Text(
                              'No Categories Found',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.mainText),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Therapeutic catalog taxonomy will update shortly.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              onPressed: _loadCategories,
                              icon: const Icon(Icons.refresh, size: 16),
                              label: const Text('Refresh', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                    )
                  : GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.05,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  return AnimatedFadeSlide(
                    delay: Duration(milliseconds: index * 35),
                    child: CategoryCard(
                      category: cat,
                      onTap: () => context.push(
                          '/products?category=${Uri.encodeComponent(cat.name)}&categoryId=${cat.id}'),
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
}
