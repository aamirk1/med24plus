import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    let sizeStyles = "px-4 py-2 text-sm";
    if (size === "sm") {
      sizeStyles = "px-3 py-1.5 text-xs";
    } else if (size === "lg") {
      sizeStyles = "px-5 py-2.5 text-base";
    }

    let variantStyles = "bg-[#0052CC] text-white hover:bg-[#0043A8] focus:ring-[#0052CC] shadow-xs";
    if (variant === "secondary") {
      variantStyles = "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400";
    } else if (variant === "outline") {
      variantStyles = "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300";
    } else if (variant === "danger") {
      variantStyles = "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";
    } else if (variant === "ghost") {
      variantStyles = "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300";
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

