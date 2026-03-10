"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Crop, Move, Check } from "lucide-react"
import { useLanguage } from "@/app/context/LanguageContext"

interface CropBox {
  x: number
  y: number
  width: number
  height: number
}

interface CropToolProps {
  currentImage: string
  onApplyCrop: (croppedDataUrl: string) => void
  onToggleTilt: () => void
  onExit: () => void
}

export default function CropTool({
  currentImage,
  onApplyCrop,
  onToggleTilt,
  // onExit,
}: CropToolProps) {
  const { t } = useLanguage()
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<"move" | "nw" | "ne" | "sw" | "se" | "rotate" | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // When image loads, set up initial crop box
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return

    const img = imageRef.current
    const displayedWidth = img.offsetWidth
    const displayedHeight = img.offsetHeight

    setImageBounds({ width: displayedWidth, height: displayedHeight })
    setImageLoaded(true)

    // Auto-detect signature bounds
    detectSignatureBounds(displayedWidth, displayedHeight)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImage])

  const detectSignatureBounds = useCallback((displayedWidth: number, displayedHeight: number) => {
    const img = document.createElement("img")
    img.crossOrigin = "anonymous"
    img.src = currentImage

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) {
        // Fallback: set crop box to full image
        setCropBox({ x: 0, y: 0, width: displayedWidth, height: displayedHeight })
        return
      }

      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      let minX = canvas.width
      let minY = canvas.height
      let maxX = 0
      let maxY = 0

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4
          const alpha = data[i + 3]

          if (alpha > 50) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      // Add padding
      const padding = Math.min(canvas.width, canvas.height) * 0.05
      minX = Math.max(0, minX - padding)
      minY = Math.max(0, minY - padding)
      maxX = Math.min(canvas.width, maxX + padding)
      maxY = Math.min(canvas.height, maxY + padding)

      // Scale from original pixels to displayed pixels
      const scaleX = displayedWidth / canvas.width
      const scaleY = displayedHeight / canvas.height

      setCropBox({
        x: minX * scaleX,
        y: minY * scaleY,
        width: (maxX - minX) * scaleX,
        height: (maxY - minY) * scaleY,
      })
    }

    img.onerror = () => {
      // Fallback
      setCropBox({ x: 0, y: 0, width: displayedWidth, height: displayedHeight })
    }
  }, [currentImage])

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "nw" | "ne" | "sw" | "se" | "rotate") => {
    e.preventDefault()
    e.stopPropagation()

    if (type === "rotate") {
      setIsRotating(true)
      setDragType("rotate")
    } else {
      setIsDragging(true)
      setDragType(type)
    }
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if ((!isDragging && !isRotating) || !dragType || !containerRef.current) return

    if (dragType === "rotate") {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + cropBox.x + cropBox.width / 2
      const centerY = rect.top + cropBox.y + cropBox.height / 2

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const degrees = (angle * 180) / Math.PI
      setRotation(Math.round(degrees))
      return
    }

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    const maxWidth = imageBounds.width
    const maxHeight = imageBounds.height

    setCropBox((prev) => {
      let newBox = { ...prev }
      const minSize = 30

      if (dragType === "move") {
        newBox.x = Math.max(0, Math.min(maxWidth - prev.width, prev.x + deltaX))
        newBox.y = Math.max(0, Math.min(maxHeight - prev.height, prev.y + deltaY))
      } else {
        if (dragType === "nw") {
          const newX = Math.max(0, prev.x + deltaX)
          const newY = Math.max(0, prev.y + deltaY)
          const newWidth = prev.width - (newX - prev.x)
          const newHeight = prev.height - (newY - prev.y)
          if (newWidth >= minSize && newHeight >= minSize) {
            newBox = { x: newX, y: newY, width: newWidth, height: newHeight }
          }
        } else if (dragType === "ne") {
          const newY = Math.max(0, prev.y + deltaY)
          const newWidth = Math.min(maxWidth - prev.x, Math.max(minSize, prev.width + deltaX))
          const newHeight = prev.height - (newY - prev.y)
          if (newHeight >= minSize) {
            newBox = { ...prev, y: newY, width: newWidth, height: newHeight }
          }
        } else if (dragType === "sw") {
          const newX = Math.max(0, prev.x + deltaX)
          const newWidth = prev.width - (newX - prev.x)
          const newHeight = Math.min(maxHeight - prev.y, Math.max(minSize, prev.height + deltaY))
          if (newWidth >= minSize) {
            newBox = { x: newX, y: prev.y, width: newWidth, height: newHeight }
          }
        } else if (dragType === "se") {
          newBox = {
            ...prev,
            width: Math.min(maxWidth - prev.x, Math.max(minSize, prev.width + deltaX)),
            height: Math.min(maxHeight - prev.y, Math.max(minSize, prev.height + deltaY)),
          }
        }
      }

      return newBox
    })

    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, isRotating, dragType, dragStart, cropBox, imageBounds])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsRotating(false)
    setDragType(null)
  }, [])

  useEffect(() => {
    if (isDragging || isRotating) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isRotating, handleMouseMove, handleMouseUp])

  const handleApplyCrop = async () => {
    if (!currentImage || !imageRef.current) return

    try {
      const img = document.createElement("img")
      img.crossOrigin = "anonymous"
      img.src = currentImage

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const displayedWidth = imageRef.current.offsetWidth
      const displayedHeight = imageRef.current.offsetHeight

      // Scale from displayed size to actual image size
      const scaleX = img.naturalWidth / displayedWidth
      const scaleY = img.naturalHeight / displayedHeight

      // Convert crop box from displayed coordinates to actual image coordinates
      const actualCropX = Math.round(cropBox.x * scaleX)
      const actualCropY = Math.round(cropBox.y * scaleY)
      const actualCropWidth = Math.round(cropBox.width * scaleX)
      const actualCropHeight = Math.round(cropBox.height * scaleY)

      // Clamp to image bounds
      const finalX = Math.max(0, Math.min(actualCropX, img.naturalWidth - 1))
      const finalY = Math.max(0, Math.min(actualCropY, img.naturalHeight - 1))
      const finalWidth = Math.min(actualCropWidth, img.naturalWidth - finalX)
      const finalHeight = Math.min(actualCropHeight, img.naturalHeight - finalY)

      let finalImageData: string

      if (rotation !== 0) {
        // First rotate the entire image
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d", { alpha: true })
        if (!tempCtx) throw new Error("Canvas context unavailable")

        const radians = (rotation * Math.PI) / 180
        const cos = Math.abs(Math.cos(radians))
        const sin = Math.abs(Math.sin(radians))
        const rotatedWidth = img.naturalWidth * cos + img.naturalHeight * sin
        const rotatedHeight = img.naturalWidth * sin + img.naturalHeight * cos

        tempCanvas.width = rotatedWidth
        tempCanvas.height = rotatedHeight

        // Clear with transparent background
        tempCtx.clearRect(0, 0, rotatedWidth, rotatedHeight)

        tempCtx.save()
        tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2)
        tempCtx.rotate(radians)
        tempCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
        tempCtx.restore()

        // Then crop from the rotated image
        const finalCanvas = document.createElement("canvas")
        const finalCtx = finalCanvas.getContext("2d", { alpha: true })
        if (!finalCtx) throw new Error("Final canvas context unavailable")

        finalCanvas.width = finalWidth
        finalCanvas.height = finalHeight

        // Clear with transparent background
        finalCtx.clearRect(0, 0, finalWidth, finalHeight)

        const offsetX = (rotatedWidth - img.naturalWidth) / 2
        const offsetY = (rotatedHeight - img.naturalHeight) / 2

        finalCtx.drawImage(
          tempCanvas,
          finalX + offsetX,
          finalY + offsetY,
          finalWidth,
          finalHeight,
          0,
          0,
          finalWidth,
          finalHeight
        )
        finalImageData = finalCanvas.toDataURL("image/png")
      } else {
        // Simple crop without rotation
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) throw new Error("Canvas context unavailable")

        canvas.width = finalWidth
        canvas.height = finalHeight

        // Clear with transparent background
        ctx.clearRect(0, 0, finalWidth, finalHeight)

        ctx.drawImage(
          img,
          finalX,
          finalY,
          finalWidth,
          finalHeight,
          0,
          0,
          finalWidth,
          finalHeight
        )
        finalImageData = canvas.toDataURL("image/png")
      }

      onApplyCrop(finalImageData)
    } catch (error) {
      console.error("Crop error:", error)
      alert(t("pdfProcessing.editor.signature.failed"))
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-900">{t("pdfProcessing.editor.crop.title")}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleApplyCrop}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-base shadow-md"
            >
              <Crop className="w-5 h-5" />
              {t("signatureProcessing.crop")}
            </button>
            <button
              onClick={onToggleTilt}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-base shadow-md"
            >
              <Move className="w-5 h-5" />
              {t("pdfProcessing.editor.crop.tilt")}
            </button>
            <button
              onClick={async () => {
                // Apply crop first, then exit
                await handleApplyCrop()
                setRotation(0)
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-base shadow-md"
            >
              <Check className="w-5 h-5" />
              {t("signatureProcessing.done")}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div
          className="p-8 flex items-center justify-center"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
              linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
              linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        >
          {/* This container wraps ONLY the image and crop overlay - they share exact same size */}
          <div
            ref={containerRef}
            className="relative inline-block"
            style={{
              width: imageLoaded ? `${imageBounds.width}px` : 'auto',
              height: imageLoaded ? `${imageBounds.height}px` : 'auto',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={currentImage}
              alt="Signature"
              className="block max-w-full max-h-[500px] rounded-xl select-none border-2 border-gray-300 shadow-md"
              draggable={false}
              onLoad={handleImageLoad}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isRotating ? "none" : "transform 0.1s ease-out",
              }}
            />

            {imageLoaded && (
              <>
                {/* Dark overlay with cutout for crop area */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{
                    background: `
                      linear-gradient(to right, rgba(0,0,0,0.5) ${cropBox.x}px, transparent ${cropBox.x}px),
                      linear-gradient(to left, rgba(0,0,0,0.5) ${imageBounds.width - cropBox.x - cropBox.width}px, transparent ${imageBounds.width - cropBox.x - cropBox.width}px),
                      linear-gradient(to bottom, rgba(0,0,0,0.5) ${cropBox.y}px, transparent ${cropBox.y}px),
                      linear-gradient(to top, rgba(0,0,0,0.5) ${imageBounds.height - cropBox.y - cropBox.height}px, transparent ${imageBounds.height - cropBox.y - cropBox.height}px)
                    `,
                  }}
                />

                {/* Crop box */}
                <div
                  className="absolute border-[3px] border-purple-600 cursor-move"
                  style={{
                    left: `${cropBox.x}px`,
                    top: `${cropBox.y}px`,
                    width: `${cropBox.width}px`,
                    height: `${cropBox.height}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "move")}
                >
                  {/* Corner handles */}
                  <div
                    className="absolute -left-3 -top-3 w-6 h-6 bg-purple-600 border-[3px] border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform z-10 shadow-lg"
                    onMouseDown={(e) => handleMouseDown(e, "nw")}
                  />
                  <div
                    className="absolute -right-3 -top-3 w-6 h-6 bg-purple-600 border-[3px] border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform z-10 shadow-lg"
                    onMouseDown={(e) => handleMouseDown(e, "ne")}
                  />
                  <div
                    className="absolute -left-3 -bottom-3 w-6 h-6 bg-purple-600 border-[3px] border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform z-10 shadow-lg"
                    onMouseDown={(e) => handleMouseDown(e, "sw")}
                  />
                  <div
                    className="absolute -right-3 -bottom-3 w-6 h-6 bg-purple-600 border-[3px] border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform z-10 shadow-lg"
                    onMouseDown={(e) => handleMouseDown(e, "se")}
                  />

                  {/* Rotation handle */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-20"
                    style={{ top: "-60px" }}
                    onMouseDown={(e) => handleMouseDown(e, "rotate")}
                  >
                    <div className="w-1 h-10 bg-purple-600 rounded-full"></div>
                    <div className="w-8 h-8 bg-purple-600 border-[3px] border-white rounded-full hover:scale-125 transition-transform shadow-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    {isRotating && (
                      <div className="absolute -bottom-10 bg-purple-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                        {rotation}°
                      </div>
                    )}
                  </div>

                  {/* Grid lines */}
                  <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-white/50" />
                  <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-white/50" />
                  <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-white/50" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-0.5 bg-white/50" />
                </div>

                {/* Rotation indicator */}
                {rotation !== 0 && !isRotating && (
                  <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-3 text-base">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {t("editor.crop.rotated", { degrees: rotation })}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setRotation(0)
                      }}
                      className="ml-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition font-bold"
                    >
                      {t("editor.crop.reset")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center max-w-2xl">
          <p className="text-gray-700 font-medium">
            {t("editor.crop.tip")}
          </p>
        </div>
      </div>
    </div>
  )
}
