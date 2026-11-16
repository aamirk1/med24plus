export interface DashboardStats {
  todaySalesINR: number;
  salesGrowthPercent: number;
  pendingPrescriptions: number;
  activeOrders: number;
  lowStockBatches: number;
  expiringIn30DaysBatches: number;
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

export interface BatchInventoryItem {
  id: string;
  drugName: string;
  composition: string;
  batchNumber: string;
  manufacturer: string;
  expiryDate: string;
  daysToExpiry: number;
  stockUnits: number;
  schedule: "Schedule H" | "Schedule H1" | "Schedule G" | "OTC";
  status: "GOOD" | "LOW_STOCK" | "NEAR_EXPIRY";
}

