"use client";

import { sanitizeHtml } from "@/lib/security/sanitize";
import type { HTMLAttributes } from "react";

interface SafeHtmlProps extends HTMLAttributes<HTMLDivElement> {
  html: string | null | undefined;
  as?: "div" | "span" | "p";
}

export function SafeHtml({ html, as: Tag = "div", className, ...rest }: SafeHtmlProps) {
  const sanitized = sanitizeHtml(html);
  if (!sanitized) return null;

  return (
    <Tag
      {...rest}
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
