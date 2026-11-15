"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardKeyDate } from "@/lib/journey/dashboard/types";
import {
  EVENT_NOTE_MAX,
  EVENT_TITLE_MAX,
  NOTE_COLORS,
  toDayString,
  type DashboardEvent,
} from "@/lib/journey/dashboard/personal";
import { daysBetween, startOfDay } from "@/lib/journey/dashboard/buildDashboardModel";
import { Icon } from "../icons";
import { MONTHS_LONG, MONTHS_SHORT } from "./palette";

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function CalendarCard({
  keyDates,
  today,
  onAddEvent,
  onDeleteEvent,
  storageKey,
}: {
  keyDates: DashboardKeyDate[];
  today: Date;
  onAddEvent: (e: Omit<DashboardEvent, "id">) => void;
  onDeleteEvent: (id: string) => void;
  storageKey: string;
}) {
  const [cm, setCm] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [face, setFace] = useState<"f" | "b">("f");
  const [adding, setAdding] = useState<string | null>(null); // prefilled day
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "b") setFace("b");
    } catch {
      /* ignore */
    }
  }, [storageKey]);
  const flip = (f: "f" | "b") => {
    setFace(f);
    try {
      localStorage.setItem(storageKey, f);
    } catch {
      /* ignore */
    }
  };

  const y = cm.getFullYear();
  const m = cm.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  const rows = Math.ceil((offset + count) / 7);
  const isOff = y !== today.getFullYear() || m !== today.getMonth();

  const cells = useMemo(() => {
    const out: { d: Date; out: boolean }[] = [];
    for (let i = offset; i > 0; i--) out.push({ d: new Date(y, m, 1 - i), out: true });
    for (let d = 1; d <= count; d++) out.push({ d: new Date(y, m, d), out: false });
    while (out.length < rows * 7) out.push({ d: new Date(y, m, count + (out.length - offset - count) + 1), out: true });
    return out;
  }, [y, m, offset, count, rows]);

  const t0 = startOfDay(today);
  const upcoming = keyDates.filter((k) => k.date >= t0);
  const past = keyDates.filter((k) => k.date < t0).reverse();
  const strip = [...upcoming, ...past].slice(0, 3);

  return (
    <section className={`card cl${face === "b" ? " b" : ""}${adding !== null ? " ae-on" : ""}`} id="cl">
      <div className="fl">
        <div className="cf f" aria-hidden={face === "b"}>
          <div className="hd ch">
            <span className="ico" style={{ background: "var(--blue)", color: "#3b62a0" }}>
              <Icon n="cal" size={15} />
            </span>
            <b className="mt">
              {MONTHS_LONG[m]}
              <span> {y}</span>
            </b>
            <span className="sp" />
            {isOff && (
              <button type="button" className="cb td2" onClick={() => setCm(new Date(today.getFullYear(), today.getMonth(), 1))}>
                Today
              </button>
            )}
            <button type="button" className="cb r" aria-label="Previous month" onClick={() => setCm(new Date(y, m - 1, 1))}>
              <Icon n="chevL" size={14} />
            </button>
            <button type="button" className="cb r" aria-label="Next month" onClick={() => setCm(new Date(y, m + 1, 1))}>
              <Icon n="chev" size={14} />
            </button>
            <button type="button" className="cb r add" aria-label="Add event" title="Add event" onClick={() => setAdding(toDayString(isOff ? cm : today))}>
              <Icon n="plus" size={14} />
            </button>
            <button type="button" className="cb r" aria-label="Show key dates list" title="Key dates" onClick={() => flip("b")}>
              <Icon n="list" size={14} />
            </button>
          </div>
          <div className="cg" style={{ ["--r" as string]: rows }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <small key={d}>{d}</small>
            ))}
            {cells.map(({ d, out }) => {
              const evs = keyDates.filter((k) => sameDay(k.date, d));
              const td = sameDay(d, today);
              const wd = (d.getDay() + 6) % 7;
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  className={`dc${td ? " td" : ""}${wd > 4 ? " we" : ""}${out ? " out" : ""}`}
                  style={evs[0] ? { ["--c" as string]: evs[0].color } : undefined}
                  title={evs.length ? evs.map((e) => e.title + (e.detail ? ", " + e.detail : "")).join("\n") : undefined}
                  aria-label={`${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}${evs.length ? ", " + evs.map((e) => e.title).join(", ") : ""}, add event`}
                  onClick={() => setAdding(toDayString(d))}
                >
                  <span className={evs.length ? "ev" : ""}>{d.getDate()}</span>
                  {evs.length > 0 && !td && <u />}
                </button>
              );
            })}
          </div>
          {strip.length === 0 && (
            <p className="kc-e">
              Key dates such as your interview and medical show up here once they are saved in your roadmap. Click any
              day to add your own.
            </p>
          )}
          {strip.length > 0 && (
            <div className="kc">
              {strip.map((e) => {
                const n = daysBetween(today, e.date);
                const rel = n > 0 ? `in ${n} day${n > 1 ? "s" : ""}` : n === 0 ? "today" : "passed";
                return (
                  <button
                    key={e.id}
                    type="button"
                    style={{ ["--c" as string]: e.color }}
                    onClick={() => setCm(new Date(e.date.getFullYear(), e.date.getMonth(), 1))}
                  >
                    <b>
                      {e.date.getDate()} {MONTHS_SHORT[e.date.getMonth()]}
                    </b>
                    <span>{e.title}</span>
                    <small>{rel}</small>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="cf b" aria-hidden={face === "f"}>
          <div className="hd ch">
            <span className="ico" style={{ background: "var(--blue)", color: "#3b62a0" }}>
              <Icon n="cal" size={15} />
            </span>
            <b className="mt">Key dates</b>
            <span className="sp" />
            <button type="button" className="cb r add" aria-label="Add event" onClick={() => setAdding(toDayString(today))}>
              <Icon n="plus" size={14} />
            </button>
            <button type="button" className="cb r" aria-label="Show calendar" onClick={() => flip("f")}>
              <Icon n="cal" size={14} />
            </button>
          </div>
          <div className="kl">
            {[...keyDates]
              .reverse()
              .flatMap((e, i, arr) => {
                const row = (
                  <div
                    key={e.id}
                    className={`kr${e.date < t0 ? " past" : ""}`}
                    style={{ ["--c" as string]: e.color }}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setCm(new Date(e.date.getFullYear(), e.date.getMonth(), 1));
                      flip("f");
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") {
                        setCm(new Date(e.date.getFullYear(), e.date.getMonth(), 1));
                        flip("f");
                      }
                    }}
                  >
                    <div className="dp">
                      <i>{MONTHS_SHORT[e.date.getMonth()].toUpperCase()}</i>
                      <b>{e.date.getDate()}</b>
                    </div>
                    <div className="kt">
                      <strong>{e.title}</strong>
                      <small>
                        {e.detail || (e.custom ? "Your event" : "")}
                        {e.date.getFullYear() !== today.getFullYear() ? ` ${e.date.getFullYear()}` : ""}
                      </small>
                    </div>
                    {e.custom && (
                      <button
                        type="button"
                        className="kx"
                        aria-label={`Delete ${e.title}`}
                        title="Delete event"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDeleteEvent(e.id);
                        }}
                      >
                        <Icon n="x" size={12} />
                      </button>
                    )}
                  </div>
                );
                // Insert the "Today" row between future and past dates.
                const isFirstPast = e.date < t0 && (i === 0 || arr[i - 1].date >= t0);
                return isFirstPast ? [<TodayRow key="today" today={today} />, row] : [row];
              })
              .concat(keyDates.every((k) => k.date >= t0) ? [<TodayRow key="today" today={today} />] : [])}
          </div>
        </div>
      </div>

      {adding !== null && (
        <AddEvent
          day={adding}
          onClose={() => setAdding(null)}
          onSave={(e) => {
            onAddEvent(e);
            const [yy, mm] = e.day.split("-").map(Number);
            setCm(new Date(yy, mm - 1, 1));
            setAdding(null);
          }}
        />
      )}
    </section>
  );
}

function TodayRow({ today }: { today: Date }) {
  return (
    <div className="kr on">
      <div className="dp">
        <i>{MONTHS_SHORT[today.getMonth()].toUpperCase()}</i>
        <b>{today.getDate()}</b>
      </div>
      <div className="kt">
        <strong>Today</strong>
        <small>You are here</small>
      </div>
    </div>
  );
}

function AddEvent({
  day,
  onClose,
  onSave,
}: {
  day: string;
  onClose: () => void;
  onSave: (e: Omit<DashboardEvent, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(day);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState<string>(NOTE_COLORS[0]);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);
  const ok = title.trim() && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const save = () => {
    if (!ok) return;
    onSave({ title: title.trim(), day: date, time: time || undefined, note: note.trim() || undefined, color });
  };
  return (
    <div
      className="ae"
      role="dialog"
      aria-label="Add event"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        else if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") save();
      }}
    >
      <div className="hd" style={{ margin: 0 }}>
        <b style={{ fontSize: 16, fontWeight: 500 }}>Add event</b>
        <span className="sp" />
        <button type="button" className="cb r" onClick={onClose} aria-label="Close">
          <Icon n="x" size={12} />
        </button>
      </div>
      <label>
        <span>Title</span>
        <input ref={titleRef} value={title} maxLength={EVENT_TITLE_MAX} autoComplete="off" placeholder="e.g. Collect police certificate" onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="r2">
        <label>
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>
            Time<em>optional</em>
          </span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <label>
        <span>
          Note<em>optional</em>
        </span>
        <input value={note} maxLength={EVENT_NOTE_MAX} autoComplete="off" placeholder="Where, who, what to bring" onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="sws">
        {NOTE_COLORS.map((c) => (
          <button key={c} type="button" style={{ ["--c" as string]: c }} aria-label={`Colour ${c}`} aria-pressed={c === color} className={c === color ? "on" : ""} onClick={() => setColor(c)} />
        ))}
      </div>
      <button type="button" className="aes" disabled={!ok} onClick={save}>
        Save event
      </button>
    </div>
  );
}
