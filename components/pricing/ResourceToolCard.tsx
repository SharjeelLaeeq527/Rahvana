"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ExternalLink, Plus } from "lucide-react";

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
  const router = useRouter();

  const detail = RESOURCE_DETAILS[addon.id];
  const theme = getSlugTheme(addon.id);
  const { accent, tint } = theme;
  const Icon = getIcon(theme.icon);

  const title = addon.title ?? addon.id;
  const launchHref = getResourceLaunchHref(addon.id, addon.kind);

  const isService = addon.kind === "services";
  const navigable = Boolean(detail);

  const handleCardClick = () => {
    if (navigable) {
      router.push(`/resources/${addon.id}`);
    }
  };

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!navigable) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      role={navigable ? "link" : undefined}
      tabIndex={navigable ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`group relative flex min-w-0 flex-col rounded-[18px] bg-card transition-all duration-300 ${
        navigable
          ? "cursor-pointer hover:-translate-y-[3px]"
          : "cursor-default"
      }`}
      style={{
        boxShadow: isAdded
          ? `0 0 0 1.5px ${accent}, 0 14px 34px -18px ${accent}66`
          : "0 1px 2px rgba(0,0,0,0.05), 0 12px 28px -22px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top */}
      <div className="flex items-start justify-between px-3 pt-3 sm:px-5 sm:pt-5">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-[12px]"
          style={{
            backgroundColor: tint,
            color: accent,
          }}
        >
          <Icon
            className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]"
            strokeWidth={1.75}
          />
        </span>

        {isAdded ? (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white sm:h-6 sm:w-6"
            style={{ backgroundColor: accent }}
          >
            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
        ) : (
          detail?.badge && (
            <span
              className="mt-1 max-w-[55%] text-right text-[8px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.13em]"
              style={{ color: accent }}
            >
              {detail.badge}
            </span>
          )
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-5">
        {/* Accent rule */}
        <span
          className="mb-3 mt-2 block h-[2px] w-6 rounded-full transition-all duration-300 group-hover:w-10 sm:mb-4 sm:mt-3 sm:w-7 sm:group-hover:w-12"
          style={{ backgroundColor: accent }}
        />

        {/* Title */}
        <h3 className="text-[13px] font-semibold leading-snug text-foreground sm:text-[15.5px]">
          {title}
        </h3>

        {/* Description
            Mobile: no line clamp
            Desktop: line clamp
        */}
        <p className="mt-1.5 text-[10.5px] leading-[1.45] text-muted-foreground sm:line-clamp-2 sm:text-[12.5px] sm:leading-relaxed">
          {addon.copy}
        </p>

        {/* View details - desktop only */}
        {navigable && (
          <span
            className="mt-2 hidden items-center gap-1 text-[12px] font-semibold opacity-0 transition-all duration-200 group-hover:opacity-100 sm:inline-flex"
            style={{ color: accent }}
          >
            View details
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4 sm:pt-5">
          {/* Price */}
          <div className="min-w-0 shrink-0">
            <div
              className="font-serif text-[17px] leading-none text-foreground sm:text-[20px]"
              style={{
                fontFamily: '"DM Serif Display", serif',
              }}
            >
              ${addon.price}
            </div>

            <div className="mt-1 whitespace-nowrap text-[8px] text-muted-foreground sm:text-[10px]">
              {addon.unit}
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex min-w-0 items-center justify-end gap-1 sm:gap-1.5">
            {isService ? (
              <>
                {/* MOBILE Explore */}
                <button
                  type="button"
                  aria-label="Explore"
                  title="Explore"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (navigable) {
                      router.push(`/resources/${addon.id}`);
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:hidden"
                  style={
                    {
                      color: accent,
                      borderColor: accent,
                    } as CSSProperties
                  }
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {/* DESKTOP Explore */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (navigable) {
                      router.push(`/resources/${addon.id}`);
                    }
                  }}
                  className="addon-pill hidden items-center gap-1 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 sm:inline-flex"
                  style={
                    {
                      "--pill": accent,
                      color: accent,
                      borderColor: accent,
                    } as CSSProperties
                  }
                >
                  Explore
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                {/* MOBILE Add */}
                <button
                  type="button"
                  disabled={disabled}
                  title={isAdded ? "Added to order" : "Add to order"}
                  aria-label={isAdded ? "Added to order" : "Add to order"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle(addon.id);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
                  style={
                    {
                      color: accent,
                      borderColor: accent,
                    } as CSSProperties
                  }
                >
                  {isAdded ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* DESKTOP Add */}
                <button
                  type="button"
                  disabled={disabled}
                  title={isAdded ? "Added to order" : "Add to order"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle(addon.id);
                  }}
                  className={`addon-pill hidden items-center gap-1 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex ${
                    isAdded ? "is-added" : ""
                  }`}
                  style={
                    {
                      "--pill": accent,
                    } as CSSProperties
                  }
                >
                  {isAdded ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </>
                  )}
                </button>

                {/* MOBILE Launch */}
                <button
                  type="button"
                  aria-label="Launch tool"
                  title="Launch tool"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    router.push(launchHref);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:hidden"
                  style={
                    {
                      color: accent,
                      borderColor: accent,
                    } as CSSProperties
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>

                {/* DESKTOP Launch */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="hidden sm:block"
                >
                  <ResourceLaunchButton
                    href={launchHref}
                    size="card"
                    kind={addon.kind === "guides" ? "guides" : "tools"}
                    className="shrink-0"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}