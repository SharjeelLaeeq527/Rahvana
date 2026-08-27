import React from "react";
import Image from "next/image";
import { ARTICLES } from "@/data/articles";
import ToolCTA from "@/components/blog/ToolCTA";
import BlogSearchSection from "@/components/blog/BlogSearchSection";
import { BookOpen, CheckCircle2, UserCheck, Clock, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Rahvana Immigration Blog & Guides | U.S. Visa Research & Consular Insights",
  description:
    "Expert U.S. immigration guides for IR-1, CR-1, and IR-5 visas in Pakistan. Complete NVC document checklists, NADRA Nikah Nama rules, and US Embassy Islamabad interview guides.",
  openGraph: {
    title: "Rahvana Immigration Blog & Guides",
    description:
      "Actionable U.S. spouse and parent visa guides optimized for Pakistani applicants and U.S. Citizen sponsors.",
    images: ["/assets/images/about-card-1.png"],
  },
};

export default function BlogIndexPage() {
  return (
    <div className="bg-background text-foreground min-h-screen pt-[55px] pb-20">
      {/* ── Split Two-Column Hero Banner ── */}
      <section className="border-border/50 via-background to-background relative overflow-hidden border-b bg-gradient-to-b from-teal-950/20 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Text Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
                <BookOpen className="h-3.5 w-3.5" />
                <span>RAHVANA KNOWLEDGE CENTER</span>
              </div>
              <h1 className="text-foreground mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-[1.15]">
                U.S. Spouse Visa Guides{" "}
                <span className="text-teal-500 dark:text-teal-400 block sm:inline">
                  for Pakistani Families
                </span>
              </h1>
              <p className="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg lg:text-xl leading-relaxed">
                Authoritative, step-by-step consular guidance, NVC document checklists, and interview
                preparation written for Pakistani beneficiaries and U.S. sponsors.
              </p>
            </div>

            {/* Right Column: Visual Hero Graphic */}
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-md lg:max-w-none">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 blur-xl opacity-70"></div>
                <div className="relative rounded-2xl border border-border/40 bg-card/50 p-2 sm:p-4 backdrop-blur-sm shadow-xl">
                  <Image
                    src="/assets/images/blog-hero-image.png"
                    alt="Rahvana Knowledge Center - U.S. Spouse Visa Guides"
                    width={600}
                    height={450}
                    className="h-auto w-full object-contain max-h-[380px]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Cards inside Hero Section */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-8 border-t border-border/30">
            <div className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
                <CheckCircle2 className="h-5.5 w-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Expert Written</h4>
                <p className="text-xs text-muted-foreground">By immigration specialists</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
                <UserCheck className="h-5.5 w-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Pakistan-Focused</h4>
                <p className="text-xs text-muted-foreground">Specifically for applicants in Pakistan</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
                <Clock className="h-5.5 w-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Step-by-Step</h4>
                <p className="text-xs text-muted-foreground">Clear guidance for every step</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Trusted Content</h4>
                <p className="text-xs text-muted-foreground">Reliable & up-to-date guidance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <div className="py-8">
        {/* Search, Popular Searches, Feature Badges, Categories & Articles */}
        <BlogSearchSection articles={ARTICLES} />

        {/* Conversion Tool Banner CTA */}
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 mt-12">
          <ToolCTA
            badge="Interactive Rahvana Tools & Services"
            headline="Track Your Immigrant Visa Journey & Estimate NVC Timelines"
            description="Check your spouse visa case strength, generate customized civil document checklists, and preview interview scenarios tailored for US Embassy Islamabad."
            buttonText="Explore tools & services"
            buttonHref="/resources?tab=toolbox"
          />
        </div>
      </div>
    </div>
  );
}

