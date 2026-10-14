"use client";

import { useEffect } from "react";

// Locks page scroll on <html> whenever a visible, interactive, full-viewport fixed
// overlay (modal, drawer, full-screen tool) is on screen. Detection is DOM-based so
// every modal is covered without per-component code, and nested modals cannot
// unlock the page early when only one of them closes.
function isBlockingOverlay(el: HTMLElement, vw: number, vh: number): boolean {
  const s = getComputedStyle(el);
  if (s.position !== "fixed" || s.display === "none") return false;
  if (s.visibility === "hidden" || s.pointerEvents === "none") return false;
  // Decorative page backgrounds use fixed inset-0 at z-index 0 or below.
  const z = parseInt(s.zIndex, 10);
  if (Number.isNaN(z) || z <= 0) return false;
  const r = el.getBoundingClientRect();
  return r.top <= 1 && r.left <= 1 && r.right >= vw - 1 && r.bottom >= vh - 1;
}

export function ModalScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    let locked = false;
    let frame = 0;

    const check = () => {
      frame = 0;
      const vw = html.clientWidth;
      const vh = window.innerHeight;
      const shouldLock = Array.from(document.body.querySelectorAll<HTMLElement>(".fixed")).some(
        (el) => isBlockingOverlay(el, vw, vh)
      );
      if (shouldLock === locked) return;
      locked = shouldLock;
      if (shouldLock) {
        const hasScrollbar = window.innerWidth > html.clientWidth;
        html.style.overflow = "hidden";
        // Keep the scrollbar's space reserved so the page behind does not shift sideways.
        if (hasScrollbar) html.style.scrollbarGutter = "stable";
      } else {
        html.style.overflow = "";
        html.style.scrollbarGutter = "";
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    // Only childList + class changes: style mutations fire every frame during
    // framer-motion animations and would make this needlessly hot.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      html.style.overflow = "";
      html.style.scrollbarGutter = "";
    };
  }, []);

  return null;
}
