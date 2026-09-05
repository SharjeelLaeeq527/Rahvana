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
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-12 sm:py-16 lg:py-20 dark:border-slate-800 dark:bg-[#070e17]">
      {/* Crisp Dot Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-70 dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)]" />

      {/* Subtle radial ambient glow */}
      <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/15" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/15" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Text & Search Input */}
          <div className="lg:col-span-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-teal-50/80 px-3.5 py-1 text-xs font-semibold tracking-wider text-teal-800 uppercase backdrop-blur-sm dark:border-teal-400/30 dark:bg-teal-950/40 dark:text-teal-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
              KNOWLEDGE CENTER
            </div>

            {/* Main Headline */}
            <h1 className="mt-4 font-serif text-3xl font-extrabold tracking-tight text-[#0c1b33] sm:text-4xl lg:text-5xl lg:leading-[1.18] dark:text-white">
              Guides for every step{" "}
              <span className="block text-teal-600 sm:inline lg:block dark:text-teal-400">
                of your immigration journey
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3.5 max-w-xl text-base font-normal text-slate-600 sm:text-lg dark:text-slate-300">
              Find answers, prepare better, and move forward with confidence.
            </p>

            {/* Hero Search Bar */}
            <form onSubmit={handleSearch} className="mt-7 max-w-lg">
              <div className="relative flex items-center rounded-full border border-slate-200/90 bg-white p-1.5 shadow-[0_10px_35px_-5px_rgba(12,27,51,0.08)] transition-all focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/15 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search guides, documents, interviews..."
                  className="w-full bg-transparent px-5 py-3 text-sm text-foreground placeholder:text-slate-400 focus:outline-none sm:text-base dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-md transition-all hover:bg-teal-700 hover:shadow-lg dark:bg-teal-500 dark:hover:bg-teal-400"
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
