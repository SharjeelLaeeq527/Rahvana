"use client";

import React from "react";
import { Trash2, RotateCw } from "lucide-react";

interface SelectionHandlesProps {
  rotation: number;
  onResize: (direction: string) => (e: React.MouseEvent) => void;
  onRotate: (e: React.MouseEvent) => void;
  onDelete: () => void;
}

const DIRECTIONS = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
] as const;

function getCursor(dir: string): string {
  if (dir === "top-left" || dir === "bottom-right") return "nwse-resize";
  if (dir === "top-right" || dir === "bottom-left") return "nesw-resize";
  if (dir === "top" || dir === "bottom") return "ns-resize";
  return "ew-resize";
}

function getPosition(dir: string): React.CSSProperties {
  switch (dir) {
    case "top-left":
      return { top: "-6px", left: "-6px" };
    case "top":
      return { top: "-6px", left: "50%", transform: "translateX(-50%)" };
    case "top-right":
      return { top: "-6px", right: "-6px" };
    case "right":
      return { top: "50%", right: "-6px", transform: "translateY(-50%)" };
    case "bottom-right":
      return { bottom: "-6px", right: "-6px" };
    case "bottom":
      return { bottom: "-6px", left: "50%", transform: "translateX(-50%)" };
    case "bottom-left":
      return { bottom: "-6px", left: "-6px" };
    case "left":
      return { top: "50%", left: "-6px", transform: "translateY(-50%)" };
    default:
      return {};
  }
}

export default function SelectionHandles({
  rotation,
  onResize,
  onRotate,
  onDelete,
}: SelectionHandlesProps) {
  return (
    <>
      {/* Circle Resize Handles (blue outline, white fill) - 8 handles */}
      {DIRECTIONS.map((dir) => (
        <div
          key={dir}
          onMouseDown={onResize(dir)}
          className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full shadow-sm hover:scale-110 transition"
          style={{
            cursor: getCursor(dir),
            ...getPosition(dir),
          }}
        />
      ))}

      {/* ROTATE HANDLE + CONNECTOR LINE - Counter-rotate to stay upright */}
      <div
        className="absolute left-1/2 -top-10 w-0.5 h-6 bg-blue-400"
        style={{ transform: `translateX(-50%) rotate(${-rotation}deg)` }}
      />

      <div
        onMouseDown={onRotate}
        className="absolute -top-16 left-1/2
                   w-8 h-8 flex items-center justify-center
                   bg-white border border-blue-500 rounded-full
                   cursor-grab shadow-sm hover:scale-105 transition"
        style={{ transform: `translateX(-50%) rotate(${-rotation}deg)` }}
      >
        <RotateCw className="w-4 h-4 text-blue-500" />
      </div>

      {/* DELETE BUTTON - Counter-rotate to stay upright */}
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-16 right-0
                   w-8 h-8 bg-white border border-blue-500 rounded-full
                   flex items-center justify-center shadow-sm
                   hover:bg-red-50 hover:border-red-400
                   transition"
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        <Trash2 className="w-4 h-4 text-blue-500" />
      </button>
    </>
  );
}
