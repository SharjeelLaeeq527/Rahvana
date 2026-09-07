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
import ArticleSocialShare from "@/components/blog/ArticleSocialShare";
import StickyShareSidebar from "@/components/blog/StickyShareSidebar";
import BlogCommentsSection from "@/components/blog/comments/BlogCommentsSection";
import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  ChevronRight,
  HelpCircle,
  BookOpen,
  List,
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

  const title = article.title ? `${article.title} · Rahvana` : "Rahvana Immigration Guide";
  const description =
    article.description || article.bluf || "Expert U.S. immigration guide by Rahvana.";
  const images = article.heroImage
    ? [article.heroImage]
    : ["https://rahvana.com/opengraph-image.png"];
  const authors = article.author?.name
    ? [article.author.name]
    : ["Rahvana Immigration Research Team"];

  return {
    title,
    description,
    ...(article.keywords ? { keywords: article.keywords } : {}),
    openGraph: {
      title: article.title || "Rahvana Immigration Guide",
      description,
      type: "article",
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      authors,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title || "Rahvana Immigration Guide",
      description,
      images,
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) return notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";
  const articleUrl = `${siteUrl}/blog/${article.slug}`;

  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blog` },
    ...(article.category ? [{ name: article.category, url: `${siteUrl}/blog` }] : []),
    ...(article.title ? [{ name: article.title, url: articleUrl }] : []),
  ];

  const hasToc = Boolean(
    article.showTableOfContents !== false &&
    article.tableOfContents &&
    article.tableOfContents.length > 0
  );

  const sidebarCtaConfig =
    article.sidebarCta === null
      ? null
      : article.sidebarCta || {
          title: "Need Direct Assistance?",
          description: "Book a strategy consultation with our U.S. visa case managers.",
          buttonText: "Book Consultation →",
          buttonHref: "/book-consultation",
        };

  const hasSidebar = hasToc || Boolean(sidebarCtaConfig);

  return (
    <>
      {/* ── JSON-LD Schemas for AEO / GEO AI Search Crawlers ── */}
      <ArticleSchema
        headline={article.title || "Rahvana Immigration Guide"}
        description={article.description || article.bluf || ""}
        url={articleUrl}
        datePublished={article.publishedAt}
        dateModified={article.updatedAt}
        authorName={article.author?.name}
        image={article.heroImage ? [article.heroImage] : undefined}
      />
      {article.faqs && article.faqs.length > 0 && article.showFaqs !== false && (
        <FAQPageSchema faqs={article.faqs} />
      )}
      <BreadcrumbSchema items={breadcrumbs} />

      <article className="bg-background text-foreground min-h-screen pt-[55px] pb-12">
        {/* ── Article Header & Hero ── */}
        <header className="border-border/60 via-background to-background border-b py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-xs">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              {article.category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="max-w-[200px] truncate font-medium text-teal-400 sm:max-w-xs">
                    {article.category}
                  </span>
                </>
              )}
            </nav>

            {/* Category Pill & Read Time */}
            {(article.category || article.readTime || article.updatedAt) && (
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
                {article.category && (
                  <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 font-semibold text-teal-400">
                    {article.category}
                  </span>
                )}
                {article.readTime && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </span>
                )}
                {article.updatedAt && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Updated {article.updatedAt}
                  </span>
                )}
              </div>
            )}

            {/* Article Main H1 Title */}
            {article.title && (
              <h1 className="text-foreground text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {article.title}
              </h1>
            )}

            {/* Author Badge */}
            {(article.author?.name || article.author?.title) && (
              <div className="border-border/40 mt-6 flex items-center gap-3 border-t pt-4">
                {article.author.avatar ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full shadow-md">
                    <Image
                      src={article.author.avatar}
                      alt={article.author.name || "Author"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white shadow-md">
                    {article.author.name ? article.author.name.charAt(0) : "R"}
                  </div>
                )}
                <div>
                  {article.author.name && (
                    <p className="text-foreground text-sm font-semibold">{article.author.name}</p>
                  )}
                  {article.author.title && (
                    <p className="text-muted-foreground text-xs">{article.author.title}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Main Body & Sidebar Layout ── */}
        <div className="relative mx-auto max-w-full px-5 py-10 sm:px-8 sm:py-12 lg:max-w-[640px] xl:max-w-4xl">
          {/* Table of Contents Sticky Left Sidebar */}
          {hasSidebar && (
            <aside className="z-20 mb-10 shrink-0 lg:absolute lg:top-12 lg:right-full lg:bottom-12 lg:mb-0 lg:w-48 lg:translate-x-3 xl:w-60 xl:translate-x-6">
              <div className="border-border/70 bg-card/40 sticky top-28 rounded-2xl border p-4 shadow-sm backdrop-blur-md sm:top-28 sm:p-5">
                {hasToc && article.tableOfContents && (
                  <>
                    <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                      <List className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
                      <span>Table of Content</span>
                    </div>
                    <nav className="border-border/60 space-y-1.5 border-l pl-2.5 text-[12px] leading-snug">
                      {article.tableOfContents.map((toc, tIdx) => (
                        <a
                          key={toc.id || `toc-${tIdx}`}
                          href={toc.id ? `#${toc.id}` : "#"}
                          className="text-muted-foreground block py-1 transition-colors hover:font-medium hover:text-teal-600 dark:hover:text-teal-400"
                        >
                          {toc.title}
                        </a>
                      ))}
                    </nav>
                  </>
                )}

                {sidebarCtaConfig && (
                  <div className={cn("border-border/40", hasToc ? "mt-5 border-t pt-3.5" : "")}>
                    {sidebarCtaConfig.badge && (
                      <span className="mb-1 inline-block rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-400">
                        {sidebarCtaConfig.badge}
                      </span>
                    )}
                    {sidebarCtaConfig.title && (
                      <p className="text-foreground mb-1 text-[11px] font-semibold">
                        {sidebarCtaConfig.title}
                      </p>
                    )}
                    {sidebarCtaConfig.description && (
                      <p className="text-muted-foreground mb-3 text-[11px] leading-tight">
                        {sidebarCtaConfig.description}
                      </p>
                    )}
                    {sidebarCtaConfig.buttonText && (
                      <Link
                        href={sidebarCtaConfig.buttonHref || "/book-consultation"}
                        className="block w-full rounded-xl bg-teal-600 px-3.5 py-2 text-center text-[11px] font-semibold text-white shadow-sm transition hover:bg-teal-500"
                      >
                        {sidebarCtaConfig.buttonText}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Sticky Right Sidebar - Social Share Icons */}
          {article.showSocialShare !== false && (
            <aside className="z-20 hidden shrink-0 lg:absolute lg:top-12 lg:bottom-12 lg:left-full lg:ml-3 lg:block lg:w-12 xl:ml-6 xl:w-14">
              <div className="sticky top-28">
                <StickyShareSidebar
                  title={article.title}
                  slug={article.slug}
                  description={article.description}
                />
              </div>
            </aside>
          )}

          {/* Main Article Content */}
          <main className="w-full space-y-10 lg:ml-3 xl:ml-5">
            {/* ⚡ BLUF (Bottom Line Up Front) Answer Box */}
            {article.bluf && article.bluf.trim() && (
              <section className="rounded-3xl border border-teal-500/30 bg-slate-900/95 p-6 text-slate-100 shadow-lg sm:p-8">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-teal-400 uppercase">
                  <BookOpen className="h-4 w-4" />
                  <span>Bottom Line Up Front (BLUF Summary)</span>
                </div>
                <p className="text-base leading-relaxed font-medium text-slate-200">
                  {article.bluf}
                </p>
              </section>
            )}

            {/* Dynamic Content Sections */}
            {article.sections &&
              article.sections.map((section, idx) => (
                <section
                  key={section.id || `sec-${idx}`}
                  id={section.id}
                  className="scroll-mt-28 space-y-4"
                >
                  {section.h2 && (
                    <h2 className="text-foreground border-border/50 border-b pb-2 text-2xl font-bold tracking-tight">
                      {section.h2}
                    </h2>
                  )}

                  {section.h3 && (
                    <h3 className="text-foreground text-xl font-bold tracking-tight">
                      {section.h3}
                    </h3>
                  )}

                  {/* Optional Section Image */}
                  {section.image?.url && (
                    <figure className="my-6 space-y-2">
                      <div className="border-border/70 relative h-64 w-full overflow-hidden rounded-2xl border sm:h-80">
                        <Image
                          src={section.image.url}
                          alt={section.image.alt || section.h2 || "Section image"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {section.image.caption && (
                        <figcaption className="text-muted-foreground text-center text-xs">
                          {section.image.caption}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  {section.paragraphs &&
                    section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="text-muted-foreground text-base leading-relaxed">
                        {p}
                      </p>
                    ))}

                  {/* Optional Callout Box */}
                  {section.callout && (
                    <div
                      className={cn(
                        "my-6 rounded-2xl border bg-slate-900/95 p-5 text-slate-100 shadow-md",
                        section.callout.type === "warning"
                          ? "border-amber-500/40"
                          : section.callout.type === "tip"
                            ? "border-emerald-500/40"
                            : "border-teal-500/40"
                      )}
                    >
                      <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
                        {section.callout.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                        ) : section.callout.type === "tip" ? (
                          <Lightbulb className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Info className="h-4 w-4 shrink-0 text-teal-400" />
                        )}
                        {section.callout.title && (
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
                        )}
                      </div>
                      {section.callout.text && (
                        <p className="text-xs leading-relaxed text-slate-200 sm:text-sm">
                          {section.callout.text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Optional Comparison Table */}
                  {section.table &&
                    section.table.headers &&
                    section.table.headers.length > 0 &&
                    section.table.rows &&
                    section.table.rows.length > 0 && (
                      <div className="border-border my-6 overflow-x-auto rounded-2xl border shadow-sm">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-muted text-foreground border-border border-b font-semibold">
                            <tr>
                              {section.table.headers.map((h, hIdx) => (
                                <th key={hIdx} className="p-3.5 sm:p-4">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-border/60 bg-card/40 divide-y">
                            {section.table.rows.map((r, rIdx) => (
                              <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                                {r.map((c, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="text-muted-foreground p-3.5 font-medium sm:p-4"
                                  >
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
                  {section.bulletList && section.bulletList.length > 0 && (
                    <ul className="text-muted-foreground my-4 space-y-2 text-sm">
                      {section.bulletList.map((item, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Optional Numbered List */}
                  {section.numberedList && section.numberedList.length > 0 && (
                    <ol className="text-muted-foreground my-4 list-none space-y-2.5 text-sm">
                      {section.numberedList.map((item, nIdx) => (
                        <li key={nIdx} className="flex items-start gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400">
                            {nIdx + 1}
                          </span>
                          <span className="pt-0.5">{item}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Section CTA or Mid-Article CTA */}
                  {section.cta ? (
                    <ToolCTA
                      badge={section.cta.badge}
                      headline={section.cta.headline}
                      description={section.cta.description}
                      buttonText={section.cta.buttonText}
                      buttonHref={section.cta.buttonHref}
                      variant="card"
                    />
                  ) : (
                    idx === 2 &&
                    article.midArticleCta && (
                      <ToolCTA
                        badge={article.midArticleCta.badge}
                        headline={article.midArticleCta.headline}
                        description={article.midArticleCta.description}
                        buttonText={article.midArticleCta.buttonText}
                        buttonHref={article.midArticleCta.buttonHref}
                        variant="card"
                      />
                    )
                  )}
                </section>
              ))}

            {/* ── FAQ Section (GEO & Schema Enabled) ── */}
            {article.faqs && article.faqs.length > 0 && article.showFaqs !== false && (
              <section id="faq-section" className="border-border mt-16 scroll-mt-28 border-t pt-8">
                <div className="mb-6 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-teal-400" />
                  <h2 className="text-foreground text-2xl font-bold">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                  {article.faqs.map((faq, fIdx) => {
                    if (!faq.question || !faq.answer) return null;
                    return (
                      <details
                        key={fIdx}
                        className="group border-border bg-card/50 open:bg-card rounded-2xl border p-5 backdrop-blur-sm transition-all duration-200 open:border-teal-500/50"
                      >
                        <summary className="text-foreground flex cursor-pointer list-none items-center justify-between text-base font-semibold group-open:text-teal-400">
                          <span>{faq.question}</span>
                          <span className="ml-4 text-xl font-light text-teal-400 transition-transform group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <p className="text-muted-foreground border-border/40 mt-3 border-t pt-3 text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </details>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Social Share Section ── */}
            {article.showSocialShare !== false && (
              <ArticleSocialShare
                title={article.title}
                slug={article.slug}
                description={article.description}
              />
            )}

            {/* ── Community Comments & Discussion Section ── */}
            <BlogCommentsSection slug={article.slug} />

            {/* ── Bottom Strategic Conversion CTA Banner ── */}
            {article.cta && (article.cta.headline || article.cta.buttonText) && (
              <ToolCTA
                badge={article.cta.badge || "Simplify Your Visa Journey"}
                headline={article.cta.headline}
                description={article.cta.description}
                buttonText={article.cta.buttonText}
                buttonHref={article.cta.buttonHref}
                className="mt-10 mb-0"
              />
            )}
          </main>
        </div>
      </article>
    </>
  );
}
