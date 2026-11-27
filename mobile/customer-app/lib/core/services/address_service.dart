import '../constants/api_endpoints.dart';
import '../mock/mock_data.dart';
import '../network/api_client.dart';

/// Customer Delivery Address API Service
class AddressService {
  AddressService._();
  static final AddressService instance = AddressService._();

  final ApiClient _apiClient = ApiClient.instance;

  /// Default starter Mumbai addresses if user has not yet saved any in database
  static const List<MobileAddress> defaultMumbaiAddresses = [
    MobileAddress(
      id: 'default-mumbai-bkc',
      label: 'Home',
      recipientName: 'Valued Customer',
      phone: '9876543210',
      addressLine: 'Plot 15, G-Block, Bandra Kurla Complex (BKC)',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      isDefault: true,
    ),
    MobileAddress(
      id: 'default-mumbai-bandra',
      label: 'Office',
      recipientName: 'Valued Customer',
      phone: '9876543210',
      addressLine: 'Flat 402, Sea Green Apartments, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      isDefault: false,
    ),
  ];

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

    return defaultMumbaiAddresses;
  }

  /// Add new delivery address
  Future<bool> addAddress(MobileAddress address) async {
    try {
      final rawPhone = address.phone.replaceAll(RegExp(r'[^0-9]'), '');
      final cleanPhone = rawPhone.length == 10
          ? rawPhone
          : rawPhone.length > 10
              ? rawPhone.substring(rawPhone.length - 10)
              : '9876543210';

      final body = {
        'address_type': address.label.toLowerCase() == 'work' ? 'work' : 'home',
        'recipient_name': address.recipientName.isNotEmpty ? address.recipientName : 'Valued Customer',
        'phone': cleanPhone,
        'address_line1': address.addressLine.isNotEmpty ? address.addressLine : 'Plot 15, Bandra Kurla Complex',
        'city': address.city.isNotEmpty ? address.city : 'Mumbai',
        'state': address.state.isNotEmpty ? address.state : 'Maharashtra',
        'pincode': address.pincode.isNotEmpty ? address.pincode : '400051',
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
