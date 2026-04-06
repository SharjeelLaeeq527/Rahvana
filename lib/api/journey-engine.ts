
export interface StepCompletionRequest {
  journeyId: string;
  stepKey: string;
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
  // Placeholder implementation for Hashir's local testing
  console.log(`[Hashir -> Hammad] Notification: Step ${req.stepKey} completed via ${req.completionSource}`);
  

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/internal/steps/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    
    if (res.ok) return await res.json();
  } catch (e) {
    // If not ready yet, just return a mock success
  }

  return {
    success: true,
    message: "Handoff recorded. Awaiting Hammad's engine integration.",
    isJourneyComplete: false,
    nextSuggestedStep: undefined
  };
}
