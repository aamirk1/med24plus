import { apiClient } from "./api";
import { AdminCustomer, AdminStaff } from "@/types";

export interface PaginatedCustomers {
  items: AdminCustomer[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface AdminCustomerDetailData extends AdminCustomer {
  gender?: string | null;
  date_of_birth?: string | null;
  blood_group?: string | null;
  emergency_contact?: string | null;
  addresses: Array<{
    id: string;
    recipient_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
    address_type: string;
    is_default: boolean;
  }>;
}

export interface CreateStaffPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  department?: string;
  designation?: string;
  registration_number?: string;
  state_pharmacy_council?: string;
  registration_valid_upto?: string;
}

export const adminCustomerService = {
  async getCustomers(params: {
    search?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<PaginatedCustomers> {
    const q = new URLSearchParams();
    if (params.search) q.append("search", params.search);
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/admin/users/customers?${q.toString()}`);
    return res.data;
  },

  async getCustomer(customerId: string): Promise<AdminCustomerDetailData> {
    const res = await apiClient<any>(`/admin/users/customers/${customerId}`);
    return res.data;
  },

  async getStaff(): Promise<AdminStaff[]> {
    const res = await apiClient<any>("/admin/users/staff");
    return res.data || [];
  },

  async createStaff(payload: CreateStaffPayload): Promise<AdminStaff> {
    const res = await apiClient<any>("/admin/users/staff", {
      method: "POST",
      data: payload,
    });
    return res.data;
  },

  async toggleStaffStatus(userId: string): Promise<any> {
    const res = await apiClient<any>(`/admin/users/staff/${userId}/status`, {
      method: "PATCH",
    });
    return res.data;
  },

  async deleteStaff(userId: string): Promise<any> {
    const res = await apiClient<any>(`/admin/users/staff/${userId}`, {
      method: "DELETE",
    });
    return res.data;
  },
};
