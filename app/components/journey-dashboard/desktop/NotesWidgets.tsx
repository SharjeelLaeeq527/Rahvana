"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  NOTE_CATEGORIES,
  NOTE_COLORS,
  NOTE_MAX_LENGTH,
  noteCategoryLabel,
  type DashboardNote,
} from "@/lib/journey/dashboard/personal";
import type { DashboardPersonal } from "../useDashboardPersonal";
import { Icon } from "../icons";

export function formatNoteTime(ts: number, withTime = true): string {
  if (!ts) return "";
  const d = new Date(ts);
  const day =
    d.toDateString() === new Date().toDateString() ? "Today" : d.toLocaleDateString("en", { day: "numeric", month: "short" });
  return withTime ? `${day}, ${d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}` : day;
}

/** Undo bar after deleting a note. */
export function useUndoNote(personal: DashboardPersonal) {
  const [last, setLast] = useState<DashboardNote | null>(null);
  useEffect(() => {
    if (!last) return;
    const t = setTimeout(() => setLast(null), 5000);
    return () => clearTimeout(t);
  }, [last]);
  const remove = (id: string) => setLast(personal.removeNote(id));
  const toast = last ? (
    <div className="qn-toast on" role="status">
      <span>Note deleted</span>
      <button
        type="button"
        onClick={() => {
          personal.restoreNote(last);
          setLast(null);
        }}
      >
        Undo
      </button>
    </div>
  ) : null;
  return { remove, toast };
}

/** Light marker colour per note colour; the text stays ink-dark on top of it. */
const HIGHLIGHT: Record<string, string> = {
  "#0d9488": "#c3ece6",
  "#3b62a0": "#d3e2f8",
  "#6b4f93": "#e2d8f3",
  "#b4405a": "#f8d3db",
  "#d89a45": "#fbe3b4",
};

/** Category chip: coloured dot + label, text stays dark for legibility. */
function CatChip({ color, small }: { color: string; small?: boolean }) {
  return (
    <span className={`ncat${small ? " sm" : ""}`} style={{ ["--c" as string]: color }}>
      <i />
      {noteCategoryLabel(color)}
    </span>
  );
}

export function NotesTab({
  personal,
  open,
  setOpen,
  onOpenAll,
  onRemove,
}: {
  personal: DashboardPersonal;
  open: boolean;
  setOpen: (v: boolean) => void;
  onOpenAll: (id?: string) => void;
  onRemove: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const inp = useRef<HTMLInputElement>(null);
  const n = personal.notes.length;
  const add = () => {
    if (personal.addNote(text)) setText("");
    inp.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inp.current?.focus(), 480);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <section className={`card qn${open ? " open" : ""}`} aria-label="Quick notes">
      <button type="button" className="qn-tab" aria-label="Open notes" aria-expanded={open} tabIndex={open ? -1 : 0} onClick={() => setOpen(true)}>
        <span className="qn-ic">
          <Icon n="note" size={19} />
          {n > 0 && <em>{n}</em>}
        </span>
        <span className="qn-vt">Notes</span>
        <span className="qn-plus">
          <Icon n="plus" size={11} />
        </span>
      </button>
      <div className="qn-body" aria-hidden={!open}>
        <div className="qn-h">
          <span className="eb">Notes</span>
          {n > 0 && <span className="qn-n">{n}</span>}
          <span style={{ flex: 1 }} />
          <button type="button" className="qn-fold" aria-label="Collapse notes" onClick={() => setOpen(false)}>
            <Icon n="chev" size={13} />
          </button>
        </div>
        <div className="qn-in">
          <input
            ref={inp}
            value={text}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Take a note"
            aria-label="Take a note"
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              } else if (e.key === "Escape") inp.current?.blur();
            }}
          />
          <button type="button" aria-label="Save note" onClick={add}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V6M6 11l6-6 6 6" />
            </svg>
          </button>
        </div>
        <div className="qn-rows">
          {n === 0 ? (
            <div className="qn-empty">Type above and press Enter. Pick a category in the full view.</div>
          ) : (
            personal.notes.slice(0, 2).map((note) => (
              <div
                key={note.id}
                className="qn-r"
                role="button"
                tabIndex={0}
                style={{ ["--h" as string]: HIGHLIGHT[note.color] || "#c3ece6" }}
                onClick={() => onOpenAll(note.id)}
                onKeyDown={(e) => e.key === "Enter" && onOpenAll(note.id)}
              >
                <span>
                  <mark>{note.text}</mark>
                </span>
                <small>
                  {formatNoteTime(note.ts, false)}
                  {note.pinned && <Icon n="pinTack" size={10} className="pn" />}
                </small>
                <button
                  type="button"
                  className="rx"
                  aria-label="Delete note"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(note.id);
                  }}
                >
                  <Icon n="x" size={10} />
                </button>
              </div>
            ))
          )}
        </div>
        {n > 0 && (
          <button type="button" className="qn-more" onClick={() => onOpenAll()}>
            {n > 2 ? `+${n - 2} more, view all` : "Open notes"}
          </button>
        )}
      </div>
    </section>
  );
}

type Filter = { kind: "all" } | { kind: "pinned" } | { kind: "cat"; color: string };

/** Three-pane notes view: filters | list | the selected note. */
export function NotesModal({
  personal,
  focusId,
  onClose,
  onRemove,
}: {
  personal: DashboardPersonal;
  focusId?: string;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [text, setText] = useState("");
  const [newCat, setNewCat] = useState<string>(NOTE_COLORS[0]);
  const [selId, setSelId] = useState<string | null>(focusId ?? null);
  const [mounted, setMounted] = useState(false);
  const newRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    if (!mounted) return;
    if (focusId) bodyRef.current?.focus();
    else newRef.current?.focus();
  }, [mounted, focusId]);

  const all = personal.notes;
  const shown = useMemo(
    () =>
      all.filter(
        (n) =>
          (!q || n.text.toLowerCase().includes(q.toLowerCase())) &&
          (filter.kind === "all" || (filter.kind === "pinned" ? n.pinned : n.color === filter.color))
      ),
    [all, q, filter]
  );
  const selected = all.find((n) => n.id === selId) || shown[0] || null;

  if (!mounted) return null;

  const add = () => {
    const n = personal.addNote(text, newCat);
    if (n) {
      setText("");
      setQ("");
      setFilter({ kind: "all" });
      setSelId(n.id);
    }
    newRef.current?.focus();
  };
  const isFilter = (f: Filter) =>
    f.kind === filter.kind && (f.kind !== "cat" || (filter.kind === "cat" && filter.color === f.color));

  return createPortal(
    <div className="rvd-portal">
      <div className="nm" role="dialog" aria-modal="true" aria-labelledby="nm-t" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="nm-c">
          <div className="nm-h">
            <div>
              <h3 id="nm-t">Notes</h3>
              <p>
                {all.length} note{all.length === 1 ? "" : "s"}
              </p>
            </div>
            <label className="nm-s">
              <Icon n="search" size={14} />
              <input value={q} placeholder="Search notes" aria-label="Search notes" onChange={(e) => setQ(e.target.value)} />
            </label>
            <button type="button" className="nm-x" onClick={onClose} aria-label="Close">
              <Icon n="x" size={13} />
            </button>
          </div>

          <div className="nm-new">
            <input
              ref={newRef}
              value={text}
              maxLength={NOTE_MAX_LENGTH}
              placeholder="Take a note"
              aria-label="Take a note"
              autoComplete="off"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <div className="nm-cats" role="radiogroup" aria-label="Category for the new note">
              {NOTE_CATEGORIES.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  role="radio"
                  aria-checked={newCat === c.color}
                  className={`ncat${newCat === c.color ? " on" : ""}`}
                  style={{ ["--c" as string]: c.color }}
                  onClick={() => setNewCat(c.color)}
                >
                  <i />
                  {c.label}
                </button>
              ))}
            </div>
            <button type="button" className="nm-add" onClick={add} disabled={!text.trim()}>
              Add
            </button>
          </div>

          <div className="nm-b">
            <nav className="nm-side" aria-label="Filter notes">
              <button type="button" className={isFilter({ kind: "all" }) ? "on" : ""} onClick={() => setFilter({ kind: "all" })}>
                All notes<em>{all.length}</em>
              </button>
              <button type="button" className={isFilter({ kind: "pinned" }) ? "on" : ""} onClick={() => setFilter({ kind: "pinned" })}>
                Pinned<em>{all.filter((n) => n.pinned).length}</em>
              </button>
              <div className="nm-sl">Categories</div>
              {NOTE_CATEGORIES.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  className={isFilter({ kind: "cat", color: c.color }) ? "on" : ""}
                  style={{ ["--c" as string]: c.color }}
                  onClick={() => setFilter({ kind: "cat", color: c.color })}
                >
                  <i className="dot" />
                  {c.label}
                  <em>{all.filter((n) => n.color === c.color).length}</em>
                </button>
              ))}
              <p className="nm-tip">Colour = category. Choose one when you add a note.</p>
            </nav>

            <div className="nm-list">
              {shown.length === 0 ? (
                <p className="nm-e">{q ? `No notes match "${q}".` : all.length ? "No notes here yet." : "No notes yet. Add your first one above."}</p>
              ) : (
                shown.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`nm-li${selected?.id === n.id ? " on" : ""}`}
                    style={{ ["--c" as string]: n.color }}
                    onClick={() => setSelId(n.id)}
                  >
                    <i className="dot" />
                    <span>
                      <b>{n.text}</b>
                      <small>
                        {formatNoteTime(n.ts, false)}
                        <CatChip color={n.color} small />
                        {n.pinned && <Icon n="pinTack" size={11} className="pn" />}
                      </small>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="nm-d">
              {selected ? (
                <NoteDetail
                  key={selected.id}
                  note={selected}
                  bodyRef={bodyRef}
                  onChange={(patch) => personal.updateNote(selected.id, patch)}
                  onRemove={() => {
                    onRemove(selected.id);
                    setSelId(null);
                  }}
                />
              ) : (
                <p className="nm-e">Select a note to read or edit it.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function NoteDetail({
  note,
  bodyRef,
  onChange,
  onRemove,
}: {
  note: DashboardNote;
  bodyRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (patch: Partial<Pick<DashboardNote, "text" | "color" | "pinned">>) => void;
  onRemove: () => void;
}) {
  const [v, setV] = useState(note.text);
  return (
    <>
      <div className="nm-cats" role="radiogroup" aria-label="Category">
        {NOTE_CATEGORIES.map((c) => (
          <button
            key={c.color}
            type="button"
            role="radio"
            aria-checked={note.color === c.color}
            className={`ncat${note.color === c.color ? " on" : ""}`}
            style={{ ["--c" as string]: c.color }}
            onClick={() => onChange({ color: c.color })}
          >
            <i />
            {c.label}
          </button>
        ))}
      </div>
      <textarea
        ref={bodyRef}
        className="nm-ta"
        value={v}
        maxLength={NOTE_MAX_LENGTH}
        aria-label="Note"
        onChange={(e) => {
          setV(e.target.value);
          if (e.target.value.trim()) onChange({ text: e.target.value });
        }}
        onBlur={() => {
          if (!v.trim()) onRemove();
        }}
      />
      <div className="nm-f">
        <time>{formatNoteTime(note.ts)}</time>
        <button type="button" className={note.pinned ? "on" : ""} aria-label={note.pinned ? "Unpin" : "Pin"} title={note.pinned ? "Unpin" : "Pin"} onClick={() => onChange({ pinned: !note.pinned })}>
          <Icon n="pinTack" size={15} />
        </button>
        <button type="button" aria-label="Delete note" title="Delete" onClick={onRemove}>
          <Icon n="trash" size={15} />
        </button>
      </div>
    </>
  );
}
