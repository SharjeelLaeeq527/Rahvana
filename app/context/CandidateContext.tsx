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
} from "@/lib/candidate/candidateSyncService";
import { useToast } from "@/app/components/shared/ToastProvider";

const ACTIVE_CANDIDATE_STORAGE_KEY = "rahvana_active_candidate_id";

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

  // ── Derive or initialize candidates ───────────────────────────────────────
  const candidates: CandidateProfile[] = useMemo(() => {
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

    // Default fallback candidate
    const visa = profile?.visaType || profile?.visaCategory || "IR-5";
    const defaults = getDefaultCandidatesForVisa(visa, "free", false);
    candidatesRef.current = defaults;
    return defaults;
  }, [profile?.candidates, profile?.visaType, profile?.visaCategory]);

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
      // Guard: USCIS permits only one spouse to be sponsored at a time
      if (
        params.relation === "Spouse" ||
        candidatesRef.current.some((c) => c.relation === "Spouse" && params.relation === "Spouse")
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
        isPreview: params.isPreview ?? true,
        tier: params.tier ?? "free",
      });

      const updated = [...candidatesRef.current, newCand];
      candidatesRef.current = updated;

      if (user?.id) {
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
        id: "candidate-1",
        label: "Candidate 1",
        relation: "Mother" as const,
        fullName: "Beneficiary 1",
        visaCategory: "IR-5",
        tier: "free" as const,
        isPrimary: true,
        createdAt: new Date().toISOString(),
      }
    );
  }, [candidates, activeCandidateId]);

  const activeCandidateTier: CandidateTier = useMemo(() => {
    if (activeCandidate.isPreview || activeCandidate.tier === "free") {
      return "free";
    }
    return activeCandidate.tier || "free";
  }, [activeCandidate]);

  const isMultiCandidate = candidates.length > 1;

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
