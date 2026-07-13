"use client";

import React, { useEffect, useRef, useState } from "react";

// Ghost line-art bird that lives in the margin of a journey section.
// The PNGs sit on a white box, so .bird-bg-img uses mix-blend multiply to
// melt the white into the light page background. z-0 keeps the bird under
// the anchored nodes/labels (z-10/z-20); negative z would paint it behind
// the page's own background layer, so z-0 + low opacity is the floor here.
export default function SectionBird({
  n,
  side,
  pos = "top-[12%]",
  size = "w-36 lg:w-48 xl:w-56",
  className = "",
}: {
  n: number;
  side: "left" | "right";
  pos?: string;
  size?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sideClass =
    side === "right"
      ? "right-0 lg:-right-16 xl:-right-28"
      : "left-0 lg:-left-16 xl:-left-28";

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`hidden md:block absolute z-0 pointer-events-none select-none transition-opacity duration-1000 ease-out ${
        visible ? "opacity-55" : "opacity-0"
      } ${className || sideClass} ${pos}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/homepage/bird${n}.png`}
        alt=""
        loading="lazy"
        className={`bird-bg-img h-auto ${size}`}
        style={{ animationDelay: `${(n % 4) * -1.7}s` }}
      />
    </div>
  );
}
