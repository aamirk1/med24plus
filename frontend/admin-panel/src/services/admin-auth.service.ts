import { apiClient } from "./api";

export interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string;
  email: string | null;
  is_active: boolean;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  status: string;
  roles: string[];
  permissions?: string[];
  staff_profile?: {
    employee_id: string;
    department: string;
    designation: string;
  } | null;
  pharmacist_profile?: {
    registration_number: string;
    state_pharmacy_council: string;
    is_verified: boolean;
  } | null;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: AdminUser;
    logged_out?: boolean;
  };
}

export const adminAuthService = {
  async login(identifier: string, password: string): Promise<AdminAuthResponse> {
    return apiClient<AdminAuthResponse>("/admin/auth/login", {
      method: "POST",
      data: { identifier, password },
    });
  },

  async getMe(): Promise<{ success: boolean; data: AdminUser }> {
    return apiClient<{ success: boolean; data: AdminUser }>("/admin/auth/me", {
      method: "GET",
    });
  },

  async logout(): Promise<AdminAuthResponse> {
    return apiClient<AdminAuthResponse>("/admin/auth/logout", {
      method: "POST",
    });
  },
};

