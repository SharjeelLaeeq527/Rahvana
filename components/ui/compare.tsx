"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
}

export const Compare = ({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
}: CompareProps) => {
  const [sliderPercentage, setSliderPercentage] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let x = 0;

      if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
      } else {
        x = (e as MouseEvent).clientX - rect.left;
      }

      const percentage = (x / rect.width) * 100;
      setSliderPercentage(Math.min(Math.max(percentage, 0), 100));
    },
    []
  );

  const onMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
      handleMouseMove(e);
    }
  };

  const onTouchMove = (e: React.TouchEvent | TouchEvent) => {
    if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
      handleMouseMove(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden cursor-ew-resize", className)}
      onMouseMove={onMouseMove}
      onMouseDown={() => slideMode === "drag" && setIsDragging(true)}
      onMouseUp={() => slideMode === "drag" && setIsDragging(false)}
      onMouseLeave={() => slideMode === "drag" && setIsDragging(false)}
      onTouchStart={() => slideMode === "drag" && setIsDragging(true)}
      onTouchEnd={() => slideMode === "drag" && setIsDragging(false)}
      onTouchMove={onTouchMove}
    >
      <div
        className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
        style={{ width: `${sliderPercentage}%` }}
      >
        <img
          src={firstImage}
          alt="first image"
          className={cn(
            "absolute inset-0 h-full w-auto max-w-none object-cover object-left",
            firstImageClassName
          )}
          style={{ width: containerRef.current?.offsetWidth }}
        />
      </div>
      <div className="relative w-full h-full">
        <img
          src={secondImage}
          alt="second image"
          className={cn("h-full w-full object-cover object-left", secondImageClassname)}
        />
      </div>
      {showHandlebar && (
        <div
          className="absolute inset-y-0 z-30 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{ left: `${sliderPercentage}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#0d7377]" />
          </div>
        </div>
      )}
    </div>
  );
};
