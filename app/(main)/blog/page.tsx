import React from "react";
import Metadata from "next";
import Link from "next/link";
import Image from "next/image";
import { ARTICLES } from "@/data/articles";
import ToolCTA from "@/components/blog/ToolCTA";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  Search,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

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
  const featuredArticle = ARTICLES[0];
  const otherArticles = ARTICLES.slice(1);

  return (
    <div className="bg-background text-foreground min-h-screen pt-24 pb-20">
      {/* ── Hero Banner ── */}
      <section className="border-border/50 via-background to-background relative overflow-hidden border-b bg-gradient-to-b from-teal-950/20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-teal-400 uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>SEO, AEO & Consular Intelligence Hub</span>
          </div> */}
          <h1 className="text-foreground mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            U.S. Spouse Visa {/* & Family Visa  */}
            <span className="text-teal-500">Guides for Pakistan</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg sm:text-xl">
            Authoritative, step-by-step consular guidance, NVC document checklists, and interview
            preparation written for Pakistani beneficiaries and U.S. sponsors.
          </p>

          {/* Category Pill Filters */}
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <span className="cursor-pointer rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm">
              All Articles
            </span>
            <span className="border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition hover:border-teal-500">
              Spouse Visa (IR-1/CR-1)
            </span>
            {/* <span className="border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition hover:border-teal-500">
              Parent Visa (IR-5)
            </span>
            <span className="border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition hover:border-teal-500">
              NVC & Civil Documents
            </span>
            <span className="border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition hover:border-teal-500">
              Consular Interview & 221(g)
            </span> */}
          </div>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
        {/* Featured Article Card */}
        {featuredArticle && (
          <section className="mb-16">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-foreground text-xl font-bold tracking-tight">
                Featured Pillar Guide
              </h2>
            </div>

            <div className="group border-border bg-card relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-300 hover:border-teal-500/50 hover:shadow-2xl sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 font-semibold text-teal-400">
                      {featuredArticle.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {featuredArticle.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Updated {featuredArticle.updatedAt}
                    </span>
                  </div>

                  <h3 className="text-foreground mt-4 text-2xl font-bold tracking-tight transition-colors group-hover:text-teal-400 sm:text-3xl lg:text-4xl">
                    <Link href={`/blog/${featuredArticle.slug}`}>{featuredArticle.title}</Link>
                  </h3>

                  {/* AEO / BLUF Summary Box */}
                  <div className="mt-5 rounded-2xl border border-teal-500/30 bg-slate-900/95 p-4 text-slate-100 shadow-md sm:p-5">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-teal-400">
                       Quick Takeaway (BLUF)
                    </span>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-200">
                      {featuredArticle.bluf}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                        R
                      </div>
                      <div>
                        <p className="text-foreground text-xs font-semibold">
                          {featuredArticle.author.name}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {featuredArticle.author.title}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${featuredArticle.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-500"
                    >
                      <span>Read Full Guide</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="border-border bg-muted relative h-64 w-full overflow-hidden rounded-2xl border sm:h-80">
                    <Image
                      src={featuredArticle.heroImage}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Conversion Tool Banner CTA ── */}
        <ToolCTA
          badge="Interactive Rahvana Tools & Services"
          headline="Track Your Immigrant Visa Journey & Estimate NVC Timelines"
          description="Check your spouse visa case strength, generate customized civil document checklists, and preview interview scenarios tailored for US Embassy Islamabad."
          buttonText="Explore tools & services"
          buttonHref="/resources?tab=toolbox"
        />

        {/* ── Article Grid Section ── */}
        {otherArticles.length > 0 && (
          <section className="mt-16">
            <h2 className="text-foreground mb-8 text-2xl font-bold tracking-tight">
              All Immigrant Visa Articles
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {otherArticles.map((art) => (
                <div
                  key={art.id}
                  className="group border-border bg-card flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition hover:border-teal-500/40 hover:shadow-md"
                >
                  <div>
                    <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
                      <span className="bg-muted text-foreground rounded-md px-2.5 py-1 font-medium">
                        {art.category}
                      </span>
                      <span>{art.readTime}</span>
                    </div>

                    <h3 className="text-foreground line-clamp-2 text-lg font-bold transition-colors group-hover:text-teal-400">
                      <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                    </h3>

                    <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed">
                      {art.description}
                    </p>
                  </div>

                  <div className="border-border mt-6 flex items-center justify-between border-t pt-4 text-xs">
                    <span className="text-muted-foreground">{art.updatedAt}</span>
                    <Link
                      href={`/blog/${art.slug}`}
                      className="flex items-center gap-1 font-semibold text-teal-400 transition-transform group-hover:translate-x-0.5"
                    >
                      Read Article →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
