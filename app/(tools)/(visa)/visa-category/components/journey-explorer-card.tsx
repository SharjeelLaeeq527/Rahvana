"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Hourglass, CheckCircle2, Radio } from "lucide-react";
import type { ExplorerJourneyCard as ExplorerJourneyCardType } from "../data/journeys";

export function ExplorerJourneyCard({
  card,
  onSelect,
  showStartJourney = false,
  isExecutiveMaxed = false,
  executiveNotice,
}: {
  card: ExplorerJourneyCardType;
  onSelect?: () => void;
  showStartJourney?: boolean;
  isExecutiveMaxed?: boolean;
  executiveNotice?: React.ReactNode;
}) {
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
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {/* <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[var(--rahvana-primary-dark)] uppercase backdrop-blur">
            {card.category}
          </span> */}
          <span
            title={card.status}
            aria-label={card.status}
            className={`flex h-7 w-7 items-center justify-center rounded-full shadow-xs backdrop-blur ${
              isLive
                ? "bg-[var(--rahvana-secondary)]/90 text-[var(--rv-navy)]"
                : "bg-white/80 text-[var(--rv-muted)]"
            }`}
          >
            {isLive ? <Radio className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
          </span>
        </div>
        <div className="absolute right-4 bottom-4 left-4 text-white">
          <p className="text-sm font-semibold tracking-[0.18em] text-white/70 uppercase">
            {card.code}
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{card.title}</h3>
        </div>
      </div>

      <div className="mt-auto p-5">
        {executiveNotice ? (
          executiveNotice
        ) : isExecutiveMaxed ? (
          <>
            {/* <div className="flex flex-col gap-2 rounded-2xl border border-teal-200/90 bg-teal-50/80 p-3.5 text-xs text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200"> */}
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="leading-snug text-[13px]">
                You already have a <strong>{card.title}</strong> journey (<strong>Executive</strong>{" "}
                plan).
              </span>
            </div>
            {/* <Link
              href="/my-journeys"
              className="inline-flex items-center gap-1 font-semibold text-[#0d7377] hover:underline dark:text-teal-300"
            >
              Go to My Journeys →
            </Link> */}
            {/* </div> */}
          </>
        ) : isLive && card.href ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Learn More */}
            <Link
              href={card.href}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--rahvana-primary)] px-5 py-3 text-xs font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rahvana-primary-dark)]"
            >
              Explore Journey
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Start Journey — Explore page only */}
            {showStartJourney && (
              <Link
                href={
                  card.code === "IR-5" ? "/visa-category/ir5-journey" : "/visa-category/ir1-journey"
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--rahvana-primary)] bg-white px-5 py-3 text-xs font-semibold text-[var(--rahvana-primary)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rahvana-primary-pale)]"
              >
                Start Journey
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {/* Select Journey */}
            {onSelect && (
              <button
                type="button"
                onClick={onSelect}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--rv-line)] bg-white px-5 py-3 text-xs font-semibold text-[var(--rv-navy)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rv-sky)]"
              >
                Select Journey
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
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

        <p className="mt-6 text-xs font-bold tracking-[0.22em] text-[var(--rahvana-primary)] uppercase">
          COMING SOON
        </p>

        <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#667085]">
          More Journeys Coming Soon
        </h3>

        <p className="mt-3 max-w-xs text-sm leading-7 text-[#A3ACB8]">
          More immigration pathways are on the way. Stay tuned.
        </p>
      </div>
    </motion.article>
  );
}
