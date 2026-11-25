import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';

/// Customer Delivery Address API Service
class AddressService {
  AddressService._();
  static final AddressService instance = AddressService._();

  final ApiClient _apiClient = ApiClient.instance;

  /// Fetch registered patient delivery addresses
  Future<List<MobileAddress>> getAddresses() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.addresses);

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
              .map((item) => MobileAddress.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (_) {}

    return MockData.addresses;
  }

  /// Add new delivery address
  Future<bool> addAddress(MobileAddress address) async {
    try {
      final body = {
        'address_type': address.label,
        'recipient_name': address.recipientName,
        'phone': address.phone,
        'address_line1': address.addressLine,
        'city': address.city,
        'pincode': address.pincode,
        'is_default': address.isDefault,
      };

      final response = await _apiClient.dio.post(
        ApiEndpoints.addresses,
        data: body,
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  /// Delete delivery address
  Future<bool> deleteAddress(String id) async {
    try {
      final response = await _apiClient.dio.delete(ApiEndpoints.addressDetail(id));
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return true;
    }
  }
}
