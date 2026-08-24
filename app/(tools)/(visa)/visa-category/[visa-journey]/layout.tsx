import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

/**
 * Per-journey metadata for /visa-category/[visa-journey].
 *
 * The page.tsx is "use client" so it can't export metadata directly.
 * This layout.tsx sits above it and generates the correct title,
 * description, keywords, and structured data for each journey type.
 */

interface VisaJourneyMeta {
  title: string;
  description: string;
  keywords: string[];
}

const JOURNEY_META: Record<string, VisaJourneyMeta> = {
  "ir-1": {
    title: "IR-1 Spouse Visa Journey",
    description:
      "Complete step-by-step guide to the IR-1 / CR-1 immediate relative spouse visa process — from filing I-130 with USCIS to the consular interview in Pakistan. Guided by Rahvana.",
    keywords: [
      "IR-1 visa",
      "CR-1 visa",
      "spouse visa USA",
      "IR-1 roadmap",
      "IR-1 steps",
      "I-130 petition",
      "NVC processing",
      "consular interview Pakistan",
      "spouse visa Pakistan to USA",
    ],
  },
  "ir-5": {
    title: "IR-5 Parent Visa Journey",
    description:
      "Complete step-by-step guide to the IR-5 immediate relative parent visa — sponsoring a parent for a U.S. green card. Walk through I-130, NVC, and consulate steps with Rahvana.",
    keywords: [
      "IR-5 visa",
      "parent visa USA",
      "IR-5 roadmap",
      "sponsor parent green card",
      "IR-5 steps",
      "I-130 for parents",
      "parent immigrant visa",
      "immediate relative visa",
      "parent visa Pakistan to USA",
    ],
  },
  "ir-2": {
    title: "IR-2 Child Visa Journey",
    description:
      "Step-by-step guide to the IR-2 immediate relative child visa — petitioning for an unmarried child under 21 to immigrate to the United States.",
    keywords: [
      "IR-2 visa",
      "child visa USA",
      "IR-2 roadmap",
      "child immigrant visa",
      "immediate relative child",
      "I-130 for child",
    ],
  },
  "f-1": {
    title: "F-1 Student Visa Journey",
    description:
      "Complete guide to the F-1 U.S. student visa — from university acceptance to SEVIS, DS-160, visa interview, and arrival. Guided by Rahvana.",
    keywords: [
      "F-1 student visa",
      "F-1 visa guide",
      "US student visa Pakistan",
      "SEVIS",
      "DS-160",
      "F-1 visa steps",
      "student visa roadmap",
    ],
  },
};

const DEFAULT_META: VisaJourneyMeta = {
  title: "Visa Journey",
  description:
    "Step-by-step visa journey guide — Rahvana guides you through every stage of the U.S. immigration process.",
  keywords: ["U.S. visa", "immigration guide", "visa roadmap"],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "visa-journey": string }>;
}): Promise<Metadata> {
  const { "visa-journey": slug } = await params;
  const meta = JOURNEY_META[slug] ?? DEFAULT_META;
  const canonicalUrl = `${SITE_URL}/visa-category/${slug}`;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${meta.title} · Rahvana`,
      description: meta.description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} · Rahvana`,
      description: meta.description,
    },
  };
}

import { JsonLd } from "@/app/components/seo/JsonLd";

const JOURNEY_HOWTO_SCHEMAS: Record<string, Record<string, unknown>> = {
  "ir-1": {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Apply for an IR-1 / CR-1 U.S. Spouse Visa",
    description:
      "Step-by-step roadmap for U.S. citizens sponsoring a foreign spouse for permanent residence (Green Card) through the IR-1/CR-1 visa process.",
    totalTime: "P14M",
    step: [
      {
        "@type": "HowToStep",
        name: "Stage 1: Petition Filing with USCIS (Form I-130)",
        text: "Gather relationship proofs, marriage certificates, and submit Form I-130 and Form I-130A to USCIS.",
        url: `${SITE_URL}/visa-category/ir-1#stage-1`,
      },
      {
        "@type": "HowToStep",
        name: "Stage 2: National Visa Center (NVC) Processing",
        text: "Pay NVC fees, complete Form DS-260, and submit Form I-864 Affidavit of Support with civil documents.",
        url: `${SITE_URL}/visa-category/ir-1#stage-2`,
      },
      {
        "@type": "HowToStep",
        name: "Stage 3: Medical Examination & Biometrics",
        text: "Attend the authorized medical exam clinic and submit biometrics before the embassy interview.",
        url: `${SITE_URL}/visa-category/ir-1#stage-3`,
      },
      {
        "@type": "HowToStep",
        name: "Stage 4: Consular Interview & Visa Issuance",
        text: "Attend the U.S. Embassy/Consulate interview, present original civil documents, and receive the immigrant visa stamp.",
        url: `${SITE_URL}/visa-category/ir-1#stage-4`,
      },
    ],
  },
  "ir-5": {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Sponsor a Parent for an IR-5 U.S. Immigrant Visa",
    description:
      "Step-by-step roadmap for U.S. citizens (age 21+) sponsoring parents for permanent residency in the United States.",
    totalTime: "P12M",
    step: [
      {
        "@type": "HowToStep",
        name: "Stage 1: USCIS Petition (Form I-130)",
        text: "File separate Form I-130 petitions for each parent with proof of U.S. citizenship and birth certificates.",
        url: `${SITE_URL}/visa-category/ir-5#stage-1`,
      },
      {
        "@type": "HowToStep",
        name: "Stage 2: NVC Civil Documents & Financial Sponsorship",
        text: "Submit Form DS-260, police character certificates, and Form I-864 showing sufficient income to support parent(s).",
        url: `${SITE_URL}/visa-category/ir-5#stage-2`,
      },
      {
        "@type": "HowToStep",
        name: "Stage 3: Medical Exam & Consular Interview",
        text: "Complete panel physician medical examination and attend the immigrant visa interview at the U.S. Embassy.",
        url: `${SITE_URL}/visa-category/ir-5#stage-3`,
      },
    ],
  },
};

export default async function VisaJourneyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ "visa-journey": string }>;
}) {
  const { "visa-journey": slug } = await params;
  const howToSchema = JOURNEY_HOWTO_SCHEMAS[slug];

  return (
    <>
      {howToSchema && <JsonLd schema={howToSchema} />}
      {children}
    </>
  );
}

