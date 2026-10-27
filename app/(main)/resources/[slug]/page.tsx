import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
// ArrowLeft now lives inside <ResourceBackButton /> (back → history, not pricing):
// import { ArrowLeft } from "lucide-react";

import {
  ADDONS,
  // SERVICE_FLOW_HREF, // Unused now — checkout CTAs commented out per product decision
  getResourceLaunchHref,
} from "@/app/(main)/pricing/data/pricing";
import {
  // RESOURCE_DETAILS, // Used only by the commented-out "Pairs well with" section
  RESOURCE_SLUGS,
  getResourceDetail,
} from "@/app/(main)/pricing/data/resourceDetails";
import ResourceGallery from "./ResourceGallery";
// Add-to-cart / bottom CTA removed per product decision (code kept, commented):
// import AddToOrderButton from "./AddToOrderButton";
// import BottomCta from "./BottomCta";
import ResourceLaunchButton from "@/components/pricing/ResourceLaunchButton";
import ReviewForm from "@/components/resources/ReviewForm";
import { getApprovedReviews, getReviewStats } from "@/lib/reviews/data-access";
// getSlugTheme/getIcon powered the "Pairs well with" section (now commented out):
// import { getSlugTheme, getIcon } from "./iconMap";
import { PHOTO_BOOTH_TOOL_ID, SMART_FORM_TOOL_ID, WALLET_CATALOG } from "@/lib/wallet/catalog";
import { withPreviewMode } from "@/lib/wallet/resourceMapping";
import CreditTypeIcon from "@/components/resources/CreditTypeIcon";
import BackButton from "@/components/pricing/BackButton";
// import ResourceBackButton from "@/components/resources/ResourceBackButton";

// ── Palette ──────────────────────────────────────────────────────────────────
// A small, deliberate accent set drawn from the site's brand tokens. Each section
// owns one accent so the eye can tell elements apart at a glance — never one flat
// colour, never a random rainbow. Gold is reserved for ratings only.
const TEAL = "#0d7377";
const TEAL_DARK = "#0a5a5d";
const TEAL_PALE = "#e8f6f6";
const PURPLE = "#4a2d8a";
const PURPLE_TINT = "#f3f0fb";
const BLUE = "#2f6fd4";
const GREEN = "#15744f";
const GREEN_TINT = "#e8f5ef";
const AMBER = "#8a6200";
const GOLD = "#d99a00";
const SERIF = '"DM Serif Display", Georgia, serif';

type AddonMeta = {
  title: string;
  price: number;
  unit: string;
  copy: string;
  note: string;
  kind: "tools" | "services" | "guides";
};

// case-manager has its title commented out in ADDONS — provide safe fallbacks.
const TITLE_FALLBACK: Record<string, string> = {
  "case-manager": "Dedicated Case Manager",
};

function getAddon(slug: string): AddonMeta | undefined {
  const a = ADDONS.find((x) => x.id === slug);
  if (!a) return undefined;
  return {
    title: (a as { title?: string }).title ?? TITLE_FALLBACK[slug] ?? slug,
    price: a.price,
    unit: a.unit,
    copy: a.copy,
    note: a.note,
    kind: (a as { kind?: AddonMeta["kind"] }).kind ?? "tools",
  };
}

export function generateStaticParams() {
  return RESOURCE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getResourceDetail(slug);
  const addon = getAddon(slug);
  if (!detail || !addon) return { title: "Tool not found · Rahvana" };
  return {
    title: `${addon.title} · Rahvana`,
    description: detail.tagline,
    openGraph: {
      title: `${addon.title} · Rahvana`,
      description: detail.tagline,
      images: detail.media[0]?.src ? [detail.media[0].src] : undefined,
    },
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getResourceDetail(slug);
  const addon = getAddon(slug);
  if (!detail || !addon) notFound();

  // Services aren't added to the cart — they route to a guided flow page that
  // collects info and handles payment at checkout (e.g. /book-consultation).
  // ORIGINAL (checkout CTAs now commented out per product decision):
  // const serviceFlowHref = addon.kind === "services" ? SERVICE_FLOW_HREF[slug] : undefined;
  const launchHref = getResourceLaunchHref(slug, addon.kind);

  // Credit price is the only price shown on this page (no $ anywhere).
  const walletItem = WALLET_CATALOG.find((i) => i.legacyAddonId === slug);
  const credits = walletItem?.credits ?? addon.price;
  const noun = addon.kind === "guides" ? "Guide" : addon.kind === "services" ? "Service" : "Tool";

  // Related resources powered the "Pairs well with" section (now commented out):
  // const related = detail.related
  //   .map((rs) => ({ slug: rs, detail: RESOURCE_DETAILS[rs], addon: getAddon(rs) }))
  //   .filter((r) => r.detail && r.addon);

  // Real, approved reviews only — no seeded or sample data.
  const [dbReviews, dbStats] = await Promise.all([getApprovedReviews(slug), getReviewStats(slug)]);

  const displayCount = dbStats.count;
  const displayRating = dbStats.average;
  const hasReviews = displayCount > 0;

  const totalForBars = dbStats.distribution.reduce((a, b) => a + b, 0) || 1;
  const distribution = [5, 4, 3, 2, 1].map((star, i) => ({
    star,
    count: dbStats.distribution[i],
    pct: Math.round((dbStats.distribution[i] / totalForBars) * 100),
  }));

  // Real review feed only — shown with the accurate verified-purchase badge.
  const displayReviews = dbReviews.map((r) => ({
    name: r.reviewerName,
    location: r.location,
    rating: r.rating,
    quote: r.body,
    verified: r.verifiedPurchase,
  }));

  // ORIGINAL back-to-pricing label (removed — back now goes to the previous page):
  // const categoryLabel =
  //   addon.kind === "services" ? "Services" : addon.kind === "guides" ? "Guides" : "Tools";

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-[1100px] px-5 pt-[88px] pb-28 sm:px-8 lg:px-10">
        {/* Back navigation & Breadcrumb — back now returns to the previous page */}

        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2.5 text-[13.5px]"
        >
          <BackButton fallbackHref="/resources" />

          <span className="text-border" aria-hidden="true">
            /
          </span>

          <span className="text-foreground font-medium">{addon.title}</span>
        </nav>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="animate-fade-up flex flex-col justify-center">
            {detail.badge && (
              <span
                className="mb-5 text-[11px] font-semibold tracking-[0.18em] uppercase"
                style={{ color: TEAL }}
              >
                {detail.badge}
              </span>
            )}

            <h1
              className="text-foreground text-[34px] leading-[1.08] tracking-[-0.01em] sm:text-[46px]"
              style={{ fontFamily: SERIF }}
            >
              {addon.title}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-[16px] leading-relaxed sm:text-[17px]">
              {detail.tagline}
            </p>

            {/* Rating */}
            {hasReviews ? (
              <div className="mt-5 flex items-center gap-2.5 text-[13.5px]">
                <Stars value={displayRating} />
                <span className="text-foreground font-semibold">{displayRating.toFixed(1)}</span>
                <span className="text-muted-foreground">· {displayCount} reviews</span>
              </div>
            ) : (
              <p className="text-muted-foreground mt-5 text-[13px]">No reviews yet</p>
            )}

            {/* Price — credits only, no $ price anywhere (per product decision) */}
            <div className="mt-9 flex items-center gap-2.5">
              <span
                className="text-[42px] leading-none"
                style={{ fontFamily: SERIF, color: TEAL_DARK }}
              >
                {credits}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-[14px]">
                <CreditTypeIcon kind={addon.kind} size={18} />
                {/* The Smart Form Filler is unlocked one form at a time. */}
                {walletItem?.resourceId === SMART_FORM_TOOL_ID && <span>per form</span>}
                {/* Photo Booth is sold in packs of 2 photos. */}
                {walletItem?.resourceId === PHOTO_BOOTH_TOOL_ID && <span>for 2 photos</span>}
              </span>
            </div>
            {/* ORIGINAL $ price display (removed — page shows credits only):
                <div className="mt-9 flex items-baseline gap-2.5">
                  <span className="text-[42px] leading-none" style={{ fontFamily: SERIF, color: TEAL_DARK }}>
                    ${addon.price}
                  </span>
                  <span className="text-muted-foreground text-[14px]">{addon.unit}</span>
                </div>
            */}
            {addon.note && <p className="text-muted-foreground mt-2 text-[13px]">{addon.note}</p>}

            {/* CTAs — Explore + Preview (add-to-cart / checkout removed per product decision) */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {/* ORIGINAL add-to-cart / checkout CTAs (commented out, code kept):
                  {serviceFlowHref ? (
                    <Link href={serviceFlowHref} className="..." style={{ backgroundColor: TEAL }}>
                      Add {addon.title} info to checkout
                      <span className="ml-2 font-normal text-white/80">→</span>
                    </Link>
                  ) : (
                    <AddToOrderButton slug={slug} price={addon.price} unit={addon.unit} accent={TEAL} />
                  )}
              */}
              <ResourceLaunchButton href={launchHref} kind={addon.kind} label={`Explore ${noun}`} />
              <Link
                href={withPreviewMode(launchHref)}
                className="inline-flex items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0d7377]/50 hover:text-[#0d7377]"
              >
                Preview {noun}
              </Link>
            </div>

            <p className="text-muted-foreground mt-7 text-[12.5px]">
              No full plan required &nbsp;·&nbsp; Paid with Rahvana credits &nbsp;·&nbsp; Built
              around your case
            </p>
          </div>

          <div className="animate-fade-up [animation-delay:120ms] lg:pt-1">
            <ResourceGallery
              media={detail.media}
              accent={TEAL}
              tint={TEAL_PALE}
              title={addon.title}
            />
          </div>
        </section>

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        <section className="mt-24 max-w-2xl">
          <SectionHeading>Overview</SectionHeading>
          <div className="mt-6 space-y-4">
            {detail.overview.map((p, i) => (
              <p key={i} className="text-foreground/75 text-[15.5px] leading-[1.75]">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* ── Key features ──────────────────────────────────────────────────── */}
        <section className="mt-24">
          <SectionHeading color={PURPLE}>What&apos;s included</SectionHeading>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {detail.highlights.map((h, i) => (
              <div key={i} className="rounded-[16px] p-6" style={{ backgroundColor: PURPLE_TINT }}>
                <h3 className="text-foreground text-[15.5px] font-semibold">{h.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-[14px] leading-relaxed">{h.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section className="mt-24">
          <SectionHeading color={BLUE}>How it works</SectionHeading>
          <div className="mt-9 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {detail.steps.map((s, i) => (
              <div key={i}>
                <span
                  className="text-[32px] leading-none"
                  style={{ fontFamily: SERIF, color: BLUE }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-foreground mt-4 text-[15px] font-semibold">{s.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-[13.5px] leading-relaxed">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Audience + outcomes ───────────────────────────────────────────── */}
        <section className="mt-24 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[20px] p-8" style={{ backgroundColor: TEAL_PALE }}>
            <SectionHeading color={TEAL_DARK}>Who it&apos;s for</SectionHeading>
            <ul className="mt-6 space-y-3.5">
              {detail.audience.map((a, i) => (
                <li key={i} className="text-foreground/80 flex gap-3 text-[14.5px]">
                  <Dot color={TEAL} />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[20px] p-8" style={{ backgroundColor: GREEN_TINT }}>
            <SectionHeading color={GREEN}>What you get</SectionHeading>
            <ul className="mt-6 space-y-3.5">
              {detail.outcomes.map((o, i) => (
                <li key={i} className="text-foreground/85 flex gap-3 text-[14.5px]">
                  <Dot color={GREEN} />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="mt-24 max-w-2xl">
          <SectionHeading>Questions</SectionHeading>
          <div className="divide-border border-border mt-6 divide-y border-y">
            {detail.faqs.map(([q, a], i) => (
              <details key={i} className="group">
                <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[14.5px] font-medium">
                  {q}
                  <span
                    className="text-[18px] leading-none font-normal transition-transform duration-200 group-open:rotate-45"
                    style={{ color: TEAL }}
                  >
                    +
                  </span>
                </summary>
                <p className="text-muted-foreground pb-5 text-[14px] leading-[1.7]">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <section className="mt-24">
          <SectionHeading color={AMBER}>Reviews</SectionHeading>
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[290px_1fr]">
            {/* Summary + distribution */}
            <div className="h-fit lg:sticky lg:top-24">
              {hasReviews ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-foreground text-[44px] leading-none"
                      style={{ fontFamily: SERIF }}
                    >
                      {displayRating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-[13px]">out of 5</span>
                  </div>
                  <div className="mt-3">
                    <Stars value={displayRating} size={17} />
                  </div>
                  <p className="text-muted-foreground mt-2 text-[13px]">
                    Based on {displayCount} reviews
                  </p>

                  <div className="mt-6 space-y-2">
                    {distribution.map((b) => (
                      <div key={b.star} className="flex items-center gap-3">
                        <span className="text-muted-foreground w-3 text-[12px] tabular-nums">
                          {b.star}
                        </span>
                        <span className="bg-muted relative h-[7px] flex-1 overflow-hidden rounded-full">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${b.pct}%`, backgroundColor: GOLD }}
                          />
                        </span>
                        <span className="text-muted-foreground w-9 text-right text-[12px] tabular-nums">
                          {b.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-[14px] leading-relaxed">
                  Be the first to share your experience.
                </p>
              )}

              <ReviewForm slug={slug} accent={TEAL} tint={TEAL_PALE} />
            </div>

            {/* Feed */}
            <div className="space-y-5">
              {displayReviews.length === 0 && (
                <p className="text-muted-foreground text-[14px] leading-relaxed">
                  No reviews yet. Once verified customers leave reviews, they&apos;ll appear here.
                </p>
              )}
              {displayReviews.map((r, i) => (
                <figure key={i} className="border-border border-t pt-6 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <figcaption className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold uppercase"
                        style={{ backgroundColor: TEAL_PALE, color: TEAL_DARK }}
                      >
                        {r.name.charAt(0)}
                      </span>
                      <span className="leading-tight">
                        <span className="text-foreground block text-[14px] font-semibold">
                          {r.name}
                        </span>
                        {r.location && (
                          <span className="text-muted-foreground block text-[12px]">
                            {r.location}
                          </span>
                        )}
                      </span>
                    </figcaption>
                    {r.verified && (
                      <span className="shrink-0 text-[11px] font-semibold" style={{ color: GREEN }}>
                        Verified purchase
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <Stars value={r.rating} size={13} />
                  </div>
                  <blockquote className="text-foreground/80 mt-2.5 text-[14.5px] leading-relaxed">
                    {r.quote}
                  </blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── Related ───────────────────────────────────────────────────────── */}
        {/* ── Related / "Pairs well with" — removed per product decision (code kept) ──
        {related.length > 0 && (
          <section className="mt-24">
            <SectionHeading>Pairs well with</SectionHeading>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const rt = getSlugTheme(r.slug);
                const RIcon = getIcon(rt.icon);
                return (
                  <Link
                    key={r.slug}
                    href={`/resources/${r.slug}`}
                    className="group bg-card flex flex-col rounded-[18px] p-6 transition-all duration-300 hover:-translate-y-[3px]"
                    style={{
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 12px 28px -22px rgba(0,0,0,0.3)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="flex h-11 w-11 items-center justify-center rounded-[12px] transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: rt.tint, color: rt.accent }}
                    >
                      <RIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                    </span>
                    <span
                      className="mt-3 mb-4 block h-[2px] w-7 rounded-full transition-all duration-300 group-hover:w-12"
                      style={{ backgroundColor: rt.accent }}
                    />
                    <h3 className="text-foreground text-[15.5px] font-semibold">
                      {r.addon!.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-[13px] leading-relaxed">
                      {r.detail!.tagline}
                    </p>
                    <span
                      className="mt-4 text-[13px] font-semibold transition-transform group-hover:translate-x-0.5"
                      style={{ color: rt.accent }}
                    >
                      View tool →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        */}

        {/* ── Bottom CTA — removed per product decision (code kept) ──────────
        <BottomCta
          title={addon.title}
          href={serviceFlowHref ?? launchHref}
          isService={Boolean(serviceFlowHref)}
        />
        */}

        <div className="mt-10">
          {/* ORIGINAL back-to-pricing link, commented out per decision:
              <Link href={`/pricing?mode=${addon.kind}`} className="...">
                <ArrowLeft className="h-4 w-4 ..." />
                <span>Back to Pricing ({categoryLabel})</span>
              </Link>
          */}
          {/* <ResourceBackButton className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-[13.5px] font-medium transition-colors" /> */}
        </div>
      </div>
    </div>
  );
}

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{ fontSize: size, lineHeight: 1, color: i < rounded ? GOLD : "#d6d6d6" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function Dot({ color = TEAL }: { color?: string }) {
  return (
    <span
      className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function SectionHeading({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <h2
      className="text-foreground text-[22px] leading-none sm:text-[26px]"
      style={{ fontFamily: SERIF, color }}
    >
      {children}
    </h2>
  );
}
