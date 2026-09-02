"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

export default function BlogHero() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchInput = document.getElementById("blog-search-input") as HTMLInputElement | null;
    if (searchInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(searchInput, query);
      } else {
        searchInput.value = query;
      }
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const targetSection = document.getElementById("articles-section");
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-[#d8ece7] bg-gradient-to-r from-[#eef8f6] via-[#f4faf9] to-[#edf7f5] py-12 sm:py-16 lg:py-20 dark:border-teal-950/40 dark:from-[#061917] dark:via-[#09221f] dark:to-[#061917]">
      {/* Ambient decorative glow */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-700/10" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-700/10" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Text & Search Input */}
          <div className="lg:col-span-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center rounded-full border border-teal-600/20 bg-teal-600/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-teal-800 uppercase dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300">
              KNOWLEDGE CENTER
            </div>

            {/* Main Headline */}
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-[#0f2e2b] sm:text-4xl lg:text-5xl lg:leading-[1.18] dark:text-slate-100">
              Guides for every step{" "}
              <span className="block sm:inline lg:block">
                of your immigration journey
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3.5 max-w-xl text-base text-[#335552] sm:text-lg dark:text-slate-300">
              Find answers, prepare better, and move forward with confidence.
            </p>

            {/* Hero Search Bar */}
            <form onSubmit={handleSearch} className="mt-7 max-w-lg">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search guides, documents, interviews..."
                  className="w-full rounded-2xl border border-[#cbe3de] bg-white px-5 py-3.5 pr-12 text-sm text-foreground shadow-[0_4px_20px_-4px_rgba(20,70,60,0.08)] transition-all placeholder:text-muted-foreground/70 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none sm:rounded-full sm:text-base dark:border-teal-900/50 dark:bg-card"
                />
                <button
                  type="submit"
                  className="absolute right-4 text-teal-700 transition-colors hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200"
                  aria-label="Search articles"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Visual Hero Graphic */}
          <div className="flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-lg">
              <Image
                src="/assets/images/blog-hero-image.png"
                alt="Guides for every step of your immigration journey"
                width={680}
                height={450}
                className="h-auto max-h-[360px] w-full object-contain mix-blend-multiply sm:max-h-[400px] dark:mix-blend-normal"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
