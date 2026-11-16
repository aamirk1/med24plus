import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  ShieldCheck,
  Clock,
  Award,
  ChevronRight,
  ArrowRight,
  Activity,
  HeartPulse,
  ShieldAlert,
  Wind,
  Sparkles,
  Cross,
  Zap,
  Leaf,
  FileCheck,
  UserCheck,
  ThermometerSnowflake,
  Search,
} from "lucide-react";
import { MEDICINE_CATEGORIES, PHARMACY_SERVICES } from "@/constants/categories";

const iconMap: Record<string, React.ReactNode> = {
  Activity: <Activity className="w-6 h-6 text-[#0066CC]" />,
  HeartPulse: <HeartPulse className="w-6 h-6 text-rose-500" />,
  ShieldAlert: <ShieldAlert className="w-6 h-6 text-amber-500" />,
  Wind: <Wind className="w-6 h-6 text-cyan-500" />,
  Sparkles: <Sparkles className="w-6 h-6 text-yellow-500" />,
  Cross: <Cross className="w-6 h-6 text-emerald-500" />,
  Zap: <Zap className="w-6 h-6 text-orange-500" />,
  Leaf: <Leaf className="w-6 h-6 text-green-600" />,
  FileCheck: <FileCheck className="w-7 h-7 text-[#00B074]" />,
  UserCheck: <UserCheck className="w-7 h-7 text-[#0066CC]" />,
  ThermometerSnowflake: <ThermometerSnowflake className="w-7 h-7 text-sky-500" />,
  ShieldCheck: <ShieldCheck className="w-7 h-7 text-indigo-500" />,
};

export default function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-8 pb-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Licensed Indian Pharmacy • Express Doorstep Delivery
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Authentic Medicines, <br />
                <span className="text-[#0066CC]">Verified by Pharmacists</span>, <br />
                Delivered With Care.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Order genuine prescription and wellness medications from Med24Plus. Compliant with Indian Pharmacy Regulations, featuring cold-chain biological transport and registered pharmacist consultation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/prescription/upload"
                  className="inline-flex items-center justify-center gap-2 bg-[#00B074] hover:bg-[#009663] text-white px-6 py-3.5 rounded-xl font-semibold text-sm shadow-md transition"
                >
                  <UploadCloud className="w-5 h-5" />
                  <span>Upload Doctor&apos;s Prescription</span>
                </Link>

                <Link
                  href="/categories"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-semibold text-sm shadow-sm transition"
                >
                  <span>Browse All Categories</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">100% Genuine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#0066CC] shrink-0" />
                  <span className="text-xs font-medium text-slate-700">PCI Registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">24/7 Available</span>
                </div>
              </div>
            </div>

            {/* Right Card: Prescription Quick Action */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      Rx
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Quick Prescription Upload</h3>
                      <p className="text-xs text-slate-500">We verify dosage & interactions</p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-blue-50 text-[#0066CC] font-semibold px-2.5 py-1 rounded-full">
                    Free Consultation
                  </span>
                </div>

                <div className="border-2 border-dashed border-slate-200 hover:border-[#0066CC] rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">
                    Drag & drop prescription image or PDF
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, PDF up to 10MB</p>
                  <button className="mt-3 inline-block text-xs font-semibold text-[#0066CC] hover:underline">
                    Browse from Device
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    How Rx Processing Works:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500 text-[11px]">
                    <li>Upload valid prescription with Doctor details & date</li>
                    <li>Licensed Pharmacist verifies Schedule & dosages</li>
                    <li>Receive confirmed order call & medicine invoice</li>
                  </ol>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full bg-slate-300 text-slate-500 font-semibold py-3 rounded-xl text-sm cursor-not-allowed text-center"
                >
                  Phase 1 Demo (Order Processing Disabled)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Explore Medicine Categories</h2>
            <p className="text-slate-500 text-sm mt-1">
              Curated medications categorized by clinical therapeutic class and daily wellness
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#0066CC] hover:text-[#0052A3]"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MEDICINE_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-5 border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition">
                  {iconMap[category.iconName]}
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-[#0066CC] transition text-base">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{category.itemCount}+ Formulations</span>
                <span className="text-[#0066CC] font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services & Compliance Assurance */}
      <section className="bg-slate-100/70 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0066CC]">
              Pharmacy Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Why Patients Trust Med24Plus
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Combining registered retail pharmacist expertise with modern healthcare delivery standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PHARMACY_SERVICES.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                      {iconMap[service.iconName]}
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{service.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

