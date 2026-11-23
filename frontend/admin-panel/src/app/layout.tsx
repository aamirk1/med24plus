import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/layout/Header";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminCountsProvider } from "@/context/AdminCountsContext";
import { AdminAuthGuard } from "@/components/layout/AdminAuthGuard";

export const metadata: Metadata = {
  title: "Med24Plus - Pharmacist & Pharmacy Admin Portal",
  description: "Operations console for single pharmacy inventory, prescription verification and Schedule H drug dispensing management.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
          <AdminCountsProvider>
            <AdminAuthGuard>
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
              </div>
            </AdminAuthGuard>
          </AdminCountsProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
