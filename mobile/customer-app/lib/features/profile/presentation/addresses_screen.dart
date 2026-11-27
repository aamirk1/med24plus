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
  List<MobileAddress> _addresses = [];
  bool _isLoading = true;

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
              child: _addresses.isEmpty && !_isLoading
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.location_off_outlined, size: 48, color: AppColors.secondaryText),
                            SizedBox(height: 16),
                            Text(
                              'No Saved Addresses',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.mainText),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Add your home or office delivery address.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.separated(
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
          onPressed: () => _showAddAddressSheet(context),
        ),
      ),
    );
  }

  void _showAddAddressSheet(BuildContext context) {
    final nameCtrl = TextEditingController(text: 'Customer');
    final phoneCtrl = TextEditingController(text: '9876543210');
    final lineCtrl = TextEditingController(text: 'Flat 101, Sagar Darshan');
    final areaCtrl = TextEditingController(text: 'Bandra West');
    final pinCtrl = TextEditingController(text: '400050');
    String selectedType = 'Home';
    bool isDefault = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Add Mumbai Delivery Address',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.mainText,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ChoiceChip(
                      label: const Text('Home'),
                      selected: selectedType == 'Home',
                      onSelected: (val) {
                        if (val) setModalState(() => selectedType = 'Home');
                      },
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Office / Work'),
                      selected: selectedType == 'Office',
                      onSelected: (val) {
                        if (val) setModalState(() => selectedType = 'Office');
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Recipient Full Name',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: '10-Digit Mobile Number',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: lineCtrl,
                  decoration: const InputDecoration(
                    labelText: 'House / Flat / Building Name',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: areaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Street / Area / Locality (Mumbai)',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: pinCtrl,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: const InputDecoration(
                          labelText: 'PIN Code',
                          counterText: '',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        initialValue: 'Mumbai',
                        enabled: false,
                        decoration: const InputDecoration(
                          labelText: 'City',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        initialValue: 'Maharashtra',
                        enabled: false,
                        decoration: const InputDecoration(
                          labelText: 'State',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Checkbox(
                      value: isDefault,
                      onChanged: (val) => setModalState(() => isDefault = val ?? true),
                    ),
                    const Text('Set as default delivery address', style: TextStyle(fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    text: 'Save Address',
                    onPressed: () async {
                      if (pinCtrl.text.trim().length != 6) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a valid 6-digit Mumbai PIN code')),
                        );
                        return;
                      }
                      final fullAddressLine = areaCtrl.text.trim().isNotEmpty
                          ? '${lineCtrl.text.trim()}, ${areaCtrl.text.trim()}'
                          : lineCtrl.text.trim();

                      final newAddress = MobileAddress(
                        id: 'mumbai_${DateTime.now().millisecondsSinceEpoch}',
                        label: selectedType,
                        recipientName: nameCtrl.text.trim(),
                        phone: phoneCtrl.text.trim(),
                        addressLine: fullAddressLine,
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: pinCtrl.text.trim(),
                        isDefault: isDefault,
                      );

                      Navigator.pop(ctx);
                      final ok = await AddressService.instance.addAddress(newAddress);
                      await _loadAddresses();

                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(ok
                                ? 'Address saved successfully for Mumbai delivery!'
                                : 'Address saved locally'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
