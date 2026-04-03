// lib/services/ToolIntegrationService.ts
// Manages tool routing, session persistence, and completion handling
// for all IR-1 Roadmap tools.
//
// Responsibilities:
//   1. getLaunchConfig()  — what data/config does a tool need to open?
//   2. preloadToolData()  — pre-fill tools from existing case data
//   3. getResumeSession() — check if user has partial work to resume
//   4. saveToolSession()  — upsert session state while user works
//   5. handleToolCompletion() — side effects after tool finishes
//   6. handleToolWebhook() — verify + route external tool callbacks
//
// Tools supported:
//   form_filler_i130         → Step I.4
//   affidavit_calculator     → Step II.5
//   ds260_prep               → Step II.3
//   interview_prep           → Step III.3
//   case_strength_checker    → Dashboard

import { createClient } from '@/lib/supabase/server'
import {
  ToolSession,
  ToolLaunchConfig,
  ToolKey,
} from '@/types/journey-support'
import { NOTIFY_StepCompletion } from '@/lib/api/journey-engine'

// ─────────────────────────────────────────────────────────────
// Tool registry — maps tool keys to metadata
// ─────────────────────────────────────────────────────────────

const TOOL_REGISTRY: Record<string, {
  label: string
  stepKey: string
  baseUrl: string
  description: string
}> = {
  form_filler_i130: {
    label: 'I-130 AutoFormFiller',
    stepKey: 'I.4',
    baseUrl: '/visa-forms/i130/wizard',
    description: 'Guided form completion for Form I-130 Petition for Alien Relative',
  },
  affidavit_calculator: {
    label: 'Affidavit of Support Calculator',
    stepKey: 'II.5',
    baseUrl: '/affidavit-support-calculator',
    description: 'Determine sponsor structure and required I-864 forms',
  },
  ds260_prep: {
    label: 'DS-260 Preparation Flow',
    stepKey: 'II.3',
    baseUrl: '/visa-forms/ds260/wizard',
    description: 'Prepare DS-260 immigrant visa application answers',
  },
  interview_prep: {
    label: 'Interview Preparation',
    stepKey: 'III.3',
    baseUrl: '/interview-prep',
    description: 'Consular interview readiness checklist and preparation guide',
  },
  case_strength_checker: {
    label: 'Case Strength Checker',
    stepKey: 'dashboard',
    baseUrl: '/visa-case-strength-checker',
    description: 'Analyze case preparedness and get recommendations',
  },
}

// Base URL for internal API calls (calling Hammad's API)
function getSiteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

// ─────────────────────────────────────────────────────────────
// 1. getLaunchConfig
// Returns everything the frontend needs to open a tool
// ─────────────────────────────────────────────────────────────

export async function getLaunchConfig(
  journeyId: string,
  toolKey: string,
  stepKey?: string
): Promise<ToolLaunchConfig> {
  const supabase = await createClient()
  const toolMeta = TOOL_REGISTRY[toolKey]
  const resolvedStepKey = stepKey ?? toolMeta?.stepKey ?? toolKey

  // Get any existing session to resume
  const resumeSession = await getResumeSession(journeyId, toolKey, resolvedStepKey)

  // Get preloaded data for tool
  const preloadData = await preloadToolData(toolKey as ToolKey, journeyId)

  const siteUrl = getSiteBaseUrl()

  return {
    tool_key: toolKey,
    tool_url: toolMeta ? `${siteUrl}${toolMeta.baseUrl}` : `${siteUrl}/${toolKey}`,
    preload_data: preloadData,
    has_resume_session: resumeSession !== null,
    resume_session: resumeSession,
    step_key: resolvedStepKey,
    journey_id: journeyId,
  }
}

// ─────────────────────────────────────────────────────────────
// 2. preloadToolData
// Reads case_data (Hammad's table — read only) and other
// sources to pre-fill tool forms
// ─────────────────────────────────────────────────────────────

export async function preloadToolData(
  toolKey: ToolKey | string,
  journeyId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient()

  try {
    // Fetch all case data for this journey (Hammad's table — read only)
    const { data: caseDataRows } = await supabase
      .from('case_data')
      .select('data_key, data_value')
      .eq('journey_id', journeyId)

    // Convert array of {data_key, data_value} to flat object
    const caseData: Record<string, unknown> = {}
    if (caseDataRows) {
      for (const row of caseDataRows) {
        caseData[row.data_key] = row.data_value
      }
    }

    // Tool-specific preload logic
    switch (toolKey) {
      case 'form_filler_i130':
        return preloadI130Data(caseData, journeyId)

      case 'affidavit_calculator':
        return preloadAffidavitData(caseData)

      case 'ds260_prep':
        return preloadDS260Data(caseData)

      case 'interview_prep':
        return await preloadInterviewPrepData(caseData, journeyId)

      case 'case_strength_checker':
        return await preloadCaseStrengthData(journeyId)

      default:
        // Unknown tool — return all case data as context
        return { case_data: caseData }
    }
  } catch (err) {
    console.error('[ToolIntegrationService.preloadToolData] Error:', err)
    return {} // Fail gracefully — tool opens without preload
  }
}

// ── Tool-specific preload functions ──────────────────────────

async function preloadI130Data(
  caseData: Record<string, unknown>,
  journeyId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient()

  // Get user profile for petitioner details
  const { data: { user } } = await supabase.auth.getUser()

  return {
    // From case data
    petitioner_citizenship: caseData.petitioner_citizenship ?? null,
    marriage_date: caseData.marriage_date ?? null,
    marriage_country: caseData.marriage_country ?? null,
    is_second_marriage: caseData.is_second_marriage ?? false,
    prior_marriage_terminated: caseData.prior_marriage_terminated ?? null,
    filing_method: caseData.filing_method ?? null,

    // From auth user
    petitioner_email: user?.email ?? null,

    // Journey context
    journey_id: journeyId,
    tool_context: 'i130_wizard',
  }
}

function preloadAffidavitData(
  caseData: Record<string, unknown>
): Record<string, unknown> {
  return {
    // Sponsor structure if previously set
    sponsor_structure: caseData.sponsor_structure ?? null,

    // Household data if previously answered
    household_size: caseData.household_size ?? null,
    sponsor_income: caseData.sponsor_income ?? null,
    has_joint_sponsor: caseData.has_joint_sponsor ?? null,
    has_household_member: caseData.has_household_member ?? null,

    // Beneficiary info
    beneficiary_count: caseData.beneficiary_count ?? 1,

    tool_context: 'affidavit_calculator',
  }
}

function preloadDS260Data(
  caseData: Record<string, unknown>
): Record<string, unknown> {
  return {
    // NVC case info
    nvc_case_number: caseData.nvc_case_number ?? null,

    // Beneficiary details
    petitioner_citizenship: caseData.petitioner_citizenship ?? null,
    marriage_date: caseData.marriage_date ?? null,

    // Filing status context
    fees_paid: caseData.nvc_fees_paid ?? false,
    ds260_available: caseData.ds260_available ?? false,

    tool_context: 'ds260_prep',
  }
}

async function preloadInterviewPrepData(
  caseData: Record<string, unknown>,
  journeyId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient()

  // Get the scheduled interview appointment from journey_appointments
  const { data: interviews } = await supabase
    .from('journey_appointments')
    .select('appointment_date, appointment_time, location, provider, status')
    .eq('journey_id', journeyId)
    .eq('appointment_type', 'interview')
    .eq('status', 'scheduled')
    .order('appointment_date', { ascending: true })
    .limit(1)

  const interviewAppt = interviews && interviews.length > 0 ? interviews[0] : null

  return {
    interview_date: interviewAppt?.appointment_date ?? null,
    interview_time: interviewAppt?.appointment_time ?? null,
    interview_location: interviewAppt?.location ?? null,
    interview_provider: interviewAppt?.provider ?? null,
    has_interview_scheduled: interviewAppt !== null,

    // From case data
    nvc_case_number: caseData.nvc_case_number ?? null,
    sponsor_structure: caseData.sponsor_structure ?? null,

    tool_context: 'interview_prep',
  }
}

async function preloadCaseStrengthData(
  journeyId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient()

  // Get document summary
  const { data: docs } = await supabase
    .from('journey_documents')
    .select('status, is_required, document_type')
    .eq('journey_id', journeyId)
    .is('deleted_at', null)

  const documentSummary = {
    total: docs?.length ?? 0,
    uploaded: docs?.filter(d => d.status === 'uploaded').length ?? 0,
    missing: docs?.filter(d => d.status === 'not_started' && d.is_required).length ?? 0,
    expired: docs?.filter(d => d.status === 'expired').length ?? 0,
  }

  return {
    journey_id: journeyId,
    document_summary: documentSummary,
    tool_context: 'case_strength_checker',
  }
}

// ─────────────────────────────────────────────────────────────
// 3. getResumeSession
// Check if user has a partial session to resume
// ─────────────────────────────────────────────────────────────

export async function getResumeSession(
  journeyId: string,
  toolKey: string,
  stepKey?: string
): Promise<ToolSession | null> {
  const supabase = await createClient()

  let query = supabase
    .from('tool_sessions')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('tool_key', toolKey)
    .eq('is_completed', false)   // only look for incomplete sessions

  if (stepKey) {
    query = query.eq('step_key', stepKey)
  }

  const { data: sessions, error } = await query
    .order('last_saved_at', { ascending: false })
    .limit(1)

  if (error || !sessions || sessions.length === 0) {
    return null
  }

  return sessions[0] as ToolSession
}

// ─────────────────────────────────────────────────────────────
// 4. saveToolSession
// Upsert session state — called frequently while user works
// ─────────────────────────────────────────────────────────────

export async function saveToolSession(
  journeyId: string,
  toolKey: string,
  stepKey: string,
  sessionState: Record<string, unknown>,
  completionPercentage: number
): Promise<ToolSession | null> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('tool_sessions')
    .upsert(
      {
        journey_id: journeyId,
        step_key: stepKey,
        tool_key: toolKey,
        session_state: sessionState,
        completion_percentage: Math.min(Math.max(completionPercentage, 0), 100),
        is_completed: false,
      },
      { onConflict: 'journey_id,step_key,tool_key', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) {
    console.error('[ToolIntegrationService.saveToolSession] Error:', error)
    return null
  }

  return session as ToolSession
}

// ─────────────────────────────────────────────────────────────
// 5. handleToolCompletion
// Called when a tool finishes. Applies all side effects.
// ─────────────────────────────────────────────────────────────

export async function handleToolCompletion(
  journeyId: string,
  toolKey: string,
  toolOutput: Record<string, unknown>
): Promise<{ success: boolean; next_step_key: string | null; error?: string }> {
  const supabase = await createClient()

  try {
    // Find the active session for this tool
    const { data: sessions } = await supabase
      .from('tool_sessions')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('tool_key', toolKey)
      .eq('is_completed', false)
      .order('last_saved_at', { ascending: false })
      .limit(1)

    const session = sessions && sessions.length > 0 ? sessions[0] : null
    if (!session) {
      return { success: false, next_step_key: null, error: 'No active session found' }
    }

    // Mark session as complete
    await supabase
      .from('tool_sessions')
      .update({
        is_completed: true,
        completion_percentage: 100,
        tool_output: toolOutput,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    // ── Tool-specific side effects ────────────────────────
    await applyToolSideEffects(toolKey, journeyId, toolOutput)

    // ── Notify Hammad's step completion engine ────────────
    const stepKey = session.step_key
    try {
      const engineRes = await NOTIFY_StepCompletion({
        journeyId,
        stepKey,
        completionSource: 'tool',
        metadata: { toolKey, toolOutput }
      })

      return { 
        success: true, 
        next_step_key: engineRes.nextSuggestedStep ?? null 
      }
    } catch (stepErr) {
      console.error('[ToolIntegrationService] Step completion notification failed:', stepErr)
      return { success: true, next_step_key: null }
    }
  } catch (err) {
    console.error('[ToolIntegrationService.handleToolCompletion] Error:', err)
    return { success: false, next_step_key: null, error: 'Tool completion failed' }
  }
}

// ── Tool-specific side effects after completion ───────────────

async function applyToolSideEffects(
  toolKey: string,
  journeyId: string,
  toolOutput: Record<string, unknown>
): Promise<void> {
  switch (toolKey) {
    case 'affidavit_calculator':
      await handleAffidavitCompletion(journeyId, toolOutput)
      break

    case 'form_filler_i130':
      await handleI130Completion(journeyId, toolOutput)
      break

    case 'ds260_prep':
      await handleDS260Completion(journeyId, toolOutput)
      break

    default:
      // No side effects for other tools
      break
  }
}

async function handleAffidavitCompletion(
  journeyId: string,
  toolOutput: Record<string, unknown>
): Promise<void> {
  if (!toolOutput.sponsor_structure) return

  // Store sponsor structure in Hammad's case_data via API (not direct DB write)
  try {
    const baseUrl = getSiteBaseUrl()
    await fetch(`${baseUrl}/api/v1/journeys/${journeyId}/case-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_key: 'sponsor_structure',
        data_value: toolOutput.sponsor_structure,
      }),
    })

    // Also store forms needed list
    if (toolOutput.forms_needed) {
      await fetch(`${baseUrl}/api/v1/journeys/${journeyId}/case-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_key: 'affidavit_forms_needed',
          data_value: toolOutput.forms_needed,
        }),
      })
    }
  } catch (err) {
    console.error('[handleAffidavitCompletion] Failed to update case_data:', err)
  }
}

async function handleI130Completion(
  journeyId: string,
  toolOutput: Record<string, unknown>
): Promise<void> {
  if (!toolOutput.pdf_url && !toolOutput.form_data) return

  // Store generated form output in case_data so it's accessible later
  try {
    const baseUrl = getSiteBaseUrl()
    await fetch(`${baseUrl}/api/v1/journeys/${journeyId}/case-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_key: 'i130_form_output',
        data_value: {
          pdf_url: toolOutput.pdf_url ?? null,
          completed_at: new Date().toISOString(),
        },
      }),
    })
  } catch (err) {
    console.error('[handleI130Completion] Failed to update case_data:', err)
  }
}

async function handleDS260Completion(
  journeyId: string,
  toolOutput: Record<string, unknown>
): Promise<void> {
  if (!toolOutput.answer_key_url) return

  try {
    const baseUrl = getSiteBaseUrl()
    await fetch(`${baseUrl}/api/v1/journeys/${journeyId}/case-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_key: 'ds260_answer_key_url',
        data_value: toolOutput.answer_key_url,
      }),
    })
  } catch (err) {
    console.error('[handleDS260Completion] Failed to update case_data:', err)
  }
}

// ─────────────────────────────────────────────────────────────
// 6. handleToolWebhook
// External tools (e.g. I-130 tool on separate server) POST
// their completion here. We verify the payload and route it.
// ─────────────────────────────────────────────────────────────

export async function handleToolWebhook(
  signature: string | null,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // ── Verify signature ──────────────────────────────────────
  const webhookSecret = process.env.TOOL_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[handleToolWebhook] TOOL_WEBHOOK_SECRET env var not set')
    return { success: false, error: 'Webhook not configured' }
  }

  if (!signature || signature !== webhookSecret) {
    console.warn('[handleToolWebhook] Invalid signature received')
    return { success: false, error: 'Invalid webhook signature' }
  }

  // ── Extract and validate payload ──────────────────────────
  const { journey_id, tool_key, tool_output } = payload

  if (!journey_id || typeof journey_id !== 'string') {
    return { success: false, error: 'Missing journey_id in webhook payload' }
  }
  if (!tool_key || typeof tool_key !== 'string') {
    return { success: false, error: 'Missing tool_key in webhook payload' }
  }
  if (!tool_output || typeof tool_output !== 'object') {
    return { success: false, error: 'Missing tool_output in webhook payload' }
  }

  // ── Route to completion handler ───────────────────────────
  return handleToolCompletion(
    journey_id,
    tool_key,
    tool_output as Record<string, unknown>
  )
}

// ─────────────────────────────────────────────────────────────
// Default export — namespace object
// Usage: import ToolIntegrationService from '@/lib/services/ToolIntegrationService'
//        const config = await ToolIntegrationService.getLaunchConfig(journeyId, 'form_filler_i130')
// ─────────────────────────────────────────────────────────────

const ToolIntegrationService = {
  getLaunchConfig,
  preloadToolData,
  getResumeSession,
  saveToolSession,
  handleToolCompletion,
  handleToolWebhook,
  TOOL_REGISTRY,
}

export default ToolIntegrationService
