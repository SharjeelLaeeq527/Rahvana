import type { Metadata } from "next";
import { JsonLd } from "@/app/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

export const metadata: Metadata = {
  title: "Immigration Services & Expert Assistance",
  description:
    "Explore Rahvana's immigration services: certified document translation, police character certificates (PCC), mock visa interviews, and professional case reviews.",
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
  keywords: [
    "certified document translation",
    "police character certificate Pakistan",
    "visa mock interview prep",
    "immigration form assistance",
    "IR-1 case review",
    "US visa services",
  ],
  openGraph: {
    title: "Rahvana Services — Expert Support for U.S. Visa Applicants",
    description:
      "Certified translation, police certificate filing, mock interviews, and case reviews for U.S. visa petitioners.",
    url: `${SITE_URL}/services`,
  },
};

const SERVICES_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Immigration Document and Petition Services",
  provider: {
    "@type": "Organization",
    name: "Rahvana",
    url: SITE_URL,
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Immigration Support Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Certified Document Translation",
          description:
            "Accurate, certified English translations for Nikah Nama, birth certificates, and official documents accepted by USCIS and NVC.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Police Character Certificate (PCC) Assistance",
          description:
            "Assistance with obtaining and verifying police clearance certificates required for consular interview stages.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Visa Mock Interview Preparation",
          description:
            "Practice simulated consular interview questions with expert feedback tailored to IR-1 and IR-5 categories.",
        },
      },
    ],
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd schema={SERVICES_SCHEMA} />
      {children}
    </>
  );
}
