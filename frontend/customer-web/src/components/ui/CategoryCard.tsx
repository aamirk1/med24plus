import React from "react";
import Link from "next/link";
import {
  Activity,
  HeartPulse,
  Sparkles,
  Cross,
  Wind,
  Leaf,
  Zap,
  Smile,
  ChevronRight,
} from "lucide-react";
import { MedicineCategory } from "@/types";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ReactNode> = {
  Activity: <Activity className="w-6 h-6 text-[#087F5B]" />,
  HeartPulse: <HeartPulse className="w-6 h-6 text-rose-500" />,
  Sparkles: <Sparkles className="w-6 h-6 text-amber-500" />,
  Cross: <Cross className="w-6 h-6 text-emerald-600" />,
  Wind: <Wind className="w-6 h-6 text-sky-500" />,
  Leaf: <Leaf className="w-6 h-6 text-green-600" />,
  Zap: <Zap className="w-6 h-6 text-orange-500" />,
  Smile: <Smile className="w-6 h-6 text-pink-500" />,
};

export interface CategoryCardProps {
  category: MedicineCategory;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, className }) => {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-card",
        className
      )}
    >
      <div>
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:bg-[#E6F4EF]/60 transition-colors">
          {categoryIcons[category.iconName] || <Activity className="w-6 h-6 text-[#087F5B]" />}
        </div>
        <h3 className="text-xs font-bold text-[#172B24] group-hover:text-[#087F5B] transition-colors leading-snug">
          {category.name}
        </h3>
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span>{category.itemCount} items</span>
        <span className="text-[#087F5B] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
          Shop <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
};

