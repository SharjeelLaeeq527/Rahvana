"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComingSoonModal({ open, onOpenChange }: ComingSoonModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  const handleSignupRedirect = () => {
    onOpenChange(false);

    // Small delay so modal close animation feels smooth
    setTimeout(() => {
      router.push("/signup");
    }, 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95%] bg-background overflow-hidden rounded-2xl p-0">
        <div className="relative w-full overflow-hidden flex items-center justify-center guide-grid-bg py-12 md:py-20 px-4 md:px-8">
          {/* Background Blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-secondary/10 blur-2xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-primary/10 blur-xl animate-pulse delay-500" />
          </div>

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            {/* Title */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <DialogTitle className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 tracking-tight">
                <span className="text-[#0D7377]">Coming Soon</span>
              </DialogTitle>
            </div>
            {/* Subtitle */}
            <div
              className={`transform transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <DialogDescription className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 md:mb-10 leading-relaxed px-2 md:px-0">
                We&apos;re crafting something extraordinary for you. Stay tuned
                for an experience that redefines excellence.
              </DialogDescription>
            </div>
            {/* Loader */}
            <div
              className={`transform transition-all duration-1000 delay-500 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <div className="inline-flex items-center gap-3 md:gap-4 bg-card/60 backdrop-blur-sm rounded-full px-6 py-3 md:px-8 md:py-4 border border-border shadow-lg max-w-[90%] md:max-w-none">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground">
                  Preparing something amazing
                </span>
              </div>
            </div>
            {!user ? (
              <div
                className={`transform transition-all duration-1000 delay-700 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                } mt-8`}
              >
                <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 leading-relaxed px-2 md:px-0">
                  Be among the first to experience Rahvana&apos;s full journey
                  assistant! Sign up now to get early access and never miss an
                  update.
                </p>
                <button
                  onClick={handleSignupRedirect}
                  className="w-full sm:w-auto font-semibold text-white bg-primary hover:bg-primary/90 shadow-md px-8 py-3.5 md:py-4 rounded-xl transition-all"
                >
                  Sign Up Now
                </button>
              </div>
            ) : (
              <div
                className={`transform transition-all duration-1000 delay-700 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                } mt-8`}
              >
                <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 leading-relaxed px-2 md:px-0">
                  You requested early access to this feature — and we heard you.
                  Our team is actively working on it. As soon as it goes live,
                  we&apos;ll notify you. Thanks for being part of the journey!
                </p>
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto font-semibold text-white bg-primary hover:bg-primary/90 shadow-md px-8 py-3.5 md:py-4 rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
