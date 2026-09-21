"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Milestone, Route, UserRoundCheck } from "lucide-react";

const SUPPORT_ITEMS = [
  {
    title: "Follow One Clear Roadmap",
    body: "Know exactly what comes next without guessing forms, timing, or immigration requirements.",
    icon: Route,
  },
  {
    title: "Build Your Case as You Go",
    body: "Keep documents, supporting evidence, and tasks organized by the stage where they are actually needed.",
    icon: ClipboardCheck,
  },
  {
    title: "Stay Prepared at Every Milestone",
    body: "Receive guidance throughout USCIS, NVC, interviews, and final approval so you're always prepared for the next step.",
    icon: Milestone,
  },
];

export function ExplorerSupportSection() {
  return (
    <section className="border-t border-[var(--rv-line)] bg-white/70 px-4 py-16 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--rahvana-primary)]">
            Why follow a Rahvana journey
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[var(--rv-navy)] sm:text-4xl">
            Guided preparation from the first form to final approval.
          </h3>
          <p className="mt-4 text-sm leading-7 text-[var(--rv-soft)] sm:text-base">
            Rahvana is built around the full immigration journey, not scattered articles. Each route
            connects process steps, document preparation, and milestone readiness in one place.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {/* <Link
              href="/visa-eligibility"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--rahvana-primary)] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--rahvana-primary-dark)]"
            >
              Check eligibility
              <ArrowRight className="h-4 w-4" />
            </Link> */}
            <Link
              href="/book-consultation"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--rv-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--rv-navy)] transition-colors hover:bg-[var(--rahvana-primary-pale)]"
            >
              <UserRoundCheck className="h-4 w-4" />
              Talk to an expert
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {SUPPORT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[1.15rem] border border-[var(--rv-line)] bg-white p-5 shadow-[0_18px_42px_-34px_rgba(12,27,51,0.42)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--rahvana-primary-pale)] text-[var(--rahvana-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[var(--rv-navy)]">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-7 text-[var(--rv-soft)]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
