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
  size = "w-40 lg:w-52 xl:w-60",
}: {
  n: number;
  side: "left" | "right";
  pos?: string;
  size?: string;
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
      className={`hidden md:block absolute z-0 pointer-events-none select-none ${sideClass} ${pos}`}
    >
      <div
        className={`relative transition-all duration-1000 ease-out ${
          visible ? "opacity-85 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
        }`}
      >
        <div className="bird-glow" />
        <span className="bird-sparkle" style={{ top: "6%", left: "4%" }} />
        <span
          className="bird-sparkle"
          style={{ top: "26%", right: "8%", animationDelay: "1.4s" }}
        />
        <span
          className="bird-sparkle"
          style={{ bottom: "12%", left: "16%", animationDelay: "2.6s" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/homepage/bird${n}-teal.png`}
          alt=""
          loading="lazy"
          className={`bird-bg-img relative h-auto ${size}`}
          style={{ animationDelay: `${(n % 4) * -1.7}s` }}
        />
      </div>
    </div>
  );
}
