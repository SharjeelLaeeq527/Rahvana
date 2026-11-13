// app/context/CandidateContext.tsx
// ============================================================================
// Central Candidate Context — Multi-Beneficiary Management
//
// Manages candidate profiles (Mother/Father for IR-5, Children for IR-2),
// active candidate selection, and candidate-scoped tier boundaries.
//
// The roster is SERVER-OWNED (lib/profile/serverOwnedKeys.ts): ids, category slots,
// labels and tiers are assigned by /api/candidate/create and Stripe provisioning, and
// removal is decided by /api/candidate/delete. This context only mirrors what the
// server returns.
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
  getVisaCategoryForRelation,
  getBaseVisaCategory,
} from "@/lib/candidate/candidateSyncService";
import {
  formatCandidateLabel,
  getCandidateSlot,
  getJourneyKeyForCandidate,
  slotPool,
} from "@/lib/candidate/candidateKeys";
import { useToast } from "@/app/components/shared/ToastProvider";

const ACTIVE_CANDIDATE_STORAGE_KEY = "rahvana_active_candidate_id";
// Last candidate used in each category pool ({ "IR-5": "candidate-2", "IR-2": ... }), so
// opening a category's journey returns to the candidate last worked on there.
const LAST_USED_BY_POOL_STORAGE_KEY = "rahvana_last_candidate_by_pool";

export function readLastUsedByPool(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(LAST_USED_BY_POOL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function rememberLastUsed(candidate: Pick<CandidateProfile, "id" | "visaCategory">): void {
  try {
    const map = readLastUsedByPool();
    map[slotPool(candidate.visaCategory)] = candidate.id;
    sessionStorage.setItem(LAST_USED_BY_POOL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* non-fatal */
  }
}

const CANDIDATES_STORAGE_KEY_PREFIX = "rahvana_candidates_roster";
// User-scoped cache key. A bare global key let one account's cached roster surface for
// a different user on a shared browser (User A logs out, User B logs in and, before B's
// profile resolves - or if B has no candidates yet - the memo falls back to A's cache).
// Scoping by user id keeps each account's roster isolated; guests fall back to the prefix.
function candidatesStorageKey(userId: string | undefined | null): string {
  return userId ? `${CANDIDATES_STORAGE_KEY_PREFIX}_${userId}` : CANDIDATES_STORAGE_KEY_PREFIX;
}

function writeCandidatesToStorage(
  userId: string | undefined | null,
  candidates: CandidateProfile[]
): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(candidatesStorageKey(userId), JSON.stringify(candidates));
    }
  } catch {
    /* non-fatal */
  }
}

interface CandidateContextType {
  /** Array of all candidate profiles associated with the account */
  candidates: CandidateProfile[];

  /** Currently selected/active candidate profile */
  activeCandidate: CandidateProfile;

  /** ID of the currently active candidate */
  activeCandidateId: string;

  /** Set the active candidate by ID. `silent` skips the toast (automatic URL alignment). */
  setActiveCandidateId: (id: string, options?: { silent?: boolean }) => void;

  /**
   * Add a new candidate. The server assigns id, category slot, label and tier. Resolves
   * with the saved candidate; rejects (after showing an error toast) when it fails.
   */
  addCandidate: (params: {
    relation: CandidateRelation;
    fullName?: string;
    visaCategory?: string;
  }) => Promise<CandidateProfile>;

  /** Update an existing candidate's editable information (name, photo, details). */
  updateCandidate: (id: string, updates: Partial<CandidateProfile>) => void;

  /** Remove a candidate profile. Resolves true when the server removed it. */
  removeCandidate: (id: string) => Promise<boolean>;

  /** Whether the account currently has more than one candidate profile */
  isMultiCandidate: boolean;

  /**
   * True once the roster came from the loaded profile AND the saved active candidate was
   * restored. Pages that load a journey per candidate wait for it, so their first
   * request never uses a placeholder candidate.
   */
  isRosterReady: boolean;

  /**
   * Base visa category of the ACTIVE candidate's journey (e.g. "IR-1", "IR-5"). Category
   * configures the journey; this is the canonical, category-agnostic base for scoping
   * roadmap/forms/tools/documents to the active journey.
   */
  activeJourneyBase: string;

  /**
   * DB `journey_type` key for the ACTIVE candidate, from its slot in its category (slot 1
   * -> base root like "ir5" / "ir2"; slot 2 -> "ir5_candidate2", ...). This is the
   * canonical scope key that every module keys off when the active candidate switches.
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
  const [cachedCandidates, setCachedCandidates] = useState<CandidateProfile[] | null>(null);

  // Load cached candidates from localStorage in useEffect (client-side only, after hydration)
  // This prevents SSR hydration mismatch where server rendered defaults but client had localStorage cached roster.
  useEffect(() => {
    try {
      const cached = localStorage.getItem(candidatesStorageKey(user?.id));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCachedCandidates(parsed);
          candidatesRef.current = parsed;
        }
      }
    } catch {}
  }, [user?.id]);

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

        const isCustom = Boolean(next.customName);
        const nameIsDefault =
          !isCustom &&
          (!next.fullName ||
            next.fullName === next.relation ||
            DEFAULT_NAME_RE.test(next.fullName.trim()));

        if (nameIsDefault) {
          // Numbered inside the candidate's category (slot), not by account-wide id.
          const genericLabel = `Candidate ${getCandidateSlot(next)}`;
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
        } else if (isCustom && next.customName) {
          next = {
            ...next,
            label: next.customName,
            fullName: next.fullName || next.customName,
          };
        }
        return next;
      });
      // Display label: "IR-2 Candidate 1" once the roster spans 2+ categories. Local
      // only; the server owns the stored label.
      const labelled = normalized.map((c) => {
        const display = formatCandidateLabel(c, normalized);
        return display === c.label ? c : { ...c, label: display };
      });
      candidatesRef.current = labelled;
      try {
        localStorage.setItem(candidatesStorageKey(user?.id), JSON.stringify(labelled));
      } catch {}
      return labelled;
    }

    // Client-side cached roster (loaded after hydration)
    if (cachedCandidates && cachedCandidates.length > 0) {
      candidatesRef.current = cachedCandidates;
      return cachedCandidates;
    }

    // Default fallback — single candidate derived from the journey type.
    const visa = profile?.visaType || profile?.visaCategory || "IR-1";
    const defaults = getDefaultCandidatesForVisa(visa, "free", false);
    candidatesRef.current = defaults;
    return defaults;
  }, [profile?.candidates, profile?.visaType, profile?.visaCategory, user?.id, cachedCandidates]);

  // ── Restore activeCandidateId from profile / localStorage (ONCE) ─────────
  // Hydrate the active candidate a single time from profile/session. After that, an
  // explicit switch (setActiveCandidateId) is the source of truth. Without the
  // hydrate-once guard, the profile re-emitting its last-saved value (optimistic/
  // debounced save, or a slow reload) would snap the active candidate back - e.g. you
  // switch to Mother and it jumps back to Father.
  const didHydrateActiveRef = useRef(false);
  const [isRosterReady, setIsRosterReady] = useState(false);
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
          if (!isProfileLoading) {
            didHydrateActiveRef.current = true;
            setIsRosterReady(true);
          }
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

  // NOTE: there is no client -> server roster re-sync. The roster is server-owned
  // (lib/profile/serverOwnedKeys.ts): only /api/candidate/create, /api/candidate/delete
  // and Stripe provisioning write it, so a profile save can neither drop nor forge it.

  // ── Set active candidate ──────────────────────────────────────────────────
  const setActiveCandidateId = useCallback(
    (id: string, options?: { silent?: boolean }) => {
      const target = candidatesRef.current.find((c) => c.id === id);
      if (!target) return;

      setActiveCandidateIdState(id);
      rememberLastUsed(target);
      try {
        sessionStorage.setItem(ACTIVE_CANDIDATE_STORAGE_KEY, id);
      } catch {
        /* non-fatal */
      }

      if (user?.id && !isProfileLoading) {
        updateProfile({ activeCandidateId: id }, { silent: true, localOnly: true });
      }

      if (!options?.silent) {
        showToast(`Switched active profile to ${target.label}`, "info", {
          duration: 2000,
        });
      }
    },
    [user?.id, isProfileLoading, updateProfile, showToast]
  );

  /** Apply a roster returned by the server to local state + caches. */
  const applyServerRoster = useCallback(
    (roster: CandidateProfile[], activeId?: string | null) => {
      candidatesRef.current = roster;
      setCachedCandidates(roster);
      if (user?.id) writeCandidatesToStorage(user.id, roster);
      updateProfile(
        activeId ? { candidates: roster, activeCandidateId: activeId } : { candidates: roster },
        { silent: true, localOnly: true }
      );
    },
    [user?.id, updateProfile]
  );

  // ── Add Candidate (server-assigned) ───────────────────────────────────────
  const addCandidate = useCallback(
    async (params: {
      relation: CandidateRelation;
      fullName?: string;
      visaCategory?: string;
    }): Promise<CandidateProfile> => {
      // Guard: USCIS permits only one spouse to be sponsored at a time. Block only a
      // SECOND spouse. The server enforces the same rule.
      const derivedVisa =
        params.visaCategory ||
        getVisaCategoryForRelation(
          params.relation,
          profile?.visaCategory || profile?.visaType || "IR-1"
        );
      const isSpouse = params.relation === "Spouse" || slotPool(derivedVisa) === "IR-1";
      const hasExistingSpouse = candidatesRef.current.some(
        (c) => c.relation === "Spouse" || getBaseVisaCategory(c.visaCategory) === "IR-1"
      );
      if (isSpouse && hasExistingSpouse) {
        const message = "Only one spouse (IR-1) can be sponsored at a time.";
        showToast(message, "error");
        throw new Error(message);
      }

      if (!user?.id) {
        const message = "Please sign in to add a candidate.";
        showToast(message, "error");
        throw new Error(message);
      }

      let data: { candidate?: CandidateProfile; candidates?: unknown; error?: unknown } = {};
      let ok = false;
      try {
        const res = await fetch("/api/candidate/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate: {
              relation: params.relation,
              fullName: params.fullName || "",
              visaCategory: derivedVisa,
            },
            activate: true,
          }),
        });
        data = await res.json().catch(() => ({}));
        ok = res.ok;
      } catch {
        const message = "Could not add the candidate. Check your connection and try again.";
        showToast(message, "error");
        throw new Error(message);
      }

      if (!ok || !data?.candidate || !Array.isArray(data?.candidates)) {
        const message =
          (typeof data?.error === "string" && data.error) ||
          "Could not add the candidate. Please try again.";
        showToast(message, "error");
        throw new Error(message);
      }

      const roster = data.candidates as CandidateProfile[];
      const created = data.candidate as CandidateProfile;
      applyServerRoster(roster, created.id);
      setActiveCandidateIdState(created.id);
      rememberLastUsed(created);
      try {
        sessionStorage.setItem(ACTIVE_CANDIDATE_STORAGE_KEY, created.id);
      } catch {
        /* non-fatal */
      }

      const display = { ...created, label: formatCandidateLabel(created, roster) };
      showToast(`Added ${display.label} profile!`, "success");
      return display;
    },
    [profile?.visaCategory, profile?.visaType, user?.id, applyServerRoster, showToast]
  );

  // ── Update Candidate ──────────────────────────────────────────────────────
  const updateCandidate = useCallback(
    (id: string, updates: Partial<CandidateProfile>) => {
      // Identity and billing fields are server-owned; never apply or send them.
      const editable: Partial<CandidateProfile> = { ...updates };
      delete editable.id;
      delete editable.tier;
      delete editable.categorySlot;
      delete editable.isPrimary;
      delete editable.isPreview;
      delete editable.visaCategory;
      delete editable.createdAt;

      const updated = candidatesRef.current.map((c) => (c.id === id ? { ...c, ...editable } : c));
      candidatesRef.current = updated;
      setCachedCandidates(updated);

      if (user?.id) {
        writeCandidatesToStorage(user.id, updated);
        updateProfile({ candidates: updated }, { silent: true, localOnly: true });

        // The stored label is server-owned too (the display label comes from customName).
        const serverUpdates: Partial<CandidateProfile> = { ...editable };
        delete serverUpdates.label;
        fetch("/api/candidate/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", candidateId: id, updates: serverUpdates }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              console.error("[CandidateContext] Server candidate update error:", err);
              showToast(
                (typeof err?.error === "string" && err.error) || "Could not save the change.",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("[CandidateContext] Network error updating candidate:", err);
          });
      }
    },
    [user?.id, updateProfile, showToast]
  );

  // ── Remove Candidate (server first) ───────────────────────────────────────
  // The server decides (paid plan, category's first candidate, candidate-1), so the
  // local roster changes only after it confirms. Nothing is removed optimistically.
  const removeCandidate = useCallback(
    async (id: string): Promise<boolean> => {
      if (id === "candidate-1" || candidatesRef.current.length <= 1) {
        showToast("Cannot remove the primary candidate profile.", "error");
        return false;
      }
      if (!user?.id) return false;

      const target = candidatesRef.current.find((c) => c.id === id);
      let data: { candidates?: unknown; activeCandidateId?: unknown; error?: unknown } = {};
      try {
        const res = await fetch("/api/candidate/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: id }),
        });
        data = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(data?.candidates)) {
          showToast(
            (typeof data?.error === "string" && data.error) ||
              "Could not remove the candidate. Please try again.",
            "error"
          );
          return false;
        }
      } catch {
        showToast("Could not remove the candidate. Check your connection and try again.", "error");
        return false;
      }

      const roster = data.candidates as CandidateProfile[];
      const nextActiveId =
        activeCandidateId === id
          ? (data.activeCandidateId as string) || roster[0]?.id || "candidate-1"
          : activeCandidateId;
      applyServerRoster(roster, nextActiveId);
      setActiveCandidateIdState(nextActiveId);

      try {
        sessionStorage.setItem(ACTIVE_CANDIDATE_STORAGE_KEY, nextActiveId);
        const lastUsed = readLastUsedByPool();
        for (const [pool, cid] of Object.entries(lastUsed)) {
          if (cid === id) delete lastUsed[pool];
        }
        sessionStorage.setItem(LAST_USED_BY_POOL_STORAGE_KEY, JSON.stringify(lastUsed));
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

      showToast(`Removed ${target?.label || "candidate"} profile.`, "info");
      return true;
    },
    [activeCandidateId, user?.id, applyServerRoster, showToast]
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
  // candidate's own visaCategory and category slot (NOT an ambient journey_type) so a
  // cross-category candidate maps to the right config/journey row.
  const activeJourneyBase = useMemo(
    () => getBaseVisaCategory(activeCandidate.visaCategory),
    [activeCandidate.visaCategory]
  );
  const activeJourneyKey = useMemo(
    () => getJourneyKeyForCandidate(activeCandidate),
    [activeCandidate]
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
      isRosterReady,
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
      isRosterReady,
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
