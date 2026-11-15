"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DASHBOARD_DISMISSED_KEY,
  DASHBOARD_EVENTS_KEY,
  DASHBOARD_NOTES_KEY,
  DISMISSED_MAX,
  EVENTS_MAX,
  NOTE_COLORS,
  NOTE_MAX_LENGTH,
  NOTES_MAX,
  newPersonalId,
  parseDismissed,
  parseEvents,
  parseNotes,
  sortNotes,
  type DashboardEvent,
  type DashboardNote,
} from "@/lib/journey/dashboard/personal";

type UpdateMetadata = (patch: Record<string, unknown>) => unknown;

const SAVE_DELAY_MS = 600;

/**
 * Notes, custom events and dismissed alerts for ONE journey row (`backendId`).
 * Local state is the source while the page is open; changes are written back to
 * the journey's case_data with a short debounce. Switching journey/candidate
 * changes `backendId`, which flushes pending writes and reloads from metadata.
 */
export function useDashboardPersonal(
  backendId: string | null | undefined,
  metadata: Record<string, unknown> | undefined,
  updateMetadata: UpdateMetadata
) {
  const [notes, setNotes] = useState<DashboardNote[]>(() => parseNotes(metadata?.[DASHBOARD_NOTES_KEY]));
  const [events, setEvents] = useState<DashboardEvent[]>(() => parseEvents(metadata?.[DASHBOARD_EVENTS_KEY]));
  const [dismissed, setDismissed] = useState<string[]>(() =>
    parseDismissed(metadata?.[DASHBOARD_DISMISSED_KEY])
  );

  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateRef = useRef(updateMetadata);
  updateRef.current = updateMetadata;
  const loadedFor = useRef<string | null | undefined>(backendId);
  const metaRef = useRef(metadata);
  metaRef.current = metadata;

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length) {
      Promise.resolve(updateRef.current(patch)).catch((err) =>
        console.error("[JourneyDashboard] Saving dashboard notes/events failed:", err)
      );
    }
  }, []);

  const queue = useCallback(
    (key: string, value: unknown) => {
      pending.current[key] = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush]
  );

  // Journey switch: save what is pending for the old journey, load the new one.
  // Also picks up the values once the journey's metadata first arrives.
  useEffect(() => {
    const md = metaRef.current;
    if (loadedFor.current !== backendId) {
      flush();
      loadedFor.current = backendId;
    } else if (Object.keys(pending.current).length) {
      return; // local edits not saved yet: keep them
    }
    setNotes(parseNotes(md?.[DASHBOARD_NOTES_KEY]));
    setEvents(parseEvents(md?.[DASHBOARD_EVENTS_KEY]));
    setDismissed(parseDismissed(md?.[DASHBOARD_DISMISSED_KEY]));
    // Re-read when the stored values change (e.g. loaded from the server).
  }, [
    backendId,
    flush,
    metadata?.[DASHBOARD_NOTES_KEY],
    metadata?.[DASHBOARD_EVENTS_KEY],
    metadata?.[DASHBOARD_DISMISSED_KEY],
  ]);

  // Save on unmount / tab close.
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, [flush]);

  const writeNotes = useCallback(
    (next: DashboardNote[]) => {
      setNotes(next);
      queue(DASHBOARD_NOTES_KEY, next);
    },
    [queue]
  );
  const writeEvents = useCallback(
    (next: DashboardEvent[]) => {
      setEvents(next);
      queue(DASHBOARD_EVENTS_KEY, next);
    },
    [queue]
  );

  const addNote = useCallback(
    (text: string, color: string = NOTE_COLORS[0]): DashboardNote | null => {
      const t = text.trim().slice(0, NOTE_MAX_LENGTH);
      if (!t) return null;
      const n: DashboardNote = {
        id: newPersonalId("n"),
        text: t,
        color: (NOTE_COLORS as readonly string[]).includes(color) ? color : NOTE_COLORS[0],
        ts: Date.now(),
        pinned: false,
      };
      writeNotes([n, ...notes].slice(0, NOTES_MAX));
      return n;
    },
    [notes, writeNotes]
  );
  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<DashboardNote, "text" | "color" | "pinned">>) => {
      writeNotes(
        notes.map((n) =>
          n.id === id
            ? { ...n, ...patch, text: patch.text !== undefined ? patch.text.slice(0, NOTE_MAX_LENGTH) : n.text }
            : n
        )
      );
    },
    [notes, writeNotes]
  );
  const removeNote = useCallback(
    (id: string): DashboardNote | null => {
      const n = notes.find((x) => x.id === id) || null;
      if (n) writeNotes(notes.filter((x) => x.id !== id));
      return n;
    },
    [notes, writeNotes]
  );
  const restoreNote = useCallback(
    (n: DashboardNote) => writeNotes([n, ...notes.filter((x) => x.id !== n.id)].slice(0, NOTES_MAX)),
    [notes, writeNotes]
  );

  const addEvent = useCallback(
    (e: Omit<DashboardEvent, "id">) =>
      writeEvents([...events, { ...e, id: newPersonalId("e") }].slice(-EVENTS_MAX)),
    [events, writeEvents]
  );
  const removeEvent = useCallback(
    (id: string) => writeEvents(events.filter((e) => e.id !== id)),
    [events, writeEvents]
  );

  const dismissAlert = useCallback(
    (id: string) => {
      if (dismissed.includes(id)) return;
      const next = [...dismissed, id].slice(-DISMISSED_MAX);
      setDismissed(next);
      queue(DASHBOARD_DISMISSED_KEY, next);
    },
    [dismissed, queue]
  );

  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);

  return {
    notes: sortedNotes,
    events,
    dismissed,
    addNote,
    updateNote,
    removeNote,
    restoreNote,
    addEvent,
    removeEvent,
    dismissAlert,
  };
}

export type DashboardPersonal = ReturnType<typeof useDashboardPersonal>;
