import 'package:dio/dio.dart';
import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';
import 'cart_service.dart';

/// Result object for order placement
class OrderCreationResult {
  final bool success;
  final MobileOrder? order;
  final String? errorMessage;
  final bool isAuthError;

  const OrderCreationResult({
    required this.success,
    this.order,
    this.errorMessage,
    this.isAuthError = false,
  });
}

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
  Future<OrderCreationResult> createOrder({
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
          return OrderCreationResult(
            success: true,
            order: MobileOrder.fromJson(data),
          );
        }
      }
      return const OrderCreationResult(
        success: false,
        errorMessage: 'Unable to process order response from server.',
      );
    } on DioException catch (dioErr) {
      // ignore: avoid_print
      print('[OrderService] createOrder DioException: ${dioErr.type} - ${dioErr.message} response: ${dioErr.response?.data}');

      final statusCode = dioErr.response?.statusCode;
      final respData = dioErr.response?.data;

      if (statusCode == 401 || statusCode == 403) {
        return const OrderCreationResult(
          success: false,
          isAuthError: true,
          errorMessage: 'You must be logged in to place an order. Please sign in.',
        );
      }

      if (respData is Map) {
        final detail = respData['detail'] ?? respData['message'] ?? respData['error'];
        if (detail != null) {
          final detailStr = detail.toString();
          if (detailStr.contains('PRESCRIPTION_REQUIRED') || detailStr.toLowerCase().contains('prescription')) {
            return const OrderCreationResult(
              success: false,
              errorMessage: 'Prescription required: This order contains prescription medicines.',
            );
          }
          if (detailStr.toLowerCase().contains('stock')) {
            return OrderCreationResult(
              success: false,
              errorMessage: 'Insufficient stock: $detailStr',
            );
          }
          return OrderCreationResult(
            success: false,
            errorMessage: detailStr,
          );
        }
      }

      if (dioErr.type == DioExceptionType.connectionTimeout ||
          dioErr.type == DioExceptionType.receiveTimeout ||
          dioErr.type == DioExceptionType.connectionError) {
        return const OrderCreationResult(
          success: false,
          errorMessage: 'Could not connect to the server. Please check your internet connection and verify backend is running.',
        );
      }

      return OrderCreationResult(
        success: false,
        errorMessage: 'Order placement failed: ${dioErr.response?.statusMessage ?? dioErr.message ?? "Unknown error"}',
      );
    } catch (e) {
      // ignore: avoid_print
      print('[OrderService] createOrder error: $e');
      return OrderCreationResult(
        success: false,
        errorMessage: 'An unexpected error occurred while placing your order: $e',
      );
    }
  }
}
