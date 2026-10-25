"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, X, Shield, Lock } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type Journey = "IR-1" | "IR-5" | "IR-2" | "CR-1" | string;

export interface WalletCase {
  id: string;
  journey: Journey;
  /** "Spouse" | "Parent" | "Child" | etc. */
  journeyLabel: string;
  /** "Candidate 1", "Candidate 2", ... */
  name: string;
  /** "Mother", "Father", or the candidate's real name */
  role?: string;
}

export type PortalStatus = Record<"USCIS" | "NVC" | "COURIER", boolean>;

/* -------------------------------------------------------------------------- */
/*  Card colours                                                              */
/* -------------------------------------------------------------------------- */

type Tone = readonly [string, string];

const TONES: Record<string, Tone> = {
  teal: ["#0f5a60", "#0a3a3f"],
  navy: ["#2a3a78", "#162049"],
  wine: ["#722846", "#47172c"],
  pine: ["#27594a", "#153a2f"],
  ink: ["#47536a", "#262e3e"],
};

const IR5_ORDER = ["navy", "wine", "pine", "ink"];

/** IR-1/CR-1 is always teal. Other candidates take the next colour in order. */
export function buildToneMap(cases: WalletCase[]): Record<string, Tone> {
  const map: Record<string, Tone> = {};
  let ir5 = 0;
  cases.forEach((c) => {
    if (c.journey === "IR-1" || c.journey === "CR-1") {
      map[c.id] = TONES.teal;
    } else {
      map[c.id] = TONES[IR5_ORDER[ir5 % IR5_ORDER.length]];
      ir5 += 1;
    }
  });
  return map;
}

export const toneGradient = (t: Tone) => `linear-gradient(140deg, ${t[0]}, ${t[1]})`;

/* -------------------------------------------------------------------------- */
/*  Geometry                                                                  */
/* -------------------------------------------------------------------------- */

const PEEK = 34; // visible strip height of a back card
const PEEK_TIGHT = 30; // used when there are more than 4 cards
const VISIBLE = 136; // how much of the front card shows above the pocket
const POCKET = 232; // pocket height
const CARD_H = 190;

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .32 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const PORTAL_LABELS: { key: keyof PortalStatus; label: string }[] = [
  { key: "USCIS", label: "USCIS" },
  { key: "NVC", label: "NVC" },
  { key: "COURIER", label: "Courier" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface WalletSwitcherProps {
  open: boolean;
  onClose: () => void;
  cases: WalletCase[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Saved-portal status for the ACTIVE case. Pass null while it is loading. */
  portalStatus?: PortalStatus | null;
  /** Saved-portal status map for each candidate card */
  statusByCase?: Record<string, PortalStatus>;
}

const WalletSwitcher: React.FC<WalletSwitcherProps> = ({
  open,
  onClose,
  cases,
  activeId,
  onSelect,
  portalStatus,
  statusByCase,
}) => {
  const [front, setFront] = useState<string | null>(activeId);
  const [pull, setPull] = useState(false);
  const [entering, setEntering] = useState(false);
  const timers = useRef<number[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Reset + lock scroll whenever the wallet opens
  useEffect(() => {
    if (!open) {
      clearTimers();
      return;
    }
    setFront(activeId);
    setPull(false);
    setEntering(true);
    later(() => setEntering(false), 1000);
    dialogRef.current?.focus({ preventScroll: true });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => clearTimers, []);

  const n = cases.length;
  const tones = useMemo(() => buildToneMap(cases), [cases]);

  if (n === 0) return null;

  const peek = n - 1 > 3 ? PEEK_TIGHT : PEEK;
  const top = (n - 1) * peek + VISIBLE;
  const frontId = front && cases.some((c) => c.id === front) ? front : cases[0].id;

  // Everyone else keeps their order; the front card goes last (bottom of the stack).
  const order = [...cases.filter((c) => c.id !== frontId), ...cases.filter((c) => c.id === frontId)];

  const countByJourney = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.journey] = (acc[c.journey] || 0) + 1;
    return acc;
  }, {});

  const pullAndClose = () => {
    setPull(true);
    later(() => {
      onClose();
      setPull(false);
    }, 380);
  };

  const handlePick = (id: string) => {
    if (id === frontId) {
      pullAndClose();
      return;
    }
    setFront(id);
    onSelect(id);
    later(pullAndClose, 480);
  };

  const cardStatus = statusByCase?.[frontId] || (frontId === activeId ? portalStatus : null);
  const showTicks = !!cardStatus;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Choose whose credentials to view"
      aria-hidden={!open}
      tabIndex={-1}
      onClick={(e) => {
        const el = e.target as HTMLElement;
        if (e.target === e.currentTarget || el.dataset.dismiss) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        padding: "24px 0",
        outline: "none",
        background: "radial-gradient(ellipse at 50% 35%, rgba(22,40,64,.82), rgba(7,12,22,.9))",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        opacity: open ? 1 : 0,
        visibility: open ? "visible" : "hidden",
        transition: `opacity .25s, visibility 0s ${open ? "0s" : ".3s"}`,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "fixed",
          top: 14,
          right: 16,
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: 0,
          background: "rgba(255,255,255,.14)",
          color: "#fff",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        <X size={16} />
      </button>

      <div
        data-dismiss="1"
        style={{
          width: "min(360px, 90vw)",
          textAlign: "center",
          margin: "auto",
          transform: open ? "none" : "translateY(34px) scale(.94)",
          transition: "transform .55s cubic-bezier(.25,.9,.3,1)",
        }}
      >
        <div data-dismiss="1" style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>
          Whose credentials?
        </div>
        <div
          data-dismiss="1"
          style={{ color: "rgba(255,255,255,.62)", fontSize: 13, margin: "2px 0 22px" }}
        >
          Tap a card to open their portal logins.
        </div>

        {/* ----------------------------- the wallet ----------------------------- */}
        <div style={{ position: "relative", height: top + POCKET }}>
          {/* back panel */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              top: top - 34,
              borderRadius: 26,
              background: `${NOISE}, linear-gradient(180deg,#6b4224,#4a2c16)`,
              boxShadow: "inset 0 2px 0 rgba(255,255,255,.16), 0 26px 44px rgba(0,0,0,.55)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 4,
                border: "1.5px dashed rgba(255,236,200,.5)",
                borderRadius: 22,
              }}
            />
          </div>

          {/* cards */}
          <div style={{ position: "absolute", left: 24, right: 24, top: 0, bottom: 0 }}>
            {cases.map((c) => {
              const pos = order.findIndex((o) => o.id === c.id);
              const isFront = c.id === frontId;
              const inset = Math.min((n - 1 - pos) * 6, 24);
              const closedOffset = top - pos * peek + 16;
              const transform = !open
                ? `translateY(${closedOffset}px)`
                : isFront && pull
                  ? "translateY(-34px)"
                  : "translateY(0)";
              const delay = entering ? pos * 65 + 220 : 0;
              const stripLabel = `${c.journey} (${c.journeyLabel}) · ${c.name}`;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePick(c.id)}
                  aria-label={`${c.journey} ${c.name}${c.role ? `, ${c.role}` : ""}`}
                  tabIndex={open ? 0 : -1}
                  style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "stretch",
                    top: pos * peek,
                    left: inset,
                    right: inset,
                    height: CARD_H,
                    zIndex: pos + 1,
                    padding: 0,
                    border: 0,
                    borderRadius: 20,
                    overflow: "hidden",
                    textAlign: "left",
                    color: "#fff",
                    cursor: "pointer",
                    background: toneGradient(tones[c.id]),
                    boxShadow: "0 -3px 10px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.1)",
                    transform,
                    transition: `top .45s cubic-bezier(.3,.8,.3,1), left .45s, right .45s, transform ${
                      pull && isFront ? ".35s" : ".65s"
                    } cubic-bezier(.2,.9,.3,1.08) ${delay}ms`,
                  }}
                >
                  {/* soft glow */}
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      background:
                        "radial-gradient(ellipse 85% 120% at 100% 0%, rgba(255,255,255,.17), rgba(255,255,255,0) 62%)",
                    }}
                  />

                  {isFront ? (
                    <div style={{ position: "relative", padding: "16px 20px" }}>
                      {/* Top: Category: IR-1 · SPOUSE and Gold Chip */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.92)",
                        }}
                      >
                        <span>
                          {c.journey} · {c.journeyLabel}
                        </span>
                        <div
                          aria-hidden
                          style={{
                            width: 28,
                            height: 20,
                            borderRadius: 5,
                            background:
                              "linear-gradient(90deg,#e6c677 0 48%,#bf9a4a 48% 52%,#e6c677 52%)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                          }}
                        />
                      </div>

                      {/* Middle: Candidate 1 (Large bold text) */}
                      <div
                        style={{
                          marginTop: 18,
                          fontSize: 27,
                          fontWeight: 800,
                          color: "#ffffff",
                          letterSpacing: "-0.01em",
                          lineHeight: 1.15,
                        }}
                      >
                        {c.name}
                      </div>

                      {/* Bottom row: ✓ USCIS  ✓ NVC  ✓ Courier */}
                      <div
                        style={{
                          marginTop: 22,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 13,
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#ffffff",
                          }}
                        >
                          {PORTAL_LABELS.map((p) => {
                            const thisCardStatus = statusByCase?.[c.id] || (c.id === activeId ? portalStatus : null);
                            const isSaved = thisCardStatus ? thisCardStatus[p.key] : false;
                            const hasStatus = !!thisCardStatus;
                            return (
                              <span
                                key={p.key}
                                style={{
                                  opacity: hasStatus ? (isSaved ? 1 : 0.45) : 0.85,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                {hasStatus && isSaved ? "✓ " : "+ "}
                                {p.label}
                              </span>
                            );
                          })}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          <span>{c.role || c.journeyLabel}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        position: "relative",
                        height: peek,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#bcc4d0",
                        whiteSpace: "nowrap",
                        letterSpacing: ".02em",
                      }}
                    >
                      {stripLabel}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* shadow the pocket casts on the cards */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              top: top - 18,
              height: 18,
              zIndex: 99,
              pointerEvents: "none",
              background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.38))",
            }}
          />

          {/* front pocket */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              bottom: 8,
              height: POCKET - 8,
              zIndex: 100,
              pointerEvents: "none",
              borderRadius: "16px 16px 20px 20px",
              background: `${NOISE}, linear-gradient(180deg,#b57d49,#9a6438 40%,#85532f)`,
              boxShadow: "inset 0 2px 0 rgba(255,255,255,.22)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 9,
                border: "1.6px dashed rgba(255,240,210,.62)",
                borderRadius: "11px 11px 15px 15px",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,241,218,.95)",
                filter: "drop-shadow(0 1px 1.5px rgba(45,20,6,.6))",
              }}
            >
              <ShieldCheck size={34} strokeWidth={1.6} />
            </div>
          </div>
        </div>

        {/* floor shadow */}
        <div
          aria-hidden
          style={{
            width: "72%",
            height: 20,
            margin: "22px auto 0",
            background: "radial-gradient(ellipse, rgba(0,0,0,.5), transparent 70%)",
          }}
        />
      </div>
    </div>
  );
};

export default WalletSwitcher;