"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Hourglass } from "lucide-react";
import type { ExplorerJourneyCard as ExplorerJourneyCardType } from "../data/journeys";

export function ExplorerJourneyCard({ card }: { card: ExplorerJourneyCardType }) {
  const isLive = card.status === "Live" && card.href;

  if (card.code === "K-1") {
    return <ComingSoonJourneyCard />;
  }

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[var(--rv-line)] bg-white shadow-[0_20px_46px_-34px_rgba(12,27,51,0.48)]"
    >
      <div className="relative h-80 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${card.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,27,51,0.86)] via-[rgba(12,27,51,0.28)] to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--rahvana-primary-dark)] backdrop-blur">
            {card.category}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] backdrop-blur ${
              isLive
                ? "bg-[var(--rahvana-secondary)]/90 text-[var(--rv-navy)]"
                : "bg-white/80 text-[var(--rv-muted)]"
            }`}
          >
            {card.status}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            {card.code}
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{card.title}</h3>
        </div>
      </div>

      <div className="mt-auto p-5">
        {isLive && card.href ? (
          <Link
            href={card.href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--rahvana-primary)] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rahvana-primary-dark)]"
          >
            Learn More
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-[var(--rv-sky)] px-5 py-3 text-sm font-semibold text-[var(--rv-muted)]"
          >
            Coming soon
          </button>
        )}
      </div>
    </motion.article>
  );
}

function ComingSoonJourneyCard() {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="guide-grid-bg relative flex h-full min-h-[341px] flex-col overflow-hidden rounded-[1.35rem] border border-[var(--rv-line)] bg-white p-6 text-center shadow-[0_20px_46px_-34px_rgba(12,27,51,0.48)]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(232,241,251,0.72))]" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--rahvana-primary-pale)] text-[var(--rahvana-primary)]"
        >
          <Hourglass className="h-7 w-7" />
        </motion.div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[var(--rahvana-primary)]">
          COMING SOON
        </p>

        <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[var(--rv-navy)]">
          More Journeys Coming Soon
        </h3>

        <p className="mt-3 max-w-xs text-sm leading-7 text-[var(--rv-soft)]">
          More immigration pathways are on the way. Stay tuned.
        </p>
      </div>
    </motion.article>
  );
}