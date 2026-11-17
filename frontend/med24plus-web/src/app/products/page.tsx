"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SearchInput } from "@/components/ui/SearchInput";
import { ProductCard } from "@/components/ui/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dropdown } from "@/components/ui/Dropdown";
import { Checkbox } from "@/components/ui/Checkbox";
import { Filter, SlidersHorizontal, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { catalogService } from "@/services/catalog.service";
import { Product, MedicineCategory, Brand } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [prescriptionOnly, setPrescriptionOnly] = useState<boolean | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Load initial taxonomy
  useEffect(() => {
    async function loadTaxonomy() {
      const [cats, brs] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getBrands(),
      ]);
      setCategories(cats);
      setBrands(brs);
    }
    loadTaxonomy();
  }, []);

  // Fetch products upon filter changes
  useEffect(() => {
    let isCancelled = false;
    async function loadProducts() {
      setIsLoading(true);
      try {
        const catObj = categories.find((c) => c.slug === selectedCategory);
        const brandObj = brands.find((b) => b.name.toLowerCase() === selectedBrand.toLowerCase());

        const res = await catalogService.getProducts({
          search: search || undefined,
          category_id: catObj ? catObj.id : undefined,
          brand_id: brandObj ? brandObj.id : undefined,
          max_price: priceRange < 2000 ? priceRange : undefined,
          prescription_required: prescriptionOnly,
          sort_by:
            sortBy === "price-low"
              ? "price_asc"
              : sortBy === "price-high"
              ? "price_desc"
              : sortBy === "name"
              ? "name"
              : "newest",
          page: currentPage,
          page_size: 9,
        });

        if (!isCancelled) {
          setProducts(res.items);
          setTotalPages(res.pagination.total_pages);
          setTotalItems(res.pagination.total_items);
        }
      } catch (err) {
        console.error("Failed to load products from catalog API:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadProducts();
    return () => {
      isCancelled = true;
    };
  }, [search, selectedCategory, selectedBrand, priceRange, sortBy, currentPage, prescriptionOnly, categories, brands]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setPrescriptionOnly(undefined);
    setPriceRange(2000);
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Products", href: "/products" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Medicines & Healthcare Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {totalItems} verified non-restricted pharmaceutical items with real-time stock availability
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Sort by:</span>
          <Dropdown
            label="Sort"
            selectedItem={
              sortBy === "newest"
                ? "Newest Arrivals"
                : sortBy === "price-low"
                ? "Price: Low to High"
                : sortBy === "price-high"
                ? "Price: High to Low"
                : "Name (A-Z)"
            }
            items={[
              { label: "Newest Arrivals", value: "newest" },
              { label: "Price: Low to High", value: "price-low" },
              { label: "Price: High to Low", value: "price-high" },
              { label: "Name (A-Z)", value: "name" },
            ]}
            onSelect={(item) => {
              setSortBy(item.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Search & Mobile Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search medicine brand, composition (e.g. Paracetamol, Azithromycin)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            onClear={() => setSearch("")}
          />
        </div>
        <Button
          variant="outline"
          size="md"
          className="sm:hidden flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4 text-slate-600" />
          <span>Filters</span>
        </Button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-6 shadow-subtle">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[#087F5B] hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#172B24] block">Category</label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition ${
                    selectedCategory === "all"
                      ? "bg-[#E6F4EF] text-[#087F5B] font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition ${
                      selectedCategory === cat.slug
                        ? "bg-[#E6F4EF] text-[#087F5B] font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescription Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-[#172B24] block">Prescription</label>
              <div className="space-y-2">
                <Checkbox
                  id="rx-all"
                  label="All Products"
                  checked={prescriptionOnly === undefined}
                  onChange={() => {
                    setPrescriptionOnly(undefined);
                    setCurrentPage(1);
                  }}
                />
                <Checkbox
                  id="rx-req"
                  label="Requires Prescription (Rx)"
                  checked={prescriptionOnly === true}
                  onChange={() => {
                    setPrescriptionOnly(prescriptionOnly === true ? undefined : true);
                    setCurrentPage(1);
                  }}
                />
                <Checkbox
                  id="rx-otc"
                  label="Over The Counter (OTC)"
                  checked={prescriptionOnly === false}
                  onChange={() => {
                    setPrescriptionOnly(prescriptionOnly === false ? undefined : false);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-[#172B24]">
                <span>Max Price</span>
                <span className="text-[#087F5B] font-bold">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-[#087F5B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹50</span>
                <span>₹2000+</span>
              </div>
            </div>

            {/* Brands Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-[#172B24] block">Brand</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand("all");
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left text-xs py-1 px-2 rounded-lg transition ${
                    selectedBrand === "all"
                      ? "bg-[#E6F4EF] text-[#087F5B] font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All Brands
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand.id || brand.slug}
                    type="button"
                    onClick={() => {
                      setSelectedBrand(brand.name);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left text-xs py-1 px-2 rounded-lg transition ${
                      selectedBrand.toLowerCase() === brand.name.toLowerCase()
                        ? "bg-[#E6F4EF] text-[#087F5B] font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
              <p className="text-xs font-medium">Checking live pharmacy inventory...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-6 border-t border-slate-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No medicines match your filter criteria"
              description="Try adjusting your price range, searching for another salt composition, or clearing active filters."
              action={
                <Button variant="primary" size="sm" onClick={resetFilters}>
                  Clear All Filters
                </Button>
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
