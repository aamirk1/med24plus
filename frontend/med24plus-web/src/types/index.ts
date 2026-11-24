export interface MedicineCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  itemCount: number;
  image?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoText: string;
  origin: string;
  isPopular?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  category?: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  packSize: string;
  dosageForm: string; // "Tablet", "Capsule", "Syrup", "Ointment", "Drops", "Device"
  composition: string;
  inStock: boolean;
  stockCount: number;
  requiresPrescription: boolean;
  scheduleType: "OTC" | "SCHEDULE_H" | "SCHEDULE_H1" | "AYUSH" | "DEVICE";
  rating: number;
  reviewCount: number;
  images: string[];
  imageUrl?: string;
  description: string;
  keyBenefits: string[];
  directionsForUse: string;
  safetyInformation: string[];
  manufacturer: string;
  countryOfOrigin: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productName: string;
  brand: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  requiresPrescription: boolean;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: "Placed" | "Under Pharmacist Review" | "Packed" | "Out for Delivery" | "Delivered" | "Cancelled";
  statusCode: "PLACED" | "RX_REVIEW" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  taxGST: number;
  totalAmount: number;
  deliveryAddress: Address;
  paymentMethod: "UPI" | "Credit/Debit Card" | "Net Banking" | "Cash on Delivery (COD)";
  isPrescriptionVerified?: boolean;
  estimatedDelivery: string;
}

export interface Address {
  id: string;
  type: "Home" | "Work" | "Other";
  isDefault: boolean;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  uploadedAt: string;
  patientName: string;
  doctorName?: string;
  status: "Pending Review" | "Approved" | "Rejected";
  statusCode: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  fileUrl: string;
  fileName: string;
  pharmacistNotes?: string;
  reviewDate?: string;
  associatedOrderId?: string;
}

export interface PharmacyService {
  id: string;
  title: string;
  description: string;
  badge: string;
  iconName: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  licenseNumber: string;
  pharmacistCouncilReg: string;
  phone: string;
  email: string;
  operatingHours: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

