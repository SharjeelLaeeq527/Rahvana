"use client";

import Link from "next/link";
import { ADDONS } from "@/app/(main)/pricing/data/pricing";

/**
 * Detail-page CTA. Deep-links back to the pricing page on the add-on's tab
 * (Tools / Services / Guides) with this add-on pre-selected, so it lands
 * straight in the order summary.
 */
export default function AddToOrderButton({
  slug,
  price,
  unit,
  accent = "#0d7a5c",
  variant = "solid",
  className = "",
}: {
  slug: string;
  price: number;
  unit: string;
  accent?: string;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const kind =
    (ADDONS.find((a) => a.id === slug) as { kind?: string } | undefined)?.kind ?? "tools";
  const href = `/pricing?mode=${kind}&addons=${encodeURIComponent(slug)}`;

  if (variant === "outline") {
    return (
      <Link
        href={href}
        className={`inline-flex items-center justify-center rounded-full border px-6 py-3 text-[14px] font-semibold transition-all duration-200 hover:-translate-y-0.5 ${className}`}
        style={{ borderColor: accent, color: accent }}
      >
        Add to order
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      style={{ backgroundColor: accent }}
    >
      Add to order
      <span className="ml-2 font-normal text-white/80">
        · ${price}
        <span className="text-white/60"> {unit}</span>
      </span>
    </Link>
  );
}
