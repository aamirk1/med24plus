"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  className?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  max = 10,
  min = 1,
  size = "md",
  className,
}) => {
  const isSm = size === "sm";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-300 bg-white select-none",
        isSm ? "h-7" : "h-9",
        className
      )}
    >
      <button
        type="button"
        disabled={quantity <= min}
        onClick={onDecrement}
        className={cn(
          "flex items-center justify-center text-slate-500 hover:text-[#0D9488] hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none rounded-l-lg transition",
          isSm ? "w-6 h-7" : "w-8 h-9"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>

      <span
        className={cn(
          "font-bold text-[#172B24] text-center px-2",
          isSm ? "text-xs min-w-[24px]" : "text-sm min-w-[32px]"
        )}
      >
        {quantity}
      </span>

      <button
        type="button"
        disabled={quantity >= max}
        onClick={onIncrement}
        className={cn(
          "flex items-center justify-center text-slate-500 hover:text-[#0D9488] hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none rounded-r-lg transition",
          isSm ? "w-6 h-7" : "w-8 h-9"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
    </div>
  );
};

