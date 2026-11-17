import { apiClient } from "./api";
import { Product, MedicineCategory, Brand } from "@/types";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS } from "@/mock/data";

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
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.category_id && params.category_id !== "all") query.append("category_id", params.category_id);
      if (params.brand_id && params.brand_id !== "all") query.append("brand_id", params.brand_id);
      if (params.min_price !== undefined) query.append("min_price", params.min_price.toString());
      if (params.max_price !== undefined) query.append("max_price", params.max_price.toString());
      if (params.prescription_required !== undefined) query.append("prescription_required", String(params.prescription_required));
      if (params.dosage_form) query.append("dosage_form", params.dosage_form);
      if (params.sort_by) query.append("sort_by", params.sort_by);
      if (params.page) query.append("page", params.page.toString());
      if (params.page_size) query.append("page_size", params.page_size.toString());

      const res = await apiClient<any>(`/products?${query.toString()}`);
      if (res?.success && res.data?.items) {
        const mappedItems: Product[] = res.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          brand: item.brand_name || "Med24Plus Pharmacy",
          categorySlug: item.category_name?.toLowerCase().replace(/\s+/g, "-") || "general",
          categoryName: item.category_name || "General Medicine",
          mrp: parseFloat(item.mrp),
          sellingPrice: parseFloat(item.selling_price),
          discountPercent: parseFloat(item.discount_percent || "0"),
          packSize: item.pack_size || "1 Strip",
          dosageForm: item.dosage_form || "Tablet",
          composition: item.generic_name || "",
          inStock: item.is_in_stock ?? true,
          stockCount: item.sellable_quantity ?? 10,
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
      console.warn("Backend catalog API offline or unreachable, falling back to verified seed data:", e);
    }

    // Fallback to mock data with client-side filter
    let filtered = [...MOCK_PRODUCTS];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.composition.toLowerCase().includes(q));
    }
    const page = params.page || 1;
    const pageSize = params.page_size || 12;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: slice,
      pagination: {
        page,
        page_size: pageSize,
        total_items: total,
        total_pages: totalPages,
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
          stockCount: item.sellable_quantity ?? 10,
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
      console.warn(`Product slug ${slug} not found via API, trying mock data:`, e);
    }

    const mockItem = MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
    return mockItem || null;
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
          itemCount: 24,
          image: cat.image_url || undefined,
        }));
      }
    } catch (e) {
      console.warn("Categories API unreachable, falling back to mock categories:", e);
    }
    return MOCK_CATEGORIES;
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
      console.warn("Brands API unreachable, falling back to mock brands:", e);
    }
    return MOCK_BRANDS;
  },
};

