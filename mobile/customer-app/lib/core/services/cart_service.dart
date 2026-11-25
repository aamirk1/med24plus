import 'package:flutter/foundation.dart';
import '../mock/mock_data.dart';

class CartItem {
  final MobileProduct product;
  int quantity;

  CartItem({required this.product, required this.quantity});
}

class CartService extends ChangeNotifier {
  static final CartService instance = CartService._internal();

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

  void addItem(MobileProduct product, [int quantity = 1]) {
    final existingIndex = _items.indexWhere((i) => i.product.id == product.id);
    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }
    notifyListeners();
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
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
