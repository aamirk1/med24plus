import 'package:flutter/foundation.dart';

@immutable
class MobileProduct {
  final String id;
  final String name;
  final String brand;
  final String category;
  final String dosageForm;
  final String saltComposition;
  final double mrp;
  final double sellingPrice;
  final int discountPercent;
  final String packSize;
  final bool requiresPrescription;
  final String schedule; // SCHEDULE_H, SCHEDULE_H1, SCHEDULE_X, OTC, DEVICE, AYUSH
  final bool inStock;
  final double rating;
  final int reviewsCount;
  final String description;
  final String imageUrl;

  const MobileProduct({
    required this.id,
    required this.name,
    required this.brand,
    required this.category,
    required this.dosageForm,
    required this.saltComposition,
    required this.mrp,
    required this.sellingPrice,
    required this.discountPercent,
    required this.packSize,
    required this.requiresPrescription,
    required this.schedule,
    required this.inStock,
    required this.rating,
    required this.reviewsCount,
    required this.description,
    this.imageUrl = '',
  });

  factory MobileProduct.fromJson(Map<String, dynamic> json) {
    // Robust double parsing for mrp and selling_price (handles num, string, or null)
    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      if (val is String) {
        return double.tryParse(val.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
      }
      return 0.0;
    }

    final mrpVal = parseDouble(json['mrp']);
    final spValRaw = parseDouble(json['selling_price']);
    final priceRaw = parseDouble(json['price']);
    final spVal = spValRaw > 0 ? spValRaw : (priceRaw > 0 ? priceRaw : mrpVal);

    int disc = 0;
    if (mrpVal > spVal && mrpVal > 0) {
      disc = (((mrpVal - spVal) / mrpVal) * 100).round();
    }

    // Resolve schedule classification
    String schedule = 'OTC';
    final rawSchedule = json['schedule_classification']?.toString() ?? json['schedule']?.toString() ?? '';
    final rawSchedUpper = rawSchedule.toUpperCase();
    if (rawSchedUpper.contains('H1')) {
      schedule = 'SCHEDULE_H1';
    } else if (rawSchedUpper.contains('H') || rawSchedUpper.contains('SCHEDULE H')) {
      schedule = 'SCHEDULE_H';
    } else if (rawSchedUpper.contains('DEVICE')) {
      schedule = 'DEVICE';
    } else if (rawSchedUpper.contains('AYUSH') || rawSchedUpper.contains('HERBAL')) {
      schedule = 'AYUSH';
    } else if (json['requires_prescription'] == true || json['is_prescription_required'] == true) {
      schedule = 'SCHEDULE_H';
    }

    // Resolve primary image URL
    String imgUrl = json['primary_image_url']?.toString() ?? json['image_url']?.toString() ?? '';
    if (imgUrl.isEmpty && json['images'] is List && (json['images'] as List).isNotEmpty) {
      final firstImg = (json['images'] as List).first;
      if (firstImg is Map) {
        imgUrl = firstImg['image_url']?.toString() ?? '';
      } else if (firstImg is String) {
        imgUrl = firstImg;
      }
    }

    // Resolve brand name
    String brandName = 'Generic';
    if (json['brand_name'] != null && json['brand_name'].toString().isNotEmpty) {
      brandName = json['brand_name'].toString();
    } else if (json['brand'] != null) {
      if (json['brand'] is Map) {
        brandName = json['brand']['name']?.toString() ?? 'Generic';
      } else {
        brandName = json['brand'].toString();
      }
    } else if (json['manufacturer'] != null && json['manufacturer'].toString().isNotEmpty) {
      brandName = json['manufacturer'].toString();
    }

    // Resolve category name
    String categoryName = 'Medicines';
    if (json['category_name'] != null && json['category_name'].toString().isNotEmpty) {
      categoryName = json['category_name'].toString();
    } else if (json['category'] != null) {
      if (json['category'] is Map) {
        categoryName = json['category']['name']?.toString() ?? 'Medicines';
      } else {
        categoryName = json['category'].toString();
      }
    }

    // In stock status
    final bool isInStock = json['is_in_stock'] == true ||
        (json['sellable_quantity'] != null && (json['sellable_quantity'] as num) > 0) ||
        (json['stock'] != null && (json['stock'] as num) > 0) ||
        (json['is_active'] != false && json['is_in_stock'] == null);

    return MobileProduct(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      brand: brandName,
      category: categoryName,
      dosageForm: json['dosage_form']?.toString() ?? 'Tablet',
      saltComposition: json['generic_name']?.toString() ?? json['salt_composition']?.toString() ?? json['composition']?.toString() ?? '',
      mrp: mrpVal,
      sellingPrice: spVal,
      discountPercent: (json['discount_percent'] as num?)?.toInt() ?? disc,
      packSize: json['pack_size']?.toString() ?? '1 Strip',
      requiresPrescription: json['requires_prescription'] == true || json['is_prescription_required'] == true,
      schedule: schedule,
      inStock: isInStock,
      rating: (json['rating'] as num?)?.toDouble() ?? 4.7,
      reviewsCount: (json['reviews_count'] as num?)?.toInt() ?? 10,
      description: json['description']?.toString() ?? json['generic_name']?.toString() ?? '',
      imageUrl: imgUrl,
    );
  }
}

class BrandSubstituteOption {
  final String id;
  final String name;
  final String brand;
  final String genericName;
  final String strength;
  final double mrp;
  final double sellingPrice;
  final double savingsAmount;
  final int savingsPercent;
  final String badge;
  final String? topTag;
  final bool isOriginal;
  final String image;
  final bool inStock;

  const BrandSubstituteOption({
    required this.id,
    required this.name,
    required this.brand,
    required this.genericName,
    required this.strength,
    required this.mrp,
    required this.sellingPrice,
    required this.savingsAmount,
    required this.savingsPercent,
    required this.badge,
    this.topTag,
    this.isOriginal = false,
    this.image = '',
    this.inStock = true,
  });
}

class MobileCategory {
  final String id;
  final String name;
  final String slug;
  final String icon;
  final int count;

  const MobileCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.icon,
    required this.count,
  });

  factory MobileCategory.fromJson(Map<String, dynamic> json) {
    return MobileCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'medication',
      count: (json['product_count'] as num?)?.toInt() ?? (json['count'] as num?)?.toInt() ?? 24,
    );
  }
}

class OrderItemSnapshot {
  final String productName;
  final String batchNumber;
  final String expiryDate;
  final int quantity;
  final double unitPrice;

  const OrderItemSnapshot({
    required this.productName,
    required this.batchNumber,
    required this.expiryDate,
    required this.quantity,
    required this.unitPrice,
  });

  factory OrderItemSnapshot.fromJson(Map<String, dynamic> json) {
    return OrderItemSnapshot(
      productName: json['product_name_snapshot']?.toString() ?? json['name']?.toString() ?? 'Medicine',
      batchNumber: json['batch_number_snapshot']?.toString() ?? json['batch']?.toString() ?? 'FEFO-ALLOC',
      expiryDate: json['expiry_date_snapshot']?.toString() ?? json['expiry']?.toString() ?? 'Valid',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? (json['unit_selling_price'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class MobileOrder {
  final String id;
  final String orderNumber;
  final String date;
  final String status;
  final double totalAmount;
  final int itemCount;
  final bool hasPrescription;
  final String paymentMethod;
  final String paymentStatus;
  final String deliveryPincode;
  final List<OrderItemSnapshot> items;
  final String? couponCode;
  final double discountAmount;

  const MobileOrder({
    required this.id,
    required this.orderNumber,
    required this.date,
    required this.status,
    required this.totalAmount,
    required this.itemCount,
    required this.hasPrescription,
    required this.paymentMethod,
    this.paymentStatus = 'pending',
    required this.deliveryPincode,
    this.items = const [],
    this.couponCode,
    this.discountAmount = 0.0,
  });

  factory MobileOrder.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List?;
    final parsedItems = rawItems != null
        ? rawItems.map((i) => OrderItemSnapshot.fromJson(i as Map<String, dynamic>)).toList()
        : <OrderItemSnapshot>[];

    return MobileOrder(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number']?.toString() ?? json['orderNumber']?.toString() ?? 'ORD-M24',
      date: json['created_at']?.toString().split('T').first ?? json['date']?.toString() ?? 'Today',
      status: json['status']?.toString() ?? 'Processing',
      totalAmount: (json['grand_total'] as num?)?.toDouble() ??
          (json['total_amount'] as num?)?.toDouble() ??
          (json['totalAmount'] as num?)?.toDouble() ??
          0.0,
      itemCount: parsedItems.isNotEmpty ? parsedItems.length : ((json['itemCount'] as num?)?.toInt() ?? 1),
      hasPrescription: json['has_prescription'] == true || json['hasPrescription'] == true,
      paymentMethod: json['payment_method']?.toString() ?? json['paymentMethod']?.toString() ?? 'Razorpay Secure',
      paymentStatus: json['payment_status']?.toString() ?? json['paymentStatus']?.toString() ?? 'pending',
      deliveryPincode: json['shipping_pincode']?.toString() ?? json['deliveryPincode']?.toString() ?? '560034',
      items: parsedItems,
      couponCode: json['coupon_code']?.toString(),
      discountAmount: (json['discount_amount'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class MobileAddress {
  final String id;
  final String label; // Home, Office
  final String recipientName;
  final String phone;
  final String addressLine;
  final String city;
  final String pincode;
  final bool isDefault;

  const MobileAddress({
    required this.id,
    required this.label,
    required this.recipientName,
    required this.phone,
    required this.addressLine,
    required this.city,
    required this.pincode,
    this.isDefault = false,
  });

  factory MobileAddress.fromJson(Map<String, dynamic> json) {
    return MobileAddress(
      id: json['id']?.toString() ?? '',
      label: json['address_type']?.toString() ?? json['label']?.toString() ?? 'Home',
      recipientName: json['recipient_name']?.toString() ?? json['recipientName']?.toString() ?? 'Patient',
      phone: json['phone']?.toString() ?? '',
      addressLine: json['address_line1']?.toString() ?? json['addressLine']?.toString() ?? '',
      city: json['city']?.toString() ?? 'Bengaluru',
      pincode: json['pincode']?.toString() ?? '560034',
      isDefault: json['is_default'] == true || json['isDefault'] == true,
    );
  }
}

class MobilePrescription {
  final String id;
  final String token;
  final String date;
  final String status; // Pending Review, Approved, Rejected
  final String doctorName;
  final String fileName;

  const MobilePrescription({
    required this.id,
    required this.token,
    required this.date,
    required this.status,
    required this.doctorName,
    required this.fileName,
  });
}

class MobileNotification {
  final String id;
  final String title;
  final String message;
  final String time;
  final bool isRead;

  const MobileNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.time,
    this.isRead = false,
  });
}

class MobileCoupon {
  final String id;
  final String code;
  final String discountType; // 'PERCENT' or 'FLAT'
  final double value;
  final double minOrderValue;
  final double? maxDiscountAmount;
  final String description;
  final String validUntil;
  final bool isActive;

  const MobileCoupon({
    required this.id,
    required this.code,
    required this.discountType,
    required this.value,
    required this.minOrderValue,
    this.maxDiscountAmount,
    required this.description,
    required this.validUntil,
    this.isActive = true,
  });

  String get discountBadge {
    if (discountType.toUpperCase() == 'PERCENT') {
      return '${value.toInt()}% OFF';
    }
    return '₹${value.toInt()} OFF';
  }

  factory MobileCoupon.fromJson(Map<String, dynamic> json) {
    final dType = (json['discount_type']?.toString() ?? json['discountType']?.toString() ?? 'PERCENT').toUpperCase();
    final val = (json['value'] as num?)?.toDouble() ?? 0.0;
    final minOrd = (json['min_order_value'] as num?)?.toDouble() ?? (json['minOrderValue'] as num?)?.toDouble() ?? 0.0;
    final maxDisc = (json['max_discount_amount'] as num?)?.toDouble() ?? (json['maxDiscountAmount'] as num?)?.toDouble();

    String desc = json['description']?.toString() ?? '';
    if (desc.isEmpty) {
      desc = dType == 'PERCENT' ? '${val.toInt()}% OFF' : 'Flat ₹${val.toInt()} OFF';
      if (minOrd > 0) {
        desc += ' on orders above ₹${minOrd.toInt()}';
      }
    }

    return MobileCoupon(
      id: json['id']?.toString() ?? json['code']?.toString() ?? '',
      code: (json['code']?.toString() ?? '').toUpperCase(),
      discountType: dType,
      value: val,
      minOrderValue: minOrd,
      maxDiscountAmount: maxDisc,
      description: desc,
      validUntil: json['valid_until']?.toString() ?? json['validUntil']?.toString() ?? '31 Dec 2026',
      isActive: json['is_active'] != false && json['status']?.toString().toUpperCase() != 'EXPIRED',
    );
  }
}

/// Zero mock data stub to satisfy any legacy reference without returning dummy records
class MockData {
  MockData._();

  static const List<MobileCategory> categories = [];
  static const List<MobileProduct> products = [];
  static const List<MobileOrder> orders = [];
  static const List<MobileAddress> addresses = [];
  static const List<MobilePrescription> prescriptions = [];
  static const List<MobileNotification> notifications = [];

  static List<BrandSubstituteOption> getSubstitutesForProduct(String productId) {
    return const [];
  }
}
