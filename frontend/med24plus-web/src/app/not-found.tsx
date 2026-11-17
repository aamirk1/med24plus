import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0066CC] flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
      <p className="text-slate-500 max-w-md mt-2 text-sm">
        The medication, category, or page you were searching for could not be found or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 bg-[#0066CC] hover:bg-[#0052A3] text-white px-5 py-2.5 rounded-full font-medium text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </Link>
    </div>
  );
}

