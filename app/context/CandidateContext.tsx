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
import type {
  CandidateProfile,
  CandidateRelation,
  CandidateTier,
} from "@/types/candidate";
import {
  getDefaultCandidatesForVisa,
  createNewCandidate,
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

const CandidateContext = createContext<CandidateContextType | undefined>(undefined);

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile, isProfileLoading } = useUserProfile();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeCandidateId, setActiveCandidateIdState] = useState<string>("candidate-1");
  const candidatesRef = useRef<CandidateProfile[]>([]);

  // ── Derive or initialize candidates ───────────────────────────────────────
  const candidates: CandidateProfile[] = useMemo(() => {
    if (profile?.candidates && Array.isArray(profile.candidates) && profile.candidates.length > 0) {
      candidatesRef.current = profile.candidates;
      return profile.candidates;
    }

    // Default fallback candidate
    const visa = profile?.visaType || profile?.visaCategory || "IR-5";
    const defaults = getDefaultCandidatesForVisa(visa, "free", false);
    candidatesRef.current = defaults;
    return defaults;
  }, [profile?.candidates, profile?.visaType, profile?.visaCategory]);

  // ── Restore activeCandidateId from profile / localStorage ────────────────
  useEffect(() => {
    try {
      const savedInStorage = sessionStorage.getItem(ACTIVE_CANDIDATE_STORAGE_KEY);
      const profileActive = profile?.activeCandidateId;

      const targetId = profileActive || savedInStorage || "candidate-1";
      const exists = candidates.some((c) => c.id === targetId);

      if (exists) {
        setActiveCandidateIdState(targetId);
      } else if (candidates.length > 0) {
        setActiveCandidateIdState(candidates[0].id);
      }
    } catch {
      // sessionStorage unavailable — non-fatal
    }
  }, [profile?.activeCandidateId, candidates]);

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
        updateProfile(
          { activeCandidateId: id },
          { silent: true }
        );
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
      isPreview?: boolean;
      tier?: CandidateTier;
    }): CandidateProfile => {
      const newCand = createNewCandidate(candidatesRef.current, {
        relation: params.relation,
        fullName: params.fullName,
        visaCategory: profile?.visaCategory || profile?.visaType || "IR-5",
        isPreview: params.isPreview ?? true,
        tier: params.tier ?? (params.isPreview ? "free" : "free"),
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
    (id: string) => {
      if (candidatesRef.current.length <= 1) {
        showToast("Cannot remove the primary candidate profile.", "error");
        return;
      }

      const updated = candidatesRef.current.filter((c) => c.id !== id);
      candidatesRef.current = updated;

      const nextActiveId = activeCandidateId === id ? updated[0].id : activeCandidateId;
      setActiveCandidateIdState(nextActiveId);

      if (user?.id) {
        updateProfile(
          {
            candidates: updated,
            activeCandidateId: nextActiveId,
          },
          { silent: false, immediate: true }
        );
      }

      showToast("Candidate profile removed.", "info");
    },
    [activeCandidateId, user?.id, updateProfile, showToast]
  );

  // ── Active Candidate & Tier calculation ──────────────────────────────────
  const activeCandidate = useMemo(() => {
    const found = candidates.find((c) => c.id === activeCandidateId);
    return found || candidates[0] || {
      id: "candidate-1",
      label: "Candidate 1",
      relation: "Mother" as const,
      fullName: "Beneficiary 1",
      visaCategory: "IR-5",
      tier: "free" as const,
      isPrimary: true,
      createdAt: new Date().toISOString(),
    };
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
