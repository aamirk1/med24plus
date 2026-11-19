import React from "react";
import { formatPriceINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface PriceDisplayProps {
  mrp: number;
  sellingPrice: number;
  discountPercent?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  mrp,
  sellingPrice,
  discountPercent,
  size = "md",
  className,
}) => {
  const hasDiscount = mrp > sellingPrice;
  const calcDiscount = discountPercent ?? Math.round(((mrp - sellingPrice) / mrp) * 100);

  const priceSizes = {
    sm: "text-sm",
    md: "text-base font-bold",
    lg: "text-2xl font-extrabold",
  };

  const mrpSizes = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <div className={cn("flex items-baseline gap-2 flex-wrap", className)}>
      <span className={cn("text-[#172B24] font-bold tracking-tight", priceSizes[size])}>
        {formatPriceINR(sellingPrice)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn("text-slate-400 line-through", mrpSizes[size])}>
            {formatPriceINR(mrp)}
          </span>
          {calcDiscount > 0 && (
            <span className="text-[11px] font-bold text-[#0D9488] bg-[#F0FDFA] px-1.5 py-0.5 rounded">
              {calcDiscount}% OFF
            </span>
          )}
        </>
      )}
    </div>
  );
};

