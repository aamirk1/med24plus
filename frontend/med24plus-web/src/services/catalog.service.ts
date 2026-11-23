import { apiClient } from "./api";
import { Product, MedicineCategory, Brand } from "@/types";

export interface ProductQueryParams {
  search?: string;
  category_id?: string;
  brand_id?: string;
  min_price?: number;
  max_price?: number;
  prescription_required?: boolean;
  dosage_form?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export const catalogService = {
  async getProducts(params: ProductQueryParams = {}): Promise<PaginatedResult<Product>> {
    try {
      const q = new URLSearchParams();
      if (params.search) q.append("search", params.search);
      if (params.category_id) q.append("category_id", params.category_id);
      if (params.brand_id) q.append("brand_id", params.brand_id);
      if (params.min_price) q.append("min_price", String(params.min_price));
      if (params.max_price) q.append("max_price", String(params.max_price));
      if (params.prescription_required !== undefined) {
        q.append("prescription_required", String(params.prescription_required));
      }
      if (params.dosage_form) q.append("dosage_form", params.dosage_form);
      if (params.sort_by) q.append("sort_by", params.sort_by);
      if (params.page) q.append("page", String(params.page));
      if (params.page_size) q.append("page_size", String(params.page_size));

      const res = await apiClient<any>(`/products?${q.toString()}`);
      if (res?.success && res.data?.items) {
        const mappedItems: Product[] = res.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          brand: item.brand?.name || item.brand_name || "Med24Plus Pharmacy",
          categorySlug: item.category?.slug || "general",
          categoryName: item.category?.name || "General Medicine",
          mrp: parseFloat(item.mrp),
          sellingPrice: parseFloat(item.selling_price),
          discountPercent: parseFloat(item.discount_percent || "0"),
          packSize: item.pack_size || "1 Strip",
          dosageForm: item.dosage_form || "Tablet",
          composition: item.generic_name || "",
          inStock: item.is_in_stock ?? true,
          stockCount: item.sellable_quantity ?? 0,
          requiresPrescription: item.requires_prescription ?? false,
          scheduleType: item.schedule_classification || "OTC",
          rating: 4.8,
          reviewCount: 42,
          images: item.primary_image_url ? [item.primary_image_url] : [],
          description: item.generic_name || "",
          keyBenefits: ["Certified pharmaceutical quality", "Rule 65 batch verified", "FEFO freshness tracking"],
          directionsForUse: "Use as directed by a registered medical practitioner.",
          safetyInformation: ["Keep out of reach of children.", "Store in a cool, dry place away from direct sunlight."],
          manufacturer: item.manufacturer || "Licensed Manufacturer",
          countryOfOrigin: "India",
        }));

        return {
          items: mappedItems,
          pagination: res.data.pagination,
        };
      }
    } catch (e) {
      console.error("Backend catalog API error:", e);
    }

    return {
      items: [],
      pagination: {
        page: params.page || 1,
        page_size: params.page_size || 12,
        total_items: 0,
        total_pages: 1,
      },
    };
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await apiClient<any>(`/products/slug/${slug}`);
      if (res?.success && res.data) {
        const item = res.data;
        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          brand: item.brand?.name || item.brand_name || "Med24Plus Pharmacy",
          categorySlug: item.category?.slug || "general",
          categoryName: item.category?.name || "General Medicine",
          mrp: parseFloat(item.mrp),
          sellingPrice: parseFloat(item.selling_price),
          discountPercent: parseFloat(item.discount_percent || "0"),
          packSize: item.pack_size || "1 Strip",
          dosageForm: item.dosage_form || "Tablet",
          composition: item.composition || item.generic_name || "",
          inStock: item.is_in_stock ?? true,
          stockCount: item.sellable_quantity ?? 0,
          requiresPrescription: item.requires_prescription ?? false,
          scheduleType: item.schedule_classification || "OTC",
          rating: 4.8,
          reviewCount: 42,
          images: item.images?.length > 0 ? item.images.map((img: any) => img.image_url) : [],
          description: item.description || item.generic_name || "",
          keyBenefits: [
            "100% Genuine and authentic stock",
            "Batch-level expiry inspection",
            "Stored under verified temperature conditions",
          ],
          directionsForUse: "Use as directed by your physician or pharmacist.",
          safetyInformation: [
            "Read the label carefully before use.",
            "Do not exceed recommended dose.",
            "Keep out of reach of children.",
          ],
          manufacturer: item.manufacturer || "Licensed Manufacturer",
          countryOfOrigin: item.brand?.country_of_origin || "India",
        };
      }
    } catch (e) {
      console.error(`Product slug ${slug} not found via API:`, e);
    }

    return null;
  },

  async getCategories(): Promise<MedicineCategory[]> {
    try {
      const res = await apiClient<any>("/categories?is_active=true&page_size=100");
      if (res?.success && res.data?.items) {
        return res.data.items.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || "",
          iconName: "Pill",
          itemCount: 0,
          image: cat.image_url || undefined,
        }));
      }
    } catch (e) {
      console.error("Categories API error:", e);
    }
    return [];
  },

  async getBrands(): Promise<Brand[]> {
    try {
      const res = await apiClient<any>("/brands?is_active=true&page_size=100");
      if (res?.success && res.data?.items) {
        return res.data.items.map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logoText: b.name.substring(0, 3).toUpperCase(),
          origin: b.country_of_origin || "India",
          isPopular: true,
        }));
      }
    } catch (e) {
      console.error("Brands API error:", e);
    }
    return [];
  },
};
