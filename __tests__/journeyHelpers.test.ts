import { isStageUnlocked, getStageProgress } from "@/app/components/journey-engine/journeyHelpers";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { RoadmapDataV3 } from "@/app/components/journey-engine/types";

describe("journeyHelpers - isStageUnlocked", () => {
  const mockData: RoadmapDataV3 = {
    chapters: [
      {
        id: "chapter1",
        chapter_key: "chapter1",
        chapter_name: "Chapter 1",
        steps: [
          { id: "step1.1", step_key: "step1.1", name: "Step 1.1" },
          { id: "step1.2", step_key: "step1.2", name: "Step 1.2" },
        ],
      },
      {
        id: "chapter2",
        chapter_key: "chapter2",
        chapter_name: "Chapter 2",
        steps: [
          { id: "step2.1", step_key: "step2.1", name: "Step 2.1" },
        ],
      },
      {
        id: "chapter3",
        chapter_key: "chapter3",
        chapter_name: "Chapter 3",
        steps: [
          { id: "step3.1", step_key: "step3.1", name: "Step 3.1" },
        ],
      },
    ],
  } as any;

  it("unlocks chapter 1 initially and locks other chapters", () => {
    const state: WizardState = {
      completedSteps: new Set(),
      metadata: {},
    } as any;

    expect(isStageUnlocked(mockData, 0, state)).toBe(true);
    expect(isStageUnlocked(mockData, 1, state)).toBe(false);
    expect(isStageUnlocked(mockData, 2, state)).toBe(false);
  });

  it("unlocks chapter 2 when chapter 1 is completed", () => {
    const state: WizardState = {
      completedSteps: new Set(["step1.1", "step1.2"]),
      metadata: {},
    } as any;

    expect(isStageUnlocked(mockData, 0, state)).toBe(true);
    expect(isStageUnlocked(mockData, 1, state)).toBe(true);
    expect(isStageUnlocked(mockData, 2, state)).toBe(false);
  });

  it("keeps chapter 2 unlocked if it has progress, even if chapter 1 becomes incomplete", () => {
    const state: WizardState = {
      // step1.2 is no longer completed (e.g. because of changing options), but step2.1 has progress
      completedSteps: new Set(["step1.1", "step2.1"]),
      metadata: {},
    } as any;

    expect(isStageUnlocked(mockData, 0, state)).toBe(true);
    expect(isStageUnlocked(mockData, 1, state)).toBe(true); // remains unlocked because step 2.1 is completed!
  });
});
