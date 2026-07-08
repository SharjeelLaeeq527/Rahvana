"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Handshake,
  IdCard,
  Landmark,
  Lightbulb,
  PlaneTakeoff,
  Route,
  ShieldCheck,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import type {
  JourneyDetailContent,
  JourneyPreparationCategory,
  JourneyStep,
} from "../data/journeys";

const PREPARATION_ICONS: Record<JourneyPreparationCategory["icon"], LucideIcon> = {
  relationship: Handshake,
  financial: Landmark,
  identity: IdCard,
  forms: FileText,
  interview: UserRoundCheck,
  arrival: PlaneTakeoff,
};

export function JourneyHeroImageCard({ journey }: { journey: JourneyDetailContent }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative"
    >
      <div className="overflow-hidden rounded-[1.45rem] border border-white bg-white shadow-[0_26px_70px_-42px_rgba(12,27,51,0.55)]">
        <div className="relative h-[350px] sm:h-[370px]">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url(${journey.heroImage})` }}
          />
          <div className="absolute inset-0" />
          <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" />
            {journey.code}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export function JourneyRoadmap({ steps }: { steps: JourneyStep[] }) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 72%", "end 45%"],
  });
  const lineScale = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.35,
  });

  return (
    <section>
      <div className="flex items-center gap-3">
        <Route className="h-5 w-5 text-[var(--rahvana-primary)]" />
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--rahvana-primary-dark)] sm:text-3xl">
          The Roadmap to Residency
        </h2>
      </div>

      <div ref={timelineRef} className="relative mt-7 space-y-6 pl-8">
        <div className="absolute bottom-0 left-[10px] top-2 w-px bg-[var(--rv-line)]" />
        <motion.div
          className="absolute left-[10px] top-2 w-px origin-top bg-[var(--rahvana-primary)]"
          style={{ bottom: 0, scaleY: lineScale }}
        />

        {steps.map((step, index) => (
          <motion.article
            key={step.stage + step.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.24), ease: "easeOut" }}
            className="relative overflow-hidden rounded-lg border border-[var(--rv-line)] bg-white p-5 shadow-[0_16px_38px_-32px_rgba(12,27,51,0.45)]"
          >
            <span
              className={`absolute -left-[31px] top-6 z-10 flex h-2.5 w-2.5 rounded-full ring-4 ring-[#f6f9ff] ${
                index === 0 ? "bg-[var(--rahvana-primary-dark)]" : "bg-[#8fdde1]"
              }`}
            />
            <div className="grid gap-5 xl:grid-cols-[1fr_0.82fr]">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--rahvana-primary)]">
                  {step.stage}
                </p>
                <h3 className="mt-2 text-lg font-bold tracking-[-0.02em] text-[var(--rv-navy)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--rahvana-primary-dark)]">
                  {step.summary}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--rv-soft)]">{step.detail}</p>
              </div>

              <div className="rounded-lg bg-[var(--rahvana-primary-pale)] p-4">
                <div className="grid gap-3">
                  <StageMeta icon={BadgeCheck} label="Typical duration" value={step.duration} />
                  <StageMeta icon={FileCheck2} label="Expected outcome" value={step.outcome} />
                  <StageMeta
                    icon={ClipboardCheck}
                    label="How Rahvana helps"
                    value={step.rahvanaSupport}
                  />
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function StageMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rahvana-primary)]" />
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--rv-muted)]">
          {label}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[var(--rv-navy)]">{value}</p>
      </div>
    </div>
  );
}

export function JourneyQuickFacts({ journey }: { journey: JourneyDetailContent }) {
  return (
    <aside className="h-fit rounded-lg border border-[var(--rv-line)] bg-white p-5 shadow-[0_18px_42px_-34px_rgba(12,27,51,0.42)] lg:sticky lg:top-24">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-[var(--rahvana-primary)]" />
        <h2 className="text-lg font-bold text-[var(--rv-navy)]">Quick Facts</h2>
      </div>

      <div className="mt-5 divide-y divide-[var(--rv-line)]">
        {journey.quickFacts.map((fact) => (
          <div key={fact.label} className="flex items-center justify-between gap-4 py-3">
            <p className="text-xs font-semibold text-[var(--rv-muted)]">{fact.label}</p>
            <p className="text-right text-xs font-extrabold text-[var(--rahvana-primary-dark)]">
              {fact.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg bg-[var(--rahvana-primary-pale)] p-4">
        <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--rahvana-primary-dark)]">
          <Lightbulb className="h-4 w-4" />
          {journey.callout.eyebrow}
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-[var(--rv-navy)]">
          {journey.callout.title}
        </p>
        <p className="mt-2 text-xs leading-5 text-[var(--rv-soft)]">{journey.callout.body}</p>
      </div>

      <div className="mt-5 space-y-3">
        {journey.supportingResources.map((resource) => (
          <div key={resource.title} className="rounded-lg border border-[var(--rv-line)] p-3">
            <p className="text-sm font-bold text-[var(--rv-navy)]">{resource.title}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--rv-soft)]">{resource.description}</p>
          </div>
        ))}
      </div>

      <Link
        href="/visa-eligibility"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--rahvana-primary)] px-4 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rahvana-primary-dark)]"
      >
        Check My Eligibility
        <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

export function JourneyPreparationStack({ journey }: { journey: JourneyDetailContent }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const categories = journey.preparationCategories;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        setPreviousIndex(current);
        return (current + 1) % categories.length;
      });
    }, 3200);

    return () => window.clearInterval(timer);
  }, [categories.length]);

  const stackedCategories = useMemo(
    () =>
      categories.map((category, index) => {
        const offset = (index - activeIndex + categories.length) % categories.length;
        const wasFront = index === previousIndex && index !== activeIndex;
        return { category, index, offset, wasFront };
      }),
    [activeIndex, categories, previousIndex]
  );

  function getCardState(offset: number, wasFront: boolean) {
    if (wasFront) {
      return {
        x: [0, -92, 92],
        y: [0, 42, 64],
        scale: [1, 0.92, 0.82],
        rotate: [0, -5, 2.8],
        opacity: [1, 0.62, 0.36],
        zIndex: 1,
      };
    }

    const visibleOffset = Math.min(offset, 3);
    const isFront = offset === 0;
    return {
      x: isFront ? [92, 0] : visibleOffset * 28,
      y: isFront ? [22, 0] : visibleOffset * 20,
      scale: isFront ? [0.95, 1] : 1 - visibleOffset * 0.045,
      rotate: isFront ? [2, 0] : visibleOffset * 0.8,
      opacity: offset < 4 ? (isFront ? [0.78, 1] : 0.76 - visibleOffset * 0.09) : 0,
      zIndex: isFront ? categories.length + 2 : categories.length - offset,
    };
  }

  return (
    <section className="overflow-hidden bg-white/80 px-4 py-16 sm:px-6 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--rahvana-primary)]">
            Journey preparation
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[var(--rv-navy)] sm:text-4xl">
            {journey.preparationHeading}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--rv-soft)] sm:text-base">
            {journey.preparationDescription}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <button
                key={category.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  index === activeIndex
                    ? "bg-[var(--rahvana-primary)] text-white"
                    : "bg-[var(--rahvana-primary-pale)] text-[var(--rahvana-primary-dark)]"
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[360px]">
          {stackedCategories.map(({ category, index, offset, wasFront }) => {
            const isFront = offset === 0;
            const cardState = getCardState(offset, wasFront);

            return (
              <motion.div
                key={category.title}
                className="absolute inset-x-0 top-0"
                animate={cardState}
                transition={{
                  x: { duration: wasFront ? 0.82 : 0.58, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: wasFront ? 0.82 : 0.58, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: wasFront ? 0.82 : 0.58, ease: [0.22, 1, 0.36, 1] },
                  rotate: { duration: wasFront ? 0.82 : 0.58, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.42, ease: "easeOut" },
                }}
              >
                <PreparationCard
                  category={category}
                  compactLabel={`0${index + 1}`}
                  className={isFront ? "" : "pointer-events-none"}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PreparationCard({
  category,
  compactLabel,
  className = "",
}: {
  category: JourneyPreparationCategory;
  compactLabel: string;
  className?: string;
}) {
  const Icon = PREPARATION_ICONS[category.icon];

  return (
    <article
      className={`rounded-lg border border-[var(--rv-line)] bg-white p-7 shadow-[0_28px_70px_-46px_rgba(12,27,51,0.55)] ${className}`}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--rahvana-primary-pale)] text-[var(--rahvana-primary)]">
          <Icon className="h-7 w-7" />
        </div>
        <span className="text-sm font-extrabold text-[var(--rv-line)]">{compactLabel}</span>
      </div>
      <h3 className="mt-6 text-2xl font-bold tracking-[-0.03em] text-[var(--rv-navy)]">
        {category.title}
      </h3>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--rv-soft)]">
        {category.description}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--rahvana-primary-pale)] px-4 py-2 text-xs font-bold text-[var(--rahvana-primary-dark)]">
        <BadgeCheck className="h-4 w-4" />
        Prepared inside the guided journey
      </div>
    </article>
  );
}
