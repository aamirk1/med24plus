import React from "react";

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
  const iconSize = size === "sm" ? 32 : size === "lg" ? 48 : 38;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Med24Plus Cross Emblem Icon */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xs"
        >
          {/* Blue Vertical Stem & Left Arm */}
          <rect x="18" y="4" width="12" height="40" rx="4" fill="#0052CC" />
          <rect x="4" y="18" width="40" height="12" rx="4" fill="#0052CC" />
          {/* Green / Teal Dynamic Overlay curve */}
          <path
            d="M 24 18 H 38 C 41 18 43 20 43 23 V 25 C 43 28 41 30 38 30 H 30 V 38 C 30 41 28 43 25 43 H 23 C 20 43 18 41 18 38 V 24 C 18 20.7 20.7 18 24 18 Z"
            fill="#0D9488"
          />
          {/* White Accent Cross Core */}
          <circle cx="24" cy="24" r="3" fill="#FFFFFF" opacity="0.9" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight text-left">
        <div className="flex items-baseline font-extrabold tracking-tight text-xl sm:text-2xl font-sans">
          <span className={isDark ? "text-white" : "text-[#0052CC]"}>Med</span>
          <span className="text-[#0D9488]">24</span>
          <span className={isDark ? "text-white" : "text-[#0052CC]"}>Plus</span>
        </div>
        {showTagline && (
          <span
            className={`text-[9px] sm:text-[10px] tracking-wide font-medium ${
              isDark ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Health. Always Within Reach.
          </span>
        )}
      </div>
    </div>
  );
};
