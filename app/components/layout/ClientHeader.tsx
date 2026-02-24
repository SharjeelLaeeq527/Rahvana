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
      // ── SIGN OUT ─────────────────────────────────────────────────────────
      // Show the overlay ONLY for sign-out, not for navigating to login.
      // The root layout keeps this component mounted across all client
      // navigations (Next.js App Router), so any state that is set here
      // persists after a Google OAuth redirect. By never setting isSigningOut
      // during the login-redirect path, we avoid the stale "Signing Out..."
      // overlay that appeared after a fresh login.
      setIsSigningOut(true);
      try {
        await signOut();
        // Full page reload so the middleware re-validates the now-cleared
        // Supabase session cookie from scratch. router.push would be a
        // client-side navigation that races with cookie clearing.
        window.location.href = "/";
      } catch (err) {
        console.error("[ClientHeader] Sign out error:", err);
        setIsSigningOut(false);
      }
    } else {
      // ── NAVIGATE TO LOGIN ─────────────────────────────────────────────────
      // Do NOT set isSigningOut / isAuthLoading here. The component stays
      // mounted while the user is on the login page and after they return,
      // so any loading state set here would still be true after OAuth redirect.
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
