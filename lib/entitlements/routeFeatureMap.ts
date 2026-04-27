/**
 * Central route-to-entitlement map for all protected tool pages.
 *
 * ToolsGuard (app/(tools)/layout.tsx) reads this at runtime and applies
 * PageGate automatically — no per-page PageGate code needed.
 *
 * Prefix matching: adding '/police-verification' also covers
 * '/police-verification/apply', '/police-verification/result', etc.
 *
 * TO ADD A NEW LOCKED TOOL: append one entry here. Done.
 */

export interface RouteGate {
  feature: string;
  title: string;
  description?: string;
}

export const ROUTE_FEATURE_MAP: Record<string, RouteGate> = {

  // ── Basic+ (free users locked) ─────────────────────────────────────────────
  '/pdf-processing': {
    feature: 'pdf_toolkit',
    title: 'PDF Toolkit',
  },
  '/signature-image-processing': {
    feature: 'snap_sign',
    title: 'Snap & Sign Processing',
  },

  // ── Premium+ ──────────────────────────────────────────────────────────────
  '/affidavit-support-calculator': {
    feature: 'sponsorship_calc',
    title: 'Sponsorship Calculator',
    description: 'Determine your sponsorship setup based on USCIS requirements. Available on Premium and above.',
  },
  '/book-appointment': {
    feature: 'medical_booking',
    title: 'Medical Appointment Booking',
    description: 'Book your medical exam appointment through Rahvana. Available on Premium and above.',
  },
  '/passport': {
    feature: 'photo_booth',
    title: 'Passport Photo Booth',
    description: 'Take compliant US passport photos. Available on Premium and above.',
  },
  '/police-verification': {
    feature: 'pcc_filing',
    title: 'Police Character Certificate (PCC)',
    description: 'File your Police Character Certificate application. Available on Premium and above.',
  },
  '/visa-case-strength-checker': {
    feature: 'case_strength',
    title: 'Case Strength Analyzer',
    description: 'Evaluate your visa case and detect red flags. Available on Premium and above.',
  },
  '/document-vault': {
    feature: 'document_vault',
    title: 'Document Vault',
    description: 'Upload, organize, and access your visa documents securely. Available on Premium and above.',
  },

  // ── Executive only ────────────────────────────────────────────────────────
  '/221g-action-planner': {
    feature: 'action_221g',
    title: '221(g) Action Planner',
    description: 'Your personalized response plan after a 221(g) refusal. Exclusive to Executive plan.',
  },
  '/document-translation': {
    feature: 'document_translation',
    title: 'Document Translation',
    description: 'Professional certified translation for your visa documents. Exclusive to Executive plan.',
  },
};
