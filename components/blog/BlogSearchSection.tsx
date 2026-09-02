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
  const [selectedCategory, setSelectedCategory] = useState<string>("All Articles");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [pendingViewMode, setPendingViewMode] = useState<ViewMode>("list");
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

  const handleOpenLayoutModal = () => {
    setPendingViewMode(viewMode);
    setIsLayoutModalOpen(true);
  };

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
      <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:mt-10 sm:px-8 lg:px-10">
        <div className="border-border/80 bg-card rounded-3xl border p-6 shadow-xl backdrop-blur-md sm:p-8">
          {/* Search Input */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides, documents, interview tips..."
                className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full rounded-2xl border py-3.5 pr-10 pl-12 text-sm shadow-inner transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {}}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-500"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>

          {/* Popular Searches Pills */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground shrink-0 font-semibold">Popular searches:</span>
            {POPULAR_SEARCHES.map((tag) => {
              const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handlePopularClick(tag)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border-teal-500 bg-teal-500/10 font-semibold text-teal-600 shadow-sm dark:text-teal-400"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-teal-500/50"
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
        <div className="border-border/40 flex flex-wrap items-center gap-2 border-b pb-5">
          <span className="text-muted-foreground mr-2 flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
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
                    : "border-border bg-card text-muted-foreground hover:text-foreground border hover:border-teal-500"
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-foreground text-xl font-bold tracking-tight">
              {selectedCategory === "All Articles" ? "Immigrant Visa Guides" : selectedCategory}
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                ({filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"})
              </span>
            </h2>
          </div>

          {/* View Settings Modal Trigger Button */}
          <button
            onClick={handleOpenLayoutModal}
            className="border-border/80 bg-card/80 text-foreground hover:bg-card flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400"
            title="Change article display layout"
          >
            <SlidersHorizontal className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Layout:</span>
            <span className="flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400">
              <CurrentIcon className="h-3.5 w-3.5" />
              <span>{currentViewOption.label}</span>
            </span>
          </button>
        </div>

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

                        <h3 className="text-foreground mt-4 text-2xl font-bold tracking-tight transition-colors group-hover:text-teal-500 sm:text-3xl lg:text-4xl dark:group-hover:text-teal-400">
                          <Link href={`/blog/${featuredArticle.slug}`}>
                            {featuredArticle.title}
                          </Link>
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
                              className="flex items-center gap-1 font-semibold text-teal-600 transition-transform group-hover:translate-x-0.5 dark:text-teal-400"
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
                    <div className="bg-muted relative h-48 w-full overflow-hidden">
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
                        <div className="text-muted-foreground mb-2 flex items-center gap-3 text-xs">
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

                      <div className="border-border/50 mt-6 flex items-center justify-between border-t pt-4">
                        <span className="text-muted-foreground text-xs font-medium">
                          {art.author.name}
                        </span>
                        <Link
                          href={`/blog/${art.slug}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-teal-600/10 px-3.5 py-1.5 text-xs font-semibold text-teal-600 transition hover:bg-teal-600 hover:text-white dark:text-teal-400"
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
                    className="group border-border bg-card flex flex-col items-center justify-between gap-6 rounded-2xl border p-5 shadow-sm transition hover:border-teal-500/40 hover:shadow-md sm:flex-row"
                  >
                    <div className="flex flex-1 flex-col items-start gap-5 sm:flex-row sm:items-center">
                      <div className="bg-muted relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:w-36">
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
                      className="inline-flex shrink-0 items-center gap-1.5 self-end rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-500 sm:self-center"
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
              <div className="divide-border/60 border-border bg-card divide-y rounded-2xl border">
                {filteredArticles.map((art, idx) => (
                  <div
                    key={art.id}
                    className="group hover:bg-muted/30 flex flex-col justify-between gap-4 p-5 transition sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-1 text-xs font-bold text-teal-500">0{idx + 1}.</span>
                      <div>
                        <h3 className="text-foreground text-base font-bold transition-colors group-hover:text-teal-500 dark:group-hover:text-teal-400">
                          <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                        </h3>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
                          <span className="text-foreground font-medium">{art.category}</span>
                          <span>•</span>
                          <span>{art.readTime}</span>
                          <span>•</span>
                          <span>By {art.author.name}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${art.slug}`}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm dark:text-teal-400">
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
                        ? "border-teal-500 bg-teal-500/5 shadow-sm ring-2 ring-teal-500/20"
                        : "border-border/70 bg-background/50 hover:bg-card shadow-sm hover:border-teal-500/50"
                    }`}
                  >
                    <div>
                      {/* Header row with Icon, Label & Selection Badge */}
                      <div className="mb-1.5 flex items-center justify-between">
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
                          <span className="text-foreground text-xs font-bold sm:text-sm">
                            {opt.label}
                          </span>
                        </div>
                        {isActive ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <span className="border-muted-foreground/40 h-3.5 w-3.5 shrink-0 rounded-full border group-hover:border-teal-500/50" />
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
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    {/* Mini CSS Graphical Mockup Representation of the Layout */}
                    <div className="border-border/40 mt-3 border-t pt-2">
                      <div className="border-border/50 bg-muted/30 flex h-8 flex-col justify-center gap-0.5 overflow-hidden rounded-lg border p-1">
                        {opt.id === "detailed" && (
                          <div className="flex h-full gap-1">
                            <div className="w-1/2 rounded border border-teal-500/20 bg-teal-500/30" />
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
                              <div className="h-1 w-1.5 rounded bg-teal-500/50" />
                            </div>
                            <div className="bg-muted-foreground/30 flex h-1.5 items-center rounded px-0.5">
                              <div className="h-1 w-1.5 rounded bg-teal-500/50" />
                            </div>
                            <div className="bg-muted-foreground/30 flex h-1.5 items-center rounded px-0.5">
                              <div className="h-1 w-1.5 rounded bg-teal-500/50" />
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
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-500"
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
