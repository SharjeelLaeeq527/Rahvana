"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { SiteHeader } from "./SiteHeader";
import { useRouter, usePathname } from "next/navigation";
import { Loader } from "@/components/ui/spinner";
import { useToast } from "@/app/components/shared/ToastProvider";

export function ClientHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

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

      // Revoke and audit this session before clearing local auth state.
      try {
        await signOut();
      } catch (error) {
        setIsSigningOut(false);
        showToast(
          error instanceof Error ? error.message : "Unable to sign out this session.",
          "error"
        );
        return;
      }

      // A full page reload ensures middleware re-validates from scratch.
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
        <Loader fullScreen size="lg" text="Signing Out..." subText="Please wait a moment" />
      )}
    </>
  );
}
