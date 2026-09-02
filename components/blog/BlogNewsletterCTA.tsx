"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function BlogNewsletterCTA() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubscribed(true);
    setEmail("");
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 sm:p-8 lg:p-10 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        {/* Left Side: Headline, Subtitle & Email Subscription Input */}
        <div className="max-w-xl flex-1">
          <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Never miss an update
          </h3>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Get the latest immigration guides and news.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex w-full max-w-md items-center rounded-full border border-[#cbe3de] bg-white p-1 pl-4 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-teal-900/50 dark:bg-background">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-[#0d4f49] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              {isSubscribed ? "Subscribed!" : "Subscribe"}
            </button>
          </form>
        </div>

        {/* Right Side: Visual Graphic */}
        <div className="flex shrink-0 items-center justify-center self-center md:self-auto">
          <Image
            src="/assets/images/blog-hero-image.png"
            alt="Never miss an update"
            width={280}
            height={180}
            className="h-28 w-auto object-contain mix-blend-multiply sm:h-36 dark:mix-blend-normal"
          />
        </div>
      </div>
    </div>
  );
}
