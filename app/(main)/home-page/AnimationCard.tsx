"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Embeds one of the self-contained HTML animations from
 * `/public/animation_videos/` as a decorative, CSS-isolated card.
 *
 * Why fetch + `srcDoc` instead of `<iframe src=...>`:
 * the site sets `X-Frame-Options: DENY` on every route (next.config.mjs),
 * which blocks the animation HTML from loading inside an iframe even on the
 * same origin. Content injected via `srcDoc` has no HTTP response, so that
 * header doesn't apply — it renders inline while the iframe still isolates the
 * animation's global CSS reset / `body` styles from the page.
 *
 * Sizing (contain model): each animation is authored at a fixed logical size
 * (`w` x `h`). We fit it inside a max box (`maxW` x `maxH`) preserving aspect
 * ratio — so wide/landscape animations cap on width (and get a shorter card,
 * no letterbox) while tall ones cap on height. The card never exceeds `maxW`,
 * keeping it inside its layout column so it can't overlap the section text.
 * On smaller screens `maxWidth: 100%` shrinks it to the column and a
 * ResizeObserver rescales the iframe to match.
 */
export default function AnimationCard({
  file,
  w,
  h,
  maxW = 460,
  maxH = 430,
  className = "",
  title,
}: {
  file: string;
  w: number;
  h: number;
  maxW?: number;
  maxH?: number;
  className?: string;
  title?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);
  const [html, setHtml] = useState<string | null>(null);

  const src = `/animation_videos/${encodeURIComponent(file)}`;

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => {
        if (!cancelled) setHtml(t);
      })
      .catch(() => {
        /* leave blank on failure */
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setBoxW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Desktop box: contain (w, h) within (maxW, maxH) preserving aspect ratio.
  const capScale = Math.min(maxW / w, maxH / h);
  const dispW = Math.round(w * capScale);

  // Actual scale follows the measured width so it stays correct on every
  // screen; height tracks the aspect ratio so there's never any letterbox.
  const scale = boxW ? boxW / w : 0;
  const height = boxW ? Math.round((boxW * h) / w) : Math.round(h * capScale);
  const ready = scale > 0 && html !== null;

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${className}`}
      style={{ width: dispW, maxWidth: "100%", height }}
    >
      <iframe
        srcDoc={html ?? ""}
        title={title || file}
        scrolling="no"
        tabIndex={-1}
        aria-hidden="true"
        sandbox="allow-scripts"
        className="absolute left-0 top-0 border-0 pointer-events-none select-none"
        style={{
          width: w,
          height: h,
          transformOrigin: "top left",
          transform: `scale(${scale || 0.0001})`,
          opacity: ready ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />
    </div>
  );
}
