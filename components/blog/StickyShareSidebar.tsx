"use client";

import React, { useState } from "react";
import { Link2, Check } from "lucide-react";

interface StickyShareSidebarProps {
  title?: string;
  slug?: string;
  description?: string;
}

export default function StickyShareSidebar({
  title = "Rahvana Immigration Guide",
  slug = "",
  description = "",
}: StickyShareSidebarProps) {
  const [copied, setCopied] = useState(false);

  // Construct absolute URL safely
  const articleUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://rahvana.com/blog/${slug}`;

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
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  const shareLinks = [
    {
      name: "X (Twitter)",
      hoverText: "Want to share on X?",
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
      hoverText: "Want to share on Facebook?",
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
      name: "LinkedIn",
      hoverText: "Want to share on LinkedIn?",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-0.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
      hoverBg: "hover:bg-[#0A66C2] hover:text-white",
      accentBorder: "hover:border-[#0A66C2]/50",
    },
    {
      name: "WhatsApp",
      hoverText: "Want to share on WhatsApp?",
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${title}: ${articleUrl}`
      )}`,
      hoverBg: "hover:bg-[#25D366] hover:text-white",
      accentBorder: "hover:border-[#25D366]/50",
    },
  ];

  return (
    <div className="border-border/70 bg-card/40 flex flex-col items-center gap-3 rounded-full border p-2.5 shadow-md backdrop-blur-md">
      {shareLinks.map((item) => (
        <div key={item.name} className="group relative flex items-center">
          {/* Left Hover Tooltip */}
          <div className="pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-xl border border-border/70 bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-xl opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-slate-950/95 dark:text-slate-100">
            {item.hoverText}
            {/* Arrow */}
            <div className="border-border/70 absolute top-1/2 -right-1.5 -mt-1 h-2.5 w-2.5 rotate-45 border-t border-r bg-slate-900/95 dark:bg-slate-950/95" />
          </div>

          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group/btn border-border/70 bg-background/80 text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-200 ${item.hoverBg} ${item.accentBorder}`}
            aria-label={`Share on ${item.name}`}
          >
            <span className="shrink-0 transition-transform group-hover/btn:scale-110">
              {item.icon}
            </span>
          </a>
        </div>
      ))}

      {/* Copy Link Button */}
      <div className="group relative flex items-center">
        {/* Left Hover Tooltip */}
        <div className="pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-xl border border-border/70 bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-xl opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-slate-950/95 dark:text-slate-100">
          {copied ? "Link copied to clipboard!" : "Copy article link"}
          {/* Arrow */}
          <div className="border-border/70 absolute top-1/2 -right-1.5 -mt-1 h-2.5 w-2.5 rotate-45 border-t border-r bg-slate-900/95 dark:bg-slate-950/95" />
        </div>

        <button
          onClick={handleCopyLink}
          className={`group/btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-200 ${
            copied
              ? "border-teal-500 bg-teal-500/20 text-teal-500 dark:text-teal-400"
              : "border-border/70 bg-background/80 text-muted-foreground hover:border-teal-500/50 hover:bg-teal-600 hover:text-white"
          }`}
          aria-label={copied ? "Link copied" : "Copy article link"}
        >
          {copied ? (
            <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
          ) : (
            <Link2 className="h-4 w-4 shrink-0 transition-transform group-hover/btn:scale-110" />
          )}
        </button>
      </div>
    </div>
  );
}
