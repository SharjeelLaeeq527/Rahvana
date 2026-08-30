"use client";

import React, { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

interface ArticleSocialShareProps {
  title: string;
  slug: string;
  description?: string;
}

export default function ArticleSocialShare({
  title,
  slug,
  description = "",
}: ArticleSocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Construct absolute URL
  const articleUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://rahvana.com/blog/${slug}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(articleUrl);
      } else {
        const input = document.createElement("input");
        input.value = articleUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: articleUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const shareLinks = [
    {
      name: "X (Twitter)",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `${title} - Rahvana Guide`
      )}&url=${encodeURIComponent(articleUrl)}`,
      hoverBg: "hover:bg-slate-900 hover:text-white dark:hover:bg-slate-800",
      accentBorder: "hover:border-slate-700",
    },
    {
      name: "Facebook",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
      hoverBg: "hover:bg-[#1877F2] hover:text-white",
      accentBorder: "hover:border-[#1877F2]/50",
    },
    {
      name: "Instagram",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      onClick: handleCopyLink,
      customActionNotice: "Link copied! Share on Instagram",
      hoverBg: "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white",
      accentBorder: "hover:border-rose-500/50",
    },
    {
      name: "TikTok",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.67 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.31 1.54-1.34 2.53-.05 1.25.68 2.45 1.79 3.01 1.05.54 2.37.49 3.39-.12.92-.54 1.48-1.54 1.54-2.61.05-3.61.02-7.22.02-10.83z" />
        </svg>
      ),
      onClick: handleCopyLink,
      customActionNotice: "Link copied! Share on TikTok",
      hoverBg: "hover:bg-black hover:text-white dark:hover:bg-slate-900",
      accentBorder: "hover:border-cyan-500/50",
    },
  ];

  return (
    <section className="relative my-8 rounded-3xl border border-border/80 bg-card/60 p-6 shadow-md backdrop-blur-md sm:p-8">
      {/* Toast Floating Notification */}
      {toastMessage && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <Share2 className="h-4 w-4" />
            <span>Pass It Forward</span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-foreground sm:text-xl">
            Found this guide helpful? Share with other applicants
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Help legal immigrants navigate their U.S. visa journey smoothly.
          </p>
        </div>

        {/* Social Share Buttons Row (Icons Only) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {shareLinks.map((item) => {
            if (item.onClick) {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    item.onClick();
                    if (item.customActionNotice) {
                      showToast(item.customActionNotice);
                    }
                  }}
                  className={`group flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-muted-foreground transition-all duration-200 ${item.hoverBg} ${item.accentBorder} shadow-sm shrink-0`}
                  title={`Share on ${item.name}`}
                  aria-label={`Share on ${item.name}`}
                >
                  <span className="shrink-0 transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>
                </button>
              );
            }

            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-muted-foreground transition-all duration-200 ${item.hoverBg} ${item.accentBorder} shadow-sm shrink-0`}
                title={`Share on ${item.name}`}
                aria-label={`Share on ${item.name}`}
              >
                <span className="shrink-0 transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
              </a>
            );
          })}

          {/* Copy Direct Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-200 shadow-sm shrink-0 ${
              copied
                ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                : "border-border/70 bg-background/80 text-muted-foreground hover:border-teal-500/50 hover:bg-teal-600 hover:text-white"
            }`}
            title={copied ? "Link copied!" : "Copy article link"}
            aria-label="Copy article link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            ) : (
              <Link2 className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
