import React from "react";

export const JsonLd: React.FC = () => {
  const pharmacySchema = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "@id": "https://med24plus.in/#pharmacy",
    name: "Med24Plus Online Pharmacy",
    legalName: "Med24Plus Healthcare Private Limited",
    alternateName: "Med24Plus",
    url: "https://med24plus.in",
    logo: "https://med24plus.in/apple-icon.png",
    image: "https://med24plus.in/apple-icon.png",
    description:
      "Licensed Indian 24x7 online pharmacy delivering 100% genuine prescription medicines, healthcare devices, and wellness essentials with licensed pharmacist verification under Rule 65.",
    telephone: "+91-22-8069-0161",
    email: "care@med24plus.in",
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI, NetBanking, Razorpay",
    hasMap: "https://maps.google.com/?q=Bandra+Kurla+Complex+Mumbai",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Plot 15, Bandra Kurla Complex (BKC), Bandra East",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      postalCode: "400051",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "19.0657",
      longitude: "72.8687",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    sameAs: [
      "https://play.google.com/store/apps/details?id=com.technosolz.med24plus",
      "https://www.facebook.com/med24plus",
      "https://twitter.com/med24plus",
      "https://www.instagram.com/med24plus",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://med24plus.in/#website",
    url: "https://med24plus.in",
    name: "Med24Plus - Online Pharmacy & Medicine Delivery",
    description:
      "Order genuine medicines online across India with 24x7 express delivery and pharmacist consultation.",
    publisher: {
      "@id": "https://med24plus.in/#pharmacy",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://med24plus.in/products?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-IN",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pharmacySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
};
