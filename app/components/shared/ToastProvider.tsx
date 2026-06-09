"use client";

import React, { createContext, useContext, useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "info" | "success" | "error" | "loading";

interface Toast {
  id: number | string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    options?: { id?: string | number; duration?: number }
  ) => string | number;

  updateToast: (
    id: string | number,
    message: string,
    type?: ToastType
  ) => void;

  dismissToast: (id: string | number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ✅ NEW: showToast returns id + supports optional custom id
  const showToast = (
    message: string,
    type: ToastType = "info",
    options?: { id?: string | number; duration?: number }
  ) => {
    const id = options?.id ?? Date.now() + Math.random();

    setToasts((prev) => {
      // if same id exists → replace it (important for loading updates)
      const filtered = prev.filter((t) => t.id !== id);
      return [...filtered, { id, message, type }];
    });

    // auto remove (skip for loading if you want persistent)
    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, options?.duration ?? 4000);
    }

    return id;
  };

  // ✅ NEW: update existing toast (loading → success/error)
  const updateToast = (
    id: string | number,
    message: string,
    type: ToastType = "info"
  ) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message, type } : t))
    );

    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }
  };

  // ✅ NEW: manual remove
  const dismissToast = (id: string | number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, updateToast, dismissToast }}>
      {children}

      <div className="fixed bottom-6 left-0 right-0 sm:left-auto sm:right-6 sm:w-auto flex flex-col items-center sm:items-end px-4 sm:px-0 space-y-3 z-50">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isError = toast.type === "error";
            const isSuccess = toast.type === "success";
            const isLoading = toast.type === "loading";

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`border shadow-lg rounded-xl px-4 py-3.5 md:px-6 md:py-4 flex items-start gap-3.5 max-w-[90vw] sm:max-w-md ${
                  isError
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {isError ? (
                  <Icons.XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                ) : isSuccess ? (
                  <Icons.CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : isLoading ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mt-0.5" />
                ) : (
                  <Icons.Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                )}

                <span className="text-sm leading-relaxed">
                  {toast.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};