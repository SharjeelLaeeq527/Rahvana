"use client";

import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  maxOpacity?: number;
  minOpacity?: number;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  minOpacity = 0.05,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const memoizedColor = useMemo(() => {
    const temp = color.includes("rgb") ? color : hexToRgb(color) || "rgb(0, 0, 0)";
    return temp.replace("rgb(", "").replace(")", "");
  }, [color]);

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
      : null;
  }

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, container: HTMLDivElement) => {
      const canvasWidth = width || container.clientWidth;
      const canvasHeight = height || container.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      const cols = Math.floor(canvasWidth / (squareSize + gridGap));
      const rows = Math.floor(canvasHeight / (squareSize + gridGap));

      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = minOpacity + Math.random() * (maxOpacity - minOpacity);
      }

      return {
        cols,
        rows,
        squares,
        dpr,
      };
    },
    [squareSize, gridGap, width, height, maxOpacity]
  );

  const updateSquares = useCallback(
    (squares: Float32Array, flickerChance: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance) {
          squares[i] = minOpacity + Math.random() * (maxOpacity - minOpacity);
        }
      }
    },
    [maxOpacity]
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number
    ) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${memoizedColor}, 1)`;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const opacity = squares[i * rows + j];
          ctx.globalAlpha = opacity;
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr,
            j * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr
          );
        }
      }
    },
    [memoizedColor, squareSize, gridGap]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let { cols, rows, squares, dpr } = setupCanvas(canvas, container);

    const animate = () => {
      updateSquares(squares, flickerChance);
      drawGrid(ctx, canvas.width, canvas.height, cols, rows, squares, dpr);
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      const result = setupCanvas(canvas, container);
      cols = result.cols;
      rows = result.rows;
      squares = result.squares;
      dpr = result.dpr;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(canvas);

    window.addEventListener("resize", handleResize);

    if (isInView) {
      animate();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, flickerChance, isInView]);

  return (
    <div ref={containerRef} className={cn("size-full", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "100%",
        }}
      />
    </div>
  );
};
