"use client";

import createDOMPurify from "dompurify";

const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
} as const;

const DOMPurify =
  typeof window !== "undefined"
    ? createDOMPurify(window)
    : null;

export function sanitizeHtml(
  html: string | null | undefined
): string {
  if (!html || !DOMPurify) {
    return "";
  }

  return String(DOMPurify.sanitize(html, SANITIZE_CONFIG));
}

export function escapeHtml(
  text: string | null | undefined
): string {
  if (!text) {
    return "";
  }

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}