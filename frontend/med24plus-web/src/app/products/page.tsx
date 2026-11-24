"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  ShieldCheck,
  Truck,
  Headphones,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  ChevronDown,
  Pill,
} from "lucide-react";
import { catalogService } from "@/services/catalog.service";
import { Product, Brand, MedicineCategory } from "@/types";
import { ProductCard } from "@/components/ui/ProductCard";
import { MembershipBanner } from "@/components/common/MembershipBanner";

const PRICE_RANGES = [
  { id: "all", label: "All Prices", min: undefined, max: undefined },
  { id: "under-50", label: "Under ₹50", min: undefined, max: 50 },
  { id: "50-100", label: "₹50 – ₹100", min: 50, max: 100 },
  { id: "100-200", label: "₹100 – ₹200", min: 100, max: 200 },
  { id: "above-200", label: "Above ₹200", min: 200, max: undefined },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [search, setSearch] = useState<string>("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [prescriptionRequired, setPrescriptionRequired] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [showAllBrands, setShowAllBrands] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Initial Taxonomy Load
  useEffect(() => {
    Promise.all([catalogService.getBrands(), catalogService.getCategories()])
      .then(([brList, catList]) => {
        if (brList) setBrands(brList);
        if (catList) setCategories(catList);
      })
      .catch((err) => console.warn("Could not load taxonomy:", err));
  }, []);

  // Fetch Products on Filter Change
  useEffect(() => {
    let isCancelled = false;
    async function loadProducts() {
      setIsLoading(true);
      try {
        const activeRange = PRICE_RANGES.find((r) => r.id === selectedPriceRange);

        const res = await catalogService.getProducts({
          search: search || undefined,
          brand_id: selectedBrandIds.length === 1 ? selectedBrandIds[0] : undefined,
          min_price: activeRange?.min,
          max_price: activeRange?.max,
          prescription_required: prescriptionRequired,
          sort_by:
            sortBy === "price_asc"
              ? "price_asc"
              : sortBy === "price_desc"
              ? "price_desc"
              : sortBy === "name"
              ? "name"
              : "newest",
          page: currentPage,
          page_size: 12,
        });

        if (!isCancelled) {
          let items = res.items || [];
          // Client-side brand filter if multiple brands selected
          if (selectedBrandIds.length > 1) {
            const selectedBrandNames = brands
              .filter((b) => selectedBrandIds.includes(b.id))
              .map((b) => b.name.toLowerCase());
            items = items.filter((p) =>
              selectedBrandNames.some((bName) => p.brand.toLowerCase().includes(bName))
            );
          }
          if (inStockOnly) {
            items = items.filter((p) => p.inStock);
          }

          setProducts(items);
          setTotalPages(res.pagination.total_pages || 1);
          setTotalItems(res.pagination.total_items || items.length);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadProducts();
    return () => {
      isCancelled = true;
    };
  }, [
    search,
    selectedBrandIds,
    selectedPriceRange,
    inStockOnly,
    prescriptionRequired,
    sortBy,
    currentPage,
    brands,
  ]);

  const toggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedBrandIds([]);
    setSelectedPriceRange("all");
    setInStockOnly(false);
    setPrescriptionRequired(undefined);
    setSortBy("popular");
    setCurrentPage(1);
  };

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left text-slate-800">
      {/* 1. Breadcrumb Bar */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-[#0052CC] flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#0052CC] font-bold">Medicines</span>
      </nav>

      {/* 2. Category Hero Strip (Matching Image 2) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EBF5FC] via-[#F2F9FE] to-[#DDEEFA] border border-sky-100 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B3060] tracking-tight">
                Medicines
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                Stay Healthy, Live Better
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <span>Genuine Medicines</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-[#0052CC]" />
                </div>
                <span>Fast Delivery Across India</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4 text-cyan-700" />
                </div>
                <span>24x7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Visual Graphic */}
          <div className="hidden md:flex items-center justify-center shrink-0">
            <div className="w-32 h-24 rounded-2xl bg-white/70 border border-sky-200/60 p-3 flex flex-col items-center justify-center relative shadow-xs">
              <Pill className="w-10 h-10 text-[#0052CC]" />
              <span className="text-[10px] font-bold text-slate-500 mt-1">Rule 65 Licensed</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Catalog Section (Filters Sidebar + 4-Col Products Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filters Sidebar (lg:col-span-3) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0052CC]" />
              <h3 className="font-extrabold text-sm text-slate-900">Filters</h3>
            </div>
            {(selectedBrandIds.length > 0 ||
              selectedPriceRange !== "all" ||
              inStockOnly ||
              prescriptionRequired !== undefined) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] text-[#0052CC] hover:underline font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Brand</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {displayedBrands.length > 0 ? (
                displayedBrands.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrandIds.includes(b.id)}
                      onChange={() => toggleBrand(b.id)}
                      className="w-4 h-4 rounded text-[#0052CC] accent-[#0052CC] border-slate-300 focus:ring-0"
                    />
                    <span className="truncate">{b.name}</span>
                  </label>
                ))
              ) : (
                <div className="text-[11px] text-slate-400">Loading brands...</div>
              )}
            </div>
            {brands.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="text-[11px] font-bold text-[#0052CC] hover:underline pt-1 block"
              >
                {showAllBrands ? "− Show Less" : `+ Show More (${brands.length - 6})`}
              </button>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Price Range
            </h4>
            <div className="space-y-2">
              {PRICE_RANGES.map((range) => (
                <label
                  key={range.id}
                  className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900"
                >
                  <input
                    type="radio"
                    name="price-range"
                    checked={selectedPriceRange === range.id}
                    onChange={() => {
                      setSelectedPriceRange(range.id);
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 accent-[#0052CC] border-slate-300 focus:ring-0"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Availability
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0052CC] accent-[#0052CC] border-slate-300 focus:ring-0"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={prescriptionRequired === true}
                  onChange={(e) =>
                    setPrescriptionRequired(e.target.checked ? true : undefined)
                  }
                  className="w-4 h-4 rounded text-[#0052CC] accent-[#0052CC] border-slate-300 focus:ring-0"
                />
                <span>Prescription Required</span>
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full py-2 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </aside>

        {/* Right Main Products Area (lg:col-span-9) */}
        <main className="lg:col-span-9 space-y-5">
          {/* Top Bar: Count & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-600">
              Showing{" "}
              <span className="font-bold text-slate-900">
                {products.length > 0 ? `1–${products.length}` : "0"}
              </span>{" "}
              of <span className="font-bold text-slate-900">{totalItems}</span> products
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
              >
                <option value="popular">Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Products Grid (4 Columns) */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
              <p className="text-xs font-medium">Loading verified medicines from database...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {products.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isBestSeller={idx < 2 && currentPage === 1}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">No products match your filters</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try clearing selected brand or price filters to see more results from our pharmacy catalog.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] text-white rounded-xl text-xs font-bold hover:bg-[#0043A8] transition shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 4. Bottom Membership Banner (Gift Variant matching Image 2) */}
      <section className="pt-6">
        <MembershipBanner variant="gift" />
      </section>
    </div>
  );
}
