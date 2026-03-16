import { createClient } from '@/lib/supabase/client';
import { WizardState } from '@/app/(main)/dashboard/hooks/useWizard';

export interface JourneyProgressRecord {
  id: string;
  user_id: string;
  journey_id: string;
  current_stage: number;
  current_step: number;
  scenario_type_ir2?: 'bio' | 'step' | 'adopted';
  completed_steps: string[];
  collapsed_steps: Record<string, boolean>;
  role: 'both' | 'petitioner' | 'beneficiary';
  filing_type: 'online' | 'paper' | 'both';
  document_checklist: Record<string, boolean>;
  notes: Record<string, string>;
  started: boolean;
  started_at: string;
  last_updated_at: string;
  doc_uploads: Record<string, { name: string; size: number; lastModified: number }>;
}

/**
 * Helper to wrap thenable actions with a timeout to prevent infinite hangs in the UI.
 * Default timeout is 10 seconds.
 */
async function withTimeout<T>(promiseLike: Promise<T> | PromiseLike<T>, timeoutMs: number = 10000): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
    clearTimeout(timeoutId!);
    return result as T;
  } catch (err) {
    clearTimeout(timeoutId!);
    throw err;
  }
}

/**
 * Load journey progress from Supabase for a logged-in user.
 * Returns null if no progress exists yet.
 */
export async function loadJourneyProgress(
  userId: string,
  journeyId: string
): Promise<JourneyProgressRecord | null> {
  if (!userId) return null;
  
  try {
    const supabase = createClient();
    const { data, error } = await withTimeout<any>(
      supabase
        .from('user_journey_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('journey_id', journeyId)
        .maybeSingle()
    );

    if (error) {
      console.error('[Journey] Failed to load progress:', error.message);
      return null;
    }

    return data as JourneyProgressRecord | null;
  } catch (error) {
    console.error('[Journey] loadJourneyProgress timed out or failed:', error);
    return null;
  }
}

/**
 * List all journey progress records for a user with minimal fields for performance.
 */
export async function listUserJourneys(userId: string): Promise<JourneyProgressRecord[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();
    const { data, error } = await withTimeout<any>(
      supabase
        .from('user_journey_progress')
        .select('id, journey_id, completed_steps, last_updated_at')
        .eq('user_id', userId)
        .order('last_updated_at', { ascending: false })
    );

    if (error) {
      console.error('[Journey] Failed to list journeys:', error.message);
      return [];
    }

    return (data || []) as JourneyProgressRecord[];
  } catch (error) {
    console.error('[Journey] listUserJourneys timed out or failed:', error);
    return [];
  }
}

/**
 * Delete all journey progress for a specific user.
 */
export async function deleteAllUserJourneys(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createClient();
    const { error } = await withTimeout<any>(
      supabase
        .from('user_journey_progress')
        .delete()
        .eq('user_id', userId)
    );

    if (error) {
      console.error('[Journey] Failed to delete all journeys:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Journey] deleteAllUserJourneys timed out or failed:', error);
    return false;
  }
}

/**
 * Save (upsert) journey progress to Supabase.
 * Uses ON CONFLICT (user_id, journey_id) to update existing record.
 */
export async function saveJourneyProgress(
  userId: string,
  journeyId: string,
  state: WizardState
): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createClient();
    const payload = {
      user_id: userId,
      journey_id: journeyId,
      scenario_type_ir2: state.scenarioType, 
      current_stage: state.currentStage,
      current_step: state.currentStep ?? 0,
      completed_steps: Array.from(state.completedSteps),
      collapsed_steps: state.collapsedSteps,
      role: state.role,
      filing_type: state.filingType,
      document_checklist: state.documentChecklist,
      notes: state.notes,
      doc_uploads: state.docUploads,
      started: state.started,
    };

    const { error } = await withTimeout<any>(
      supabase
        .from('user_journey_progress')
        .upsert(payload, {
          onConflict: 'user_id,journey_id',
        })
    );

    if (error) {
      console.error('[Journey] Failed to save progress:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Journey] saveJourneyProgress timed out or failed:', error);
    return false;
  }
}

/**
 * Delete journey progress (for "Start Fresh" functionality).
 */
export async function deleteJourneyProgress(
  userId: string,
  journeyId: string
): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = createClient();
    const { error } = await withTimeout<any>(
      supabase
        .from('user_journey_progress')
        .delete()
        .eq('user_id', userId)
        .eq('journey_id', journeyId)
    );

    if (error) {
      console.error('[Journey] Failed to delete progress:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Journey] deleteJourneyProgress timed out or failed:', error);
    return false;
  }
}

/**
 * Convert a DB record back to WizardState format.
 */
export function recordToWizardState(record: JourneyProgressRecord): Partial<WizardState> {
  return {
    currentStage: record.current_stage,
    currentStep: record.current_step,
    scenarioType: record.scenario_type_ir2,
    completedSteps: new Set(record.completed_steps),
    collapsedSteps: record.collapsed_steps,
    role: record.role,
    filingType: record.filing_type,
    documentChecklist: record.document_checklist,
    notes: record.notes,
    started: record.started,
    docUploads: record.doc_uploads || {},
  };
}
