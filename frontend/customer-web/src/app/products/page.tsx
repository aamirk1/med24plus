"use client";

import React, { useState, useMemo } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SearchInput } from "@/components/ui/SearchInput";
import { ProductCard } from "@/components/ui/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dropdown } from "@/components/ui/Dropdown";
import { Checkbox } from "@/components/ui/Checkbox";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS } from "@/mock/data";
import { Filter, SlidersHorizontal, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Filter products
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const matchSearch =
        search === "" ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase()) ||
        product.composition.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "all" || product.categorySlug === selectedCategory;

      const matchBrand =
        selectedBrand === "all" || product.brand.toLowerCase() === selectedBrand.toLowerCase();

      const matchPrice = product.sellingPrice <= priceRange;

      return matchSearch && matchCategory && matchBrand && matchPrice;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.sellingPrice - b.sellingPrice;
      if (sortBy === "price-high") return b.sellingPrice - a.sellingPrice;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviewCount - a.reviewCount; // popularity
    });
  }, [search, selectedCategory, selectedBrand, priceRange, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setPriceRange(2000);
    setSortBy("popularity");
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
            Showing {filteredProducts.length} verified non-restricted pharmaceutical items & medical devices
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Sort by:</span>
          <Dropdown
            label="Sort"
            selectedItem={
              sortBy === "popularity"
                ? "Most Popular"
                : sortBy === "price-low"
                ? "Price: Low to High"
                : sortBy === "price-high"
                ? "Price: High to Low"
                : "Top Rated"
            }
            items={[
              { label: "Most Popular", value: "popularity" },
              { label: "Price: Low to High", value: "price-low" },
              { label: "Price: High to Low", value: "price-high" },
              { label: "Top Rated", value: "rating" },
            ]}
            onSelect={(item) => setSortBy(item.value)}
          />
        </div>
      </div>

      {/* Layout Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-[#172B24] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#087F5B]" />
                Filters
              </span>
              <button
                onClick={resetFilters}
                className="text-xs text-[#087F5B] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#172B24]">Search Within</label>
              <SearchInput
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                onClear={() => setSearch("")}
                placeholder="Product or salt..."
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-[#172B24] block">Category</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left text-xs py-1 px-2 rounded-lg transition ${
                    selectedCategory === "all"
                      ? "bg-[#E6F4EF] text-[#087F5B] font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All Categories
                </button>
                {MOCK_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left text-xs py-1 px-2 rounded-lg transition ${
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

            {/* Price Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#172B24]">Max Price</span>
                <span className="font-bold text-[#087F5B]">₹{priceRange}</span>
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
                <span>₹2,000+</span>
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
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
                {MOCK_BRANDS.map((brand) => (
                  <button
                    key={brand.slug}
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
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="pt-6 border-t border-slate-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
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

