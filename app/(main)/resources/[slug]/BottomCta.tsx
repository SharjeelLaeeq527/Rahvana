"use client";

import Link from "next/link";
import { usePricingCartState } from "./AddToOrderButton";
import { Check } from "lucide-react";

const TEAL_DARK = "#0a5a5d";
const SERIF = '"DM Serif Display", Georgia, serif';

/**
 * Bottom CTA band on resource detail pages. Client wrapper so the button can
 * reflect the live pricing cart — if the add-on was already added from the
 * pricing page (or here), it shows "Added to cart" instead of offering it
 * again. Services keep their static guided-flow link.
 */
export default function BottomCta({
  slug,
  title,
  price,
  kind,
  serviceFlowHref,
}: {
  slug: string;
  title: string;
  price: number;
  kind: "tools" | "services" | "guides";
  serviceFlowHref?: string;
}) {
  const { isAdded } = usePricingCartState(slug);

  return (
    <section
      className="mt-24 flex flex-col items-start justify-between gap-6 rounded-[22px] p-9 sm:flex-row sm:items-center"
      style={{ backgroundColor: TEAL_DARK }}
    >
      <div>
        <h2 className="text-[24px] leading-tight text-white" style={{ fontFamily: SERIF }}>
          {serviceFlowHref
            ? `Ready to start ${title}?`
            : isAdded
              ? `${title} is in your cart`
              : `Add ${title} to your cart`}
        </h2>
        <p className="mt-1.5 text-[14px] text-white/70">
          {serviceFlowHref
            ? "Give us your details, then check out at the end."
            : "No full journey plan required."}
        </p>
      </div>
      <Link
        href={serviceFlowHref ?? `/pricing?mode=${kind}&addons=${encodeURIComponent(slug)}`}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5"
        style={{ color: TEAL_DARK }}
      >
        {serviceFlowHref ? (
          `Add ${title} info to checkout →`
        ) : isAdded ? (
          <>
            <Check className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
            Added to cart
          </>
        ) : (
          `Add to cart · $${price}`
        )}
      </Link>
    </section>
  );
}
