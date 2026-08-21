"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X } from "lucide-react";

interface ZoomableGuideImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  isStandardImg?: boolean;
  controlsPosition?: "top-right" | "bottom-right";
}

export function ZoomableGuideImage({
  src,
  alt,
  fill = false,
  className = "object-contain",
  sizes,
  quality = 95,
  priority = false,
  isStandardImg = false,
  controlsPosition = "bottom-right",
}: ZoomableGuideImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1 || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const renderControls = (inFullscreenModal = false) => {
    const posClass = inFullscreenModal
      ? "top-3 right-3 opacity-100"
      : controlsPosition === "top-right"
        ? "top-2.5 right-2.5 opacity-85 hover:opacity-100 focus-within:opacity-100"
        : "bottom-2.5 right-2.5 opacity-85 hover:opacity-100 focus-within:opacity-100";

    return (
      <div
        className={`absolute ${posClass} z-30 flex items-center gap-0.5 rounded-full border border-[#d0e4f7]/30 bg-[#0c1b33]/85 px-2 py-0.5 text-white shadow-md backdrop-blur-md transition-all duration-200 select-none hover:bg-[#0c1b33]/95`}
      >
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          title="Zoom out"
          aria-label="Zoom out"
          className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ZoomOut size={13} />
        </button>

        <span className="min-w-[34px] px-1 text-center font-mono text-[10.5px] font-bold tracking-tight text-white/95">
          {Math.round(scale * 100)}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={scale >= 3.5}
          title="Zoom in"
          aria-label="Zoom in"
          className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ZoomIn size={13} />
        </button>

        {scale > 1 && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset zoom"
            aria-label="Reset zoom"
            className="ml-0.5 flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95"
          >
            <RotateCcw size={12} />
          </button>
        )}

        {!inFullscreenModal && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            title="Full screen view"
            aria-label="Toggle fullscreen"
            className="ml-0.5 flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95"
          >
            <Maximize2 size={12} />
          </button>
        )}

        {inFullscreenModal && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
              handleReset();
            }}
            title="Close fullscreen"
            aria-label="Close fullscreen"
            className="ml-0.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white/15 text-white transition-all hover:bg-rose-500/90 active:scale-95"
          >
            <X size={13} />
          </button>
        )}
      </div>
    );
  };

  const imageStyle: React.CSSProperties = {
    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
    transition: isDragging ? "none" : "transform 0.2s ease-out",
  };

  const imageElement = isStandardImg ? (
    <img src={src} alt={alt} className={`h-full w-full ${className}`} style={imageStyle} />
  ) : fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={className}
      style={imageStyle}
    />
  ) : (
    <img src={src} alt={alt} className={`h-full w-full ${className}`} style={imageStyle} />
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`group relative h-full w-full overflow-hidden select-none ${
          scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderControls(false)}
        {imageElement}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          className="animate-in fade-in fixed inset-0 z-[99999] flex items-center justify-center bg-[#0c1b33]/65 p-3 backdrop-blur-md duration-200 sm:p-6"
          onClick={() => {
            setIsFullscreen(false);
            handleReset();
          }}
        >
          <div
            className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0f1f38] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {renderControls(true)}
            <div
              className={`relative flex h-full w-full items-center justify-center overflow-hidden p-3 sm:p-5 ${
                scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {isStandardImg ? (
                <img
                  src={src}
                  alt={alt}
                  className="max-h-full max-w-full object-contain drop-shadow-sm"
                  style={imageStyle}
                />
              ) : (
                <Image
                  src={src}
                  alt={alt}
                  fill
                  quality={100}
                  className="object-contain drop-shadow-sm"
                  style={imageStyle}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
