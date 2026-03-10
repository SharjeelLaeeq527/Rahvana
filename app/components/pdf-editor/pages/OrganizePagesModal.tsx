"use client"

import type React from "react"
import { useState, useEffect } from "react"
import NextImage from "next/image"
import { usePDFStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Trash2, RotateCw, X, Save, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/app/context/LanguageContext"

interface PageItem {
  index: number
  thumbnail: string
  rotation: number
  originalIndex: number
}

interface OrganizePagesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OrganizePagesModal({ isOpen, onClose }: OrganizePagesModalProps) {
  const { pdfFile, pageModifications, setPageModifications, setCurrentPage } = usePDFStore()
  const { t } = useLanguage()
  const [pages, setPages] = useState<PageItem[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [draggedPage, setDraggedPage] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen || !pdfFile) return
    loadPDF()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pdfFile])

  const loadPDF = async () => {
    try {
      if (!pdfFile) return

      const pdfjs = await import("pdfjs-dist")
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

      const pdf = await pdfjs.getDocument(await pdfFile.arrayBuffer()).promise
      const pageItems: PageItem[] = []

      // If modifications exist, use them, otherwise load all pages
      if (pageModifications.length > 0) {
        const activeMods = pageModifications.filter(mod => !mod.deleted)
        
        for (const mod of activeMods) {
          const pageNum = mod.originalIndex + 1
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 0.5, rotation: mod.rotation })
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")

          if (context) {
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: context, viewport }).promise
            pageItems.push({
              index: pageItems.length,
              thumbnail: canvas.toDataURL(),
              rotation: mod.rotation,
              originalIndex: mod.originalIndex,
            })
          }
        }
      } else {
        // Load all pages with no modifications
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 0.5 })
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")

          if (context) {
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: context, viewport }).promise
            pageItems.push({
              index: i - 1,
              thumbnail: canvas.toDataURL(),
              rotation: 0,
              originalIndex: i - 1,
            })
          }
        }
      }

      setPages(pageItems)
    } catch (error) {
      console.error("Error loading PDF pages:", error)
    }
  }

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      alert("Cannot delete the last page!")
      return
    }
    if (confirm("Are you sure you want to delete this page?")) {
      const newPages = pages.filter((_, i) => i !== index)
      setPages(newPages)
      
      const newSelected = new Set(selectedPages)
      newSelected.delete(index)
      const adjusted = new Set<number>()
      newSelected.forEach(idx => {
        if (idx > index) adjusted.add(idx - 1)
        else if (idx < index) adjusted.add(idx)
      })
      setSelectedPages(adjusted)
    }
  }

  const handleDuplicatePage = (index: number) => {
    const pageToDuplicate = pages[index]
    const newPage = {
      ...pageToDuplicate,
      index: pages.length,
    }
    const newPages = [...pages]
    newPages.splice(index + 1, 0, newPage)
    
    // Update indices
    newPages.forEach((page, idx) => {
      page.index = idx
    })
    
    setPages(newPages)
  }

  const handleRotatePage = async (index: number) => {
    const page = pages[index]
    const newRotation = (page.rotation + 90) % 360
    
    // Update rotation immediately for instant feedback
    setPages(pages.map((p, i) => 
      i === index 
        ? { ...p, rotation: newRotation }
        : p
    ))
    
    // Regenerate thumbnail with new rotation
    try {
      const pdfjs = await import("pdfjs-dist")
      const pdf = await pdfjs.getDocument(await pdfFile!.arrayBuffer()).promise
      const pdfPage = await pdf.getPage(page.originalIndex + 1)
      const viewport = pdfPage.getViewport({ scale: 0.5, rotation: newRotation })
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = viewport.width
        canvas.height = viewport.height
        await pdfPage.render({ canvasContext: context, viewport }).promise
        
        // Update thumbnail with rotated version
        setPages(prev => prev.map((p, i) => 
          i === index 
            ? { ...p, thumbnail: canvas.toDataURL(), rotation: newRotation }
            : p
        ))
      }
    } catch (error) {
      console.error("Error rotating page:", error)
    }
  }

  const handleToggleSelect = (index: number, shift: boolean) => {
    if (shift && selectedPages.size > 0) {
      const lastSelected = Array.from(selectedPages).pop()
      if (lastSelected !== undefined) {
        const start = Math.min(lastSelected, index)
        const end = Math.max(lastSelected, index)
        const newSelected = new Set<number>()
        for (let i = start; i <= end; i++) {
          newSelected.add(i)
        }
        setSelectedPages(newSelected)
      }
    } else {
      const newSelected = new Set(selectedPages)
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
      setSelectedPages(newSelected)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedPage(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (dropIndex: number) => {
    if (draggedPage === null || draggedPage === dropIndex) return

    const newPages = [...pages]
    const [draggedItem] = newPages.splice(draggedPage, 1)
    newPages.splice(dropIndex, 0, draggedItem)
    
    // Update indices
    newPages.forEach((page, idx) => {
      page.index = idx
    })
    
    setPages(newPages)
    setDraggedPage(null)
  }

  const handleBulkDelete = () => {
    if (selectedPages.size === 0) return
    if (selectedPages.size >= pages.length) {
      alert(t("pdfProcessing.editor.organizePages.allPagesDeletedAlert"))
      return
    }
    if (confirm(t("pdfProcessing.editor.organizePages.bulkDeleteConfirm", { count: selectedPages.size }))) {
      setPages(pages.filter((_, i) => !selectedPages.has(i)))
      setSelectedPages(new Set())
    }
  }

  const handleSaveChanges = () => {
    // Convert current pages to page modifications
    const newModifications = pages.map((page) => ({
      originalIndex: page.originalIndex,
      rotation: page.rotation,
      deleted: false,
    }))
    
    // Save to store
    setPageModifications(newModifications)
    
    // Reset to first page
    setCurrentPage(0)
    
    // Close modal
    onClose()
    
    // Show success message
    alert(t("pdfProcessing.editor.organizePages.successAlert"))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-2xl font-bold">{t("pdfProcessing.editor.organizePages.title")}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        {selectedPages.size > 0 && (
          <div className="bg-blue-50 border-b px-6 py-3 flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-900">{t("pdfProcessing.editor.organizePages.selected", { count: selectedPages.size })}</span>
            <button
              onClick={handleBulkDelete}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t("pdfProcessing.editor.organizePages.deleteSelected")}
            </button>
          </div>
        )}

        {/* Pages Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page, index) => (
              <div
                key={`${page.originalIndex}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onClick={(e) => handleToggleSelect(index, e.shiftKey)}
                className={cn(
                  "relative group cursor-move rounded-lg overflow-hidden transition-all hover:scale-105 aspect-3/4",
                  selectedPages.has(index)
                    ? "ring-4 ring-blue-500 shadow-lg"
                    : "hover:shadow-lg border-2 border-gray-200",
                )}
              >
                {/* Thumbnail */}
                <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
                  <NextImage
                    src={page.thumbnail || "/placeholder.svg"}
                    alt={`Page ${index + 1}`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>

                {/* Page Number */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                  {index + 1}
                </div>

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRotatePage(index)
                    }}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition"
                    title={t("pdfProcessing.editor.organizePages.rotateTip")}
                  >
                    <RotateCw className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicatePage(index)
                    }}
                    className="p-2 bg-green-500/90 hover:bg-green-600 text-white rounded-lg transition"
                    title={t("pdfProcessing.editor.organizePages.duplicateTip")}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePage(index)
                    }}
                    className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg transition"
                    title={t("pdfProcessing.editor.organizePages.deleteTip")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Checkmark for selected */}
                {selectedPages.has(index) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {t("pdfProcessing.editor.organizePages.reorderTip", { count: pages.length })}
          </p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              {t("pdfProcessing.editor.signature.cancel")}
            </Button>
            <Button
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {t("pdfProcessing.editor.organizePages.applyChanges")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}