"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Heart,
  Shield,
  FileUp,
  MapPin,
  ExternalLink,
  Inbox,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useCandidate } from "@/app/context/CandidateContext";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { useServiceRequestDirectory } from "@/lib/hooks/useServiceRequestDirectory";
import {
  SERVICE_LABELS,
  isRequestInCurrentJourney,
  type ServiceKind,
  type ServiceRequestItem,
  type StatusTone,
} from "@/lib/services/serviceRequestDirectory";

/**
 * "My Requests (all journeys)" directory, opened from the journey Services folder.
 * Lists every service request on the account across all journeys and candidates,
 * labeled with where it lives, so a request booked under IR-1 is not mistaken as
 * missing when the user looks for it under IR-5. Clicking a row shows its full detail
 * plus a way to jump to the journey it belongs to.
 */

interface AllServiceRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Close every modal (used after navigating / launching a tool). */
  onDone: () => void;
  /** Launch a toolbox service in the current journey. */
  onLaunchItem: (componentKey: string) => void;
}

const SERVICE_ICONS: Record<ServiceKind, LucideIcon> = {
  consultation: MessageSquare,
  medical: Heart,
  pcc: Shield,
  translation: FileUp,
};

/** Toolbox componentKey that opens each service inside the journey. */
const SERVICE_COMPONENT_KEYS: Record<ServiceKind, string> = {
  consultation: "expert_consultation",
  medical: "medical_appointment",
  pcc: "police_verification",
  translation: "doc_translation",
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const FILTERS: Array<{ id: ServiceKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "consultation", label: "Consultation" },
  { id: "medical", label: "Medical" },
  { id: "pcc", label: "PCC" },
  { id: "translation", label: "Translation" },
];

function StatusBadge({ item }: { item: ServiceRequestItem }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[item.statusTone]}`}
    >
      {item.statusLabel}
    </span>
  );
}

export function AllServiceRequestsModal({
  isOpen,
  onClose,
  onDone,
  onLaunchItem,
}: AllServiceRequestsModalProps) {
  const router = useRouter();
  const { candidates, activeCandidateId, setActiveCandidateId } = useCandidate();
  const { journeyCategory, journeySlug, candidateId: envCandidateId } = useJourneyEnvironment();
  const { items, loading, error } = useServiceRequestDirectory(isOpen);

  const [filter, setFilter] = useState<ServiceKind | "all">("all");
  const [selected, setSelected] = useState<ServiceRequestItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reset to the list each time the modal is reopened.
  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setFilter("all");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (selected) setSelected(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, selected, onClose]);

  const current = useMemo(
    () => ({
      category: journeyCategory
        ? getBaseVisaCategory(journeyCategory)
        : journeySlug
          ? getBaseVisaCategory(journeySlug)
          : null,
      candidateId: activeCandidateId || envCandidateId || "candidate-1",
    }),
    [journeyCategory, journeySlug, activeCandidateId, envCandidateId]
  );

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.service === filter)),
    [items, filter]
  );

  // Group by where each request lives; the journey being viewed comes first.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; isCurrent: boolean; items: ServiceRequestItem[] }
    >();
    for (const item of filtered) {
      const key = item.context.key;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: item.context.label,
          isCurrent: isRequestInCurrentJourney(item, current),
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  }, [filtered, current]);

  if (!isOpen || !mounted) return null;

  const goToJourney = (item: ServiceRequestItem) => {
    const { candidateId, journeyHref } = item.context;
    if (candidateId && candidates.some((c) => c.id === candidateId)) {
      setActiveCandidateId(candidateId);
    }
    onDone();
    if (journeyHref && typeof window !== "undefined") {
      const here = window.location.pathname.replace(/\/+$/, "");
      if (here !== journeyHref.replace(/\/+$/, "")) router.push(journeyHref);
    }
  };

  const openHere = (item: ServiceRequestItem) => {
    onDone();
    onLaunchItem(SERVICE_COMPONENT_KEYS[item.service]);
  };

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-[#0d7377]" />
          Looking up your requests across all journeys
        </div>
      );
    }
    if (error) {
      return (
        <div className="py-16 text-center text-sm text-slate-500">
          We could not load your requests right now. Please try again in a moment.
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {filter === "all"
              ? "No service requests on your account yet"
              : `No ${SERVICE_LABELS[filter]} requests on your account`}
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Requests you submit from any journey or from the standalone service pages will show
            up here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <h3 className="text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-300">
                {group.label}
              </h3>
              {group.isCurrent && (
                <span className="rounded-full bg-[#0d7377]/10 px-2 py-0.5 text-[10px] font-bold text-[#0d7377] dark:text-teal-300">
                  You are here
                </span>
              )}
            </div>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = SERVICE_ICONS[item.service];
                return (
                  <button
                    key={`${item.service}:${item.id}`}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 text-left transition-all hover:border-[#0d7377]/40 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-xs dark:bg-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {item.serviceLabel}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <StatusBadge item={item} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderDetail = (item: ServiceRequestItem) => {
    const Icon = SERVICE_ICONS[item.service];
    const inCurrent = isRequestInCurrentJourney(item, current);
    const { kind, journeyHref, label } = item.context;

    let whereNote: string;
    if (inCurrent) {
      whereNote = "This request belongs to the journey you are viewing right now.";
    } else if (kind === "journey" || kind === "candidate") {
      whereNote =
        "This request was made under a different journey, which is why it does not appear in the one you are viewing.";
    } else if (kind === "standalone") {
      whereNote =
        "This request was made from the standalone service page, so it is listed in My Resources instead of inside a journey.";
    } else {
      whereNote = "Consultations are booked for your whole account, not for a single journey.";
    }

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {item.serviceLabel}
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
          </div>
          <StatusBadge item={item} />
        </div>

        {/* Where this request lives - the whole point of this modal */}
        <div className="rounded-2xl border border-[#0d7377]/20 bg-[#0d7377]/5 p-4">
          <p className="text-[11px] font-bold tracking-wide text-[#0d7377] uppercase dark:text-teal-300">
            Filed under
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{whereNote}</p>
        </div>

        {item.details.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2 dark:border-slate-800">
            {item.details.map((d) => (
              <div key={d.label} className="min-w-0">
                <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {d.label}
                </dt>
                <dd className="text-sm break-words text-slate-900 dark:text-slate-100">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {item.userNotes && (
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <p className="mb-1 font-bold">Your notes</p>
            <p className="whitespace-pre-line">{item.userNotes}</p>
          </div>
        )}

        {item.adminNotes && (
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-xs text-slate-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-slate-300">
            <p className="mb-1 font-bold text-teal-800 dark:text-teal-300">Message from our team</p>
            <p className="whitespace-pre-line">{item.adminNotes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {inCurrent ? (
            <button
              type="button"
              onClick={() => openHere(item)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0d7377] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#095457]"
            >
              Open in this journey
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            journeyHref && (
              <button
                type="button"
                onClick={() => goToJourney(item)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0d7377] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#095457]"
              >
                Go to {item.context.category} journey
                <ArrowRight className="h-4 w-4" />
              </button>
            )
          )}
          {item.manageHref && (
            <a
              href={item.manageHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Manage request
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  };

  const content = (
    <div className="fixed inset-0 z-[100001] overflow-y-auto overscroll-contain">
      <div
        className="animate-in fade-in fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onClose}
      />
      {/* Padding + card max-h must total <= 100dvh, otherwise the overlay itself scrolls a little */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="My Requests"
          className="animate-in zoom-in-95 relative z-10 flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl duration-200 dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-3">
              {selected && (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Back to all requests"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-slate-100">
                  {selected ? "Request details" : "My Requests"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selected
                    ? "See exactly where this request was filed."
                    : "Every request on your account, across all journeys and candidates."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Service filter */}
          {!selected && (
            <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === f.id
                      ? "bg-[#0d7377] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#0d7377]/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
            {selected ? renderDetail(selected) : renderList()}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
