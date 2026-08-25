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
  return <div className="min-h-screen bg-linear-to-b from-primary/10 to-white">{children}</div>;
}
