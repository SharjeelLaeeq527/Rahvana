"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: string;
  showCloseButton?: boolean;
  showDragHandle?: boolean;
  className?: string;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = "80vh",
  showCloseButton = true,
  showDragHandle = true,
  className = "",
}: MobileBottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 260,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) {
                onClose();
              }
            }}
            className={`fixed right-0 bottom-0 left-0 z-50 flex flex-col rounded-t-3xl bg-white shadow-2xl ${className}`}
            style={{ height }}
          >
            {/* Drag Handle */}
            {showDragHandle && (
              <div className="flex shrink-0 flex-col items-center rounded-t-3xl border-b bg-gray-50 py-3">
                <div className="mb-1 h-1.5 w-12 rounded-full bg-gray-400" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
                {title ? <h2 className="text-lg font-bold text-gray-900">{title}</h2> : <div />}

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
