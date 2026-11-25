import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';

class CartItem {
  final MobileProduct product;
  int quantity;

  CartItem({required this.product, required this.quantity});
}

class CouponResult {
  final bool isValid;
  final String message;
  final double discount;
  final String? code;

  const CouponResult({
    required this.isValid,
    required this.message,
    this.discount = 0.0,
    this.code,
  });
}

class CartService extends ChangeNotifier {
  static final CartService instance = CartService._internal();

  final ApiClient _apiClient = ApiClient.instance;

  CartService._internal() {
    _items = [];
    fetchActiveCoupons();
  }

  late List<CartItem> _items;

  String? _appliedCouponCode;
  double _couponDiscount = 0.0;
  String? _couponDescription;
  List<MobileCoupon> _availableCoupons = [];

  List<CartItem> get items => List.unmodifiable(_items);
  List<MobileCoupon> get availableCoupons => List.unmodifiable(_availableCoupons);

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

  String? get appliedCouponCode => _appliedCouponCode;
  double get couponDiscount => _couponDiscount;
  String? get couponDescription => _couponDescription;

  double get totalPayable {
    final payable = subtotal - _couponDiscount;
    return payable > 0 ? payable : 0.0;
  }

  bool get isEmpty => _items.isEmpty;

  /// Fetch active marketing coupons configured on the admin panel
  Future<void> fetchActiveCoupons() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.coupons);
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        List itemsList = [];
        if (data is List) {
          itemsList = data;
        } else if (data is Map && data.containsKey('items')) {
          itemsList = data['items'] as List;
        }

        if (itemsList.isNotEmpty) {
          _availableCoupons = itemsList
              .map((i) => MobileCoupon.fromJson(i as Map<String, dynamic>))
              .where((c) => c.isActive)
              .toList();
          _revalidateCoupon();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

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
            _revalidateCoupon();
            notifyListeners();
          }
        }
      }
    } catch (_) {}
  }

  /// Apply coupon code dynamically fetched & validated via backend API
  Future<CouponResult> applyCoupon(String rawCode) async {
    final code = rawCode.trim().toUpperCase();
    if (code.isEmpty) {
      return const CouponResult(
        isValid: false,
        message: 'Please enter a coupon code',
      );
    }

    final orderSubtotal = subtotal;
    if (orderSubtotal <= 0) {
      return const CouponResult(
        isValid: false,
        message: 'Your cart is empty',
      );
    }

    // 1. Live Validation against Backend Server API
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.validateCoupon,
        data: {
          'code': code,
          'cart_total': orderSubtotal,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        final isValid = data['is_valid'] == true;
        final disc = (data['discount_amount'] as num?)?.toDouble() ?? 0.0;
        final desc = data['description']?.toString() ?? 'Coupon discount applied';
        final msg = response.data['message']?.toString() ?? 'Coupon "$code" applied!';

        if (isValid) {
          _appliedCouponCode = code;
          _couponDiscount = disc.clamp(0.0, orderSubtotal);
          _couponDescription = desc;
          notifyListeners();

          return CouponResult(
            isValid: true,
            message: msg,
            discount: _couponDiscount,
            code: code,
          );
        }
      }
    } on DioException catch (dioErr) {
      final errData = dioErr.response?.data;
      String errMsg = 'Coupon code "$code" is invalid or expired.';
      if (errData is Map) {
        errMsg = errData['message']?.toString() ?? errData['detail']?.toString() ?? errMsg;
      }
      return CouponResult(isValid: false, message: errMsg);
    } catch (_) {}

    // 2. Dynamic Fallback against active marketing coupons received from admin panel
    MobileCoupon? matching;
    for (final c in _availableCoupons) {
      if (c.code.toUpperCase() == code) {
        matching = c;
        break;
      }
    }

    if (matching == null) {
      return CouponResult(
        isValid: false,
        message: 'Coupon "$code" is invalid or not active.',
      );
    }

    if (orderSubtotal < matching.minOrderValue) {
      return CouponResult(
        isValid: false,
        message: '${matching.code} requires minimum cart value of ₹${matching.minOrderValue.toInt()}',
      );
    }

    double calculatedDiscount = 0.0;
    if (matching.discountType == 'PERCENT') {
      calculatedDiscount = (orderSubtotal * (matching.value / 100.0));
      if (matching.maxDiscountAmount != null && matching.maxDiscountAmount! > 0) {
        if (calculatedDiscount > matching.maxDiscountAmount!) {
          calculatedDiscount = matching.maxDiscountAmount!;
        }
      }
    } else {
      calculatedDiscount = matching.value;
    }

    if (calculatedDiscount > orderSubtotal) {
      calculatedDiscount = orderSubtotal;
    }

    _appliedCouponCode = code;
    _couponDiscount = calculatedDiscount;
    _couponDescription = matching.description;
    notifyListeners();

    return CouponResult(
      isValid: true,
      message: 'Coupon "$code" applied! Saved ₹${calculatedDiscount.toStringAsFixed(0)}',
      discount: calculatedDiscount,
      code: code,
    );
  }

  /// Remove currently applied coupon
  void removeCoupon() {
    _appliedCouponCode = null;
    _couponDiscount = 0.0;
    _couponDescription = null;
    notifyListeners();
  }

  void _revalidateCoupon() {
    if (_appliedCouponCode == null) return;
    final code = _appliedCouponCode!;
    final orderSubtotal = subtotal;

    if (orderSubtotal <= 0) {
      removeCoupon();
      return;
    }

    // Revalidate against available coupons
    MobileCoupon? matching;
    for (final c in _availableCoupons) {
      if (c.code.toUpperCase() == code) {
        matching = c;
        break;
      }
    }

    if (matching != null) {
      if (orderSubtotal < matching.minOrderValue) {
        removeCoupon();
        return;
      }

      double calculatedDiscount = 0.0;
      if (matching.discountType == 'PERCENT') {
        calculatedDiscount = (orderSubtotal * (matching.value / 100.0));
        if (matching.maxDiscountAmount != null && matching.maxDiscountAmount! > 0) {
          if (calculatedDiscount > matching.maxDiscountAmount!) {
            calculatedDiscount = matching.maxDiscountAmount!;
          }
        }
      } else {
        calculatedDiscount = matching.value;
      }

      _couponDiscount = calculatedDiscount.clamp(0.0, orderSubtotal);
      _couponDescription = matching.description;
    }
  }

  void addItem(MobileProduct product, [int quantity = 1]) {
    final existingIndex = _items.indexWhere((i) => i.product.id == product.id);
    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }
    _revalidateCoupon();
    notifyListeners();
    _syncItemToServer(product.id, quantity);
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    _revalidateCoupon();
    notifyListeners();
  }

  void removeAt(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      _revalidateCoupon();
      notifyListeners();
    }
  }

  void insertItem(int index, CartItem item) {
    _items.insert(index, item);
    _revalidateCoupon();
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
      _revalidateCoupon();
      notifyListeners();
      _syncItemToServer(productId, quantity);
    }
  }

  void clearCart() {
    _items.clear();
    _appliedCouponCode = null;
    _couponDiscount = 0.0;
    _couponDescription = null;
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
