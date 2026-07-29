"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MFACodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  value: string;
  onValueChange: (value: string) => void;

  onSubmit: () => void | Promise<void>;

  loading?: boolean;
  error?: string;

  title?: string;
  description?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  helperText?: string;

  confirmText?: string;
  loadingText?: string;
  cancelText?: string;

  variant?: "primary" | "danger";
}

export function MFACodeModal({
  open,
  onOpenChange,

  value,
  onValueChange,
  onSubmit,

  loading = false,
  error,

  title = "Verify Authentication",
  description = "Enter the 6-digit code from your authenticator app to continue.",
  inputLabel = "Authentication Code",
  inputPlaceholder = "Enter 6-digit code",
  helperText = "Enter the code from your authenticator app",

  confirmText = "Verify Code",
  loadingText = "Verifying...",
  cancelText = "Cancel",

  variant = "primary",
}: MFACodeModalProps) {
  const danger = variant === "danger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md overflow-hidden rounded-2xl p-0">

        {/* Header */}

        <div className="border-b border-border px-6 pt-6 pb-4">
          <div className="mb-2 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                danger
                  ? "bg-destructive/10"
                  : "bg-primary/10"
              }`}
            >
              {danger ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-primary" />
              )}
            </div>

            <h2 className="text-lg font-semibold text-foreground">
              {title}
            </h2>
          </div>

          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Body */}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-5 px-6 py-6">

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {inputLabel}
              </label>

              <Input
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={inputPlaceholder}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={loading}
                className="h-11 text-center tracking-[0.35em]"
              />

              <p className="text-xs text-muted-foreground">
                {helperText}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row">

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="h-11 w-full rounded-xl sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              {cancelText}
            </Button>

            <Button
              type="submit"
              disabled={loading || value.trim().length !== 6}
              className={`h-11 w-full rounded-xl px-8 sm:w-auto ${
                danger
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  : ""
              }`}
            >
              {loading ? loadingText : confirmText}
            </Button>

          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}