/**
 * Per-journey personal data for the journey dashboard: notes, custom calendar
 * events and dismissed alerts.
 *
 * Stored as `case_data` rows on the journey (via `useWizard.updateMetadata`),
 * so they belong to ONE journey row. Every candidate and every category has its
 * own journey row, which means notes written on user A's IR-1 dashboard never
 * show on their IR-5 dashboard or on another candidate's. None of these keys are
 * in `CASE_DATA_TO_PROFILE`, so they never reach the shared profile.
 *
 * Values come back from the database untrusted, so every reader validates shape.
 */

export const DASHBOARD_NOTES_KEY = "dashboard_notes";
export const DASHBOARD_EVENTS_KEY = "dashboard_events";
export const DASHBOARD_DISMISSED_KEY = "dashboard_dismissed_alerts";

export const NOTE_COLORS = ["#0d9488", "#3b62a0", "#6b4f93", "#b4405a", "#d89a45"] as const;

/** A note colour IS its category (stored as the colour, so older notes keep working). */
export const NOTE_CATEGORIES: { color: (typeof NOTE_COLORS)[number]; label: string }[] = [
  { color: "#0d9488", label: "Follow-up" },
  { color: "#3b62a0", label: "Documents" },
  { color: "#6b4f93", label: "Questions" },
  { color: "#b4405a", label: "Appointments" },
  { color: "#d89a45", label: "Money" },
];
export const noteCategoryLabel = (color: string) =>
  NOTE_CATEGORIES.find((c) => c.color === color)?.label ?? "Follow-up";
export const NOTE_MAX_LENGTH = 300;
export const NOTES_MAX = 100;
export const EVENT_TITLE_MAX = 40;
export const EVENT_NOTE_MAX = 40;
export const EVENTS_MAX = 100;
export const DISMISSED_MAX = 200;

export interface DashboardNote {
  id: string;
  text: string;
  color: string;
  /** Created at, epoch ms. */
  ts: number;
  pinned: boolean;
}

export interface DashboardEvent {
  id: string;
  title: string;
  /** Local calendar day, "YYYY-MM-DD". */
  day: string;
  /** Optional "HH:MM" (24h). */
  time?: string;
  note?: string;
  color: string;
}

const isStr = (v: unknown): v is string => typeof v === "string";
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function newPersonalId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function pickColor(v: unknown, fallbackIdx: number): string {
  return isStr(v) && (NOTE_COLORS as readonly string[]).includes(v)
    ? v
    : NOTE_COLORS[fallbackIdx % NOTE_COLORS.length];
}

export function parseNotes(raw: unknown): DashboardNote[] {
  if (!Array.isArray(raw)) return [];
  const out: DashboardNote[] = [];
  raw.forEach((n, i) => {
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown>;
    const text = isStr(o.text) ? o.text.trim().slice(0, NOTE_MAX_LENGTH) : "";
    if (!isStr(o.id) || !text) return;
    out.push({
      id: o.id.slice(0, 40),
      text,
      color: pickColor(o.color, i),
      ts: typeof o.ts === "number" && Number.isFinite(o.ts) ? o.ts : 0,
      pinned: o.pinned === true,
    });
  });
  return out.slice(0, NOTES_MAX);
}

export function parseEvents(raw: unknown): DashboardEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: DashboardEvent[] = [];
  raw.forEach((e, i) => {
    if (!e || typeof e !== "object") return;
    const o = e as Record<string, unknown>;
    const title = isStr(o.title) ? o.title.trim().slice(0, EVENT_TITLE_MAX) : "";
    if (!isStr(o.id) || !title || !isStr(o.day) || !DAY_RE.test(o.day)) return;
    if (!parseDay(o.day)) return;
    out.push({
      id: o.id.slice(0, 40),
      title,
      day: o.day,
      time: isStr(o.time) && TIME_RE.test(o.time) ? o.time : undefined,
      note: isStr(o.note) && o.note.trim() ? o.note.trim().slice(0, EVENT_NOTE_MAX) : undefined,
      color: pickColor(o.color, i),
    });
  });
  return out.slice(0, EVENTS_MAX);
}

export function parseDismissed(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isStr).map((s) => s.slice(0, 300)).slice(-DISMISSED_MAX);
}

/** Notes ordered for display: pinned first, then newest first. */
export function sortNotes(notes: DashboardNote[]): DashboardNote[] {
  return notes.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.ts - a.ts);
}

/**
 * Parse a stored day. Accepts "YYYY-MM-DD" (read as a LOCAL calendar day, so a
 * date never shifts by one in time zones west of UTC) and full ISO timestamps.
 * Returns null for anything that is not a real date after 2000.
 */
export function parseDay(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (!isStr(value) || !value.trim()) return null;
  const v = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return null;
  if (m && (d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3])) return null;
  return d;
}

export function toDayString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "14:30" -> "2:30 PM" */
export function formatTime24(t?: string): string | undefined {
  if (!t || !TIME_RE.test(t)) return undefined;
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
