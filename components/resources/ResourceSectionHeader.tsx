import type { ReactNode } from "react";

/**
 * Section heading in the Resources catalog ("My Tools", "Browse Guides"...). Serif title in the
 * tool-layout ink, optional item count, subtitle, and an optional actions slot on the right
 * (filters). Padding is left to the caller so it lines up with the grid below it.
 */
export default function ResourceSectionHeader({
  title,
  subtitle,
  count,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className ?? ""}`}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight text-[#16302C] md:text-[28px]">
          {title}
          {typeof count === "number" && (
            <span className="font-sans text-base font-normal text-[#16302C]/40 tabular-nums">
              {count}
            </span>
          )}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-[#16302C]/60">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
