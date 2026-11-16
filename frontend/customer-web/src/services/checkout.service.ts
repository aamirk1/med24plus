import { apiClient } from "./api";
import { AddressItem } from "./address.service";

export interface CheckoutValidateRequest {
  delivery_address_id: string;
  acknowledge_price_changes?: boolean;
}

export interface CheckoutValidationResponse {
  id: string;
  cart_id: string;
  customer_id: string;
  delivery_address_id?: string | null;
  selected_address?: AddressItem | null;
  validation_status: "valid" | "valid_with_warnings" | "blocked" | string;
  is_eligible_for_checkout: boolean;
  is_address_serviceable: boolean;
  serviceability_message?: string | null;
  estimated_delivery_hours?: number | null;
  subtotal: number | string;
  discount_total: number | string;
  tax_total: number | string;
  delivery_fee: number | string;
  grand_total: number | string;
  tax_breakdown: {
    taxable_subtotal?: number | string;
    cgst_amount?: number | string;
    sgst_amount?: number | string;
    igst_amount?: number | string;
    total_tax?: number | string;
    rate_breakdowns?: Array<{
      rate: number | string;
      taxable_amount: number | string;
      cgst: number | string;
      sgst: number | string;
      igst: number | string;
    }>;
  };
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_slug: string;
    product_sku: string;
    pack_size: string;
    dosage_form: string;
    quantity: number;
    unit_price: number | string;
    unit_mrp: number | string;
    subtotal: number | string;
    discount_amount: number | string;
    tax_amount: number | string;
    is_available: boolean;
    sellable_stock: number;
    requires_prescription: boolean;
    prescription_status: string;
    validation_status: string;
    is_price_changed?: boolean;
    previous_price?: number | string;
  }>;
  warnings: string[];
  blocking_errors: string[];
  validation_errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  calculated_at: string;
  expires_at: string;
}

export interface CheckoutSummaryResponse {
  cart_id: string;
  validation_status: string;
  is_eligible_for_checkout: boolean;
  subtotal: number | string;
  discount_total: number | string;
  tax_total: number | string;
  delivery_fee: number | string;
  grand_total: number | string;
  item_count: number;
  items: any[];
  selected_address?: AddressItem | null;
  is_address_serviceable: boolean;
  serviceability_message?: string | null;
  warnings: string[];
  blocking_errors: string[];
  expires_at?: string | null;
}

export interface ServiceabilityCheckResponse {
  pincode: string;
  is_serviceable: boolean;
  city?: string | null;
  state?: string | null;
  area_name?: string | null;
  estimated_delivery_hours?: number | null;
  message: string;
}

export const checkoutService = {
  async validate(payload: CheckoutValidateRequest): Promise<CheckoutValidationResponse> {
    const res = await apiClient<{ success: boolean; data: CheckoutValidationResponse }>(
      "/checkout/validate",
      {
        method: "POST",
        data: payload,
      }
    );
    return res.data;
  },

  async getSummary(addressId?: string): Promise<CheckoutSummaryResponse> {
    const query = addressId ? `?address_id=${addressId}` : "";
    const res = await apiClient<{ success: boolean; data: CheckoutSummaryResponse }>(
      `/checkout/summary${query}`
    );
    return res.data;
  },

  async checkServiceability(pincode: string): Promise<ServiceabilityCheckResponse> {
    const res = await apiClient<{ success: boolean; data: ServiceabilityCheckResponse }>(
      `/checkout/serviceability/${pincode}`
    );
    return res.data;
  },
};
