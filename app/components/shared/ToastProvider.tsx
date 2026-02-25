"use client";

import React, { createContext, useContext, useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-6 right-6 space-y-3 z-50">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isError = toast.type === "error";
            const isSuccess = toast.type === "success";

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`border shadow-lg rounded-xl px-6 py-4 flex items-center gap-3 ${
                  isError
                    ? "bg-red-50 border-red-200 text-red-800"
                    : isSuccess
                      ? "bg-card border-border text-foreground"
                      : "bg-card border-border text-foreground"
                }`}
              >
                {isError ? (
                  <Icons.XCircle className="w-5 h-5 text-red-500" />
                ) : isSuccess ? (
                  <Icons.CheckCircle className="w-5 h-5 text-rahvana-primary" />
                ) : (
                  <Icons.Info className="w-5 h-5 text-blue-500" />
                )}
                <span>{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
