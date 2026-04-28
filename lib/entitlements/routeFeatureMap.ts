/**
 * Central route-to-entitlement map for all protected pages.
 *
 * ToolsGuard (app/layout.tsx) reads this at runtime and applies PageGate
 * automatically — no per-page code needed.
 *
 * Prefix matching applies: '/guides' also covers '/guides/passport-guide', etc.
 * Source of truth: Pricing Matrix - IR-1.csv
 *
 * TO ADD A NEW LOCKED ROUTE: append one entry here. Done.
 */

export interface RouteGate {
  feature: string;
  title: string;
  description?: string;
}

export const ROUTE_FEATURE_MAP: Record<string, RouteGate> = {

  // ── Basic+ (locked for Free only) ─────────────────────────────────────────
  '/iv-tool': {
    feature: 'visa_bulletin_monitor',
    title: 'Visa Bulletin Monitor',
    description: 'Track the monthly visa bulletin and interview scheduling updates. Available on Basic and above.',
  },
  '/portal-wallet': {
    feature: 'portal_wallet',
    title: 'Portal Wallet',
    description: 'Manage your portal credentials securely. Available on Basic and above.',
  },
  '/pdf-processing': {
    feature: 'pdf_toolkit',
    title: 'PDF Toolkit',
    description: 'Edit, merge, compress and convert your PDF files. Available on Basic and above.',
  },
  '/signature-image-processing': {
    feature: 'snap_sign',
    title: 'Snap & Sign Processing',
    description: 'Process and add your signature to documents. Available on Basic and above.',
  },
  '/case-status': {
    feature: 'dq_status_check',
    title: 'DQ Status Check',
    description: 'Check your Documentarily Qualified status. Available on Basic and above.',
  },
  '/interview-prep': {
    feature: 'basic_interview_prep',
    title: 'Interview Preparation',
    description: 'Prepare for your visa interview with guided practice questions. Available on Basic and above.',
  },

  // ── Premium+ ──────────────────────────────────────────────────────────────
  '/visa-case-strength-checker': {
    feature: 'case_strength',
    title: 'Case Strength Analyzer',
    description: 'Evaluate your visa case profile and detect potential red flags. Available on Premium and above.',
  },
  '/visa-forms': {
    feature: 'smart_form_filler',
    title: 'Smart Form Filler',
    description: 'Auto-fill your visa forms using your saved profile data. Available on Premium and above.',
  },
  '/affidavit-support-calculator': {
    feature: 'sponsorship_calc',
    title: 'Sponsorship Calculator',
    description: 'Determine your sponsorship setup based on USCIS income requirements. Available on Premium and above.',
  },
  '/passport': {
    feature: 'photo_booth',
    title: 'Passport Photo Booth',
    description: 'Take compliant US passport and visa photos. Available on Premium and above.',
  },
  '/book-appointment': {
    feature: 'medical_booking',
    title: 'Medical Appointment Booking',
    description: 'Book your medical exam appointment through Rahvana. Available on Premium and above.',
  },
  '/document-vault': {
    feature: 'document_vault',
    title: 'Document Vault',
    description: 'Upload, organize, and securely access your visa documents. Available on Premium and above.',
  },
  '/guides': {
    feature: 'civil_doc_guides',
    title: 'Document Guides',
    description: 'Step-by-step guides for every civil document in your visa application. Available on Premium and above.',
  },

  // ── Executive only ────────────────────────────────────────────────────────
  '/221g-action-planner': {
    feature: 'action_221g',
    title: '221(g) Action Planner',
    description: 'Your personalized response plan after a 221(g) refusal. Exclusive to Executive plan.',
  },
  '/police-verification': {
    feature: 'pcc_filing',
    title: 'Police Character Certificate (PCC)',
    description: 'File your Police Character Certificate application. Exclusive to Executive plan.',
  },
  '/document-translation': {
    feature: 'document_translation',
    title: 'Document Translation',
    description: 'Professional certified translation for your visa documents. Exclusive to Executive plan.',
  },
};
