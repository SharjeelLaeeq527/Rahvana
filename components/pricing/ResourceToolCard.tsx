"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus, Star } from "lucide-react";

import { RESOURCE_DETAILS } from "@/app/(main)/pricing/data/resourceDetails";
import { getIcon, getSlugTheme } from "@/app/(main)/resources/[slug]/iconMap";

export type ResourceCardAddon = {
  id: string;
  title?: string;
  price: number;
  unit: string;
  copy: string;
};

/**
 * Attractive, clickable add-on card. The whole card links to the tool's detail
 * page (/resources/[slug]); the "Add to order" button toggles selection without
 * navigating (stopPropagation + preventDefault).
 */
export default function ResourceToolCard({
  addon,
  isAdded,
  disabled = false,
  onToggle,
}: {
  addon: ResourceCardAddon;
  isAdded: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
}) {
  const detail = RESOURCE_DETAILS[addon.id];
  const theme = getSlugTheme(addon.id);
  const { accent, tint } = theme;
  const Icon = getIcon(theme.icon);
  const title = addon.title ?? addon.id;

  return (
    <Link
      href={`/resources/${addon.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-[20px] border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.18)] ${
        isAdded ? "border-[var(--primary,#0d7a5c)] ring-1 ring-[var(--primary,#0d7a5c)]/30" : "border-border"
      }`}
    >
      {/* Media / icon header */}
      <div
        className="relative flex h-[104px] items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${tint} 0%, #ffffff 95%)` }}
      >
        {/* soft accent blob */}
        <div
          className="absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-80"
          style={{ background: `${accent}26`, opacity: 0.5 }}
        />
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-3"
          style={{ backgroundColor: accent }}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>

        {detail?.badge && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm"
            style={{ backgroundColor: "#fff", color: accent }}
          >
            {detail.badge}
          </span>
        )}

        {isAdded && (
          <span
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white shadow"
            style={{ backgroundColor: accent }}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{title}</h3>

        {detail && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5" aria-label={`${detail.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={i < Math.round(detail.rating) ? "" : "opacity-30"}
                  style={{ width: 12, height: 12, color: accent, fill: i < Math.round(detail.rating) ? accent : "transparent" }}
                />
              ))}
            </span>
            <span className="text-[11px] font-semibold text-foreground">{detail.rating.toFixed(1)}</span>
            <span className="text-[11px] text-muted-foreground">({detail.reviewCount})</span>
          </div>
        )}

        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
          {addon.copy}
        </p>

        {/* "View details" affordance */}
        <span
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold opacity-0 transition-all duration-200 group-hover:opacity-100"
          style={{ color: accent }}
        >
          View details <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="font-serif text-[20px] leading-none text-foreground" style={{ fontFamily: '"DM Serif Display", serif' }}>
              ${addon.price}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{addon.unit}</div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(addon.id);
            }}
            className={`addon-pill inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
              isAdded ? "is-added" : ""
            }`}
            style={{ ["--pill" as string]: accent } as CSSProperties}
          >
            {isAdded ? (
              <>
                <Check className="h-3.5 w-3.5" /> Added
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> Add to order
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
