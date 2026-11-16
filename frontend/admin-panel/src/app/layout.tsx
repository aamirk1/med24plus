import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/layout/Header";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminAuthGuard } from "@/components/layout/AdminAuthGuard";

export const metadata: Metadata = {
  title: "Med24Plus - Pharmacist & Pharmacy Admin Portal",
  description: "Operations console for single pharmacy inventory, prescription verification and Schedule H drug dispensing management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 min-h-screen flex antialiased">
        <AdminAuthProvider>
          <AdminAuthGuard>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
            </div>
          </AdminAuthGuard>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
