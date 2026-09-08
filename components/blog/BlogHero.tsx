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
    <section className="border-primary/30 dark:border-primary/40 relative overflow-hidden border-b py-12 sm:py-16 lg:py-20">
      {/* Custom Generated Watercolor Canvas Background Asset */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/assets/images/blog/blog-heroimage-bg.png"
          alt="Immigration Journey Watercolor Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-95 dark:opacity-30"
        />
        {/* Soft atmospheric gradient overlay for crisp text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/40 to-transparent dark:from-slate-950/90 dark:via-slate-950/70 dark:to-slate-950/50" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Text & Search Input */}
          <div className="lg:col-span-7">
            {/* Pill Badge */}
            <div className="border-primary/30 text-primary dark:border-primary dark:text-primary/30 inline-flex items-center gap-1.5 rounded-full border bg-white/85 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase shadow-xs backdrop-blur-md dark:bg-teal-950/70">
              KNOWLEDGE CENTER
            </div>

            {/* Main Headline */}
            <h1 className="mt-4 font-serif text-3xl font-extrabold tracking-tight text-[#0f2e2b] sm:text-4xl lg:text-5xl lg:leading-[1.18] dark:text-white">
              Guides for every step{" "}
              <span className="text-primary dark:text-primary/40 block sm:inline lg:block">
                of your immigration journey
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-primary mt-3.5 max-w-xl text-base font-normal sm:text-lg dark:text-slate-300">
              Find answers, prepare better, and move forward with confidence.
            </p>

            {/* Hero Search Bar */}
            <form onSubmit={handleSearch} className="mt-7 max-w-lg">
              <div className="focus-within:border-primary/60 focus-within:ring-primary/20 dark:border-primary/50 relative flex items-center rounded-full border border-[#cbe3de] bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(13,148,136,0.12)] backdrop-blur-sm transition-all focus-within:ring-4 dark:bg-slate-900/90">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search guides, documents, interviews..."
                  className="text-foreground w-full bg-transparent px-5 py-3 text-sm placeholder:text-slate-400 focus:outline-none sm:text-base dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/70 dark:bg-primary/50 dark:hover:bg-primary/40 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all hover:shadow-lg"
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
                src="/assets/images/blog/blog-hero-image.png"
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
