import 'package:flutter/foundation.dart';
import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';

class CartItem {
  final MobileProduct product;
  int quantity;

  CartItem({required this.product, required this.quantity});
}

class CartService extends ChangeNotifier {
  static final CartService instance = CartService._internal();

  final ApiClient _apiClient = ApiClient.instance;

  CartService._internal() {
    // Initial sample cart items
    _items = [
      CartItem(product: MockData.products[0], quantity: 1), // Accu-Chek
      CartItem(product: MockData.products[1], quantity: 2), // Calcirol D3
    ];
  }

  late List<CartItem> _items;

  List<CartItem> get items => List.unmodifiable(_items);

  /// Number of distinct products in the cart (shown on the badge)
  int get distinctCount => _items.length;

  /// Total sum of all item quantities in the cart
  int get totalItemCount => _items.fold<int>(0, (sum, i) => sum + i.quantity);

  double get subtotal => _items.fold<double>(
        0.0,
        (sum, item) => sum + (item.product.sellingPrice * item.quantity),
      );

  double get mrpTotal => _items.fold<double>(
        0.0,
        (sum, item) => sum + (item.product.mrp * item.quantity),
      );

  double get savings => mrpTotal - subtotal;

  bool get isEmpty => _items.isEmpty;

  /// Fetch cart from backend if authenticated
  Future<void> fetchServerCart() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.cart);
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        if (data is Map && data.containsKey('items')) {
          final itemsList = data['items'] as List;
          if (itemsList.isNotEmpty) {
            _items = itemsList.map((item) {
              final productJson = item['product'] as Map<String, dynamic>;
              final qty = (item['quantity'] as num?)?.toInt() ?? 1;
              return CartItem(
                product: MobileProduct.fromJson(productJson),
                quantity: qty,
              );
            }).toList();
            notifyListeners();
          }
        }
      }
    } catch (_) {}
  }

  void addItem(MobileProduct product, [int quantity = 1]) {
    final existingIndex = _items.indexWhere((i) => i.product.id == product.id);
    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }
    notifyListeners();
    _syncItemToServer(product.id, quantity);
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    notifyListeners();
  }

  void removeAt(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      notifyListeners();
    }
  }

  void insertItem(int index, CartItem item) {
    _items.insert(index, item);
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    final existingIndex = _items.indexWhere((i) => i.product.id == productId);
    if (existingIndex >= 0) {
      _items[existingIndex].quantity = quantity;
      notifyListeners();
      _syncItemToServer(productId, quantity);
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }

  Future<void> _syncItemToServer(String productId, int quantity) async {
    try {
      await _apiClient.dio.post(
        ApiEndpoints.cartItems,
        data: {
          'product_id': productId,
          'quantity': quantity,
        },
      );
    } catch (_) {}
  }
}

