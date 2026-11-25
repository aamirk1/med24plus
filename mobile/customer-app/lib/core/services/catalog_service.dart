import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';

/// Catalog API Service for fetching real-time medicines, categories, and brand substitutes
/// with intelligent, zero-friction fallback to MockData when backend is booting or offline.
class CatalogService {
  CatalogService._();
  static final CatalogService instance = CatalogService._();

  final ApiClient _apiClient = ApiClient.instance;

  /// Fetch public products with optional category, search, or pagination filter
  Future<List<MobileProduct>> getProducts({
    String? categoryId,
    String? search,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'page_size': pageSize,
      };
      if (categoryId != null && categoryId.isNotEmpty) {
        queryParams['category_id'] = categoryId;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }

      final response = await _apiClient.dio.get(
        ApiEndpoints.products,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'];
        List itemsJson = [];
        if (data is Map && data.containsKey('items')) {
          itemsJson = data['items'] as List;
        } else if (data is List) {
          itemsJson = data;
        }

        if (itemsJson.isNotEmpty) {
          return itemsJson
              .map((item) => MobileProduct.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (_) {
      // Graceful fallback to offline catalog cache
    }

    // Fallback to MockData
    List<MobileProduct> products = MockData.products;
    if (search != null && search.trim().isNotEmpty) {
      final q = search.trim().toLowerCase();
      products = products.where((p) {
        return p.name.toLowerCase().contains(q) ||
            p.brand.toLowerCase().contains(q) ||
            p.saltComposition.toLowerCase().contains(q);
      }).toList();
    }
    if (categoryId != null && categoryId.isNotEmpty) {
      products = products.where((p) {
        return p.category.toLowerCase() == categoryId.toLowerCase();
      }).toList();
    }
    return products;
  }

  /// Fetch single product details by ID or slug
  Future<MobileProduct> getProductById(String id) async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.productDetail(id));
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        if (data is Map<String, dynamic>) {
          return MobileProduct.fromJson(data);
        }
      }
    } catch (_) {}

    return MockData.products.firstWhere(
      (p) => p.id == id,
      orElse: () => MockData.products.first,
    );
  }

  /// Fetch public medicine taxonomy categories
  Future<List<MobileCategory>> getCategories() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.categories);
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'];
        List itemsJson = [];
        if (data is Map && data.containsKey('items')) {
          itemsJson = data['items'] as List;
        } else if (data is List) {
          itemsJson = data;
        }

        if (itemsJson.isNotEmpty) {
          return itemsJson
              .map((item) => MobileCategory.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (_) {}

    return MockData.categories;
  }

  /// Fetch brand substitute options for therapeutic switching
  Future<List<BrandSubstituteOption>> getSubstitutes(String productId) async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.productSubstitutes(productId));
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'];
        if (data is Map && data.containsKey('substitutes')) {
          final list = data['substitutes'] as List;
          return list.map((item) {
            final m = item as Map<String, dynamic>;
            return BrandSubstituteOption(
              id: m['id']?.toString() ?? '',
              name: m['name']?.toString() ?? '',
              brand: m['brand_name']?.toString() ?? '',
              genericName: m['generic_name']?.toString() ?? '',
              strength: m['strength']?.toString() ?? '500 mg',
              mrp: (m['mrp'] as num?)?.toDouble() ?? 0.0,
              sellingPrice: (m['selling_price'] as num?)?.toDouble() ?? 0.0,
              savingsAmount: (m['savings_amount'] as num?)?.toDouble() ?? 0.0,
              savingsPercent: (m['savings_percent'] as num?)?.toInt() ?? 0,
              badge: m['badge']?.toString() ?? 'Best Value',
              isOriginal: m['is_original'] == true,
            );
          }).toList();
        }
      }
    } catch (_) {}

    return MockData.getSubstitutesForProduct(productId);
  }
}
