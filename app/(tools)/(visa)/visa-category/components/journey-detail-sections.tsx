"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
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

const smoothSpring = {
  type: "spring" as const,
  stiffness: 120,
  damping: 22,
  mass: 0.9,
};

const cardEase = [0.22, 1, 0.36, 1] as const;

const softTween = {
  duration: 0.72,
  ease: [0.16, 1, 0.3, 1] as const,
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

          {/* Subtle image overlay for overall visual consistency */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

          {/* Journey code badge */}
          <div className="absolute top-5 left-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#0D7377] px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.18em] text-white uppercase shadow-[0_8px_24px_-10px_rgba(13,115,119,0.9)]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-white" />
              <span>{journey.code}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

const STAGE_THEMES = [
  {
    metaBg: "bg-[#AFDBDB]/45",
  },
  {
    metaBg: "bg-[#F4D9A6]/38",
  },
  {
    metaBg: "bg-[#DB8090]/15",
  },
] as const;

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
        <Route className="h-5 w-5 text-[#0D7377]" />

        <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--rv-navy)] sm:text-3xl">
          The Roadmap to Residency
        </h2>
      </div>

      <div ref={timelineRef} className="relative mt-7 space-y-6 pl-8">
        {/* Base timeline */}
        <div className="absolute top-2 bottom-0 left-[10px] w-px bg-[#AFDBDB]" />

        {/* Active timeline */}
        <motion.div
          className="absolute top-2 left-[10px] w-px origin-top bg-[#0D7377]"
          style={{ bottom: 0, scaleY: lineScale }}
        />

        {steps.map((step, index) => (
          <motion.article
            key={step.stage + step.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.35,
              delay: Math.min(index * 0.06, 0.24),
              ease: "easeOut",
            }}
            className="relative overflow-hidden rounded-lg border border-[var(--rv-line)] bg-white p-5 shadow-[0_16px_38px_-32px_rgba(12,27,51,0.45)]"
          >
            {/* Timeline marker */}
            <span
              className={`absolute top-6 -left-[31px] z-10 flex h-2.5 w-2.5 rounded-full ring-4 ring-[#f6f9ff] ${
                index === 0 ? "bg-[#0D7377]" : "bg-[#89A4A0]"
              }`}
            />

            <div className="grid gap-5 xl:grid-cols-[1fr_0.82fr]">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.18em] text-[#89A4A0] uppercase">
                  {step.stage}
                </p>

                <h3 className="mt-2 text-lg font-bold tracking-[-0.02em] text-[var(--rv-navy)]">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 font-semibold text-[var(--rv-navy)]">
                  {step.summary}
                </p>

                <p className="mt-2 text-sm leading-6 text-[var(--rv-soft)]">{step.detail}</p>
              </div>

              {/* Step metadata */}
              <div
  className={`rounded-lg p-4 ${
    STAGE_THEMES[index % STAGE_THEMES.length].metaBg
  }`}
>
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
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0D7377]" />

      <div>
        <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#89A4A0] uppercase">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 font-semibold text-[var(--rv-navy)]">{value}</p>
      </div>
    </div>
  );
}

export function JourneyQuickFacts({ journey }: { journey: JourneyDetailContent }) {
  return (
    <aside className="h-fit rounded-lg border border-[var(--rv-line)] bg-white p-5 shadow-[0_18px_42px_-34px_rgba(12,27,51,0.42)] lg:sticky lg:top-24">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-[#0D7377]" />

        <h2 className="text-lg font-bold text-[var(--rv-navy)]">Quick Facts</h2>
      </div>

      <div className="mt-5 divide-y divide-[var(--rv-line)]">
        {journey.quickFacts.map((fact, index) => (
          <div key={fact.label} className="flex items-center justify-between gap-4 py-3">
            <p className="text-xs font-semibold text-[var(--rv-muted)]">{fact.label}</p>

            <p
              className={`text-right text-xs font-extrabold ${
                index % 3 === 1
                  ? "text-[#0D7377]"
                  : index % 3 === 2
                    ? "text-[#89A4A0]"
                    : "text-[var(--rv-navy)]"
              }`}
            >
              {fact.value}
            </p>
          </div>
        ))}
      </div>

      {/* Callout */}
      <div className="mt-5 rounded-lg bg-[#CDADCC]/25 p-4">
        <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.18em] text-[var(--rv-navy)] uppercase">
          <Lightbulb className="h-4 w-4 text-[#DB8090]" />
          {journey.callout.eyebrow}
        </div>

        <p className="mt-2 text-xs leading-5 font-semibold text-[var(--rv-navy)]">
          {journey.callout.title}
        </p>

        <p className="mt-2 text-xs leading-5 text-[var(--rv-soft)]">{journey.callout.body}</p>
      </div>

      {/* Supporting resources intentionally hidden for now */}
      {/* <div className="mt-5 space-y-3">
        {journey.supportingResources.map((resource) => (
          <div
            key={resource.title}
            className="rounded-lg border border-[var(--rv-line)] p-3"
          >
            <p className="text-sm font-bold text-[var(--rv-navy)]">
              {resource.title}
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--rv-soft)]">
              {resource.description}
            </p>
          </div>
        ))}
      </div> */}

      {/* Eligibility CTA intentionally hidden for now */}
      {/* <Link
        href="/visa-eligibility"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0D7377] px-4 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#095D60]"
      >
        Check My Eligibility
        <ArrowRight className="h-4 w-4" />
      </Link> */}
    </aside>
  );
}

export function JourneyPreparationStack({ journey }: { journey: JourneyDetailContent }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stackBaseIndex, setStackBaseIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const categories = journey.preparationCategories;
  const activeCategory = categories[activeIndex];
  const isTransitioning = activeIndex !== stackBaseIndex;

  useEffect(() => {
    if (!categories.length) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % categories.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, [categories.length]);

  const backgroundStack = useMemo(() => {
    return [1, 2, 3].map((offset) => {
      const index = (stackBaseIndex + offset) % categories.length;

      return {
        category: categories[index],
        index,
        offset,
      };
    });
  }, [categories, stackBaseIndex]);

  function selectCategory(index: number) {
    if (index !== activeIndex) {
      if (shouldReduceMotion) {
        setStackBaseIndex(index);
      }

      setActiveIndex(index);
    }
  }

  if (!categories.length) return null;

  return (
    <section className="overflow-hidden bg-white/80 px-4 py-16 sm:px-6 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={softTween}
        >
          <p className="text-xs font-bold tracking-[0.22em] text-[#89A4A0] uppercase">
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
                onClick={() => selectCategory(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                  index === activeIndex
                    ? "bg-[#0D7377] text-white shadow-[0_10px_28px_-20px_rgba(13,115,119,0.75)]"
                    : "bg-[#AFDBDB]/55 text-[var(--rv-navy)] hover:-translate-y-0.5 hover:bg-[#AFDBDB]"
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </motion.div>

        <div
          className="relative min-h-[410px] sm:min-h-[390px] lg:min-h-[385px]"
          style={{ perspective: 1400 }}
        >
          {backgroundStack
            .slice()
            .reverse()
            .map(({ category, index, offset }) => {
              const hideIncomingDuplicate = isTransitioning && index === activeIndex;

              return (
                <motion.div
                  key={`stack-${category.title}`}
                  className="pointer-events-none absolute inset-x-0 top-0 will-change-transform"
                  initial={false}
                  animate={
                    shouldReduceMotion
                      ? {
                          opacity: hideIncomingDuplicate ? 0 : 0.35,
                          x: 0,
                          y: offset * 18,
                          scale: 1,
                          rotate: 0,
                          zIndex: 10 - offset,
                        }
                      : {
                          x: offset * 28,
                          y: offset * 22,
                          scale: 1 - offset * 0.045,
                          rotate: offset * 0.65,
                          opacity: hideIncomingDuplicate ? 0 : 0.72 - offset * 0.13,
                          zIndex: 10 - offset,
                        }
                  }
                  transition={smoothSpring}
                >
                  <PreparationCard category={category} compactLabel={`0${index + 1}`} muted />
                </motion.div>
              );
            })}

          <AnimatePresence
            mode="popLayout"
            initial={false}
            onExitComplete={() => setStackBaseIndex(activeIndex)}
          >
            <motion.div
              key={activeCategory.title}
              className="absolute inset-x-0 top-0 z-20 will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "50% 60%",
              }}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : {
                      x: 420,
                      y: -20,
                      scale: 0.92,
                      rotate: 6,
                      rotateY: -18,
                      opacity: 0,
                    }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      x: 0,
                      y: 0,
                      scale: 1,
                      rotate: 0,
                      rotateY: 0,
                      opacity: 1,
                    }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : {
                      x: -190,
                      y: 70,
                      scale: 0.85,
                      rotate: -6,
                      rotateY: 10,
                      opacity: 0,
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.15 }
                  : {
                      x: {
                        type: "spring",
                        stiffness: 55,
                        damping: 22,
                        mass: 1.15,
                      },
                      y: {
                        type: "spring",
                        stiffness: 55,
                        damping: 24,
                        mass: 1.15,
                      },
                      scale: {
                        duration: 1.25,
                        ease: cardEase,
                      },
                      rotate: {
                        duration: 1.25,
                        ease: cardEase,
                      },
                      rotateY: {
                        duration: 1.25,
                        ease: cardEase,
                      },
                      opacity: {
                        duration: 1.1,
                        ease: [0.4, 0, 0.6, 1],
                        delay: 0.15,
                      },
                    }
              }
            >
              <PreparationCard category={activeCategory} compactLabel={`0${activeIndex + 1}`} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function PreparationCard({
  category,
  compactLabel,
  muted = false,
  className = "",
}: {
  category: JourneyPreparationCategory;
  compactLabel: string;
  muted?: boolean;
  className?: string;
}) {
  const Icon = PREPARATION_ICONS[category.icon];

  return (
    <article
      className={`rounded-lg border border-[var(--rv-line)] bg-white p-7 shadow-[0_28px_70px_-46px_rgba(12,27,51,0.55)] transition-shadow duration-500 ${
        muted ? "opacity-90" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#AFDBDB]/55 text-[#0D7377]">
          <Icon className="h-7 w-7" />
        </div>

        <span className="text-sm font-extrabold text-[#89A4A0]">{compactLabel}</span>
      </div>

      <h3 className="mt-6 text-2xl font-bold tracking-[-0.03em] text-[var(--rv-navy)]">
        {category.title}
      </h3>

      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--rv-soft)]">
        {category.description}
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#CDADCC]/25 px-4 py-2 text-xs font-bold text-[var(--rv-navy)]">
        <BadgeCheck className="h-4 w-4 text-[#0D7377]" />
        Prepared inside the guided journey
      </div>
    </article>
  );
}
