// __tests__/candidate/candidate-guides.test.ts
// ============================================================================
// Multi-Candidate Guides Isolation & Progress Tests
// ============================================================================

describe("Multi-Candidate Guides Isolation Engine", () => {
  describe("Candidate ID Scoping & Default Resolution", () => {
    it("resolves default candidateId to candidate-1 when omitted", () => {
      const getCandidateId = (param?: string | null) => param || "candidate-1";
      expect(getCandidateId(undefined)).toBe("candidate-1");
      expect(getCandidateId(null)).toBe("candidate-1");
      expect(getCandidateId("candidate-2")).toBe("candidate-2");
      expect(getCandidateId("candidate-3")).toBe("candidate-3");
    });

    it("matches candidate-1 for legacy null candidate_id records", () => {
      const isRecordMatchForCandidate = (
        recordCandidateId: string | null | undefined,
        activeCandidateId: string
      ) => {
        if (activeCandidateId === "candidate-1") {
          return recordCandidateId === "candidate-1" || recordCandidateId === null || recordCandidateId === undefined;
        }
        return recordCandidateId === activeCandidateId;
      };

      // Legacy null record
      expect(isRecordMatchForCandidate(null, "candidate-1")).toBe(true);
      expect(isRecordMatchForCandidate(undefined, "candidate-1")).toBe(true);
      expect(isRecordMatchForCandidate("candidate-1", "candidate-1")).toBe(true);

      // Candidate-2 should not see legacy null or candidate-1 records
      expect(isRecordMatchForCandidate(null, "candidate-2")).toBe(false);
      expect(isRecordMatchForCandidate("candidate-1", "candidate-2")).toBe(false);
      expect(isRecordMatchForCandidate("candidate-2", "candidate-2")).toBe(true);
    });
  });

  describe("Guide Session Isolation between Beneficiaries", () => {
    interface MockGuideSession {
      id: string;
      userId: string;
      guideSlug: string;
      candidateId: string;
      progressPercent: number;
      status: string;
      currentStepKey: string;
    }

    const mockDatabase: MockGuideSession[] = [
      {
        id: "session-mother-pcc",
        userId: "user-123",
        guideSlug: "police-verification-guide",
        candidateId: "candidate-1",
        progressPercent: 66,
        status: "in_progress",
        currentStepKey: "roadmap",
      },
      {
        id: "session-father-pcc",
        userId: "user-123",
        guideSlug: "police-verification-guide",
        candidateId: "candidate-2",
        progressPercent: 33,
        status: "in_progress",
        currentStepKey: "province_selection",
      },
      {
        id: "session-mother-passport",
        userId: "user-123",
        guideSlug: "passport-guide",
        candidateId: "candidate-1",
        progressPercent: 100,
        status: "completed",
        currentStepKey: "validation",
      },
    ];

    it("filters active guide sessions strictly by active candidate", () => {
      const filterSessionsForCandidate = (candidateId: string) => {
        return mockDatabase.filter((s) => s.candidateId === candidateId);
      };

      const motherSessions = filterSessionsForCandidate("candidate-1");
      expect(motherSessions).toHaveLength(2);
      expect(motherSessions.map((s) => s.guideSlug)).toEqual([
        "police-verification-guide",
        "passport-guide",
      ]);
      expect(motherSessions.find((s) => s.guideSlug === "police-verification-guide")?.progressPercent).toBe(66);

      const fatherSessions = filterSessionsForCandidate("candidate-2");
      expect(fatherSessions).toHaveLength(1);
      expect(fatherSessions[0].guideSlug).toBe("police-verification-guide");
      expect(fatherSessions[0].progressPercent).toBe(33);

      const childSessions = filterSessionsForCandidate("candidate-3");
      expect(childSessions).toHaveLength(0);
    });

    it("calculates step progress percent accurately per candidate session", () => {
      const stepIds = ["province_selection", "roadmap", "validation"];
      const calculateProgress = (stepKey: string) => {
        const stepIdx = stepIds.indexOf(stepKey);
        return Math.round(((stepIdx + 1) / stepIds.length) * 100);
      };

      expect(calculateProgress("province_selection")).toBe(33);
      expect(calculateProgress("roadmap")).toBe(67);
      expect(calculateProgress("validation")).toBe(100);
    });
  });

  describe("API Endpoint Scoping Construction", () => {
    it("constructs candidate-scoped query URLs for guides", () => {
      const buildProgressUrl = (slug: string, candidateId?: string) => {
        const id = candidateId || "candidate-1";
        return `/api/guides/progress?slug=${slug}&candidateId=${id}`;
      };

      const buildMyGuidesUrl = (candidateId?: string) => {
        const id = candidateId || "candidate-1";
        return `/api/guides/my-guides?candidateId=${id}`;
      };

      expect(buildProgressUrl("cnic-guide")).toBe("/api/guides/progress?slug=cnic-guide&candidateId=candidate-1");
      expect(buildProgressUrl("cnic-guide", "candidate-2")).toBe("/api/guides/progress?slug=cnic-guide&candidateId=candidate-2");

      expect(buildMyGuidesUrl()).toBe("/api/guides/my-guides?candidateId=candidate-1");
      expect(buildMyGuidesUrl("candidate-2")).toBe("/api/guides/my-guides?candidateId=candidate-2");
    });
  });

  describe("Save Guide Button & Session Saved State Lifecycle", () => {
    it("initializes a newly started session with saved: false so the save button is visible", () => {
      const createStartedSession = (guideId: string, candidateId: string) => ({
        id: `sess_${guideId}_${candidateId}`,
        guide_id: guideId,
        candidate_id: candidateId,
        status: "in_progress",
        saved: false,
        progress_percent: 0,
      });

      const session = createStartedSession("birth-certificate", "candidate-1");
      expect(session.saved).toBe(false);
      expect(session.status).toBe("in_progress");

      // WizardSidebar visibility condition: (!session || (!session.saved && !localSaved))
      const isSaveButtonVisible = (sess: { saved?: boolean } | null, localSaved: boolean) => {
        return !sess || (!sess.saved && !localSaved);
      };

      expect(isSaveButtonVisible(session, false)).toBe(true);
      expect(isSaveButtonVisible(null, false)).toBe(true);
    });

    it("hides the save button after the user explicitly triggers save", () => {
      const isSaveButtonVisible = (sess: { saved?: boolean } | null, localSaved: boolean) => {
        return !sess || (!sess.saved && !localSaved);
      };

      // When user clicks save, localSaved becomes true
      expect(isSaveButtonVisible({ saved: false }, true)).toBe(false);

      // When backend session has saved: true, it remains hidden
      expect(isSaveButtonVisible({ saved: true }, false)).toBe(false);
    });

    it("only includes explicitly saved guides (saved: true) in My Guides and resources page", () => {
      const sessions = [
        { id: "1", slug: "passport-guide", saved: false, status: "in_progress", progress_percent: 33 },
        { id: "2", slug: "birth-certificate-guide", saved: true, status: "in_progress", progress_percent: 66 },
        { id: "3", slug: "cnic-guide", saved: false, status: "not_started", progress_percent: 0 },
        { id: "4", slug: "frc-guide", saved: true, status: "completed", progress_percent: 100 },
      ];

      // My Guides filter: strictly s.saved === true
      const isSavedGuide = (s: { saved: boolean }) => s.saved === true;

      const myGuides = sessions.filter(isSavedGuide);
      expect(myGuides).toHaveLength(2);
      expect(myGuides.map((g) => g.slug)).toEqual(["birth-certificate-guide", "frc-guide"]);

      // Unsaved guide with in-progress step data is excluded from My Guides / Resources
      const unsavedPassport = sessions.find((s) => s.slug === "passport-guide");
      expect(isSavedGuide(unsavedPassport!)).toBe(false);

      // Once the user clicks "Add to My Guides", saved becomes true and it appears in My Guides
      const explicitlySavedPassport = { ...unsavedPassport!, saved: true };
      expect(isSavedGuide(explicitlySavedPassport)).toBe(true);
      expect(explicitlySavedPassport.progress_percent).toBe(33);
    });

    it("starts a backend session on demand when user makes step progress and retains percentage on refresh", () => {
      let backendSession: {
        id: string;
        candidate_id: string;
        progress_percent: number;
        current_step_key: string | null;
        saved: boolean;
        status: string;
      } | null = null;

      // 1. User simply visits page - no session exists yet
      expect(backendSession).toBeNull();

      // 2. User answers step 1: document_need
      const stepKey = "document_need";
      const stepIdx = 0;
      const totalSteps = 3;
      const progressPercent = Math.round(((stepIdx + 1) / totalSteps) * 100);

      // On-demand start happens
      backendSession = {
        id: "real-uuid-12345",
        candidate_id: "candidate-1",
        progress_percent: progressPercent,
        current_step_key: stepKey,
        saved: false,
        status: "in_progress",
      };

      expect(backendSession.id).toBe("real-uuid-12345");
      expect(backendSession.progress_percent).toBe(33);
      expect(backendSession.saved).toBe(false);

      // 3. User refreshes the page: API loads existing session
      const loadedOnRefresh = { ...backendSession };
      expect(loadedOnRefresh.progress_percent).toBe(33);
      expect(loadedOnRefresh.current_step_key).toBe("document_need");
      expect(loadedOnRefresh.saved).toBe(false);
    });
  });
});
