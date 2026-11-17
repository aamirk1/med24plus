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
}

