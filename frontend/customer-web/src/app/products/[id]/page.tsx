"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Star,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Globe,
  Share2,
  Heart,
  ShoppingBag,
  UploadCloud,
  ChevronRight,
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/mock/data";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { PrescriptionBadge } from "@/components/ui/PrescriptionBadge";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.id as string;

  // Find product by slug or id
  const product =
    MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug) || MOCK_PRODUCTS[0];

  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const relatedProducts = MOCK_PRODUCTS.filter(
    (p) => p.id !== product.id && p.categorySlug === product.categorySlug
  ).slice(0, 3);

  const handleAddToCart = () => {
    setShowToast(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-left">
      {showToast && (
        <Toast
          type="success"
          message={`Added ${quantity} unit(s) of ${product.name} to cart (Demo Mode).`}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Products", href: "/products" },
          { label: product.categoryName, href: `/categories/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-subtle">
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="w-32 h-32 rounded-2xl bg-white shadow-card border border-slate-100 flex items-center justify-center text-[#087F5B]">
              <ShoppingBag className="w-16 h-16" />
            </div>
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 text-xs font-bold text-[#087F5B] bg-[#E6F4EF] border border-[#C3E7DB] px-2.5 py-1 rounded-full">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail row */}
          <div className="flex items-center gap-3">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`w-16 h-16 rounded-lg border-2 bg-slate-50 flex items-center justify-center transition ${
                  activeImageIdx === idx ? "border-[#087F5B]" : "border-slate-200 opacity-60 hover:opacity-100"
                }`}
              >
                <ShoppingBag className="w-6 h-6 text-slate-400" />
              </button>
            ))}
          </div>

          {/* Genuine Medicine Assurance */}
          <div className="rounded-xl bg-[#E6F4EF]/60 border border-[#C3E7DB] p-3.5 flex items-center gap-3 text-xs text-[#066649]">
            <ShieldCheck className="w-5 h-5 text-[#087F5B] shrink-0" />
            <div>
              <p className="font-bold">100% Genuine Pharmacy Stock</p>
              <p className="text-[11px] text-[#066649]/80">
                Directly from {product.manufacturer}. Min 6-month shelf life.
              </p>
            </div>
          </div>
        </div>

        {/* Right Info (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#087F5B]">
                {product.brand}
              </span>
              <PrescriptionBadge
                required={product.requiresPrescription}
                scheduleType={product.scheduleType}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] leading-snug">
              {product.name}
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Active Salt / Composition: <span className="font-semibold text-slate-700">{product.composition}</span>
            </p>

            {/* Ratings & Pack Size */}
            <div className="flex items-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 font-bold">
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>{product.rating}</span>
              </div>
              <span className="text-slate-400">({product.reviewCount} customer reviews)</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Pack: {product.packSize}
              </span>
            </div>
          </div>

          {/* Price & Delivery Information */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <PriceDisplay mrp={product.mrp} sellingPrice={product.sellingPrice} size="lg" />
            <p className="text-[11px] text-slate-500">
              Inclusive of all Indian taxes (GST) • Retail invoice provided upon dispatch
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-700 pt-2 border-t border-slate-200">
              <Truck className="w-4 h-4 text-[#087F5B]" />
              <span>
                Standard Delivery: <strong className="text-[#172B24]">Today within 4 Hours</strong> to Bengaluru 560103
              </span>
            </div>
          </div>

          {/* Prescription Alert if Required */}
          {product.requiresPrescription && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Prescription Required for this Medicine:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  As per Drugs & Cosmetics Act 1940, valid prescription from a Registered Medical Practitioner must be uploaded during checkout.
                </p>
              </div>
            </div>
          )}

          {/* Action Row: Quantity & Add to Cart */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Quantity:</span>
              <QuantitySelector
                quantity={quantity}
                onIncrement={() => setQuantity((q) => Math.min(q + 1, 10))}
                onDecrement={() => setQuantity((q) => Math.max(q - 1, 1))}
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleAddToCart}
              className="flex-1 shadow-sm h-10"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              <span>Add to Cart ({quantity} item{quantity > 1 ? "s" : ""})</span>
            </Button>
          </div>

          {/* Key Product Information Blocks */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-[#172B24]">Product Description</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{product.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#172B24]">Key Benefits & Uses</h3>
              <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                {product.keyBenefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#172B24]">Directions for Use</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{product.directionsForUse}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#172B24]">Safety Precautions</h3>
              <ul className="mt-1 space-y-1 text-xs text-slate-600 list-disc list-inside">
                {product.safetyInformation.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Manufacturer Details */}
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1 border border-slate-100">
              <p><strong className="text-slate-700">Manufacturer:</strong> {product.manufacturer}</p>
              <p><strong className="text-slate-700">Country of Origin:</strong> {product.countryOfOrigin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#172B24]">Similar Products in this Category</h3>
            <Link href={`/categories/${product.categorySlug}`} className="text-xs font-semibold text-[#087F5B] hover:underline">
              View Category
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

