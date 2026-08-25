import type { Metadata } from "next";

// Paid / auth-required — do not index (Layer 2 of 3-layer crawler guard)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
