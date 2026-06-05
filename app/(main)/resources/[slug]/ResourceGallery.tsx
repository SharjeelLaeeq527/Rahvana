"use client";

import { useState } from "react";
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
  const monogram = title.trim().charAt(0).toUpperCase();

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
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-contain"
            onError={() => setErrored((e) => ({ ...e, [active]: true }))}
            priority
          />
        )}

        {!showFallback && current.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4">
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
    </div>
  );
}
