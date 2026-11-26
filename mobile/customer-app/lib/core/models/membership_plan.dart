import 'package:flutter/foundation.dart';

class MembershipPlan {
  final String id;
  final String name;
  final String slug;
  final String? badge;
  final double price;
  final double originalPrice;
  final int durationMonths;
  final int medicineDiscountPercent;
  final int diagnosticDiscountPercent;
  final bool freeDelivery;
  final String? welcomeKit;
  final List<String> perks;
  final int subscribersCount;
  final bool isActive;
  final String? createdAt;

  const MembershipPlan({
    required this.id,
    required this.name,
    required this.slug,
    this.badge,
    required this.price,
    required this.originalPrice,
    required this.durationMonths,
    required this.medicineDiscountPercent,
    required this.diagnosticDiscountPercent,
    required this.freeDelivery,
    this.welcomeKit,
    required this.perks,
    this.subscribersCount = 0,
    this.isActive = true,
    this.createdAt,
  });

  int get savingsPercent {
    if (originalPrice > price && originalPrice > 0) {
      return (((originalPrice - price) / originalPrice) * 100).round();
    }
    return 0;
  }

  factory MembershipPlan.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      if (val is String) {
        return double.tryParse(val.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
      }
      return 0.0;
    }

    int parseInt(dynamic val, [int fallback = 0]) {
      if (val == null) return fallback;
      if (val is num) return val.toInt();
      if (val is String) {
        return int.tryParse(val.replaceAll(RegExp(r'[^0-9]'), '')) ?? fallback;
      }
      return fallback;
    }

    List<String> parsePerks(dynamic val) {
      if (val is List) {
        return val.map((e) => e.toString()).toList();
      }
      return [];
    }

    return MembershipPlan(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Med24Plus VIP Plan',
      slug: json['slug']?.toString() ?? '',
      badge: json['badge']?.toString(),
      price: parseDouble(json['price']),
      originalPrice: parseDouble(json['original_price'] ?? json['originalPrice']),
      durationMonths: parseInt(json['duration_months'] ?? json['durationMonths'], 12),
      medicineDiscountPercent: parseInt(json['medicine_discount_percent'] ?? json['medicineDiscountPercent'], 20),
      diagnosticDiscountPercent: parseInt(json['diagnostic_discount_percent'] ?? json['diagnosticDiscountPercent'], 50),
      freeDelivery: json['free_delivery'] == true || json['freeDelivery'] == true,
      welcomeKit: json['welcome_kit']?.toString() ?? json['welcomeKit']?.toString(),
      perks: parsePerks(json['perks']),
      subscribersCount: parseInt(json['subscribers_count'] ?? json['subscribersCount'], 0),
      isActive: json['is_active'] != false,
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'badge': badge,
        'price': price,
        'original_price': originalPrice,
        'duration_months': durationMonths,
        'medicine_discount_percent': medicineDiscountPercent,
        'diagnostic_discount_percent': diagnosticDiscountPercent,
        'free_delivery': freeDelivery,
        'welcome_kit': welcomeKit,
        'perks': perks,
        'subscribers_count': subscribersCount,
        'is_active': isActive,
        'created_at': createdAt,
      };

  /// Default active fallback plans matching admin panel & backend seed
  static const List<MembershipPlan> defaultPlans = [
    MembershipPlan(
      id: 'plan-gold-12m',
      name: 'Med24Plus Member Plan (Gold VIP)',
      slug: 'med24plus-gold-vip',
      badge: 'Most Popular',
      price: 499.0,
      originalPrice: 1199.0,
      durationMonths: 12,
      medicineDiscountPercent: 26,
      diagnosticDiscountPercent: 60,
      freeDelivery: true,
      welcomeKit: 'Free Basic Blood Glucose Monitor Kit',
      perks: [
        'Up to 26% Flat OFF on all medicines & chronic refills',
        'Up to 60% Discount on Diagnostics & Pathology Tests',
        'Free Basic Blood Glucose Test Kit delivered home',
        'Zero Delivery Fee on all orders across India',
        'Priority 24/7 Supervising Pharmacist Consultation',
      ],
      subscribersCount: 1420,
      isActive: true,
    ),
    MembershipPlan(
      id: 'plan-silver-6m',
      name: 'Med24Plus Silver Care',
      slug: 'med24plus-silver-care',
      badge: 'Entry Choice',
      price: 299.0,
      originalPrice: 599.0,
      durationMonths: 6,
      medicineDiscountPercent: 18,
      diagnosticDiscountPercent: 40,
      freeDelivery: true,
      welcomeKit: 'Health Checkup Voucher ₹250',
      perks: [
        '18% Flat OFF on all prescription medications',
        'Up to 40% Discount on Diagnostic Lab Tests',
        'Free Home Delivery on orders above ₹199',
        'Standard Doctor Teleconsultation discount',
      ],
      subscribersCount: 348,
      isActive: true,
    ),
    MembershipPlan(
      id: 'plan-family-12m',
      name: 'Med24Plus Platinum Family Care',
      slug: 'med24plus-platinum-family',
      badge: 'Best Value',
      price: 899.0,
      originalPrice: 1999.0,
      durationMonths: 12,
      medicineDiscountPercent: 30,
      diagnosticDiscountPercent: 70,
      freeDelivery: true,
      welcomeKit: 'Family First Aid & Vital Health Monitoring Kit',
      perks: [
        'Coverage for up to 6 family members under 1 account',
        'Up to 30% OFF on all prescription & OTC medications',
        'Up to 70% Discount on comprehensive health checkups',
        'Unlimited Free 24-hr Express Deliveries',
        'Free Monthly Vital Health Screenings at home',
      ],
      subscribersCount: 780,
      isActive: true,
    ),
  ];
}
