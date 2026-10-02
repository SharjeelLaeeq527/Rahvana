// app/context/CandidateContext.tsx
// ============================================================================
// Central Candidate Context — Multi-Beneficiary Management
//
// Manages candidate profiles (Mother/Father for IR-5, Children for IR-2),
// active candidate selection, and candidate-scoped tier boundaries.
// ============================================================================

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useAuth } from "@/app/context/AuthContext";
import type { CandidateProfile, CandidateRelation, CandidateTier } from "@/types/candidate";
import {
  getDefaultCandidatesForVisa,
  createNewCandidate,
  getVisaCategoryForRelation,
  getBaseVisaCategory,
  getCandidateJourneyKey,
} from "@/lib/candidate/candidateSyncService";
import { useToast } from "@/app/components/shared/ToastProvider";

const ACTIVE_CANDIDATE_STORAGE_KEY = "rahvana_active_candidate_id";
// localStorage key for candidate list safety-net (keyed by user-id to avoid
// cross-account bleed when the same browser switches accounts).
const candidateStorageKey = (userId: string) => `rahvana_candidates_${userId}`;

function readCandidatesFromStorage(userId: string): CandidateProfile[] | null {
  try {
    const raw = localStorage.getItem(candidateStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CandidateProfile[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCandidatesToStorage(userId: string, candidates: CandidateProfile[]) {
  try {
    localStorage.setItem(candidateStorageKey(userId), JSON.stringify(candidates));
  } catch {
    /* non-fatal — storage quota or private mode */
  }
}


interface CandidateContextType {
  /** Array of all candidate profiles associated with the account */
  candidates: CandidateProfile[];

  /** Currently selected/active candidate profile */
  activeCandidate: CandidateProfile;

  /** ID of the currently active candidate */
  activeCandidateId: string;

  /** Set the active candidate by ID */
  setActiveCandidateId: (id: string) => void;

  /** Add a new candidate (e.g. 2nd parent preview or additional child) */
  addCandidate: (params: {
    relation: CandidateRelation;
    fullName?: string;
    visaCategory?: string;
    isPreview?: boolean;
    tier?: CandidateTier;
  }) => CandidateProfile;

  /** Update an existing candidate's information */
  updateCandidate: (id: string, updates: Partial<CandidateProfile>) => void;

  /** Remove a candidate profile */
  removeCandidate: (id: string) => void;

  /** Whether the account currently has more than one candidate profile */
  isMultiCandidate: boolean;

  /**
   * Base visa category of the ACTIVE candidate's journey (e.g. "IR-1", "IR-5"). Category
   * configures the journey; this is the canonical, category-agnostic base for scoping
   * roadmap/forms/tools/documents to the active journey.
   */
  activeJourneyBase: string;

  /**
   * DB `journey_type` key for the ACTIVE candidate (candidate-1 -> base root like "ir5" /
   * "ir1"; later candidates -> "ir5_candidate-2", ...). This is the canonical scope key that
   * every module keys off when the active candidate switches.
   */
  activeJourneyKey: string;

  /**
   * Effective tier of the active candidate.
   * If candidate is in Free Preview mode, returns 'free'.
   * Otherwise returns candidate's assigned tier or user's account tier.
   */
  activeCandidateTier: CandidateTier;
}

export const CandidateContext = createContext<CandidateContextType | undefined>(undefined);

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile, isProfileLoading } = useUserProfile();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeCandidateId, setActiveCandidateIdState] = useState<string>("candidate-1");
  const candidatesRef = useRef<CandidateProfile[]>([]);

  // Track whether we've already re-synced the localStorage backup to the server
  // after a profile load that was missing candidates (avoids infinite loops).
  const didResyncRef = useRef(false);

  // ── Derive or initialize candidates ───────────────────────────────────────
  const candidates: CandidateProfile[] = useMemo(() => {
    // DB-backed candidates — normalize and use if present.
    if (profile?.candidates && Array.isArray(profile.candidates) && profile.candidates.length > 0) {
      // Normalize legacy candidate data so older accounts pick up the current rules
      // without a re-add or DB migration:
      //  - `isPreview: true` is cleared - every candidate is a real beneficiary, treated
      //    equally (no per-candidate "preview" / upsell by creation order).
      //  - Auto-written "Mother"/"Father" defaults are made generic. Older defaults baked
      //    the relation into the label ("Candidate 1 (Mother)") and fullName ("Mother"),
      //    which wrongly assumes the parent. We only touch UNTOUCHED defaults (fullName
      //    empty or equal to the relation) so a name the user actually typed is preserved.
      //    For the PRIMARY candidate the relation is always system-assigned (never chosen
      //    via the add flow), so we also drop an assumed parent relation to "Other".
      const PARENT_RELATIONS = ["Mother", "Father", "Stepparent", "AdoptiveParent"];
      // Old baked-in default names: the relation itself ("Mother"/"Father"/"Spouse") or a
      // numbered relation ("Child 1", "Child 2", ...). A real name the user typed (e.g.
      // "Fatima Bibi") will not match, so it is preserved.
      const DEFAULT_NAME_RE = /^(mother|father|child|spouse|stepparent|adoptive ?parent)\s*\d*$/i;
      const normalized = profile.candidates.map((c) => {
        let next = c;
        if (next.isPreview) next = { ...next, isPreview: false };

        const nameIsDefault =
          !next.fullName ||
          next.fullName === next.relation ||
          DEFAULT_NAME_RE.test(next.fullName.trim());
        if (nameIsDefault) {
          const num = (next.id || "").replace(/[^0-9]/g, "") || "1";
          const genericLabel = `Candidate ${num}`;
          const shouldNeutralizeRelation =
            next.isPrimary && PARENT_RELATIONS.includes(next.relation);
          if (
            next.label !== genericLabel ||
            next.fullName ||
            shouldNeutralizeRelation
          ) {
            next = {
              ...next,
              label: genericLabel,
              fullName: "",
              ...(shouldNeutralizeRelation ? { relation: "Other" as const } : {}),
            };
          }
        }
        return next;
      });
      candidatesRef.current = normalized;
      return normalized;
    }

    // ── Safety net: restore from localStorage if DB is empty ─────────────────
    // Covers three failure modes: aborted save on navigation, token-refresh race
    // where user?.id was null when addCandidate ran, and transient fetch errors.
    if (user?.id && !isProfileLoading) {
      const stored = readCandidatesFromStorage(user.id);
      if (stored && stored.length > 0) {
        candidatesRef.current = stored;
        return stored;
      }
    }

    // Default fallback — single candidate derived from the journey type.
    const visa = profile?.visaType || profile?.visaCategory || "IR-5";
    const defaults = getDefaultCandidatesForVisa(visa, "free", false);
    candidatesRef.current = defaults;
    return defaults;
  }, [profile?.candidates, profile?.visaType, profile?.visaCategory, user?.id, isProfileLoading]);

  // ── Restore activeCandidateId from profile / localStorage (ONCE) ─────────
  // Hydrate the active candidate a single time from profile/session. After that, an
  // explicit switch (setActiveCandidateId) is the source of truth. Without the
  // hydrate-once guard, the profile re-emitting its last-saved value (optimistic/
  // debounced save, or a slow reload) would snap the active candidate back - e.g. you
  // switch to Mother and it jumps back to Father.
  const didHydrateActiveRef = useRef(false);
  useEffect(() => {
    try {
      if (!didHydrateActiveRef.current) {
        const savedInStorage = sessionStorage.getItem(ACTIVE_CANDIDATE_STORAGE_KEY);
        const profileActive = profile?.activeCandidateId;
        const targetId = profileActive || savedInStorage || "candidate-1";
        if (candidates.length > 0) {
          const exists = candidates.some((c) => c.id === targetId);
          setActiveCandidateIdState(exists ? targetId : candidates[0].id);
          // Only lock hydration once the profile has actually loaded, so we don't lock in
          // a pre-profile guess and ignore the user's real saved choice.
          if (!isProfileLoading) didHydrateActiveRef.current = true;
        }
        return;
      }

      // Already hydrated: never override an explicit switch. Only recover if the current
      // active candidate no longer exists (e.g. it was removed).
      const stillExists = candidates.some((c) => c.id === activeCandidateId);
      if (!stillExists && candidates.length > 0) {
        setActiveCandidateIdState(candidates[0].id);
      }
    } catch {
      // sessionStorage unavailable — non-fatal
    }
  }, [profile?.activeCandidateId, candidates, activeCandidateId, isProfileLoading]);

  // ── Re-sync localStorage backup → DB when candidates were restored from storage
  // If the DB profile came back without candidates but localStorage had them,
  // push them back to the server NOW (once, when profile finishes loading).
  useEffect(() => {
    if (isProfileLoading || didResyncRef.current) return;
    if (!user?.id) return;
    // If profile has no candidates but we're serving from localStorage,
    // re-sync the localStorage copy back to the DB.
    const profileHasCandidates =
      profile?.candidates && Array.isArray(profile.candidates) && profile.candidates.length > 0;
    if (!profileHasCandidates && candidatesRef.current.length > 0) {
      didResyncRef.current = true;
      updateProfile(
        { candidates: candidatesRef.current, activeCandidateId },
        { silent: true, immediate: true }
      );
    }
  }, [isProfileLoading, user?.id, profile?.candidates, activeCandidateId, updateProfile]);

  // ── Set active candidate ──────────────────────────────────────────────────
  const setActiveCandidateId = useCallback(
    (id: string) => {
      const target = candidatesRef.current.find((c) => c.id === id);
      if (!target) return;

      setActiveCandidateIdState(id);
      try {
        sessionStorage.setItem(ACTIVE_CANDIDATE_STORAGE_KEY, id);
      } catch {
        /* non-fatal */
      }

      if (user?.id && !isProfileLoading) {
        updateProfile({ activeCandidateId: id }, { silent: true });
      }

      showToast(`Switched active profile to ${target.label}`, "info", {
        duration: 2000,
      });
    },
    [user?.id, isProfileLoading, updateProfile, showToast]
  );

  // ── Add Candidate ─────────────────────────────────────────────────────────
  const addCandidate = useCallback(
    (params: {
      relation: CandidateRelation;
      fullName?: string;
      visaCategory?: string;
      isPreview?: boolean;
      tier?: CandidateTier;
    }): CandidateProfile => {
      // Guard: USCIS permits only one spouse to be sponsored at a time. Block only a SECOND
      // spouse - adding the first Spouse candidate (IR-1) is allowed, and this never blocks
      // displaying or switching to an existing spouse candidate.
      if (
        params.relation === "Spouse" &&
        candidatesRef.current.some((c) => c.relation === "Spouse")
      ) {
        showToast("Only one spouse can be sponsored at a time.", "error");
        throw new Error("Only one spouse can be sponsored at a time.");
      }

      const derivedVisa =
        params.visaCategory ||
        getVisaCategoryForRelation(
          params.relation,
          profile?.visaCategory || profile?.visaType || "IR-5"
        );

      const newCand = createNewCandidate(candidatesRef.current, {
        relation: params.relation,
        fullName: params.fullName,
        visaCategory: derivedVisa,
        // No per-candidate preview: every candidate is a full, equal beneficiary.
        isPreview: params.isPreview ?? false,
        tier: params.tier ?? "free",
      });

      const updated = [...candidatesRef.current, newCand];
      candidatesRef.current = updated;

      // Mirror to localStorage FIRST — this is the safety net that survives
      // aborted fetches, token refresh races, and page unloads.
      if (user?.id) {
        writeCandidatesToStorage(user.id, updated);
        updateProfile(
          {
            candidates: updated,
            activeCandidateId: newCand.id,
          },
          { silent: false, immediate: true }
        );
      }

      setActiveCandidateIdState(newCand.id);
      try {
        sessionStorage.setItem(ACTIVE_CANDIDATE_STORAGE_KEY, newCand.id);
      } catch {
        /* non-fatal */
      }

      showToast(`Added ${newCand.label} profile!`, "success");
      return newCand;
    },
    [profile?.visaCategory, profile?.visaType, user?.id, updateProfile, showToast]
  );

  // ── Update Candidate ──────────────────────────────────────────────────────
  const updateCandidate = useCallback(
    (id: string, updates: Partial<CandidateProfile>) => {
      const updated = candidatesRef.current.map((c) => (c.id === id ? { ...c, ...updates } : c));
      candidatesRef.current = updated;

      if (user?.id) {
        writeCandidatesToStorage(user.id, updated);
        updateProfile({ candidates: updated }, { silent: true });
      }
    },
    [user?.id, updateProfile]
  );

  // ── Remove Candidate ──────────────────────────────────────────────────────
  const removeCandidate = useCallback(
    async (id: string) => {
      if (id === "candidate-1" || candidatesRef.current.length <= 1) {
        showToast("Cannot remove the primary candidate profile.", "error");
        return;
      }

      const target = candidatesRef.current.find((c) => c.id === id);
      const updated = candidatesRef.current.filter((c) => c.id !== id);
      candidatesRef.current = updated;

      const nextActiveId = activeCandidateId === id ? updated[0].id : activeCandidateId;
      setActiveCandidateIdState(nextActiveId);

      try {
        sessionStorage.setItem(ACTIVE_CANDIDATE_STORAGE_KEY, nextActiveId);
        // Mirror updated candidate list to localStorage immediately.
        if (user?.id) writeCandidatesToStorage(user.id, updated);
        // Clean up candidate-scoped local storage keys
        localStorage.removeItem(`rahvana_guide_sessions_${id}`);
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.endsWith(`_${id}`) || key.includes(`_${id}_`))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        /* non-fatal */
      }

      // Optimistically update profile in UserProfileContext
      updateProfile(
        {
          candidates: updated,
          activeCandidateId: nextActiveId,
        },
        { silent: true }
      );

      // If user is authenticated, call the server-side delete API
      if (user?.id) {
        try {
          const res = await fetch("/api/candidate/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidateId: id }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error("[CandidateContext] Server deletion error:", errData);
          }
        } catch (err) {
          console.error("[CandidateContext] Failed to call delete API:", err);
        }
      }

      showToast(`Removed ${target?.label || "candidate"} profile.`, "info");
    },
    [activeCandidateId, user?.id, updateProfile, showToast]
  );

  // ── Active Candidate & Tier calculation ──────────────────────────────────
  const activeCandidate = useMemo(() => {
    const found = candidates.find((c) => c.id === activeCandidateId);
    return (
      found ||
      candidates[0] || {
        // Last-resort fallback (candidates is normally never empty). Do NOT hardcode an
        // IR-5/Mother assumption - that is the old leak that made IR-1 accounts look like
        // IR-5. Derive the category from the profile and keep the relation neutral.
        id: "candidate-1",
        label: "Candidate 1",
        relation: "Other" as const,
        fullName: "",
        visaCategory: (profile?.visaCategory || profile?.visaType || "IR-1") as string,
        tier: "free" as const,
        isPrimary: true,
        createdAt: new Date().toISOString(),
      }
    );
  }, [candidates, activeCandidateId, profile?.visaCategory, profile?.visaType]);

  const activeCandidateTier: CandidateTier = useMemo(() => {
    if (activeCandidate.isPreview || activeCandidate.tier === "free") {
      return "free";
    }
    return activeCandidate.tier || "free";
  }, [activeCandidate]);

  const isMultiCandidate = candidates.length > 1;

  // Canonical scope for the active journey (category-agnostic). Derived from the active
  // candidate's own visaCategory (NOT an ambient journey_type) so a cross-category candidate
  // maps to the right config/journey row.
  const activeJourneyBase = useMemo(
    () => getBaseVisaCategory(activeCandidate.visaCategory),
    [activeCandidate.visaCategory]
  );
  const activeJourneyKey = useMemo(
    () => getCandidateJourneyKey(activeCandidate.visaCategory, activeCandidateId),
    [activeCandidate.visaCategory, activeCandidateId]
  );

  const value = useMemo(
    () => ({
      candidates,
      activeCandidate,
      activeCandidateId,
      setActiveCandidateId,
      addCandidate,
      updateCandidate,
      removeCandidate,
      isMultiCandidate,
      activeJourneyBase,
      activeJourneyKey,
      activeCandidateTier,
    }),
    [
      candidates,
      activeCandidate,
      activeCandidateId,
      setActiveCandidateId,
      addCandidate,
      updateCandidate,
      removeCandidate,
      isMultiCandidate,
      activeJourneyBase,
      activeJourneyKey,
      activeCandidateTier,
    ]
  );

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidate() {
  const context = useContext(CandidateContext);
  if (context === undefined) {
    throw new Error("useCandidate must be used within a CandidateProvider");
  }
  return context;
}
