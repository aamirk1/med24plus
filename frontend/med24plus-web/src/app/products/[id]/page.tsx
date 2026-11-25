"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { PrescriptionBadge } from "@/components/ui/PrescriptionBadge";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";
import { catalogService } from "@/services/catalog.service";
import { Product, ProductSubstitutesData, ProductSubstituteOption } from "@/types";
import { BrandSubstitutes } from "@/components/product/BrandSubstitutes";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.id as string;
  const { addToCart, isAdding } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [substitutesData, setSubstitutesData] = useState<ProductSubstitutesData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const item = await catalogService.getProductBySlug(slug);
        setProduct(item);
        if (item) {
          const [rel, subs] = await Promise.all([
            catalogService.getProducts({ page_size: 4 }),
            catalogService.getProductSubstitutes(slug),
          ]);
          setRelatedProducts(rel.items.filter((p) => p.id !== item.id).slice(0, 3));
          setSubstitutesData(subs);
        }
      } catch (e) {
        console.error("Failed to load product details:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    const ok = await addToCart(product, quantity);
    if (ok) {
      setToastMessage(`Added ${quantity} unit(s) of ${product.name} to cart.`);
      setShowToast(true);
    }
  };

  const handleSelectSubstitute = (option: ProductSubstituteOption) => {
    if (product && !option.isOriginal) {
      setProduct({
        ...product,
        name: option.name,
        brand: option.brand,
        sellingPrice: option.sellingPrice,
        mrp: option.mrp,
        discountPercent: option.savingsPercent || option.discountPercent,
      });
      setToastMessage(
        `Switched to substitute brand ${option.name}. You save ₹${Math.round(option.savingsAmount)}!`
      );
      setShowToast(true);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-sm font-medium">Loading statutory product information & live stock status...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500">The requested medication is not available in our catalog.</p>
        <Link href="/products">
          <Button variant="primary" size="md">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-left">
      {showToast && (
        <Toast
          type="success"
          message={toastMessage || `Added ${quantity} unit(s) of ${product.name} to cart.`}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Products", href: "/products" },
          { label: product.categoryName || "Medicines", href: `/categories/${product.categorySlug || "all"}` },
          { label: product.name },
        ]}
      />

      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-subtle">
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
            {(product.images && product.images[activeImageIdx]) || product.imageUrl ? (
              <img
                src={(product.images && product.images[activeImageIdx]) || product.imageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-white shadow-card border border-slate-100 flex items-center justify-center text-[#0D9488]">
                <ShoppingBag className="w-16 h-16" />
              </div>
            )}
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 text-xs font-bold text-[#0D9488] bg-[#F0FDFA] border border-[#CCFBF1] px-2.5 py-1 rounded-full">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail row */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-16 rounded-lg border-2 bg-slate-50 flex items-center justify-center transition overflow-hidden ${
                    activeImageIdx === idx ? "border-[#0D9488]" : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} thumbnail`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Genuine Medicine Assurance */}
          <div className="rounded-xl bg-[#F0FDFA]/60 border border-[#CCFBF1] p-3.5 flex items-center gap-3 text-xs text-[#0F766E]">
            <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0" />
            <div>
              <span className="font-bold">100% Genuine Medicine</span>
              <p className="text-[11px] text-[#0F766E]/80 mt-0.5">
                Sourced directly from licensed manufacturers. Subject to statutory Rule 65 pharmacist verification.
              </p>
            </div>
          </div>
        </div>

        {/* Right Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PrescriptionBadge
                required={product.requiresPrescription}
                scheduleType={product.scheduleType}
              />
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {product.dosageForm}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Brand */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172B24] tracking-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-500">
              Manufactured by <span className="font-semibold text-slate-700">{product.manufacturer}</span> • Brand:{" "}
              <span className="font-semibold text-[#0D9488]">{product.brand}</span>
            </p>
          </div>

          {/* Salt Composition */}
          <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Salt Composition
            </span>
            <span className="text-xs font-medium text-[#172B24] mt-0.5 block">
              {product.composition}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-xs font-bold text-teal-800">
              <Star className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
              <span>{product.rating}</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Based on {product.reviewCount} customer reviews
            </span>
          </div>

          {/* Pricing & Stock Status */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Inclusive of all taxes (GST 12%)</span>
                <PriceDisplay mrp={product.mrp} sellingPrice={product.sellingPrice} size="lg" />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 block">Pack Size</span>
                <span className="text-xs font-bold text-[#172B24]">{product.packSize}</span>
              </div>
            </div>

            {/* Statutory In Stock / Out of Stock Banner */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {product.inStock ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                    <span className="font-bold text-[#0D9488]">In Stock (Ready for Dispatch)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-700">Currently Out of Stock</span>
                  </>
                )}
              </div>
              <span className="text-slate-400 text-[11px]">FEFO Expiry Verified</span>
            </div>
          </div>

          {/* Rx Warning Notice */}
          {product.requiresPrescription && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Prescription Required (Schedule H/H1)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                As per the Drugs and Cosmetics Act, 1940, a valid prescription from a registered medical practitioner is mandatory. You will be prompted to upload your prescription before order fulfillment.
              </p>
            </div>
          )}

          {/* Quantity & CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Quantity:</span>
              <QuantitySelector
                quantity={quantity}
                onIncrement={() => setQuantity((q) => Math.min(10, q + 1))}
                onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                max={10}
                size="md"
              />
            </div>
            <div className="flex-1 flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdding}
                isLoading={isAdding}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>{product.inStock ? "Add to Cart" : "Out of Stock"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Brand Substitutes Section (Matches Screenshot 2) */}
      {substitutesData && (
        <BrandSubstitutes
          data={substitutesData}
          onSelectOption={handleSelectSubstitute}
        />
      )}

      {/* Description & Clinical Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-subtle">
        <h2 className="text-lg font-bold text-[#172B24] border-b border-slate-100 pb-3">
          Product Details & Clinical Information
        </h2>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Description</h3>
            <p>{product.description}</p>
          </div>

          {(product.keyBenefits?.length || 0) > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-2">Key Quality & Pharmacological Assurances</h3>
              <ul className="list-disc pl-5 space-y-1">
                {product.keyBenefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Directions for Use</h3>
            <p>{product.directionsForUse}</p>
          </div>

          {(product.safetyInformation?.length || 0) > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-2">Safety & Storage Instructions</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                {product.safetyInformation.map((info, i) => (
                  <li key={i}>{info}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#172B24]">You May Also Need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
