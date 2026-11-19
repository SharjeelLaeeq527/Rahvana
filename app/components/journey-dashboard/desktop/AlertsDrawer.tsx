"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DashboardAlert } from "@/lib/journey/dashboard/types";
import { Icon } from "../icons";

export function alertsHeadline(n: number) {
  return n ? `${n} thing${n > 1 ? "s" : ""} need${n > 1 ? "" : "s"} you` : "All clear";
}

export function AlertsDrawer({
  alerts,
  openId,
  onClose,
  onGo,
  onDismiss,
}: {
  alerts: DashboardAlert[];
  openId: string | null;
  onClose: () => void;
  onGo: (a: DashboardAlert) => void;
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(openId);
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => setExpanded(openId), [openId]);
  if (!mounted) return null;

  const blocking = alerts.filter((a) => a.level === "blocking");
  const checks = alerts.filter((a) => a.level === "check");

  const row = (a: DashboardAlert) => {
    const o = expanded === a.id;
    return (
      <div key={a.id} className={`na-r${o ? " o" : ""}`}>
        <button type="button" className="na-h" aria-expanded={o} onClick={() => setExpanded(o ? null : a.id)}>
          <span className={`na-i ${a.level === "blocking" ? "b" : "w"}`}>
            {a.level === "blocking" ? "!" : <Icon n="alert" size={18} />}
          </span>
          <span className="na-t">
            <b>{a.title}</b>
            <small>{a.where}</small>
          </span>
          <span className="na-c">
            <Icon n="chev" size={18} />
          </span>
        </button>
        {o && (
          <div className="na-x">
            {a.detail && <p>{a.detail}</p>}
            {a.fix && (
              <div className="na-f">
                <i>How to fix</i>
                <span>{a.fix}</span>
              </div>
            )}
            <div className="na-a">
              <button type="button" className="na-go" onClick={() => onGo(a)}>
                {a.kind === "score-drop" ? "Open breakdown" : "Go to step"}
              </button>
              <button type="button" className="na-fx" onClick={() => onDismiss(a.id)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="rvd-portal">
      <div className="sc2 on" data-scroll-lock onClick={onClose} />
      <aside className="dr on" role="dialog" aria-modal="true" aria-label="Things that need you">
        <button type="button" className="x" onClick={onClose} aria-label="Close">
          <Icon n="x" size={14} />
        </button>
        <div className="na">
          <div className="na-eb">Needs you</div>
          <h2>{alertsHeadline(alerts.length)}</h2>
          <div className="na-bar" role="img" aria-label={`${blocking.length} blocking, ${checks.length} to check`}>
            {blocking.length > 0 && <span style={{ flex: blocking.length, background: "#b4405a" }} />}
            {checks.length > 0 && <span style={{ flex: checks.length, background: "#d89a45" }} />}
            {alerts.length === 0 && <span style={{ flex: 1, background: "#0d9488" }} />}
          </div>
          {alerts.length > 0 && (
            <div className="na-lg">
              {blocking.length > 0 && <span style={{ color: "#b4405a" }}>{blocking.length} blocking</span>}
              {checks.length > 0 && <span style={{ color: "#b9822f" }}>{checks.length} to check</span>}
            </div>
          )}
          {blocking.length > 0 && (
            <>
              <div className="na-sec">
                <b style={{ color: "#b4405a" }}>Blocking</b>, clear these first
              </div>
              {blocking.map(row)}
            </>
          )}
          {checks.length > 0 && (
            <>
              <div className="na-sec">
                <b style={{ color: "#b9822f" }}>To check</b>, these can slow you down
              </div>
              {checks.map(row)}
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
