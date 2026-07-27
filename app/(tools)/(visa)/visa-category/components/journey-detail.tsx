import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  JourneyHeroImageCard,
  JourneyPreparationStack,
  JourneyQuickFacts,
  JourneyRoadmap,
} from "./journey-detail-sections";
import { getJourneyDetail, type JourneySlug } from "../data/journeys";

export function JourneyDetailPage({ slug }: { slug: JourneySlug }) {
  const journey = getJourneyDetail(slug);

  if (!journey) {
    notFound();
  }

  return (
    <main className="guide-grid-bg bg-[#f6f9ff] text-[var(--rv-ink)]">
      <section className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6 lg:px-12 lg:pb-20 lg:pt-20">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,249,255,0.86))]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
          <div>
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--rv-muted)]">
              <Link href="/visa-category" className="hover:text-[var(--rahvana-primary)]">
                All journeys
              </Link>
              <ArrowRight className="h-4 w-4" />
              <span className="text-[var(--rv-navy)]">{journey.code}</span>
            </nav>

            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--rahvana-primary-pale)] px-3 py-1 text-[11px] font-bold text-[var(--rahvana-primary-dark)]">
                {journey.heroEyebrow}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--rv-soft)] ring-1 ring-[var(--rv-line)]">
                Status: Permanent Residency
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-extrabold tracking-[-0.04em] text-[var(--rahvana-primary-dark)] sm:text-5xl lg:text-[3.65rem] lg:leading-[0.98]">
              {journey.title}: {journey.subtitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--rv-soft)] sm:text-base">
              {journey.summary}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={journey.ctaPrimary.href}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--rahvana-primary)] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rahvana-primary-dark)]"
              >
                Start {journey.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <JourneyHeroImageCard journey={journey} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-12 lg:pb-20">
        <JourneyRoadmap steps={journey.timeline} />
        <JourneyQuickFacts journey={journey} />
      </section>

      <JourneyPreparationStack journey={journey} />
    </main>
  );
}
