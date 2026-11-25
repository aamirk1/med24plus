import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/address_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_button.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  List<MobileAddress> _addresses = MockData.addresses;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    final addrs = await AddressService.instance.getAddresses();
    if (mounted) {
      setState(() {
        _addresses = addrs;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Saved Delivery Addresses'),
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
              onRefresh: _loadAddresses,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _addresses.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final addr = _addresses[index];
                  return AnimatedFadeSlide(
                    delay: Duration(milliseconds: 50 * index),
                    child: AnimatedTapScale(
                      onTap: () {},
                      scaleDown: 0.98,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: addr.isDefault ? AppColors.primary : AppColors.border,
                            width: addr.isDefault ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      addr.label == 'Home' ? Icons.home_outlined : Icons.work_outline,
                                      size: 18,
                                      color: AppColors.primary,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      addr.label,
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.mainText),
                                    ),
                                    if (addr.isDefault) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryLight,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'Default',
                                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.primary),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                IconButton(
                                  icon: const Icon(Icons.more_vert, size: 18, color: AppColors.secondaryText),
                                  onPressed: () {},
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${addr.recipientName} • ${addr.phone}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.mainText),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${addr.addressLine}, ${addr.city} - ${addr.pincode}',
                              style: const TextStyle(fontSize: 11, color: AppColors.secondaryText, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: AppButton(
          text: 'Add New Address',
          icon: const Icon(Icons.add, size: 18, color: Colors.white),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Address registered successfully')),
            );
          },
        ),
      ),
    );
  }
}
