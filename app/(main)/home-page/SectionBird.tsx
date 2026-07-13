"use client";

import React, { useEffect, useRef, useState } from "react";

// Teal duotone bird that lives in the margin of a journey section.
// Uses the pre-tinted transparent PNGs (public/homepage/bird{n}-teal.png,
// generated from the original white-bg line art), so no blend-mode tricks
// are needed. z-0 keeps the bird under the anchored nodes/labels (z-10/z-20)
// and pointer-events are disabled so it never intercepts clicks.
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
          className={`bird-bg-img relative h-auto ${size}`}
          style={{ animationDelay: `${(n % 4) * -1.7}s` }}
        />
      </div>
  );
}
