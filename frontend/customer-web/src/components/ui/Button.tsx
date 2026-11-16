import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "light";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg select-none";

    const variants = {
      primary:
        "bg-[#087F5B] text-white hover:bg-[#066649] focus-visible:ring-[#087F5B] active:bg-[#05533b]",
      secondary:
        "bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB] active:bg-[#1e40af]",
      outline:
        "border border-slate-300 bg-white text-[#172B24] hover:bg-slate-50 focus-visible:ring-[#087F5B]",
      ghost:
        "text-[#172B24] hover:bg-slate-100 focus-visible:ring-slate-400",
      danger:
        "bg-[#DC2626] text-white hover:bg-[#b91c1c] focus-visible:ring-[#DC2626]",
      light:
        "bg-[#E6F4EF] text-[#087F5B] hover:bg-[#d0ece1] focus-visible:ring-[#087F5B]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

