import { apiClient } from "./api";

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  batch_id?: string;
  product_name_snapshot: string;
  product_sku_snapshot: string;
  generic_name_snapshot?: string;
  strength_snapshot?: string;
  pack_size_snapshot?: string;
  manufacturer_snapshot: string;
  batch_number_snapshot?: string;
  expiry_date_snapshot?: string;
  hsn_code_snapshot: string;
  gst_rate_snapshot: number;
  unit_mrp: number;
  unit_price: number;
  quantity: number;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  prescription_required: boolean;
}

export interface AdminOrderBatchAllocation {
  id: string;
  order_id: string;
  order_item_id: string;
  batch_id: string;
  batch_number?: string;
  expiry_date?: string;
  allocated_quantity: number;
  released_quantity: number;
  consumed_quantity: number;
  allocation_status: string;
  created_at: string;
}

export interface AdminInventoryReservation {
  id: string;
  order_id: string;
  order_item_id: string;
  batch_id: string;
  batch_number?: string;
  reserved_quantity: number;
  released_quantity: number;
  consumed_quantity: number;
  status: string;
  reserved_at: string;
  released_at?: string;
  consumed_at?: string;
}

export interface AdminOrderStatusHistory {
  id: string;
  order_id: string;
  previous_status?: string;
  new_status: string;
  actor_role?: string;
  reason?: string;
  notes?: string;
  changed_by_id?: string;
  changed_by_name?: string;
  created_at: string;
}

export interface AdminOrderDetail {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  prescription_id?: string;
  status: string;
  payment_status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  delivery_fee: number;
  grand_total: number;
  currency: string;
  delivery_address_snapshot: {
    recipient_name?: string;
    recipient_phone?: string;
    street_address?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  customer_notes?: string;
  admin_notes?: string;
  is_cold_chain_required: boolean;
  placed_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  item_count: number;
  items: AdminOrderItem[];
  batch_allocations: AdminOrderBatchAllocation[];
  reservations: AdminInventoryReservation[];
  status_history: AdminOrderStatusHistory[];
  cancellation?: {
    cancellation_reason: string;
    cancellation_type: string;
    cancellation_status: string;
    created_at: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
    invoice_date: string;
    grand_total: number;
    has_pdf: boolean;
  };
}

export interface AdminOrderMetrics {
  total_orders: number;
  placed: number;
  pending_payment: number;
  payment_confirmed: number;
  pharmacist_review: number;
  processing: number;
  ready_for_dispatch: number;
  dispatched: number;
  delivered: number;
  cancelled: number;
  rejected: number;
  failed: number;
}

export interface AdminOrderListResponse {
  items: AdminOrderDetail[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const adminOrderService = {
  async getMetrics(): Promise<AdminOrderMetrics> {
    return apiClient<AdminOrderMetrics>("/admin/orders/metrics");
  },

  async listOrders(params?: {
    search?: string;
    status?: string;
    payment_status?: string;
    page?: number;
    page_size?: number;
  }): Promise<AdminOrderListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.payment_status) query.set("payment_status", params.payment_status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.page_size) query.set("page_size", params.page_size.toString());

    const qs = query.toString();
    return apiClient<AdminOrderListResponse>(`/admin/orders${qs ? `?${qs}` : ""}`);
  },

  async getOrderDetail(id: string): Promise<AdminOrderDetail> {
    return apiClient<AdminOrderDetail>(`/admin/orders/${id}`);
  },

  async updateStatus(
    id: string,
    newStatus: string,
    notes?: string,
    reason?: string
  ): Promise<AdminOrderDetail> {
    return apiClient<AdminOrderDetail>(`/admin/orders/${id}/status`, {
      method: "POST",
      data: { new_status: newStatus, notes, reason },
    });
  },

  async cancelOrder(id: string, reason: string): Promise<AdminOrderDetail> {
    return apiClient<AdminOrderDetail>(`/admin/orders/${id}/cancel`, {
      method: "POST",
      data: { reason },
    });
  },

  async approvePharmacist(id: string, notes?: string): Promise<AdminOrderDetail> {
    return apiClient<AdminOrderDetail>(`/pharmacist/orders/${id}/approve`, {
      method: "POST",
      data: { notes },
    });
  },

  async rejectPharmacist(id: string, reason: string): Promise<AdminOrderDetail> {
    return apiClient<AdminOrderDetail>(`/pharmacist/orders/${id}/reject`, {
      method: "POST",
      data: { reason },
    });
  },

  async requestClarification(id: string, clarificationNotes: string): Promise<AdminOrderDetail> {
    return apiClient<AdminOrderDetail>(`/pharmacist/orders/${id}/request-clarification`, {
      method: "POST",
      data: { clarification_notes: clarificationNotes },
    });
  },

  async generateInvoice(id: string): Promise<any> {
    return apiClient<any>(`/admin/orders/${id}/generate-invoice`, {
      method: "POST",
    });
  },

  async getInvoiceBlob(orderId: string): Promise<Blob> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = typeof window !== "undefined" ? localStorage.getItem("med24_access_token") : null;
    const response = await fetch(`${baseUrl}/orders/${orderId}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to download invoice");
    }
    return response.blob();
  },
};
