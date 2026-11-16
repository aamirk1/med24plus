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
  created_at: string;
}

export interface Prescription {
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
  files: PrescriptionFile[];
  items: PrescriptionItem[];
  review_logs: PrescriptionReviewLog[];
}

export interface PaginatedPrescriptions {
  items: Prescription[];
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

export const prescriptionService = {
  async listPrescriptions(status?: string, page: number = 1, pageSize: number = 20): Promise<APIResponse<PaginatedPrescriptions>> {
    let url = `/prescriptions?page=${page}&page_size=${pageSize}`;
    if (status && status !== "ALL") {
      url += `&status=${encodeURIComponent(status.toLowerCase())}`;
    }
    return apiClient<APIResponse<PaginatedPrescriptions>>(url);
  },

  async getPrescription(id: string): Promise<APIResponse<Prescription>> {
    return apiClient<APIResponse<Prescription>>(`/prescriptions/${id}`);
  },

  async uploadPrescription(formData: FormData): Promise<APIResponse<Prescription>> {
    return apiClient<APIResponse<Prescription>>("/prescriptions", {
      method: "POST",
      body: formData,
    });
  },

  async submitClarification(id: string, formData: FormData): Promise<APIResponse<Prescription>> {
    return apiClient<APIResponse<Prescription>>(`/prescriptions/${id}/clarification-files`, {
      method: "POST",
      body: formData,
    });
  },

  async cancelPrescription(id: string, reason?: string): Promise<APIResponse<Prescription>> {
    return apiClient<APIResponse<Prescription>>(`/prescriptions/${id}/cancel`, {
      method: "POST",
      data: { reason },
    });
  },
};

