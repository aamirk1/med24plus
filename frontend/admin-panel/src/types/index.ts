export interface DashboardStats {
  totalOrders: number;
  totalRevenueINR: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingPrescriptions: number;
  lowStockProducts: number;
  expiringIn30DaysBatches: number;
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  dosageForm: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  schedule: "OTC" | "SCHEDULE_H" | "SCHEDULE_H1" | "AYUSH" | "DEVICE";
  requiresPrescription: boolean;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
}

export interface AdminBatch {
  id: string;
  productName: string;
  batchNumber: string;
  manufacturer: string;
  manufacturingDate: string;
  expiryDate: string;
  daysToExpiry: number;
  unitsAvailable: number;
  mrp: number;
  purchaseCost: number;
  status: "GOOD" | "NEAR_EXPIRY" | "EXPIRED" | "LOW_STOCK";
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: "Pending Review" | "Under Review" | "Packed" | "Out for Delivery" | "Delivered" | "Cancelled";
  statusCode: "PENDING" | "UNDER_REVIEW" | "PACKED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  hasPrescription: boolean;
  itemCount: number;
  deliveryPincode: string;
}

export interface AdminPrescription {
  id: string;
  prescriptionNumber: string;
  orderId?: string;
  patientName: string;
  patientPhone: string;
  doctorName?: string;
  doctorRegistrationNo?: string;
  uploadedAt: string;
  fileUrl: string;
  fileName: string;
  status: "Pending Review" | "Approved" | "Rejected";
  statusCode: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  assignedPharmacist?: string;
  reviewNotes?: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  registeredDate: string;
  totalOrders: number;
  totalSpentINR: number;
  city: string;
  pincode: string;
  status: "ACTIVE" | "BLOCKED";
}

export interface AdminStaff {
  id: string;
  name: string;
  role: "Pharmacist" | "Store Manager" | "Inventory Manager" | "Admin";
  licenseNo?: string;
  phone: string;
  email: string;
  joinedDate: string;
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
}

export interface DeliveryPartner {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  activeOrders: number;
  completedOrders: number;
  avgDeliveryTime: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface CouponItem {
  id: string;
  code: string;
  discountType: "PERCENT" | "FLAT";
  value: number;
  minOrderValue: number;
  validUntil: string;
  usageCount: number;
  status: "ACTIVE" | "EXPIRED";
}


export interface BatchInventoryItem {
  id: string;
  drugName: string;
  composition: string;
  batchNumber: string;
  manufacturer: string;
  expiryDate: string;
  daysToExpiry: number;
  stockUnits: number;
  schedule: string;
  status: "GOOD" | "NEAR_EXPIRY" | "EXPIRED" | "LOW_STOCK";
}

export interface PrescriptionOrderSummary {
  orderId: string;
  customerName: string;
  phone: string;
  rxStatus: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "DISPENSED";
  itemCount: number;
  hasScheduleDrugs: boolean;
  totalAmountINR: number;
  timestamp: string;
}
