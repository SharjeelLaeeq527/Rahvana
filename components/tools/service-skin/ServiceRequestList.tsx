"use client";

/**
 * Clean request list for the service "My requests" pages (Consultation, Translation).
 * Presentational only: each page maps its own rows to items and keeps its own data,
 * filters and actions. A row with `onOpen` is a button (e.g. Translation opens the detail
 * page); `children` render under the row (e.g. Consultation notes / alternative times).
 */

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

/** Colour of the small status dot. */
export type RequestTone = "neutral" | "waiting" | "progress" | "attention" | "done";

export interface ServiceRequestItem {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  status: { label: string; tone: RequestTone };
  onOpen?: () => void;
  openLabel?: string;
  children?: ReactNode;
}

function RowBody({ item }: { item: ServiceRequestItem }) {
  return (
    <>
      <span className="svk-rl-text">
        <b>{item.title}</b>
        {item.subtitle && <span>{item.subtitle}</span>}
        {item.meta && <small>{item.meta}</small>}
      </span>
      <span className="svk-rl-status" data-tone={item.status.tone}>
        {item.status.label}
      </span>
      {item.onOpen && <ChevronRight className="svk-rl-chev" aria-hidden="true" />}
    </>
  );
}

export default function ServiceRequestList({ items }: { items: ServiceRequestItem[] }) {
  return (
    <ul className="svk-rl">
      {items.map((item) => (
        <li key={item.id} className="svk-rl-item">
          {item.onOpen ? (
            <button
              type="button"
              className="svk-rl-main"
              onClick={item.onOpen}
              aria-label={item.openLabel}
            >
              <RowBody item={item} />
            </button>
          ) : (
            <div className="svk-rl-main">
              <RowBody item={item} />
            </div>
          )}
          {item.children && <div className="svk-rl-extra">{item.children}</div>}
        </li>
      ))}
    </ul>
  );
}

/** Calm empty state: dashed outline, one line of text, one action. */
export function ServiceRequestEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="svk-empty">
      <b>{title}</b>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}
