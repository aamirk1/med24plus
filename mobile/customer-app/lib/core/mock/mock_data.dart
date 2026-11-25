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
  final String schedule; // OTC, SCHEDULE_H, SCHEDULE_H1, AYUSH, DEVICE
  final bool inStock;
  final double rating;
  final int reviewsCount;
  final String description;

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
    this.rating = 4.8,
    this.reviewsCount = 142,
    this.description = '',
  });

  factory MobileProduct.fromJson(Map<String, dynamic> json) {
    return MobileProduct(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      brand: json['brand_name']?.toString() ?? json['brand']?.toString() ?? 'Med24Plus Pharmacy',
      category: json['category_name']?.toString() ?? json['category']?.toString() ?? 'Medicines',
      dosageForm: json['dosage_form']?.toString() ?? json['dosageForm']?.toString() ?? 'Tablet',
      saltComposition: json['generic_name']?.toString() ?? json['saltComposition']?.toString() ?? '',
      mrp: (json['mrp'] as num?)?.toDouble() ?? 0.0,
      sellingPrice: (json['selling_price'] as num?)?.toDouble() ?? (json['sellingPrice'] as num?)?.toDouble() ?? 0.0,
      discountPercent: (json['discount_percent'] as num?)?.toInt() ?? (json['discountPercent'] as num?)?.toInt() ?? 0,
      packSize: json['pack_size']?.toString() ?? json['packSize']?.toString() ?? '1 Strip',
      requiresPrescription: json['requires_prescription'] == true || json['requiresPrescription'] == true,
      schedule: json['schedule_classification']?.toString() ?? json['schedule']?.toString() ?? 'OTC',
      inStock: json['is_in_stock'] != false && json['inStock'] != false,
      rating: (json['rating'] as num?)?.toDouble() ?? 4.8,
      reviewsCount: (json['reviews_count'] as num?)?.toInt() ?? (json['reviewsCount'] as num?)?.toInt() ?? 128,
      description: json['description']?.toString() ?? 'Compounded and dispensed under registered pharmacist supervision.',
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
  final String badge; // "Original Brand", "Popular Choice", "Best Value"
  final String? topTag; // "Your Prescription", "Popular Choice", "Best Value"
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

class MobileOrder {
  final String id;
  final String orderNumber;
  final String date;
  final String status;
  final double totalAmount;
  final int itemCount;
  final bool hasPrescription;
  final String paymentMethod;
  final String deliveryPincode;

  const MobileOrder({
    required this.id,
    required this.orderNumber,
    required this.date,
    required this.status,
    required this.totalAmount,
    required this.itemCount,
    required this.hasPrescription,
    required this.paymentMethod,
    required this.deliveryPincode,
  });

  factory MobileOrder.fromJson(Map<String, dynamic> json) {
    return MobileOrder(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number']?.toString() ?? json['orderNumber']?.toString() ?? 'ORD-M24',
      date: json['created_at']?.toString().split('T').first ?? json['date']?.toString() ?? 'Today',
      status: json['status']?.toString() ?? 'Processing',
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      itemCount: (json['items'] as List?)?.length ?? (json['itemCount'] as num?)?.toInt() ?? 1,
      hasPrescription: json['has_prescription'] == true || json['hasPrescription'] == true,
      paymentMethod: json['payment_method']?.toString() ?? json['paymentMethod']?.toString() ?? 'UPI / Card',
      deliveryPincode: json['shipping_pincode']?.toString() ?? json['deliveryPincode']?.toString() ?? '560034',
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

class MockData {
  MockData._();

  static const List<MobileCategory> categories = [
    MobileCategory(
      id: 'cat-1',
      name: 'Diabetes Care',
      slug: 'diabetes-care',
      icon: 'activity',
      count: 42,
    ),
    MobileCategory(
      id: 'cat-2',
      name: 'Cardiac & BP',
      slug: 'cardiac-bp',
      icon: 'heart',
      count: 28,
    ),
    MobileCategory(
      id: 'cat-3',
      name: 'Vitamins & Health',
      slug: 'vitamins-minerals',
      icon: 'sparkles',
      count: 65,
    ),
    MobileCategory(
      id: 'cat-4',
      name: 'Ayurveda & Herbal',
      slug: 'ayurvedic-herbal',
      icon: 'leaf',
      count: 38,
    ),
    MobileCategory(
      id: 'cat-5',
      name: 'First Aid & Surgical',
      slug: 'first-aid-surgical',
      icon: 'cross',
      count: 54,
    ),
    MobileCategory(
      id: 'cat-6',
      name: 'Cold & Cough',
      slug: 'cold-cough',
      icon: 'thermometer',
      count: 49,
    ),
  ];

  static const List<MobileProduct> products = [
    MobileProduct(
      id: 'p-azithral',
      name: 'Azithral 500 Tablet',
      brand: 'Alembic Pharmaceuticals / Cipla',
      category: 'Anti-Infectives',
      dosageForm: 'Tablet',
      saltComposition: 'Azithromycin 500 mg',
      mrp: 152.0,
      sellingPrice: 115.0,
      discountPercent: 13,
      packSize: '5 Tablets / Strip',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H1',
      inStock: true,
      rating: 4.8,
      reviewsCount: 42,
      description: 'Azithral 500 Tablet is an antibiotic used to treat various types of bacterial infections of the respiratory tract, ear, nose, throat, lungs, skin, and eyes in adults and children.',
    ),
    MobileProduct(
      id: 'p-1',
      name: 'Accu-Chek Active Blood Glucose Test Strips',
      brand: 'Accu-Chek',
      category: 'Diabetes Care',
      dosageForm: 'Device',
      saltComposition: 'Electrochemical Test Strips for Glucose',
      mrp: 1125.0,
      sellingPrice: 945.0,
      discountPercent: 16,
      packSize: '50 Strips Box',
      requiresPrescription: false,
      schedule: 'DEVICE',
      inStock: true,
      rating: 4.8,
      reviewsCount: 320,
      description: 'Accurate quantitative blood glucose monitoring in 5 seconds. Compatible with Accu-Chek Active meters.',
    ),
    MobileProduct(
      id: 'p-2',
      name: 'Calcirol D3 60,000 IU Oral Solution',
      brand: 'Cadila Healthcare',
      category: 'Vitamins & Health',
      dosageForm: 'Oral Solution',
      saltComposition: 'Cholecalciferol (Vitamin D3) 60,000 IU',
      mrp: 125.0,
      sellingPrice: 105.0,
      discountPercent: 16,
      packSize: '5 ml Bottle',
      requiresPrescription: true,
      schedule: 'SCHEDULE_H',
      inStock: true,
      rating: 4.9,
      reviewsCount: 198,
      description: 'High-strength weekly Vitamin D3 supplement for bone density, calcium absorption and immune health.',
    ),
    MobileProduct(
      id: 'p-3',
      name: 'Dr. Morepen BP-02 Automatic Monitor',
      brand: 'Dr. Morepen',
      category: 'Cardiac & BP',
      dosageForm: 'Device',
      saltComposition: 'Digital Oscillometric Blood Pressure Monitor',
      mrp: 1540.0,
      sellingPrice: 1199.0,
      discountPercent: 22,
      packSize: 'Unit Box with Upper Arm Cuff',
      requiresPrescription: false,
      schedule: 'DEVICE',
      inStock: true,
      rating: 4.7,
      reviewsCount: 154,
      description: 'One-touch automatic upper arm blood pressure measurement with WHO indicator and memory storage.',
    ),
    MobileProduct(
      id: 'p-4',
      name: 'Volini Pain Relief Gel & Spray',
      brand: 'Sun Pharma',
      category: 'First Aid & Surgical',
      dosageForm: 'Aerosol Spray',
      saltComposition: 'Diclofenac Diethylamine + Methyl Salicylate + Menthol',
      mrp: 325.0,
      sellingPrice: 285.0,
      discountPercent: 12,
      packSize: '100g Canister',
      requiresPrescription: false,
      schedule: 'OTC',
      inStock: true,
      rating: 4.6,
      reviewsCount: 412,
      description: 'Instant micro-gel penetration for quick relief from muscle spasms, backache, and joint pain.',
    ),
    MobileProduct(
      id: 'p-5',
      name: 'Dabur Chyawanprash 2X Immunity',
      brand: 'Dabur India',
      category: 'Ayurveda & Herbal',
      dosageForm: 'Paste',
      saltComposition: 'Amla (Indian Gooseberry) + 40+ Ayurvedic Herbs',
      mrp: 410.0,
      sellingPrice: 365.0,
      discountPercent: 11,
      packSize: '1 kg Jar',
      requiresPrescription: false,
      schedule: 'AYUSH',
      inStock: true,
      rating: 4.8,
      reviewsCount: 512,
      description: 'Time-tested Ayurvedic formulation containing antioxidant-rich Amla for stamina and daily defense.',
    ),
  ];

  static const List<MobileOrder> orders = [
    MobileOrder(
      id: 'ord-1',
      orderNumber: 'MED-2026-8819',
      date: '14 Nov 2026, 02:30 PM',
      status: 'Out for Delivery',
      totalAmount: 1155.0,
      itemCount: 2,
      hasPrescription: true,
      paymentMethod: 'UPI (Google Pay)',
      deliveryPincode: '560034',
    ),
    MobileOrder(
      id: 'ord-2',
      orderNumber: 'MED-2026-8812',
      date: '02 Nov 2026, 11:15 AM',
      status: 'Delivered',
      totalAmount: 1420.0,
      itemCount: 3,
      hasPrescription: true,
      paymentMethod: 'Credit Card',
      deliveryPincode: '560034',
    ),
  ];

  static const List<MobileAddress> addresses = [
    MobileAddress(
      id: 'addr-1',
      label: 'Home',
      recipientName: 'Rahul Verma',
      phone: '+91 98450 91823',
      addressLine: 'Flat 402, Green Glen Layout, Bellandur',
      city: 'Bengaluru',
      pincode: '560103',
      isDefault: true,
    ),
    MobileAddress(
      id: 'addr-2',
      label: 'Office',
      recipientName: 'Rahul Verma',
      phone: '+91 98450 91823',
      addressLine: 'Block 2, Embassy TechVillage, Outer Ring Road',
      city: 'Bengaluru',
      pincode: '560103',
      isDefault: false,
    ),
  ];

  static const List<MobilePrescription> prescriptions = [
    MobilePrescription(
      id: 'rx-1',
      token: 'RX-2026-1182',
      date: '14 Nov 2026',
      status: 'Approved',
      doctorName: 'Dr. Rajesh Khanna, MBBS (KMC-48201)',
      fileName: 'dr_prescription_nov2026.pdf',
    ),
    MobilePrescription(
      id: 'rx-2',
      token: 'RX-2026-1094',
      date: '02 Nov 2026',
      status: 'Approved',
      doctorName: 'Dr. Meena Iyer, MD (KMC-39102)',
      fileName: 'chronic_care_refill.jpg',
    ),
  ];

  static const List<MobileNotification> notifications = [
    MobileNotification(
      id: 'notif-1',
      title: 'Order Out for Delivery',
      message: 'Your cold-chain order MED-2026-8819 is out for delivery with rider Santosh Y.',
      time: '15 mins ago',
      isRead: false,
    ),
    MobileNotification(
      id: 'notif-2',
      title: 'Prescription Verified',
      message: 'Registered Pharmacist approved your prescription RX-2026-1182.',
      time: '2 hours ago',
      isRead: true,
    ),
    MobileNotification(
      id: 'notif-3',
      title: 'Monthly Refill Due',
      message: 'Time to reorder your monthly diabetes maintenance pack.',
      time: 'Yesterday',
      isRead: true,
    ),
  ];

  static List<BrandSubstituteOption> getSubstitutesForProduct(String productId) {
    // If it's Azithral or any product by default, provide the exact verified clinical comparison matching the screenshot
    return const [
      BrandSubstituteOption(
        id: 'opt-azithral-orig',
        name: 'Azithral 500 Tablet',
        brand: 'Alembic Pharmaceuticals',
        genericName: 'Azithromycin 500 mg',
        strength: '500 mg',
        mrp: 152.0,
        sellingPrice: 115.0,
        savingsAmount: 0.0,
        savingsPercent: 0,
        badge: 'Original Brand',
        topTag: 'Your Prescription',
        isOriginal: true,
        inStock: true,
      ),
      BrandSubstituteOption(
        id: 'opt-zithrocin-sub',
        name: 'Zithrocin 500 Tablet',
        brand: 'FDC Ltd / Sun Pharma',
        genericName: 'Azithromycin 500 mg',
        strength: '500 mg',
        mrp: 120.0,
        sellingPrice: 90.0,
        savingsAmount: 25.0,
        savingsPercent: 22,
        badge: 'Popular Choice',
        topTag: 'Popular Choice',
        isOriginal: false,
        inStock: true,
      ),
      BrandSubstituteOption(
        id: 'opt-azimycin-sub',
        name: 'Azimycin 500 Tablet',
        brand: 'Cipla Ltd',
        genericName: 'Azithromycin 500 mg',
        strength: '500 mg',
        mrp: 115.0,
        sellingPrice: 85.0,
        savingsAmount: 30.0,
        savingsPercent: 26,
        badge: 'Best Value',
        topTag: 'Best Value',
        isOriginal: false,
        inStock: true,
      ),
    ];
  }
}


