import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

// Free, public tool: indexable (unlike the paid tools in middleware PRIVATE_PREFIXES).
export const metadata: Metadata = {
  title: "CSPA Age-Out Checker for IR-2 and CR-2 Children",
  description:
    "For children of U.S. citizens: check if your child's age is protected under the Child Status Protection Act, or find the last day to file the I-130.",
  alternates: {
    canonical: `${SITE_URL}/cspa-age-checker`,
  },
  openGraph: {
    title: "CSPA Age-Out Checker · Rahvana",
    description: "Check whether a child of a U.S. citizen is protected from aging out.",
    url: `${SITE_URL}/cspa-age-checker`,
  },
};

export default function CspaAgeCheckerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
