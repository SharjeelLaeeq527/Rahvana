"use client";

// Reusable, presentational share-target picker for the upload modals.
// Renders a titled block of toggleable targets (either the user's other journeys, or the
// other candidates in this journey). Purely presentational: no business logic lives here -
// the caller decides what the targets are and how they map to the upload payload.
// See docs/IR5-DOCUMENT-VAULT-MULTI-CANDIDATE-PLAN.md (section 9).

export interface ShareTarget {
  id: string;
  label: string;
}

interface ShareTargetSelectorProps {
  title: string;
  description: string;
  targets: ShareTarget[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ShareTargetSelector({
  title,
  description,
  targets,
  selectedIds,
  onToggle,
}: ShareTargetSelectorProps) {
  if (targets.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-inner dark:border-slate-800/80 dark:bg-slate-800/40">
      <label className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
        {title}
      </label>
      <p className="mb-1 text-[11px] leading-normal text-slate-500">{description}</p>
      <div className="space-y-2.5 pt-1">
        {targets.map((target) => {
          const isChecked = selectedIds.includes(target.id);
          return (
            <div
              key={target.id}
              onClick={() => onToggle(target.id)}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all duration-300 select-none ${
                isChecked
                  ? "bg-primary/5 border-primary shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-300 ${
                    isChecked
                      ? "bg-primary border-primary scale-100 text-white"
                      : "border-slate-300 bg-transparent dark:border-slate-700"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="h-3.5 w-3.5 fill-none stroke-white stroke-[3]"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-xs font-bold transition-colors ${
                    isChecked
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {target.label}
                </span>
              </div>
              {isChecked && (
                <span className="text-primary bg-primary/10 animate-in fade-in zoom-in-95 rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase duration-200">
                  Shared
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
