import { apiClient } from "./api";

export interface AddressItem {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_phone?: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  address_type: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressCreatePayload {
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  address_type?: string;
  is_default?: boolean;
}

export interface AddressUpdatePayload {
  recipient_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address_type?: string;
  is_default?: boolean;
}

export const addressService = {
  async list(): Promise<AddressItem[]> {
    const res = await apiClient<{ success: boolean; data: AddressItem[] }>("/addresses");
    return res.data || [];
  },

  async get(id: string): Promise<AddressItem> {
    const res = await apiClient<{ success: boolean; data: AddressItem }>(`/addresses/${id}`);
    return res.data;
  },

  async create(payload: AddressCreatePayload): Promise<AddressItem> {
    const res = await apiClient<{ success: boolean; data: AddressItem }>("/addresses", {
      method: "POST",
      data: payload,
    });
    return res.data;
  },

  async update(id: string, payload: AddressUpdatePayload): Promise<AddressItem> {
    const res = await apiClient<{ success: boolean; data: AddressItem }>(`/addresses/${id}`, {
      method: "PATCH",
      data: payload,
    });
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient(`/addresses/${id}`, {
      method: "DELETE",
    });
  },

  async setDefault(id: string): Promise<AddressItem> {
    const res = await apiClient<{ success: boolean; data: AddressItem }>(`/addresses/${id}/set-default`, {
      method: "POST",
    });
    return res.data;
  },
};
