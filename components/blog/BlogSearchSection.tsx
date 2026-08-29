"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Article } from "@/data/articles";
import {
  Search,
  BookOpen,
  Clock,
  Calendar,
  ArrowRight,
  Filter,
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

interface BlogSearchSectionProps {
  articles: Article[];
}

const POPULAR_SEARCHES = ["I-130 Process", "NVC Documents", "Interview Tips", "Medical Exam"];

const CATEGORIES = [
  "All Articles",
  "Spouse Visa (IR-1/CR-1)",
  "Parent Visa (IR-5)",
  "NVC & Documents",
  "Consular Interview & 221(g)",
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
    id: "detailed",
    label: "Featured & Grid",
    badge: "Hero + Cards",
    description: "Displays a prominent featured guide at the top followed by a responsive card grid below.",
    icon: LayoutList,
  },
  {
    id: "grid",
    label: "Visual Cards",
    badge: "Visual Grid",
    description: "Equal-sized image cards with rich metadata tags, perfect for visual browsing of articles.",
    icon: LayoutGrid,
  },
  {
    id: "list",
    label: "Compact List",
    badge: "High Density",
    description: "Horizontal layout rows with side thumbnail images for quick, streamlined article scanning.",
    icon: List,
  },
  {
    id: "minimal",
    label: "Minimal Text",
    badge: "Fast Reading",
    description: "Distraction-free text layout focusing purely on headlines, category badges, and read times.",
    icon: AlignLeft,
  },
];

export default function BlogSearchSection({ articles }: BlogSearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Articles");
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

  const currentViewOption = VIEW_OPTIONS.find((opt) => opt.id === viewMode) || VIEW_OPTIONS[0];
  const CurrentIcon = currentViewOption.icon;

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Category filter
      if (selectedCategory !== "All Articles" && article.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const titleMatch = article.title.toLowerCase().includes(q);
      const descMatch = article.description.toLowerCase().includes(q);
      const blufMatch = article.bluf.toLowerCase().includes(q);
      const catMatch = article.category.toLowerCase().includes(q);
      const keywordMatch = article.keywords.some((k) => k.toLowerCase().includes(q));

      return titleMatch || descMatch || blufMatch || catMatch || keywordMatch;
    });
  }, [articles, searchQuery, selectedCategory]);

  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const otherArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : [];

  const handlePopularClick = (tag: string) => {
    if (searchQuery.toLowerCase() === tag.toLowerCase()) {
      setSearchQuery("");
    } else {
      setSearchQuery(tag);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── 1. Search Bar & Popular Searches Box ── */}
      <section className="relative mt-6 sm:mt-10 z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl backdrop-blur-md">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides, documents, interview tips..."
                className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-10 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {}}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-teal-500 shadow-md shrink-0"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>

          {/* Popular Searches Pills */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-muted-foreground shrink-0">Popular searches:</span>
            {POPULAR_SEARCHES.map((tag) => {
              const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handlePopularClick(tag)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold shadow-sm"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-teal-500/50 hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. Full-Width Category Pill Filters ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2 flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5" /> Categories:
          </span>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:border-teal-500 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Main Articles Area (with Header & Layout Mode Toolbar) ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        {/* Section Header & Layout View Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pt-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-foreground text-xl font-bold tracking-tight">
              {selectedCategory === "All Articles" ? "Immigrant Visa Guides" : selectedCategory}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"})
              </span>
            </h2>
          </div>

          {/* View Settings Modal Trigger Button */}
          <button
            onClick={() => setIsLayoutModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-teal-500/50 hover:bg-card hover:text-teal-600 dark:hover:text-teal-400 shrink-0"
            title="Change article display layout"
          >
            <SlidersHorizontal className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Layout:</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <CurrentIcon className="h-3.5 w-3.5" />
              <span>{currentViewOption.label}</span>
            </span>
          </button>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-bold text-foreground">No articles found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search term or selecting another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Articles");
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-500"
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
                {featuredArticle && (
                  <div className="group border-border bg-card relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-300 hover:border-teal-500/50 hover:shadow-2xl sm:p-8 lg:p-10">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                      <div className="lg:col-span-7">
                        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                          <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 font-semibold text-teal-600 dark:text-teal-400">
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

                        <h3 className="text-foreground mt-4 text-2xl font-bold tracking-tight transition-colors group-hover:text-teal-500 dark:group-hover:text-teal-400 sm:text-3xl lg:text-4xl">
                          <Link href={`/blog/${featuredArticle.slug}`}>{featuredArticle.title}</Link>
                        </h3>

                        {/* AEO / BLUF Summary Box */}
                        <div className="mt-5 rounded-2xl border border-teal-500/30 bg-slate-900/95 p-4 text-slate-100 shadow-md sm:p-5">
                          <span className="mb-1.5 block text-xs font-bold tracking-wider text-teal-400 uppercase">
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
                )}

                {/* Remaining Articles Grid */}
                {otherArticles.length > 0 && (
                  <div>
                    <h3 className="text-foreground mb-6 text-lg font-bold tracking-tight">
                      More Immigrant Visa Articles
                    </h3>
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

                            <h4 className="text-foreground line-clamp-2 text-lg font-bold transition-colors group-hover:text-teal-500 dark:group-hover:text-teal-400">
                              <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                            </h4>

                            <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed">
                              {art.description}
                            </p>
                          </div>

                          <div className="border-border mt-6 flex items-center justify-between border-t pt-4 text-xs">
                            <span className="text-muted-foreground">{art.updatedAt}</span>
                            <Link
                              href={`/blog/${art.slug}`}
                              className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 transition-transform group-hover:translate-x-0.5"
                            >
                              Read Article →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── OPTION 2: VISUAL CARDS GRID VIEW ── */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="group border-border bg-card flex flex-col overflow-hidden rounded-3xl border shadow-md transition-all duration-300 hover:border-teal-500/50 hover:shadow-xl"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <Image
                        src={art.heroImage}
                        alt={art.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-teal-300 backdrop-blur-md">
                          {art.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {art.readTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {art.updatedAt}
                          </span>
                        </div>

                        <h3 className="text-foreground line-clamp-2 text-xl font-bold transition-colors group-hover:text-teal-500 dark:group-hover:text-teal-400">
                          <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                        </h3>

                        <p className="text-muted-foreground mt-3 line-clamp-3 text-xs leading-relaxed">
                          {art.description}
                        </p>
                      </div>

                      <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {art.author.name}
                        </span>
                        <Link
                          href={`/blog/${art.slug}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-teal-600/10 px-3.5 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 transition hover:bg-teal-600 hover:text-white"
                        >
                          <span>Read</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── OPTION 3: COMPACT LIST VIEW ── */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="group border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border p-5 shadow-sm transition hover:border-teal-500/40 hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1">
                      <div className="relative h-24 w-full sm:w-36 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={art.heroImage}
                          alt={art.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-md bg-teal-500/10 px-2.5 py-0.5 font-semibold text-teal-600 dark:text-teal-400">
                            {art.category}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{art.readTime}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">Updated {art.updatedAt}</span>
                        </div>

                        <h3 className="text-foreground text-lg font-bold transition-colors group-hover:text-teal-500 dark:group-hover:text-teal-400">
                          <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                        </h3>

                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {art.description}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${art.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-500 shrink-0 self-end sm:self-center"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* ── OPTION 4: MINIMAL TEXT VIEW ── */}
            {viewMode === "minimal" && (
              <div className="divide-y divide-border/60 rounded-2xl border border-border bg-card">
                {filteredArticles.map((art, idx) => (
                  <div
                    key={art.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition hover:bg-muted/30"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-xs font-bold text-teal-500 mt-1">
                        0{idx + 1}.
                      </span>
                      <div>
                        <h3 className="text-foreground text-base font-bold transition-colors group-hover:text-teal-500 dark:group-hover:text-teal-400">
                          <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{art.category}</span>
                          <span>•</span>
                          <span>{art.readTime}</span>
                          <span>•</span>
                          <span>By {art.author.name}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${art.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── View Layout Settings Modal using @/components/ui/dialog ── */}
      <Dialog open={isLayoutModalOpen} onOpenChange={setIsLayoutModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-2xl">
          {/* Modal Header */}
          <DialogHeader className="flex flex-row items-start justify-between border-b border-border/50 pb-3 space-y-0 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-base sm:text-lg font-bold tracking-tight">
                  Article Display Layout
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                  Choose your preferred view style for browsing immigrant visa guides.
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => setIsLayoutModalOpen(false)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              aria-label="Close layout modal"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          {/* Layout Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VIEW_OPTIONS.map((opt) => {
              const IconComponent = opt.icon;
              const isActive = viewMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setViewMode(opt.id);
                    setIsLayoutModalOpen(false);
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                    isActive
                      ? "border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20 shadow-sm"
                      : "border-border/70 bg-background/50 hover:border-teal-500/50 hover:bg-card shadow-sm"
                  }`}
                >
                  <div>
                    {/* Header row with Icon, Label & Selection Badge */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-teal-600 text-white"
                              : "bg-muted text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-foreground">{opt.label}</span>
                      </div>
                      {isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 group-hover:border-teal-500/50 shrink-0" />
                      )}
                    </div>

                    {/* Badge Tag */}
                    <div className="mb-1.5">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                          isActive
                            ? "bg-teal-500/20 text-teal-600 dark:text-teal-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>

                  {/* Mini CSS Graphical Mockup Representation of the Layout */}
                  <div className="mt-3 pt-2 border-t border-border/40">
                    <div className="h-8 rounded-lg border border-border/50 bg-muted/30 p-1 flex flex-col justify-center gap-0.5 overflow-hidden">
                      {opt.id === "detailed" && (
                        <div className="flex gap-1 h-full">
                          <div className="w-1/2 rounded bg-teal-500/30 border border-teal-500/20" />
                          <div className="w-1/2 flex flex-col gap-0.5">
                            <div className="h-1/2 rounded bg-muted-foreground/20" />
                            <div className="h-1/2 rounded bg-muted-foreground/20" />
                          </div>
                        </div>
                      )}
                      {opt.id === "grid" && (
                        <div className="flex gap-1 h-full">
                          <div className="w-1/3 rounded bg-muted-foreground/25" />
                          <div className="w-1/3 rounded bg-muted-foreground/25" />
                          <div className="w-1/3 rounded bg-muted-foreground/25" />
                        </div>
                      )}
                      {opt.id === "list" && (
                        <div className="flex flex-col justify-between h-full gap-0.5">
                          <div className="h-1.5 rounded bg-muted-foreground/30 flex items-center px-0.5">
                            <div className="h-1 w-1.5 bg-teal-500/50 rounded" />
                          </div>
                          <div className="h-1.5 rounded bg-muted-foreground/30 flex items-center px-0.5">
                            <div className="h-1 w-1.5 bg-teal-500/50 rounded" />
                          </div>
                          <div className="h-1.5 rounded bg-muted-foreground/30 flex items-center px-0.5">
                            <div className="h-1 w-1.5 bg-teal-500/50 rounded" />
                          </div>
                        </div>
                      )}
                      {opt.id === "minimal" && (
                        <div className="flex flex-col justify-between h-full py-0.5">
                          <div className="h-1 w-3/4 rounded bg-muted-foreground/35" />
                          <div className="h-1 w-full rounded bg-muted-foreground/25" />
                          <div className="h-1 w-1/2 rounded bg-muted-foreground/25" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="border-t border-border/50 pt-3">
            <button
              onClick={() => setIsLayoutModalOpen(false)}
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-500"
            >
              Apply & Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
