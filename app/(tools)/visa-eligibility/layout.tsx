import type { Metadata } from "next";
import { JsonLd } from "@/app/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

export const metadata: Metadata = {
  title: "Visa Eligibility Checker — IR-1, IR-5, & Family Visas",
  description:
    "Check your eligibility for U.S. immigrant visas. Find out if you qualify to petition for a spouse (IR-1/CR-1), parent (IR-5), or child (IR-2) based on your citizenship and profile.",
  alternates: {
    canonical: `${SITE_URL}/visa-eligibility`,
  },
  keywords: [
    "US visa eligibility checker",
    "IR-1 visa eligibility",
    "IR-5 parent visa requirements",
    "who qualifies for spouse visa",
    "sponsor parent green card eligibility",
    "I-130 petition requirements",
  ],
  openGraph: {
    title: "U.S. Visa Eligibility Checker · Rahvana",
    description:
      "Find out which U.S. visa pathway matches your situation in under 2 minutes.",
    url: `${SITE_URL}/visa-eligibility`,
  },
};

const ELIGIBILITY_FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is eligible for an IR-1 / CR-1 spouse visa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A legally married spouse of a U.S. citizen is eligible for an IR-1 (if married 2+ years) or CR-1 (conditional, if married under 2 years) immigrant visa, provided the marriage is bona fide and the petitioner meets financial sponsorship requirements.",
      },
    },
    {
      "@type": "Question",
      name: "Who is eligible to sponsor parents on an IR-5 visa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "To petition for a parent under the IR-5 category, the sponsor must be a U.S. citizen who is at least 21 years of age and able to satisfy the Form I-864 Affidavit of Support income threshold.",
      },
    },
    {
      "@type": "Question",
      name: "Can U.S. permanent residents (Green Card holders) sponsor parents on IR-5?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No, only U.S. citizens can sponsor parents for an IR-5 immigrant visa. Lawful Permanent Residents cannot petition for parents until they naturalize as U.S. citizens.",
      },
    },
    {
      "@type": "Question",
      name: "What is the income requirement for sponsoring an immigrant relative?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The petitioner's household income must generally be at least 125% of the U.S. Federal Poverty Guidelines for their household size. If the petitioner does not meet this alone, a qualified joint sponsor or asset calculation can be used.",
      },
    },
  ],
};

export default function VisaEligibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd schema={ELIGIBILITY_FAQ_SCHEMA} />
      {children}
    </>
  );
}
