"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function BlogNewsletterCTA() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetch("/api/blog/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSubscribed(true);
        setMessage(data.message || "Subscribed successfully!");
        setEmail("");
      } else {
        setIsError(true);
        setMessage(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setIsError(true);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-border/70 bg-card relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 lg:p-10">
      <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
        {/* Left Side: Headline & Subtitle */}
        <div className="text-center lg:text-left shrink-0">
          <h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
            Never miss an update
          </h3>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Get the latest immigration guides and news.
          </p>
        </div>

        {/* Center: Email Subscription Form */}
        <div className="flex w-full flex-1 items-center justify-center px-0 lg:px-6">
          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="dark:bg-background flex w-full items-center rounded-full border border-[#cbe3de] bg-white p-1 pl-4 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-teal-900/50"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                className="text-foreground placeholder:text-muted-foreground/70 w-full bg-transparent text-xs focus:outline-none sm:text-sm disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || isSubscribed}
                className="shrink-0 rounded-full bg-[#0d4f49] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:text-sm disabled:opacity-60"
              >
                {isLoading ? "Subscribing..." : isSubscribed ? "Subscribed!" : "Subscribe"}
              </button>
            </form>
            {message && (
              <p
                className={`mt-2 text-center text-xs font-medium ${
                  isError ? "text-red-500" : "text-teal-700 dark:text-teal-300"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Visual Graphic */}
        <div className="flex shrink-0 items-center justify-center">
          <Image
            src="/assets/images/blog/subscribe-image.png"
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
