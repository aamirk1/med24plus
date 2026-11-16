import { apiClient } from "./api";

export interface PrescriptionFile {
  id: string;
  prescription_id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  storage_provider: string;
  checksum?: string | null;
  file_category: string;
  is_active: boolean;
  uploaded_at: string;
  secure_view_url?: string | null;
  secure_download_url?: string | null;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  product_id?: string | null;
  product_name?: string | null;
  medicine_name_prescribed: string;
  dosage?: string | null;
  frequency?: string | null;
  duration_days?: number | null;
  quantity_prescribed: number;
  quantity_approved: number;
  is_verified: boolean;
  verification_status: string;
  pharmacist_remarks?: string | null;
}

export interface PrescriptionReviewLog {
  id: string;
  prescription_id: string;
  pharmacist_id: string;
  pharmacist_name?: string | null;
  pharmacist_registration_no?: string | null;
  previous_status: string;
  new_status: string;
  action: string;
  decision: string;
  notes?: string | null;
  remarks?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminCustomerSummary {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone_number: string;
  email?: string | null;
}

export interface AdminPrescription {
  id: string;
  prescription_number: string;
  prescription_reference: string;
  customer_id: string;
  status: string;
  prescription_status: string;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  doctor_name?: string | null;
  doctor_registration_no?: string | null;
  doctor_clinic_or_hospital?: string | null;
  prescription_date?: string | null;
  valid_until?: string | null;
  is_valid: boolean;
  invalidity_reason?: string | null;
  pharmacist_notes?: string | null;
  rejection_reason?: string | null;
  clarification_remarks?: string | null;
  customer_notes?: string | null;
  uploaded_at: string;
  reviewed_at?: string | null;
  rejected_at?: string | null;
  customer?: AdminCustomerSummary | null;
  reviewed_by_name?: string | null;
  rejected_by_name?: string | null;
  under_review_by_name?: string | null;
  files: PrescriptionFile[];
  items: PrescriptionItem[];
  review_logs: PrescriptionReviewLog[];
}

export interface PrescriptionSummaryCounts {
  total: number;
  pending_review: number;
  under_review: number;
  approved: number;
  rejected: number;
  clarification_required: number;
  expired: number;
}

export interface PaginatedAdminPrescriptions {
  items: AdminPrescription[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const adminPrescriptionService = {
  async getCounts(): Promise<APIResponse<PrescriptionSummaryCounts>> {
    return apiClient<APIResponse<PrescriptionSummaryCounts>>("/admin/prescriptions/counts");
  },

  async listQueue(params: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    customer_id?: string;
    pharmacist_id?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<APIResponse<PaginatedAdminPrescriptions>> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL") query.append("status", params.status.toLowerCase());
    if (params.search) query.append("search", params.search);
    if (params.date_from) query.append("date_from", params.date_from);
    if (params.date_to) query.append("date_to", params.date_to);
    if (params.customer_id) query.append("customer_id", params.customer_id);
    if (params.pharmacist_id) query.append("pharmacist_id", params.pharmacist_id);
    query.append("page", (params.page || 1).toString());
    query.append("page_size", (params.page_size || 20).toString());

    return apiClient<APIResponse<PaginatedAdminPrescriptions>>(`/admin/prescriptions?${query.toString()}`);
  },

  async getPrescription(id: string): Promise<APIResponse<AdminPrescription>> {
    return apiClient<APIResponse<AdminPrescription>>(`/admin/prescriptions/${id}`);
  },

  async startReview(id: string): Promise<APIResponse<AdminPrescription>> {
    return apiClient<APIResponse<AdminPrescription>>(`/admin/prescriptions/${id}/start-review`, {
      method: "POST",
    });
  },

  async approve(id: string, data: {
    pharmacist_notes?: string;
    valid_until?: string;
    verified_items?: any[];
  }): Promise<APIResponse<AdminPrescription>> {
    return apiClient<APIResponse<AdminPrescription>>(`/admin/prescriptions/${id}/approve`, {
      method: "POST",
      data,
    });
  },

  async reject(id: string, data: {
    rejection_reason: string;
    pharmacist_notes?: string;
  }): Promise<APIResponse<AdminPrescription>> {
    return apiClient<APIResponse<AdminPrescription>>(`/admin/prescriptions/${id}/reject`, {
      method: "POST",
      data,
    });
  },

  async requestClarification(id: string, data: {
    clarification_remarks: string;
  }): Promise<APIResponse<AdminPrescription>> {
    return apiClient<APIResponse<AdminPrescription>>(`/admin/prescriptions/${id}/request-clarification`, {
      method: "POST",
      data,
    });
  },

  async getHistory(id: string): Promise<APIResponse<PrescriptionReviewLog[]>> {
    return apiClient<APIResponse<PrescriptionReviewLog[]>>(`/admin/prescriptions/${id}/history`);
  },

  async addItem(id: string, data: {
    product_id?: string;
    medicine_name_prescribed: string;
    dosage?: string;
    frequency?: string;
    duration_days?: number;
    quantity_prescribed: number;
  }): Promise<APIResponse<PrescriptionItem>> {
    return apiClient<APIResponse<PrescriptionItem>>(`/admin/prescriptions/${id}/items`, {
      method: "POST",
      data,
    });
  },

  async updateItem(id: string, itemId: string, data: {
    is_verified: boolean;
    quantity_approved: number;
    verification_status: string;
    pharmacist_remarks?: string;
  }): Promise<APIResponse<PrescriptionItem>> {
    return apiClient<APIResponse<PrescriptionItem>>(`/admin/prescriptions/${id}/items/${itemId}`, {
      method: "PUT",
      data,
    });
  },
};

