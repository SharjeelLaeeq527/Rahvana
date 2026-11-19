"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Inter } from "next/font/google";
import type { DashboardAlert } from "@/lib/journey/dashboard/types";
import { formatDay } from "@/lib/journey/dashboard/buildDashboardModel";
import type { DashboardSkinProps } from "../JourneyDashboard";
import { GROUP_ICON, Icon, type IconName } from "../icons";
import { JourneyLine } from "./JourneyLine";
import { TrackingTicket } from "./TrackingTicket";
import { CalendarCard } from "./CalendarCard";
import { NotesModal, NotesTab, useUndoNote } from "./NotesWidgets";
import { AlertsDrawer, alertsHeadline } from "./AlertsDrawer";
import { FavouritesFan } from "./FavouritesFan";
import { CHAPTER_COLORS } from "./palette";
import "./desktop.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap" });

const FRAME_W = 1340;
/** A narrow window lays the board out down to this width instead of shrinking the type. */
const FRAME_MIN_W = 1180;
/**
 * A scaled-down board may also grow wider than FRAME_W to use spare screen
 * width, but only in proportion to its height (frame width <= height x
 * MAX_ASPECT, design is ~1.5) and never past FRAME_MAX_W, so it keeps its
 * shape instead of turning into a long flat strip.
 */
const FRAME_MAX_W = 1520;
const MAX_ASPECT = 2.4;
const FRAME_CHROME = 42; // frame padding + border around the board
const BOARD_MAX = 838;
const BOARD_MIN = 780;
/** Never scale the board below this (readability on small laptops). */
const ZOOM_FLOOR = 0.82;
/** Last resort on very short screens: scale below ZOOM_FLOOR rather than make the page scroll. */
const ZOOM_MIN_FIT = 0.6;
/** Below this board height the compact layout switches on. */
const COMPACT_BELOW = 760;
/** Below this board height the tight layout (smaller rows and type again) switches on. */
const TIGHT_BELOW = 650;
/** Shortest board the tight layout is designed for. */
const BOARD_MIN_TIGHT = 570;

// ── Layout preferences (per journey, this browser only) ─────────────────────
type RowId = "strength" | "mid" | "toolbox";
type ColId = "tracking" | "calendar";
type WidgetId = "strength" | "tracking" | "calendar" | "toolbox";
interface Layout {
  rows: RowId[];
  cols: ColId[];
  hidden: WidgetId[];
}
const DEFAULT_LAYOUT: Layout = { rows: ["strength", "mid", "toolbox"], cols: ["tracking", "calendar"], hidden: [] };
/** Liquid colours for a locked chapter (grey, so it never reads as progress). */
const LOCKED_FILL = { a: "#d5dade", m: "#c3c9ce", b: "#b0b7bd" };
const ROW_HEIGHT: Record<RowId, string> = { strength: "208px", mid: "1fr", toolbox: "112px" };
const ROW_HEIGHT_COMPACT: Record<RowId, string> = { strength: "168px", mid: "1fr", toolbox: "92px" };
const ROW_HEIGHT_TIGHT: Record<RowId, string> = { strength: "150px", mid: "1fr", toolbox: "80px" };
const WIDGETS: [WidgetId, string][] = [
  ["strength", "Case strength"],
  ["tracking", "Case tracking"],
  ["calendar", "Calendar"],
  ["toolbox", "Tools and shortcuts"],
];

function readLayout(key: string): Layout {
  try {
    const o = JSON.parse(localStorage.getItem(key) || "null");
    if (!o) return DEFAULT_LAYOUT;
    const rows = Array.isArray(o.rows) && o.rows.length === 3 && DEFAULT_LAYOUT.rows.every((r) => o.rows.includes(r)) ? o.rows : DEFAULT_LAYOUT.rows;
    const cols = Array.isArray(o.cols) && o.cols.length === 2 && DEFAULT_LAYOUT.cols.every((c) => o.cols.includes(c)) ? o.cols : DEFAULT_LAYOUT.cols;
    let hidden: WidgetId[] = Array.isArray(o.hidden) ? o.hidden.filter((h: unknown) => WIDGETS.some(([w]) => w === h)) : [];
    if (hidden.includes("tracking") && hidden.includes("calendar")) hidden = hidden.filter((h) => h !== "calendar");
    return { rows, cols, hidden };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

/**
 * Fit the board to the screen so the dashboard never needs scrolling: fill the
 * width first, then give up a little board height (the hero and middle row
 * absorb it), and only shrink further when the window is really short.
 */
function useFitToScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ zoom: 1, board: BOARD_MAX, width: FRAME_W, compact: false, tight: false });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The fixed site header and the sticky journey header both sit over the
    // page, so the board starts below whichever reaches lower (plus a gap).
    const headers = () =>
      Array.from(document.querySelectorAll<HTMLElement>("header.fixed, [data-journey-header]"));
    const run = () => {
      const flowTop = el.getBoundingClientRect().top + window.scrollY;
      // Only headers pinned near the top of the viewport cover the board.
      const coverBottom = headers().reduce((m, h) => {
        const r = h.getBoundingClientRect();
        return r.height > 0 && r.top < 200 ? Math.max(m, r.bottom) : m;
      }, 0);
      const top = Math.max(flowTop, coverBottom + 12);
      const availH = Math.max(320, window.innerHeight - top - 16);
      const cw = el.clientWidth;
      // 1. Fill the width (never wider than the design scale allows). A narrow
      //    window lays the board out narrower instead of shrinking the type.
      let zoom = Math.min(1.3, cw / FRAME_W);
      if (zoom < ZOOM_FLOOR) zoom = Math.min(ZOOM_FLOOR, cw / FRAME_MIN_W);
      let board = availH / zoom - FRAME_CHROME;
      // 2. Too short: scale down a little, but never below ZOOM_FLOOR.
      if (board < BOARD_MIN) {
        zoom = Math.max(Math.min(ZOOM_FLOOR, zoom), Math.min(zoom, availH / (BOARD_MIN + FRAME_CHROME)));
        board = availH / zoom - FRAME_CHROME;
      }
      // 3. Still short: the compact, then tight, layout absorbs it (smaller
      //    type and rows) before anything shrinks further.
      board = Math.max(BOARD_MIN_TIGHT, Math.min(BOARD_MAX, board));
      // 4. Even the tight board is taller than the screen: the board must stay
      //    one view (no page scroll), so scale it below ZOOM_FLOOR to fit.
      if ((board + FRAME_CHROME) * zoom > availH) zoom = Math.max(ZOOM_MIN_FIT, availH / (board + FRAME_CHROME));
      // 5. Scaled down: use spare screen width, but only in proportion to the
      //    board's height so it keeps its shape (see MAX_ASPECT).
      const shapeCap = Math.max(FRAME_W, Math.min(FRAME_MAX_W, (board + FRAME_CHROME) * MAX_ASPECT));
      const width = zoom < 1 ? Math.round(Math.max(FRAME_MIN_W, Math.min(cw / zoom, shapeCap))) : FRAME_W;
      setFit({ zoom, board, width, compact: board < COMPACT_BELOW, tight: board < TIGHT_BELOW });
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    // Header height changes (fonts, banners, candidate badge) move the board.
    headers().forEach((h) => ro.observe(h));
    // The header can settle after the first paint (fade-in, late content).
    const late = window.setTimeout(run, 400);
    window.addEventListener("resize", run);
    return () => {
      ro.disconnect();
      window.clearTimeout(late);
      window.removeEventListener("resize", run);
    };
  }, []);
  return { ref, ...fit };
}

export function DesktopDashboard(props: DashboardSkinProps) {
  const { hero, chapters, path, caseHealth, alerts, tracking, keyDates, groups, personal, actions, nav, journeyId } = props;
  const today = useMemo(() => new Date(), []);
  const { ref: fitRef, zoom, board, width: frameW, compact, tight } = useFitToScreen();
  const [fanOpen, setFanOpen] = useState(false);
  // Community popup: open while set, holding the bubble's position for the grow-in.
  const [commFrom, setCommFrom] = useState<DOMRect | null | undefined>(undefined);
  // Banner pills stay on one line with their full text: show as many as fit.
  const bchRef = useRef<HTMLDivElement>(null);
  const [pillCount, setPillCount] = useState(2);
  // Fresh journey: nothing done yet, so explain why things are empty.
  const fresh = hero.completedSteps === 0;

  const [drawer, setDrawer] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesModal, setNotesModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const undo = useUndoNote(personal);

  const layoutKey = `rv-dash-layout:${journeyId || "default"}`;
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [menuOpen, setMenuOpen] = useState(false);
  const [arrange, setArrange] = useState(false);
  useEffect(() => {
    setLayout(readLayout(layoutKey));
    try {
      setNotesOpen(localStorage.getItem(`rv-dash-notes-open:${journeyId || "default"}`) === "1");
    } catch {
      /* ignore */
    }
  }, [layoutKey, journeyId]);
  const saveLayout = (l: Layout) => {
    setLayout(l);
    try {
      localStorage.setItem(layoutKey, JSON.stringify(l));
    } catch {
      /* ignore */
    }
  };
  const setNotesOpenSaved = (v: boolean) => {
    setNotesOpen(v);
    try {
      localStorage.setItem(`rv-dash-notes-open:${journeyId || "default"}`, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const blocking = alerts.filter((a) => a.level === "blocking");
  const checks = alerts.filter((a) => a.level === "check");
  const openAlerts = (id: string | null = null) => setDrawer({ open: true, id });
  const goAlert = useCallback(
    (a: DashboardAlert) => {
      setDrawer({ open: false, id: null });
      if (a.kind === "score-drop") actions.onOpenCaseAnalysis();
      else actions.onOpenStep(a.chapterIndex, a.stepIndex);
    },
    [actions]
  );

  // ── Arrange (drag rows / swap columns) ────────────────────────────────────
  const drag = useRef<{ kind: "row" | "col"; id: string } | null>(null);
  const [dropHint, setDropHint] = useState<string | null>(null);
  const moveRow = (id: RowId, to: RowId, after: boolean) => {
    if (id === to) return;
    const rows = layout.rows.filter((r) => r !== id);
    const at = rows.indexOf(to) + (after ? 1 : 0);
    rows.splice(at, 0, id);
    saveLayout({ ...layout, rows });
  };
  const swapCols = () => saveLayout({ ...layout, cols: [layout.cols[1], layout.cols[0]] });
  const dragProps = (kind: "row" | "col", id: string) =>
    arrange
      ? {
          onDragOver: (e: React.DragEvent) => {
            const d = drag.current;
            if (!d || d.kind !== kind || d.id === id) return;
            e.preventDefault();
            if (kind === "row") {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setDropHint(`${id}:${e.clientY < r.top + r.height / 2 ? "b" : "a"}`);
            } else setDropHint(`${id}:z`);
          },
          onDragLeave: () => setDropHint(null),
          onDrop: (e: React.DragEvent) => {
            const d = drag.current;
            if (!d || d.kind !== kind || d.id === id) return;
            e.preventDefault();
            if (kind === "row") {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              moveRow(d.id as RowId, id as RowId, e.clientY >= r.top + r.height / 2);
            } else swapCols();
            drag.current = null;
            setDropHint(null);
          },
        }
      : {};
  const handle = (kind: "row" | "col", id: string) =>
    arrange ? (
      <button
        type="button"
        className="gh"
        draggable
        aria-label={kind === "col" ? "Move widget. Arrow left or right swaps it." : "Move widget. Arrow up or down moves it."}
        onDragStart={(e) => {
          drag.current = { kind, id };
          e.dataTransfer.effectAllowed = "move";
          try {
            e.dataTransfer.setData("text/plain", id);
          } catch {
            /* ignore */
          }
        }}
        onDragEnd={() => {
          drag.current = null;
          setDropHint(null);
        }}
        onKeyDown={(e) => {
          if (kind === "col" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            e.preventDefault();
            swapCols();
          } else if (kind === "row" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            const visible = layout.rows.filter((r) => isRowVisible(r));
            const i = visible.indexOf(id as RowId);
            const j = e.key === "ArrowUp" ? i - 1 : i + 1;
            if (j >= 0 && j < visible.length) moveRow(id as RowId, visible[j], e.key === "ArrowDown");
          }
        }}
      >
        <i />
      </button>
    ) : null;
  const hintClass = (id: string) =>
    dropHint === `${id}:b` ? " dzb" : dropHint === `${id}:a` ? " dza" : dropHint === `${id}:z` ? " dz" : "";

  const hidden = new Set(layout.hidden);
  const isRowVisible = (r: RowId) => (r === "mid" ? true : !hidden.has(r));
  const visibleRows = layout.rows.filter(isRowVisible);
  const visibleCols = layout.cols.filter((c) => !hidden.has(c));

  // ── Hero ────────────────────────────────────────────────────────────────
  const iv = hero.interview;
  const primaryLabel = hero.readOnly
    ? "Journey is read-only"
    : !hero.next
      ? "Journey complete"
      : hero.upgradeRequired
        ? "Upgrade to continue"
        : "Continue";

  const groupCount = (id: string) => groups.find((g) => g.id === id)?.items.length ?? 0;
  const quick: { label: string; icon: IconName; color: string; onClick: () => void }[] = [
    { label: "My requests", icon: "chat", color: "#b4405a", onClick: nav.openRequests },
    { label: "Favourites", icon: "heart", color: "#d89a45", onClick: nav.openFavourites },
    { label: "Doc Vault", icon: "vault", color: "#0a5a5d", onClick: nav.openVault },
    { label: "Portal wallet", icon: "wallet", color: "#3b62a0", onClick: nav.openWallet },
  ];

  const ch = caseHealth;
  const zoneIdx = ch.band === "weak" ? 0 : ch.band === "moderate" ? 1 : 2;
  const meter = [
    { w: 40, fill: ch.notStarted ? 0 : Math.min(100, (ch.score / 40) * 100), c: "#e9a3b2" },
    { w: 30, fill: ch.notStarted ? 0 : Math.max(0, Math.min(100, ((ch.score - 40) / 30) * 100)), c: "#f2c9a0" },
    { w: 30, fill: ch.notStarted ? 0 : Math.max(0, Math.min(100, ((ch.score - 70) / 30) * 100)), c: "var(--t2)" },
  ];
  const factorColor: Record<string, string> = { evidence: "#0d9488", consistency: "#3b62a0", completeness: "#6b4f93", risk: "#b4405a" };

  const rowEl: Record<RowId, React.ReactNode> = {
    strength: (
      <div key="strength" className={`srow u${notesOpen ? " open" : ""}${hintClass("strength")}`} {...dragProps("row", "strength")}>
        {handle("row", "strength")}
        <section className={`card sg${ch.locked ? " lkd" : ""}`}>
          <div>
            <div className="sgh">
              <div className="eb">Case strength</div>
              <button type="button" className="sgl" onClick={actions.onOpenCaseAnalysis}>
                {ch.locked && <Icon n="lock" size={11} />}
                Analysis <Icon n="chev" size={11} />
              </button>
            </div>
            <div className="sc" aria-hidden={ch.locked || undefined}>
              <b>{ch.notStarted ? "--" : ch.score}</b>
              <span className="scx">
                <span>out of 100</span>
                {ch.notStarted ? (
                  <span className="sxs">Shows once you finish a step and add a document</span>
                ) : (
                  <span className="chipx">{ch.label}</span>
                )}
              </span>
            </div>
            {!ch.notStarted && (
              <>
                <div className="mt" aria-hidden="true">
                  {meter.map((z, i) => (
                    <div key={i} style={{ flex: z.w }}>
                      <i style={{ width: `${z.fill}%`, background: z.c }} />
                    </div>
                  ))}
                </div>
                <div className="zl">
                  {["Weak", "Moderate", "Strong"].map((z, i) => (
                    <span key={z} style={{ flex: [40, 30, 30][i] }} className={i === zoneIdx ? "on" : ""}>
                      {z}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div className="sq">
              <button type="button" onClick={actions.onOpenEvidenceQuestions}>
                Evidence questions <em>{ch.evidenceQuestions.answered}/{ch.evidenceQuestions.total}</em>
              </button>
              <button type="button" onClick={actions.onOpenConsistencyQuestions}>
                Consistency check <em>{ch.consistencyQuestions.answered}/{ch.consistencyQuestions.total}</em>
              </button>
            </div>
          </div>
          <div className="sb" style={{ gridTemplateColumns: `repeat(${ch.factors.length},1fr)` }}>
            {ch.locked && (
              <button type="button" className="sgk" onClick={actions.onOpenCaseAnalysis}>
                <Icon n="lock" size={16} />
                <b>Your case strength score is on Premium</b>
                <span>See your score, what makes it up and how to raise it.</span>
                <em>
                  Upgrade <Icon n="arrow" size={12} />
                </em>
              </button>
            )}
            {ch.factors.map((f) => {
              const risk = f.key === "risk";
              const pct = ch.notStarted ? 0 : f.value / 100;
              return (
                <button type="button" key={f.key} className="mc" onClick={actions.onOpenCaseAnalysis} tabIndex={ch.locked ? -1 : undefined} aria-hidden={ch.locked || undefined}>
                  <small>{f.label}</small>
                  <b style={risk && f.value > 0 && !ch.notStarted ? { color: "var(--roseD)" } : undefined}>
                    {ch.notStarted ? "--" : f.value}
                    <span>/100</span>
                  </b>
                  <div className="vt">
                    {Array.from({ length: 12 }, (_, i) => (
                      <i key={i}>
                        <u style={{ height: i < Math.round(pct * 12) ? "100%" : 0, background: factorColor[f.key] }} />
                      </i>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
        <NotesTab
          personal={personal}
          open={notesOpen}
          setOpen={setNotesOpenSaved}
          onOpenAll={(id) => setNotesModal({ open: true, id })}
          onRemove={undo.remove}
        />
      </div>
    ),
    mid: (
      <div
        key="mid"
        className={`mid${hintClass("mid")}`}
        style={{
          // Short boards: the calendar (month grid + key dates column) gets the wider share;
          // tracking keeps its extra facts on its back face.
          gridTemplateColumns:
            visibleCols.length === 1
              ? "1fr"
              : compact
                ? visibleCols.map((c) => (c === "calendar" ? "minmax(0, 1.3fr)" : "minmax(0, 1fr)")).join(" ")
                : undefined,
        }}
        {...dragProps("row", "mid")}
      >
        {visibleCols.map((c) =>
          c === "tracking" ? (
            <section key="tracking" className={`card u trk${hintClass("tracking")}`} {...dragProps("col", "tracking")}>
              {handle("col", "tracking")}
              <TrackingTicket tracking={tracking} today={today} uscis={props.uscis} onApTracker={nav.openApTracker} />
            </section>
          ) : (
            <div key="calendar" className={`rcol u${hintClass("calendar")}`} {...dragProps("col", "calendar")}>
              {handle("col", "calendar")}
              <CalendarCard
                keyDates={keyDates}
                today={today}
                onAddEvent={personal.addEvent}
                onDeleteEvent={personal.removeEvent}
                storageKey={`rv-dash-cal-face:${journeyId || "default"}`}
              />
            </div>
          )
        )}
      </div>
    ),
    toolbox: (
      <section key="toolbox" className={`card tb u${hintClass("toolbox")}`} {...dragProps("row", "toolbox")}>
        {handle("row", "toolbox")}
        {groups.map((g, i) => (
          <button key={g.id} type="button" className="fd" style={{ background: ["#e4f3f1", "#e6eefa", "#eee8f6"][i % 3] }} onClick={() => nav.openGroup(g.id)}>
            <div className="r1">
              <span style={{ color: ["#0d7377", "#3b62a0", "#6b4f93"][i % 3] }}>
                <Icon n={GROUP_ICON[g.id] || "grid"} size={20} />
              </span>
              <span className="bd">{groupCount(g.id)}</span>
            </div>
            <b>{g.title}</b>
            <span className="ar">
              <Icon n="arrow" size={14} />
            </span>
          </button>
        ))}
        <nav className="qa" aria-label="Shortcuts">
          {quick.map((q) =>
            q.label === "Favourites" ? (
              <div key={q.label} className="qi-w">
                <button type="button" className={`qi${fanOpen ? " on" : ""}`} aria-expanded={fanOpen} onClick={() => setFanOpen((v) => !v)}>
                  <i style={{ color: q.color }}>
                    <Icon n={q.icon} size={26} />
                  </i>
                  {q.label}
                </button>
                {fanOpen && (
                  <FavouritesFan
                    journeyId={journeyId}
                    onClose={() => setFanOpen(false)}
                    onLaunch={(key) => {
                      setFanOpen(false);
                      nav.launchTool(key);
                    }}
                    onShowAll={() => {
                      setFanOpen(false);
                      nav.openFavourites();
                    }}
                  />
                )}
              </div>
            ) : (
              <button key={q.label} type="button" className="qi" onClick={q.onClick}>
                <i style={{ color: q.color }}>
                  <Icon n={q.icon} size={26} />
                </i>
                {q.label}
              </button>
            )
          )}
          {nav.communityUrl && (
            <button
              type="button"
              className="qi cm"
              aria-haspopup="dialog"
              onClick={(e) => setCommFrom(e.currentTarget.querySelector("i")?.getBoundingClientRect() ?? null)}
            >
              <i>
                <GroupIcon size={22} color="#fff" />
              </i>
              Community
            </button>
          )}
        </nav>
      </section>
    ),
  };

  // Reset to two pills when the alerts change, then drop pills until the row fits.
  const alertKey = blocking.map((a) => a.id).join("|");
  useLayoutEffect(() => setPillCount(2), [alertKey, compact, tight]);
  useLayoutEffect(() => {
    const el = bchRef.current;
    if (el && pillCount > 1 && el.scrollWidth > el.clientWidth + 1) setPillCount((c) => c - 1);
  }, [pillCount, alertKey, compact, zoom]);

  return (
    <div ref={fitRef} className={`rvd ${inter.className}`}>
      <div className={`frame${arrange ? " arr" : ""}${compact ? " cmp" : ""}${tight ? " tgt" : ""}`} style={{ zoom, height: board + FRAME_CHROME, width: frameW }}>
        <div className="board" style={{ height: board, width: frameW - 40 }}>
          <section className="card banner">
            <button type="button" className="num" onClick={() => openAlerts()} aria-label="Open the list of things that need you">
              {alerts.length}
            </button>
            <div className="bt">
              <h2>{alerts.length === 0 && fresh ? "Nothing needs you yet" : alertsHeadline(alerts.length)}</h2>
              <p>
                {blocking.length
                  ? "Clear the blocking ones first"
                  : checks.length
                    ? "Nothing is blocking you, a few things to check"
                    : fresh
                      ? "Missing documents and anything else that needs you will show up here as you work through your steps"
                      : "Nothing needs you right now"}
              </p>
            </div>
            <div className="bch" ref={bchRef}>
              {blocking.slice(0, pillCount).map((a, i) => (
                <button key={a.id} type="button" className={`chip${i === 0 ? " d" : ""}`} onClick={() => openAlerts(a.id)}>
                  <small>BLOCKING</small>
                  <span className="ct">{a.title}</span>
                  <Icon n="arrow" size={13} />
                </button>
              ))}
              {alerts.length > Math.min(pillCount, blocking.length) && (
                <button type="button" className="chip k" onClick={() => openAlerts()}>
                  {blocking.length ? `+${alerts.length - Math.min(pillCount, blocking.length)} more` : `${alerts.length} to check`}
                  <Icon n="arrow" size={13} />
                </button>
              )}
            </div>
          </section>

          <div className="main">
            <section className="hero">
              <div className="htop">
                {iv && (
                  <div className="nx">
                    <b>next up</b>
                    <span>
                      Interview {formatDay(iv.date, false)}
                      {iv.time ? `, ${iv.time}` : ""}
                      {", "}
                      <i>{iv.daysLeft}</i> {iv.daysLeft === 1 ? "day" : "days"} to go
                    </span>
                  </div>
                )}
                {hero.next ? (
                  <>
                    <div className="hk">
                      Chapter {hero.next.chapterIndex + 1}, Step {hero.next.stepNumber}
                      {hero.totalSteps > 0 && <span>{hero.completedSteps} of {hero.totalSteps} steps done</span>}
                    </div>
                    <h1 title={hero.next.stepName}>{hero.next.stepName}</h1>
                    {fresh && (
                      <p className="hint">
                        Start here. Your roadmap has {hero.totalSteps} steps across {chapters.length} chapters, and your case
                        strength, tracking and key dates fill in as you complete them.
                      </p>
                    )}
                  </>
                ) : (
                  <h1>Journey complete</h1>
                )}
                <div className="bs">
                  <button
                    type="button"
                    className="btn p g1"
                    disabled={hero.readOnly || !hero.next}
                    onClick={actions.onContinue}
                  >
                    {hero.upgradeRequired && !hero.readOnly && <Icon n="lock" size={16} />}
                    {primaryLabel}
                    {!hero.readOnly && hero.next && !hero.upgradeRequired && <Icon n="arrow" size={16} />}
                  </button>
                  {hero.next?.action && !hero.readOnly && (
                    <button
                      type="button"
                      className="btn"
                      title={hero.next.action.label}
                      onClick={() => {
                        const a = hero.next!.action!;
                        if (a.kind === "tool") nav.launchTool(a.componentKey);
                        else if (a.kind === "link") window.open(a.href, "_blank", "noopener,noreferrer");
                        else actions.onOpenStep(hero.next!.chapterIndex, hero.next!.stepIndex);
                      }}
                    >
                      {hero.next.action.label}
                      {hero.next.action.kind === "link" && <Icon n="ext" size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <JourneyLine chapters={chapters} path={path} onOpenStep={actions.onOpenStep} />

              <div className="th" style={{ gridTemplateColumns: `repeat(${Math.max(1, chapters.length)},1fr)` }}>
                {chapters.map((c, i) => {
                  const pal = CHAPTER_COLORS[i % CHAPTER_COLORS.length];
                  const full = c.status === "done";
                  const pct = c.total ? (c.done / c.total) * 100 : 0;
                  const inner = (
                    <>
                      <small>Chapter {String(c.number).padStart(2, "0")}</small>
                      <h4>{c.title}</h4>
                      <div className="bt2">
                        <span>
                          <strong>{c.done}</strong>
                          <em>/{c.total}</em>
                        </span>
                        <span className="go">{c.status === "locked" ? "Locked" : full ? "Review" : c.status === "current" ? "Continue" : "Open"}</span>
                      </div>
                    </>
                  );
                  return (
                    <button
                      key={c.index}
                      type="button"
                      className={`lq${c.status === "current" ? " cur" : ""}${c.status === "locked" ? " lk" : ""}`}
                      style={{ ["--p" as string]: `${full ? 100 : pct}%`, ["--pf" as string]: full ? 1 : pct / 100 }}
                      disabled={c.status === "locked"}
                      onClick={() => actions.onOpenChapter(c.index)}
                    >
                      <div className="lq-cc">{inner}</div>
                      <div
                        className={`lq-v${full ? " full" : ""}`}
                        style={
                          c.status === "locked"
                            ? { ["--a" as string]: LOCKED_FILL.a, ["--m" as string]: LOCKED_FILL.m, ["--b" as string]: LOCKED_FILL.b }
                            : { ["--a" as string]: pal.la, ["--m" as string]: pal.lm, ["--b" as string]: pal.lb }
                        }
                      >
                        <svg className="lq-wv lq-w2" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
                          <path d={wave(1.6, 4.2, 14)} />
                        </svg>
                        <svg className="lq-wv" viewBox="0 0 400 10" preserveAspectRatio="none" aria-hidden="true">
                          <path d={wave(0, 3.4, 10)} />
                        </svg>
                        <div className="lq-cc">{inner}</div>
                      </div>
                      {c.limitedAccess && <span className="pill">Limited access</span>}
                    </button>
                  );
                })}
              </div>

              <div className="lyw">
                {arrange && (
                  <button type="button" className="lyd" onClick={() => setArrange(false)}>
                    Done
                  </button>
                )}
                <button
                  type="button"
                  className="lyb"
                  aria-label="Customise dashboard"
                  aria-expanded={menuOpen}
                  title="Customise"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <Icon n="layout" size={18} />
                </button>
                {menuOpen && (
                  <CustomiseMenu
                    layout={layout}
                    arrange={arrange}
                    onClose={() => setMenuOpen(false)}
                    onToggle={(id) => {
                      const h = new Set(layout.hidden);
                      if (h.has(id)) h.delete(id);
                      else h.add(id);
                      if (h.has("tracking") && h.has("calendar")) return;
                      saveLayout({ ...layout, hidden: [...h] });
                    }}
                    onArrange={() => {
                      setArrange((v) => !v);
                      setMenuOpen(false);
                    }}
                    onReset={() => {
                      saveLayout(DEFAULT_LAYOUT);
                      setMenuOpen(false);
                    }}
                  />
                )}
              </div>
            </section>

            <div className="rc" style={{ gridTemplateRows: visibleRows.map((r) => (tight ? ROW_HEIGHT_TIGHT : compact ? ROW_HEIGHT_COMPACT : ROW_HEIGHT)[r]).join(" ") }}>
              {visibleRows.map((r) => rowEl[r])}
            </div>
          </div>
        </div>
      </div>

      {drawer.open && (
        <AlertsDrawer
          alerts={alerts}
          openId={drawer.id}
          onClose={() => setDrawer({ open: false, id: null })}
          onGo={goAlert}
          onDismiss={personal.dismissAlert}
        />
      )}
      {notesModal.open && (
        <NotesModal personal={personal} focusId={notesModal.id} onClose={() => setNotesModal({ open: false })} onRemove={undo.remove} />
      )}
      {undo.toast && <div className="rvd-portal">{undo.toast}</div>}
      {commFrom !== undefined && nav.communityUrl && (
        <CommunityModal url={nav.communityUrl} from={commFrom} onClose={() => setCommFrom(undefined)} />
      )}
    </div>
  );
}

/** The community group icon (three people), from the original dashboard design. */
function GroupIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3" />
      <circle cx="5.5" cy="10" r="2.2" />
      <circle cx="18.5" cy="10" r="2.2" />
      <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M1.5 18c0-2 1.5-3.5 4-3.5M22.5 18c0-2-1.5-3.5-4-3.5" />
    </svg>
  );
}

/**
 * Community popup (the original dashboard design): grows out of the Community
 * bubble, a wave header with the group icon, one line, and "Join the group",
 * which opens the WhatsApp invite.
 */
function CommunityModal({ url, from, onClose }: { url: string; from: DOMRect | null; onClose: () => void }) {
  const [out, setOut] = useState(false);
  const joinRef = useRef<HTMLAnchorElement>(null);
  const close = useCallback(() => {
    setOut(true);
    setTimeout(onClose, 220);
  }, [onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => joinRef.current?.focus({ preventScroll: true }), 620);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [close]);
  // The card starts at the bubble it was opened from.
  const origin = from
    ? {
        ["--dx" as string]: `${from.left + from.width / 2 - window.innerWidth / 2}px`,
        ["--dy" as string]: `${from.top + from.height / 2 - window.innerHeight / 2}px`,
      }
    : undefined;
  return createPortal(
    <div className={`rvd-portal ${inter.className}`}>
      <div
        className={`pop on${out ? " out" : ""}`}
        data-scroll-lock
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-t"
        style={origin}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="cpc">
          <button type="button" className="px" onClick={close} aria-label="Close">
            <Icon n="x" size={12} />
          </button>
          <div className="cph">
            <div className="chb">
              <GroupIcon size={30} color="#0d7377" />
            </div>
            <svg className="w" viewBox="0 0 330 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 22c40-22 80 14 125 2s80-20 130-4c30 10 55 6 75-4v24H0z" fill="#fff" />
            </svg>
          </div>
          <div className="cpb">
            <h3 id="cm-t">Join the community</h3>
            <p>Talk with others going through this too.</p>
            <a ref={joinRef} className="pj" href={url} target="_blank" rel="noopener noreferrer" onClick={close}>
              Join the group
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function wave(ph: number, amp: number, h: number) {
  let d = `M0 ${h}`;
  for (let x = 0; x <= 400; x += 4) d += `L${x} ${(h * 0.5 + amp * Math.sin((x / 200) * Math.PI * 4 + ph)).toFixed(1)}`;
  return d + `V${h}Z`;
}

function CustomiseMenu({
  layout,
  arrange,
  onClose,
  onToggle,
  onArrange,
  onReset,
}: {
  layout: Layout;
  arrange: boolean;
  onClose: () => void;
  onToggle: (id: WidgetId) => void;
  onArrange: () => void;
  onReset: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const hidden = new Set(layout.hidden);
  const visibleCols = (["tracking", "calendar"] as WidgetId[]).filter((c) => !hidden.has(c)).length;
  return (
    <div className="lop on" ref={ref}>
      <div className="eb">Show on dashboard</div>
      <div className="lys">
        {WIDGETS.map(([id, label]) => {
          const on = !hidden.has(id);
          const last = (id === "tracking" || id === "calendar") && on && visibleCols === 1;
          return (
            <button
              key={id}
              type="button"
              role="switch"
              aria-checked={on}
              disabled={last}
              title={last ? "Keep at least one of tracking or calendar" : undefined}
              onClick={() => onToggle(id)}
            >
              {label}
              <i />
            </button>
          );
        })}
      </div>
      <div className="lyr">
        <button type="button" onClick={onArrange}>
          {arrange ? "Done" : "Arrange"}
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
