"use client";

import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";

interface Props {
  open: boolean;
  onEnable: () => void;
  onRemindLater: () => void;
}

export const MfaPromptModal = ({ open, onEnable, onRemindLater }: Props) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-3xl p-8 shadow-2xl border border-line"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto mb-6">
              <Icons.ShieldCheck className="w-8 h-8" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center text-strong mb-3">
              Enable Two-Factor Authentication
            </h3>

            {/* Description */}
            <p className="text-subtle text-center mb-8 leading-relaxed">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={onEnable}
                className="w-full font-semibold text-brand-contrast bg-brand hover:bg-brand/90 shadow-md p-4 rounded-xl transition-all"
              >
                Enable 2FA
              </button>

              <button
                onClick={onRemindLater}
                className="w-full font-semibold border border-line bg-surface-raised text-default hover:bg-surface-sunken p-4 rounded-xl transition-all"
              >
                Remind me later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
