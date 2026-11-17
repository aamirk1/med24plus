import React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "light";
  size?: "sm" | "md" | "lg";
  ariaLabel: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, variant = "ghost", size = "md", ariaLabel, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary: "bg-[#087F5B] text-white hover:bg-[#066649]",
      secondary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
      outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      danger: "text-red-600 hover:bg-red-50",
      light: "bg-[#E6F4EF] text-[#087F5B] hover:bg-[#d0ece1]",
    };

    const sizes = {
      sm: "w-8 h-8 p-1 text-xs",
      md: "w-10 h-10 p-2 text-sm",
      lg: "w-12 h-12 p-2.5 text-base",
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

