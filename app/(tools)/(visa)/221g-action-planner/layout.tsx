import { Metadata } from "next";

export const metadata: Metadata = {
  title: "221(g) Action Planner | Rahvana",
  description: "Get your personalized action plan after your visa interview",
  // Paid (Executive-only) — do not index
  robots: { index: false, follow: false },
};

export default function TwentyTwoOneGActionPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ToolLayout (in page.tsx) draws the background; this only clears the fixed site header.
  return <div className="mt-[55px]">{children}</div>;
}
