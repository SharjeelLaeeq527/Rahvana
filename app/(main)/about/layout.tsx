import type { Metadata } from "next";
import { JsonLd } from "@/app/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

export const metadata: Metadata = {
  title: "About Us — Our Mission & Story",
  description:
    "Learn about Rahvana's mission to simplify U.S. immigration for families. Discover how our smart roadmaps, automated form tools, and expert guidance reunite loved ones.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About Rahvana — Simplifying U.S. Immigration Journeys",
    description:
      "Learn about Rahvana's mission to simplify U.S. immigration for families with intelligent guidance and modern tools.",
    url: `${SITE_URL}/about`,
  },
};

const ABOUT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  mainEntity: {
    "@type": "Organization",
    name: "Rahvana",
    url: SITE_URL,
    description:
      "A modern U.S. immigration journey platform helping couples and families navigate IR-1, IR-5, CR-1, and student visas with clarity and confidence.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd schema={ABOUT_SCHEMA} />
      {children}
    </>
  );
}
