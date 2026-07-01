"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";

import { RESOURCE_DETAILS } from "@/app/(main)/pricing/data/resourceDetails";
import { getResourceLaunchHref } from "@/app/(main)/pricing/data/pricing";
import { getSlugTheme, getIcon } from "@/app/(main)/resources/[slug]/iconMap";
import ResourceLaunchButton from "./ResourceLaunchButton";

export type ResourceCardAddon = {
  id: string;
  title?: string;
  price: number;
  unit: string;
  copy: string;
  kind?: string;
};

/**
 * Attractive, clickable add-on card. The whole card links to the tool's detail
 * page (/resources/[slug]); the "Add to order" button toggles selection without
 * navigating (stopPropagation + preventDefault). The secondary CTA launches the
 * live tool/service/guide route.
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
  const launchHref = getResourceLaunchHref(addon.id, addon.kind);

  // Services are not "added to cart" — the user explores them, gives info on a
  // guided flow page, and pays at checkout there. So a service card shows an
  // "Explore" button (no toggle) that just follows the card link to its detail
  // page, instead of the "Add to order" toggle used by tools/guides.
  const isService = addon.kind === "services";

  // Some add-ons (e.g. individual document guides) have no rich detail page.
  // For those the card must not navigate — it would 404. The whole card only
  // links through when a RESOURCE_DETAILS entry exists.
  const navigable = Boolean(detail);

  return (
    <Link
      href={navigable ? `/resources/${addon.id}` : "#"}
      onClick={navigable ? undefined : (e) => e.preventDefault()}
      aria-disabled={navigable ? undefined : true}
      className={`group relative flex flex-col rounded-[18px] bg-card transition-all duration-300 hover:-translate-y-[3px] ${
        navigable ? "" : "cursor-default"
      }`}
      style={{
        boxShadow: isAdded
          ? `0 0 0 1.5px ${accent}, 0 14px 34px -18px ${accent}66`
          : "0 1px 2px rgba(0,0,0,0.05), 0 12px 28px -22px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top: tool icon tile + badge / added check */}
      <div className="flex items-start justify-between px-5 pt-5">
        <span
          aria-hidden
          className="flex h-11 w-11 items-center justify-center rounded-[12px] transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: tint, color: accent }}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </span>

        {isAdded ? (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: accent }}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : (
          detail?.badge && (
            <span
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.13em]"
              style={{ color: accent }}
            >
              {detail.badge}
            </span>
          )
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pb-5">
        {/* thin accent rule that grows on hover */}
        <span
          className="mb-4 mt-3 block h-[2px] w-7 rounded-full transition-all duration-300 group-hover:w-12"
          style={{ backgroundColor: accent }}
        />
        <h3 className="text-[15.5px] font-semibold leading-snug text-foreground">{title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
          {addon.copy}
        </p>

        {/* "View details" affordance — only when a detail page exists */}
        {navigable && (
          <span
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold opacity-0 transition-all duration-200 group-hover:opacity-100"
            style={{ color: accent }}
          >
            View details <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="font-serif text-[20px] leading-none text-foreground" style={{ fontFamily: '"DM Serif Display", serif' }}>
              ${addon.price}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{addon.unit}</div>
          </div>

          <div className="ml-auto flex items-center justify-end gap-1.5">
            {isService ? (
              // Services still navigate to the detail page via the card body.
              <span
                className="addon-pill inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150"
                style={{ ["--pill" as string]: accent } as CSSProperties}
              >
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </span>
            ) : (
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
            )}
            <ResourceLaunchButton href={launchHref} size="card" className="shrink-0" />
          </div>
        </div>
      </div>
    </Link>
  );
}
