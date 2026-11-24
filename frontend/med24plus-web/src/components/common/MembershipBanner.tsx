"use client";

import React from "react";
import Link from "next/link";
import { Crown, CheckCircle2, HeartPulse, Gift, ArrowRight } from "lucide-react";

interface MembershipBannerProps {
  variant?: "heart" | "gift";
}

export const MembershipBanner: React.FC<MembershipBannerProps> = ({ variant = "heart" }) => {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#035064] via-[#056980] to-[#0E9488] text-white p-6 md:p-8 shadow-md">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left: Crown & Heading */}
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
              <Crown className="w-8 h-8 text-amber-300 fill-amber-300/40" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
                Med24Plus Membership
              </h3>
              <p className="text-xs md:text-sm text-teal-100/90 font-medium mt-0.5">
                More Savings. More Care.
              </p>
            </div>
          </div>

          {/* Center: Benefits Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-left">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="text-xs font-medium text-white/95">Free Basic Blood Glucose Test</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="text-xs font-medium text-white/95">Up to 60% Discount on Diagnostics</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="text-xs font-medium text-white/95">Exclusive Offers on Medicines</span>
            </div>
          </div>

          {/* Right: CTA & Emblem */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-white hover:bg-slate-50 text-[#035064] hover:text-[#023B4A] rounded-full text-xs font-bold shadow-sm transition transform hover:scale-[1.02]"
            >
              <span>Know More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/10 border border-white/20 items-center justify-center shrink-0">
              {variant === "gift" ? (
                <Gift className="w-6 h-6 text-amber-300" />
              ) : (
                <HeartPulse className="w-6 h-6 text-emerald-300" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
