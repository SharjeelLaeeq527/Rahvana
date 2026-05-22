import type { ErrorId } from './errorIds'


/**
 * messages.en.ts
 *
 * Human-readable message catalog keyed by numeric ErrorId.
 * This file defines what end users see when `msg(E.SOME_ID)` is called.
 *
 * HOW THIS SYSTEM WORKS
 * 1) Error ID is defined in `lib/errors/errorIds.ts`.
 * 2) Matching message is defined here using the same numeric ID.
 * 3) UI/API code must use `msg(E.SOME_ID, vars?)` for client-visible text.
 * 4) Internal logs may keep raw technical details, but user messages must stay safe and plain.
 *
 * MESSAGE WRITING STANDARD
 * - Write for non-technical users: short, clear, action-oriented.
 * - When format is required, include the exact format and one example.
 *   Example: "3 letters followed by 10 digits (e.g., MSC2590123456)"
 * - Do not expose raw exceptions, stack traces, provider messages, IDs, or secrets.
 * - Do not include developer-only instructions like "check console".
 * - Prefer consistent tone: what happened + what the user should do next.
 *
 * PLACEHOLDER RULES
 * - Use `{placeholder}` syntax only when runtime interpolation is needed.
 * - Keep placeholders human-readable (`{maxSize}`, `{postName}`, `{questionLabel}`).
 * - Message should remain understandable even before interpolation.
 *
 * CATEGORIZATION PRACTICE
 * - Keep message IDs in the same numeric ranges as `errorIds.ts`.
 * - Keep IDs in ascending order inside each section.
 * - Keep section headers aligned with domain boundaries.
 */


export const en: Record<ErrorId, string> = {

  // ─── AUTH & ACCOUNT ───────────────────────────────────────────────────────

  // 1000 — /forgot-password, email send failed
  // Note: also fires when the email doesn't exist in DB — intentional, prevents user enumeration
  1000: "We couldn't send a reset email to that address. Make sure the email is correct and try again. Check your spam folder — if it doesn't arrive within a minute, try once more or contact support.",

  // 1001 — /forgot-password, resend link button clicked and also failed
  1001: "We couldn't resend the email. Your link may have already been sent — check your spam folder. If nothing arrived after a minute, try again.",

  // 1002 — /reset-password, token missing / expired / already used
  1002: "This password reset link is no longer valid — it may have expired or already been used. Go back to Forgot Password and request a new link.",

  // 1003 — /login, generic auth failure (wrong password, locked account, etc.)
  1003: "Your email or password is incorrect. Double-check your credentials and try again. If you continue to have trouble, use Forgot Password or contact support",

  // 1004 — /login, server returned 5xx (not a credential issue)
  1004: "Our servers are having trouble right now. Please wait a minute and try signing in again. If the problem continues, check our status page or contact support.",

  // 1005 — Google OAuth, sign-in flow failed
  1005: "Google sign-in failed. Make sure you're logged into your Google account in the browser, then try again. Alternatively, sign in with your email and password.",

  // 1006 — Google OAuth on /signup, flow failed or user closed popup
  1006: "Google sign-up didn't complete. This can happen if you closed the Google window too quickly. Try again, or sign up with your email and password instead.",

  // 1007 — /auth/mfa, enable call failed (wrong 6-digit code or server error)
  1007: "We couldn't turn on two-factor authentication. Make sure you entered the 6-digit authentication code correctly, then try again.",

  // 1008 — /auth/mfa, verification step after enable failed (code likely expired)
  1008: "We couldn't verify your two-factor setup. The code may have expired (they refresh every 30 seconds). Check your email for a fresh code and try again.",

  // 1009 — /auth/mfa, disable call failed
  1009: "We couldn't turn off two-factor authentication right now. Please try again.",
  // 1010 — /auth/mfa, server couldn't identify which factor to remove
  1010: "We couldn't identify your two-factor authentication setup. Please sign out and back in, then try disabling two-factor authentication again.",

  // 1011 — MFA login step or admin login, code rejected or expired
  1011: "We couldn't verify that code. Authentication codes expire every 30 seconds — check your email for a fresh one and try again.",

  // 1012 — Account settings, password update API failed
  1012: "Password update failed. Ensure your new password meets requirements (8+ chars, uppercase, lowercase, numbers, symbols). Try again. If it continues failing, sign out and use Forgot Password instead.",

  // 1013 — Account settings, generic catch-all during password update
  1013: "We couldn't complete that request. Try refreshing the page and signing out and back in; then retry the action. If the problem continues, contact support.",

  // 1014 — Profile edit form, email field failed format check
  1014: "That email format is invalid. Use a standard email (e.g., name@example.com) and try again.",

  // 1015 — /signup, password failed strength requirements
  1015: "That password isn't strong enough. Use at least 8 characters with a mix of uppercase letters, lowercase letters, numbers, and symbols.",

  // 1016 — /admin-login, credentials don't match any admin account
  1016: "The email or password entered doesn't match an account. Double-check both and try again.",

  // 1017 — Generic unexpected error shown to users
  1017: "An unexpected error occurred. Refresh the page and try again; if it persists, sign out and back in. If the issue still happens, contact support.",

  // 1027 — POST /auth/mfa — user already has a verified MFA factor enrolled
  1027: "Your account already has an authenticator app set up. If you want to add another device, remove the existing authenticator in your account settings first.",

  // 1018 — Client-side: passwords entered by the user do not match
  1018: "The two passwords don't match. Check both fields and try again.",

  // 1019 — Client-side: password does not meet minimum length requirement
  1019: "Your password is too short. Use at least 8 characters.",

  // 1020 — Client-side: user must enter a verification/authentication code
  1020: "Enter the 6-digit code from your authenticator app to continue.",

  // 1021 — Server-side: request made without a valid authenticated user
  1021: "You must be signed in to access this resource. Sign in and try again.",

  // 1022 — POST /signup — tried to sign up with an email that's already registered
  1022: "An account already exists with that email address. Try signing in instead, or use a different email to create a new account.",

  // 1023 — Account not found for provided email (signup/login flows)
  1023: "We couldn't find an account with that email address. If you'd like, create a new account or check the email you entered and try again.",

  // 1024 — POST /login or signup — email address not yet confirmed by user
  1024: "Please verify your email before signing in.",

  //1025 - Unauthorised access to admin route
  1025: "You don't have permission to view this page. Admin access is required.",

  // 1026 — POST /forgot-password — client omitted the email field
  1026: "Please enter your email address so we can send a password reset link.",

  // 1028 — POST /auth/reset-password — missing required fields
  1028: "Please provide the following fields: {fields}.",

  // 1029 — POST /auth/reset-password — invalid or expired reset link
  1029: "The reset link appears invalid or expired. Request a new password reset link and try again.",

  // 1030 — POST /auth/reset-password — failed to update password
  1030: "We couldn't update your password right now. Please try again in a moment.",

  // 1031 — POST /auth/signup — missing required signup fields
  1031: "Please provide the following fields: {fields}.",

  // 1032 — POST /auth/signup — disposable email not allowed
  1032: "Disposable email addresses are not allowed ({domain}). Please use a different email.",

  // 1033 — POST /auth/signup — failed to create account
  1033: "We couldn't create your account right now. Please try again later.",

  // ─── DASHBOARD & NAVIGATION ──────────────────────────────────────────────

  // 1100 — useWizard hook, auto-save to cloud failed (data safe locally)
  1100: "We couldn't save your progress to the cloud right now. Your data is safe on this device — please try the Save button again, or refresh the page and try again.",

  // 1101 — useWizard hook, vault write failed during wizard step
  1101: "We couldn't save your information to the vault. Your progress may not be stored. Please try again — if the problem continues, refresh the page and retry.",

  // 1102 — Wizard, tried to navigate to a locked step
  1102: "This step is locked because earlier steps aren't complete yet. Go back and finish the previous steps first.",

  // 1103 — Pricing page, no checkout URL returned by server
  1103: "Couldn't start the checkout process right now. No payment has been taken. Try again or refresh the page.",


  // ─── DOCUMENT VAULT ───────────────────────────────────────────────────────

  // 1200 — Background sync failed, data safe on device
  1200: "Your changes didn't sync right now. They're saved on this device — please try again when your connection is stable, or refresh the page.",

  // 1201 — Export button, single or batch export failed
  1201: "We couldn't export your documents right now. Please try again. If the problem continues, try exporting fewer documents at once.",

  // 1202 — Export all, bulk export failed (none exported)
  1202: "We couldn't export all your documents right now. None have been lost — please try again, or export them in smaller batches.",

  // 1203 — Download button, fetch or URL failed
  1203: "We couldn't download that document right now. Please try again. If the problem continues, refresh the page.",

  // 1204 — Delete button, server-side delete failed (document still in vault)
  1204: "We couldn't delete that document. It's still in your vault — please try again.",

  // 1205 — Delete all, bulk delete failed (no documents removed)
  1205: "We couldn't delete all documents. Your files are still in your vault — please try again.",

  // 1206 — Step-view delete, failed from within a visa journey step
  1206: "We couldn't delete that document right now. It's still in your vault — please try again. If the problem continues, refresh the page and try again; if it still fails, contact support.",

  // 1207 — Server-side delete throw, document may still appear
  1207: "We couldn't remove that document from the server. The file may still appear in your vault — please try deleting again.",

  // 1208 — Upload modal, vault config missing or failed to initialise
  1208: "Your Document Vault isn't ready to accept uploads right now. Please refresh the page to reconnect, then try again.",

  // 1209 — Portal Wallet, credential save failed
  1209: "We couldn't save your credentials right now. Your data has not been stored. Please try again.",

  // 1210 — Portal Wallet, credential delete failed (item still in wallet)
  1210: "We couldn't delete that credential right now. The item is still in your wallet. Please try again.",

  // 1211 — Document Vault, decryption failed when serving a file
  1211: "We couldn't open this file. Try again; if it fails, contact support.",


  // ─── VISA JOURNEY ─────────────────────────────────────────────────────────

  // 1300 — Register receipt, save failed after upload
  1300: "Your receipt couldn't be saved. Your upload is still here — tap 'Save' again. If this keeps happening, check your internet connection.",

  // 1301 — Register receipt, fetch failed on load (data not deleted)
  1301: "We couldn't load your saved receipt right now. Refresh the page to try again. Your data has not been deleted.",

  // 1302 — Police clearance step, vault service unreachable
  1302: "The document vault is temporarily unavailable. You can still complete this step — upload your police clearance directly using the file picker below instead.",

  // 1303 — Portal wallet on journey, credential save failed
  1303: "Your credentials couldn't be saved right now. They haven't been lost — try saving again. If this keeps failing, check your internet connection.",

  // 1304 — Portal wallet on journey, credential delete failed (not removed)
  1304: "We couldn't delete those credentials right now. They have not been removed — please try again. If this continues, refresh the page first.",

  // 1305 — Action step, mailing details save failed
  1305: "Your mailing details couldn't be saved. Your information is still on screen — tap Save again. Check your internet connection if this keeps happening.",

  // 1306 — Notifications panel, fetch failed (no notifications lost)
  1306: "We couldn't load your notifications right now. Your data is safe — this is a display issue. Refresh the page to try again.",

  // 1307 — Document check, required document not yet in vault
  1307: "This document hasn't been uploaded to your vault yet. Go to Document Vault to upload it before continuing.",

  // 1308 — NVC fields, case number format validation failed
  1308: "Please check your NVC Case Number — it must begin with 3 capital letters (e.g., IOE or NWK), followed by numbers.",

  // 1309 — NVC fields, invoice ID format validation failed
  1309: "Your Invoice ID looks incorrect — it should start with 'IVSCA' followed by numbers (e.g., IVSCA1234567). Check your NVC invoice and re-enter it.",

  // 1310 — Journey not found
  1310: "We couldn't find that journey. It may have been removed or isn't available yet. Please refresh the page or contact support for help.",

  // 1311 — Chapters validation failed
  1311: "The chapter data provided is invalid. Check the form and try again.",

  // 1312 — Case data not found
  1312: "We couldn't find that information. It may have been removed or is not available yet.",

  // 1313 — Case data save failed
  1313: "We couldn't save your information right now. Your input is still on-screen — try saving again. If this keeps happening, check your connection and try a different browser. If it continues, contact support.",

  // 1314 — Chapter not found
  1314: "We couldn't find that chapter. Check the link and try again or contact support.",

  // 1315 — CEAC invalid input or transition
  1315: "The CEAC status update looks invalid. Check the details and try again.",

  // 1316 — CEAC server error
  1316: "We couldn't process CEAC updates right now. Please try again in a moment.",

  // 1317 — Portal wallet fetch failed
  1317: "We couldn't load your portal credentials right now. Please try again or contact support.",

  // 1318 — Chapters server error
  1318: "We couldn't load or modify data right now. Please try again in a moment.",

  // 1319 — Case data validation failed
  1319: "The data you provided failed validation. Check the fields and try again.",
  // 1320 — Validation — request body missing or not a JSON object
  1320: "We couldn't read your submission. Please refresh the page and try again.",

  // 1321 — /api/case_data — missing journey_id or other required fields
  1321: "Please provide the following fields: {fields}.",

  // 1322 — /api/case_data — operations payload invalid or empty
  1322: "Provide a non-empty array for {fields}.",

  // 1323 — /api/case_data — data_key or data_value missing
  1323: "Please provide the following fields: {fields}.",

  // 1324 — /api/ceac/status — missing required fields
  1324: "Please provide the following fields: {fields}.",

  // 1325 — /api/ceac/status — invalid transition between statuses
  1325: "Invalid transition: {from} → {to}.",

  // 1330 — Chapters API — journey_id missing for chapters endpoints
  1330: "Please provide the following fields: {fields}.",

  // 1331 — Chapters API — required chapter fields missing
  1331: "Please provide the following fields: {fields}.",

  // 1332 — Chapters API — chapter_number invalid
  1332: "{field} must be a positive integer.",

  // 1333 — Chapters API — failed to fetch or create chapters
  1333: "We couldn't process chapters right now. Please try again later.",


  // ─── TOOLS – VISA ─────────────────────────────────────────────────────────

  // 1400 — Interview Prep, visa category list failed to load
  1400: "We couldn't load the list of visa categories. Please refresh the page to try again. If categories don't appear, contact support.",

  // 1401 — Interview Prep, session creation API failed
  // 1401 — Interview Prep, session creation API failed
  // User-facing: clear retry steps; do not leak internal details
  1401: "We couldn't start your interview session. Refresh the page and try again. If it keeps failing, sign out and back in or try a different browser.",

  // 1402 — Interview Prep, questionnaire failed to load for selected category
  1402: "We couldn't load the interview questions for this category. Please go back and select your visa category again, or refresh the page.",

  // 1403 — Interview Prep, AI/server call to generate materials failed
  1403: "We couldn't generate your interview prep materials right now. This may be a temporary overload. Please wait a moment and try again.",

  // 1404 — Case Strength Checker, results save failed after analysis
  1404: "We couldn't save your case analysis right now. Your results are still visible on screen — please copy or screenshot them before leaving. Try saving again in a moment.",

  // 1405 — Case Strength Checker, analysis API call failed
  1405: "We couldn't complete the analysis right now. Please check your answers are filled in, then try again. If the problem continues, refresh the page.",

  // 1406 — 221(g) OCR tool, browser canvas API returned null
  1406: "We couldn't process that image right now. This is a browser compatibility issue. Please try using a different browser (Chrome or Firefox recommended) or upload a PDF instead.",

  // 1407 — 221(g) planner, OCR/processing pipeline failed
  // SECURITY: was leaking ${errorMessage} — raw exception text — never pass error objects here
  1407: "We couldn't read your document. This usually happens with blurry scans or password-protected files. Try uploading a clearer image or a different version of the document.",

  // 1408 — 221(g) planner, document validation failed
  // SECURITY: was leaking ${error.message} from Supabase/storage SDK
  1408: "We had trouble reading this document. Please make sure it's a clear, unprotected image or PDF, then try uploading again.",

  // 1409 — 221(g) planner, unsupported file type
  // SECURITY: was leaking ${file.type} MIME string (e.g. application/x-httpd-php)
  1409: "That file type isn't supported. Please upload a JPG, PNG, or PDF file.",

  
    // 1212 — Document Vault, no documents available to export
    1212: "There are no documents to export right now.",
  // 1410 — Visa checker, auth session creation failed
  // SECURITY: was leaking ${error.message} from Supabase auth (may contain JWT fragments)
  1410: "We couldn't start your session. Please refresh the page and try again. If you keep seeing this, try signing out and back in.",

  // 1411 — 221(g) action planner, checklist download/export failed
  1411: "Your checklist couldn't be downloaded right now — the server may be busy. Please try again in a moment. If it keeps failing, refresh the page and regenerate your plan.",

  // 1412 — Interview Prep, saving a user's answer failed
  1412: "We couldn't save your answer right now. Please try again — your text is still on-screen so you can retry.",

  // 1413 — Visa tools, submitting a session for scoring failed
  1413: "We couldn't submit your session for scoring right now. Please try again in a moment.",

  // 1414 — Interview Prep, category not selected when advancing
  1414: "Please select a visa category before continuing.",

  // 1415 — Interview Prep, expected session missing
  // 1415 — Interview Prep, expected session missing
  // User-facing: instruct how to recover and restart without confusion
  1415: "We couldn't find your interview session. Refresh the page and try again — if your answers are missing, re-select your visa category to restart the session.",

  // 1416 — Visa Case Strength Checker, missing answer validation
  1416: "Please provide an answer for: {questionLabel}",

  // 1417 — Visa Case Strength Checker, failed to create session
  1417: "We couldn't start a case strength session right now. Please try again.",

  // 1418 — Approval notice tool, required fields missing
  1418: "Please fill in the approval date and receipt number before saving.",

  // 1419 — Case status: receipt length invalid
  1419: "Receipt number is invalid. It must be exactly 13 characters: 3 letters followed by 10 digits. Check your receipt number and try again.",

  // 1420 — Geolocation unsupported
  1420: " Your browser doesn't support geolocation. Manually enter your location or use a different browser.",

  // 1421 — Action step, carrier name missing
  1421: "Enter the mailing carrier name.",

  // 1422 — Case status: failed to fetch
  1422: "Unable to retrieve your case status. Try again in a moment. If this persists, contact support.",

  // 1423 — Action step, carrier name too short
  1423: "The carrier name must be at least 2 characters.",

  // 1424 — Action step, tracking number missing
  1424: "Enter the mailing tracking number.",

  // 1425 — Action step, tracking number too short
  1425: "The tracking number must be at least 3 characters.",

  // 1426 — Action step, tracking number contains invalid characters
  1426: "Tracking numbers can only include letters, numbers, dashes, and spaces.",

  // 1427 — Dashboard, NVC/portal details missing
  1427: "We couldn't find those portal details right now. Check that the case is registered and try again.",

  // 1428 — Quest renderer, result logic evaluation failed
  1428: "We couldn't evaluate the result. Reload the page and try again.",

  // 1430 — Chat API — user submitted an empty message
  1430: "Please enter a message to send to the assistant.",

  // 1431 — Chat API — server error when contacting AI assistant
  1431: "We're having trouble connecting to the assistant right now. Please try again in a moment.",

  // 1432 — 221(g) planner — OCR extracted too little text to validate (blank/poor scan)
  1432: "We couldn't read enough text from this document. Try uploading a clearer, higher-resolution image or a PDF.",

  // 1433 — Medical exam, appointment date missing
  1433: "Select a medical appointment date.",
  // 1434 — Medical exam, appointment date is in the past
  1434: "Appointment date must be today or a future date.",

  // 1435 — Medical exam, appointment time format invalid
  1435: "Enter a valid time in 12-hour format (e.g., 09:30 AM).",

  // 1436 — Medical exam, clinic name missing
  1436: "Enter the clinic or physician name (for example: Islamabad Medical Centre).",

  // 1437 — Medical exam, clinic name too short
  1437: "Clinic name must be at least 2 characters.",

  // 1438 — Medical exam, clinic name contains invalid characters
  1438: "Clinic names may include letters, numbers, spaces, dashes, commas, and periods.",

  // 1439 — Medical exam, validation errors must be fixed before saving
  1439: "Please fix the highlighted medical appointment errors before saving.",

  // 1440 — IV scheduling tool, embassy/post missing
  1440: "Enter the embassy or post first, then try again.",

  // 1441 — IV scheduling tool, no match for selected post
  1441: "We couldn't find IV scheduling data for {postName}. Check travel.state.gov manually and try again.",

  // 1442 — IV scheduling tool, date parsing failed
  // NOTE: do not expose raw parsing text to users; keep raw data in logs only
  1442: "We couldn't read the scheduling date. Try syncing again or check travel.state.gov for the embassy's schedule and enter the date manually if needed.",

  // 1443 — IV scheduling tool, fetch failed
  1443: "We couldn't fetch the IV scheduling data. Check your connection and try again.",

  // 1444 — Approval notice tool, receipt number format failed
  1444: "Your receipt number must be 3 letters followed by 10 digits. Check the number and try again.",

  // 1445 — 221(g) planner — required document identifier missing (e.g., passport number)
  1445: "This document appears to be missing a required identifier: {field}. Please ensure the {field} is visible and try again.",

  // 1446 — Interview Prep — AI suggestion/improvement request failed
  1446: "We couldn't generate an improved version of your answer right now. Please try again — if this continues, try a different improvement type or come back later.",


  // ─── TOOLS – PDF (1450–1499) ──────────────────────────────────────────

  // 1450 — PDF merge, user selected a non-PDF file
  1450: "Only PDF files can be merged. The file you selected appears to be a different format. Please choose a .pdf file and try again.",

  // 1451 — PDF merge, file exceeds 100 MB
  1451: "That file is too large to merge here — the maximum size is 100 MB. Try compressing the PDF first, or split it into smaller parts before uploading.",

  // 1460 — Appointment tool — interview date required
  1460: "Please select an interview date.",

  // 1461 — Appointment tool — interview date cannot be in the past
  1461: "Interview date must be today or a future date.",

  // 1462 — Appointment tool — consulate location required
  1462: "Enter the consulate/post location (for example: Islamabad).",

  // 1463 — Appointment tool — consulate location too short
  1463: "Location must be at least 2 characters (e.g., Lahore).",

  // 1464 — Appointment tool — consulate location contains invalid characters
  1464: "Location may only include letters, spaces, dashes, commas, and periods (e.g., New Delhi).",

  // 1465 — Appointment tool — validation errors must be fixed before saving
  1465: "Please fix the highlighted errors before saving the appointment.",

  // 1466 — Appointment tool — saved successfully
  1466: "Appointment saved successfully.",

  // 1467 — Police clearance — PCC receipt/track format invalid
  1467: "Receipt or tracking number format looks invalid. Use letters, numbers, dashes, or slashes only (e.g., PCC-2024-001234).",

  // 1468 — Police clearance — tracking saved successfully
  1468: "Tracking saved!",

  // 1469 — Police clearance — marked as received successfully
  1469: "Marked as Received!",

  // 1470 — Portal wallet — credential save success
  1470: "Credentials saved successfully!",

  // 1471 — Portal wallet — credential delete success
  1471: "Credentials deleted successfully!",

  // 1472 — Police apply — invalid photo/passport file format
  1472: "Only JPG and PNG formats are allowed for this field.",

  // 1473 — Police apply — invalid utility/police letter file format
  1473: "Only PDF format is allowed for this field.",

  // 1474 — Police apply — file exceeds allowed size
  1474: "File size exceeds 5MB limit.",

  // 1475 — Police apply — step 1 missing required fields
  1475: "Please fill all required fields in Step 1",

  // 1476 — Police apply — witnesses details incomplete
  1476: "Please fill all details for both witnesses in Step 2",

  // 1477 — Police apply — required uploads missing
  1477: "Please upload all required documents{extra}.",

  // 1478 — Police apply — submission successful
  1478: "Application Submitted Successfully! Your Request ID is: {requestId}",

  // 1479 — Police apply — submission failed (client-facing)
  1479: "Failed to submit application: {reason}",

  // 1480 — Police apply — generic upload failure for a particular file
  1480: "Failed to upload the file: {fileKey}",

  // 1481 — PCC field too short
  1481: "Too short (minimum 3 characters).",

  // 1482 — Police apply — application date cannot be in the future
  1482: "Application date cannot be in the future.",
  // ─── FILE UPLOAD & PROCESSING ─────────────────────────────────────────────

  // 1500 — Generic upload, server rejected the file
  1500: "Your file couldn't be uploaded. This is usually caused by a slow connection or the file being too large. Check your connection and try again, or compress the file first.",

  // 1501 — Generic upload, network dropped mid-upload
  1501: "Your connection dropped while uploading the file. Check your internet connection and try uploading again.",

  // 1502 — Generic processing, server-side pipeline failed
  1502: "We couldn't process your document. Try uploading it again, confirm it's a valid, unencrypted PDF under the size limit, or try a different browser. If the problem persists, contact support.",

  // 1503 — Receipt upload, OCR couldn't read the image
  1503: "We couldn't automatically read the text from your receipt image. Try uploading a clearer photo taken in good lighting, or enter the details manually below.",

  // 1504 — Document translation / passport photo, file is not a valid PDF
  1504: "The file doesn't look like a valid PDF (.pdf). Make sure you've selected a PDF file that is not password-protected, then try uploading again.",

  // 1505 — Drop zone, upload attempted with no file selected
  1505: "No file was selected. Please choose a PDF, PNG, or JPG file to upload.",

  // 1506 — Passport photo, photo failed format validation
  1506: "Your photo doesn't meet the passport requirements. It should be a clear, front-facing colour photo with a plain light background.",

  // 1507 — Document translation, file exceeds size limit
  // Use msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: 10 }) to inject the limit
  1507: "That file is too large to upload. Please use a PDF under {maxSize}MB and try again.",

  // 1508 — Passport photo, image exceeds size limit
  // Use msg(E.UPLOAD_PHOTO_TOO_LARGE, { maxSize: 5 }) to inject the limit
  1508: "Your photo file is too large. Please use an image under {maxSize}MB (JPG or PNG recommended).",

  // 1509 — Document translation, translated document uploaded successfully
  1509: "Translated document uploaded successfully. The user can now review it.",

  // 1510 — Document translation, user confirmed translated document
  1510: "Translation confirmed successfully. Awaiting verification.",

  // 1512 — Document translation — user attempted to confirm but translation isn't ready
  1512: "This document isn't ready to confirm yet. Please wait for the translated file to be uploaded, then try again.",

  // 1513 — Document translation — translated file missing when user tries to confirm
  1513: "The translated file is missing right now. Please try again after the admin uploads it.",

  // 1514 — Document translation/upload — invalid document type supplied by user
  1514: "Invalid document type. Allowed types: {types}.",

  // 1511 — Upload: user selected a file that is empty (zero bytes)
  1511: "The file appears to be empty. Please select a non-empty document and try again.",


  // ─── PROFILE & SETTINGS ───────────────────────────────────────────────────

  // 1600 — Profile page load, API failed
  1600: "We couldn't load your profile information. This may be a temporary connection issue. Please refresh the page to try again.",

  // 1601 — profile completion save failed
  1601: "We couldn't save your profile just now. Your information is safe in the form, so please try again.",


  // ─── ANALYTICS & REPORTING ───────────────────────────────────────────────

  // 1650 — Dashboard analytics section, API failed on load
  1650: "We couldn't load your analytics data right now. The stats may be temporarily unavailable. Please refresh the page to try again.",


  // ─── CONSULTATION BOOKING ─────────────────────────────────────────────────

  // 1700 — /book-consultation, form submission failed (booking NOT confirmed)
  1700: "We couldn't submit your consultation request. Copy your form data, check required fields, and try again. If it still fails, contact support so we can assist.",
  // 1701 — Consultation service: Supabase client not initialized
  1701: "Server configuration error. Please try again later.",
  // 1702 — Consultation service: failed to create booking
  1702: "We couldn't create your consultation booking right now. Please try again in a moment.",
  // 1703 — Consultation service: failed to update booking
  1703: "We couldn't update this booking right now. Please try again.",
  // 1704 — Consultation service: failed to fetch bookings
  1704: "We couldn't load consultation bookings right now. Please try again later.",
  // 1705 — Consultation timeslot create failed
  1705: "We couldn't create that time slot. Try again or contact support.",
  // 1706 — Consultation timeslot update failed
  1706: "We couldn't update that time slot. Try again or contact support.",


  // ─── FOLLOW-UP & COMMS ────────────────────────────────────────────────────

  // 1750 — FollowUpManager, DB status update failed
  // SECURITY: was appending raw DB/ORM error text — never pass error objects here
  1750: "We couldn't update the follow-up status right now. Your changes haven't been saved. Please try again — if the issue continues, refresh the page.",


  // ─── PAYMENTS ─────────────────────────────────────────────────────────────

  // 1800 — /pricing, checkout session creation failed (NO charge was taken)
  1800: "We couldn't start the checkout process. No payment has been taken. Please try again. If the problem continues, refresh the page or try a different browser.",
  // 1801 — Payment create failed
  1801: "We couldn't record your payment right now. Please try again in a moment.",
  // 1802 — Payment fetch failed
  1802: "We couldn't retrieve that payment right now. Please try again in a moment.",
  // 1803 — Payment update failed
  1803: "We couldn't update that payment right now. Please try again.",
  // 1804 — User payments fetch failed
  1804: "We couldn't load your payments right now. Please try again later.",
  // 1805 — Subscription update failed
  1805: "We couldn't update your subscription right now. Please try again later.",


  // ─── ADMIN TOOLS ──────────────────────────────────────────────────────────

  // 1900 — Admin visa cases, tracking clear failed
  1900: "We couldn't update the tracking record for this case. Please try again. If the status doesn't update, refresh the page.",

  // 1901 — Admin translation queue, document download failed
  1901: "We couldn't download that document right now. The file may no longer be available, or there's a temporary connection issue. Please try again.",

  // 1902 — Admin pages, generic data fetch failed
  1902: "We couldn't load this data right now. Please refresh the page and try again.",

  // 1903 — Admin invalid input
  1903: "Some fields have invalid values. Check the highlighted fields and try again.",


  // ─── EXTERNAL INTEGRATIONS (1950–1959) ─────────────────────────────────

  // 1950 — EasyPost webhook processing failed
  1950: "We couldn't process the shipment update right now. Try again later.",

  // 1951 — EasyPost webhook — no associated case (informational)
  1951: "No associated case found for this tracker.",

  // 1952 — EasyPost webhook processed successfully (informational)
  1952: "Shipment update received and processed.",

  // 1953 — EasyPost API — missing caseId parameter
  1953: "Missing case identifier. Provide `caseId` and try again.",

  // 1954 — EasyPost API — no tracker found for the given case
  1954: "No tracking information was found for this case.",

  // 1955 — EasyPost tracker missing fields
  1955: "Missing required fields. Provide case ID, carrier, and tracking code and try again.",

  // 1956 — EasyPost tracker creation failed
  1956: "We couldn't create the shipment tracker right now. Try again in a moment.",

  // ─── INTERVIEW / AI VALIDATION (1960–1969) ─────────────────────────────

  // 1960 — Interview prep missing required POST fields
  1960: "Missing required fields for interview session creation. Check your request and try again.",

  // 1961 — Interview prep AI not configured
  1961: "AI service isn't available right now. Please try again later.",

  // 1962 — Interview answer validation: too short
  1962: "Answer must be at least 10 characters long.",


  // ─── JOURNEYS / UPLOAD / USCIS / PDF HELPERS (1970–1999) ───────────────

  // Journeys
  1970: "You are not authorized to view these journeys.",
  1971: "We couldn't get journey/s right now. Try again later.",
  1972: "Failed to delete journey/s. Please try again.",
  // Upload
  1973: "Please attach the required file and provide the appointment id, then try again.",
  1974: "Upload failed: file must be a PDF (.pdf), JPG (.jpg/.jpeg), or PNG (.png).",
  1975: "We couldn't upload the file. Check your internet connection and that the file is a supported format (PDF/JPG/PNG) under the size limit, then try again. If it keeps failing, contact support.",
  1976: "We couldn't update the appointment record. Please try again. If this continues, contact support.",

  // USCIS
  1977: "Please enter your receipt number so we can check your case status.",
  1978: "That receipt number looks incorrect. It should be 13 characters: 3 letters followed by 10 digits (for example: MSC2590123456).",
  1979: "We couldn't find a case for that receipt number. Double-check the number and try again.",
  1980: "We couldn't verify the request right now. Please wait a moment and try again.",
  1981: "USCIS is temporarily unavailable. Please try again later.",
  1982: "Something went wrong while checking your case. Please try again in a moment; if the problem continues, contact support.",

  // Contact
  1983: "Please complete all required contact form fields.",
  1984: "We couldn't send your message right now. Please try again.",
  1985: "An unexpected error occurred while submitting the form. Please try again; if it continues, copy your input and contact support.",

  // Follow up
  1986: "Failed to update follow-up status. Please try again.",

  // Geoapify
  1987: "Location service isn't configured. Using local country suggestions.",
  1988: "Using local country fallbacks due to location service error.",

  // PDF tools
  // PDF tools
  1990: "Skipping {fileName}: PowerPoint files are not supported.",
  1991: "Please select PDF files only.",
  // 1992 — PDF generator failed to assemble packet
  1992: "We couldn't generate the PDF packet right now. Try again; if the problem continues, refresh the page and contact support.",

  // Reuse existing PDF_FILE_TOO_LARGE (see ID 1451) for file-size messages
  1993: "No pages could be merged from the selected files. Try choosing different PDF files and try again.",
  1994: "We couldn't merge the PDF right now. Try again later.",

  // 1995 — Unsupported image format for embedding into PDF
  1995: "That image format isn't supported for PDF embedding. Please use PNG or JPEG images.",

  // 1996 — Page index out of bounds when embedding image
  1996: "The requested page is out of range. Using the last page instead.",

  // 1997 — Failed to embed image into PDF
  1997: "We couldn't add that image to the PDF. Try re-uploading the image or use a different file.",

  // 1998 — Cannot delete last page
  1998: "You cannot delete the last page of a document.",

  // 1999 — PDF converter: text required
  1999: "Please enter some text to convert to PDF.",


  // ─── CONTACT & COMMS ──────────────────────────────────────────────────────

  // 2000 — /contact, form submission API failed
  // Note: this same catch-all message was previously used across 5 different pages
  2000: "Your message couldn't be sent right now due to a server issue. Copy your message text so you don't lose it, then try again in a moment.",

  // 2001 — /contact, server-side email send failed
  2001: "Your message couldn't be sent — the mail server returned an error. Please try again. If the issue persists, contact support.",

  // 2002 — PDF converter: text too long
  2002: "Your text is too long. Please shorten it to under {max} characters.",

  // 2003 — PDF converter: generic failure
  2003: "We couldn't create the PDF right now. Try again in a moment.",

  // 2004 — PDF crop/signature processing failed
  2004: "We couldn't process that image. Try again or upload a different file.",

  // 2005 — Appointment notifications: invalid data
  2005: "Notification details look incorrect. Check the appointment fields and try again.",

  // 2006 — Appointment notifications: email send failed
  2006: "We couldn't send the appointment notification right now. Try again in a moment.",

  // 2007 — Appointment notifications: appointment not found
  2007: "Appointment not found.",

  // 2008 — Appointment notifications: trigger failed
  2008: "We couldn't trigger the appointment notification right now. Try again later.",

  // 2010 — Generic email send failure
  2010: "We couldn't send that email right now. Try again in a moment.",


  // ─── FEEDBACK & MISC ──────────────────────────────────────────────────────

  // 2100 — Guides page, save guide API failed
  2100: "We couldn't save this guide right now. Your progress hasn't been lost — please try saving again. If it keeps failing, refresh the page and retry.",

  // 2101 — Feedback widget, submitted without choosing a feedback type
  2101: "Please choose a feedback type from the dropdown above before submitting.",

  // 2102 — Feedback widget, submitted without writing a description
  2102: "Please describe what you noticed or experienced — even a sentence helps.",

  // 2103 — Dashboard wizard, required step not completed before proceeding
  // Use msg(E.JOURNEY_STEP_INCOMPLETE, { stepName: step.displayName })
  // IMPORTANT: use step.displayName not step.name — displayName is human-readable,
  2103: "You need to complete \"{stepName}\" before moving on. Find it in your journey checklist and finish it first.",

}