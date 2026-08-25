"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, FileCheck2, Search, ShieldCheck } from "lucide-react";
import { ExplorerJourneyCard } from "./journey-explorer-card";
import { ExplorerSupportSection } from "./journey-explorer-support";
import { EXPLORER_CARDS } from "../data/journeys";
import { IR5_ENABLED } from "@/lib/feature-flags";

const HERO_BADGES = [
  {
    label: "Immediate-relative routes",
    icon: ShieldCheck,
    className:
      "border-[var(--rahvana-primary-light)] bg-[var(--rahvana-primary-pale)] text-[var(--rahvana-primary-dark)]",
    iconClassName: "text-[var(--rahvana-primary)]",
  },
  {
    label: "Document-first roadmap",
    icon: FileCheck2,
    className: "border-[var(--rv-green)] bg-[var(--rv-green-bg)] text-[var(--rv-green)]",
    iconClassName: "text-[var(--rv-green)]",
  },
  {
    label: "Timeline-aware guidance",
    icon: Clock3,
    className: "border-[var(--rv-amber)] bg-[var(--rv-amber-bg)] text-[var(--rv-amber)]",
    iconClassName: "text-[var(--rv-amber)]",
  },
];

export function JourneyExplorerPage() {
  const [query, setQuery] = useState("");

  // IR-5 is hidden on production (see lib/feature-flags) until it launches.
  const baseCards = useMemo(
    () => EXPLORER_CARDS.filter((card) => IR5_ENABLED || card.slug !== "ir-5"),
    []
  );

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return baseCards;
    }

    return baseCards.filter((card) =>
      [card.code, card.title, card.audience, card.summary, card.category, ...card.highlights]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query, baseCards]);

  return (
    <main className="guide-grid-bg bg-[var(--rv-sky)] text-[var(--rv-ink)]">
      <section className="relative overflow-hidden px-4 pb-14 pt-20 sm:px-6 lg:px-12 lg:pb-20 lg:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,115,119,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(232,241,251,0.78))]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-[var(--rahvana-primary-dark)] sm:text-5xl lg:text-7xl"
          >
            Explore your path to a new future
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
            className="mt-5 max-w-3xl text-base leading-8 text-[var(--rv-soft)] sm:text-lg lg:text-xl"
          >
            Find the route that matches your family, work, study, or investment goal, then open a
            focused journey page with the steps, evidence, and decisions that matter.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: "easeOut" }}
            className="mt-9 w-full max-w-3xl rounded-[1.4rem] border border-white/80 bg-white/85 p-3 shadow-[0_24px_60px_-34px_rgba(12,27,51,0.35)] backdrop-blur-xl"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--rv-line)] bg-white px-4 text-left">
                <Search className="h-5 w-5 shrink-0 text-[var(--rahvana-primary)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search visas, timelines, or audiences"
                  className="w-full border-0 bg-transparent p-0 text-sm text-[var(--rv-ink)] outline-none placeholder:text-[var(--rv-muted)]"
                />
              </label>

              <button
                type="button"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--rahvana-primary)] px-6 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rahvana-primary-dark)]"
              >
                Find Journey
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24, ease: "easeOut" }}
            className="mt-5 hidden md:flex flex-wrap justify-center gap-2"
          >
            {HERO_BADGES.map((badge) => {
              const Icon = badge.icon;
              return (
                <span
                  key={badge.label}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur ${badge.className}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${badge.iconClassName}`} />
                  {badge.label}
                </span>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--rv-navy)] sm:text-3xl">
              Available pathways
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--rv-soft)] sm:text-base">
              Browse practical immigration routes built around real decision points, required
              evidence, and the next action a traveler or sponsor should take.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[var(--rv-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--rv-navy)] shadow-[0_14px_35px_-28px_rgba(12,27,51,0.45)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--rahvana-primary-pale)] text-[var(--rahvana-primary)]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Curated by route and readiness
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((card, index) => (
            <motion.div
              key={card.code}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.2) }}
            >
              <ExplorerJourneyCard card={card} />
            </motion.div>
          ))}
        </div>
      </section>

      <ExplorerSupportSection />
    </main>
  );
}
