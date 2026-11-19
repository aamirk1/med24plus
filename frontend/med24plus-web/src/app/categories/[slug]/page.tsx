"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { catalogService } from "@/services/catalog.service";
import { MedicineCategory, Product } from "@/types";
import { Loader2 } from "lucide-react";

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<MedicineCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const cats = await catalogService.getCategories();
        const found = cats.find((c) => c.slug === slug) || {
          id: slug,
          name: slug.charAt(0).toUpperCase() + slug.slice(1).replace("-", " "),
          slug,
          description: "Verified medications in this therapeutic class.",
          iconName: "Pill",
          itemCount: 0,
        };
        setCategory(found);

        const res = await catalogService.getProducts({
          category_id: found.id,
          page_size: 20,
        });
        setProducts(res.items);
      } catch (e) {
        console.error("Failed to load category products:", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-xs font-medium">Loading category products...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Categories", href: "/categories" },
          { label: category?.name || slug },
        ]}
      />

      <div className="bg-[#F0FDFA]/50 border border-[#CCFBF1] rounded-2xl p-6 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
          Therapeutic Category
        </span>
        <h1 className="text-2xl font-bold text-[#172B24]">{category?.name}</h1>
        <p className="text-xs text-slate-600 max-w-2xl">{category?.description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {products.length} product(s)</span>
          <Link href="/products" className="text-[#0D9488] font-semibold hover:underline">
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
