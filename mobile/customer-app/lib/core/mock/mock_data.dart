import 'package:flutter/foundation.dart';

@immutable
class MobileProduct {
  final String id;
  final String name;
  final String brand;
  final String category;
  final String categoryId;
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
    this.categoryId = '',
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

    // Resolve category id
    final catId = json['category_id']?.toString() ?? json['categoryId']?.toString() ?? '';

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
      categoryId: catId,
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
  final String imageUrl;
  final int count;

  const MobileCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.icon,
    this.imageUrl = '',
    required this.count,
  });

  factory MobileCategory.fromJson(Map<String, dynamic> json) {
    return MobileCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'medication',
      imageUrl: json['image_url']?.toString() ?? json['imageUrl']?.toString() ?? '',
      count: (json['product_count'] as num?)?.toInt() ?? (json['count'] as num?)?.toInt() ?? 24,
    );
  }
}

class MobileBrand {
  final String id;
  final String name;
  final String slug;
  final String manufacturerName;
  final String logoUrl;
  final String origin;

  const MobileBrand({
    required this.id,
    required this.name,
    required this.slug,
    required this.manufacturerName,
    this.logoUrl = '',
    this.origin = 'India',
  });

  factory MobileBrand.fromJson(Map<String, dynamic> json) {
    return MobileBrand(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      manufacturerName: json['manufacturer_name']?.toString() ?? json['name']?.toString() ?? '',
      logoUrl: json['logo_url']?.toString() ?? '',
      origin: json['country_of_origin']?.toString() ?? 'India',
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
  final Map<String, dynamic>? rawRazorpayOrder;

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
    this.rawRazorpayOrder,
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
      rawRazorpayOrder: json['razorpay_order'] is Map<String, dynamic> ? json['razorpay_order'] as Map<String, dynamic> : null,
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

/// Curated Indian Market Pharmaceutical Catalog (Verified with Drugs & Cosmetics Act)
class MockData {
  MockData._();

  static const List<MobileCategory> categories = [
    MobileCategory(
      id: 'a8fc06a5-26ee-4669-9aac-b49e64be3ca4',
      name: 'Anti-Infective',
      slug: 'anti-infective',
      icon: 'activity',
      count: 24,
    ),
    MobileCategory(
      id: 'pain-relief',
      name: 'Pain Relief & Analgesics',
      slug: 'pain-relief',
      icon: 'heart',
      count: 32,
    ),
    MobileCategory(
      id: 'cardiovascular',
      name: 'Cardiovascular & Heart',
      slug: 'cardiovascular',
      icon: 'heart',
      count: 18,
    ),
    MobileCategory(
      id: 'diabetes-care',
      name: 'Diabetes Care',
      slug: 'diabetes-care',
      icon: 'activity',
      count: 22,
    ),
    MobileCategory(
      id: 'gastrointestinal',
      name: 'Gastrointestinal Care',
      slug: 'gastrointestinal',
      icon: 'leaf',
      count: 26,
    ),
    MobileCategory(
      id: 'devices',
      name: 'Health Devices',
      slug: 'devices',
      icon: 'thermometer',
      count: 15,
    ),
    MobileCategory(
      id: 'vitamins-supplements',
      name: 'Vitamins & Minerals',
      slug: 'vitamins-supplements',
      icon: 'sparkles',
      count: 28,
    ),
    MobileCategory(
      id: 'ayush-herbal',
      name: 'Ayush & Herbal',
      slug: 'ayush-herbal',
      icon: 'leaf',
      count: 19,
    ),
  ];

  static const List<MobileProduct> products = [
    MobileProduct(
      id: 'd043f78c-ab89-4548-8813-668b58267f11',
      name: 'Augmentin 625 Duo Tablet',
      brand: 'GlaxoSmithKline Pharmaceuticals Ltd',
      category: 'Antibiotics & Antibacterials',
      dosageForm: 'Tablet',
      saltComposition: 'Amoxycillin and Potassium Clavulanate Tablets IP',
      mrp: 223.50,
      sellingPrice: 195.00,
      discountPercent: 13,
      packSize: 'strip of 10 tablets',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H1',
      inStock: true,
      rating: 4.9,
      reviewsCount: 384,
      description: 'Broad spectrum antibiotic prescribed for bacterial infections.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/med24plus.firebasestorage.app/o/products%2Fd043f78c-ab89-4548-8813-668b58267f11%2Fd043f78c-ab89-4548-8813-668b58267f11_2b3ff8f6668f.png?alt=media',
    ),
    MobileProduct(
      id: 'd5789331-0331-4ecf-8932-3c34dca300d2',
      name: 'Azithral 500 Tablet',
      brand: 'Cipla Ltd',
      category: 'Antibiotics & Antibacterials',
      dosageForm: 'Tablet',
      saltComposition: 'Azithromycin 500 mg',
      mrp: 132.00,
      sellingPrice: 115.00,
      discountPercent: 13,
      packSize: 'strip of 5 tablets',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H',
      inStock: true,
      rating: 4.8,
      reviewsCount: 512,
      description: 'Used in the treatment of bacterial infections of respiratory tract, skin and throat.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/med24plus.firebasestorage.app/o/products%2Fd5789331-0331-4ecf-8932-3c34dca300d2%2Fd5789331-0331-4ecf-8932-3c34dca300d2_e0850b978d7a.png?alt=media&token=simulation-token',
    ),
    MobileProduct(
      id: '54dc2e12-e682-416b-a8d2-34d1976723b3',
      name: 'Telma 40 Tablet',
      brand: 'Glenmark Pharmaceuticals Ltd',
      category: 'Blood Pressure & Antihypertensives',
      dosageForm: 'Tablet',
      saltComposition: 'Telmisartan 40 mg',
      mrp: 245.00,
      sellingPrice: 210.00,
      discountPercent: 14,
      packSize: 'strip of 30 tablets',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H',
      inStock: true,
      rating: 4.8,
      reviewsCount: 290,
      description: 'Prescription antihypertensive used to lower blood pressure and protect kidney function.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/med24plus.firebasestorage.app/o/products%2F54dc2e12-e682-416b-a8d2-34d1976723b3%2F54dc2e12-e682-416b-a8d2-34d1976723b3_6b809121211c.png?alt=media&token=simulation-token',
    ),
    MobileProduct(
      id: 'fa1f2a89-2873-4d4e-922e-46245858d0a7',
      name: 'Amlokind 5 Tablet',
      brand: 'Mankind Pharma Ltd',
      category: 'Blood Pressure & Antihypertensives',
      dosageForm: 'Tablet',
      saltComposition: 'Amlodipine 5 mg',
      mrp: 38.00,
      sellingPrice: 32.00,
      discountPercent: 16,
      packSize: 'strip of 15 tablets',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H',
      inStock: true,
      rating: 4.7,
      reviewsCount: 180,
      description: 'Calcium channel blocker for treating high blood pressure and preventing angina.',
      imageUrl: '',
    ),
    MobileProduct(
      id: '2018d6da-3526-465e-8a18-78db722b6571',
      name: 'Atorva 10 Tablet',
      brand: 'Zydus Cadila',
      category: 'Cholesterol & Lipid Reducers',
      dosageForm: 'Tablet',
      saltComposition: 'Atorvastatin 10 mg',
      mrp: 110.00,
      sellingPrice: 94.00,
      discountPercent: 15,
      packSize: 'strip of 15 tablets',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H',
      inStock: true,
      rating: 4.9,
      reviewsCount: 420,
      description: 'Statin medicine that lowers LDL cholesterol and triglycerides in blood.',
      imageUrl: '',
    ),
    MobileProduct(
      id: '5ac74af0-ccd3-434c-a4c3-6348b9fd3f79',
      name: 'Ecosprin 75 Tablet',
      brand: 'Abbott Healthcare Pvt Ltd',
      category: 'Blood Thinners & Anticoagulants',
      dosageForm: 'Tablet',
      saltComposition: 'Aspirin 75 mg',
      mrp: 6.50,
      sellingPrice: 5.50,
      discountPercent: 15,
      packSize: 'strip of 14 tablets',
      requiresPrescription: false,
      schedule: 'OTC',
      inStock: true,
      rating: 4.9,
      reviewsCount: 650,
      description: 'Cardioprotective antiplatelet medicine preventing heart attacks and blood clots.',
      imageUrl: '',
    ),
    MobileProduct(
      id: '356c2df4-3361-4cb2-9e74-4145922706d8',
      name: 'Glycomet-GP 2 Tablet PR',
      brand: 'USV Ltd',
      category: 'Oral Anti-Diabetic Medicines',
      dosageForm: 'Tablet',
      saltComposition: 'Glimepiride 2mg + Metformin 500mg',
      mrp: 158.00,
      sellingPrice: 138.00,
      discountPercent: 13,
      packSize: 'strip of 15 tablets',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H',
      inStock: true,
      rating: 4.8,
      reviewsCount: 310,
      description: 'Dual combination anti-diabetic formulation for managing Type 2 Diabetes Mellitus.',
      imageUrl: '',
    ),
    MobileProduct(
      id: 'c473d75c-9ba0-401c-8299-1e280304b3b2',
      name: 'Thyronorm 50mcg Tablet',
      brand: 'Abbott Healthcare Pvt Ltd',
      category: 'Thyroid Management',
      dosageForm: 'Tablet',
      saltComposition: 'Thyroxine Sodium 50 mcg',
      mrp: 195.00,
      sellingPrice: 170.00,
      discountPercent: 13,
      packSize: 'bottle of 120 tablets',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H',
      inStock: true,
      rating: 4.9,
      reviewsCount: 540,
      description: 'Synthetic thyroid hormone prescribed for hypothyroidism hormone replacement.',
      imageUrl: '',
    ),
    MobileProduct(
      id: '818fa01a-7996-41f9-8933-07ffe83d176a',
      name: 'Accu-Chek Active 50 Test Strips',
      brand: 'Roche Diabetes Care',
      category: 'Glucometers & Test Strips',
      dosageForm: 'Strips',
      saltComposition: 'Blood Glucose Test Strips',
      mrp: 1049.00,
      sellingPrice: 899.00,
      discountPercent: 14,
      packSize: 'box of 50 strips',
      requiresPrescription: false,
      schedule: 'DEVICE',
      inStock: true,
      rating: 4.8,
      reviewsCount: 780,
      description: 'Fast, reliable blood glucose testing strips for self-monitoring diabetes.',
      imageUrl: '',
    ),
    MobileProduct(
      id: 'ca67a926-aaaa-4489-955f-0cc667d2e1db',
      name: 'Zentel 400mg Tablet',
      brand: 'GlaxoSmithKline Pharmaceuticals Ltd',
      category: 'Antiparasitics & Anthelmintics',
      dosageForm: 'Tablet',
      saltComposition: 'Albendazole 400 mg',
      mrp: 12.50,
      sellingPrice: 10.50,
      discountPercent: 16,
      packSize: 'single chewable tablet',
      requiresPrescription: false,
      schedule: 'OTC',
      inStock: true,
      rating: 4.7,
      reviewsCount: 210,
      description: 'Broad-spectrum anti-worm medicine for intestinal deworming.',
      imageUrl: '',
    ),
  ];

  static const List<MobileOrder> orders = [];
  static const List<MobileAddress> addresses = [];
  static const List<MobilePrescription> prescriptions = [];
  static const List<MobileNotification> notifications = [];

  static List<BrandSubstituteOption> getSubstitutesForProduct(String productId) {
    return const [];
  }
}
