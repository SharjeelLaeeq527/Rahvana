/**
 * useHideOnFooter — returns true when the page footer enters the viewport.
 * Used to fade out fixed side panels so they don't overlap the footer.
 *
 * Configurable via `bufferPx` — extra space above the footer to start hiding.
 */

"use client";

import { useEffect, useState } from "react";

export function useHideOnFooter(bufferPx: number = 80): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const footer = document.querySelector("footer");
      if (!footer) {
        setHidden(false);
        return;
      }
      const rect = footer.getBoundingClientRect();
      setHidden(rect.top < window.innerHeight - bufferPx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [bufferPx]);

  return hidden;
}
