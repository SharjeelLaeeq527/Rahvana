// app/context/UserProfileContext.tsx
// ============================================================================
// Central Profile Context — "Fill Once, Use Everywhere"
//
// Loads user's MasterProfile once on auth, provides it to all children.
// Handles optimistic local merge + debounced Supabase upsert via
// /api/profile/complete (server-side encryption for sensitive fields).
//
// Eliminates the 15+ duplicate `user_profiles` fetches scattered across tools.
// ============================================================================

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import type { MasterProfile } from "@/types/profile";
import { useToast } from "@/app/components/shared/ToastProvider";

// ─────────────────────────────────────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────────────────────────────────────

interface UserProfileContextType {
  /** The user's full MasterProfile (decrypted). null if not loaded or not logged in. */
  profile: MasterProfile | null;

  /** True while the initial profile fetch is in progress. */
  isProfileLoading: boolean;

  /** True if a save operation is currently in progress. */
  isSaving: boolean;

  /**
   * Merge partial data into the in-memory profile and schedule a debounced save.
   * This is the primary way tools feed data back to the central profile.
   *
   * @param partial - Partial MasterProfile fields to merge (deep merge at top level)
   * @param options - Optional config: `silent` suppresses toast, `immediate` saves without debounce
   */
  updateProfile: (
    partial: Partial<MasterProfile>,
    options?: { silent?: boolean; immediate?: boolean; localOnly?: boolean }
  ) => void;

  /**
   * Force an immediate save of the current in-memory profile to the database.
   * Use sparingly — most cases should use `updateProfile()` which auto-debounces.
   */
  saveProfile: () => Promise<void>;

  /**
   * Reload the profile from the database. Useful after external profile edits
   * (e.g., CompleteProfileForm).
   */
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Deep merge utility (1 level deep objects, arrays replaced not merged)
// ─────────────────────────────────────────────────────────────────────────────

function deepMergeProfile(
  existing: Partial<MasterProfile>,
  incoming: Partial<MasterProfile>
): Partial<MasterProfile> {
  const result = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;

    const existingVal = (result as Record<string, unknown>)[key];

    // Deep merge objects (but not arrays or null)
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existingVal !== null &&
      typeof existingVal === "object" &&
      !Array.isArray(existingVal)
    ) {
      (result as Record<string, unknown>)[key] = {
        ...(existingVal as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 2000; // 2-second debounce for save-back

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for debounce logic
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef = useRef<MasterProfile | null>(null);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  // Keep profileRef in sync with state
  profileRef.current = profile;

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // ── Fetch profile from Decrypted Profile API ─────────────────────────────

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setIsProfileLoading(true);

      const response = await fetch("/api/profile");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch profile");
      }

      const data = await response.json();
      if (data?.profile?.profile_details) {
        setProfile(data.profile.profile_details as MasterProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("[UserProfileContext] Unexpected error fetching profile:", err);
      // Keep any previously-loaded profile on a transient fetch error (e.g. a
      // dev-server hiccup). Nulling it here would blank dependent UI such as the
      // Ch.1 Step 4 consistency baseline right after the user saved their DOB.
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // ── Save profile to Supabase (via server-side encryption route) ─────────

  const saveProfile = useCallback(async () => {
    const currentProfile = profileRef.current;
    if (!user?.id || !currentProfile) return;

    try {
      setIsSaving(true);

      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_details: currentProfile }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile");
      }
    } catch (err) {
      console.error("[UserProfileContext] Error saving profile:", err);
      showToast("Failed to save your information. Please try again.", "error");
      throw err; // Rethrow to prevent subsequent success toast
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // ── Update profile (optimistic merge + debounced save) ──────────────────

  const updateProfile = useCallback(
    (
      partial: Partial<MasterProfile>,
      options?: { silent?: boolean; immediate?: boolean; localOnly?: boolean }
    ) => {
      if (!user?.id) return;

      // Optimistic local merge
      setProfile((prev) => {
        const base = prev || ({} as MasterProfile);
        const merged = deepMergeProfile(base, partial) as MasterProfile;
        profileRef.current = merged;
        return merged;
      });

      // If localOnly is requested (e.g. candidate state mutations managed by dedicated APIs),
      // do not schedule a save back to /api/profile/complete.
      if (options?.localOnly) {
        return;
      }

      // Cancel existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (options?.immediate) {
        // Immediate save
        saveProfile()
          .then(() => {
            if (!options?.silent) {
              showToast("Your information has been saved", "success", {
                duration: 2000,
              });
            }
          })
          .catch(() => {
            // Already handled error toast in saveProfile
          });
      } else {
        // Debounced save
        debounceTimerRef.current = setTimeout(() => {
          saveProfile()
            .then(() => {
              if (!options?.silent) {
                showToast("Your information has been saved", "success", {
                  duration: 2000,
                });
              }
            })
            .catch(() => {
              // Already handled error toast in saveProfile
            });
          debounceTimerRef.current = null;
        }, DEBOUNCE_MS);
      }
    },
    [user?.id, saveProfile]
  );

  // ── Refresh profile (public method) ─────────────────────────────────────

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  // ── Load profile when user changes ──────────────────────────────────────

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setIsProfileLoading(false);
      lastFetchedUserIdRef.current = null;
      return;
    }

    // Don't re-fetch if we already fetched for this user
    if (lastFetchedUserIdRef.current === user.id) return;
    lastFetchedUserIdRef.current = user.id;

    fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  // ── Cleanup debounce on unmount ─────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        // Flush pending save on unmount
        saveProfile();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Context value ───────────────────────────────────────────────────────

  const contextValue = useMemo(
    () => ({
      profile,
      isProfileLoading,
      isSaving,
      updateProfile,
      saveProfile,
      refreshProfile,
    }),
    [profile, isProfileLoading, isSaving, updateProfile, saveProfile, refreshProfile]
  );

  return <UserProfileContext.Provider value={contextValue}>{children}</UserProfileContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
