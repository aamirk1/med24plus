import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = "primary",
  size = "md",
  ...props
}) => {
  const base = "inline-flex items-center font-medium rounded-full";

  const variants = {
    primary: "bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]",
    secondary: "bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]",
    success: "bg-teal-50 text-[#16A34A] border border-teal-200",
    warning: "bg-amber-50 text-[#D97706] border border-amber-200",
    danger: "bg-red-50 text-[#DC2626] border border-red-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    outline: "bg-transparent text-slate-700 border border-slate-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

