"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";

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
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const transformFullscreenRef = useRef<ReactZoomPanPinchContentRef>(null);

  const handleZoomIn = (inFullscreen = false) => {
    if (inFullscreen) {
      transformFullscreenRef.current?.zoomIn(0.5);
    } else {
      transformRef.current?.zoomIn(0.5);
    }
  };

  const handleZoomOut = (inFullscreen = false) => {
    if (inFullscreen) {
      transformFullscreenRef.current?.zoomOut(0.5);
    } else {
      transformRef.current?.zoomOut(0.5);
    }
  };

  const handleReset = (inFullscreen = false) => {
    if (inFullscreen) {
      transformFullscreenRef.current?.resetTransform();
    } else {
      transformRef.current?.resetTransform();
    }
  };

  const renderControls = (inFullscreenModal = false) => {
    const currentScale = inFullscreenModal ? fullscreenScale : scale;
    const posClass = inFullscreenModal
      ? "top-3 right-3 opacity-100"
      : controlsPosition === "top-right"
        ? "top-2.5 right-2.5 opacity-85 hover:opacity-100 focus-within:opacity-100"
        : "bottom-2.5 right-2.5 opacity-85 hover:opacity-100 focus-within:opacity-100";

    return (
      <div
        className={`absolute ${posClass} z-30 flex items-center gap-0.5 rounded-full border border-[#d0e4f7]/30 bg-[#0c1b33]/85 px-2 py-0.5 text-white shadow-md backdrop-blur-md transition-all duration-200 select-none hover:bg-[#0c1b33]/95`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut(inFullscreenModal);
          }}
          disabled={currentScale <= 1.01}
          title="Zoom out"
          aria-label="Zoom out"
          className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ZoomOut size={13} />
        </button>

        <span className="min-w-[34px] px-1 text-center font-mono text-[10.5px] font-bold tracking-tight text-white/95">
          {Math.round(currentScale * 100)}%
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn(inFullscreenModal);
          }}
          disabled={currentScale >= 3.49}
          title="Zoom in"
          aria-label="Zoom in"
          className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ZoomIn size={13} />
        </button>

        {currentScale > 1.01 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset(inFullscreenModal);
            }}
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
              setFullscreenScale(1);
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

  const renderImageContent = () => {
    if (isStandardImg || !fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-contain pointer-events-none ${className}`}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        className={`pointer-events-none ${className}`}
      />
    );
  };

  return (
    <>
      <div className="group relative h-full w-full overflow-hidden select-none touch-none">
        {renderControls(false)}
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1}
          maxScale={3.5}
          centerOnInit
          centerZoomedOut
          wheel={{ step: 0.15 }}
          pinch={{ disabled: false }}
          panning={{ disabled: false }}
          doubleClick={{ disabled: false, mode: "reset" }}
          onTransform={(ref) => setScale(ref.state.scale)}
        >
          <TransformComponent
            wrapperClass={`relative h-full w-full touch-none overflow-hidden select-none flex items-center justify-center ${
              scale > 1.01 ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            contentClass="relative h-full w-full flex items-center justify-center"
          >
            {renderImageContent()}
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          className="animate-in fade-in fixed inset-0 z-[99999] flex items-center justify-center bg-[#0c1b33]/65 p-3 backdrop-blur-md duration-200 sm:p-6"
          onClick={() => {
            setIsFullscreen(false);
            setFullscreenScale(1);
          }}
        >
          <div
            className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0f1f38] shadow-2xl touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            {renderControls(true)}
            <TransformWrapper
              ref={transformFullscreenRef}
              initialScale={1}
              minScale={1}
              maxScale={3.5}
              centerOnInit
              centerZoomedOut
              wheel={{ step: 0.15 }}
              pinch={{ disabled: false }}
              panning={{ disabled: false }}
              doubleClick={{ disabled: false, mode: "reset" }}
              onTransform={(ref) => setFullscreenScale(ref.state.scale)}
            >
              <TransformComponent
                wrapperClass={`relative h-full w-full touch-none overflow-hidden select-none flex items-center justify-center p-3 sm:p-5 ${
                  fullscreenScale > 1.01 ? "cursor-grab active:cursor-grabbing" : ""
                }`}
                contentClass="relative h-full w-full flex items-center justify-center"
              >
                {isStandardImg ? (
                  <img
                    src={src}
                    alt={alt}
                    className="max-h-full max-w-full object-contain drop-shadow-sm pointer-events-none"
                  />
                ) : (
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    quality={100}
                    className="object-contain drop-shadow-sm pointer-events-none"
                  />
                )}
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      )}
    </>
  );
}
