"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ResourceMedia } from "@/app/(main)/pricing/data/resourceDetails";

const SERIF = '"DM Serif Display", Georgia, serif';

/**
 * Hero media + thumbnail strip. Supports image and video. If a file is missing
 * (screenshots not provided yet), it renders a quiet typographic placeholder
 * (the tool's initial) so the page never looks broken.
 */
export default function ResourceGallery({
  media,
  accent,
  tint,
  title,
}: {
  media: ResourceMedia[];
  accent: string;
  tint: string;
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const [zoomed, setZoomed] = useState(false);
  const monogram = title.trim().charAt(0).toUpperCase();

  // Close on Escape + lock body scroll while the lightbox is open
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

  const items = media.length
    ? media
    : [{ type: "image" as const, src: "", alt: title }];
  const current = items[active] ?? items[0];
  const showFallback = !current.src || errored[active];

  const Placeholder = (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2"
      style={{ background: `linear-gradient(160deg, ${tint} 0%, #ffffff 70%)` }}
    >
      <span style={{ fontFamily: SERIF, color: accent }} className="text-[64px] leading-none">
        {monogram}
      </span>
      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Preview coming soon
      </span>
    </div>
  );

  return (
    <div className="w-full">
      {/* Stage */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border shadow-sm"
        style={{
          borderColor: `${accent}22`,
          background: `linear-gradient(160deg, ${tint} 0%, #ffffff 70%)`,
        }}
      >
        {showFallback ? (
          Placeholder
        ) : current.type === "video" ? (
          <video
            key={current.src}
            controls
            poster={current.poster}
            className="h-full w-full bg-black object-contain"
          >
            <source src={current.src} type="video/mp4" />
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="group absolute inset-0 h-full w-full cursor-zoom-in"
            aria-label={`Enlarge ${current.alt}`}
          >
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              onError={() => setErrored((e) => ({ ...e, [active]: true }))}
              priority
            />
            {/* Zoom hint */}
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" /></svg>
              Click to enlarge
            </span>
          </button>
        )}

        {!showFallback && current.caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4">
            <p className="text-[13px] font-medium text-white">{current.caption}</p>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-3 flex gap-3">
          {items.map((m, i) => {
            const isActive = i === active;
            const thumbFallback = !m.src || errored[i];
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all"
                style={{ borderColor: isActive ? accent : "transparent", opacity: isActive ? 1 : 0.7 }}
                aria-label={`View ${m.alt}`}
              >
                {thumbFallback ? (
                  <span
                    className="flex h-full w-full items-center justify-center text-[18px]"
                    style={{ backgroundColor: tint, fontFamily: SERIF, color: accent }}
                  >
                    {monogram}
                  </span>
                ) : m.type === "video" ? (
                  <span className="flex h-full w-full items-center justify-center bg-black/80">
                    <span className="text-white">▶</span>
                  </span>
                ) : (
                  <Image
                    src={m.src}
                    alt={m.alt}
                    fill
                    sizes="96px"
                    className="object-contain"
                    style={{ backgroundColor: tint }}
                    onError={() => setErrored((e) => ({ ...e, [i]: true }))}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox modal */}
      {zoomed && !showFallback && current.type === "image" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>

          {/* Image (stop propagation so clicking the image doesn't close) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-full w-full max-w-5xl flex-col items-center"
          >
            <div className="relative h-[80vh] w-full">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
            {current.caption && (
              <p className="mt-4 text-center text-sm font-medium text-white/90">{current.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
