import React from "react";
import Link from "next/link";
import { ArrowRight, Mic, Wand2, Calculator, LifeBuoy, Sparkles } from "lucide-react";

const TOOLS = [
  {
    title: "221(g) Action Planner",
    sub: "Action steps",
    href: "/221g-action-planner",
    icon: LifeBuoy,
  },
  {
    title: "Sponsorship Calculator",
    sub: "I-864 check",
    href: "/affidavit-support-calculator",
    icon: Calculator,
  },
  {
    title: "Interview Prep",
    sub: "Mock Q&A",
    href: "/interview-prep",
    icon: Mic,
  },
  {
    title: "Autoform Filler",
    sub: "Instant PDF",
    href: "/visa-forms",
    icon: Wand2,
  },
];

export default function BlogToolsCTA() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#d2ebe5] bg-[#f0f8f6] p-6 shadow-sm sm:p-8 lg:p-10 dark:border-teal-950/40 dark:bg-[#071d1b]">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Left Column: Monogram & Copy & CTA */}
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center lg:col-span-6">
          {/* <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-teal-600/20 bg-white p-3 shadow-sm dark:border-teal-400/20 dark:bg-card">
            <Sparkles className="h-8 w-8 text-teal-700 dark:text-teal-400" />
          </div> */}

          <div className="space-y-3">
            <h3 className="text-xl font-bold tracking-tight text-[#0f2e2b] sm:text-2xl lg:text-3xl dark:text-slate-100">
              Your journey is unique.{" "}
              <span className="block">Our tools are built to support it.</span>
            </h3>

            <div>
              <Link
                href="/resources?tab=toolbox"
                className="inline-flex items-center gap-2 rounded-full bg-[#0d4f49] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:text-sm"
              >
                <span>Explore Rahvana Tools</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: 4 Tools Horizontal Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-6">
          {TOOLS.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group flex flex-col items-center gap-2 rounded-2xl p-2 transition-transform hover:-translate-y-1"
              >
                <div className="dark:border-border/60 dark:bg-card flex h-14 w-14 items-center justify-center rounded-2xl border border-[#cde4df] bg-white text-teal-700 shadow-sm transition-all group-hover:border-teal-500 group-hover:shadow-md sm:h-16 sm:w-16 dark:text-teal-400">
                  <IconComponent className="h-6 w-6 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-center">
                  <p className="text-foreground line-clamp-2 text-xs leading-tight font-semibold group-hover:text-teal-700 dark:group-hover:text-teal-400">
                    {tool.title}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">{tool.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
