"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ADDONS } from "@/app/(main)/pricing/data/pricing";
import { Check } from "lucide-react";

const CART_STORAGE_KEY = "rahvana_pricing_cart_addons";

/**
 * Single source of truth for "is this add-on already in the pricing cart?",
 * read from the sessionStorage copy the pricing page persists on every
 * change. Also re-checks whenever the pricing page broadcasts a cart change
 * (`rahvana-cart-change`), so detail-page CTAs never drift out of sync with
 * the pricing page's Add buttons and order summary.
 */
export function usePricingCartState(slug: string) {
  const [isAdded, setIsAdded] = useState(false);

  const refreshCartState = useCallback(() => {
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (!Array.isArray(stored)) return setIsAdded(false);
      setIsAdded(
        stored.some(
          (item) =>
            item === slug ||
            // interview-prep is stored per visa category ("interview-prep:ir-1-spouse")
            (slug === "interview-prep" &&
              typeof item === "string" &&
              item.startsWith("interview-prep:"))
        )
      );
    } catch {
      setIsAdded(false);
    }
  }, [slug]);

  useEffect(() => {
    refreshCartState();
    window.addEventListener("pageshow", refreshCartState);
    window.addEventListener("rahvana-cart-change", refreshCartState);
    return () => {
      window.removeEventListener("pageshow", refreshCartState);
      window.removeEventListener("rahvana-cart-change", refreshCartState);
    };
  }, [refreshCartState]);

  return { isAdded, refreshCartState };
}

/**
 * Detail-page CTA. Deep-links back to the pricing page on the add-on's tab
 * (Tools / Services / Guides) with this add-on pre-selected, so it lands
 * straight in the order summary. When the add-on is already in the cart the
 * button reflects that ("Added to order") instead of offering it again.
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
  const { isAdded } = usePricingCartState(slug);
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
        {isAdded ? (
          <>
            <Check className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
            Added to cart
          </>
        ) : (
          "Add to cart"
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      style={{ backgroundColor: accent }}
    >
      {isAdded ? (
        <>
          <Check className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
          Added to cart
        </>
      ) : (
        "Add to cart"
      )}
      {!isAdded && (
        <span className="ml-2 font-normal text-white/80">
          · ${price}
          <span className="text-white/60"> {unit}</span>
        </span>
      )}
    </Link>
  );
}
