import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/mock/mock_data.dart';
import '../../../core/services/order_service.dart';
import '../../../core/widgets/animated_entry.dart';
import '../../../core/widgets/app_badge.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  int _selectedTabIndex = 0;
  static const List<String> _tabs = ['All Orders', 'Processing', 'Delivered'];
  List<MobileOrder> _allOrders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    final orders = await OrderService.instance.getOrders();
    if (mounted) {
      setState(() {
        _allOrders = orders;
        _isLoading = false;
      });
    }
  }

  List<MobileOrder> _getFilteredOrders() {
    if (_selectedTabIndex == 1) {
      return _allOrders
          .where((o) =>
              o.status.toLowerCase().contains('process') ||
              o.status.toLowerCase().contains('dispatch'))
          .toList();
    } else if (_selectedTabIndex == 2) {
      return _allOrders
          .where((o) => o.status.toLowerCase().contains('deliver'))
          .toList();
    }
    return _allOrders;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredOrders();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Orders & History'),
      ),
      body: Column(
        children: [
          if (_isLoading)
            const LinearProgressIndicator(
              minHeight: 2,
              color: AppColors.primary,
              backgroundColor: AppColors.primaryLight,
            ),
          AnimatedSegmentedTabs(
            tabs: _tabs,
            selectedIndex: _selectedTabIndex,
            onTabSelected: (index) => setState(() => _selectedTabIndex = index),
          ),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _loadOrders,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: filtered.isEmpty
                    ? ListView(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.receipt_long_outlined,
                                  size: 48,
                                  color: AppColors.secondaryText.withValues(alpha: 0.4),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'No orders in this category',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.secondaryText,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                      key: ValueKey('orders_list_$_selectedTabIndex'),
                      padding: const EdgeInsets.all(16),
                      itemCount: filtered.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final order = filtered[index];
                        return AnimatedFadeSlide(
                          delay: Duration(milliseconds: index * 40),
                          child: AnimatedTapScale(
                            onTap: () => context.push('/order/${order.id}'),
                            scaleDown: 0.98,
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.border),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        order.orderNumber,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.mainText,
                                        ),
                                      ),
                                      AppBadge.orderStatus(order.status),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    order.date,
                                    style: const TextStyle(
                                        fontSize: 11, color: AppColors.secondaryText),
                                  ),
                                  const Divider(height: 20, color: AppColors.border),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${order.itemCount} items • ${order.paymentMethod}',
                                        style: const TextStyle(
                                            fontSize: 11, color: AppColors.secondaryText),
                                      ),
                                      Text(
                                        '₹${order.totalAmount.toStringAsFixed(0)}',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
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
          ),
        ],
      ),
    );
  }
}
