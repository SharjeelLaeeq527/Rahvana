"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  confirmVariant?: "danger" | "primary" | "success"; 
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Delete",
  onConfirm,
  loading = false,
  confirmVariant = "danger", 
}: ConfirmationModalProps) {
  const variantStyles = {
    danger:
      "bg-red-600 hover:bg-red-700 text-white",
    primary:
      "bg-primary hover:bg-primary/90 text-white",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95%] bg-background overflow-hidden rounded-2xl p-0">
        <div className="relative w-full overflow-hidden p-4">
          
          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-red-100/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-36 h-36 rounded-full bg-primary/10 blur-2xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 space-y-3">
            {/* Title */}
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {title}
            </DialogTitle>

            {/* Description */}
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>

            {/* Buttons */}
            <div className="flex justify-between gap-4 pt-4">
              <button
                onClick={() => onOpenChange(false)}
                className="px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition cursor-pointer"
                disabled={loading}
              >
                {cancelText}
              </button>

              <button
                onClick={onConfirm}
                className={`px-6 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-60 cursor-pointer ${variantStyles[confirmVariant]}`}
                disabled={loading}
              >
                {loading ? "Processing..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}