// C:\Users\HP\Desktop\arachnie\Arachnie\app\components\signature-tool\DraggableSignature.tsx
"use client";

import React, { useRef, useEffect } from "react";
import SelectionHandles from "../../shared/SelectionHandles";

type SignatureAnnotation = {
  id: string;
  pageIndex: number;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

interface DraggableSignatureProps {
  data: SignatureAnnotation;
  onUpdate: (id: string, patch: Partial<SignatureAnnotation>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  scale: number;
  isSelected: boolean;
}

export default function DraggableSignature({
  data,
  onUpdate,
  onDelete,
  onSelect,
  scale,
  isSelected,
}: DraggableSignatureProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const rotation = data.rotation || 0;

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) {
        // Parent will handle deselection
      }
    };
    if (isSelected) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelected]);

  // Drag
  const handleDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = data.x * scale;
    const startPosY = data.y * scale;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      onUpdate(data.id, {
        x: (startPosX + deltaX) / scale,
        y: (startPosY + deltaY) / scale,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Resize (8 handles like text tool)
  const handleResize = (direction: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = data.width;
    const startHeight = data.height;
    const startXPos = data.x;
    const startYPos = data.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      const minSize = 30;

      switch (direction) {
        case "top-left":
          newWidth = Math.max(minSize, startWidth - deltaX);
          newHeight = Math.max(minSize, startHeight - deltaY);
          newX = startXPos + deltaX;
          newY = startYPos + deltaY;
          break;
        case "top":
          newHeight = Math.max(minSize, startHeight - deltaY);
          newY = startYPos + deltaY;
          break;
        case "top-right":
          newWidth = Math.max(minSize, startWidth + deltaX);
          newHeight = Math.max(minSize, startHeight - deltaY);
          newY = startYPos + deltaY;
          break;
        case "right":
          newWidth = Math.max(minSize, startWidth + deltaX);
          break;
        case "bottom-right":
          newWidth = Math.max(minSize, startWidth + deltaX);
          newHeight = Math.max(minSize, startHeight + deltaY);
          break;
        case "bottom":
          newHeight = Math.max(minSize, startHeight + deltaY);
          break;
        case "bottom-left":
          newWidth = Math.max(minSize, startWidth - deltaX);
          newHeight = Math.max(minSize, startHeight + deltaY);
          newX = startXPos + deltaX;
          break;
        case "left":
          newWidth = Math.max(minSize, startWidth - deltaX);
          newX = startXPos + deltaX;
          break;
      }

      onUpdate(data.id, { width: newWidth, height: newHeight, x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Rotate
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      onUpdate(data.id, { rotation: Math.round(angle) });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={nodeRef}
      className="absolute select-none"
      style={{
        left: `${data.x * scale}px`,
        top: `${data.y * scale}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        zIndex: isSelected ? 100 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isSelected) onSelect(data.id);
      }}
    >
      <div
        className={`relative ${
          isSelected
            ? "ring-1 ring-blue-400 cursor-move"
            : "hover:ring-1 hover:ring-blue-300 cursor-pointer"
        } rounded-md transition-all`}
        style={{
          width: `${data.width * scale}px`,
          height: `${data.height * scale}px`,
        }}
        onMouseDown={(e) => {
          if (isSelected) handleDrag(e);
        }}
      >
        {/* Signature Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image}
          alt="Signature"
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
        />

        {/* SELECTION HANDLES - Shared Component */}
        {isSelected && (
          <SelectionHandles
            rotation={rotation}
            onResize={handleResize}
            onRotate={handleRotate}
            onDelete={() => onDelete(data.id)}
          />
        )}
      </div>
    </div>
  );
}
