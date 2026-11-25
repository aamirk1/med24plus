import { apiClient, getBaseUrl } from "./api";

export interface OrderItem {
  id: string;
  productId: string;
  batchId?: string;
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

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  previous_status?: string;
  new_status: string;
  actor_role?: string;
  reason?: string;
  notes?: string;
  created_at: string;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  customer_id: string;
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
  is_cold_chain_required: boolean;
  placed_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  item_count: number;
  items: OrderItem[];
  status_history: OrderStatusHistoryItem[];
  cancellation?: {
    cancellation_reason: string;
    cancellation_type: string;
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

export interface OrderListResponse {
  items: OrderDetail[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const orderService = {
  async createOrder(
    data: {
      delivery_address_id: string;
      customer_notes?: string;
      acknowledge_price_changes?: boolean;
      checkout_validation_id?: string;
    },
    idempotencyKey?: string
  ): Promise<OrderDetail> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return apiClient<OrderDetail>("/orders", {
      method: "POST",
      data,
      headers,
    });
  },

  async listOrders(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<OrderListResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.page_size) query.set("page_size", params.page_size.toString());

    const qs = query.toString();
    return apiClient<OrderListResponse>(`/orders${qs ? `?${qs}` : ""}`);
  },

  async getOrderDetail(id: string): Promise<OrderDetail> {
    return apiClient<OrderDetail>(`/orders/${id}`);
  },

  async cancelOrder(id: string, reason: string): Promise<OrderDetail> {
    return apiClient<OrderDetail>(`/orders/${id}/cancel`, {
      method: "POST",
      data: { reason },
    });
  },

  async getInvoiceBlob(orderId: string): Promise<Blob> {
    const baseUrl = getBaseUrl();
    const token = typeof window !== "undefined" ? localStorage.getItem("med24_access_token") : null;
    const response = await fetch(`${baseUrl}/orders/${orderId}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to download Form 20 cash memo invoice");
    }
    return response.blob();
  },
};
