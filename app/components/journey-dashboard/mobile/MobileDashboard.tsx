"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as RPointerEvent, ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { DashboardAlert, DashboardKeyDate } from "@/lib/journey/dashboard/types";
import {
  EVENT_NOTE_MAX,
  EVENT_TITLE_MAX,
  NOTE_CATEGORIES,
  NOTE_COLORS,
  NOTE_MAX_LENGTH,
  toDayString,
} from "@/lib/journey/dashboard/personal";
import { formatDay, relativeDays } from "@/lib/journey/dashboard/buildDashboardModel";
import type { DashboardSkinProps } from "../JourneyDashboard";
import { GROUP_ICON, Icon, type IconName } from "../icons";
import { useCopy } from "../desktop/TrackingTicket";
import { MONTHS_LONG, MONTHS_SHORT } from "../desktop/palette";
import "./mobile.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const PAGE_TITLES = ["Case health", "Calendar", "Home", "Help"];
const HOME = 2;
const LAST_PAGE = 3;
const clampPage = (i: number) => Math.max(0, Math.min(LAST_PAGE, i));
const pad2 = (n: number) => String(n).padStart(2, "0");
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const shortWord = (t: string) => (t.split(/\s+/)[0] || t).slice(0, 12);

type Sheet =
  | { k: "strength" }
  | { k: "needs" }
  | { k: "alert"; id: string }
  | { k: "ev"; id: string }
  | { k: "stage"; i: number }
  | { k: "qa" }
  | { k: "notes" }
  | { k: "addev"; day: string }
  | { k: "comm" };

/* ── Journey path (hero) ───────────────────────────────────────────────── */
const PATH_D = "M22 128C124 140 232 130 246 94C260 58 92 76 92 48C92 22 212 30 318 14";
const PATH_SEGS: number[][] = [
  [22, 128, 124, 140, 232, 130, 246, 94],
  [246, 94, 260, 58, 92, 76, 92, 48],
  [92, 48, 92, 22, 212, 30, 318, 14],
];
const PATH_SAMPLES = (() => {
  const pts: { x: number; y: number; len: number }[] = [{ x: PATH_SEGS[0][0], y: PATH_SEGS[0][1], len: 0 }];
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of PATH_SEGS) {
    for (let i = 1; i <= 240; i++) {
      const t = i / 240,
        u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
      const p = pts[pts.length - 1];
      pts.push({ x, y, len: p.len + Math.hypot(x - p.x, y - p.y) });
    }
  }
  return pts;
})();
function pathPoint(t: number) {
  const total = PATH_SAMPLES[PATH_SAMPLES.length - 1].len;
  const target = Math.max(0, Math.min(1, t)) * total;
  let lo = 0,
    hi = PATH_SAMPLES.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (PATH_SAMPLES[mid].len < target) lo = mid;
    else hi = mid;
  }
  const a = PATH_SAMPLES[lo],
    b = PATH_SAMPLES[hi];
  const k = b.len === a.len ? 0 : (target - a.len) / (b.len - a.len);
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

function Journey({ total, current, marks }: { total: number; current: number; marks: { at: number; label: string; done: boolean }[] }) {
  if (total <= 0) return <svg className="jl" viewBox="0 0 340 150" aria-hidden="true" />;
  const f = Math.min(1, (current + 0.5) / total);
  const end = pathPoint(1);
  const here = pathPoint(f);
  const offsets: [number, number][] = [[0, -15], [16, 4], [0, -15], [16, 4]];
  return (
    <svg className="jl" viewBox="0 0 340 150" role="img" aria-label={`Journey progress: step ${Math.min(total, current + 1)} of ${total}`}>
      <path id="rvm-jp" d={PATH_D} fill="none" stroke="#0e5a5e1f" strokeWidth={10} strokeLinecap="round" />
      <path d={PATH_D} pathLength={1000} fill="none" stroke="#0e5a5e" strokeWidth={10} strokeLinecap="round" strokeDasharray={`${f * 1000} 2000`} />
      {Array.from({ length: total }, (_, k) => {
        if (k === current) return null;
        const q = pathPoint((k + 0.5) / total);
        return <circle key={k} cx={q.x.toFixed(1)} cy={q.y.toFixed(1)} r={1.9} fill={k < current ? "#ffffff" : "#0e5a5e45"} />;
      })}
      <circle r={3.2} fill="#fff">
        <animateMotion dur="3.6s" repeatCount="indefinite" keyPoints={`0;${f}`} keyTimes="0;1" calcMode="linear">
          <mpath href="#rvm-jp" />
        </animateMotion>
      </circle>
      {marks.map((m, i) => {
        const q = pathPoint(m.at);
        const [dx, dy] = offsets[i % offsets.length];
        return (
          <g key={`${m.label}${i}`}>
            <circle cx={q.x} cy={q.y} r={8.5} fill="#fff" stroke="#0e5a5e" strokeWidth={2.2} />
            {m.done && (
              <path d="M-3.2 0l2.4 2.4 4-4.6" transform={`translate(${q.x} ${q.y})`} stroke="#0e5a5e" strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <text x={q.x + dx} y={q.y + dy} textAnchor={dx ? "start" : "middle"} fill="#13201fb3" fontSize={10} fontWeight={600}>
              {m.label}
            </text>
          </g>
        );
      })}
      {current < total && (
        <>
          <circle cx={here.x} cy={here.y} r={12} fill="#fff" stroke="#0e5a5e" strokeWidth={3.2} />
          <circle cx={here.x} cy={here.y} r={4.5} fill="#0e5a5e" />
        </>
      )}
      <path d={`M${end.x} ${end.y}V${end.y - 26}`} stroke="#0e5a5e" strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M${end.x} ${end.y - 26}l13 4.5-13 4.5z`} fill="#0e5a5e" />
      <circle cx={end.x} cy={end.y} r={6} fill="#0e5a5e" stroke="#fff" strokeWidth={2.6} />
    </svg>
  );
}

/* ── Small pieces ──────────────────────────────────────────────────────── */
function Gauge({ score, empty, className, label }: { score: number; empty: boolean; className?: string; label: string }) {
  // Real score bands: Weak 0-40, Moderate 40-70, Strong 70-100.
  const bands: [string, number, number][] = [
    ["#d9a9a1", 39, 0],
    ["#e3c68f", 29, -41],
    ["#0e5a5e", 29, -71],
  ];
  return (
    <svg className={className} viewBox="0 0 220 124" role="img" aria-label={label}>
      <g fill="none" strokeWidth={17} strokeLinecap="round">
        {bands.map(([c, len, o]) => (
          <path key={c} pathLength={100} d="M20 110A90 90 0 0 1 200 110" stroke={c} strokeDasharray={`${len} 200`} strokeDashoffset={o} />
        ))}
      </g>
      {!empty && (
        <g className="nd" style={{ "--a": `${Math.round(score * 1.8)}deg` } as CSSProperties}>
          <path d="M110 110L50 110" stroke="#13201f" strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      <circle cx={110} cy={110} r={10} fill="#13201f" />
      <circle cx={110} cy={110} r={4} fill="#fff" />
    </svg>
  );
}

function MonthCells({ y, m, today, dates, onEvent }: { y: number; m: number; today: Date; dates: DashboardKeyDate[]; onEvent?: (id: string) => void }) {
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  const cells: ReactNode[] = [];
  for (let i = 0; i < offset; i++) cells.push(<u key={`b${i}`} />);
  for (let d = 1; d <= count; d++) {
    const dt = new Date(y, m, d);
    const ev = dates.find((e) => sameDay(e.date, dt));
    const isToday = sameDay(dt, today);
    const style = ev && !isToday ? ({ "--c": `${ev.color}40` } as CSSProperties) : undefined;
    const cls = isToday ? "t" : ev ? "e" : "";
    cells.push(
      ev && onEvent ? (
        <button key={d} type="button" className={cls} style={style} onClick={() => onEvent(ev.id)} aria-label={`${ev.title}, ${d} ${MONTHS_LONG[m]}`}>
          {d}
        </button>
      ) : (
        <span key={d} className={cls} style={style}>
          {d}
        </span>
      )
    );
  }
  return <>{cells}</>;
}

/* ── Component ─────────────────────────────────────────────────────────── */
export function MobileDashboard(props: DashboardSkinProps) {
  const { hero, chapters, path, caseHealth: ch, alerts, tracking, keyDates, groups, personal, actions, nav, greetingName } = props;
  const today = useMemo(() => new Date(), []);
  const [page, setPage] = useState(HOME);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const [cm, setCm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [height, setHeight] = useState<number | null>(null);
  const [copied, copy] = useCopy();

  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const gesture = useRef({ id: -1, x: 0, y: 0, t: 0, w: 375, locked: false });
  const suppressClick = useRef(false);

  const goTo = useCallback((i: number) => setPage(clampPage(i)), []);
  const open = useCallback((s: Sheet) => {
    setSheet(s);
    setSheetOpen(true);
  }, []);
  const close = useCallback(() => setSheetOpen(false), []);
  const toast = useCallback((t: string) => {
    setToastText(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), 1800);
  }, []);

  // Fill the space below the site header so the bottom nav stays on screen.
  useLayoutEffect(() => {
    const fit = () => {
      const el = rootRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setHeight(Math.max(480, window.innerHeight - top - 4));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Short screens: scale a page's content down a little (never below 82%)
  // instead of letting it scroll. The hero flexes first, so it rarely kicks in.

  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  useLayoutEffect(() => {
    const run = () => {
      pageRefs.current.forEach((el) => {
        if (!el) return;
        const kids = Array.from(el.children) as HTMLElement[];
        kids.forEach((c) => (c.style.zoom = ""));
        let z = 1;
        const apply = (v: number) => kids.forEach((c) => (c.style.zoom = String(v)));
        while (el.scrollHeight > el.clientHeight + 1 && z > 0.82) {
          z -= 0.02;
          apply(z);
        }

      });
    };
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  });

  // Live countdown, only while an interview is coming up.
  useEffect(() => {
    if (!hero.interview) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hero.interview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || sheetOpen) return;
      if (e.key === "ArrowRight") setPage((p) => clampPage(p + 1));
      if (e.key === "ArrowLeft") setPage((p) => clampPage(p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  /* swipe between pages */
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = viewRef.current;
    if (!el) return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, w: el.offsetWidth || 375, locked: false };
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g.id !== e.pointerId) return;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (!g.locked) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        g.locked = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      } else if (Math.abs(dy) > 8) {
        g.id = -1;
        return;
      } else return;
    }
    let d = dx;
    if ((page === 0 && d > 0) || (page === LAST_PAGE && d < 0)) d *= 0.3;
    setDrag(d);
  };
  const endGesture = (e: RPointerEvent<HTMLDivElement>, cancelled = false) => {
    const g = gesture.current;
    if (g.id !== e.pointerId) return;
    g.id = -1;
    if (!g.locked) return;
    const dx = e.clientX - g.x;
    const v = dx / Math.max(1, e.timeStamp - g.t);
    let next = page;
    if (!cancelled && (Math.abs(dx) > g.w * 0.2 || Math.abs(v) > 0.4)) next = clampPage(page + (dx < 0 ? 1 : -1));
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 60);
    setDragging(false);
    setDrag(0);
    setPage(next);
  };

  const width = gesture.current.w || 375;
  const pos = page - drag / width;
  const active = Math.round(pos);
  const groupCount = (id: string) => groups.find((g) => g.id === id)?.items.length ?? 0;
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const strip = [...keyDates.filter((k) => k.date >= t0), ...keyDates.filter((k) => k.date < t0).reverse()].slice(0, 3);

  const showEvent = (id: string) => {
    const e = keyDates.find((k) => k.id === id);
    if (!e) return;
    setCm({ y: e.date.getFullYear(), m: e.date.getMonth() });
    open({ k: "ev", id });
  };
  const goAlert = (a: DashboardAlert) => {
    close();
    if (a.kind === "score-drop") actions.onOpenCaseAnalysis();
    else actions.onOpenStep(a.chapterIndex, a.stepIndex);
  };

  /* ── Pages ── */
  const factorColor: Record<string, string> = { evidence: "#0e5a5e", consistency: "#0e5a5e", completeness: "#a8691f", risk: "#a8453d" };
  const healthPage = (
    <>
      <div className={`card sc2${ch.locked ? " lkd" : ""}`}>
        {ch.locked && (
          <button type="button" className="csk" onClick={actions.onOpenCaseAnalysis}>
            <Icon n="lock" />
            <b>Your case strength score is on Premium</b>
            <span>See your score, what makes it up and how to raise it.</span>
            <em>Upgrade</em>
          </button>
        )}
        <div className="rh2">
          <span className="lb2">Case strength</span>
          {!ch.notStarted && <span className="up">{ch.label}</span>}
        </div>
        <Gauge className="g2" score={ch.score} empty={ch.notStarted} label={ch.notStarted ? "Case strength not scored yet" : `Case strength gauge: ${ch.score} of 100`} />
        <div className="zl">
          {(["weak", "moderate", "strong"] as const).map((b) => (
            <span key={b} className={!ch.notStarted && ch.band === b ? "on" : ""}>
              {b === "weak" ? "Weak" : b === "moderate" ? "Moderate" : "Strong"}
            </span>
          ))}
        </div>
        <div className="srow">
          <div className="sv">
            <b>{ch.notStarted ? "--" : ch.score}</b>
            {ch.notStarted && <span className="ctx">Your score appears once you complete a step and add a document.</span>}
            {!ch.notStarted && ch.pointsToNextBand !== null && (
              <span>
                {ch.pointsToNextBand} point{ch.pointsToNextBand === 1 ? "" : "s"} to {ch.nextBandLabel}
              </span>
            )}
          </div>
          <button type="button" className="tg" onClick={actions.onOpenCaseAnalysis}>
            Full analysis <Icon n="chev" size={12} />
          </button>
        </div>
      </div>
      <div className={`fg${ch.locked ? " lkd" : ""}`} aria-hidden={ch.locked || undefined}>
        {ch.factors.map((f) => (
          <button key={f.key} type="button" className="fc" tabIndex={ch.locked ? -1 : undefined} onClick={() => (ch.locked ? actions.onOpenCaseAnalysis() : open({ k: "strength" }))}>
            <span className="rg">
              <svg viewBox="0 0 44 44">
                <circle cx={22} cy={22} r={18} fill="none" stroke="#13201f12" strokeWidth={5} />
                <circle cx={22} cy={22} r={18} fill="none" stroke={factorColor[f.key]} strokeWidth={5} strokeLinecap="round" pathLength={100} strokeDasharray={`${ch.notStarted ? 0 : f.value} 100`} transform="rotate(-90 22 22)" />
              </svg>
              <b>{ch.notStarted ? "--" : f.value}</b>
            </span>
            <div>
              <b>{f.label}</b>
              <small>{f.key === "risk" ? "risk, of 100" : "of 100"}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="card act">
        <h4>Raise your score</h4>
        <div className="al">
          <button type="button" className="ax" onClick={actions.onOpenEvidenceQuestions}>
            <span className="tile"><Icon n="link" /></span>
            <span>Evidence questions</span>
            <em>{ch.evidenceQuestions.answered}/{ch.evidenceQuestions.total}</em>
            <Icon n="chev" />
          </button>
          <button type="button" className="ax" onClick={actions.onOpenConsistencyQuestions}>
            <span className="tile"><Icon n="shield" /></span>
            <span>Consistency check</span>
            <em>{ch.consistencyQuestions.answered}/{ch.consistencyQuestions.total}</em>
            <Icon n="chev" />
          </button>
          <button type="button" className="ax" onClick={actions.onOpenCaseAnalysis}>
            <span className="tile"><Icon n="doc" /></span>
            <span>Full case analysis</span>
            <Icon n="chev" />
          </button>
        </div>
      </div>
    </>
  );

  const ts = tracking.stages[tracking.currentIndex];
  const upcoming = keyDates.filter((k) => k.date >= t0).slice(0, 6);
  const calendarPage = (
    <>
      <div className="card cal">
        <div className="ch">
          <h3>
            {MONTHS_LONG[cm.m]} {cm.y}
          </h3>
          <div className="nb">
            <button type="button" onClick={() => setCm(({ y, m }) => ({ y: m === 0 ? y - 1 : y, m: (m + 11) % 12 }))} aria-label="Previous month">
              <Icon n="chevL" size={16} />
            </button>
            <button type="button" onClick={() => setCm(({ y, m }) => ({ y: m === 11 ? y + 1 : y, m: (m + 1) % 12 }))} aria-label="Next month">
              <Icon n="chev" size={16} />
            </button>
            <button
              type="button"
              className="add"
              onClick={() => {
                const isThisMonth = cm.y === today.getFullYear() && cm.m === today.getMonth();
                open({ k: "addev", day: toDayString(isThisMonth ? today : new Date(cm.y, cm.m, 1)) });
              }}
              aria-label="Add your own event"
            >
              <Icon n="plus" size={16} />
            </button>
          </div>
        </div>
        <div className="wk">
          {"MTWTFSS".split("").map((d, i) => (
            <small key={i}>{d}</small>
          ))}
        </div>
        <div className="wd">
          <MonthCells y={cm.y} m={cm.m} today={today} dates={keyDates} onEvent={showEvent} />
        </div>
        {strip.length === 0 && (
          <p className="ctx kd-e">Key dates such as your interview and medical show up here once they are saved in your roadmap. Tap + to add your own.</p>
        )}
        {strip.length > 0 && (
          <div className="kd">
            {strip.map((e) => (
              <button key={e.id} type="button" style={{ "--c": `${e.color}33` } as CSSProperties} onClick={() => showEvent(e.id)}>
                <b>{e.title}</b>
                <small>
                  {e.date.getDate()} {MONTHS_SHORT[e.date.getMonth()]}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="card pass">
        <button type="button" className="pt" onClick={() => open({ k: "stage", i: tracking.currentIndex })}>
          <div>
            <small>CASE TRACKING</small>
            <b>{ts.title}</b>
          </div>
          {(ts.statusText || ts.status !== "next") && <span className="stc">{ts.statusText || (ts.status === "done" ? "Done" : "In progress")}</span>}
        </button>
        <div className="route">
          <div className="rl" style={{ "--p": `${(tracking.currentIndex / Math.max(1, tracking.stages.length - 1)) * 80}%` } as CSSProperties}>
            {tracking.stages.map((s, i) => (
              <button key={s.key} type="button" className={`rs ${s.status === "done" ? "d" : s.status === "current" ? "cur" : "n"}`} onClick={() => open({ k: "stage", i })}>
                <i>{s.status === "done" ? <Icon n="check" /> : null}</i>
                <div>
                  {s.label}
                  <small>{s.date ? `${s.date.getDate()} ${MONTHS_SHORT[s.date.getMonth()]}` : ""}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
        {tracking.receipt && (
          <>
            <div className="tear" />
            <div className="stub">
              <div className="rc">
                <small>Receipt number</small>
                <code>{tracking.receipt.number}</code>
              </div>
              <button
                type="button"
                className="cpy"
                onClick={() => {
                  copy(tracking.receipt!.number);
                  toast("Receipt number copied");
                }}
              >
                <Icon n="copy" />
                {copied === tracking.receipt.number ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="auto">
              <span>
                {tracking.receipt.status ? `USCIS: ${tracking.receipt.status}` : "USCIS status"}
                {props.uscis.error ? (
                  <small className="er">{props.uscis.error}</small>
                ) : (
                  tracking.receipt.lastCheckedAt && <small>Last checked {relativeDays(tracking.receipt.lastCheckedAt, today).toLowerCase()}</small>
                )}
              </span>
              <button type="button" className="ck" onClick={props.uscis.check} disabled={props.uscis.checking}>
                <Icon n={props.uscis.locked ? "lock" : "refresh"} />
                {props.uscis.checking ? "Checking" : "Check"}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="card upl">
        <h4>Coming up</h4>
        {upcoming.length === 0 ? (
          <p className="ctx">Upcoming dates from your roadmap and the events you add show up here.</p>
        ) : (
          upcoming.map((e) => (
            <button key={e.id} type="button" className="ul" style={{ "--c": e.color } as CSSProperties} onClick={() => showEvent(e.id)}>
              <span className="dp">
                <i>{MONTHS_SHORT[e.date.getMonth()].toUpperCase()}</i>
                <b>{e.date.getDate()}</b>
              </span>
              <span className="ut">
                <b>{e.title}</b>
                <small>{e.detail || relativeDays(e.date, today)}</small>
              </span>
              <em>{relativeDays(e.date, today)}</em>
            </button>
          ))
        )}
      </div>
      {tracking.stages.every((s) => s.status === "next") ? (
        <div className="tip1">
          <span className="tile"><Icon n="doc" /></span>
          Tracking fills in as you record your receipt number, NVC case, medical and interview dates.
        </div>
      ) : ts.note ? (
        <div className="tip1">
          <span className="tile"><Icon n="doc" /></span>
          {ts.note}
        </div>
      ) : null}
    </>
  );

  const iv = hero.interview;
  const left = iv ? Math.max(0, iv.date.getTime() + (parseTimeMs(iv.time) ?? 0) - nowMs) : 0;
  const curIdx = path.findIndex((p) => p.state === "current");
  const marks = useMemo(() => {
    let acc = 0;
    return chapters.map((c) => {
      const at = path.length ? acc / path.length : 0;
      acc += path.filter((p) => p.chapterIndex === c.index).length;
      return { at, label: shortWord(c.title), done: c.status === "done" };
    });
  }, [chapters, path]);

  const homePage = (
    <>
      {greetingName && (
        <div className="gr">
          <small>Welcome back</small>
          <b>{greetingName}</b>
        </div>
      )}
      <div className="hero">
        <div className="hh">
          {iv ? (
            <div>
              <small>Interview in</small>
              <b>
                <span>{iv.daysLeft}</span>
                <em>{iv.daysLeft === 1 ? "day" : "days"}</em>
              </b>
              <span className="tm">
                {pad2(Math.floor(left / 36e5) % 24)}:{pad2(Math.floor(left / 6e4) % 60)}:{pad2(Math.floor(left / 1e3) % 60)}
              </span>
            </div>
          ) : (
            <div className="hx">
              <small>{hero.next ? `Chapter ${hero.next.chapterIndex + 1}, step ${hero.next.stepNumber}` : "Your journey"}</small>
              <b>{hero.next ? hero.next.stepName : "Journey complete"}</b>
              {hero.completedSteps === 0 && hero.next && (
                <p className="ctx">Start here. Your case strength, tracking and key dates fill in as you complete steps.</p>
              )}
            </div>
          )}
          {hero.totalSteps > 0 && (
            <span className="stp">
              Step {Math.min(hero.position, hero.totalSteps)} / {hero.totalSteps}
            </span>
          )}
        </div>
        <Journey total={path.length} current={curIdx >= 0 ? curIdx : hero.completedSteps} marks={marks} />
        <div className="c3">
          {chapters.map((c) => (
            <span key={c.index} className={c.status === "current" ? "cur" : ""}>
              {c.status === "done" && <Icon n="check" />}
              {shortWord(c.title)}
              {c.status === "current" ? ` ${c.done} / ${c.total}` : ""}
            </span>
          ))}
          {hero.next && !hero.readOnly && (
            <button type="button" className="hgo" onClick={actions.onContinue} aria-label={hero.upgradeRequired ? "Upgrade to continue" : `Continue: ${hero.next.stepName}`}>
              <Icon n={hero.upgradeRequired ? "lock" : "arrow"} />
            </button>
          )}
        </div>
      </div>
      <div className="r">
        <button type="button" className={`card gw${ch.locked ? " lkd" : ""}`} onClick={() => goTo(0)}>
          {ch.locked && <span className="gwk"><Icon n="lock" /></span>}
          <span className="lb">Case strength</span>
          <Gauge score={ch.score} empty={ch.notStarted} label={ch.notStarted ? "Not scored yet" : `Case strength ${ch.score} of 100`} />
          <div className="gv">
            <b>{ch.notStarted ? "--" : ch.score}</b>
            {!ch.notStarted && <span>{ch.band === "strong" ? "Strong" : ch.band === "moderate" ? "Moderate" : "Weak"}</span>}
          </div>
        </button>
        <button type="button" className="card mw" onClick={() => goTo(1)}>
          <div className="mt">
            <b>{MONTHS_LONG[today.getMonth()]}</b>
            <small>{today.getFullYear()}</small>
          </div>
          <div className="mg">
            {"MTWTFSS".split("").map((d, i) => (
              <small key={i}>{d}</small>
            ))}
            <MonthCells y={today.getFullYear()} m={today.getMonth()} today={today} dates={keyDates} />
          </div>
        </button>
      </div>
      <div className="sh2">
        <b>Needs attention</b>
        {alerts.length > 0 && (
          <button type="button" onClick={() => open({ k: "needs" })}>
            See all {alerts.length}
          </button>
        )}
      </div>
      {alerts.length === 0 ? (
        <div className="card ne">
          <span className="tile"><Icon n="check" /></span>
          <p>
            {hero.completedSteps === 0
              ? "Nothing needs you yet. Missing documents and anything else that needs you will show up here as you go."
              : "All clear. Nothing needs you right now."}
          </p>
        </div>
      ) : (
        <>
          <div className="cg">
            {alerts.slice(0, 4).map((a) => (
              <button key={a.id} type="button" className={`cc ${a.level === "check" ? "a" : ""}`} onClick={() => open({ k: "alert", id: a.id })}>
                <span className="ci">
                  <Icon n={a.level === "blocking" ? "alert" : "doc"} />
                </span>
                <div>
                  <b>{a.title}</b>
                  <em>{a.level === "blocking" ? "Blocking" : "Check"}</em>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );

  const tiles: { name: string; icon: IconName; sub: string; style?: CSSProperties; dark?: boolean; onClick: () => void }[] = [
    ...groups.slice(0, 3).map((g, i) => ({
      name: g.title,
      icon: (GROUP_ICON[g.id] || "grid") as IconName,
      sub: `${groupCount(g.id)} ${g.id === "tools" ? "tools" : g.id === "guides" ? "guides" : "services"}`,
      style: [
        { "--c": "var(--tl)", "--k": "var(--teal)" },
        { "--c": "var(--clayl)", "--k": "var(--clay)" },
        { "--c": "var(--brickl)", "--k": "var(--brick)" },
      ][i] as CSSProperties,
      onClick: () => nav.openGroup(g.id),
    })),
    { name: "Community", icon: "users", sub: "Join the group", dark: true, onClick: () => open({ k: "comm" }) },
  ];
  const places = buildPlaces(hero.interview, keyDates.find((k) => k.id === "k-medical"), today);
  const helpPage = (
    <>
      <div className="hh2">How can I help?</div>
      <div className="hg">
        {tiles.map((t) => (
          <button key={t.name} type="button" className={`ht${t.dark ? " dk" : ""}`} style={t.style} onClick={t.onClick}>
            <span className="tile"><Icon n={t.icon} /></span>
            <Icon n="up" className="ar2" />
            <div>
              <b>{t.name}</b>
              <small>{t.sub}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="sh2 sec2">
        <b>Nearby</b>
      </div>
      {places.length > 0 ? (
        <div className="card np">
          {places.map((pl) => (
            <PlaceRow key={pl.key} place={pl} />
          ))}
        </div>
      ) : (
        <div className="card np-e">
          <span className="ph"><Icon n="pin" /></span>
          <div>
            <b>Your journey places</b>
            <p>
              Once you record your medical clinic and interview location in your roadmap, they show up here with
              directions.
            </p>
          </div>
        </div>
      )}
      <button type="button" className="nt" onClick={() => open({ k: "notes" })}>
        <div className="h">
          <span>Notes</span>
          <b>{personal.notes.length}</b>
        </div>
        <div className="lns">
          {personal.notes.length ? (
            personal.notes.slice(0, 6).map((n) => <p key={n.id}>{n.text}</p>)
          ) : (
            <p className="wr">Nothing yet. Tap + to jot something down.</p>
          )}
        </div>
        <span className="go"><Icon n="plus" /></span>
      </button>
    </>
  );

  const pages: ReactNode[] = [healthPage, calendarPage, homePage, helpPage];

  return (
    <div ref={rootRef} className={`rvm ${jakarta.className}`} style={{ height: height ?? undefined }}>
      <div
        className={`sc${sheetOpen ? " so" : ""}`}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <div
          ref={viewRef}
          className={`pgs${dragging ? " drag" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endGesture(e)}
          onPointerCancel={(e) => endGesture(e, true)}
        >
          <div className="track" style={{ transform: `translateX(calc(${-page * 100}% + ${drag}px))` }}>
            {pages.map((content, i) => {
              const d = Math.min(1, Math.abs(pos - i));
              return (
                <section
                  key={i}
                  className={`pg p${i}`}
                  ref={(el) => {
                    pageRefs.current[i] = el;
                    if (el) {
                      if (i === page) el.removeAttribute("inert");
                      else el.setAttribute("inert", "");
                    }
                  }}
                  style={{ opacity: 1 - d * 0.8, transform: `scale(${1 - d * 0.06})` }}
                  aria-hidden={i !== page}
                >
                  {content}
                </section>
              );
            })}
          </div>
        </div>

        <nav className="nav" style={{ "--p": pos } as CSSProperties}>
          <span className="dot"><i /></span>
          {([["shield", "Case health"], ["cal", "Calendar"], ["home", "Home"], ["help", "Help"]] as [IconName, string][]).map(([icon, label], i) => (
            <button key={label} type="button" className={active === i ? "on" : ""} aria-label={label} aria-current={active === i ? "page" : undefined} onClick={() => goTo(i)}>
              <Icon n={icon} />
              {active === i && <span className="nl">{PAGE_TITLES[i]}</span>}
            </button>
          ))}
          <button type="button" aria-label="Quick access" onClick={() => open({ k: "qa" })}>
            <Icon n="grid" />
          </button>
        </nav>

        <div className={`ts${toastText ? " on" : ""}`} role="status">
          {toastText}
        </div>
        <div className="scr" onClick={close} />
        <aside className="sh" role="dialog" aria-modal="true" aria-hidden={!sheetOpen}>
          {sheet && (
            <SheetBody
              s={sheet}
              props={props}
              today={today}
              close={close}
              toast={toast}
              goAlert={goAlert}
              openSheet={open}
              copy={(v) => {
                copy(v);
                toast("Copied");
              }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

interface Place {
  key: string;
  icon: IconName;
  title: string;
  sub: string;
  query: string;
}

/**
 * Places recorded on this journey (never placeholders): the interview location
 * and the medical clinic, upcoming ones first. Each opens directions.
 */
function buildPlaces(
  iv: DashboardSkinProps["hero"]["interview"],
  medical: DashboardKeyDate | undefined,
  today: Date
): Place[] {
  const out: (Place & { when: number })[] = [];
  if (iv?.place) {
    out.push({
      key: "embassy",
      icon: "building",
      title: iv.place,
      sub: `Your interview, ${formatDay(iv.date)}${iv.time ? ", " + iv.time : ""}`,
      query: iv.place,
      when: iv.date.getTime(),
    });
  }
  if (medical?.detail) {
    const done = medical.date < today;
    out.push({
      key: "clinic",
      icon: "cross",
      title: medical.detail,
      sub: `${done ? "Medical exam was" : "Medical exam"} ${formatDay(medical.date)}`,
      query: medical.detail,
      // finished visits go last
      when: done ? Number.MAX_SAFE_INTEGER : medical.date.getTime(),
    });
  }
  return out.sort((a, b) => a.when - b.when);
}

function PlaceRow({ place }: { place: Place }) {
  return (
    <a
      className="pr"
      draggable={false}
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="tile"><Icon n={place.icon} /></span>
      <span className="pt2">
        <b>{place.title}</b>
        <small>{place.sub}</small>
      </span>
      <Icon n="pin" className="pi" />
    </a>
  );
}

/** "9:30 AM" / "14:30" -> ms after midnight, for the countdown. */
function parseTimeMs(t?: string): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(t.trim());
  if (!m) return null;
  let h = +m[1] % 24;
  if (m[3]) h = (h % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0);
  return (h * 60 + +m[2]) * 6e4;
}

function SheetBody({
  s,
  props,
  today,
  close,
  toast,
  goAlert,
  openSheet,
  copy,
}: {
  s: Sheet;
  props: DashboardSkinProps;
  today: Date;
  close: () => void;
  toast: (t: string) => void;
  goAlert: (a: DashboardAlert) => void;
  openSheet: (s: Sheet) => void;
  copy: (v: string) => void;
}) {
  const { caseHealth: ch, alerts, keyDates, tracking, personal, nav } = props;
  switch (s.k) {
    case "strength":
      return (
        <>
          <h2>Case strength</h2>
          <p className="mu">{ch.notStarted ? "Not scored yet" : `${ch.score} of 100, ${ch.label}`}</p>
          {ch.factors.map((f) => (
            <div className="li" key={f.key}>
              <span className="tile"><Icon n={f.key === "evidence" ? "link" : f.key === "consistency" ? "shield" : f.key === "risk" ? "alert" : "doc"} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  {f.label}
                  <span className="mu">{ch.notStarted ? "--" : `${f.value} / 100`}</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${ch.notStarted ? 0 : f.value}%`, background: f.key === "risk" ? "#c98a82" : "#0e5a5e" }} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={() => { close(); props.actions.onOpenCaseAnalysis(); }}>
            Open full analysis
          </button>
        </>
      );
    case "needs": {
      const blocking = alerts.filter((a) => a.level === "blocking").length;
      return (
        <>
          <h2>Needs you</h2>
          <p className="mu">
            {alerts.length === 0 ? "Nothing needs you right now" : `${blocking} blocking, ${alerts.length - blocking} to check`}
          </p>
          {alerts.map((a) => (
            <button type="button" className="li" key={a.id} onClick={() => openSheet({ k: "alert", id: a.id })}>
              <span className="tile" style={{ background: a.level === "blocking" ? "var(--brickl)" : "var(--clayl)" }}>
                <Icon n={a.level === "blocking" ? "alert" : "doc"} />
              </span>
              <span>{a.title}</span>
              <em className={a.level === "blocking" ? "r" : "a"}>{a.level === "blocking" ? "Blocking" : "Check"}</em>
            </button>
          ))}
        </>
      );
    }
    case "alert": {
      const a = alerts.find((x) => x.id === s.id);
      if (!a) return <p className="mu">This item is no longer open.</p>;
      return (
        <>
          <h2>{a.title}</h2>
          <span className="li" style={{ border: 0, padding: "6px 0" }}>
            <em className={a.level === "blocking" ? "r" : "a"}>{a.level === "blocking" ? "Blocking" : "Check"}</em>
            <span className="mu" style={{ fontWeight: 500 }}>{a.where}</span>
          </span>
          {a.detail && <p className="mu">{a.detail}</p>}
          {a.fix && (
            <div className="fx">
              <i>How to fix</i>
              {a.fix}
            </div>
          )}
          <button type="button" className="btn" onClick={() => goAlert(a)}>
            {a.kind === "score-drop" ? "Open breakdown" : "Go to step"}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              personal.dismissAlert(a.id);
              close();
              toast("Dismissed");
            }}
          >
            Dismiss
          </button>
        </>
      );
    }
    case "ev": {
      const e = keyDates.find((k) => k.id === s.id);
      if (!e) return null;
      return (
        <>
          <h2>{e.title}</h2>
          <p className="mu">{e.date.toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <div className="li">
            <span className="tile"><Icon n="pin" /></span>
            <span>{e.detail || (e.custom ? "Your event" : "")}</span>
            <em className="a">{relativeDays(e.date, today)}</em>
          </div>
          {e.custom && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                personal.removeEvent(e.id);
                close();
                toast("Event deleted");
              }}
            >
              Delete event
            </button>
          )}
        </>
      );
    }
    case "stage": {
      const st = tracking.stages[s.i];
      if (!st) return null;
      return (
        <>
          <h2>{st.title}</h2>
          <p className="mu">
            Stage {s.i + 1} of {tracking.stages.length}
            {st.date ? `, ${formatDay(st.date)}` : ""}
          </p>
          {st.facts.map((f) => (
            <div className="li" key={f.label}>
              <span style={{ flex: 1 }}>
                <small style={{ display: "block" }}>{f.label}</small>
                {f.value}
              </span>
              {f.copy && (
                <button type="button" className="cpy" onClick={() => copy(f.value)}>
                  Copy
                </button>
              )}
            </div>
          ))}
          {st.note && <p className="mu" style={{ marginTop: 12 }}>{st.note}</p>}
          {st.key === "result" && tracking.ap && (tracking.ap.saved || tracking.ap.step) && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                close();
                nav.openApTracker();
              }}
            >
              {tracking.ap.saved ? "Open AP tracker" : "Record AP details"}
            </button>
          )}
          {st.links.map((l) => (
            <a key={l.href} className="btn" href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </>
      );
    }
    case "qa": {
      const items: { icon: IconName; label: string; bg: string; onClick: () => void }[] = [
        { icon: "chat", label: "Requests", bg: "var(--tl)", onClick: nav.openRequests },
        { icon: "heart", label: "Favourites", bg: "var(--sand)", onClick: nav.openFavourites },
        { icon: "lock", label: "Vault", bg: "var(--tm)", onClick: nav.openVault },
        { icon: "wallet", label: "Wallet", bg: "var(--tl)", onClick: nav.openWallet },
      ];
      if (nav.communityUrl)
        items.push({ icon: "users", label: "Community", bg: "var(--sand)", onClick: () => window.open(nav.communityUrl, "_blank", "noopener,noreferrer") });
      return (
        <>
          <h2>Quick access</h2>
          <div className="qg" style={{ gridTemplateColumns: `repeat(${items.length},minmax(0,1fr))` }}>
            {items.map((q) => (
              <button
                key={q.label}
                type="button"
                style={{ "--c": q.bg } as CSSProperties}
                onClick={() => {
                  close();
                  q.onClick();
                }}
              >
                <span className="tile"><Icon n={q.icon} /></span>
                {q.label}
              </button>
            ))}
          </div>
        </>
      );
    }
    case "notes":
      return <NotesSheet personal={personal} />;

    case "addev":
      return (
        <AddEventSheet
          day={s.day}
          onSave={(e) => {
            personal.addEvent(e);
            close();
            toast("Event added");
          }}
        />
      );
    case "comm":
      return (
        <>
          <h2>Join the community</h2>
          <p className="mu">Talk with others going through the same journey.</p>
          {nav.communityUrl ? (
            <a className="btn" href={nav.communityUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
              Join the group
            </a>
          ) : (
            <p className="ctx" style={{ marginTop: 14 }}>The community group link is coming soon.</p>
          )}
        </>
      );
  }
}

function AddEventSheet({ day, onSave }: { day: string; onSave: (e: { title: string; day: string; time?: string; note?: string; color: string }) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(day);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState<string>(NOTE_COLORS[0]);
  useEffect(() => setDate(day), [day]);
  const ok = !!title.trim() && /^\d{4}-\d{2}-\d{2}$/.test(date);
  return (
    <>
      <h2>Add an event</h2>
      <div className="fm">
        <label>
          <span>Title</span>
          <input value={title} maxLength={EVENT_TITLE_MAX} placeholder="e.g. Collect police certificate" onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="r2">
          <label>
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span>Time, optional</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <label>
          <span>Note, optional</span>
          <input value={note} maxLength={EVENT_NOTE_MAX} placeholder="Where, who, what to bring" onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="cats" role="radiogroup" aria-label="Category">
          {NOTE_CATEGORIES.map((c) => (
            <button
              key={c.color}
              type="button"
              role="radio"
              aria-checked={color === c.color}
              className={color === c.color ? "on" : ""}
              style={{ "--c": c.color } as CSSProperties}
              onClick={() => setColor(c.color)}
            >
              <i />
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="btn"
        disabled={!ok}
        onClick={() => onSave({ title: title.trim(), day: date, time: time || undefined, note: note.trim() || undefined, color })}
      >
        Save event
      </button>
    </>
  );
}

function NotesSheet({ personal }: { personal: DashboardSkinProps["personal"] }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (personal.addNote(text)) setText("");
  };
  return (
    <>
      <h2>Notes</h2>
      <div className="ni">
        <input
          value={text}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Take a note"
          autoComplete="off"
          aria-label="Take a note"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button type="button" onClick={submit} aria-label="Save note">
          <Icon n="arrow" />
        </button>
      </div>
      {personal.notes.map((n) => (
        <div className="nr" key={n.id}>
          <span>{n.text}</span>
          <button type="button" onClick={() => personal.removeNote(n.id)} aria-label="Delete note">
            <Icon n="x" size={14} />
          </button>
        </div>
      ))}
    </>
  );
}
