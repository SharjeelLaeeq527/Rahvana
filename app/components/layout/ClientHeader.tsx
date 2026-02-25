"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { SiteHeader } from "./SiteHeader";
import { useRouter, usePathname } from "next/navigation";

export function ClientHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Tracks whether a sign-out is in progress (shows the loading overlay)
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Hide header on admin/auth pages
  const isExcludedPage =
    pathname.startsWith("/admin") ||
    pathname === "/admin-login" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (isExcludedPage) {
    return null;
  }

  const handleAuthToggle = async () => {
    if (user) {
      // ── SIGN OUT ─────────────────────────────────────────────────
      setIsSigningOut(true);

      // Run signOut (which already has internal timeouts).
      // Even if it fails, we MUST redirect to clear stale state.
      try {
        await signOut();
      } catch {
        // Swallow — redirect handles cleanup
      }

      // ALWAYS redirect — this is outside try/catch so it runs no matter what.
      // Full page reload ensures middleware re-validates from scratch.
      window.location.href = "/";
    } else {
      // ── NAVIGATE TO LOGIN ──────────────────────────────────────
      router.push("/login");
    }
  };

  return (
    <>
      <SiteHeader
        isSignedIn={!!user}
        onToggleAuth={handleAuthToggle}
        user={user}
        profile={profile}
      />

      {/* Sign-out loading overlay — only shown during actual sign-out */}
      {isSigningOut && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md transition-all duration-300">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/10 border-b-primary rounded-full animate-spin-reverse" />
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Signing Out...</h2>
            <p className="text-muted-foreground animate-pulse">Please wait a moment</p>
          </div>
        </div>
      )}
    </>
  );
}
