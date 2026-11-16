"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/mock/data";

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const category =
    MOCK_CATEGORIES.find((c) => c.slug === slug) || MOCK_CATEGORIES[0];

  const products = MOCK_PRODUCTS.filter(
    (p) => p.categorySlug === category.slug
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />

      <div className="bg-[#E6F4EF]/50 border border-[#C3E7DB] rounded-2xl p-6 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#087F5B]">
          Therapeutic Category
        </span>
        <h1 className="text-2xl font-bold text-[#172B24]">{category.name}</h1>
        <p className="text-xs text-slate-600 max-w-2xl">{category.description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {products.length} product(s)</span>
          <Link href="/products" className="text-[#087F5B] font-semibold hover:underline">
            View All Products
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No items found in this category currently"
            description="Our inventory is refreshed daily by our pharmacy procurement team."
            action={
              <Link href="/products">
                <Button variant="primary" size="sm">
                  Browse All Categories
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

