import { apiClient } from "./api";

export interface StockReceivePayload {
  product_id: string;
  batch_number: string;
  received_quantity: number;
  manufacturing_date: string;
  expiry_date: string;
  purchase_price: number;
  batch_mrp: number;
  supplier_name?: string;
  supplier_invoice_number?: string;
  storage_location?: string;
  reference_number?: string;
  notes?: string;
}

export interface StockAdjustmentPayload {
  product_id: string;
  batch_id: string;
  adjustment_type: "increase" | "decrease" | "damaged" | "expired" | "correction";
  quantity: number;
  reason: string;
  notes?: string;
}

export const adminInventoryService = {
  // Overall Summary & Valuation
  async getSummary() {
    const res = await apiClient<any>("/admin/inventory/summary");
    return res.data;
  },

  async getValuation() {
    const res = await apiClient<any>("/admin/inventory/valuation");
    return res.data;
  },

  // Product-wise inventory
  async getProductInventory(params: {
    search?: string;
    is_low_stock?: boolean;
    is_out_of_stock?: boolean;
    page?: number;
    page_size?: number;
  } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.append("search", params.search);
    if (params.is_low_stock !== undefined) q.append("is_low_stock", String(params.is_low_stock));
    if (params.is_out_of_stock !== undefined) q.append("is_out_of_stock", String(params.is_out_of_stock));
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/admin/inventory?${q.toString()}`);
    return res.data;
  },

  // Stock Receiving
  async receiveStock(data: StockReceivePayload) {
    const res = await apiClient<any>("/admin/inventory/receive-stock", {
      method: "POST",
      data,
    });
    return res.data;
  },

  // Batches
  async getBatches(params: {
    product_id?: string;
    batch_status?: string;
    is_expired?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  } = {}) {
    const q = new URLSearchParams();
    if (params.product_id) q.append("product_id", params.product_id);
    if (params.batch_status) q.append("batch_status", params.batch_status);
    if (params.is_expired !== undefined) q.append("is_expired", String(params.is_expired));
    if (params.search) q.append("search", params.search);
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/admin/inventory/batches?${q.toString()}`);
    return res.data;
  },

  async getBatch(batchId: string) {
    const res = await apiClient<any>(`/admin/inventory/batches/${batchId}`);
    return res.data;
  },

  async updateBatch(batchId: string, data: { storage_location?: string; supplier_name?: string; supplier_invoice_number?: string }) {
    const res = await apiClient<any>(`/admin/inventory/batches/${batchId}`, {
      method: "PUT",
      data,
    });
    return res.data;
  },

  async setBatchStatus(batchId: string, batchStatus: string) {
    const res = await apiClient<any>(`/admin/inventory/batches/${batchId}/status`, {
      method: "PATCH",
      data: { batch_status: batchStatus },
    });
    return res.data;
  },

  // Stock Adjustments
  async createAdjustment(data: StockAdjustmentPayload) {
    const res = await apiClient<any>("/admin/inventory/adjustments", {
      method: "POST",
      data,
    });
    return res.data;
  },

  async getAdjustments(params: { status?: string; page?: number; page_size?: number } = {}) {
    const q = new URLSearchParams();
    if (params.status) q.append("status", params.status);
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/admin/inventory/adjustments?${q.toString()}`);
    return res.data;
  },

  // Stock Movement History
  async getMovements(params: {
    product_id?: string;
    batch_id?: string;
    movement_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  } = {}) {
    const q = new URLSearchParams();
    if (params.product_id) q.append("product_id", params.product_id);
    if (params.batch_id) q.append("batch_id", params.batch_id);
    if (params.movement_type) q.append("movement_type", params.movement_type);
    if (params.start_date) q.append("start_date", params.start_date);
    if (params.end_date) q.append("end_date", params.end_date);
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/admin/inventory/stock-movements?${q.toString()}`);
    return res.data;
  },

  // Expiry Management
  async getExpirySummary() {
    const res = await apiClient<any>("/admin/inventory/expiry/summary");
    return res.data;
  },

  async getExpiries(params: { days_ahead?: number; is_expired?: boolean; page?: number; page_size?: number } = {}) {
    const q = new URLSearchParams();
    if (params.days_ahead !== undefined) q.append("days_ahead", String(params.days_ahead));
    if (params.is_expired !== undefined) q.append("is_expired", String(params.is_expired));
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/admin/inventory/expiry?${q.toString()}`);
    return res.data;
  },

  // Stock Alerts
  async getAlertsSummary() {
    const res = await apiClient<any>("/admin/inventory/alerts/summary");
    return res.data;
  },

  async getAlerts(params: { is_resolved?: boolean; alert_type?: string; page?: number; page_size?: number } = {}) {
    const q = new URLSearchParams();
    if (params.is_resolved !== undefined) q.append("is_resolved", String(params.is_resolved));
    if (params.alert_type) q.append("alert_type", params.alert_type);
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/admin/inventory/alerts?${q.toString()}`);
    return res.data;
  },

  async resolveAlert(alertId: string, notes?: string) {
    const res = await apiClient<any>(`/admin/inventory/alerts/${alertId}/resolve`, {
      method: "PATCH",
      data: { notes },
    });
    return res.data;
  },
};

