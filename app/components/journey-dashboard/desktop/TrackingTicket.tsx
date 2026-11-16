"use client";

import { useEffect, useState } from "react";
import type { DashboardTracking } from "@/lib/journey/dashboard/types";
import { relativeDays } from "@/lib/journey/dashboard/buildDashboardModel";
import { Icon } from "../icons";
import type { UscisLiveCheck } from "../useUscisLiveCheck";
import { MONTHS_SHORT, WEEKDAYS_SHORT } from "./palette";

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
  const st = stages[sel];
  const color = st.tone === "alert" ? "#b4405a" : STAGE_COLORS[sel % STAGE_COLORS.length];
  const pill =
    st.statusText || (st.status === "done" ? "Done" : st.status === "current" ? "In progress" : "");
  const anim = `tkb-body ${dir}`;
  const nothingYet = stages.every((s) => s.status === "next");
  const ap = tracking.ap;
  const apAction =
    st.key === "result" && ap ? (ap.saved ? "Open AP tracker" : ap.step ? "Record AP details" : null) : null;

  return (
    <div className="tk" style={{ ["--sc" as string]: color }}>
      <div className={`dt-h ${anim}`} key={`h${sel}`}>
        <div>
          <div className="eb">Case tracking</div>
          <h4>{st.title}</h4>
        </div>
        <div className="col">
          <div className="tkpg">
            <button type="button" aria-label="Previous stage" disabled={sel === 0} onClick={() => go(sel - 1)}>
              <Icon n="chevL" size={14} />
            </button>
            <b>
              Stage {sel + 1} of {stages.length}
            </b>
            <button type="button" aria-label="Next stage" disabled={sel === stages.length - 1} onClick={() => go(sel + 1)}>
              <Icon n="chev" size={14} />
            </button>
          </div>
          {pill && <span className={`dt-ok${st.tone === "alert" ? " r" : st.status === "current" ? " p" : ""}`}>{pill}</span>}
        </div>
      </div>

      {st.date && (
        <div className={`dt-d ${anim}`} key={`d${sel}`}>
          <span className="big">{st.date.getDate()}</span>
          <div className="m">
            <b>
              {MONTHS_SHORT[st.date.getMonth()]} {st.date.getFullYear()}, {WEEKDAYS_SHORT[st.date.getDay()]}
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
            style={{ ["--tc" as string]: s.tone === "alert" ? "#b4405a" : STAGE_COLORS[i % STAGE_COLORS.length] }}
            onClick={() => go(i)}
          >
            <i>{s.status === "done" ? "Done" : s.status === "current" ? "Now" : "Next"}</i>
            <b>{s.label}</b>
          </button>
        ))}
      </div>

      {nothingYet && (
        <p className="tkhint">
          Tracking fills in as you record your USCIS receipt number, NVC case, medical and interview dates on your
          roadmap. Each stage above lights up when its details are saved.
        </p>
      )}
      <div className={`tkf ${anim}`} key={`f${sel}`}>
        {st.facts.map((f) => (
          <div className="row" key={f.label}>
            <span>{f.label}</span>
            <b>
              {f.value}
              {f.copy && (
                <button type="button" className="cp" onClick={() => copy(f.value)} aria-label={`Copy ${f.label}`}>
                  {copied === f.value ? "copied" : "copy"}
                </button>
              )}
            </b>
          </div>
        ))}
        {(st.note || st.links.length > 0 || apAction) && (
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
                <span className="mu">checked {relativeDays(tracking.receipt.lastCheckedAt, today).toLowerCase()}</span>
              )
            )}
            <button
              type="button"
              className="ck"
              onClick={uscis.check}
              disabled={uscis.checking}
              title={uscis.locked ? "Live USCIS status is on Premium" : undefined}
            >
              <Icon n={uscis.locked ? "lock" : "refresh"} size={11} />
              {uscis.checking ? "Checking" : "Check USCIS"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
