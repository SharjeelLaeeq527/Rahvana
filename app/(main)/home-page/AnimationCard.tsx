"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Embeds one of the self-contained HTML animations from
 * `/public/animation_videos/` as a borderless, CSS-isolated element.
 *
 * The wrapper has NO card chrome (no border, shadow, or rounded corners).
 * The animation body/wrap backgrounds are forced transparent so each
 * animation's internal styling (notebooks, cards, etc.) floats directly
 * on the page background, producing a seamless, consistent look.
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
 * ratio — so wide/landscape animations cap on width while tall ones cap on
 * height. On smaller screens `maxWidth: 100%` shrinks it to the column and a
 * ResizeObserver rescales the iframe to match.
 */
export default function AnimationCard({
  file,
  w,
  h,
  maxW = 500,
  maxH = 430,
  className = "",
  title,
  bgClass = "bg-transparent",
}: {
  file: string;
  w: number;
  h: number;
  maxW?: number;
  maxH?: number;
  className?: string;
  title?: string;
  bgClass?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [boxW, setBoxW] = useState(0);
  const [html, setHtml] = useState<string | null>(null);

  const src = `/animation_videos/${encodeURIComponent(file)}`;

  // Inject a stylesheet and script to scale the iframe contents internally.
  // We use CSS zoom as the primary method because it is layout-aware and scales
  // vector paths/fonts dynamically before rasterization, resulting in perfect
  // crispness. We keep transform scale as a progressive-enhancement fallback.
  const injectedHead = useMemo(() => {
    return `
      <style>
        html, body {
          background: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          width: ${w}px !important;
          height: ${h}px !important;
          min-height: 0 !important;
          max-height: ${h}px !important;
          -webkit-font-smoothing: subpixel-antialiased !important;
          -moz-osx-font-smoothing: auto !important;
          text-rendering: optimizeLegibility !important;
        }
        .wrap {
          background: transparent !important;
        }
      </style>
    `;
  }, [w, h]);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => {
        if (!cancelled) setHtml(injectedHead + t);
      })
      .catch(() => {
        /* leave blank on failure */
      });
    return () => {
      cancelled = true;
    };
  }, [src, injectedHead]);

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
      className={`relative z-10 mx-auto overflow-hidden ${bgClass} ${className}`}
      style={{ width: dispW, maxWidth: "100%", height }}
    >
      <iframe
        ref={iframeRef}
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
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />
    </div>
  );
}
