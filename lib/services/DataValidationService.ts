// lib/services/DataValidationService.ts
//
// Usage:
//   const errors = DataValidationService.validateDocument(body)
//   if (errors.length > 0) return validationErrorResponse(errors)

import type {
  CreateJourneyDocumentBody,
  UpdateJourneyDocumentBody,
  CreateAppointmentBody,
  UpdateAppointmentBody,
  CreatePortalRecordBody,
  UpdatePortalRecordBody,
  SaveToolSessionBody,
  CompleteToolSessionBody,
  DocumentStatus,
  PortalType,
  AppointmentType,
  AppointmentStatus,
  ToolKey,
  ValidationError,
} from '@/types/journey-support'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const VALID_DOCUMENT_STATUSES: DocumentStatus[] = [
  'not_started', 'requested', 'pending', 'received',
  'uploaded', 'expired', 'rejected',
]

const VALID_PORTAL_TYPES: PortalType[] = [
  'uscis', 'ceac', 'embassy_booking', 'other',
]

const VALID_APPOINTMENT_TYPES: AppointmentType[] = [
  'medical', 'interview', 'police_certificate_followup', 'other',
]

const VALID_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled', 'completed', 'cancelled', 'rescheduled', 'pending_confirmation',
]

const VALID_TOOL_KEYS: ToolKey[] = [
  'form_filler_i130',
  'affidavit_calculator',
  'ds260_prep',
  'interview_prep',
  'case_strength_checker',
]

// Date regex: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Time regex: HH:MM or HH:MM:SS
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/

// UUID regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ─────────────────────────────────────────────────────────────
// Utility validators
// ─────────────────────────────────────────────────────────────

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_REGEX.test(value)
}

function isFutureDate(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr >= today
}

function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_REGEX.test(value)
}

function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return value.startsWith('http://') || value.startsWith('https://')
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

// ─────────────────────────────────────────────────────────────
// Security checker — used by portal record routes
// ─────────────────────────────────────────────────────────────

/**
 * Throws a SecurityError if password-related fields are detected.
 * This is a hard stop — never allow passwords through.
 */
export function validateNoPasswordFields(body: Record<string, unknown>): ValidationError[] {
  const FORBIDDEN_KEYS = [
    'password', 'encrypted_password', 'hashed_password',
    'passwd', 'pass', 'secret', 'credential',
  ]

  const found = FORBIDDEN_KEYS.filter((key) => key in body)
  if (found.length > 0) {
    return [{
      field: found[0],
      issue: 'Password storage is strictly prohibited in portal records. Remove all password fields.',
    }]
  }
  return []
}

// ─────────────────────────────────────────────────────────────
// Journey Document validators
// ─────────────────────────────────────────────────────────────

export function validateCreateDocument(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as CreateJourneyDocumentBody & Record<string, unknown>

  // Required: document_type
  if (!isNonEmptyString(data.document_type)) {
    errors.push({ field: 'document_type', issue: 'document_type is required and must be a non-empty string' })
  } else if (data.document_type.length > 100) {
    errors.push({ field: 'document_type', issue: 'document_type must be 100 characters or less' })
  }

  // Optional: step_key format check
  if (data.step_key !== undefined && data.step_key !== null) {
    if (typeof data.step_key !== 'string' || data.step_key.length > 20) {
      errors.push({ field: 'step_key', issue: 'step_key must be a string up to 20 characters (e.g. "I.2", "II.4")' })
    }
  }

  // Optional: document_label
  if (data.document_label !== undefined && data.document_label !== null) {
    if (typeof data.document_label !== 'string' || data.document_label.length > 200) {
      errors.push({ field: 'document_label', issue: 'document_label must be a string up to 200 characters' })
    }
  }

  // Optional: is_required / is_recommended must be booleans
  if (data.is_required !== undefined && typeof data.is_required !== 'boolean') {
    errors.push({ field: 'is_required', issue: 'is_required must be a boolean' })
  }
  if (data.is_recommended !== undefined && typeof data.is_recommended !== 'boolean') {
    errors.push({ field: 'is_recommended', issue: 'is_recommended must be a boolean' })
  }

  // Optional: expiry_date format
  if (data.expiry_date !== undefined && data.expiry_date !== null) {
    if (!isValidDate(data.expiry_date)) {
      errors.push({ field: 'expiry_date', issue: 'expiry_date must be in YYYY-MM-DD format' })
    }
  }

  // Optional: vault_file_url format
  if (data.vault_file_url !== undefined && data.vault_file_url !== null) {
    if (!isValidUrl(data.vault_file_url)) {
      errors.push({ field: 'vault_file_url', issue: 'vault_file_url must start with http:// or https://' })
    }
  }

  return errors
}

export function validateUpdateDocument(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as UpdateJourneyDocumentBody & Record<string, unknown>

  // Status must be a valid enum value
  if (data.status !== undefined) {
    if (!VALID_DOCUMENT_STATUSES.includes(data.status as DocumentStatus)) {
      errors.push({
        field: 'status',
        issue: `status must be one of: ${VALID_DOCUMENT_STATUSES.join(', ')}`,
      })
    }
  }

  // expiry_date format
  if (data.expiry_date !== undefined && data.expiry_date !== null) {
    if (!isValidDate(data.expiry_date)) {
      errors.push({ field: 'expiry_date', issue: 'expiry_date must be in YYYY-MM-DD format' })
    }
  }

  // vault_file_url format
  if (data.vault_file_url !== undefined && data.vault_file_url !== null) {
    if (!isValidUrl(data.vault_file_url)) {
      errors.push({ field: 'vault_file_url', issue: 'vault_file_url must start with http:// or https://' })
    }
  }

  return errors
}

// ─────────────────────────────────────────────────────────────
// Tool Session validators
// ─────────────────────────────────────────────────────────────

export function validateSaveToolSession(
  body: unknown,
  toolKey: string
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as SaveToolSessionBody & Record<string, unknown>

  // Required: step_key
  if (!isNonEmptyString(data.step_key)) {
    errors.push({ field: 'step_key', issue: 'step_key is required (e.g. "I.4", "II.5")' })
  }

  // Required: session_state must be an object
  if (!data.session_state || typeof data.session_state !== 'object' || Array.isArray(data.session_state)) {
    errors.push({ field: 'session_state', issue: 'session_state is required and must be a JSON object' })
  }

  // Required: completion_percentage in range 0-100
  if (data.completion_percentage === undefined || data.completion_percentage === null) {
    errors.push({ field: 'completion_percentage', issue: 'completion_percentage is required' })
  } else if (
    typeof data.completion_percentage !== 'number' ||
    data.completion_percentage < 0 ||
    data.completion_percentage > 100
  ) {
    errors.push({ field: 'completion_percentage', issue: 'completion_percentage must be a number between 0 and 100' })
  }

  // Warning: is_completed cannot be set via PUT (only via /complete)
  if ((data as Record<string, unknown>).is_completed === true) {
    errors.push({
      field: 'is_completed',
      issue: 'Cannot mark tool as completed via PUT. Use POST /complete endpoint instead.',
    })
  }

  // Warn on unknown tool_key (not a hard error — allows future tools)
  if (!VALID_TOOL_KEYS.includes(toolKey as ToolKey)) {
    // Not an error, just a warning — log it but allow through
    console.warn(`[DataValidationService] Unknown tool_key: "${toolKey}". Expected: ${VALID_TOOL_KEYS.join(', ')}`)
  }

  return errors
}

export function validateCompleteToolSession(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as CompleteToolSessionBody & Record<string, unknown>

  // Required: tool_output must be an object
  if (!data.tool_output || typeof data.tool_output !== 'object' || Array.isArray(data.tool_output)) {
    errors.push({
      field: 'tool_output',
      issue: 'tool_output is required and must be a JSON object containing the tool results',
    })
  }

  return errors
}

// ─────────────────────────────────────────────────────────────
// Portal Record validators
// ─────────────────────────────────────────────────────────────

export function validateCreatePortalRecord(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as CreatePortalRecordBody & Record<string, unknown>

  // SECURITY: check no passwords first
  const securityErrors = validateNoPasswordFields(data as Record<string, unknown>)
  if (securityErrors.length > 0) return securityErrors

  // Required: portal_type
  if (!data.portal_type || !VALID_PORTAL_TYPES.includes(data.portal_type as PortalType)) {
    errors.push({
      field: 'portal_type',
      issue: `portal_type is required and must be one of: ${VALID_PORTAL_TYPES.join(', ')}`,
    })
  }

  // URL format validation
  if (data.portal_url !== undefined && data.portal_url !== null) {
    if (!isValidUrl(data.portal_url)) {
      errors.push({ field: 'portal_url', issue: 'portal_url must start with http:// or https://' })
    }
  }

  // Email basic format
  if (data.account_email !== undefined && data.account_email !== null) {
    if (typeof data.account_email !== 'string' || !data.account_email.includes('@')) {
      errors.push({ field: 'account_email', issue: 'account_email must be a valid email address' })
    }
  }

  // NVC fields only for CEAC
  if (data.portal_type !== 'ceac' && (data.nvc_case_number || data.nvc_invoice_id)) {
    errors.push({
      field: 'nvc_case_number',
      issue: 'nvc_case_number and nvc_invoice_id are only valid when portal_type is "ceac"',
    })
  }

  return errors
}

export function validateUpdatePortalRecord(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as UpdatePortalRecordBody & Record<string, unknown>

  // SECURITY: always run password check on updates too
  const securityErrors = validateNoPasswordFields(data as Record<string, unknown>)
  if (securityErrors.length > 0) return securityErrors

  // URL format
  if (data.portal_url !== undefined && data.portal_url !== null) {
    if (!isValidUrl(data.portal_url)) {
      errors.push({ field: 'portal_url', issue: 'portal_url must start with http:// or https://' })
    }
  }

  // Email format
  if (data.account_email !== undefined && data.account_email !== null) {
    if (typeof data.account_email !== 'string' || !data.account_email.includes('@')) {
      errors.push({ field: 'account_email', issue: 'account_email must be a valid email address' })
    }
  }

  return errors
}

// ─────────────────────────────────────────────────────────────
// Appointment validators
// ─────────────────────────────────────────────────────────────

export function validateCreateAppointment(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as CreateAppointmentBody & Record<string, unknown>

  // Required: appointment_type
  if (!data.appointment_type || !VALID_APPOINTMENT_TYPES.includes(data.appointment_type as AppointmentType)) {
    errors.push({
      field: 'appointment_type',
      issue: `appointment_type is required. Must be one of: ${VALID_APPOINTMENT_TYPES.join(', ')}`,
    })
  }

  // Required: appointment_date
  if (!isValidDate(data.appointment_date)) {
    errors.push({ field: 'appointment_date', issue: 'appointment_date is required in YYYY-MM-DD format' })
  } else if (!isFutureDate(data.appointment_date)) {
    errors.push({ field: 'appointment_date', issue: 'appointment_date must be today or in the future' })
  }

  // Optional: appointment_time format
  if (data.appointment_time !== undefined && data.appointment_time !== null) {
    if (!isValidTime(data.appointment_time)) {
      errors.push({ field: 'appointment_time', issue: 'appointment_time must be in HH:MM or HH:MM:SS format' })
    }
  }

  // Optional: step_key length
  if (data.step_key !== undefined && data.step_key !== null) {
    if (typeof data.step_key !== 'string' || data.step_key.length > 20) {
      errors.push({ field: 'step_key', issue: 'step_key must be up to 20 characters' })
    }
  }

  return errors
}

export function validateUpdateAppointment(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', issue: 'Request body must be a JSON object' }]
  }

  const data = body as UpdateAppointmentBody & Record<string, unknown>

  // Optional date validation
  if (data.appointment_date !== undefined) {
    if (!isValidDate(data.appointment_date)) {
      errors.push({ field: 'appointment_date', issue: 'appointment_date must be in YYYY-MM-DD format' })
    }
    // Note: allow past dates on update (user might be recording historical data or cancelling)
  }

  // Optional time validation
  if (data.appointment_time !== undefined && data.appointment_time !== null) {
    if (!isValidTime(data.appointment_time)) {
      errors.push({ field: 'appointment_time', issue: 'appointment_time must be in HH:MM or HH:MM:SS format' })
    }
  }

  // Status validation
  if (data.status !== undefined) {
    if (!VALID_APPOINTMENT_STATUSES.includes(data.status as AppointmentStatus)) {
      errors.push({
        field: 'status',
        issue: `status must be one of: ${VALID_APPOINTMENT_STATUSES.join(', ')}`,
      })
    }
  }

  return errors
}

// ─────────────────────────────────────────────────────────────
// Journey ID / UUID validator
// ─────────────────────────────────────────────────────────────

export function validateUUID(value: string, fieldName = 'id'): ValidationError[] {
  if (!isValidUUID(value)) {
    return [{ field: fieldName, issue: `${fieldName} must be a valid UUID` }]
  }
  return []
}

// ─────────────────────────────────────────────────────────────
// Convenience: build NextResponse error from ValidationError[]
// Import and use this in API routes
// ─────────────────────────────────────────────────────────────

export function hasErrors(errors: ValidationError[]): boolean {
  return errors.length > 0
}

// ─────────────────────────────────────────────────────────────
// Default export — namespace object for clean imports
// Usage: import Validator from '@/lib/services/DataValidationService'
//        const errors = Validator.createDocument(body)
// ─────────────────────────────────────────────────────────────

const DataValidationService = {
  // Documents
  createDocument: validateCreateDocument,
  updateDocument: validateUpdateDocument,
  // Tool sessions
  saveToolSession: validateSaveToolSession,
  completeToolSession: validateCompleteToolSession,
  // Portal records
  createPortalRecord: validateCreatePortalRecord,
  updatePortalRecord: validateUpdatePortalRecord,
  // Appointments
  createAppointment: validateCreateAppointment,
  updateAppointment: validateUpdateAppointment,
  // Shared
  noPasswordFields: validateNoPasswordFields,
  uuid: validateUUID,
  hasErrors,
}

export default DataValidationService
