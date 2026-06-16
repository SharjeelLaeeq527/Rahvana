"use client";

import { motion } from "framer-motion";
import { Menu, BookOpen, Check } from "lucide-react";
import { Loader } from "@/components/ui/spinner";

interface HeaderProps {
  formTitle?: string;
  formSubtitle?: string;
  onOpenMenu?: () => void;
  showMenu?: boolean;
  isAutoSaving?: boolean;
  lastSavedAt?: string | null;
}

export function Header({
  formTitle,
  formSubtitle,
  onOpenMenu,
  showMenu,
  isAutoSaving,
  lastSavedAt,
}: HeaderProps) {
  return (
    <div
      className="mt-12 backdrop-blur-xl border-b z-30"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        borderColor: "rgba(13, 115, 119, 0.08)",
      }}
    >
      <div className="px-4 md:px-8 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          {/* Hamburger */}
          {showMenu && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onOpenMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-[#e8f6f6] transition"
              style={{ color: "#0d7377" }}
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          )}

          {/* Icon */}
          <div
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #0d7377 0%, #14a0a6 100%)",
            }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">
              {formTitle || "Form"}
            </h1>
            {formSubtitle && (
              <p className="text-xs md:text-sm text-gray-500 truncate">{formSubtitle}</p>
            )}
          </div>

          {(isAutoSaving || lastSavedAt) && (
            <div className="ml-auto flex items-center">
              {isAutoSaving ? (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border"
                  style={{
                    background: "#f3f4f6",
                    borderColor: "#d1d5db",
                    color: "#4b5563",
                  }}
                >
                  <Loader size="sm" />
                  <span className="text-xs font-medium tracking-[0.01em]">Saving</span>
                </div>
              ) : lastSavedAt ? (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border"
                  style={{
                    background: "rgba(232, 246, 246, 0.65)",
                    borderColor: "#caeaea",
                    color: "#0a5a5d",
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center rounded-full"
                    style={{
                      width: 18,
                      height: 18,
                      background: "#0d7377",
                      color: "#fff",
                    }}
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  <span className="text-xs font-medium tracking-[0.01em]">Saved</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
