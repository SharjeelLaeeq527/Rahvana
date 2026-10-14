import { useState, useEffect, useCallback } from "react";

export interface GuideSession {
  hide_intro_modal: boolean;
  saved: boolean;
  id: string;
  status: "not_started" | "in_progress" | "completed" | "abandoned";
  progress_percent: number;
  current_step_key: string | null;
  guides?: {
    slug: string;
    title: string;
    description: string;
  };
}

export interface GuideStepData {
  step_key: string;
  data: any;
  is_completed: boolean;
}

/**
 * Guide progress is fetched over the network, and every guide page blocks on it with a
 * spinner. To make a guide open instantly (like a journey tool does) the journey toolbox
 * warms this snapshot cache via `preloadGuideSession` before the guide can be clicked;
 * a hook that finds a snapshot renders straight away instead of showing a loader.
 */
export interface GuideProgressSnapshot {
  session: GuideSession | null;
  steps: Record<string, any>;
  fetchedAt: number;
}

/** A snapshot older than this is silently revalidated on mount. */
const SNAPSHOT_MAX_AGE_MS = 60_000;

const progressCache = new Map<string, GuideProgressSnapshot>();
const progressInflight = new Map<string, Promise<GuideProgressSnapshot>>();

const snapshotKey = (slug: string, candidateId: string) => `${slug}::${candidateId}`;

async function loadGuideProgress(
  slug: string,
  candidateId: string
): Promise<GuideProgressSnapshot> {
  const key = snapshotKey(slug, candidateId);
  const existing = progressInflight.get(key);
  if (existing) return existing;

  const request = (async () => {
    const res = await fetch(`/api/guides/progress?slug=${slug}&candidateId=${candidateId}`);
    const data = await res.json();
    const steps = (data.steps || []).reduce((acc: Record<string, any>, step: any) => {
      acc[step.step_key] = step.data;
      return acc;
    }, {});
    const snapshot: GuideProgressSnapshot = {
      session: data.session ?? null,
      steps,
      fetchedAt: Date.now(),
    };
    progressCache.set(key, snapshot);
    return snapshot;
  })();

  progressInflight.set(key, request);
  try {
    return await request;
  } finally {
    progressInflight.delete(key);
  }
}

/** The device-local copy of a guide, used whenever the server has no session yet. */
function readLocalGuideCache(
  slug: string,
  candidateId: string
): { session: GuideSession | null; steps: Record<string, any> } {
  if (typeof window === "undefined") return { session: null, steps: {} };
  try {
    const cachedSession = localStorage.getItem(`rahvana_guide_${slug}_${candidateId}`);
    const cachedSteps = localStorage.getItem(`rahvana_guide_steps_${slug}_${candidateId}`);
    return {
      session: cachedSession ? JSON.parse(cachedSession) : null,
      steps: cachedSteps ? JSON.parse(cachedSteps) : {},
    };
  } catch {
    return { session: null, steps: {} };
  }
}

/** Fetches a guide's progress ahead of time so opening it needs no loading state. */
export function preloadGuideSession(slug?: string | null, candidateId = "candidate-1"): void {
  if (!slug || typeof window === "undefined") return;
  const key = snapshotKey(slug, candidateId);
  if (progressInflight.has(key)) return;
  const cached = progressCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < SNAPSHOT_MAX_AGE_MS) return;
  void loadGuideProgress(slug, candidateId).catch(() => {
    // best effort - the hook still fetches on mount
  });
}

/** Keeps the warm snapshot in step with local writes (saves, "Add to My Guides"). */
export function patchGuideSessionCache(
  slug: string,
  candidateId: string,
  patch: { session?: GuideSession | null; steps?: Record<string, any> }
): void {
  const key = snapshotKey(slug, candidateId);
  const current = progressCache.get(key);
  progressCache.set(key, {
    session: patch.session !== undefined ? patch.session : (current?.session ?? null),
    steps: patch.steps !== undefined ? patch.steps : (current?.steps ?? {}),
    fetchedAt: Date.now(),
  });
}

export const useGuideSession = (slug: string, candidateId: string = "candidate-1") => {
  // A snapshot warmed by `preloadGuideSession` lets the guide render on its first frame.
  const warmSnapshot = progressCache.get(snapshotKey(slug, candidateId));

  const [session, setSession] = useState<GuideSession | null>(
    () => warmSnapshot?.session ?? readLocalGuideCache(slug, candidateId).session
  );
  const [stepsData, setStepsData] = useState<Record<string, any>>(() =>
    warmSnapshot?.session ? warmSnapshot.steps : readLocalGuideCache(slug, candidateId).steps
  );
  const [loading, setLoading] = useState(!warmSnapshot);
  const [saving, setSaving] = useState(false);

  const syncToLocal = useCallback(
    (newSession: GuideSession | null, newSteps?: Record<string, any>) => {
      if (typeof window === "undefined") return;
      try {
        if (newSession) {
          localStorage.setItem(`rahvana_guide_${slug}_${candidateId}`, JSON.stringify(newSession));
          if (newSteps) {
            localStorage.setItem(
              `rahvana_guide_steps_${slug}_${candidateId}`,
              JSON.stringify(newSteps)
            );
          }
          const listRaw = localStorage.getItem(`rahvana_guide_sessions_${candidateId}`);
          const list: GuideSession[] = listRaw ? JSON.parse(listRaw) : [];
          const filtered = list.filter(
            (s) => (s.guides?.slug && s.guides.slug !== slug) && s.id !== newSession.id
          );
          if (newSession.saved) {
            localStorage.setItem(
              `rahvana_guide_sessions_${candidateId}`,
              JSON.stringify([newSession, ...filtered])
            );
          } else {
            localStorage.setItem(
              `rahvana_guide_sessions_${candidateId}`,
              JSON.stringify(filtered)
            );
          }
        } else {
          localStorage.removeItem(`rahvana_guide_${slug}_${candidateId}`);
          localStorage.removeItem(`rahvana_guide_steps_${slug}_${candidateId}`);
        }
      } catch {
        // Ignore storage errors
      }
    },
    [slug, candidateId]
  );

  const fetchProgress = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      const data = await loadGuideProgress(slug, candidateId);

      if (data.session) {
        setSession(data.session);
        const stepsMap = data.steps;
        setStepsData(stepsMap);
        syncToLocal(data.session, stepsMap);
      } else {
        // Check local cache if API returns null
        if (typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem(`rahvana_guide_${slug}_${candidateId}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              setSession(parsed);
              const cachedSteps = localStorage.getItem(
                `rahvana_guide_steps_${slug}_${candidateId}`
              );
              if (cachedSteps) setStepsData(JSON.parse(cachedSteps));
              return;
            }
          } catch {
            // Ignore
          }
        }
        setSession(null);
        setStepsData({});
      }
    } catch (error) {
      console.error("Failed to fetch guide progress:", error);
    } finally {
      setLoading(false);
    }
  }, [slug, candidateId, syncToLocal]);

  const startSession = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/guides/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, candidateId }),
      });
      const data = await res.json();
      if (data.session) {
        const enrichedSession: GuideSession = {
          ...data.session,
          guides: data.session.guides || {
            slug,
            title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            description: "",
          },
        };
        setSession(enrichedSession);
        syncToLocal(enrichedSession, stepsData);
        patchGuideSessionCache(slug, candidateId, {
          session: enrichedSession,
          steps: stepsData,
        });
        return enrichedSession;
      }
    } catch (error) {
      console.error("Failed to start guide session:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const saveStep = async (
    stepKey: string,
    data: any,
    isCompleted = false,
    progressPercent?: number
  ) => {
    // Optimistically update step state
    const newSteps = { ...stepsData, [stepKey]: data };
    setStepsData(newSteps);

    let activeSession = session;

    // If there is no active backend session yet (or it has a dummy local id), start one on demand
    if (!activeSession || !activeSession.id || activeSession.id.startsWith("local_")) {
      try {
        const started = await startSession(true);
        if (started) {
          activeSession = started;
        }
      } catch (err) {
        console.error("Failed to ensure active backend session before saving step:", err);
      }
    }

    const calculatedProgress =
      progressPercent !== undefined
        ? progressPercent
        : (activeSession?.progress_percent ?? (session?.progress_percent || 0));

    const updatedSession: GuideSession = activeSession
      ? {
          ...activeSession,
          current_step_key: stepKey,
          progress_percent: calculatedProgress,
          status:
            calculatedProgress >= 100
              ? "completed"
              : activeSession.status === "completed"
                ? "completed"
                : "in_progress",
          guides: activeSession.guides || {
            slug,
            title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            description: "",
          },
        }
      : {
          id: `local_${slug}_${candidateId}`,
          status: calculatedProgress >= 100 ? "completed" : "in_progress",
          progress_percent: calculatedProgress,
          current_step_key: stepKey,
          saved: false,
          hide_intro_modal: false,
          guides: {
            slug,
            title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            description: "",
          },
        };

    setSession(updatedSession);
    syncToLocal(updatedSession, newSteps);
    patchGuideSessionCache(slug, candidateId, { session: updatedSession, steps: newSteps });

    if (!activeSession?.id || activeSession.id.startsWith("local_")) return;

    try {
      setSaving(true);
      await fetch("/api/guides/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideSessionId: activeSession.id,
          stepKey,
          data,
          isCompleted,
          progressPercent: calculatedProgress,
        }),
      });
    } catch (error) {
      console.error("Failed to save step progress to server:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    const snapshot = progressCache.get(snapshotKey(slug, candidateId));
    if (snapshot) {
      // Apply it (a no-op on first render, a real switch when the candidate changes).
      // A snapshot with no server session falls back to this device's copy, exactly
      // like the fetch path does, so local-only progress is never wiped.
      if (snapshot.session) {
        setSession(snapshot.session);
        setStepsData(snapshot.steps);
      } else {
        const local = readLocalGuideCache(slug, candidateId);
        setSession(local.session);
        setStepsData(local.steps);
      }
      setLoading(false);
      if (Date.now() - snapshot.fetchedAt >= SNAPSHOT_MAX_AGE_MS) {
        fetchProgress({ silent: true });
      }
      return;
    }
    fetchProgress();
  }, [slug, candidateId, fetchProgress]);

  return {
    session,
    stepsData,
    loading,
    saving,
    startSession,
    saveStep,
    refresh: fetchProgress,
  };
};
