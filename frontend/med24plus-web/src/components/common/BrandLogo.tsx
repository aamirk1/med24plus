import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  showTagline = true,
  theme = "light",
  size = "md",
}) => {
  const isDark = theme === "dark";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Emblem / App Icon */}
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src="/images/app_icon.png"
          alt="Med24Plus App Icon"
          width={size === "sm" ? 32 : size === "lg" ? 56 : 40}
          height={size === "sm" ? 32 : size === "lg" ? 56 : 40}
          className={`rounded-xl object-contain shadow-xs ${
            size === "sm"
              ? "w-8 h-8"
              : size === "lg"
              ? "w-14 h-14"
              : "w-10 h-10"
          }`}
          priority
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline font-extrabold tracking-tight text-xl md:text-2xl font-sans">
          <span className="text-[#0066CC]">Med</span>
          <span className="text-[#00B074]">24</span>
          <span className="text-[#0066CC]">Plus</span>
        </div>
        {showTagline && (
          <span
            className={`text-[9px] md:text-[10px] tracking-wide font-medium ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Health. Always Within Reach.
          </span>
        )}
      </div>
    </div>
  );
};

