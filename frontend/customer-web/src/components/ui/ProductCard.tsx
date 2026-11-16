"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShoppingBag, Plus, Check } from "lucide-react";
import { Product } from "@/types";
import { PriceDisplay } from "./PriceDisplay";
import { PrescriptionBadge } from "./PrescriptionBadge";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  product: Product;
  className?: string;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  onAddToCart,
}) => {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-card",
        className
      )}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <PrescriptionBadge
            required={product.requiresPrescription}
            scheduleType={product.scheduleType}
          />
          {product.discountPercent > 0 && (
            <span className="text-[10px] font-bold text-[#087F5B] bg-[#E6F4EF] px-1.5 py-0.5 rounded">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Product Image Placeholder */}
        <Link href={`/products/${product.slug}`} className="block relative aspect-square w-full rounded-lg bg-slate-50 flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:bg-slate-100/70 transition">
          <div className="w-16 h-16 rounded-xl bg-white shadow-subtle border border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-8 h-8 text-[#087F5B]/70" />
          </div>
        </Link>

        {/* Brand & Pack Size */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="font-medium text-slate-600 truncate max-w-[120px]">{product.brand}</span>
          <span className="text-slate-400">{product.packSize}</span>
        </div>

        {/* Product Title */}
        <Link href={`/products/${product.slug}`} className="block group-hover:text-[#087F5B] transition">
          <h3 className="text-xs font-bold text-[#172B24] line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-800">
            <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
            <span>{product.rating}</span>
          </div>
          <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
        </div>
      </div>

      {/* Bottom Price & Add Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <PriceDisplay mrp={product.mrp} sellingPrice={product.sellingPrice} size="sm" />
        <Button
          size="sm"
          variant={added ? "light" : "outline"}
          onClick={handleAdd}
          className="h-8 px-2.5 text-xs font-semibold shrink-0"
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#087F5B]" />
              <span className="text-[#087F5B]">Added</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

