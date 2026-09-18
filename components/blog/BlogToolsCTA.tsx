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
    <div className="border-primary/20 bg-primary/5 dark:border-primary/20 dark:bg-card/40 relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Left Column: Monogram & Copy & CTA */}
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center lg:col-span-6">
          <div className="space-y-3">
            <h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              Your journey is unique.{" "}
              <span className="block">Our tools are built to support it.</span>
            </h3>

            <div>
              <Link
                href="/resources?tab=toolbox"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-sm transition sm:text-sm"
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
                <div className="dark:border-border/60 dark:bg-card border-primary/20 text-primary group-hover:border-primary flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-sm transition-all group-hover:shadow-md sm:h-16 sm:w-16">
                  <IconComponent className="h-6 w-6 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-center">
                  <p className="text-foreground group-hover:text-primary line-clamp-2 text-xs leading-tight font-semibold">
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
