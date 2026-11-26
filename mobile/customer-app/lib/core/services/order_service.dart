import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';
import 'cart_service.dart';

/// Customer Order API Service (Phase 8 FEFO Statutory Dispensing)
class OrderService {
  OrderService._();
  static final OrderService instance = OrderService._();

  final ApiClient _apiClient = ApiClient.instance;

  /// Fetch customer orders with optional status filter ('active', 'completed', 'cancelled')
  Future<List<MobileOrder>> getOrders({String? status}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (status != null && status.isNotEmpty && status.toLowerCase() != 'all') {
        queryParams['status'] = status;
      }

      final response = await _apiClient.dio.get(
        ApiEndpoints.orders,
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
              .map((item) => MobileOrder.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (_) {}

    return [];
  }

  /// Fetch order details by ID
  Future<MobileOrder?> getOrderById(String orderId) async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.orderDetail(orderId));
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        if (data is Map<String, dynamic>) {
          return MobileOrder.fromJson(data);
        }
      }
    } catch (_) {}

    return null;
  }

  /// Create new statutory dispensing order with backend Razorpay initialization
  Future<MobileOrder?> createOrder({
    required String addressId,
    required String paymentMethod,
    required List<CartItem> items,
    String? couponCode,
    double? discountAmount,
  }) async {
    try {
      final body = {
        'delivery_address_id': addressId,
        'shipping_address_id': addressId,
        'payment_method': paymentMethod,
        'coupon_code': couponCode,
        'discount_amount': discountAmount ?? 0.0,
        'items': items.map((i) => {
          'product_id': i.product.id,
          'quantity': i.quantity,
          'unit_price': i.product.sellingPrice,
        }).toList(),
      };

      final response = await _apiClient.dio.post(
        ApiEndpoints.orders,
        data: body,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) && response.data != null) {
        final data = response.data['data'] ?? response.data;
        if (data is Map<String, dynamic>) {
          return MobileOrder.fromJson(data);
        }
      }
    } catch (e) {
      // ignore: avoid_print
      print('[OrderService] createOrder error: $e');
    }

    return null;
  }
}
