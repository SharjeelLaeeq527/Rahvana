# Chapter 1: USCIS Petition Filing - Extraction

## CHAPTER 1 COMPLETE STEP SEQUENCE

```
CHAPTER 1: USCIS Petition Filing (17 Steps)
├─ Duration: ~15 months (USCIS review + approval)
└─ Steps:

  1. ✓ step_1_1   → Determine Eligibility (QUEST)
     Dependencies: []=
     Type: eligibility-suite questionnaire
     
  2. ✓ step_1_2   → Gather Required Documents (DOCS)
     Dependencies: [step_1_1]
     Type: Pakistan-specific document checklist
     
  3. ✓ step_1_3   → Review Filing Methods (FILING)
     Dependencies: [step_1_2]
     Type: Branch selector (Online $625 vs Paper $675)
     Branch: both
     
  ├─── ONLINE FILING BRANCH ──────────────────
  │   4. ✓ step_1_4   → Fill Form I-130 (TOOL)
  │      Dependencies: [step_1_3]
  │      Feature: Autoform Filler guidance
  │      Branch: online
  │      
  │   5. ✓ step_1_5   → Fill Form I-130A (TOOL)
  │      Dependencies: [step_1_4]
  │      Feature: Beneficiary spouse info form
  │      Branch: online
  │      
  │   6. ✓ step_1_6   → Save USCIS Portal Login (TOOL)
  │      Dependencies: [step_1_5]
  │      Feature: Portal credential vault
  │      Branch: online
  │      
  │   7. ✓ step_1_7   → Pay Filing Fee Online (TOOL)
  │      Dependencies: [step_1_6]
  │      Fee: $625
  │      Branch: online
  │      
  │   8. ✓ step_1_8   → Review & Submit Online (TOOL)
  │      Dependencies: [step_1_7]
  │      Feature: Final submission, receipt issued
  │      Branch: online
  │
  ├─── PAPER FILING BRANCH ───────────────────
  │   (Alternative path if user selects "Paper")
  │
  └─── COMMON TRACKING STEPS (after filing) ──
      9. ✓ step_1_9   → Track USCIS Status (TOOL)
         Dependencies: [step_1_8 OR step_1_14]
         Feature: Receipt number tracking
         
      10. ✓ step_1_10  → Manage Case Documents (TOOL)
          Dependencies: [step_1_9]
          
      11. ✓ step_1_11  → Print/Download Forms (ACTION)
          Dependencies: [step_1_10]
          
      12. ✓ step_1_12  → Save Original Documents (ACTION)
          Dependencies: [step_1_11]
          
      13. ✓ step_1_13  → Mail Petition Packet (ACTION)
          Dependencies: [step_1_12]
          
      14. ✓ step_1_14  → Track Mailing Status (TOOL)
          Dependencies: [step_1_13]
          Feature: EasyPost tracking integration
          
      15. ✓ step_1_15  → Await Approval (TOOL)
          Dependencies: [step_1_14]
          Feature: Case status waiting period
          
      16. ✓ step_1_16  → Track in CEAC System (TOOL)
          Dependencies: [step_1_15]
          Tier: PREMIUM ONLY (hard lock for free/basic)
          
      17. ✓ step_1_17  → Receive Approval Notice (TOOL)
          Dependencies: [step_1_16]
          Milestone: I-130 Approval
```

---

## KEY CHAPTER 1 FUNCTIONS

### 1. **Chapter Detection Function**
**File:** [app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/ChapterView.tsx](app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/ChapterView.tsx#L58)

```typescript
// LINE 58: Basic Chapter 1 Detection
const isChapter1 = chapterIdx === 0;

// LINE 73-74: Step-level Chapter 1 Detection
const isChapter1Step = 
  isChapter1 && 
  typeof state.currentStep === "number" && 
  state.currentStep >= 0;
```

---

### 2. **Chapter 1 Tier-Based Gating Function**
**File:** [ChapterView.tsx](app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/ChapterView.tsx#L96-L135)

```typescript
// LINE 96-135: Determine if step is locked based on user tier
const getStepAccessibility = (idx: number, step: RoadmapStep) => {
  const isFreeTier = plan.currentTier === "free";
  const isBasicTier = plan.currentTier === "basic";
  
  // RULE 1: Free tier only gets first step of Chapter 1
  if (isFreeTier && isChapter1 && idx > 0) {
    return {
      isLocked: true,
      requiredPlan: "basic",
      reason: "free-limited-to-first-step"
    };
  }
  
  // RULE 2: Hard tier locks for specific steps
  const hardTierLocks: Record<string, string[]> = {
    step_1_16: ["free", "basic"],  // CEAC Tracking = Premium+ only
  };
  
  const requiredTier = hardTierLocks[step.step_key];
  if (requiredTier?.includes(plan.currentTier)) {
    return {
      isLocked: true,
      requiredPlan: "premium",
      reason: "premium-feature"
    };
  }
  
  return { isLocked: false };
};
```

---

### 3. **Chapter 1 Branch Selection Logic**
**File:** [StepView.tsx](app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/StepView.tsx#L1373-1395)

```typescript
// LINE 1373-1395: Handle filing method confirmation
const handleConfirmation = (method: "online" | "paper") => {
  console.log("[StepView] handleConfirmation:", method);
  
  // Record filing method in metadata
  actions.updateMetadata({
    filingMethod: method,
    filingMethodConfirmed: true,
  });
  
  // Lock the filing method (user must go back to change)
  setIsLocked(true);
  
  // Auto-complete the filing method selection step
  if (!isCompleted) {
    handleToggleComplete();
  }
  
  // Navigate to next step
  const nextIdx = (state.currentStep || 0) + 1;
  if (nextIdx < activeStepsInChapter.length) {
    actions.setCurrentStep(nextIdx);
  }
};
```

---

### 4. **Chapter 1 Step Completion Handler**
**File:** [StepView.tsx](app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/StepView.tsx#L1376-1421)

```typescript
// LINE 1376-1421: Core completion logic with milestone tracking
const handleToggleComplete = () => {
  const stepKey = currentStep.step_key || sId;
  
  // Milestone metadata mappings - set when step is completed
  const milestoneMetaMap: Record<string, { key: string; value?: () => string }> = {
    step_1_3: { 
      key: "filingMethod",
      value: () => state.metadata.filingMethod || "online" 
    },
    step_1_6: { 
      key: "uscisPortalSaved",
      value: () => "true" 
    },
    step_1_7: { 
      key: "filingFeeDate",
      value: () => new Date().toISOString().slice(0, 10) 
    },
    step_1_8: { 
      key: "submissionDate",
      value: () => new Date().toISOString().slice(0, 10) 
    },
    step_1_17: { 
      key: "approvalDate",
      value: () => new Date().toISOString().slice(0, 10) 
    },
  };
  
  // 1. Call the toggleComplete action (enforces sequential completion)
  actions.toggleComplete(stepKey);
  
  // 2. Set milestone metadata if applicable
  const metaObj = milestoneMetaMap[stepKey];
  if (
    metaObj &&
    (state.metadata[metaObj.key] === undefined ||
      state.metadata[metaObj.key] === null ||
      state.metadata[metaObj.key] === "")
  ) {
    const value = metaObj.value
      ? metaObj.value()
      : new Date().toISOString().slice(0, 10);
    
    console.log(
      `[Milestone] Setting metadata field '${metaObj.key}' to:`,
      value
    );
    actions.updateMetadata({ [metaObj.key]: value });
  }
};
```

---

### 5. **Chapter 1 Step Prerequisite Checker**
**File:** [useWizard.ts](app/(main)/dashboard/hooks/useWizard.ts#L318-365)

```typescript
// LINE 318-365: Sequential completion enforcement
toggleComplete: async (stepKey: string) => {
  if (!state.backendId) {
    console.warn("[useWizard] toggleComplete: No backendId found");
    return;
  }

  const isCompleted = state.completedSteps.has(stepKey);

  // ENFORCE SEQUENTIAL COMPLETION (only when marking as complete)
  if (!isCompleted) {
    // Get all active steps for this chapter
    const activeSteps = getAllActiveSteps(data, state.metadata, state.filingType);
    
    // Find the current step index
    const currentStepIdx = activeSteps.findIndex(
      (s) => (s.step_key || s.id) === stepKey
    );
    
    if (currentStepIdx > 0) {
      // Check all previous steps are complete
      const firstIncomplete = activeSteps
        .slice(0, currentStepIdx)
        .find((s) => !state.completedSteps.has(s.step_key || s.id));
      
      if (firstIncomplete) {
        // HARD BLOCK - cannot complete out of order
        toast.error(`Previous step pending: "${firstIncomplete.step_name}"`, {
          description: "Steps must be completed in order.",
          duration: 4000
        });
        return;
      }
    }
  }

  // If passed all checks, call API to mark complete
  const stepUuid = state.currentStep; // from backend mapping
  const res = await fetch(
    `/api/steps/${stepUuid}?action=complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  );

  if (res.ok) {
    // Update local state
    state.completedSteps.add(stepKey);
    console.log("[useWizard] Step completed:", stepKey);
  }
};
```

---

### 6. **Chapter 1 Visual Styling Function**
**File:** [StepView.tsx](app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/v2/StepView.tsx#L239-245)

```typescript
// LINE 239-245: Chapter 1 Detection by step key prefix
const isChapter1 = sId.startsWith("step_1_");
const isChapter2 = sId.startsWith("step_2_");
const isChapter3 = sId.startsWith("step_3_");

// Apply burgundy theme for Chapter 1
className={`
  ${isChapter1 ? "ch1step-bg" : isChapter2 ? "ch2step-bg" : "bg-slate-50"}
`}
```

---

### 7. **Chapter 1 Filing Branch Visibility**
**File:** [journeyHelpers.ts](lib/journey/journeyHelpers.ts) (inferred)

```typescript
// Determine which steps are visible based on filing method
const getVisibleSteps = (
  steps: RoadmapStep[],
  filingMethod: "online" | "paper" | null
): RoadmapStep[] => {
  if (!filingMethod) {
    // Before step 3 is complete, show all potential steps
    return steps.filter(s => !s.branch);
  }
  
  return steps.filter(s => {
    // Show steps that match the selected branch or are not branch-specific
    return !s.branch || s.branch === filingMethod || s.branch === "both";
  });
};
```

---

## CHAPTER 1 DATA STRUCTURE (from ir-1.json)

### Chapter Header
```json
{
  "chapter_key": "chapter_1",
  "chapter_number": 1,
  "chapter_name": "Chapter 1: USCIS Petition Filing",
  "chapter_description": "File your I-130 petition with USCIS and track approval.",
  "estimated_duration_months": 15,
  "display_order": 1,
  "steps": [ /* 17 step objects */ ]
}
```

### Step Structure (Example: step_1_3)
```json
{
  "step_key": "step_1_3",
  "step_number": 3,
  "step_name": "Review Filing Methods",
  "step_type": "filing",
  "step_description": "Choose how to file your petition.",
  "dependencies": ["step_1_2"],
  "visible_when": {},
  "branch": "both",
  "filing_data": {
    "methods": [
      {
        "id": "online",
        "name": "File Online",
        "price": "$625",
        "subtitle": "myUSCIS · instant receipt number",
        "features": [
          "Instant receipt number",
          "Fastest processing",
          "Digital tracking",
          "Secure submission"
        ]
      },
      {
        "id": "paper",
        "name": "File by Mail",
        "price": "$675",
        "subtitle": "physical packet · mailed to USCIS",
        "features": [
          "Physical paper forms",
          "Traditional method",
          "Postal tracking",
          "Direct submission"
        ]
      }
    ],
    "footerNote": "Fees as of March 2026 per USCIS G-1055."
  }
}
```

---

## TIER GATING MATRIX FOR CHAPTER 1

| Step | Free | Basic | Premium | Notes |
|------|------|-------|---------|-------|
| 1_1  | ✓    | ✓     | ✓       | Eligibility check |
| 1_2  | ✗    | ✓     | ✓       | Document checklist |
| 1_3  | ✗    | ✓     | ✓       | Filing method selection |
| 1_4  | ✗    | ✓     | ✓       | Form filling |
| 1_5  | ✗    | ✓     | ✓       | Form filling |
| 1_6  | ✗    | ✓     | ✓       | Portal credentials |
| 1_7  | ✗    | ✓     | ✓       | Fee payment |
| 1_8  | ✗    | ✓     | ✓       | Submission |
| 1_9  | ✗    | ✓     | ✓       | Status tracking |
| 1_10 | ✗    | ✓     | ✓       | Document management |
| 1_11 | ✗    | ✓     | ✓       | Print guide |
| 1_12 | ✗    | ✓     | ✓       | Document save |
| 1_13 | ✗    | ✓     | ✓       | Mailing |
| 1_14 | ✗    | ✓     | ✓       | Tracking |
| 1_15 | ✗    | ✓     | ✓       | Wait period |
| 1_16 | ✗    | ✗     | ✓       | **CEAC system** (Premium only) |
| 1_17 | ✗    | ✓     | ✓       | Approval milestone |

---

## KEY METADATA FIELDS SET BY CHAPTER 1

```typescript
{
  filingMethod: "online" | "paper",        // Set at step_1_3
  filingMethodConfirmed: boolean,          // Lock filing method
  uscisPortalSaved: boolean,               // Set at step_1_6
  filingFeeDate: "YYYY-MM-DD",             // Set at step_1_7
  submissionDate: "YYYY-MM-DD",            // Set at step_1_8
  receiptNum: string,                      // Set at step_1_3 (demo)
  approvalDate: "YYYY-MM-DD",              // Set at step_1_17
  civilDocsStatus: {                       // Document review status
    [docId]: "not-started" | "in-progress" | "reviewed"
  },
  uscisCredentials: {                      // Portal login
    username: string,
    password: string // encrypted
  }
}
```

---

## SEQUENTIAL DEPENDENCY CHAIN FOR CHAPTER 1

```
[1_1] Eligibility
  ↓
[1_2] Documents
  ↓
[1_3] Filing Method (BRANCH POINT)
  ├── [ONLINE] ────────────────────────────┐
  │   [1_4] Form I-130                     │
  │   [1_5] Form I-130A                    │
  │   [1_6] Save Portal Login              │
  │   [1_7] Pay Fee Online ($625)          │
  │   [1_8] Review & Submit                │
  │                                        ├── [1_9] Track Status
  ├── [PAPER] ─────────────────────────────┤
  │   [1_9] Review & Print                 │
  │   [1_10] Save Documents                │
  │   [1_11] Mail Packet                   │
  │   [1_12] Track Mailing                 │
  │                                        │
  └────────────────────────────────────────┘
                                           ↓
[1_10] Manage Documents (parallel/overlapping)
  ↓
[1_11-1_15] Tracking & Waiting Period
  ↓
[1_16] CEAC Tracking (Premium: blocked for free/basic)
  ↓
[1_17] Approval Notice Received ← CHAPTER 1 COMPLETE
```

---

## SUMMARY

**Total Chapter 1 Steps:** 17
**Free Tier Access:** Only step_1_1
**Premium Gate:** step_1_16 (CEAC Tracking)
**Visual Theme:** Burgundy/Rose (#c0596a background)
**Estimated Duration:** 15 months
**Branch Point:** Step 1_3 (Online vs Paper filing)
**Key Milestone:** Step 1_17 (I-130 Approval)
