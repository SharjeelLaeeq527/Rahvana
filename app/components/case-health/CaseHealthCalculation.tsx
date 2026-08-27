"use client";

/**
 * CaseHealthCalculation — the shared "Understanding Case Health" explainer body.
 *
 * This is the single source of truth for how the Case Health score is explained
 * to the user: the score-breakdown cards, the "How It's Calculated" copy, the
 * ingredient descriptions, the formula pills, and the live worked example that
 * shows the user's own numbers adding up to their score.
 *
 * Both dashboards (V2 / IR-1 spouse and V3 / IR-5 parent — and every future
 * visa category) render THIS component inside their score modal instead of
 * keeping parallel copies. That keeps the explainer identical everywhere and
 * makes new categories free: pass the four sub-scores and it renders correctly.
 *
 * Weights come from `CASE_SCORE_WEIGHTS` (the same constant the scoring engine
 * uses), so the percentages shown here can never drift from the real math. If a
 * category ever needs different weights, pass them via the `weights` prop.
 *
 * The "weighted" (4-ingredient) layout renders only when BOTH completenessScore
 * and riskPenalty are provided. Omit them → the legacy 2-analysis layout.
 */

import React from "react";
import { CheckCircle2, AlertTriangle, FileCheck, Shield, AlertCircle } from "lucide-react";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { CASE_SCORE_WEIGHTS } from "@/lib/case-strength";

export interface CaseHealthCalculationWeights {
  evidence: number;
  consistency: number;
  completeness: number;
  risk: number;
}

export interface CaseHealthCalculationProps {
  /** Final 0–100 Case Health score. */
  overallScore: number;
  /** Evidence sub-score (0–100). */
  evidenceScore?: number;
  /** Consistency sub-score (0–100). */
  consistencyScore?: number;
  /**
   * Completeness sub-score (0–100). Presence of this OR riskPenalty switches the
   * explainer into the weighted 4-ingredient layout.
   */
  completenessScore?: number;
  /** Risk penalty (0–100, higher = more risk). */
  riskPenalty?: number;
  /** Ingredient weights (0–1 each). Defaults to the engine's CASE_SCORE_WEIGHTS. */
  weights?: CaseHealthCalculationWeights;
}

/** Format a 0–1 weight as a whole-number percent string, e.g. 0.4 → "40%". */
const pct = (w: number) => `${Math.round(w * 100)}%`;

export function CaseHealthCalculation({
  overallScore,
  evidenceScore,
  consistencyScore,
  completenessScore,
  riskPenalty,
  weights = CASE_SCORE_WEIGHTS,
}: CaseHealthCalculationProps) {
  const isWeighted = completenessScore !== undefined || riskPenalty !== undefined;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
      {/* Score Cards */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Your Score Breakdown
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Case Health */}
          <div className="rounded-2xl border border-[#0d7377]/15 bg-[#0d7377]/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-[#0d7377]" />
              <span className="text-sm font-semibold text-slate-700">Case Health</span>
            </div>

            <div className="text-4xl font-black text-[#0d7377]">{overallScore}</div>

            <div className="text-xs text-slate-500 mt-1">Overall Score</div>
          </div>

          {/* Evidence */}
          <div className="rounded-2xl border border-[#cfe8e9] bg-[#f8fcfc] p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck size={16} className="text-[#0d7377]" />
              <span className="text-sm font-semibold text-slate-700">Evidence Analysis</span>
            </div>

            <div className="text-4xl font-black text-slate-800">{evidenceScore ?? ""}</div>

            <div className="text-xs text-slate-500 mt-1">Document Strength</div>
          </div>

          {/* Consistency */}
          <div className="rounded-2xl border border-[#e4d7e9] bg-[#faf8fc] p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-[#9a6b96]" />
              <span className="text-sm font-semibold text-slate-700">Consistency Analysis</span>
            </div>

            <div className="text-4xl font-black text-slate-800">{consistencyScore ?? ""}</div>

            <div className="text-xs text-slate-500 mt-1">Information Accuracy</div>
          </div>

          {/* Completeness (weighted model only) */}
          {completenessScore !== undefined && (
            <div className="rounded-2xl border border-[#cfe8e9] bg-[#f8fcfc] p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-[#0d7377]" />
                <span className="text-sm font-semibold text-slate-700">Completeness</span>
              </div>

              <div className="text-4xl font-black text-slate-800">{completenessScore}</div>

              <div className="text-xs text-slate-500 mt-1">Checklist Filled</div>
            </div>
          )}

          {/* Risk flags (weighted model only) — a penalty, so higher = worse */}
          {riskPenalty !== undefined && (
            <div className="rounded-2xl border border-[#f0d9d9] bg-[#fdf8f8] p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-[#c26b6b]" />
                <span className="text-sm font-semibold text-slate-700">Risk Flags</span>
              </div>

              <div className="text-4xl font-black text-slate-800">
                {riskPenalty > 0 ? `−${riskPenalty}` : "0"}
              </div>

              <div className="text-xs text-slate-500 mt-1">Penalty Applied</div>
            </div>
          )}
        </div>
      </div>

      {/* Calculation */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          How It&apos;s Calculated
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {isWeighted ? (
            <>
              Your Case Health score is a quality meter, a weighted average of four things: your{" "}
              <strong>evidence strength</strong> ({pct(weights.evidence)}),{" "}
              <strong>consistency</strong> ({pct(weights.consistency)}),{" "}
              <strong>completeness</strong> ({pct(weights.completeness)}), and a{" "}
              <strong>risk-flag penalty</strong> ({pct(weights.risk)}). It reflects how strong your
              case looks right now, not any deadline.
            </>
          ) : (
            <>
              Your Case Health score is built from two equally-weighted analyses. Each one examines a
              different dimension of your case, and together they produce a single 0-100 score that
              reflects your overall readiness.
            </>
          )}
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#0d7377] mt-2 shrink-0" />

              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  Evidence Analysis ({isWeighted ? pct(weights.evidence) : "50%"})
                </h4>

                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Evaluates the strength, completeness, and relevance of documents and supporting
                  evidence available within your Rahvana case journey.
                </p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileCheck size={11} className="text-[#0d7377] shrink-0" />
                    <span>Checks which required documents are uploaded vs. missing</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileCheck size={11} className="text-[#0d7377] shrink-0" />
                    <span>Assesses document relevance and coverage for your visa category</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileCheck size={11} className="text-[#0d7377] shrink-0" />
                    <span>Scores evidence strength from incomplete to comprehensive</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#9a6b96] mt-2 shrink-0" />

              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  Consistency Analysis ({isWeighted ? pct(weights.consistency) : "50%"})
                </h4>

                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Reviews dates, personal details, relationships, timelines, and information entered
                  throughout your journey to identify inconsistencies and potential issues.
                </p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={11} className="text-[#9a6b96] shrink-0" />
                    <span>Cross-checks dates and timelines across all entered data</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={11} className="text-[#9a6b96] shrink-0" />
                    <span>Detects conflicting personal details or relationship info</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={11} className="text-[#9a6b96] shrink-0" />
                    <span>Flags contradictions between documents and questionnaire answers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completeness (weighted model only) */}
          {isWeighted && (
            <div className="p-4 rounded-2xl border border-border bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#0d7377] mt-2 shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    Completeness ({pct(weights.completeness)})
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Of all the documents required for your visa category, how many you have actually
                    provided so far. Counts only what you&apos;ve added, not pre-filled placeholders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Risk flags (weighted model only) */}
          {isWeighted && (
            <div className="p-4 rounded-2xl border border-border bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#c26b6b] mt-2 shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    Risk Flags ({pct(weights.risk)})
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Things a reviewer could question, a date conflict or an eligibility concern. With{" "}
                    <strong>zero flags</strong> this slot gives your score its full{" "}
                    {Math.round(weights.risk * 100)} points. Each flag found chips away at those, and
                    a single <em>critical</em> flag can remove all of them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formula visual */}
        <div className="mt-4 p-3.5 rounded-xl border border-border bg-muted/20">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-3.5 py-1.5 rounded-full bg-[#0d7377] text-[#e8fbfb] border border-[#afdbdb]/20 font-semibold text-xs tracking-[0.01em]">
              Evidence × {isWeighted ? pct(weights.evidence) : "50%"}
            </span>

            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#89a4a0] font-bold text-sm backdrop-blur-sm">
              +
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-[#cdadcc] text-[#452f45] border border-white/10 font-semibold text-xs tracking-[0.01em]">
              Consistency × {isWeighted ? pct(weights.consistency) : "50%"}
            </span>

            {isWeighted && (
              <>
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#89a4a0] font-bold text-sm backdrop-blur-sm">
                  +
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-[#cfe8e9] text-[#164e52] border border-white/10 font-semibold text-xs tracking-[0.01em]">
                  Completeness × {pct(weights.completeness)}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#89a4a0] font-bold text-sm backdrop-blur-sm">
                  +
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-[#f0d9d9] text-[#7a3b3b] border border-white/10 font-semibold text-xs tracking-[0.01em]">
                  Risk × {pct(weights.risk)}
                </span>
              </>
            )}

            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.10] text-[#89a4a0] font-bold text-sm backdrop-blur-sm">
              =
            </div>

            <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0d7377] to-[#89a4a0] text-white border border-white/10 font-bold text-xs tracking-[0.02em] shadow-[0_8px_24px_rgba(13,115,119,0.25)]">
              Case Health
            </span>
          </div>
        </div>

        {/* Worked example — the score with the user's own live numbers */}
        {isWeighted &&
          evidenceScore !== undefined &&
          consistencyScore !== undefined &&
          completenessScore !== undefined &&
          riskPenalty !== undefined &&
          (() => {
            const rows = [
              {
                label: "Evidence",
                shown: `${evidenceScore} × ${pct(weights.evidence)}`,
                term: evidenceScore * weights.evidence,
                color: "#0d7377",
                op: "",
              },
              {
                label: "Consistency",
                shown: `${consistencyScore} × ${pct(weights.consistency)}`,
                term: consistencyScore * weights.consistency,
                color: "#9a6b96",
                op: "+",
              },
              {
                label: "Completeness",
                shown: `${completenessScore} × ${pct(weights.completeness)}`,
                term: completenessScore * weights.completeness,
                color: "#0d7377",
                op: "+",
              },
              {
                label: "Risk",
                shown: `(100 − ${riskPenalty}) × ${pct(weights.risk)}`,
                term: (100 - riskPenalty) * weights.risk,
                color: "#c26b6b",
                op: "+",
              },
            ];
            const rawSum = rows.reduce((s, r) => s + r.term, 0);
            const rounded = Math.round(rawSum) !== Number(rawSum.toFixed(1));
            return (
              <div className="mt-3 p-4 rounded-xl border border-border bg-muted/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Your score, step by step
                </div>

                <div className="space-y-1.5 text-sm">
                  {rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <span className="w-3 text-center font-bold text-[#89a4a0] shrink-0">
                          {row.op}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: row.color }}
                        />
                        <span className="font-medium text-foreground">{row.label}</span>
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          ({row.shown})
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-foreground shrink-0">
                        {row.term.toFixed(1)}
                      </span>
                    </div>
                  ))}

                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                    <span className="font-semibold text-foreground">Case Health</span>
                    <span className="font-mono font-black text-foreground">
                      {rawSum.toFixed(1)}
                      {rounded && (
                        <span className="text-muted-foreground font-normal"> → {overallScore}</span>
                      )}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  These are your live numbers right now. As you add documents and complete steps,
                  each ingredient moves and this total updates.
                </p>
              </div>
            );
          })()}
      </div>

      {/* What the Score Helps With */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          What This Score Helps Identify
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {[
            "Missing supporting evidence",
            "Incomplete documentation",
            "Potential inconsistencies",
            "Case preparation gaps",
            "Timeline discrepancies",
            "Areas needing attention before submission",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0d7377]" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <ExpandableTooltip
        icon={<AlertCircle size={12} />}
        title="Important Disclaimer"
        message="Case Health reflects Rahvana's analysis of your evidence and case data. It is intended for guidance only and does not predict approval or constitute legal advice."
        defaultOpen={true}
      />
    </div>
  );
}
