/**
 * Links a gated feature to its two related destinations:
 *  • the sales / detail page  (/resources/{slug})  — overview, reviews, "Add to order"
 *  • the real tool route       (the demo)          — where the user actually works
 *
 * Why this file exists: the add-on ids in `pricing.ts` (used by /resources/[slug])
 * are NOT always the same as the add-on ids in `lib/entitlements/config.ts`
 * (e.g. config `pdf-tool-kit` vs sales slug `pdf`, config `snap-sign` vs `snap`).
 * Building the sales link from `entitlement(feature).addon.id` would therefore 404.
 * This map handles the mismatch in one place. Add a new tool → add one line here.
 */

/** Entitlement feature key → sales-page slug (the id used by pricing.ts / /resources/[slug]). */
export const FEATURE_TO_SALES_SLUG: Record<string, string> = {
  action_221g: "221g",
  basic_interview_prep: "interview-prep",
  sponsorship_calc: "sponsor",
  photo_booth: "photo",
  pdf_toolkit: "pdf", // mismatch: config id is "pdf-tool-kit"
  snap_sign: "snap", // mismatch: config id is "snap-sign"
  smart_form_filler: "smart",
  guide_passport: "guide-passport",
  guide_police: "guide-police",
  guide_cnic: "guide-cnic",
  guide_birth_cert: "guide-birth-cert",
  guide_frc: "guide-frc",
  guide_nikah_nama: "guide-nikah-nama",
  expert_consultation: "consultation",
  pcc_filing: "pcc",
  medical_booking: "medical",
  document_translation: "translate",
  // dq_status_check & polio_certificate have no sales page — intentionally omitted.
};

/** Sales-page slug → real tool route (demo). Only items that have a working demo. */
export const SALES_SLUG_TO_TOOL_ROUTE: Record<string, string> = {
  "221g": "/221g-action-planner",
  "interview-prep": "/interview-prep",
  sponsor: "/affidavit-support-calculator",
  photo: "/passport",
  pdf: "/pdf-processing",
  snap: "/signature-image-processing",
  smart: "/visa-forms",
  "guide-passport": "/guides/passport-guide",
  "guide-police": "/guides/police-verification-guide",
  "guide-cnic": "/guides/cnic-guide",
  "guide-birth-cert": "/guides/birth-certificate-guide",
  "guide-frc": "/guides/frc-guide",
  "guide-nikah-nama": "/guides/nikah-nama-guide",
  // services (consultation/pcc/medical/translate) have no demo — skipped.
};

/** Returns the sales/detail page href for a feature, or null if it has none. */
export const getDetailsHref = (feature: string): string | null =>
  FEATURE_TO_SALES_SLUG[feature] ? `/resources/${FEATURE_TO_SALES_SLUG[feature]}` : null;

/** Returns the demo (real tool) route for a sales-page slug, or null if it has none. */
export const getDemoRouteForSlug = (slug: string): string | null =>
  SALES_SLUG_TO_TOOL_ROUTE[slug] ?? null;
