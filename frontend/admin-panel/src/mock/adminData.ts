import {
  DashboardStats,
  AdminProduct,
  AdminBatch,
  AdminOrder,
  AdminPrescription,
  AdminCustomer,
  AdminStaff,
  DeliveryPartner,
  CouponItem,
} from "@/types";

export const MOCK_ADMIN_STATS: DashboardStats = {
  totalOrders: 1420,
  totalRevenueINR: 1845200,
  totalCustomers: 890,
  totalProducts: 468,
  pendingOrders: 14,
  pendingPrescriptions: 5,
  lowStockProducts: 12,
  expiringIn30DaysBatches: 3,
};

export const MOCK_ADMIN_PRODUCTS: AdminProduct[] = [
  {
    id: "p-1",
    sku: "MED-ACCU-50",
    name: "Accu-Chek Active Blood Glucose Test Strips (50 Strips)",
    brand: "Accu-Chek",
    category: "Diabetes Care & Monitoring",
    dosageForm: "Device",
    mrp: 1125,
    sellingPrice: 945,
    stock: 140,
    schedule: "DEVICE",
    requiresPrescription: false,
    status: "ACTIVE",
  },
  {
    id: "p-2",
    sku: "MED-MORE-BP",
    name: "Dr. Morepen BP-02 Automatic Blood Pressure Monitor",
    brand: "Dr. Morepen",
    category: "Cardiac & BP Support",
    dosageForm: "Device",
    mrp: 1540,
    sellingPrice: 1199,
    stock: 65,
    schedule: "DEVICE",
    requiresPrescription: false,
    status: "ACTIVE",
  },
  {
    id: "p-3",
    sku: "MED-CALC-D3",
    name: "Calcirol D3 60,000 IU Oral Solution (Cholecalciferol)",
    brand: "Cadila Healthcare",
    category: "Vitamins, Minerals & Daily Health",
    dosageForm: "Syrup",
    mrp: 125,
    sellingPrice: 105,
    stock: 310,
    schedule: "OTC",
    requiresPrescription: false,
    status: "ACTIVE",
  },
  {
    id: "p-4",
    sku: "MED-VOL-100",
    name: "Volini Pain Relief Spray (100g Aerosol)",
    brand: "Sun Pharma Consumer",
    category: "Pain Relief & Muscle Care",
    dosageForm: "Ointment",
    mrp: 325,
    sellingPrice: 275,
    stock: 8,
    schedule: "OTC",
    requiresPrescription: false,
    status: "ACTIVE",
  },
  {
    id: "p-5",
    sku: "MED-LIV-100",
    name: "Himalaya Liv.52 Herbal Liver Support (100 Tablets)",
    brand: "Himalaya Wellness",
    category: "Ayurveda & Herbal Wellness",
    dosageForm: "Tablet",
    mrp: 210,
    sellingPrice: 185,
    stock: 220,
    schedule: "AYUSH",
    requiresPrescription: false,
    status: "ACTIVE",
  },
];

export const MOCK_ADMIN_BATCHES: AdminBatch[] = [
  {
    id: "b-1",
    productName: "Accu-Chek Active Blood Glucose Test Strips",
    batchNumber: "ACC-26-904",
    manufacturer: "Roche Diagnostics India Pvt Ltd",
    manufacturingDate: "2025-05-10",
    expiryDate: "2028-04-30",
    daysToExpiry: 531,
    unitsAvailable: 140,
    mrp: 1125,
    purchaseCost: 780,
    status: "GOOD",
  },
  {
    id: "b-2",
    productName: "Calcirol D3 60,000 IU Oral Solution",
    batchNumber: "CAL-26-118",
    manufacturer: "Zydus Cadila Healthcare Ltd",
    manufacturingDate: "2025-11-01",
    expiryDate: "2027-10-31",
    daysToExpiry: 349,
    unitsAvailable: 310,
    mrp: 125,
    purchaseCost: 68,
    status: "GOOD",
  },
  {
    id: "b-3",
    productName: "Augmentin 625 Duo (Mock Audit Record)",
    batchNumber: "AUG-24-9182",
    manufacturer: "GSK Pharmaceuticals",
    manufacturingDate: "2024-12-01",
    expiryDate: "2026-12-31",
    daysToExpiry: 45,
    unitsAvailable: 12,
    mrp: 220,
    purchaseCost: 154,
    status: "NEAR_EXPIRY",
  },
  {
    id: "b-4",
    productName: "Volini Pain Relief Spray (100g)",
    batchNumber: "VOL-25-091",
    manufacturer: "Sun Pharmaceutical Industries Ltd",
    manufacturingDate: "2025-02-15",
    expiryDate: "2028-01-31",
    daysToExpiry: 441,
    unitsAvailable: 8,
    mrp: 325,
    purchaseCost: 198,
    status: "LOW_STOCK",
  },
];

export const MOCK_ADMIN_ORDERS: AdminOrder[] = [
  {
    id: "ord-101",
    orderNumber: "MED24-2026-9481",
    customerName: "Aarav Sharma",
    customerPhone: "+91 98451 22340",
    orderDate: "16 Nov 2026, 09:45 AM",
    totalAmount: 2320,
    paymentMethod: "UPI",
    status: "Under Review",
    statusCode: "UNDER_REVIEW",
    hasPrescription: true,
    itemCount: 2,
    deliveryPincode: "560103",
  },
  {
    id: "ord-102",
    orderNumber: "MED24-2026-8912",
    customerName: "Priyanka Patel",
    customerPhone: "+91 97230 44120",
    orderDate: "16 Nov 2026, 08:30 AM",
    totalAmount: 1479,
    paymentMethod: "COD",
    status: "Packed",
    statusCode: "PACKED",
    hasPrescription: false,
    itemCount: 2,
    deliveryPincode: "560034",
  },
  {
    id: "ord-103",
    orderNumber: "MED24-2026-8802",
    customerName: "Karthik Raja",
    customerPhone: "+91 94432 10982",
    orderDate: "15 Nov 2026, 06:15 PM",
    totalAmount: 3120,
    paymentMethod: "Credit Card",
    status: "Delivered",
    statusCode: "DELIVERED",
    hasPrescription: true,
    itemCount: 4,
    deliveryPincode: "560001",
  },
  {
    id: "ord-104",
    orderNumber: "MED24-2026-8790",
    customerName: "Sunita Verma",
    customerPhone: "+91 98114 99012",
    orderDate: "15 Nov 2026, 04:20 PM",
    totalAmount: 640,
    paymentMethod: "UPI",
    status: "Cancelled",
    statusCode: "CANCELLED",
    hasPrescription: true,
    itemCount: 1,
    deliveryPincode: "560066",
  },
];

export const MOCK_ADMIN_PRESCRIPTIONS: AdminPrescription[] = [
  {
    id: "rx-1",
    prescriptionNumber: "RX-2026-0841",
    orderId: "MED24-2026-9481",
    patientName: "Aarav Sharma",
    patientPhone: "+91 98451 22340",
    doctorName: "Dr. K. S. Murthy (MBBS, MD)",
    doctorRegistrationNo: "KMC 48921",
    uploadedAt: "16 Nov 2026, 08:30 AM",
    fileUrl: "/images/mock-rx.png",
    fileName: "DrMurthy_Prescription_Nov26.pdf",
    status: "Pending Review",
    statusCode: "PENDING_REVIEW",
    assignedPharmacist: "Ramesh Sharma (PCI-REG-94821)",
  },
  {
    id: "rx-2",
    prescriptionNumber: "RX-2026-0719",
    orderId: "MED24-2026-8802",
    patientName: "Karthik Raja",
    patientPhone: "+91 94432 10982",
    doctorName: "Dr. Sunita Rao (MBBS, DNB)",
    doctorRegistrationNo: "KMC 39102",
    uploadedAt: "15 Nov 2026, 05:20 PM",
    fileUrl: "/images/mock-rx.png",
    fileName: "Consultation_Rx_DrRao.jpg",
    status: "Approved",
    statusCode: "APPROVED",
    assignedPharmacist: "Ramesh Sharma (PCI-REG-94821)",
    reviewNotes: "Valid for 30-day supply. Rule 65 register entry logged.",
  },
  {
    id: "rx-3",
    prescriptionNumber: "RX-2026-0690",
    orderId: "MED24-2026-8790",
    patientName: "Sunita Verma",
    patientPhone: "+91 98114 99012",
    doctorName: "Dr. Unknown",
    uploadedAt: "15 Nov 2026, 03:40 PM",
    fileUrl: "/images/mock-rx.png",
    fileName: "Photo_Rx_Unclear.jpg",
    status: "Rejected",
    statusCode: "REJECTED",
    assignedPharmacist: "Ramesh Sharma (PCI-REG-94821)",
    reviewNotes: "Doctor registration number missing; image blurry. Requested re-upload.",
  },
];

export const MOCK_CUSTOMERS: AdminCustomer[] = [
  {
    id: "c-1",
    name: "Aarav Sharma",
    phone: "+91 98451 22340",
    email: "aarav.sharma@example.com",
    registeredDate: "10 Oct 2026",
    totalOrders: 6,
    totalSpentINR: 12450,
    city: "Bengaluru",
    pincode: "560103",
    status: "ACTIVE",
  },
  {
    id: "c-2",
    name: "Priyanka Patel",
    phone: "+91 97230 44120",
    email: "priyanka.p@example.com",
    registeredDate: "24 Sep 2026",
    totalOrders: 3,
    totalSpentINR: 4890,
    city: "Bengaluru",
    pincode: "560034",
    status: "ACTIVE",
  },
  {
    id: "c-3",
    name: "Karthik Raja",
    phone: "+91 94432 10982",
    email: "karthik.raja@example.com",
    registeredDate: "02 Aug 2026",
    totalOrders: 8,
    totalSpentINR: 19800,
    city: "Bengaluru",
    pincode: "560001",
    status: "ACTIVE",
  },
];

export const MOCK_STAFF: AdminStaff[] = [
  {
    id: "s-1",
    name: "Ramesh Sharma, B.Pharm",
    role: "Pharmacist",
    licenseNo: "PCI-REG-94821/2020",
    phone: "+91 98450 11223",
    email: "ramesh.sharma@med24plus.in",
    joinedDate: "15 Jan 2022",
    status: "ACTIVE",
  },
  {
    id: "s-2",
    name: "Deepa Nair, M.Pharm",
    role: "Pharmacist",
    licenseNo: "PCI-REG-88219/2021",
    phone: "+91 98450 44556",
    email: "deepa.nair@med24plus.in",
    joinedDate: "01 Mar 2023",
    status: "ACTIVE",
  },
  {
    id: "s-3",
    name: "Vikram Sen",
    role: "Store Manager",
    phone: "+91 98450 77889",
    email: "vikram.sen@med24plus.in",
    joinedDate: "10 Nov 2021",
    status: "ACTIVE",
  },
];

export const MOCK_DELIVERY_PARTNERS: DeliveryPartner[] = [
  {
    id: "dp-1",
    name: "Med24 Internal Cold-Chain Fleet",
    contactPerson: "Santosh Yadav",
    phone: "+91 98452 33441",
    activeOrders: 8,
    completedOrders: 940,
    avgDeliveryTime: "3.2 Hours",
    status: "ACTIVE",
  },
  {
    id: "dp-2",
    name: "Shadowfax Express City Logistics",
    contactPerson: "Arun Kumar",
    phone: "+91 98452 77889",
    activeOrders: 5,
    completedOrders: 420,
    avgDeliveryTime: "4.1 Hours",
    status: "ACTIVE",
  },
];

export const MOCK_COUPONS: CouponItem[] = [
  {
    id: "cp-1",
    code: "MED24",
    discountType: "FLAT",
    value: 100,
    minOrderValue: 500,
    validUntil: "31 Dec 2026",
    usageCount: 420,
    status: "ACTIVE",
  },
  {
    id: "cp-2",
    code: "HEALTH15",
    discountType: "PERCENT",
    value: 15,
    minOrderValue: 999,
    validUntil: "31 Dec 2026",
    usageCount: 180,
    status: "ACTIVE",
  },
];


export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface AdminBrand {
  id: string;
  name: string;
  manufacturer: string;
  productCount: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface AdminBanner {
  id: string;
  title: string;
  targetUrl: string;
  position: "HOME_HERO" | "PROMO_BAR" | "CATEGORY_HEADER";
  status: "ACTIVE" | "INACTIVE";
  validUntil: string;
}

export interface AdminRefund {
  id: string;
  orderNumber: string;
  customerName: string;
  amountINR: number;
  reason: string;
  status: "PROCESSED" | "PENDING";
  date: string;
}

export const MOCK_ADMIN_CATEGORIES: AdminCategory[] = [
  { id: "cat-1", name: "Diabetes Care & Monitoring", slug: "diabetes-care", productCount: 42, status: "ACTIVE" },
  { id: "cat-2", name: "Cardiac & BP Support", slug: "cardiac-bp", productCount: 28, status: "ACTIVE" },
  { id: "cat-3", name: "Vitamins, Minerals & Daily Health", slug: "vitamins-minerals", productCount: 65, status: "ACTIVE" },
  { id: "cat-4", name: "Ayurvedic & Herbal Wellness", slug: "ayurvedic-herbal", productCount: 38, status: "ACTIVE" },
  { id: "cat-5", name: "First Aid & Surgical Supplies", slug: "first-aid-surgical", productCount: 54, status: "ACTIVE" },
  { id: "cat-6", name: "Cold, Cough & Respiratory", slug: "cold-cough", productCount: 49, status: "ACTIVE" },
];

export const MOCK_ADMIN_BRANDS: AdminBrand[] = [
  { id: "br-1", name: "Accu-Chek", manufacturer: "Roche Diagnostics India", productCount: 8, status: "ACTIVE" },
  { id: "br-2", name: "Dr. Morepen", manufacturer: "Morepen Laboratories Ltd", productCount: 14, status: "ACTIVE" },
  { id: "br-3", name: "Cadila Healthcare", manufacturer: "Zydus Lifesciences Ltd", productCount: 22, status: "ACTIVE" },
  { id: "br-4", name: "Dabur India", manufacturer: "Dabur India Ltd", productCount: 35, status: "ACTIVE" },
  { id: "br-5", name: "Sun Pharma", manufacturer: "Sun Pharmaceutical Industries", productCount: 45, status: "ACTIVE" },
];

export const MOCK_ADMIN_BANNERS: AdminBanner[] = [
  { id: "ban-1", title: "Flat 15% Off on Chronic Care Supplies", targetUrl: "/products", position: "HOME_HERO", status: "ACTIVE", validUntil: "31 Dec 2026" },
  { id: "ban-2", title: "Compliant Cold-Chain Insulin Express Delivery", targetUrl: "/categories/diabetes-care", position: "PROMO_BAR", status: "ACTIVE", validUntil: "31 Dec 2026" },
];

export const MOCK_ADMIN_REFUNDS: AdminRefund[] = [
  { id: "ref-1", orderNumber: "ORD-2026-8819", customerName: "Anita Sharma", amountINR: 450, reason: "Product Out of Stock at Dispensing", status: "PROCESSED", date: "14 Nov 2026" },
  { id: "ref-2", orderNumber: "ORD-2026-8812", customerName: "Kavita Reddy", amountINR: 890, reason: "Order Cancelled Prior to Dispatch", status: "PENDING", date: "15 Nov 2026" },
];
