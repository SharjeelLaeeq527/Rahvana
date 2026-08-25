import type { Metadata } from "next";
import { JsonLd } from "@/app/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

export const metadata: Metadata = {
  title: "Pricing Plans — IR-1, IR-5 & Family Visa Assistance",
  description:
    "Transparent pricing for U.S. visa assistance. Compare Free, Basic, Premium, and Executive plans for IR-1/CR-1 spouse and IR-5 parent visas with automated forms and expert reviews.",
  alternates: {
    canonical: `${SITE_URL}/pricing`,
  },
  keywords: [
    "IR-1 visa pricing",
    "IR-5 visa cost",
    "US immigration service price",
    "spouse visa petition cost",
    "Rahvana pricing plans",
    "USCIS form filler service",
  ],
  openGraph: {
    title: "Rahvana Pricing — Simple, Transparent Plans for Your U.S. Visa",
    description:
      "Choose the right plan for your IR-1, IR-5, or family visa journey. Step-by-step roadmaps, automated USCIS forms, and expert guidance.",
    url: `${SITE_URL}/pricing`,
  },
};

const PRICING_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Rahvana U.S. Immigration Roadmap & Tools",
    description:
      "Comprehensive digital platform for managing U.S. family immigration petitions including IR-1, CR-1, and IR-5 visas.",
    brand: {
      "@type": "Brand",
      name: "Rahvana",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Basic Plan",
        price: "19",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
      {
        "@type": "Offer",
        name: "Premium Plan",
        price: "49",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
      {
        "@type": "Offer",
        name: "Executive Plan",
        price: "99",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pricing`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I upgrade or downgrade my Rahvana plan later?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can upgrade or adjust your plan tier anytime directly from your dashboard billing settings.",
        },
      },
      {
        "@type": "Question",
        name: "Does Rahvana support both IR-1 (spouse) and IR-5 (parent) visas?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Rahvana provides dedicated, step-by-step journey roadmaps and document assistance for both IR-1/CR-1 spouse visas and IR-5 parent petitions.",
        },
      },
      {
        "@type": "Question",
        name: "Are government filing fees included in the subscription price?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, government fees (such as USCIS Form I-130 filing fees and NVC processing fees) are paid directly to U.S. government agencies.",
        },
      },
    ],
  },
];

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd schema={PRICING_SCHEMA} />
      {children}
    </>
  );
}
