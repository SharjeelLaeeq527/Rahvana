"use client";

/**
 * "My requests" view for the STANDALONE Medical and Police pages, in the service skin.
 * Reads the same endpoint the Services page uses (/api/user-dashboard/services-status,
 * default scope = standalone requests on this account) and shows that service's rows
 * with ServiceRequestList. Read-only: no new server logic.
 */

import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/spinner";
import { useCandidate } from "@/app/context/CandidateContext";
import { cleanAdminNotes } from "@/lib/services/serviceRequestDirectory";
import ServiceSkinShell from "./ServiceSkinShell";
import ServiceRequestList, { ServiceRequestEmpty, type RequestTone } from "./ServiceRequestList";
import { SERVICE_SKIN_FAQ } from "./serviceSkinCopy";

type Row = {
  id: string;
  status?: string;
  full_name?: string;
  created_at?: string;
  admin_notes?: string;
  candidate_name?: string;
  // Medical
  location?: string;
  medical_website?: string;
  preferred_date?: string;
  preferred_time?: string;
  // Police
  request_id?: string;
  district?: string;
  purpose?: string;
};

/** Status dot colour from the status word (both tables use free-text statuses). */
export function toneForStatus(status?: string): RequestTone {
  const s = (status || "").toLowerCase();
  if (/(cancel|reject|fail|expired)/.test(s)) return "neutral";
  if (/(confirm|complete|received|approved|verified|issued|done|ready)/.test(s)) return "done";
  if (/(alternative|action|changes|missing)/.test(s)) return "attention";
  if (/(progress|processing|review|submitted|scheduled)/.test(s)) return "progress";
  return "waiting";
}

function capitalize(value?: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const COPY = {
  medical: {
    title: "Medical appointment",
    tagline: "Track your medical exam bookings",
    subheading: "Every medical exam you have booked here, with its status.",
    empty: "No medical appointments yet",
    back: "Book a new appointment",
  },
  police: {
    title: "Police verification",
    tagline: "Track your police certificate applications",
    subheading: "Every police certificate application you have filed here, with its status.",
    empty: "No police certificate applications yet",
    back: "File a new application",
  },
} as const;

export default function StandaloneRequestsView({
  service,
  onBack,
}: {
  service: "medical" | "police";
  onBack: () => void;
}) {
  const { candidates } = useCandidate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const copy = COPY[service];

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user-dashboard/services-status")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (cancelled) return;
        const list = service === "medical" ? data.medicalAppointments : data.pccRequests;
        setRows(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setRows([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const knownNames = candidates.map((c) => c.fullName);

  return (
    <ServiceSkinShell
      service={service}
      title={copy.title}
      tagline={copy.tagline}
      steps={[]}
      current={-1}
      kicker={null}
      heading="My requests"
      subheading={copy.subheading}
      faq={SERVICE_SKIN_FAQ[service]}
      hideSwitcher
      layout="page"
      topOffset={60}
      viewportOffset={60}
      paneFooter={
        <button type="button" className="svk-link" onClick={onBack}>
          {copy.back}
        </button>
      }
    >
      {rows === null ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="md" />
        </div>
      ) : rows.length === 0 ? (
        <ServiceRequestEmpty
          title={failed ? "Your requests could not be loaded" : copy.empty}
          body={failed ? "Please refresh the page to try again." : undefined}
          action={
            !failed ? (
              <button type="button" className="svk-btn svk-btn-pri" onClick={onBack}>
                {copy.back}
              </button>
            ) : undefined
          }
        />
      ) : (
        <ServiceRequestList
          items={rows.map((row) => {
            const note = cleanAdminNotes(row as Parameters<typeof cleanAdminNotes>[0], knownNames);
            const isMedical = service === "medical";
            const title = isMedical
              ? row.preferred_date
                ? `${formatDate(row.preferred_date)}${row.preferred_time ? `, ${row.preferred_time}` : ""}`
                : row.medical_website || "Medical exam"
              : row.purpose
                ? `Police certificate - ${row.purpose}`
                : "Police certificate";
            const subtitle = isMedical
              ? [row.full_name, row.medical_website, capitalize(row.location)].filter(Boolean).join(" - ")
              : [row.full_name, row.district].filter(Boolean).join(" - ");
            const meta = isMedical
              ? row.created_at
                ? `Requested ${formatDate(row.created_at)}`
                : undefined
              : [row.request_id ? `Ref ${row.request_id}` : "", row.created_at ? `Filed ${formatDate(row.created_at)}` : ""]
                  .filter(Boolean)
                  .join(" - ");
            return {
              id: row.id,
              title,
              subtitle: subtitle || undefined,
              meta: meta || undefined,
              status: {
                label: (row.status || "pending").replace(/_/g, " "),
                tone: toneForStatus(row.status),
              },
              children: note ? (
                <details>
                  <summary>Note from our team</summary>
                  <p>{note}</p>
                </details>
              ) : undefined,
            };
          })}
        />
      )}
    </ServiceSkinShell>
  );
}
