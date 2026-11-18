import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  badge?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", badge = "ADMIN" }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src="/images/app_icon.png"
          alt="Med24Plus App Icon"
          width={36}
          height={36}
          className="w-9 h-9 rounded-lg object-contain"
          priority
        />
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

