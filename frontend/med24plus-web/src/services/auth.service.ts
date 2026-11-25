import { apiClient } from "./api";

export interface UserProfile {
  gender?: string | null;
  date_of_birth?: string | null;
  blood_group?: string | null;
  emergency_contact?: string | null;
  avatar_url?: string | null;
}

export interface User {
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
  profile?: UserProfile | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: User;
    dev_otp?: string;
    verified?: boolean;
    dispatched?: boolean;
    logged_out?: boolean;
    reset?: boolean;
  };
}

export const authService = {
  async register(data: {
    full_name: string;
    phone: string;
    password: string;
    confirm_password: string;
    email?: string;
  }): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      data,
    });
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      data: { identifier, password },
    });
    if (res?.data?.access_token && typeof window !== "undefined") {
      localStorage.setItem("med24_access_token", res.data.access_token);
    }
    return res;
  },

  async getMe(): Promise<{ success: boolean; data: User }> {
    return apiClient<{ success: boolean; data: User }>("/auth/me", {
      method: "GET",
    });
  },

  async logout(): Promise<AuthResponse> {
    try {
      return await apiClient<AuthResponse>("/auth/logout", {
        method: "POST",
      });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("med24_access_token");
      }
    }
  },

  async sendOtp(target: string, purpose: "phone_verification" | "email_verification" | "password_reset" | "login"): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/otp/send", {
      method: "POST",
      data: { target, purpose },
    });
  },

  async verifyOtp(target: string, otp_code: string, purpose: "phone_verification" | "email_verification" | "password_reset" | "login"): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/otp/verify", {
      method: "POST",
      data: { target, otp_code, purpose },
    });
  },

  async forgotPassword(identifier: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/forgot-password", {
      method: "POST",
      data: { identifier },
    });
  },

  async resetPassword(data: {
    identifier: string;
    otp_code: string;
    new_password: string;
    confirm_password: string;
  }): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/reset-password", {
      method: "POST",
      data,
    });
  },

  async updateProfile(data: {
    full_name?: string;
    email?: string;
    gender?: string;
    date_of_birth?: string;
    blood_group?: string;
    emergency_contact?: string;
  }): Promise<{ success: boolean; message: string; data: UserProfile }> {
    return apiClient<{ success: boolean; message: string; data: UserProfile }>("/users/me/profile", {
      method: "PUT",
      data,
    });
  },
};

