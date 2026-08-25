import React from "react";
import { notFound } from "next";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getArticleBySlug, ARTICLES } from "@/data/articles";
import ArticleSchema from "@/components/seo/ArticleSchema";
import FAQPageSchema from "@/components/seo/FAQPageSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ToolCTA from "@/components/blog/ToolCTA";
import {
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowLeft,
  Share2,
  Bookmark,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found · Rahvana Blog" };

  return {
    title: `${article.title} · Rahvana`,
    description: article.description,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      images: [article.heroImage],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [article.heroImage],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) return notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";
  const articleUrl = `${siteUrl}/blog/${article.slug}`;

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blog` },
    { name: article.title, url: articleUrl },
  ];

  return (
    <>
      {/* ── JSON-LD Schemas for AEO / GEO AI Search Crawlers ── */}
      <ArticleSchema
        headline={article.title}
        description={article.description}
        url={articleUrl}
        datePublished={article.publishedAt}
        dateModified={article.updatedAt}
        authorName={article.author.name}
        image={[article.heroImage]}
      />
      <FAQPageSchema faqs={article.faqs} />
      <BreadcrumbSchema items={breadcrumbs} />

      <article className="min-h-screen bg-background text-foreground pt-24 pb-24">
        {/* ── Article Header & Hero ── */}
        <header className="border-b border-border/60 bg-gradient-to-b from-teal-950/20 via-background to-background py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-teal-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {article.category}
              </span>
            </nav>

            {/* Category Pill & Read Time */}
            <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
              <span className="rounded-full bg-teal-500/10 px-3 py-1 font-semibold text-teal-400 border border-teal-500/20">
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {article.readTime}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Updated {article.updatedAt}
              </span>
            </div>

            {/* Article Main H1 Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
              {article.title}
            </h1>

            {/* Author Badge */}
            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 font-bold text-white text-sm shadow-md">
                R
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{article.author.name}</p>
                <p className="text-xs text-muted-foreground">{article.author.title}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Body & Sidebar Layout ── */}
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Table of Contents Sticky Sidebar */}
            <aside className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-28 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-teal-400" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-2 text-xs">
                  {article.tableOfContents.map((toc) => (
                    <a
                      key={toc.id}
                      href={`#${toc.id}`}
                      className="block text-muted-foreground hover:text-teal-400 hover:translate-x-1 transition-all py-1 border-l-2 border-transparent hover:border-teal-400 pl-2"
                    >
                      {toc.title}
                    </a>
                  ))}
                </nav>

                <div className="mt-8 border-t border-border pt-6">
                  <p className="text-xs font-semibold text-foreground mb-2">Need Direct Assistance?</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Book a strategy consultation with our U.S. visa case managers.
                  </p>
                  <Link
                    href="/book-consultation"
                    className="block w-full text-center rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-500 shadow-sm"
                  >
                    Book Consultation →
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Article Content */}
            <main className="lg:col-span-8 order-1 lg:order-2 space-y-10">
              {/* ⚡ BLUF (Bottom Line Up Front) Answer Box - Vital for AEO/GEO AI engine extraction */}
              <section className="rounded-3xl border border-teal-500/30 bg-slate-900/95 p-6 shadow-lg sm:p-8 text-slate-100">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Bottom Line Up Front (BLUF Summary)</span>
                </div>
                <p className="text-base font-medium leading-relaxed text-slate-200">
                  {article.bluf}
                </p>
              </section>

              {/* Dynamic Content Sections */}
              {article.sections.map((section, idx) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2">
                    {section.h2}
                  </h2>

                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-base leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}

                  {/* Optional Callout Box */}
                  {section.callout && (
                    <div
                      className={`my-6 rounded-2xl p-5 border shadow-md bg-slate-900/95 text-slate-100 ${
                        section.callout.type === "warning"
                          ? "border-amber-500/40"
                          : section.callout.type === "tip"
                          ? "border-emerald-500/40"
                          : "border-teal-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                        {section.callout.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : section.callout.type === "tip" ? (
                          <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Info className="h-4 w-4 text-teal-400 shrink-0" />
                        )}
                        <span
                          className={
                            section.callout.type === "warning"
                              ? "text-amber-400"
                              : section.callout.type === "tip"
                              ? "text-emerald-400"
                              : "text-teal-400"
                          }
                        >
                          {section.callout.title}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                        {section.callout.text}
                      </p>
                    </div>
                  )}

                  {/* Optional Comparison Table */}
                  {section.table && (
                    <div className="my-6 overflow-x-auto rounded-2xl border border-border shadow-sm">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-muted text-foreground font-semibold border-b border-border">
                          <tr>
                            {section.table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-3.5 sm:p-4">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 bg-card/40">
                          {section.table.rows.map((r, rIdx) => (
                            <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                              {r.map((c, cIdx) => (
                                <td key={cIdx} className="p-3.5 sm:p-4 text-muted-foreground font-medium">
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Optional Bullet List */}
                  {section.bulletList && (
                    <ul className="my-4 space-y-2 text-sm text-muted-foreground">
                      {section.bulletList.map((item, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Mid-Article CTA Trigger after Section 3 */}
                  {idx === 2 && (
                    <ToolCTA
                      badge="Free Rahvana Automation"
                      headline="Generate Your Custom NVC Document Vault Checklist"
                      description="Auto-check your scanned Nikah Nama, NADRA MRC, and Police Certificates for exact NVC formatting rules before uploading to CEAC."
                      buttonText="Access Free Document Vault →"
                      buttonHref="/pricing?mode=tools"
                      variant="card"
                    />
                  )}
                </section>
              ))}

              {/* ── FAQ Section (GEO & Schema Enabled) ── */}
              <section id="faq-section" className="scroll-mt-28 mt-16 pt-8 border-t border-border">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-6 w-6 text-teal-400" />
                  <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                  {article.faqs.map((faq, fIdx) => (
                    <details
                      key={fIdx}
                      className="group rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-all duration-200 open:border-teal-500/50 open:bg-card"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-foreground group-open:text-teal-400">
                        <span>{faq.question}</span>
                        <span className="ml-4 text-xl font-light text-teal-400 transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>

              {/* ── Bottom Strategic Conversion CTA Banner ── */}
              <ToolCTA
                badge="Simplify Your Spouse Visa Today"
                headline={article.cta.headline}
                description={article.cta.description}
                buttonText={article.cta.buttonText}
                buttonHref={article.cta.buttonHref}
              />
            </main>
          </div>
        </div>
      </article>
    </>
  );
}
