import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

export const metadata: Metadata = {
  title: "Explore U.S. Visa Pathways & Journeys",
  description:
    "Explore and compare different U.S. immigration categories including IR-1 spouse, IR-5 parent, IR-2 child, and F-1 student visas. Understand requirements and roadmap milestones.",
  alternates: {
    canonical: `${SITE_URL}/visa-exploration`,
  },
  openGraph: {
    title: "Explore Visa Journeys · Rahvana",
    description:
      "Interactive explorer for family and student visa pathways to the United States.",
    url: `${SITE_URL}/visa-exploration`,
  },
};

export default function VisaExplorationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
