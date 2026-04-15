import { stepService } from '@/lib/journey/service'
import * as db from '@/lib/journey/data-access'

export interface StepCompletionRequest {
  journeyId: string;
  stepKey: string;      // e.g. "I.4", "II.5"
  completionSource: 'tool' | 'document' | 'manual';
  metadata?: Record<string, unknown>;
}

export interface StepCompletionResponse {
  success: boolean;
  message: string;
  isJourneyComplete: boolean;
  nextSuggestedStep?: string;
}

export async function NOTIFY_StepCompletion(req: StepCompletionRequest): Promise<StepCompletionResponse> {
  // ─────────────────────────────────────────────────────────────
  // 1. Find the REAL step ID from Hammad's database using stepKey
  // ─────────────────────────────────────────────────────────────
  try {
    const steps = await db.getStepsForJourneyDB(req.journeyId);
    const targetStep = steps.find(s => s.step_key === req.stepKey);

    if (!targetStep) {
      console.warn(`[Hashir -> Hammad] Step key '${req.stepKey}' not found in DB for journey ${req.journeyId}.`);
      return { success: false, message: "Step not found", isJourneyComplete: false };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Call Hammad's Step Service to trigger progress & unlocking
    // ─────────────────────────────────────────────────────────────
    const result = await stepService.completeStep(
      targetStep.id, 
      req.journeyId, 
      req.metadata
    );

    console.log(`[Hashir -> Hammad] Successfully completed step ${req.stepKey} via ${req.completionSource}.`);
    
    return {
      success: true,
      message: "Step completion recorded by roadmap engine.",
      isJourneyComplete: result.journey_completion_percentage === 100,
      nextSuggestedStep: result.next_step?.step_key
    };
  } catch (error) {
    console.error(`[Hashir -> Hammad] Integration error:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Internal integration error",
      isJourneyComplete: false
    };
  }
}
