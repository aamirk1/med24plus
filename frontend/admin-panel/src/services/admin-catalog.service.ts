import { apiClient } from "./api";

export interface CategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface BrandPayload {
  name: string;
  slug?: string;
  manufacturer_name: string;
  logo_url?: string;
  description?: string;
  country_of_origin?: string;
  is_active?: boolean;
}

export interface ProductPayload {
  name: string;
  slug?: string;
  sku: string;
  generic_name: string;
  composition?: string;
  category_id: string;
  brand_id: string;
  manufacturer: string;
  marketer?: string;
  description?: string;
  pack_size: string;
  dosage_form: string;
  strength?: string;
  route_of_administration?: string;
  storage_temperature?: string;
  is_cold_chain?: boolean;
  requires_prescription?: boolean;
  schedule_classification?: string;
  is_restricted?: boolean;
  mrp: number;
  selling_price: number;
  hsn_code: string;
  gst_rate?: number;
  tag_badge?: string;
  is_active?: boolean;
}

export const adminCatalogService = {
  // Products
  async getProducts(params: {
    search?: string;
    category_id?: string;
    brand_id?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.append("search", params.search);
    if (params.category_id) q.append("category_id", params.category_id);
    if (params.brand_id) q.append("brand_id", params.brand_id);
    if (params.is_active !== undefined) q.append("is_active", String(params.is_active));
    if (params.page) q.append("page", String(params.page));
    if (params.page_size) q.append("page_size", String(params.page_size));

    const res = await apiClient<any>(`/products?${q.toString()}`);
    return res.data;
  },

  async getProduct(productId: string) {
    try {
      const res = await apiClient<any>(`/admin/products/${productId}`);
      if (res?.data) return res.data;
    } catch (e) {
      console.warn("Could not fetch via /admin/products, falling back to /products:", e);
    }
    const res = await apiClient<any>(`/products/${productId}`);
    return res.data;
  },

  async createProduct(data: ProductPayload) {
    const res = await apiClient<any>("/admin/products", {
      method: "POST",
      data,
    });
    return res.data;
  },

  async updateProduct(productId: string, data: Partial<ProductPayload>) {
    const res = await apiClient<any>(`/admin/products/${productId}`, {
      method: "PUT",
      data,
    });
    return res.data;
  },

  async setProductStatus(productId: string, isActive: boolean) {
    const res = await apiClient<any>(`/admin/products/${productId}/status`, {
      method: "PATCH",
      data: { is_active: isActive },
    });
    return res.data;
  },

  async deleteProduct(productId: string) {
    const res = await apiClient<any>(`/admin/products/${productId}`, {
      method: "DELETE",
    });
    return res.data;
  },

  async uploadProductImage(productId: string, formData: FormData) {
    const res = await apiClient<any>(`/admin/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    return res.data;
  },

  async setPrimaryProductImage(productId: string, imageId: string) {
    const res = await apiClient<any>(`/admin/products/${productId}/images/${imageId}/primary`, {
      method: "PATCH",
    });
    return res.data;
  },

  async deleteProductImage(productId: string, imageId: string) {
    const res = await apiClient<any>(`/admin/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    });
    return res.data;
  },

  async uploadImage(file: File, folder: string = "catalog", subfolder?: string): Promise<{ url: string; filename?: string }> {
    const formData = new FormData();
    formData.append("file", file);
    let endpoint = `/admin/upload/image?folder=${encodeURIComponent(folder)}`;
    if (subfolder) {
      endpoint += `&subfolder=${encodeURIComponent(subfolder)}`;
    }
    const res = await apiClient<any>(endpoint, {
      method: "POST",
      body: formData,
    });
    return res.data;
  },

  async syncImagesToFirebase(): Promise<any> {
    const res = await apiClient<any>("/admin/upload/sync-to-firebase", {
      method: "POST",
    });
    return res.data;
  },

  // Categories
  async getCategories(params: { search?: string; is_active?: boolean; page?: number; page_size?: number } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.append("search", params.search);
    if (params.is_active !== undefined) q.append("is_active", String(params.is_active));
    if (params.page) q.append("page", String(params.page));
    q.append("page_size", String(params.page_size || 100));

    const res = await apiClient<any>(`/categories?${q.toString()}`);
    return res.data;
  },

  async createCategory(data: CategoryPayload) {
    const res = await apiClient<any>("/admin/categories", {
      method: "POST",
      data,
    });
    return res.data;
  },

  async updateCategory(categoryId: string, data: Partial<CategoryPayload>) {
    const res = await apiClient<any>(`/admin/categories/${categoryId}`, {
      method: "PUT",
      data,
    });
    return res.data;
  },

  async setCategoryStatus(categoryId: string, isActive: boolean) {
    const res = await apiClient<any>(`/admin/categories/${categoryId}/status`, {
      method: "PATCH",
      data: { is_active: isActive },
    });
    return res.data;
  },

  async deleteCategory(categoryId: string) {
    const res = await apiClient<any>(`/admin/categories/${categoryId}`, {
      method: "DELETE",
    });
    return res.data;
  },

  // Brands
  async getBrands(params: { search?: string; is_active?: boolean; page?: number; page_size?: number } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.append("search", params.search);
    if (params.is_active !== undefined) q.append("is_active", String(params.is_active));
    if (params.page) q.append("page", String(params.page));
    q.append("page_size", String(params.page_size || 100));

    const res = await apiClient<any>(`/brands?${q.toString()}`);
    return res.data;
  },

  async createBrand(data: BrandPayload) {
    const res = await apiClient<any>("/admin/brands", {
      method: "POST",
      data,
    });
    return res.data;
  },

  async updateBrand(brandId: string, data: Partial<BrandPayload>) {
    const res = await apiClient<any>(`/admin/brands/${brandId}`, {
      method: "PUT",
      data,
    });
    return res.data;
  },

  async setBrandStatus(brandId: string, isActive: boolean) {
    const res = await apiClient<any>(`/admin/brands/${brandId}/status`, {
      method: "PATCH",
      data: { is_active: isActive },
    });
    return res.data;
  },

  async deleteBrand(brandId: string) {
    const res = await apiClient<any>(`/admin/brands/${brandId}`, {
      method: "DELETE",
    });
    return res.data;
  },
};

