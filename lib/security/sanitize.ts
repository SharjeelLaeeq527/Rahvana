import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes HTML while allowing only standard safe HTML elements/attributes.
 * DOMPurify automatically removes scripts, event handlers, javascript: URLs, etc.
 */
const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
} as const;

//Sanitize untrusted HTML before rendering it with dangerouslySetInnerHTML.
export function sanitizeHtml(
  html: string | null | undefined
): string {
  if (!html) {
    return "";
  }

  // Force a plain string in case DOMPurify returns TrustedHTML.
  return String(DOMPurify.sanitize(html, SANITIZE_CONFIG));
}

/**
 * Escape plain user-provided text when it must be represented as HTML.
 * Use this when the value should be displayed as text, not interpreted as HTML.
 */
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