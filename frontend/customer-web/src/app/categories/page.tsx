"use client";

import React, { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { catalogService } from "@/services/catalog.service";
import { MedicineCategory } from "@/types";
import { Loader2 } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const cats = await catalogService.getCategories();
        setCategories(cats);
      } catch (e) {
        console.error("Failed to load categories:", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb items={[{ label: "Categories", href: "/categories" }]} />

      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Explore All Medicine Categories</h1>
        <p className="text-xs text-slate-500 mt-1">
          Browse our licensed pharmacy catalog organized by health condition and clinical therapeutic class
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
          <p className="text-xs font-medium">Loading clinical categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <CategoryCard key={cat.id || cat.slug} category={cat} />
          ))}
        </div>
      )}
    </div>
  );
}
