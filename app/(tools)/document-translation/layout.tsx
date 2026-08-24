import { ReactNode } from "react";
import type { Metadata } from "next";

// Paid (Executive-only) — do not index
export const metadata: Metadata = {
  title: "Document Translation | Rahvana",
  robots: { index: false, follow: false },
};

export default function DocumentTranslationLayout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
