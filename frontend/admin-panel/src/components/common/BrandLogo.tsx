import React from "react";

interface BrandLogoProps {
  className?: string;
  badge?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", badge = "ADMIN" }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M24 8C24 6.89543 24.8954 6 26 6H38C39.1046 6 40 6.89543 40 8V24H56C57.1046 24 58 24.8954 58 26V38C58 39.1046 57.1046 40 56 40H40V56C40 57.1046 39.1046 58 38 58H26C24.8954 58 24 57.1046 24 56V40H8C6.89543 40 6 39.1046 6 38V26C6 24.8954 6.89543 24 8 24H24V8Z"
            fill="#0066CC"
          />
          <path
            d="M10 38C10 38 18 36 28 26C38 16 56 16 56 16C56 16 56 36 44 48C32 60 10 38 10 38Z"
            fill="#00B074"
          />
          <path
            d="M12 36C20 34 30 24 38 18C28 26 20 32 12 36Z"
            fill="#FFFFFF"
            fillOpacity="0.8"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className="flex items-baseline font-extrabold tracking-tight text-lg text-white">
            <span className="text-[#38BDF8]">Med</span>
            <span className="text-[#00B074]">24</span>
            <span className="text-[#38BDF8]">Plus</span>
          </div>
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400">Pharmacist Dispensing Console</span>
      </div>
    </div>
  );
};

