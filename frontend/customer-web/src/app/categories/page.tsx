import React from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { MOCK_CATEGORIES } from "@/mock/data";

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb items={[{ label: "Categories", href: "/categories" }]} />

      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Explore All Medicine Categories</h1>
        <p className="text-xs text-slate-500 mt-1">
          Browse our licensed pharmacy catalog organized by health condition and clinical therapeutic class
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {MOCK_CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}

