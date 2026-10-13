/**
 * Cross-journey service request directory.
 *
 * Normalizes every service request on the account (Expert Consultation, Medical
 * Appointment, PCC Filing, Document Translation) into one shape and resolves WHERE
 * each request lives - which visa category / candidate journey, or the standalone
 * service pages. Backs the "My Requests (all journeys)" modal in the journey Services
 * folder, so a user who booked a medical under IR-1 and is now looking inside IR-5
 * can see exactly where it went.
 *
 * Context resolution per service (each table tags origin differently):
 *  - Medical / PCC: `source` + `journey_slug` (authoritative category), candidate from
 *    `candidate_id` / `metadata.candidate_id` / the `[Candidate: x]` admin_notes tag.
 *  - Translation: only `metadata.candidate_id`; category comes from that candidate.
 *  - Consultation: no candidate tag; account-wide, labeled with its own `visa_category`.
 *
 * Pure: no React, no fetch. Input is the `/api/user-dashboard/services-status?scope=all`
 * payload plus the candidate roster.
 */

import { getBaseVisaCategory, UNKNOWN_VISA_CATEGORY } from "@/lib/candidate/candidateSyncService";
import { getJourneyHrefByType } from "@/lib/constants/routes";
import type { CandidateProfile } from "@/types/candidate";

/** An untyped row from one of the four service tables (each has its own column set). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawRow = Record<string, any>;

export type ServiceKind = "consultation" | "medical" | "pcc" | "translation";

export const SERVICE_LABELS: Record<ServiceKind, string> = {
  consultation: "Expert Consultation",
  medical: "Medical Appointment",
  pcc: "PCC Filing (Sindh)",
  translation: "Document Translation",
};

export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

export interface ServiceRequestContext {
  /**
   * journey    - requested from inside a journey (Medical / PCC tagged source=journey)
   * standalone - requested from the standalone service page (My Resources)
   * candidate  - tied to a candidate, origin unknown (Translation)
   * account    - not tied to any candidate (Consultation)
   */
  kind: "journey" | "standalone" | "candidate" | "account";
  /** Canonical base category ("IR-1", "IR-5"), or null when it cannot be resolved. */
  category: string | null;
  candidateId: string | null;
  candidateName: string | null;
  /** Route of the journey this request belongs to, or null. */
  journeyHref: string | null;
  /** Human label, e.g. "IR-1 journey - Spouse: Ayesha Khan". */
  label: string;
  /** Stable grouping key. */
  key: string;
}

export interface ServiceRequestDetail {
  label: string;
  value: string;
}

export interface ServiceRequestItem {
  id: string;
  service: ServiceKind;
  serviceLabel: string;
  title: string;
  subtitle: string | null;
  status: string;
  statusLabel: string;
  statusTone: StatusTone;
  /** False for cancelled / rejected / finished requests. */
  isActive: boolean;
  createdAt: string | null;
  context: ServiceRequestContext;
  details: ServiceRequestDetail[];
  userNotes: string | null;
  adminNotes: string | null;
  /** Page outside the journey where this request can be managed, if any. */
  manageHref: string | null;
}

export interface ServicesStatusPayload {
  pccRequests?: RawRow[];
  medicalAppointments?: RawRow[];
  consultationBookings?: RawRow[];
  translationDocuments?: RawRow[];
}

const CANDIDATE_TAG = /\[Candidate:\s*([^\]]+)\]\s*/;

const SUCCESS_STATUSES = ["completed", "confirmed", "verified", "user_confirmed", "translated"];
const INFO_STATUSES = ["in_progress", "in_review", "alternatives_proposed", "processing"];
const DANGER_STATUSES = ["action_required", "needs_more_info", "changes_requested"];
const CLOSED_STATUSES = ["cancelled", "canceled", "rejected", "completed", "verified"];

export function getStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (SUCCESS_STATUSES.includes(s)) return "success";
  if (INFO_STATUSES.includes(s)) return "info";
  if (DANGER_STATUSES.includes(s)) return "danger";
  if (s === "cancelled" || s === "canceled" || s === "rejected") return "neutral";
  return "warning";
}

function toStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanize(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value);
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Builds a detail list, dropping empty values. */
function details(pairs: Array<[string, unknown]>): ServiceRequestDetail[] {
  return pairs
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([label, v]) => ({ label, value: String(v) }));
}

/** Candidate id stamped on a row by any of the tagging schemes, or null. */
export function extractCandidateId(row: RawRow): string | null {
  if (row.candidate_id) return String(row.candidate_id);
  if (row.metadata?.candidate_id) return String(row.metadata.candidate_id);
  if (typeof row.admin_notes === "string") {
    const m = row.admin_notes.match(CANDIDATE_TAG);
    if (m) return m[1].trim();
  }
  return null;
}

/** Admin notes without the internal `[Candidate: x] Name` tag, or null when nothing is left. */
export function cleanAdminNotes(
  row: RawRow,
  knownNames: Array<string | null | undefined> = []
): string | null {
  if (typeof row.admin_notes !== "string") return null;
  let notes = row.admin_notes;
  if (CANDIDATE_TAG.test(notes)) {
    notes = notes.replace(CANDIDATE_TAG, "").trim();
    // The tag is written as "[Candidate: id] <name>"; strip that name (longest match first).
    // Not every table stores the name in a column (PCC does not), so the roster names count too.
    const names = [row.candidate_name, row.metadata?.candidate_name, ...knownNames]
      .map((n) => String(n || "").trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    const hit = names.find((n) => notes.startsWith(n));
    if (hit) notes = notes.slice(hit.length);
  }
  notes = notes.trim();
  return notes || null;
}

/** Admin notes for a row, with the candidate tag (and its name) removed. */
function adminNotesFor(row: RawRow, candidates: CandidateProfile[]): string | null {
  const id = extractCandidateId(row);
  const c = id ? candidates.find((x) => x.id === id) : undefined;
  return cleanAdminNotes(row, [c?.fullName, c?.label]);
}

function normalizeCategory(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const base = getBaseVisaCategory(raw);
  return base === UNKNOWN_VISA_CATEGORY ? null : base;
}

function candidateDisplayName(
  candidate: CandidateProfile | undefined,
  row: RawRow
): string | null {
  const rowName = row.candidate_name || row.metadata?.candidate_name || null;
  if (candidate) {
    const name = candidate.fullName && candidate.fullName !== candidate.relation ? candidate.fullName : "";
    const label = candidate.label || candidate.relation || "";
    if (name && label) return `${label}: ${name}`;
    return name || label || rowName;
  }
  return rowName;
}

interface ResolveInput {
  row: RawRow;
  kind: ServiceRequestContext["kind"];
  /** Category straight from the row (journey_slug / visa_category), if any. */
  rowCategory: string | null;
  candidates: CandidateProfile[];
}

function resolveContext({ row, kind, rowCategory, candidates }: ResolveInput): ServiceRequestContext {
  // Untagged legacy rows belong to the primary candidate (same rule as services-status).
  const taggedId = extractCandidateId(row);
  const candidateId = kind === "account" ? null : taggedId || "candidate-1";
  const candidate = candidateId ? candidates.find((c) => c.id === candidateId) : undefined;
  const category = rowCategory || normalizeCategory(candidate?.visaCategory) || null;
  const candidateName = kind === "account" ? null : candidateDisplayName(candidate, row);

  let label: string;
  if (kind === "journey" || kind === "candidate") {
    const where = category ? `${category} journey` : "Journey (category unknown)";
    label = candidateName ? `${where} - ${candidateName}` : where;
  } else if (kind === "standalone") {
    label = candidateName
      ? `Standalone service page - ${candidateName}`
      : "Standalone service page";
  } else {
    label = category ? `Account-wide (booked for ${category})` : "Account-wide";
  }

  const journeyHref =
    (kind === "journey" || kind === "candidate") && category
      ? getJourneyHrefByType(category) || null
      : null;

  const key =
    kind === "journey" || kind === "candidate"
      ? `journey:${category || "unknown"}:${candidateId}`
      : kind === "standalone"
        ? "standalone"
        : "account";

  return { kind, category, candidateId, candidateName, journeyHref, label, key };
}

function buildMedical(row: RawRow, candidates: CandidateProfile[]): ServiceRequestItem {
  const status = String(row.status || "pending");
  const isPast =
    !!row.preferred_date && new Date(row.preferred_date).getTime() < Date.now();
  const kind = row.source === "journey" ? "journey" : "standalone";
  const context = resolveContext({
    row,
    kind,
    rowCategory: kind === "journey" ? normalizeCategory(row.journey_slug) : null,
    candidates,
  });
  return {
    id: String(row.id),
    service: "medical",
    serviceLabel: SERVICE_LABELS.medical,
    title: row.medical_website || "Medical Examination",
    subtitle: [row.full_name, formatDate(row.preferred_date)].filter(Boolean).join(" - ") || null,
    status,
    statusLabel: toStatusLabel(status),
    statusTone: getStatusTone(status),
    isActive: !CLOSED_STATUSES.includes(status.toLowerCase()) && !isPast,
    createdAt: row.created_at || null,
    context,
    details: details([
      ["Clinic", row.medical_website],
      ["Location", humanize(row.location)],
      ["Applicant", row.full_name],
      ["Passport", row.passport_number],
      ["Appointment date", formatDate(row.preferred_date)],
      ["Appointment time", row.preferred_time],
      ["Visa category", row.visa_category || row.visa_type],
      ["Medical type", humanize(row.medical_type)],
      ["Applicants", row.number_of_applicants],
      ["Case reference", row.case_ref],
      ["Interview date", formatDate(row.interview_date)],
      ["Estimated charges", row.estimated_charges],
      ["Email", row.email],
      ["Phone", row.phone_number],
      ["Booked on", formatDate(row.created_at)],
    ]),
    userNotes: row.notes || null,
    adminNotes: adminNotesFor(row, candidates),
    manageHref: kind === "standalone" ? "/services" : null,
  };
}

function buildPcc(row: RawRow, candidates: CandidateProfile[]): ServiceRequestItem {
  const status = String(row.status || "pending");
  const kind = row.source === "journey" ? "journey" : "standalone";
  const context = resolveContext({
    row,
    kind,
    rowCategory: kind === "journey" ? normalizeCategory(row.journey_slug) : null,
    candidates,
  });
  return {
    id: String(row.id),
    service: "pcc",
    serviceLabel: SERVICE_LABELS.pcc,
    title: row.request_id ? `Request ${row.request_id}` : "Police Certificate Request",
    subtitle: [row.full_name, row.district].filter(Boolean).join(" - ") || null,
    status,
    statusLabel: toStatusLabel(status),
    statusTone: getStatusTone(status),
    isActive: !CLOSED_STATUSES.includes(status.toLowerCase()),
    createdAt: row.created_at || null,
    context,
    details: details([
      ["Request ID", row.request_id],
      ["Applicant", row.full_name],
      ["Province", humanize(row.province)],
      ["District", row.district],
      ["Purpose", row.purpose],
      ["Delivery", humanize(row.delivery_type)],
      ["Target country", row.target_country],
      ["Filed on", formatDate(row.created_at)],
      ["Received on", formatDate(row.received_at)],
    ]),
    userNotes: null,
    adminNotes: adminNotesFor(row, candidates),
    manageHref: kind === "standalone" ? "/services" : null,
  };
}

function buildConsultation(row: RawRow, candidates: CandidateProfile[]): ServiceRequestItem {
  const status = String(row.status || "pending_approval");
  const isPast = !!row.selected_slot && new Date(row.selected_slot).getTime() < Date.now();
  const context = resolveContext({
    row,
    kind: "account",
    rowCategory: normalizeCategory(row.visa_category),
    candidates,
  });
  return {
    id: String(row.id),
    service: "consultation",
    serviceLabel: SERVICE_LABELS.consultation,
    title: humanize(row.issue_category) || "Consultation Session",
    subtitle: formatDateTime(row.selected_slot),
    status,
    statusLabel: toStatusLabel(status),
    statusTone: getStatusTone(status),
    isActive: !CLOSED_STATUSES.includes(status.toLowerCase()) && !isPast,
    createdAt: row.created_at || null,
    context,
    details: details([
      ["Reference", row.reference_id],
      ["Topic", humanize(row.issue_category)],
      ["Visa category", row.visa_category],
      ["Case stage", humanize(row.case_stage)],
      ["Urgency", humanize(row.urgency)],
      ["Language", row.preferred_language],
      ["Scheduled for", formatDateTime(row.selected_slot)],
      ["Booked on", formatDate(row.created_at)],
    ]),
    userNotes: row.case_summary || null,
    adminNotes: adminNotesFor(row, candidates),
    manageHref: "/book-consultation?tab=requests",
  };
}

function buildTranslation(row: RawRow, candidates: CandidateProfile[]): ServiceRequestItem {
  const status = String(row.status || "PENDING");
  const context = resolveContext({ row, kind: "candidate", rowCategory: null, candidates });
  const docType = humanize(row.document_type);
  return {
    id: String(row.id),
    service: "translation",
    serviceLabel: SERVICE_LABELS.translation,
    title: docType ? `${docType} translation` : "Document translation",
    subtitle: row.original_filename || null,
    status,
    statusLabel: toStatusLabel(status),
    statusTone: getStatusTone(status),
    isActive: !CLOSED_STATUSES.includes(status.toLowerCase()),
    createdAt: row.created_at || null,
    context,
    details: details([
      ["Document type", docType],
      ["File", row.original_filename],
      ["Uploaded on", formatDate(row.created_at)],
    ]),
    userNotes: row.user_notes || null,
    adminNotes: adminNotesFor(row, candidates),
    manageHref: "/document-translation/my-requests",
  };
}

/** Every request on the account, newest first. */
export function buildServiceRequestDirectory(
  payload: ServicesStatusPayload,
  candidates: CandidateProfile[]
): ServiceRequestItem[] {
  const items: ServiceRequestItem[] = [
    ...(payload.consultationBookings || []).map((r) => buildConsultation(r, candidates)),
    ...(payload.medicalAppointments || []).map((r) => buildMedical(r, candidates)),
    ...(payload.pccRequests || []).map((r) => buildPcc(r, candidates)),
    ...(payload.translationDocuments || []).map((r) => buildTranslation(r, candidates)),
  ];
  return items.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

/** True when the request belongs to the journey the user is currently viewing. */
export function isRequestInCurrentJourney(
  item: ServiceRequestItem,
  current: { category: string | null; candidateId: string | null }
): boolean {
  const { kind, category, candidateId } = item.context;
  if (kind !== "journey" && kind !== "candidate") return false;
  if (!category || !current.category) return false;
  return category === current.category && candidateId === (current.candidateId || "candidate-1");
}
