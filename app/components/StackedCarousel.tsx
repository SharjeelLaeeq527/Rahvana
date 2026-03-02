"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import HydrationSafeButton from "./HydrationSafeButton";

interface Journey {
  category: string;
  code: string;
  title: string;
  desc: string;
  icon: Icons.LucideIcon;
  live: boolean;
}

interface StackedCarouselProps {
  items: Journey[];
  onNavigate: (section: string) => void;
  onNotify: () => void;
}

export const StackedCarousel = ({
  items,
  onNavigate,
  onNotify,
}: StackedCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Symmetric centered layout logic
  const getCardStyle = (index: number) => {
    const total = items.length;

    // Calculate shortest circular distance
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const absDiff = Math.abs(diff);

    // Visible range
    const isVisible = absDiff <= 2;

    if (!isVisible) {
      return {
        zIndex: 0,
        opacity: 0,
        scale: 0.5,
        x: diff > 0 ? 400 : -400,
        visible: false,
      };
    }

    // Centered symmetric stack (Cover Flow style)
    // Values tuned for premium depth feel
    const zIndex = 10 - absDiff * 2;
    const scale = 1 - absDiff * 0.15;
    const x = diff * 180; // Spread distance
    const opacity = 1 - absDiff * 0.4;
    const blur = absDiff * 2;

    return {
      zIndex,
      scale,
      x,
      opacity,
      blur,
      visible: true,
    };
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[450px] md:h-112.5 flex items-center justify-center">
      {/* Navigation Buttons */}
      <HydrationSafeButton
        onClick={handlePrev}
        className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 z-20 bg-background/50 md:backdrop-blur-sm p-2 md:p-3 rounded-full shadow-lg border border-border text-muted-foreground hover:text-rahvana-primary hover:border-rahvana-primary transition-all"
      >
        <Icons.ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </HydrationSafeButton>

      <HydrationSafeButton
        onClick={handleNext}
        className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 z-20 bg-background/50 md:backdrop-blur-sm p-2 md:p-3 rounded-full shadow-lg border border-border text-muted-foreground hover:text-rahvana-primary hover:border-rahvana-primary transition-all"
      >
        <Icons.ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </HydrationSafeButton>

      {/* Cards Container */}
      <div className="relative w-87.5 h-100">
        <>
          {items.map((journey, index) => {
            const style = getCardStyle(index);

            if (!style.visible) return null;

            return (
              <motion.div
                key={journey.code} // Use unique ID
                layout
                animate={{
                  opacity: style.opacity,
                  scale: style.scale,
                  x: style.x,
                  zIndex: style.zIndex,
                }}
                exit={{ opacity: 0, scale: 0.8, x: -100 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 25,
                  mass: 0.8,
                }}
                onClick={() => setActiveIndex(index)}
                className="absolute top-0 left-0 w-full h-full bg-card rounded-3xl border border-border p-8 shadow-2xl flex flex-col"
                style={{
                  transformOrigin: "center left",
                }}
              >
                {/* Card Content - Matching existing design */}
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-rahvana-primary to-rahvana-primary-light flex items-center justify-center text-white shadow-md">
                    <journey.icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg uppercase tracking-wider border border-border">
                    {journey.code}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                  {journey.title}
                </h3>

                <p className="text-muted-foreground text-base leading-relaxed mb-auto">
                  {journey.desc}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-border mt-6 w-full gap-2">
                  {journey.live ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-3 py-1 rounded-full border border-border">
                      Coming Soon
                    </span>
                  )}

                  <HydrationSafeButton
                    onClick={(e) => {
                      e.stopPropagation();
                      if (journey.live) {
                        onNavigate("ir1-journey");
                      } else {
                        onNotify();
                      }
                    }}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      journey.live
                        ? "text-white bg-linear-to-r from-rahvana-primary to-rahvana-primary-light hover:shadow-md hover:-translate-y-0.5"
                        : "text-rahvana-primary hover:bg-rahvana-primary-pale"
                    }`}
                  >
                    {journey.live ? "Start Journey" : "Get Early Access"}
                  </HydrationSafeButton>
                </div>
              </motion.div>
            );
          })}
        </>
      </div>
    </div>
  );
};
