import type { Metadata } from "next";
import { JsonLd } from "@/app/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

export const metadata: Metadata = {
  title: "Immigration Resources, Tool Guides & Articles",
  description:
    "Free guides, document checklists, and immigration toolkits for IR-1, IR-5, CR-1, and U.S. visa petitioners. Learn requirements, processing timelines, and best practices.",
  alternates: {
    canonical: `${SITE_URL}/resources`,
  },
  keywords: [
    "US immigration guides",
    "IR-1 document checklist",
    "IR-5 visa requirements",
    "Nikah Nama translation guide",
    "USCIS I-130 guide",
    "NVC civil documents checklist",
  ],
  openGraph: {
    title: "Rahvana Immigration Resources & Tool Library",
    description:
      "Expert immigration guides, checklists, and calculators for U.S. visa applicants and sponsors.",
    url: `${SITE_URL}/resources`,
  },
};

const RESOURCES_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Rahvana Immigration Resources & Tool Guides",
  description:
    "Comprehensive directory of guides, document preparation checklists, and immigration tools for U.S. visa applicants.",
  url: `${SITE_URL}/resources`,
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd schema={RESOURCES_SCHEMA} />
      {children}
    </>
  );
}
