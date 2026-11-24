"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Pill, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { formatPriceINR } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export interface ProductCardProps {
  product: Product;
  className?: string;
  isBestSeller?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = "",
  isBestSeller = false,
}) => {
  const { addToCart, isAdding } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await addToCart(product, 1);
    if (ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const discountPercent =
    product.discountPercent ||
    (product.mrp > product.sellingPrice
      ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
      : 0);

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 transition-all duration-200 hover:border-slate-300 hover:shadow-md ${className}`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1 h-5 mb-2">
          {product.tagBadge || (product as any).tag_badge ? (
            <span className="bg-[#0B3A70] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs truncate max-w-[130px]">
              {product.tagBadge || (product as any).tag_badge}
            </span>
          ) : isBestSeller || product.rating >= 4.5 ? (
            <span className="bg-[#0B3A70] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
              Best Seller
            </span>
          ) : product.requiresPrescription ? (
            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
              Rx
            </span>
          ) : (
            <span />
          )}

          {discountPercent > 0 && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Product Image Area */}
        <Link
          href={`/products/${product.slug || product.id}`}
          className="block relative aspect-square w-full rounded-xl bg-slate-50/50 flex items-center justify-center p-2 mb-3 overflow-hidden group-hover:bg-slate-100/60 transition"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                // Fallback to placeholder icon
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
              <Pill className="w-8 h-8 text-[#0052CC]/70" />
            </div>
          )}
        </Link>

        {/* Product Title & Packaging */}
        <div className="text-left space-y-0.5">
          <Link
            href={`/products/${product.slug || product.id}`}
            className="block group-hover:text-[#0052CC] transition"
          >
            <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 line-clamp-2 leading-tight min-h-[2rem]">
              {product.name}
            </h4>
          </Link>
          <p className="text-[11px] text-slate-400 truncate">
            {product.packSize || product.dosageForm || "Packaging"}
          </p>
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-2 text-left">
          <span className="text-sm sm:text-base font-extrabold text-slate-900">
            ₹{product.sellingPrice}
          </span>
          {product.mrp > product.sellingPrice && (
            <span className="text-xs text-slate-400 line-through">
              ₹{product.mrp}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded hidden sm:inline">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Full-Width Blue Add to Cart Button */}
      <div className="mt-3.5 pt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-[0.98] ${
            justAdded
              ? "bg-emerald-600 text-white"
              : "bg-[#0052CC] hover:bg-[#0043A8] text-white"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
