"use client";

/**
 * ServiceSkinShell - the shared visual shell for the four Rahvana services
 * (Expert consultation, Medical appointment, Police verification, Document translation).
 *
 * Presentational only. Each tool keeps its own state, validation, submit and payment
 * logic; it hands this shell the step labels + the current index and renders its
 * existing step content as children. The shell never changes which step is active
 * except through the optional `onStepSelect` callback (going back to a finished step).
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ClipboardList, Lock } from "lucide-react";
import {
  SERVICE_ORDER,
  SERVICE_ROUTES,
  SERVICE_SWITCH_LABELS,
  useServiceSwitcher,
} from "./ServiceSwitcherContext";
import "./service-skin.css";

// Fonts load from Google Fonts in the browser (allowed by the CSP, same as the site's
// main font). next/font is not used here: it downloads at build time and silently fell
// back to a substitute serif when that download failed.
const SKIN_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;1,500;1,600&display=swap";

export type ServiceSkinKey = "consult" | "medical" | "police" | "translate";

/** Full names, used in the switch confirmation. */
const SERVICE_NAMES: Record<ServiceSkinKey, string> = {
  consult: "Expert consultation",
  medical: "Medical appointment",
  police: "Police verification",
  translate: "Document translation",
};

/** Short label above the service name in the left pane. */
const SERVICE_EYEBROW: Record<ServiceSkinKey, string> = {
  consult: "30-minute expert session",
  medical: "Panel physician exam",
  police: "PCC filing, Sindh",
  translate: "Certified Urdu to English",
};

export interface ServiceSkinShellProps {
  service: ServiceSkinKey;
  title: string;
  tagline: string;
  /** Step labels shown in the left pane. */
  steps: string[];
  /** 0-based active step. Use -1 for an intro screen shown before step 1. */
  current: number;
  /** Lets the user jump back to a finished step. Omit to keep the list read-only. */
  onStepSelect?: (index: number) => void;
  /** Hide the step counter / list (finished state). */
  done?: boolean;
  /** Main column heading for the current screen. */
  heading?: ReactNode;
  subheading?: ReactNode;
  /** Overrides the "Step x of n" kicker. Pass null to hide it. */
  kicker?: ReactNode | null;
  /** @deprecated Not shown any more (no time estimates); kept so callers compile. */
  timeEstimate?: string;
  faq?: Array<[string, string]>;
  /** Extra content at the bottom of the left pane (e.g. the active-candidate badge). */
  paneFooter?: ReactNode;
  /** Hide the service switcher (e.g. on a "My requests" list, where switching makes no sense). */
  hideSwitcher?: boolean;
  /** Opens the user's requests. Shown as a small icon at the top right of the pane. */
  onRequests?: () => void;
  requestsLabel?: string;
  /** Small controls pinned to the top-right of the main column (quick access, close). */
  topRight?: ReactNode;
  /** page = standalone route, overlay = journey full-screen modal, embedded = inline in a journey. */
  layout?: "page" | "overlay" | "embedded";
  /** Where the pane sticks: height of any sticky header inside the same scroll area. */
  topOffset?: number;
  /** Height taken from the viewport by fixed chrome (site header, overlay top bar). Defaults to topOffset. */
  viewportOffset?: number;
  children: ReactNode;
}

export default function ServiceSkinShell({
  service,
  title,
  tagline,
  steps,
  current,
  onStepSelect,
  done = false,
  heading,
  subheading,
  kicker,
  faq,
  paneFooter,
  onRequests,
  requestsLabel = "My requests",
  hideSwitcher = false,
  topRight,
  layout = "page",
  topOffset = 0,
  viewportOffset,
  children,
}: ServiceSkinShellProps) {
  const [faqOpen, setFaqOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<ServiceSkinKey | null>(null);
  const router = useRouter();
  const switcher = useServiceSwitcher();
  // Journey: only when the container wires a switcher. Standalone pages: always.
  const showSwitcher = !hideSwitcher && (!!switcher || layout === "page");
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!faqOpen && !pendingSwitch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFaqOpen(false);
        setPendingSwitch(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [faqOpen, pendingSwitch]);

  const total = steps.length;

  const goToService = (target: ServiceSkinKey) => {
    setPendingSwitch(null);
    if (switcher) switcher.select(target);
    else router.push(SERVICE_ROUTES[target]);
  };
  const requestSwitch = (target: ServiceSkinKey) => {
    if (target === service) return;
    // Mid-form: confirm first, since the current answers are not kept.
    if (!done && current > 0) setPendingSwitch(target);
    else goToService(target);
  };
  const idx = Math.max(-1, Math.min(current, total - 1));

  // Step count only; no time estimates (product decision).
  const defaultKicker = idx >= 0 && total > 0 ? `Step ${idx + 1} of ${total}` : null;
  const kickerNode = kicker === undefined ? defaultKicker : kicker;

  const style = {
    "--svk-top": `${topOffset}px`,
    "--svk-vh": `${viewportOffset ?? topOffset}px`,
  } as CSSProperties;

  return (
    <div
      className={"svk"}
      data-s={service}
      data-layout={layout}
      style={style}
    >
      <link rel="stylesheet" href={SKIN_FONTS_HREF} precedence="default" />
      <div className="svk-split">
        <aside className="svk-pane" aria-label={`${title} progress`}>
          <div className="svk-head">
            <div className="svk-brand">{SERVICE_EYEBROW[service]}</div>
            <div className="svk-head-actions">
              {onRequests && (
                <button
                  type="button"
                  className="svk-req"
                  onClick={onRequests}
                  aria-label={requestsLabel}
                >
                  <ClipboardList aria-hidden="true" />
                  <span className="svk-req-label" aria-hidden="true">
                    {requestsLabel}
                  </span>
                </button>
              )}
              {faq && faq.length > 0 && (
                <button type="button" className="svk-link svk-faq-m" onClick={() => setFaqOpen(true)}>
                  Common questions
                </button>
              )}
            </div>
          </div>
          <h1 className="svk-title">{title}</h1>
          {/* Phones: the step question sits in the coloured header (see the mobile design). */}
          {heading && !done && (
            <div className="svk-mhead">
              <h2>{heading}</h2>
              {subheading && <p>{subheading}</p>}
            </div>
          )}
          <p className="svk-tag">{tagline}</p>

          {!done && total > 0 && (
            <>
              <ol className="svk-steps">
                {steps.map((label, j) => {
                  const state = j < idx ? "is-done" : j === idx ? "is-on" : "";
                  const dot = (
                    <span className="svk-dot" aria-hidden="true">
                      {j < idx ? "✓" : j + 1}
                    </span>
                  );
                  return (
                    <li key={label + j} className={state} aria-current={j === idx ? "step" : undefined}>
                      {j < idx && onStepSelect ? (
                        <button type="button" onClick={() => onStepSelect(j)}>
                          {dot}
                          <span>
                            {label}
                            <span className="sr-only"> (finished, go back)</span>
                          </span>
                        </button>
                      ) : (
                        <>
                          {dot}
                          <span>{label}</span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          <div className="svk-pfoot">
            {paneFooter}
            {faq && faq.length > 0 && (
              <button type="button" className="svk-link svk-faq-d" onClick={() => setFaqOpen(true)}>
                Common questions
              </button>
            )}
          </div>
        </aside>

        <main className="svk-main">
          {!done && total > 1 && idx >= 0 && (
            <div className="svk-dots" aria-hidden="true">
              {steps.map((label, j) => (
                <i key={label + j} className={j === idx ? "on" : j < idx ? "dn" : undefined} />
              ))}
            </div>
          )}
          {(showSwitcher || topRight) && (
            <div className="svk-topbar">
              {showSwitcher && (
                <nav className="svk-switch" aria-label="Switch service">
                  {SERVICE_ORDER.map((key) => {
                    const locked = switcher?.isLocked?.(key) ?? false;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={key === service}
                        aria-current={key === service ? "page" : undefined}
                        onClick={() => requestSwitch(key)}
                        title={locked ? "Not included in this journey's plan" : undefined}
                      >
                        {SERVICE_SWITCH_LABELS[key]}
                        {locked && <Lock className="svk-switch-lock" aria-label="locked" />}
                      </button>
                    );
                  })}
                </nav>
              )}
              {topRight && <div className="svk-topright">{topRight}</div>}
            </div>
          )}
          <div className="svk-col" key={`${service}-${idx}-${done ? "done" : ""}`}>
            {kickerNode && !done && <div className="svk-kick">{kickerNode}</div>}
            {heading && <h2 className="svk-h2">{heading}</h2>}
            {subheading && <p className="svk-sub">{subheading}</p>}

            <div className="svk-body">{children}</div>
          </div>
        </main>
      </div>

      {mounted &&
        pendingSwitch &&
        createPortal(
          <div className={"svk"} data-s={service} style={{ background: "none" }}>
            <div className="svk-scrim" onClick={() => setPendingSwitch(null)} />
            <div className="svk-confirm" role="alertdialog" aria-modal="true" aria-labelledby="svk-confirm-h">
              <h2 id="svk-confirm-h">Switch to {SERVICE_NAMES[pendingSwitch]}?</h2>
              <p>The answers you have entered in this form will not be kept.</p>
              <div className="svk-confirm-actions">
                <button type="button" className="svk-btn svk-btn-gho" onClick={() => setPendingSwitch(null)} autoFocus>
                  Stay here
                </button>
                <button type="button" className="svk-btn svk-btn-pri" onClick={() => goToService(pendingSwitch)}>
                  Switch service
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {mounted &&
        faqOpen &&
        faq &&
        createPortal(
          <div className={"svk"} data-s={service} style={{ background: "none" }}>
            <div className="svk-scrim" onClick={() => setFaqOpen(false)} />
            <div className="svk-drawer" role="dialog" aria-modal="true" aria-label="Common questions">
              <button type="button" className="svk-close" onClick={() => setFaqOpen(false)} autoFocus>
                {"✕"} Close
              </button>
              <h2>Common questions</h2>
              {faq.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/** Done state body: animated tick + heading, used by tools that have no success screen of their own. */
export function ServiceSkinTick() {
  return (
    <svg className="svk-ok" viewBox="0 0 84 84" aria-hidden="true">
      <circle cx="42" cy="42" r="38" />
      <path d="M26 43l11 11 21-23" />
    </svg>
  );
}
