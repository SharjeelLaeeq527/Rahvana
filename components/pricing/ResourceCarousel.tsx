"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ResourceToolCard from "./ResourceToolCard";

export type ResourceCardAddon = {
  id: string;
  title?: string;
  price: number;
  unit: string;
  copy: string;
  kind?: string;
};

interface ResourceCarouselProps {
  addons: ResourceCardAddon[];
  addedItems?: string[];
  disabled?: boolean;
  onToggle?: (id: string) => void;
}

export default function ResourceCarousel({
  addons,
  addedItems = [],
  disabled = false,
  onToggle,
}: ResourceCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!addons.length) {
    return null;
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % addons.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + addons.length) % addons.length);
  };

  /**
   * Calculate the position of each card relative to the active card.
   *
   *  0  = active / center
   * -1  = left
   * +1  = right
   * -2/+2 = far left/right
   */
  const getCardStyle = (index: number) => {
    const total = addons.length;

    let diff = index - activeIndex;

    // Shortest circular distance
    if (diff > total / 2) {
      diff -= total;
    }

    if (diff < -total / 2) {
      diff += total;
    }

    const absDiff = Math.abs(diff);

    // Only render cards close to the active card
    const isVisible = absDiff <= 2;

    if (!isVisible) {
      return {
        visible: false,
        zIndex: 0,
        opacity: 0,
        scale: 0.5,
        x: diff > 0 ? 400 : -400,
        blur: 0,
      };
    }

    // Active card
    if (diff === 0) {
      return {
        visible: true,
        zIndex: 10,
        opacity: 1,
        scale: 1,
        x: 0,
        blur: 0,
      };
    }

    /**
     * Side cards.
     *
     * 150px keeps the cards closer together and gives
     * the same compact stacked-carousel appearance.
     */
    const x = diff * 150;

    const zIndex = 10 - absDiff * 2;
    const scale = 1 - absDiff * 0.12;
    const opacity = 1 - absDiff * 0.35;
    const blur = absDiff * 1;

    return {
      visible: true,
      zIndex,
      opacity,
      scale,
      x,
      blur,
    };
  };

  return (
    <div className="relative w-full">
      {/* Carousel */}
      <div
        className="
          relative
          mx-auto
          flex
          h-[325px]
          w-full
          items-center
          justify-center
          overflow-hidden
          sm:h-[335px]
          md:h-[350px]
          lg:overflow-visible
        "
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous resource"
          className="
            absolute
            left-2
            top-1/2
            z-30
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-border
            bg-card
            text-muted-foreground
            shadow-lg
            transition-all
            hover:border-primary
            hover:text-primary
            sm:left-4
            sm:h-10
            sm:w-10
            lg:-left-5
          "
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next resource"
          className="
            absolute
            right-2
            top-1/2
            z-30
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-border
            bg-card
            text-muted-foreground
            shadow-lg
            transition-all
            hover:border-primary
            hover:text-primary
            sm:right-4
            sm:h-10
            sm:w-10
            lg:-right-5
          "
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Cards */}
        <div
          className="
            relative
            h-[315px]
            w-[220px]
            sm:h-[325px]
            sm:w-[250px]
            md:h-[335px]
            md:w-[270px]
          "
        >
          <AnimatePresence mode="popLayout">
            {addons.map((addon, index) => {
              const style = getCardStyle(index);

              if (!style.visible) {
                return null;
              }

              const isAdded = addedItems.includes(addon.id);

              return (
                <motion.div
                  key={addon.id}
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    x: style.x > 0 ? 80 : -80,
                  }}
                  animate={{
                    opacity: style.opacity,
                    scale: style.scale,
                    x: style.x,
                    zIndex: style.zIndex,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    x: style.x > 0 ? -80 : 80,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="
                    absolute
                    left-0
                    top-0
                    h-full
                    w-full
                  "
                  style={{
                    filter: `blur(${style.blur}px)`,
                    transformOrigin: "center center",
                  }}
                >
                  <ResourceToolCard
                    addon={addon}
                    isAdded={isAdded}
                    disabled={disabled}
                    onToggle={onToggle ?? (() => {})}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Indicators */}
      {addons.length > 1 && (
        <div className="-mt-14 flex justify-center gap-1.5">
          {addons.map((addon, index) => (
            <button
              key={addon.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to ${addon.title ?? addon.id}`}
              className={`
                h-1.5
                rounded-full
                transition-all
                duration-300
                ${
                  index === activeIndex
                    ? "w-7 bg-primary"
                    : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                }
              `}
            />
          ))}
        </div>
      )}

      {/* Active Resource Info */}
      <div className="-mt-8 text-center text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {addons[activeIndex]?.title ?? addons[activeIndex]?.id}
        </span>

        <span className="mx-1.5">—</span>

        <span>
          {activeIndex + 1} of {addons.length}
        </span>
      </div>
    </div>
  );
}