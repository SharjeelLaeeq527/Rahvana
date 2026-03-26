"use client";

import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export const AuthRequiredModal = ({ open, onClose, redirectTo }: Props) => {
  const router = useRouter();

  const handleLogin = () => {
    if (redirectTo) {
      router.push(`/login?redirect=${redirectTo}`);
    } else {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-border mx-4"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground"
            >
              <Icons.X />
            </button>

            <div className="text-center">
              <Icons.Rocket className="w-12 h-12 mx-auto text-rahvana-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Login Required</h3>
              <p className="text-muted-foreground mb-6">
                Please sign in to continue.
              </p>

              <button
                onClick={handleLogin}
                className="bg-rahvana-primary text-white px-6 py-3 rounded-xl font-semibold"
              >
                Sign In Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
