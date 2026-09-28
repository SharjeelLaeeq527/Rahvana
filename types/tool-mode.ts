// types/tool-mode.ts
// ============================================================================
// Tool Mode & Isolation Types
//
// Governs the execution environment of tools across the platform:
// - 'journey': Embedded inside a journey roadmap; reads & writes candidate/journey state.
// - 'standalone': Direct tool access; saves in isolated standalone storage, zero cross-leak with journeys.
// ============================================================================

export type ToolMode = "journey" | "standalone";

export interface JourneyToolContext {
  /** The journey slug (e.g. "ir5-journey", "ir1-journey") */
  journeySlug: string;
  /** The base visa category (e.g. "IR-5", "IR-1") */
  journeyCategory: string;
  /** Active candidate ID (e.g. "candidate-1", "candidate-2") */
  candidateId: string;
  /** Backend journey UUID if available */
  backendId?: string | null;
}

export interface ToolModeProps {
  /**
   * Execution mode:
   * - 'journey': Operates within journey/candidate scope, pre-fills & saves to roadmap.
   * - 'standalone': Operates in isolated standalone scope, saves independently.
   * If omitted, defaults to auto-detection via useResolveToolMode().
   */
  mode?: ToolMode;
  /** Context supplied when embedded in a journey */
  journeyContext?: JourneyToolContext;
}
