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
        .rahvana-card {
          box-shadow: none !important;
        }
      </style>
      <script>
        (function() {
          var designW = ${w};
          var isZoomSupported = 'zoom' in document.documentElement.style || (window.CSS && CSS.supports && CSS.supports('zoom', '1'));

          function applyScale(scaleVal) {
            var body = document.body;
            if (!body) return;
            if (isZoomSupported) {
              body.style.zoom = scaleVal;
              body.style.transform = '';
            } else {
              body.style.transform = 'scale(' + scaleVal + ')';
              body.style.transformOrigin = 'top left';
            }
          }

          function applyInitial() {
            var body = document.body;
            if (body) {
              var initialScale = window.innerWidth / designW;
              applyScale(initialScale);
            } else {
              setTimeout(applyInitial, 5);
            }
          }
          applyInitial();

          window.addEventListener('message', function(event) {
            if (event.data && typeof event.data.scale === 'number') {
              applyScale(event.data.scale);
            }
          });
        })();
      </script>
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

  // Send scale to iframe when scale changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow || !ready) return;
    iframe.contentWindow.postMessage({ scale }, "*");
  }, [scale, ready]);

  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow && ready) {
      iframe.contentWindow.postMessage({ scale }, "*");
    }
  };

  const isDefaultBg = bgClass === "bg-transparent";
  const cardRadius = Math.round(24 * scale);

  return (
    <div
      ref={wrapRef}
      className={`relative z-10 mx-auto overflow-hidden ${bgClass} ${className}`}
      style={{
        width: dispW,
        maxWidth: "100%",
        height,
        ...(isDefaultBg
          ? {
              borderRadius: `${cardRadius}px`,
              boxShadow:
                "0 30px 60px -20px rgba(15, 40, 42, 0.25), 0 2px 8px rgba(15, 40, 42, 0.06)",
            }
          : {}),
      }}
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
        onLoad={handleLoad}
        style={{
          width: "100%",
          height: "100%",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />
    </div>
  );
}
