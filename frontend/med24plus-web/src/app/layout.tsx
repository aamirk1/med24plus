import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RegulatoryNotice } from "@/components/common/RegulatoryNotice";
import { JsonLd } from "@/components/common/JsonLd";
import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://med24plus.in"),
  title: {
    default: "Med24Plus - India's 24x7 Online Pharmacy | Genuine Medicines & Fast Delivery",
    template: "%s | Med24Plus 24x7 Online Pharmacy",
  },
  description:
    "Order 100% genuine medicines online across India with 24x7 express delivery. Upload doctor prescriptions online with licensed pharmacist verification under Rule 65. Diabetes care, cardiac support, vitamins & baby care at statutory DPCO discount prices.",
  keywords: [
    "online pharmacy India",
    "buy medicines online",
    "genuine prescription medicines",
    "24x7 medicine delivery",
    "Med24Plus",
    "doctor prescription upload",
    "Schedule H medicines online",
    "discount pharmacy Bengaluru",
    "pharmacy near me",
    "home delivery medicine",
    "licensed medical store online",
    "diabetes medicine online",
    "blood pressure medicines",
    "ayurvedic wellness products",
  ],
  authors: [{ name: "Med24Plus Healthcare Private Limited", url: "https://med24plus.in" }],
  creator: "Med24Plus Healthcare Pvt. Ltd.",
  publisher: "Med24Plus Pharmacy",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "https://med24plus.in",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://med24plus.in",
    siteName: "Med24Plus",
    title: "Med24Plus - India's Trusted 24x7 Online Pharmacy | Genuine Medicines & Express Delivery",
    description:
      "Licensed single retail community pharmacy delivering 100% authentic pharmaceuticals, cold-chain insulins, and healthcare essentials verified by licensed pharmacists under Drugs and Cosmetics Act.",
    images: [
      {
        url: "https://med24plus.in/apple-icon.png",
        width: 512,
        height: 512,
        alt: "Med24Plus Online Pharmacy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Med24Plus - 24x7 Genuine Online Medicine Delivery in India",
    description: "Upload doctor prescription, get genuine medicines with batch traceability & fast courier dispatch.",
    site: "@med24plus",
    creator: "@med24plus",
    images: ["https://med24plus.in/apple-icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
      </head>
      <body className="min-h-screen flex flex-col justify-between">
        <AuthProvider>
          <CartProvider>
            <div>
              <RegulatoryNotice />
              <Navbar />
              <main>{children}</main>
            </div>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

