/**
 * errorIds.ts
 *
 * Error ID registry for the entire application.
 * Every client-visible error must map to exactly one stable numeric ID.
 *
 * SYSTEM OVERVIEW
 * - Source of truth for IDs: this file (`E.<NAME> = <number>`)
 * - Source of truth for text: `lib/errors/messages.en.ts` (`<number>: "message"`)
 * - Runtime access: `msg(E.SOME_ID, vars?)` from `lib/errors`
 * - Optional support token: `errorCode(E.SOME_ID)` from `lib/errors`
 *
 * CATEGORY MAP (ID RANGES)
 * - 1000-1099: Auth & Account
 * - 1100-1149: Dashboard & Navigation
 * - 1200-1299: Document Vault
 * - 1300-1399: Visa Journey
 * - 1400-1449: Visa Tools
 * - 1450-1499: PDF Tools / Local additions
 * - 1500-1599: File Upload & Processing
 * - 1600-1649: Profile & Settings
 * - 1650-1699: Analytics
 * - 1700-1749: Consultation Booking
 * - 1750-1799: Follow-up & Comms
 * - 1800-1849: Payments
 * - 1900-1949: Admin Tools
 * - 1950-1959: External Integrations (EasyPost)
 * - 1960-1969: Interview/AI validation
 * - 1970-1999: Journeys/Upload/USCIS/PDF helpers
 * - 2000-2049: Contact/Notifications/Email
 * - 2100-2149: Feedback & Misc
 *
 * HOW TO USE:
 *   import { E } from '@/lib/errors/errorIds'
 *   toast.error(msg(E.AUTH_LOGIN_FAILED))
 *
 * AUTHORING RULES
 * 1) Never reuse, renumber, or delete an ID once shipped.
 * 2) Keep symbol names domain-first and intent-specific.
 *    Good: `UPLOAD_INVALID_PDF`
 *    Avoid: `INVALID_FILE`
 * 3) Comments should describe trigger context (where/when it fires), not implementation details.
 * 4) If an error is retired, keep the numeric slot and mark the symbol `@deprecated`.
 * 5) Keep IDs grouped in their numeric range and maintain ascending order within each group.
 *
 * HOW TO ADD A NEW ERROR:
 *   1. Pick the next available ID in the relevant group
 *   2. Add it here with a comment describing when it fires
 *   3. Add the message string in messages.en.ts using the same key name
 *   4. Never reuse or delete an ID — mark retired ones as @deprecated instead
 */

export const E = {

  // ─── AUTH & ACCOUNT (1000–1099) ──────────────────────────────────────────

  /** POST /forgot-password — email send failed (also fires when email doesn't exist in DB, intentionally) */
  AUTH_RESET_EMAIL_FAILED: 1000,

  /** POST /forgot-password — resend link button clicked, second send also failed */
  AUTH_RESET_EMAIL_RESEND_FAILED: 1001,

  /** GET /reset-password — token in URL is missing, expired, or already used */
  AUTH_RESET_LINK_INVALID: 1002,

  /** POST /login — generic credential or server failure */
  AUTH_LOGIN_FAILED: 1003,

  /** POST /login — server returned 5xx, not a credential issue */
  AUTH_LOGIN_SERVER_ERROR: 1004,

  /** OAuth callback — Google sign-in flow failed or was rejected */
  AUTH_GOOGLE_SIGNIN_FAILED: 1005,

  /** OAuth callback on /signup — Google sign-up flow failed or user closed popup */
  AUTH_GOOGLE_SIGNUP_FAILED: 1006,

  /** POST /auth/mfa — 6-digit code submitted but enable call failed */
  AUTH_MFA_ENABLE_FAILED: 1007,

  /** POST /auth/mfa — verification step after enable failed (code may be expired) */
  AUTH_MFA_VERIFY_FAILED: 1008,

  /** DELETE /auth/mfa — disable call failed */
  AUTH_MFA_DISABLE_FAILED: 1009,

  /** DELETE /auth/mfa — server couldn't find which MFA factor to remove */
  AUTH_MFA_FACTOR_NOT_FOUND: 1010,

  /** POST /auth/mfa (admin or login step) — code rejected or expired */
  AUTH_MFA_CODE_INVALID: 1011,

  /** PATCH account settings — password update API call failed */
  AUTH_PASSWORD_UPDATE_FAILED: 1012,

  /** PATCH account settings — generic catch-all during password update (no specific reason) */
  AUTH_PASSWORD_UPDATE_GENERIC: 1013,

  /** Profile edit form — email field failed format validation */
  AUTH_EMAIL_FORMAT_INVALID: 1014,

  /** POST /signup — password failed strength check */
  AUTH_PASSWORD_TOO_WEAK: 1015,

  /** POST /admin-login — credentials don't match any admin account */
  AUTH_ADMIN_LOGIN_FAILED: 1016,
  
  /** Generic unexpected error shown to users when a catch-all occurs */
  AUTH_UNEXPECTED_ERROR: 1017,

  /** POST /auth/mfa — user already has a verified MFA factor enrolled */
  AUTH_MFA_ALREADY_ENROLLED: 1027,

  /** POST /auth/reset-password — missing required fields (token,email,password) */
  AUTH_RESET_FIELDS_REQUIRED: 1028,

  /** POST /auth/reset-password — invalid or expired reset link */
  AUTH_RESET_INVALID_LINK: 1029,

  /** POST /auth/reset-password — failed to update password */
  AUTH_RESET_UPDATE_FAILED: 1030,

  /** POST /auth/signup — missing required signup fields */
  AUTH_SIGNUP_FIELDS_REQUIRED: 1031,

  /** POST /auth/signup — disposable email not allowed */
  AUTH_SIGNUP_DISPOSABLE_EMAIL: 1032,

  /** POST /auth/signup — failed to create account */
  AUTH_SIGNUP_CREATE_FAILED: 1033,

  /** Client-side: passwords entered by the user do not match */
  AUTH_CLIENT_PASSWORD_MISMATCH: 1018,

  /** Client-side: password does not meet minimum length requirement */
  AUTH_CLIENT_PASSWORD_TOO_SHORT: 1019,

  /** Client-side: user must enter a verification/authentication code */
  AUTH_CLIENT_ENTER_VERIFICATION_CODE: 1020,

  /** Server-side: request made without a valid authenticated user */
  AUTH_UNAUTHORIZED: 1021,
  /** POST /signup — user tried to sign up with an email that's already registered (prevents enumeration) */
  AUTH_SIGNUP_EMAIL_EXISTS: 1022,
  /** Generic sign-in/signup helper — account not found for the provided email */
  AUTH_ACCOUNT_NOT_FOUND: 1023,
  /** POST /login or signup — user attempted to sign in but their email address is not yet confirmed */
  AUTH_EMAIL_NOT_CONFIRMED: 1024,
  /** Unauthorised - access to admin route */
  AUTH_UNAUTHORIZED_ADMIN: 1025,

  /** POST /forgot-password — client omitted the email field */
  AUTH_RESET_EMAIL_REQUIRED: 1026,


  // ─── DASHBOARD & NAVIGATION (1100–1149) ──────────────────────────────────

  /** useWizard hook — auto-save to cloud failed during wizard step */
  DASH_CLOUD_SYNC_FAILED: 1100,

  /** useWizard hook — vault write failed during wizard step */
  DASH_VAULT_SAVE_FAILED: 1101,

  /** Wizard — tried to navigate to a step that is still locked */
  DASH_JOURNEY_STEP_LOCKED: 1102,

  /** Pricing page — checkout session URL was not returned by server */
  DASH_CHECKOUT_NO_URL: 1103,


  // ─── DOCUMENT VAULT (1200–1299) ───────────────────────────────────────────

  /** Background sync — cloud sync operation failed, data safe locally */
  VAULT_SYNC_FAILED: 1200,

  /** Export button — single or batch export API call failed */
  VAULT_EXPORT_FAILED: 1201,

  /** Export all — bulk export failed (none exported) */
  VAULT_EXPORT_ALL_FAILED: 1202,

  /** Download button — document download URL or fetch failed */
  VAULT_DOWNLOAD_FAILED: 1203,

  /** Delete button — server-side delete API failed, document still present */
  VAULT_DELETE_FAILED: 1204,

  /** Delete all — bulk delete failed, no documents were removed */
  VAULT_DELETE_ALL_FAILED: 1205,

  /** Step-view delete — delete failed from within a visa journey step */
  VAULT_DELETE_STEP_FAILED: 1206,

  /** Server-side delete throw — document may still appear in vault */
  VAULT_DELETE_SERVER_FAILED: 1207,

  /** Upload modal — vault storage config is missing or failed to initialise */
  VAULT_NOT_CONFIGURED: 1208,

  /** Portal Wallet — credential save API failed */
  VAULT_CREDENTIAL_SAVE_FAILED: 1209,

  /** Portal Wallet — credential delete API failed, item still in wallet */
  VAULT_CREDENTIAL_DELETE_FAILED: 1210,

  /** Document Vault — decryption failed when serving a file to the user */
  VAULT_DECRYPT_FAILED: 1211,

  /** Document Vault — no documents available to export */
  VAULT_NO_DOCUMENTS_TO_EXPORT: 1212,


  // ─── VISA JOURNEY (1300–1399) ─────────────────────────────────────────────

  /** Register receipt step — save API failed after upload */
  JOURNEY_RECEIPT_SAVE_FAILED: 1300,

  /** Register receipt step — fetch failed on load, data not deleted */
  JOURNEY_RECEIPT_FETCH_FAILED: 1301,

  /** Police clearance step — vault service unreachable, direct upload available */
  JOURNEY_VAULT_UNAVAILABLE: 1302,

  /** Portal wallet on journey — credential save failed */
  JOURNEY_CREDENTIAL_SAVE_FAILED: 1303,

  /** Portal wallet on journey — credential delete failed, not removed */
  JOURNEY_CREDENTIAL_DELETE_FAILED: 1304,

  /** Action step — mailing details save failed */
  JOURNEY_MAILING_SAVE_FAILED: 1305,

  /** Notifications panel — fetch failed, no notifications lost */
  JOURNEY_NOTIFICATIONS_FAILED: 1306,

  /** Document check — required document not yet in vault */
  JOURNEY_DOCUMENT_MISSING: 1307,

  /** NVC fields — case number format validation failed */
  JOURNEY_NVC_CASE_FORMAT: 1308,

  /** NVC fields — invoice ID format validation failed */
  JOURNEY_NVC_INVOICE_FORMAT: 1309,

  /** Journey — referenced journey not found */
  JOURNEY_NOT_FOUND: 1310,

  /** Chapters — validation failed when creating or querying chapters */
  CHAPTER_VALIDATION_FAILED: 1311,

  /** Case data — requested case data not found */
  CASE_DATA_NOT_FOUND: 1312,

  /** Case data — failed to save or update case data */
  CASE_DATA_SAVE_FAILED: 1313,

  /** Chapters — requested chapter not found */
  CHAPTER_NOT_FOUND: 1314,

  /** CEAC — invalid input or transition */
  CEAC_INVALID_INPUT: 1315,

  /** CEAC — server-side processing failed */
  CEAC_SERVER_ERROR: 1316,

  /** Portal wallet — failed to fetch portal credentials */
  PORTAL_WALLET_FETCH_FAILED: 1317,

  /** Chapters — server-side error when handling chapter requests */
  CHAPTER_SERVER_ERROR: 1318,

  /** Case data — validation failed for provided inputs */
  CASE_DATA_VALIDATION_FAILED: 1319,

  /** Validation — request body missing or not a JSON object */
  VALIDATION_BAD_REQUEST_BODY: 1320,

  /** /api/case_data — missing journey_id or other required fields */
  CASE_DATA_JOURNEY_ID_REQUIRED: 1321,

  /** /api/case_data — operations payload invalid or empty */
  CASE_DATA_OPERATIONS_INVALID: 1322,

  /** /api/case_data — data_key or data_value missing */
  CASE_DATA_DATAKEY_REQUIRED: 1323,

  /** /api/ceac/status — missing required fields (e.g., journeyId, newStatus) */
  CEAC_STATUS_FIELDS_REQUIRED: 1324,

  /** /api/ceac/status — invalid transition between statuses */
  CEAC_INVALID_TRANSITION: 1325,

  /** Chapters API — journey_id missing for chapters endpoints */
  CHAPTERS_JOURNEY_ID_REQUIRED: 1330,

  /** Chapters API — required chapter fields missing */
  CHAPTERS_REQUIRED_FIELDS: 1331,

  /** Chapters API — chapter_number invalid */
  CHAPTERS_NUMBER_INVALID: 1332,

  /** Chapters API — failed to fetch or create chapters */
  CHAPTERS_SERVER_ERROR: 1333,


  // ─── TOOLS – VISA (1400–1449) ────────────────────────────────────────────

  /** Interview Prep — visa category list failed to load */
  TOOL_INTERVIEW_CATEGORIES_FAILED: 1400,

  /** Interview Prep — session creation API failed */
  TOOL_INTERVIEW_SESSION_FAILED: 1401,

  /** Interview Prep — questionnaire failed to load for selected category */
  TOOL_INTERVIEW_QUESTIONS_FAILED: 1402,

  /** Interview Prep — AI/server call to generate materials failed */
  TOOL_INTERVIEW_GENERATE_FAILED: 1403,

  /** Case Strength Checker — results save API failed after analysis */
  TOOL_CASE_SAVE_FAILED: 1404,

  /** Case Strength Checker — analysis API call failed */
  TOOL_CASE_ANALYZE_FAILED: 1405,

  /** 221(g) OCR tool — browser canvas API returned null (incompatibility) */
  TOOL_OCR_CANVAS_FAILED: 1406,

  /** 221(g) planner — OCR or doc processing pipeline failed (was leaking ${errorMessage}) */
  TOOL_OCR_PROCESS_FAILED: 1407,

  /** 221(g) planner — document validation failed (was leaking ${error.message}) */
  TOOL_DOC_VALIDATION_FAILED: 1408,

  /** 221(g) planner — file type not supported (was leaking ${file.type}) */
  TOOL_FILE_TYPE_UNSUPPORTED: 1409,

  /** Visa checker — auth session creation failed (was leaking ${error.message}) */
  TOOL_SESSION_CREATE_FAILED: 1410,

  /** 221(g) action planner — checklist download/export failed */
  TOOL_CHECKLIST_DOWNLOAD_FAILED: 1411,

  /** Interview Prep — save answer failed */
  TOOL_INTERVIEW_SAVE_FAILED: 1412,

  /** Visa tools — submit session for scoring failed */
  TOOL_VISA_SUBMIT_FAILED: 1413,

  /** Interview Prep — user did not select a category before proceeding */
  TOOL_INTERVIEW_SELECT_CATEGORY: 1414,

  /** Interview Prep — no session found when expected (client) */
  TOOL_INTERVIEW_NO_SESSION: 1415,

  /** Visa Case Strength Checker — missing answer validation (placeholder) */
  TOOL_CASE_MISSING_ANSWER: 1416,

  /** Visa Case Strength Checker — failed to create session */
  TOOL_VISA_SESSION_CREATE_FAILED: 1417,

  /** Approval notice tool — required fields were missing */
  TOOL_APPROVAL_FIELDS_REQUIRED: 1418,

  /** Case status — receipt length invalid */
  TOOL_CASE_RECEIPT_LENGTH: 1419,

  /** Geolocation not supported by browser */
  TOOL_GEO_NOT_SUPPORTED: 1420,

  /** Action step — carrier name missing */
  JOURNEY_MAILING_CARRIER_REQUIRED: 1421,

  /** Case status — fetch failed */
  TOOL_CASE_FETCH_FAILED: 1422,

  /** Action step — carrier name too short */
  JOURNEY_MAILING_CARRIER_TOO_SHORT: 1423,

  /** Action step — tracking number missing */
  JOURNEY_MAILING_TRACKING_REQUIRED: 1424,

  /** Action step — tracking number too short */
  JOURNEY_MAILING_TRACKING_TOO_SHORT: 1425,

  /** Action step — tracking number contains invalid characters */
  JOURNEY_MAILING_TRACKING_INVALID: 1426,

  /** Dashboard — NVC/portal details were missing in the response */
  DASH_NVC_DETAILS_MISSING: 1427,

  /** Quest renderer — result logic evaluation failed */
  TOOL_LOGIC_EVALUATION_FAILED: 1428,

  /** Chat API — user submitted an empty message */
  TOOL_CHAT_EMPTY_QUERY: 1430,

  /** Chat API — server error when contacting AI assistant */
  TOOL_CHAT_SERVER_ERROR: 1431,

  /** 221(g) planner — OCR extracted too little text to validate (blank/poor scan) */
  TOOL_DOC_INSUFFICIENT_TEXT: 1432,
  /** Medical exam — appointment date missing */
  JOURNEY_MEDICAL_DATE_REQUIRED: 1433,

  /** Medical exam — appointment date is in the past */
  JOURNEY_MEDICAL_DATE_PAST: 1434,

  /** Medical exam — appointment time format is invalid */
  JOURNEY_MEDICAL_TIME_INVALID: 1435,

  /** Medical exam — clinic name missing */
  JOURNEY_MEDICAL_CLINIC_REQUIRED: 1436,

  /** Medical exam — clinic name too short */
  JOURNEY_MEDICAL_CLINIC_TOO_SHORT: 1437,

  /** Medical exam — clinic name contains invalid characters */
  JOURNEY_MEDICAL_CLINIC_INVALID: 1438,

  /** Medical exam — validation errors must be fixed before saving */
  JOURNEY_MEDICAL_FIX_ERRORS: 1439,

  /** IV scheduling tool — embassy/post missing */
  TOOL_IV_POST_REQUIRED: 1440,

  /** IV scheduling tool — no scheduling data matched the selected post */
  TOOL_IV_NO_MATCH: 1441,

  /** IV scheduling tool — date parsing failed */
  TOOL_IV_DATE_PARSE_FAILED: 1442,

  /** IV scheduling tool — fetch failed */
  TOOL_IV_FETCH_FAILED: 1443,

  /** Approval notice tool — receipt number format failed */
  TOOL_APPROVAL_RECEIPT_FORMAT_FAILED: 1444,

  /** 221(g) planner — specific required identifier missing (e.g. passport number) */
  TOOL_DOC_MISSING_IDENTIFIER: 1445,

  /** Interview Prep — AI suggestion/improvement request failed (separate from generation) */
  TOOL_INTERVIEW_IMPROVE_FAILED: 1446,


  // ─── TOOLS – PDF (1450–1499) ─────────────────────────────────────────────

  /** PDF merge — user selected a non-PDF file */
  PDF_WRONG_FILE_TYPE: 1450,

  /** PDF merge — uploaded file exceeds 100 MB limit */
  PDF_FILE_TOO_LARGE: 1451,

  /** Appointment tool — interview date required */
  APPOINTMENT_INTERVIEW_DATE_REQUIRED: 1460,

  /** Appointment tool — interview date cannot be in the past */
  APPOINTMENT_INTERVIEW_DATE_PAST: 1461,

  /** Appointment tool — consulate location required */
  APPOINTMENT_LOCATION_REQUIRED: 1462,

  /** Appointment tool — consulate location too short */
  APPOINTMENT_LOCATION_TOO_SHORT: 1463,

  /** Appointment tool — consulate location contains invalid characters */
  APPOINTMENT_LOCATION_INVALID: 1464,

  /** Appointment tool — validation errors must be fixed before saving */
  APPOINTMENT_FIX_ERRORS: 1465,

  /** Appointment tool — saved successfully */
  APPOINTMENT_SAVED_SUCCESS: 1466,

  /** Police clearance — PCC receipt/track format invalid */
  PCC_FIELD_FORMAT_INVALID: 1467,

  /** Police clearance — tracking saved successfully */
  PCC_TRACKING_SAVED: 1468,

  /** Police clearance — marked as received successfully */
  PCC_MARKED_RECEIVED: 1469,

  /** Portal wallet — credential save success (client-facing) */
  CREDENTIAL_SAVE_SUCCESS: 1470,

  /** Portal wallet — credential delete success (client-facing) */
  CREDENTIAL_DELETE_SUCCESS: 1471,

  /** Police apply — invalid photo/passport file format (JPG/PNG required) */
  POLICE_FILE_PHOTO_INVALID_FORMAT: 1472,

  /** Police apply — invalid utility/police letter file format (PDF required) */
  POLICE_FILE_PDF_INVALID: 1473,

  /** Police apply — file exceeds allowed size */
  POLICE_FILE_TOO_LARGE: 1474,

  /** Police apply — step 1 missing required fields */
  POLICE_STEP1_INCOMPLETE: 1475,

  /** Police apply — witnesses details incomplete */
  POLICE_WITNESSES_INCOMPLETE: 1476,

  /** Police apply — required uploads missing */
  POLICE_UPLOADS_MISSING: 1477,

  /** Police apply — submission successful */
  POLICE_SUBMIT_SUCCESS: 1478,

  /** Police apply — submission failed (client-facing) */
  POLICE_SUBMIT_FAILED: 1479,

  /** Generic — file upload failed on client during police apply */
  POLICE_UPLOAD_FAILED: 1480,

  /** PCC field value too short (min 3) */
  PCC_FIELD_TOO_SHORT: 1481,

  /** Police apply — application date is in the future */
  POLICE_APPLICATION_DATE_FUTURE: 1482,

  // ─── FILE UPLOAD & PROCESSING (1500–1599) ────────────────────────────────

  /** Generic upload — server rejected the upload */
  UPLOAD_FAILED: 1500,

  /** Generic upload — network dropped mid-upload */
  UPLOAD_NETWORK_ERROR: 1501,

  /** Generic processing — server-side processing pipeline failed */
  UPLOAD_PROCESSING_FAILED: 1502,

  /** OCR — receipt image couldn't be read automatically */
  UPLOAD_OCR_FAILED: 1503,

  /** Document translation / passport photo — uploaded file is not a valid PDF */
  UPLOAD_INVALID_PDF: 1504,

  /** Drop zone — upload triggered with no file selected */
  UPLOAD_NO_FILE: 1505,

  /** Upload — selected file is empty (client-side check) */
  UPLOAD_FILE_EMPTY: 1511,

  /** Passport photo — photo failed format validation */
  UPLOAD_PHOTO_INVALID: 1506,

  /** Document translation — file exceeds size limit (use msg() to inject {maxSize}) */
  UPLOAD_FILE_TOO_LARGE: 1507,

  /** Passport photo — photo file exceeds size limit (use msg() to inject {maxSize}) */
  UPLOAD_PHOTO_TOO_LARGE: 1508,

  /** Document translation — translated document uploaded successfully (client-facing message) */
  UPLOAD_TRANSLATION_SUCCESS: 1509,

  /** Document translation — user confirmed translated document (client-facing message) */
  UPLOAD_TRANSLATION_CONFIRMED: 1510,

  /** Document translation — user attempted to confirm but translation isn't ready */
  UPLOAD_TRANSLATION_NOT_READY: 1512,

  /** Document translation — translated file is missing when user tries to confirm */
  UPLOAD_TRANSLATION_FILE_MISSING: 1513,

  /** Document translation/upload — invalid document type provided by user */
  UPLOAD_INVALID_DOCUMENT_TYPE: 1514,


  // ─── PROFILE & SETTINGS (1600–1649) ──────────────────────────────────────

  /** Profile page load — profile API request failed */
  PROFILE_FETCH_FAILED: 1600,

  /** Profile completion form — save API failed */
  PROFILE_SAVE_FAILED: 1601,


  // ─── ANALYTICS & REPORTING (1650–1699) ───────────────────────────────────

  /** Dashboard — analytics API request failed on load */
  ANALYTICS_FETCH_FAILED: 1650,


  // ─── CONSULTATION BOOKING (1700–1749) ────────────────────────────────────

  /** /book-consultation — form submission API failed, booking not confirmed */
  BOOKING_SUBMIT_FAILED: 1700,
  /** Consultation service — supabase client not initialized */
  CONSULTATION_SUPABASE_NOT_INITIALIZED: 1701,
  /** Consultation service — create booking failed */
  CONSULTATION_CREATE_FAILED: 1702,
  /** Consultation service — update booking failed */
  CONSULTATION_UPDATE_FAILED: 1703,
  /** Consultation service — fetch failed */
  CONSULTATION_FETCH_FAILED: 1704,
  /** Consultation time slot create failed */
  CONSULTATION_TIMESLOT_CREATE_FAILED: 1705,
  /** Consultation time slot update failed */
  CONSULTATION_TIMESLOT_UPDATE_FAILED: 1706,


  // ─── FOLLOW-UP & COMMS (1750–1799) ───────────────────────────────────────

  /** FollowUpManager — DB status update failed (was leaking raw DB error text) */
  FOLLOWUP_STATUS_UPDATE_FAILED: 1750,


  // ─── PAYMENTS (1800–1849) ─────────────────────────────────────────────────

  /** /pricing — checkout session creation failed, no charge taken */
  PAYMENT_CHECKOUT_FAILED: 1800,
  /** Payment service — create payment failed */
  PAYMENT_CREATE_FAILED: 1801,
  /** Payment service — fetch failed */
  PAYMENT_FETCH_FAILED: 1802,
  /** Payment service — update failed */
  PAYMENT_UPDATE_FAILED: 1803,
  /** Payment service — user payments fetch failed */
  PAYMENT_USER_FETCH_FAILED: 1804,
  /** Payment service — subscription update failed */
  PAYMENT_SUBSCRIPTION_UPDATE_FAILED: 1805,


  // ─── ADMIN TOOLS (1900–1949) ──────────────────────────────────────────────

  /** Admin visa cases — tracking clear API call failed */
  ADMIN_TRACKING_CLEAR_FAILED: 1900,

  /** Admin translation queue — document download failed */
  ADMIN_DOCUMENT_DOWNLOAD_FAILED: 1901,
  /** Admin pages — generic data fetch failed */
  ADMIN_FETCH_FAILED: 1902,

  /** Admin — invalid input or validation failed when creating announcements */
  ADMIN_INVALID_INPUT: 1903,


  // ─── EXTERNAL INTEGRATIONS (1950–1959) ──────────────────────────────────

  /** EasyPost webhook — processing failed */
  EASPOST_WEBHOOK_PROCESS_FAILED: 1950,

  /** EasyPost webhook — tracker has no associated case (informational) */
  EASPOST_WEBHOOK_NO_CASE: 1951,

  /** EasyPost webhook — processed successfully (informational) */
  EASPOST_WEBHOOK_PROCESSED: 1952,

  /** EasyPost API — missing caseId parameter */
  EASPOST_MISSING_CASE_ID: 1953,

  /** EasyPost API — no tracker found for the given case */
  EASPOST_NO_TRACKER: 1954,

  /** EasyPost tracker — missing required fields (caseId, carrier, trackingCode) */
  EASPOST_TRACKER_MISSING_FIELDS: 1955,

  /** EasyPost tracker — failed to create tracker */
  EASPOST_TRACKER_CREATE_FAILED: 1956,


  // ─── INTERVIEW / AI VALIDATION (1960–1969) ──────────────────────────────

  /** Interview prep — missing required POST fields */
  INTERVIEW_MISSING_FIELDS: 1960,

  /** Interview prep AI — AI service not configured (GEMINI_API_KEY) */
  INTERVIEW_AI_NOT_CONFIGURED: 1961,

  /** Interview prep — answer validation too short */
  INTERVIEW_ANSWER_TOO_SHORT: 1962,


  // ─── JOURNEYS / UPLOAD / USCIS / PDF HELPERS (1970–1999) ────────────────

  // Journeys API
  JOURNEYS_UNAUTHORIZED: 1970,
  JOURNEYS_FETCH_FAILED: 1971,
  JOURNEYS_DELETE_FAILED: 1972,

  // Upload API
  UPLOAD_MISSING_FIELDS: 1973,
  UPLOAD_INVALID_FILE_TYPE: 1974,
  UPLOAD_UPLOAD_FAILED: 1975,
  UPLOAD_UPDATE_FAILED: 1976,

  // USCIS case status
  USCIS_RECEIPT_REQUIRED: 1977,
  USCIS_INVALID_RECEIPT: 1978,
  USCIS_NO_CASE_FOUND: 1979,
  USCIS_AUTH_FAILED: 1980,
  USCIS_SERVICE_ERROR: 1981,
  USCIS_UNEXPECTED_ERROR: 1982,

  // Contact form
  CONTACT_ALL_FIELDS_REQUIRED: 1983,
  CONTACT_SEND_FAILED: 1984,
  CONTACT_UNEXPECTED_ERROR: 1985,

  // Follow up manager
  FOLLOWUP_UPDATE_FAILED: 1986,

  // Geoapify / Country autocomplete
  GEOAPIFY_KEY_MISSING: 1987,
  GEOAPIFY_FALLBACK_USED: 1988,

  // PDF tools
  PDF_PPT_UNSUPPORTED: 1990,
  PDF_SELECT_PDF_ONLY: 1991,
  /** PDF generator — failed to assemble or save PDF packet */
  PDF_GENERATION_FAILED: 1992,
  PDF_MERGE_NO_PAGES: 1993,
  PDF_MERGE_FAILED: 1994,

  // Unsupported image format for PDF embedding
  PDF_UNSUPPORTED_IMAGE_FORMAT: 1995,

  // Page index out of bounds when embedding image
  PDF_PAGE_INDEX_OUT_OF_BOUNDS: 1996,

  // Failed to embed image into PDF
  PDF_EMBED_IMAGE_FAILED: 1997,

  // Cannot delete the last page in organizer
  PDF_CANNOT_DELETE_LAST_PAGE: 1998,

  // PDF converter tool — no text provided
  PDF_CONVERTER_TEXT_REQUIRED: 1999,


  // ─── CONTACT & COMMS (2000–2049) ─────────────────────────────────────────

  /** /contact — form submission API failed (same catch-all was used on 5 pages) */
  CONTACT_SUBMIT_FAILED: 2000,

  /** /contact — server-side email send failed */
  CONTACT_EMAIL_SEND_FAILED: 2001,

  // PDF converter tool — text too long
  PDF_CONVERTER_TOO_LONG: 2002,
  // PDF converter tool — failed to generate PDF
  PDF_CONVERTER_FAILED: 2003,
  // PDF editor — signature crop failed
  PDF_CROP_FAILED: 2004,
  /** Appointment notifications — invalid data */
  APPOINTMENT_NOTIFICATION_INVALID: 2005,
  /** Appointment notifications — email send failed */
  APPOINTMENT_NOTIFICATION_SEND_FAILED: 2006,
  /** Appointment notifications — appointment not found */
  APPOINTMENT_NOT_FOUND: 2007,
  /** Appointment notifications — trigger failed */
  APPOINTMENT_TRIGGER_FAILED: 2008,
  /** Generic email send failure */
  EMAIL_SEND_FAILED: 2010,

  /** Translation notifications — invalid data */
  TRANSLATION_NOTIFICATION_INVALID: 2011,
  /** Translation notifications — email send failed */
  TRANSLATION_NOTIFICATION_SEND_FAILED: 2012,
  /** Translation notifications — translation not found */
  TRANSLATION_NOT_FOUND: 2013,
  /** Translation notifications — trigger failed */
  TRANSLATION_TRIGGER_FAILED: 2014,

  /** Police verification notifications — invalid data */
  POLICE_VERIFICATION_NOTIFICATION_INVALID: 2015,
  /** Police verification notifications — email send failed */
  POLICE_VERIFICATION_NOTIFICATION_SEND_FAILED: 2016,
  /** Police verification notifications — request not found */
  POLICE_VERIFICATION_NOT_FOUND: 2017,
  /** Police verification notifications — trigger failed */
  POLICE_VERIFICATION_TRIGGER_FAILED: 2018,




  // ─── FEEDBACK & MISC (2100–2149) ──────────────────────────────────────────

  /** Guides page — save guide API failed */
  FEEDBACK_GUIDE_SAVE_FAILED: 2100,

  /** Feedback widget — submitted without choosing a feedback type */
  FEEDBACK_TYPE_MISSING: 2101,

  /** Feedback widget — submitted without writing a description */
  FEEDBACK_DESCRIPTION_MISSING: 2102,

  /** Dashboard wizard — required step incomplete before proceeding
   *  Use msg(E.JOURNEY_STEP_INCOMPLETE, { stepName: step.displayName })
   *  Never pass step.name (internal code key) — always use displayName */
  JOURNEY_STEP_INCOMPLETE: 2103,

} as const

/** Type representing any valid error ID */
export type ErrorId = typeof E[keyof typeof E]