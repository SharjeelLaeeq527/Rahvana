"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Article } from "@/data/articles";
import {
  Search,
  Clock,
  Calendar,
  ArrowRight,
  X,
  LayoutGrid,
  List,
  LayoutList,
  AlignLeft,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BlogSearchSectionProps {
  articles: Article[];
}

const CATEGORY_TABS = [
  { id: "All", label: "All" },
  { id: "IR-1 / CR-1", label: "IR-1 / CR-1" },
  // { id: "IR-5", label: "IR-5" },
  { id: "NVC", label: "NVC" },
  { id: "Documents", label: "Documents" },
  { id: "Interview", label: "Interview" },
  { id: "Forms & Fees", label: "Forms & Fees" },
] as const;

type ViewMode = "detailed" | "grid" | "list" | "minimal";

const VIEW_OPTIONS: {
  id: ViewMode;
  label: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "list",
    label: "Compact List",
    badge: "High Density",
    description:
      "Horizontal layout rows with side thumbnail images for quick, streamlined article scanning.",
    icon: List,
  },
  {
    id: "detailed",
    label: "Featured & Grid",
    badge: "Hero + Cards",
    description:
      "Displays a prominent featured guide at the top followed by a responsive card grid below.",
    icon: LayoutList,
  },
  {
    id: "grid",
    label: "Visual Cards",
    badge: "Visual Grid",
    description:
      "Equal-sized image cards with rich metadata tags, perfect for visual browsing of articles.",
    icon: LayoutGrid,
  },
  {
    id: "minimal",
    label: "Minimal Text",
    badge: "Fast Reading",
    description:
      "Distraction-free text layout focusing purely on headlines, category badges, and read times.",
    icon: AlignLeft,
  },
];

export default function BlogSearchSection({ articles }: BlogSearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [pendingViewMode, setPendingViewMode] = useState<ViewMode>("list");
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const handleOpenLayoutModal = () => {
    setPendingViewMode(viewMode);
    setIsLayoutModalOpen(true);
  };

  const currentViewOption = VIEW_OPTIONS.find((opt) => opt.id === viewMode) || VIEW_OPTIONS[0];
  const CurrentIcon = currentViewOption.icon;

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Category filter
      if (selectedCategory !== "All") {
        const catLower = (article.category || "").toLowerCase();
        const titleLower = (article.title || "").toLowerCase();
        const keywordsLower = (article.keywords || []).map((k) => k.toLowerCase());

        if (selectedCategory === "IR-1 / CR-1") {
          const match =
            catLower.includes("spouse") ||
            titleLower.includes("cr-1") ||
            titleLower.includes("ir-1");
          if (!match) return false;
        } else if (selectedCategory === "IR-5") {
          const match = catLower.includes("parent") || titleLower.includes("ir-5");
          if (!match) return false;
        } else if (selectedCategory === "NVC") {
          const match =
            catLower.includes("nvc") ||
            keywordsLower.some((k) => k.includes("nvc")) ||
            titleLower.includes("nvc");
          if (!match) return false;
        } else if (selectedCategory === "Documents") {
          const match =
            catLower.includes("document") ||
            keywordsLower.some((k) => k.includes("document")) ||
            titleLower.includes("document");
          if (!match) return false;
        } else if (selectedCategory === "Interview") {
          const match =
            catLower.includes("interview") ||
            keywordsLower.some((k) => k.includes("interview")) ||
            titleLower.includes("interview");
          if (!match) return false;
        } else if (selectedCategory === "Forms & Fees") {
          const match =
            keywordsLower.some(
              (k) =>
                k.includes("form") ||
                k.includes("fee") ||
                k.includes("i-130") ||
                k.includes("i-864") ||
                k.includes("ds-260")
            ) || titleLower.includes("fee");
          if (!match) return false;
        }
      }

      // Search query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (article.title || "").toLowerCase().includes(q);
      const descMatch = (article.description || "").toLowerCase().includes(q);
      const blufMatch = (article.bluf || "").toLowerCase().includes(q);
      const catMatch = (article.category || "").toLowerCase().includes(q);
      const keywordMatch = (article.keywords || []).some((k) => k.toLowerCase().includes(q));

      return titleMatch || descMatch || blufMatch || catMatch || keywordMatch;
    });
  }, [articles, searchQuery, selectedCategory]);

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const displayedArticles = filteredArticles.slice(0, visibleCount);
  const otherArticles = displayedArticles.length > 1 ? displayedArticles.slice(1) : [];
  const hasMoreArticles = filteredArticles.length > visibleCount;

  return (
    <div id="articles-section" className="space-y-12">
      {/* Hidden input hook to synchronize with BlogHero search form */}
      <input
        id="blog-search-input"
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* ── 1. Most Helpful Guide Right Now (Featured Card) ── */}
      {!searchQuery.trim() && featuredArticle && (
        <section className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <h2 className="text-foreground mb-4 text-xl font-bold tracking-tight sm:text-2xl">
            Most helpful guide right now
          </h2>
          <div className="group border-border/70 bg-card hover:border-primary/40 relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6 lg:p-7">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center lg:gap-8">
              {featuredArticle.heroImage && (
                <div className="md:col-span-5 lg:col-span-5">
                  <div className="bg-muted relative h-56 w-full overflow-hidden rounded-2xl sm:h-64">
                    <Image
                      src={featuredArticle.heroImage}
                      alt={
                        featuredArticle.heroImageAlt || featuredArticle.title || "Featured Article"
                      }
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "flex flex-col justify-between",
                  featuredArticle.heroImage
                    ? "md:col-span-7 lg:col-span-7"
                    : "md:col-span-12 lg:col-span-12"
                )}
              >
                <div>
                  {(featuredArticle.category ||
                    featuredArticle.readTime ||
                    featuredArticle.updatedAt) && (
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2.5 text-xs">
                      {featuredArticle.category && (
                        <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-0.5 font-semibold">
                          {featuredArticle.category}
                        </span>
                      )}
                      {featuredArticle.category &&
                        (featuredArticle.readTime || featuredArticle.updatedAt) && <span>•</span>}
                      {featuredArticle.readTime && <span>{featuredArticle.readTime}</span>}
                      {featuredArticle.readTime && featuredArticle.updatedAt && <span>•</span>}
                      {featuredArticle.updatedAt && (
                        <span>Updated {featuredArticle.updatedAt}</span>
                      )}
                    </div>
                  )}

                  <h3 className="text-foreground group-hover:text-primary mt-3 text-xl font-bold tracking-tight transition-colors sm:text-2xl">
                    <Link href={`/blog/${featuredArticle.slug}`}>
                      {featuredArticle.title || "Featured Guide"}
                    </Link>
                  </h3>

                  {featuredArticle.description && (
                    <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed sm:text-sm">
                      {featuredArticle.description}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <Link
                    href={`/blog/${featuredArticle.slug}`}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold shadow-sm transition sm:text-sm"
                  >
                    <span>Read Blog</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. All Guides Section with Right-Aligned Layout Option ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        {/* Heading & Layout Switcher Row */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
            All guides
          </h2>

          {/* Layout Option on the Right End Side */}
          <button
            onClick={handleOpenLayoutModal}
            className="border-border/80 bg-card text-foreground hover:bg-muted/40 hover:border-primary/50 hover:text-primary flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition"
            title="Change article display layout"
          >
            <SlidersHorizontal className="text-primary h-4 w-4" />
            <span className="hidden sm:inline">Layout:</span>
            <span className="border-primary/20 bg-primary/10 text-primary flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold">
              <CurrentIcon className="h-3.5 w-3.5" />
              <span>{currentViewOption.label}</span>
            </span>
          </button>
        </div>

        {/* Category Filter Pills Row */}
        <div className="border-border/40 mt-4 flex flex-wrap items-center gap-2 border-b pb-5">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setVisibleCount(5);
                }}
                className={`rounded-xl px-4 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "border-border/80 bg-card text-muted-foreground hover:text-foreground hover:border-primary/50 border"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Search Filter Banner */}
        {searchQuery && (
          <div className="border-primary/20 bg-primary/10 text-primary mt-4 flex items-center justify-between rounded-2xl border px-4 py-2 text-xs">
            <span>
              Showing results for: <strong>&ldquo;{searchQuery}&rdquo;</strong>
            </span>
            <button
              onClick={() => {
                setSearchQuery("");
                window.dispatchEvent(new CustomEvent("blog-search-cleared"));
              }}
              className="flex items-center gap-1 font-semibold hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear search</span>
            </button>
          </div>
        )}

        <div className="mt-6">
          {filteredArticles.length === 0 ? (
            <div className="border-border rounded-3xl border border-dashed p-12 text-center">
              <Search className="text-muted-foreground/50 mx-auto h-10 w-10" />
              <h3 className="text-foreground mt-4 text-lg font-bold">No articles found</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Try adjusting your search term or selecting another category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  window.dispatchEvent(new CustomEvent("blog-search-cleared"));
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div>
              {/* ── OPTION 1: DETAILED VIEW (Featured Pillar + Grid) ── */}
              {viewMode === "detailed" && (
                <div className="space-y-12">
                  {/* Featured Pillar Guide Banner */}
                  {!searchQuery.trim() && featuredArticle && (
                    <Link
                      href={`/blog/${featuredArticle.slug}`}
                      className="group border-border bg-card hover:border-primary/50 relative block overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-300 hover:shadow-2xl sm:p-8 lg:p-10"
                    >
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        <div
                          className={featuredArticle.heroImage ? "lg:col-span-7" : "lg:col-span-12"}
                        >
                          {(featuredArticle.category ||
                            featuredArticle.readTime ||
                            featuredArticle.updatedAt) && (
                            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                              {featuredArticle.category && (
                                <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 font-semibold">
                                  {featuredArticle.category}
                                </span>
                              )}
                              {featuredArticle.readTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {featuredArticle.readTime}
                                </span>
                              )}
                              {featuredArticle.updatedAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Updated {featuredArticle.updatedAt}
                                </span>
                              )}
                            </div>
                          )}

                          <h3 className="text-foreground group-hover:text-primary mt-4 text-2xl font-bold tracking-tight transition-colors sm:text-3xl lg:text-4xl">
                            {featuredArticle.title || "Featured Guide"}
                          </h3>

                          {/* AEO / BLUF Summary Box */}
                          {featuredArticle.bluf && (
                            <div className="border-primary/30 mt-5 rounded-2xl border bg-slate-900/95 p-4 text-slate-100 shadow-md sm:p-5">
                              <span className="text-primary mb-1.5 block text-xs font-bold tracking-wider uppercase">
                                Quick Takeaway (BLUF)
                              </span>
                              <p className="line-clamp-3 text-sm leading-relaxed text-slate-200">
                                {featuredArticle.bluf}
                              </p>
                            </div>
                          )}

                          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                            {featuredArticle.author?.name ? (
                              <div className="flex items-center gap-3">
                                <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
                                  {featuredArticle.author.name.charAt(0) || "R"}
                                </div>
                                <div>
                                  <p className="text-foreground text-xs font-semibold">
                                    {featuredArticle.author.name}
                                  </p>
                                  {featuredArticle.author.title && (
                                    <p className="text-muted-foreground text-[11px]">
                                      {featuredArticle.author.title}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div />
                            )}

                            <span className="bg-primary text-primary-foreground group-hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold transition">
                              <span>Read Blog</span>
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>

                        {featuredArticle.heroImage && (
                          <div className="lg:col-span-5">
                            <div className="border-border bg-muted relative h-64 w-full overflow-hidden rounded-2xl border sm:h-80">
                              <Image
                                src={featuredArticle.heroImage}
                                alt={
                                  featuredArticle.heroImageAlt ||
                                  featuredArticle.title ||
                                  "Featured Article"
                                }
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Remaining Articles Grid */}
                  {otherArticles.length > 0 && (
                    <div>
                      <h3 className="text-foreground mb-6 text-lg font-bold tracking-tight">
                        More Immigrant Visa Articles
                      </h3>
                      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {otherArticles.map((art) => (
                          <Link
                            key={art.id}
                            href={`/blog/${art.slug}`}
                            className="group border-border bg-card hover:border-primary/40 flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition hover:shadow-md"
                          >
                            <div>
                              {(art.category || art.readTime) && (
                                <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
                                  {art.category && (
                                    <span className="bg-muted text-foreground rounded-md px-2.5 py-1 font-medium">
                                      {art.category}
                                    </span>
                                  )}
                                  {art.readTime && <span>{art.readTime}</span>}
                                </div>
                              )}

                              <h4 className="text-foreground group-hover:text-primary line-clamp-2 text-lg font-bold transition-colors">
                                {art.title || "Untitled Guide"}
                              </h4>

                              {art.description && (
                                <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed">
                                  {art.description}
                                </p>
                              )}
                            </div>

                            <div className="border-border mt-6 flex items-center justify-between border-t pt-4 text-xs">
                              <span className="text-muted-foreground">{art.updatedAt || ""}</span>

                              <span className="text-primary flex items-center gap-1 font-semibold transition-transform group-hover:translate-x-0.5">
                                Read Blog
                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── OPTION 2: VISUAL CARDS GRID VIEW ── */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/blog/${art.slug}`}
                      className="group border-border bg-card hover:border-primary/50 flex flex-col overflow-hidden rounded-3xl border shadow-md transition-all duration-300 hover:shadow-xl"
                    >
                      {art.heroImage ? (
                        <div className="bg-muted relative h-48 w-full overflow-hidden">
                          <Image
                            src={art.heroImage}
                            alt={art.heroImageAlt || art.title || "Article Image"}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {art.category && (
                            <div className="absolute top-3 left-3">
                              <span className="text-primary-foreground rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                                {art.category}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        art.category && (
                          <div className="border-border/40 bg-muted/30 border-b p-4">
                            <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 text-[11px] font-semibold">
                              {art.category}
                            </span>
                          </div>
                        )
                      )}

                      <div className="flex flex-1 flex-col justify-between p-6">
                        <div>
                          {(art.readTime || art.updatedAt) && (
                            <div className="text-muted-foreground mb-2 flex items-center gap-3 text-xs">
                              {art.readTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {art.readTime}
                                </span>
                              )}
                              {art.readTime && art.updatedAt && <span>•</span>}
                              {art.updatedAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {art.updatedAt}
                                </span>
                              )}
                            </div>
                          )}

                          <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-xl font-bold transition-colors">
                            {art.title || "Untitled Article"}
                          </h3>

                          {art.description && (
                            <p className="text-muted-foreground mt-3 line-clamp-3 text-xs leading-relaxed">
                              {art.description}
                            </p>
                          )}
                        </div>

                        <div className="border-border/50 mt-6 flex items-center justify-between border-t pt-4">
                          <span className="text-muted-foreground text-xs font-medium">
                            {art.author?.name || "Rahvana"}
                          </span>
                          <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition">
                            <span>Read Blog</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* ── OPTION 3: COMPACT LIST VIEW ── */}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {displayedArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/blog/${art.slug}`}
                      className="group border-border/70 bg-card hover:border-primary/40 flex flex-col items-start justify-between gap-5 rounded-2xl border p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                    >
                      <div className="flex flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
                        {art.heroImage && (
                          <div className="bg-muted relative h-20 w-32 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-36">
                            <Image
                              src={art.heroImage}
                              alt={art.heroImageAlt || art.title || "Article Image"}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1.5">
                          {(art.category || art.readTime || art.updatedAt) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {art.category && (
                                <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                                  {art.category}
                                </span>
                              )}
                              {art.category && (art.readTime || art.updatedAt) && (
                                <span className="text-muted-foreground">•</span>
                              )}
                              {art.readTime && (
                                <span className="text-muted-foreground">{art.readTime}</span>
                              )}
                              {art.readTime && art.updatedAt && (
                                <span className="text-muted-foreground">•</span>
                              )}
                              {art.updatedAt && (
                                <span className="text-muted-foreground">
                                  Updated {art.updatedAt}
                                </span>
                              )}
                            </div>
                          )}

                          <h3 className="text-foreground group-hover:text-primary line-clamp-1 text-base font-bold transition-colors sm:text-lg">
                            {art.title || "Untitled Guide"}
                          </h3>

                          {art.description && (
                            <p className="text-muted-foreground line-clamp-1 text-xs">
                              {art.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="bg-primary text-primary-foreground group-hover:bg-primary/90 inline-flex shrink-0 items-center gap-1.5 self-end rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition sm:self-center">
                        <span>Read Blog</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* ── OPTION 4: MINIMAL TEXT VIEW ── */}
              {viewMode === "minimal" && (
                <div className="divide-border/60 border-border bg-card divide-y rounded-2xl border">
                  {displayedArticles.map((art, idx) => (
                    <Link
                      key={art.id}
                      href={`/blog/${art.slug}`}
                      className="group hover:bg-muted/30 flex flex-col justify-between gap-4 p-5 transition sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-primary mt-1 text-xs font-bold">0{idx + 1}.</span>
                        <div>
                          <h3 className="text-foreground group-hover:text-primary text-base font-bold transition-colors">
                            {art.title || "Untitled Article"}
                          </h3>
                          {(art.category || art.readTime || art.author?.name) && (
                            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
                              {art.category && (
                                <span className="text-foreground font-medium">{art.category}</span>
                              )}
                              {art.category && (art.readTime || art.author?.name) && <span>•</span>}
                              {art.readTime && <span>{art.readTime}</span>}
                              {art.readTime && art.author?.name && <span>•</span>}
                              {art.author?.name && <span>By {art.author.name}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-semibold group-hover:underline">
                        <span>Read Blog</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Load More Guides Button */}
              {hasMoreArticles && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    className="bg-card border-primary/30 text-primary hover:border-primary hover:bg-primary/10 inline-flex items-center justify-center rounded-full border px-8 py-2.5 text-xs font-semibold shadow-sm transition-all sm:text-sm"
                  >
                    Load more guides
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── View Layout Settings Modal using @/components/ui/dialog ── */}
      <Dialog
        open={isLayoutModalOpen}
        onOpenChange={(open) => {
          setIsLayoutModalOpen(open);
          if (open) setPendingViewMode(viewMode);
        }}
      >
        <DialogContent className="border-border/80 bg-card max-h-[85vh] max-w-2xl overflow-hidden rounded-3xl p-0 shadow-2xl">
          <div className="custom-scrollbar max-h-[85vh] space-y-4 overflow-y-auto p-5 pr-3 sm:p-6 sm:pr-4">
            {/* Modal Header */}
            <DialogHeader className="border-border/50 flex flex-row items-start justify-between space-y-0 border-b pb-3 text-left">
              <div className="flex items-center gap-3">
                <div className="border-primary/20 bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-foreground text-base font-bold tracking-tight sm:text-lg">
                    Article Display Layout
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
                    Choose your preferred view style for browsing immigrant visa guides.
                  </DialogDescription>
                </div>
              </div>
              <button
                onClick={() => setIsLayoutModalOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-full p-1.5 transition-colors"
                aria-label="Close layout modal"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            {/* Layout Options Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VIEW_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isActive = pendingViewMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setPendingViewMode(opt.id);
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                      isActive
                        ? "border-primary bg-primary/5 ring-primary/20 shadow-sm ring-2"
                        : "border-border/70 bg-background/50 hover:bg-card hover:border-primary/50 shadow-sm"
                    }`}
                  >
                    <div>
                      {/* Header row with Icon, Label & Selection Badge */}
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-foreground text-xs font-bold sm:text-sm">
                            {opt.label}
                          </span>
                        </div>
                        {isActive ? (
                          <CheckCircle2 className="text-primary h-4 w-4 shrink-0" />
                        ) : (
                          <span className="border-muted-foreground/40 group-hover:border-primary/50 h-3.5 w-3.5 shrink-0 rounded-full border" />
                        )}
                      </div>

                      {/* Badge Tag */}
                      <div className="mb-1.5">
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                            isActive
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    {/* Mini CSS Graphical Mockup Representation of the Layout */}
                    <div className="border-border/40 mt-3 border-t pt-2">
                      <div className="border-border/50 bg-muted/30 flex h-8 flex-col justify-center gap-0.5 overflow-hidden rounded-lg border p-1">
                        {opt.id === "detailed" && (
                          <div className="flex h-full gap-1">
                            <div className="border-primary/20 bg-primary/30 w-1/2 rounded border" />
                            <div className="flex w-1/2 flex-col gap-0.5">
                              <div className="bg-muted-foreground/20 h-1/2 rounded" />
                              <div className="bg-muted-foreground/20 h-1/2 rounded" />
                            </div>
                          </div>
                        )}
                        {opt.id === "grid" && (
                          <div className="flex h-full gap-1">
                            <div className="bg-muted-foreground/25 w-1/3 rounded" />
                            <div className="bg-muted-foreground/25 w-1/3 rounded" />
                            <div className="bg-muted-foreground/25 w-1/3 rounded" />
                          </div>
                        )}
                        {opt.id === "list" && (
                          <div className="flex h-full flex-col justify-between gap-0.5">
                            <div className="bg-muted-foreground/30 flex h-1.5 items-center rounded px-0.5">
                              <div className="bg-primary/50 h-1 w-1.5 rounded" />
                            </div>
                            <div className="bg-muted-foreground/30 flex h-1.5 items-center rounded px-0.5">
                              <div className="bg-primary/50 h-1 w-1.5 rounded" />
                            </div>
                            <div className="bg-muted-foreground/30 flex h-1.5 items-center rounded px-0.5">
                              <div className="bg-primary/50 h-1 w-1.5 rounded" />
                            </div>
                          </div>
                        )}
                        {opt.id === "minimal" && (
                          <div className="flex h-full flex-col justify-between py-0.5">
                            <div className="bg-muted-foreground/35 h-1 w-3/4 rounded" />
                            <div className="bg-muted-foreground/25 h-1 w-full rounded" />
                            <div className="bg-muted-foreground/25 h-1 w-1/2 rounded" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dialog Footer */}
            <DialogFooter className="border-border/50 flex items-center justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setIsLayoutModalOpen(false)}
                className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl border px-4 py-2 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode(pendingViewMode);
                  setIsLayoutModalOpen(false);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition"
              >
                Apply & Close
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
