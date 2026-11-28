"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ChevronDown, Loader2, LogOut, RefreshCw, Shield, MonitorSmartphone } from "lucide-react";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useAuth } from "@/app/context/AuthContext";
import Pagination from "@/components/ui/pagination";

type SecuritySession = {
  id: string;
  deviceName: string;
  browser: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

type ActivityEvent = {
  id: string;
  eventType: string;
  failureReason: string | null;
  deviceName: string;
  browser: string;
  createdAt: string;
};

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);

  return typeof body?.error === "string" ? body.error : fallback;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function eventLabel(event: ActivityEvent): string {
  if (event.eventType === "login_failure") {
    return `Failed sign-in${
      event.failureReason ? ` (${event.failureReason.replace(/_/g, " ")})` : ""
    }`;
  }

  const labels: Record<string, string> = {
    login_success: "Successful sign-in",
    session_revoked: "Session signed out",
    logout: "Signed out of all devices",
    password_changed: "Password changed",
    mfa_enabled: "Two-factor authentication enabled",
    mfa_disabled: "Two-factor authentication disabled",
  };

  return labels[event.eventType] ?? "Account security event";
}

type CollapsibleSectionProps = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  id,
  title,
  description,
  icon,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`${id}-content`}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-slate-100/70 sm:p-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 shrink-0 text-[#0d7377]">{icon}</span>

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>

        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ease-in-out ${
            expanded ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <div
        id={`${id}-content`}
        aria-hidden={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`border-t border-slate-200 px-4 pt-3 pb-4 transition-transform duration-300 ease-in-out motion-reduce:transition-none sm:px-5 sm:pb-5 ${
              expanded ? "translate-y-0" : "-translate-y-2"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SecuritySessionsPanel() {
  const router = useRouter();
  const { showToast } = useToast();
  const { signOutAll } = useAuth();

  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const PAGE_SIZE = 25;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [eventsError, setEventsError] = useState("");

  // Both sections are collapsed initially.
  const [sessionsExpanded, setSessionsExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const [selectedSession, setSelectedSession] = useState<SecuritySession | null>(null);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);

  const [revoking, setRevoking] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError("");

    try {
      const response = await fetch("/api/security/sessions", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to load sessions."));
      }

      const body = (await response.json()) as {
        sessions: SecuritySession[];
      };

      setSessions(body.sessions);
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : "Unable to load sessions.");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async (offset: number) => {
    setEventsLoading(true);
    setEventsError("");

    try {
      const response = await fetch(`/api/security/login-activity?offset=${offset}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to load activity."));
      }

      const body = (await response.json()) as {
        events: ActivityEvent[];
        totalItems: number;
      };

      setEvents(body.events);
      setTotalItems(body.totalItems);
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : "Unable to load activity.");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    void loadSessions();
    void loadEvents(0);
  }, [loadEvents, loadSessions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep the current session active and refresh it when a tab becomes visible.
  useEffect(() => {
    const heartbeat = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch("/api/security/sessions/current", {
          method: "POST",
        });

        if (response.status === 401) {
          router.replace("/login");
        } else if (!response.ok) {
          console.error("[security-panel] session heartbeat failed:", response.status);
        }
      } catch (error) {
        console.error("[security-panel] session heartbeat failed:", error);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void heartbeat();
      }
    };

    const timer = window.setInterval(() => void heartbeat(), 5 * 60 * 1000);

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  const confirmRevokeSession = async () => {
    if (!selectedSession) return;

    setRevoking(true);

    try {
      const response = await fetch(
        `/api/security/sessions/${encodeURIComponent(selectedSession.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to revoke session."));
      }

      const body = (await response.json()) as { isCurrent: boolean };

      setSelectedSession(null);

      if (body.isCurrent) {
        router.replace("/login");
        return;
      }

      showToast("Device signed out.", "success");
      refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to revoke session.", "error");
    } finally {
      setRevoking(false);
    }
  };

  const confirmSignOutAll = async () => {
    setSigningOutAll(true);

    try {
      await signOutAll();
      setSignOutAllOpen(false);
      window.location.assign("/login");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to sign out all devices.",
        "error"
      );
    } finally {
      setSigningOutAll(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_24px_rgba(15,61,63,0.04)] sm:p-6">
      {/* Main container header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#0d7377]" />

          <div>
            <h3 className="text-base font-bold text-slate-900">Security &amp; Sessions</h3>
            <p className="mt-1 text-sm text-slate-500">
              Manage devices and review recent account activity.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          aria-label="Refresh security information"
          title="Refresh"
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <RefreshCw
            className={`h-4 w-4 ${sessionsLoading || eventsLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="space-y-3">
        {/* Active Sessions */}
        <CollapsibleSection
          id="active-sessions"
          title="Active Sessions"
          description="Devices currently able to access your account."
          icon={<MonitorSmartphone className="h-5 w-5" />}
          expanded={sessionsExpanded}
          onToggle={() => setSessionsExpanded((value) => !value)}
        >
          {sessionsLoading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading sessions…
            </p>
          ) : sessionsError ? (
            <div role="alert" className="text-sm text-rose-600">
              <p>{sessionsError}</p>
              <button
                type="button"
                onClick={() => void loadSessions()}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500">No active sessions are registered.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-col gap-3 py-4 first:pt-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <Shield className="mt-1 h-5 w-5 shrink-0 text-[#0d7377]" />

                    <div>
                      <p className="font-semibold text-slate-900">
                        {session.deviceName} · {session.browser}
                        {session.isCurrent && (
                          <span className="ml-2 inline-block rounded-full bg-[#0d7377]/10 px-2 py-0.5 text-xs font-bold text-[#0d7377]">
                            This device
                          </span>
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Last active {formatDate(session.lastActiveAt)} · Signed in{" "}
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSession(session)}
                    className="self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 sm:self-auto"
                  >
                    Sign out
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Sign out all devices uses the existing /api/auth/signout route */}
          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setSignOutAllOpen(true)}
              disabled={signingOutAll || sessionsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out all devices
            </button>

            <p className="mt-2 text-xs text-slate-500">
              This will sign you out on this device and all other devices.
            </p>
          </div>
        </CollapsibleSection>

        {/* Login Activity */}
        <CollapsibleSection
          id="login-activity"
          title="Login Activity"
          description="Recent sign-ins and account security changes."
          icon={<Activity className="h-5 w-5" />}
          expanded={activityExpanded}
          onToggle={() => setActivityExpanded((value) => !value)}
        >
          {eventsError && (
            <div role="alert" className="mb-3 text-sm text-rose-600">
              <p>{eventsError}</p>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  void loadEvents(0);
                }}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

{eventsLoading && events.length > 0 && (
  <p className="mb-3 flex items-center gap-2 text-xs text-slate-500">
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
    Refreshing activity…
  </p>
)}

          {events.length === 0 && eventsLoading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activity…
            </p>
          ) : events.length === 0 && !eventsError ? (
            <p className="text-sm text-slate-500">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {events.map((event) => (
                <li key={event.id} className="py-3 first:pt-1">
                  <p className="text-sm font-semibold text-slate-800">{eventLabel(event)}</p>

                  <p className="mt-1 text-xs text-slate-500">
                    {event.deviceName} · {event.browser} · {formatDate(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {totalItems > PAGE_SIZE && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(page) => {
                setCurrentPage(page);
                void loadEvents((page - 1) * PAGE_SIZE);
              }}
            />
          )}
        </CollapsibleSection>
      </div>

      {/* Individual session confirmation */}
      <ConfirmationModal
        open={selectedSession !== null}
        onOpenChange={(open) => {
          if (!open && !revoking) {
            setSelectedSession(null);
          }
        }}
        title="Sign out this device?"
        description={`This device will lose access to your Rahvana account. ${
          selectedSession?.isCurrent ? "You will be signed out here too." : ""
        }`}
        cancelText="Cancel"
        confirmText="Sign out"
        confirmVariant="danger"
        loading={revoking}
        onConfirm={confirmRevokeSession}
      />

      {/* Global sign-out confirmation */}
      <ConfirmationModal
        open={signOutAllOpen}
        onOpenChange={(open) => {
          if (!open && !signingOutAll) {
            setSignOutAllOpen(false);
          }
        }}
        title="Sign out all devices?"
        description="This will revoke your registered sessions and sign you out of Rahvana on this device and all other devices. You will need to sign in again."
        cancelText="Cancel"
        confirmText="Sign out all"
        confirmVariant="danger"
        loading={signingOutAll}
        onConfirm={confirmSignOutAll}
      />
    </div>
  );
}
