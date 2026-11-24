"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DashboardTracking } from "@/lib/journey/dashboard/types";
import { relativeDays } from "@/lib/journey/dashboard/buildDashboardModel";
import { Icon } from "../icons";
import type { UscisLiveCheck } from "../useUscisLiveCheck";
import { MONTHS_SHORT, WEEKDAYS_SHORT } from "./palette";

/** Facts kept on the front when the rest move to the back face. */
const FRONT_PREVIEW = 2;
const STAGE_COLORS = ["#0d9488", "#3b62a0", "#6b4f93", "#6b4f93", "#b4405a"];

export function useCopy(): [string | null, (value: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1400);
    return () => clearTimeout(t);
  }, [copied]);
  return [
    copied,
    (value: string) => {
      try {
        void navigator.clipboard.writeText(value);
      } catch {
        /* clipboard unavailable */
      }
      setCopied(value);
    },
  ];
}

export function TrackingTicket({
  tracking,
  today,
  uscis,
  onApTracker,
}: {
  tracking: DashboardTracking;
  today: Date;
  uscis: UscisLiveCheck;
  onApTracker: () => void;
}) {
  const { stages } = tracking;
  const [sel, setSel] = useState(tracking.currentIndex);
  const [dir, setDir] = useState<"l" | "r" | "">("");
  const [copied, copy] = useCopy();
  useEffect(() => setSel(tracking.currentIndex), [tracking.currentIndex]);

  const go = (i: number) => {
    if (i < 0 || i >= stages.length || i === sel) return;
    setDir(i < sel ? "l" : "r");
    setSel(i);
  };
  // The card never scrolls or crams. When a stage has more facts than the
  // front can show comfortably, the front keeps a short preview and the card
  // gets a back face ("All details") with every fact, like the calendar's
  // list face. Re-checked on stage change and resize.
  const tkRef = useRef<HTMLDivElement>(null);
  const tkfRef = useRef<HTMLDivElement>(null);
  const [heavy, setHeavy] = useState(false);
  // How much of the preview the front can still hold: 0 = two facts and the
  // button below, 1 = one fact with the button beside it, 2 = just the button.
  const [squeeze, setSqueeze] = useState(0);
  const [back, setBack] = useState(false);
  const [measureKey, setMeasureKey] = useState(0);
  useLayoutEffect(() => {
    setHeavy(false);
    setSqueeze(0);
    setBack(false);
  }, [sel, stages]);
  useLayoutEffect(() => {
    const el = tkfRef.current;
    if (!el || el.scrollHeight <= el.clientHeight + 1) return;
    if (!heavy) setHeavy(true);
    else if (squeeze < 2) setSqueeze((n) => n + 1);
  }, [heavy, squeeze, sel, stages, measureKey]);
  useEffect(() => {
    const el = tkRef.current;
    if (!el) return;
    // The card's size comes from the board grid (never from its content), so
    // re-measuring on every resize cannot loop. Fonts can also settle late.
    let alive = true;
    const remeasure = () => {
      if (!alive) return;
      setHeavy(false);
      setSqueeze(0);
      setMeasureKey((k) => k + 1);
    };
    const ro = new ResizeObserver(remeasure);
    ro.observe(el);
    void document.fonts?.ready.then(remeasure);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, []);
  const st = stages[sel];
  const color = st.tone === "alert" ? "#b4405a" : STAGE_COLORS[sel % STAGE_COLORS.length];
  const pill =
    st.statusText || (st.status === "done" ? "Done" : st.status === "current" ? "In progress" : "");
  const anim = `tkb-body ${dir}`;
  const nothingYet = stages.every((s) => s.status === "next");
  const ap = tracking.ap;
  const apAction =
    st.key === "result" && ap
      ? ap.saved
        ? "Open AP tracker"
        : ap.step
          ? "Record AP details"
          : null
      : null;
  const showBack = heavy && back;
  const preview = heavy ? st.facts.slice(0, Math.max(0, FRONT_PREVIEW - squeeze)) : st.facts;

  const factRows = (facts: typeof st.facts) =>
    facts.map((f) => (
      <div className="row" key={f.label}>
        <span>{f.label}</span>
        <b>
          {f.value}
          {f.copy && (
            <button
              type="button"
              className="cp"
              onClick={() => copy(f.value)}
              aria-label={`Copy ${f.label}`}
            >
              {copied === f.value ? "copied" : "copy"}
            </button>
          )}
        </b>
      </div>
    ));
  const extras = (st.note || st.links.length > 0 || apAction) && (
    <div className="tknow">
      {st.note && <span>{st.note}</span>}
      {apAction && (
        <button type="button" className="tkap" onClick={onApTracker}>
          {apAction}
          <Icon n="chev" size={11} />
        </button>
      )}
      {st.links.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
          {l.label}
          <Icon n="ext" size={11} />
        </a>
      ))}
    </div>
  );

  return (
    <div className={`tk${showBack ? " b" : ""}`} ref={tkRef} style={{ ["--sc" as string]: color }}>
      <div className="tkc f" aria-hidden={showBack}>
        <div className={`dt-h ${anim}`} key={`h${sel}`}>
          <div>
            <div className="eb">Case tracking</div>
            <h4 title={st.title}>{st.title}</h4>
          </div>
          <div className="col">
            <div className="tkpg">
              <button
                type="button"
                aria-label="Previous stage"
                disabled={sel === 0}
                onClick={() => go(sel - 1)}
              >
                <Icon n="chevL" size={14} />
              </button>
              <b>
                Stage {sel + 1} of {stages.length}
              </b>
              <button
                type="button"
                aria-label="Next stage"
                disabled={sel === stages.length - 1}
                onClick={() => go(sel + 1)}
              >
                <Icon n="chev" size={14} />
              </button>
            </div>
            {pill && (
              <span
                className={`dt-ok${st.tone === "alert" ? " r" : st.status === "current" ? " p" : ""}`}
              >
                {pill}
              </span>
            )}
          </div>
        </div>

        {st.date && (
          <div className={`dt-d ${anim}`} key={`d${sel}`}>
            <span className="big">{st.date.getDate()}</span>
            <div className="m">
              <b>
                {MONTHS_SHORT[st.date.getMonth()]} {st.date.getFullYear()},{" "}
                {WEEKDAYS_SHORT[st.date.getDay()]}
              </b>
            </div>
            <div className="rm">
              <b>{relativeDays(st.date, today)}</b>
            </div>
          </div>
        )}

        <div className="dt-ms" role="tablist" aria-label="Tracking stages">
          {stages.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === sel}
              className={`${s.status === "next" ? "n" : "d"}${i === sel ? " sel" : ""}`}
              style={{
                ["--tc" as string]:
                  s.tone === "alert" ? "#b4405a" : STAGE_COLORS[i % STAGE_COLORS.length],
              }}
              onClick={() => go(i)}
            >
              <i>{s.status === "done" ? "Done" : s.status === "current" ? "Now" : "Next"}</i>
              <b>{s.label}</b>
            </button>
          ))}
        </div>

        {nothingYet && (
          <p className="tkhint">
            Tracking fills in as you record your USCIS receipt number, NVC case, medical and
            interview dates on your roadmap. Each stage above lights up when its details are saved.
          </p>
        )}
        <div className={`tkf ${anim}`} key={`f${sel}`} ref={tkfRef}>
          {factRows(preview)}
          {heavy ? (
            <button type="button" className={`tkmore${squeeze === 1 ? " inl" : ""}`} onClick={() => setBack(true)}>
              {st.facts.length > preview.length
                ? `${st.facts.length - preview.length} more detail${st.facts.length - preview.length === 1 ? "" : "s"}`
                : "More details"}
              <Icon n="arrow" size={12} />
            </button>
          ) : (
            extras
          )}
        </div>

        {tracking.receipt && (
          <div className="dt-f">
            <div className="dt-r">
              <span className="ol">Receipt</span>
              <code>{tracking.receipt.number}</code>
              <button type="button" className="cp" onClick={() => copy(tracking.receipt!.number)}>
                {copied === tracking.receipt.number ? "copied" : "copy"}
              </button>
            </div>
            <div className="dt-a">
              {uscis.error ? (
                <span className="mu er" title={uscis.error}>
                  {uscis.error}
                </span>
              ) : (
                tracking.receipt.lastCheckedAt && (
                  <span className="mu">
                    checked {relativeDays(tracking.receipt.lastCheckedAt, today).toLowerCase()}
                  </span>
                )
              )}
              <button
                type="button"
                className="ck"
                onClick={uscis.check}
                disabled={uscis.checking}
                title={
                uscis.locked
                  ? "Live USCIS status is on Premium"
                  : tracking.receipt.lastCheckedAt
                    ? `Last checked ${relativeDays(tracking.receipt.lastCheckedAt, today).toLowerCase()}`
                    : undefined
              }
              >
                <Icon n={uscis.locked ? "lock" : "refresh"} size={11} />
                {uscis.checking ? "Checking" : "Check USCIS"}
              </button>
            </div>
          </div>
        )}
      </div>

      {heavy && (
        <div className="tkc b" aria-hidden={!showBack}>
          <div className="dt-h">
            <div>
              <div className="eb">Case tracking</div>
              <h4 title={st.title}>{st.label} details</h4>
            </div>
            <button type="button" className="tkbk" onClick={() => setBack(false)}>
              <Icon n="chevL" size={13} />
              Back
            </button>
          </div>
          <div className="tkf all">
            {factRows(st.facts)}
            {extras}
          </div>
        </div>
      )}
    </div>
  );
}
