import React, { useState } from "react";
import { Info, Clock, RefreshCw, Zap, Activity } from "lucide-react";
import { INTERVIEW_SCHEDULING_DATA } from "../InterviewSchedulingData";
import { E, msg } from "@/lib/errors";

const IV_STATUS_CITY = "Islamabad";
const IV_STATUS_POST = "Islamabad, Pakistan (U.S. Embassy)";
const IV_STATUS_CATEGORY = "immediate-relative";

interface InterviewSchedulingToolProps {
  tool: any;
  state: any;
  actions: any;
  guard: () => boolean;
}

export const InterviewSchedulingTool: React.FC<InterviewSchedulingToolProps> = ({
  tool,
  state,
  actions,
  guard,
}) => {
  const [ivLoading, setIvLoading] = useState(false);
  const [ivError, setIvError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!guard()) return;
    setIvLoading(true);
    setIvError(null);
    try {
      const res = await fetch("/api/iv-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: IV_STATUS_CITY,
          visaCategory: IV_STATUS_CATEGORY,
        }),
        cache: "no-store",
      });
      const data = await res.json();
      const results: Array<{
        Post: string;
        "Visa Category": string;
        "Case Documentarily Complete": string;
      }> = data.data || [];
      const match =
        results.find((r) => r.Post.toLowerCase() === IV_STATUS_CITY.toLowerCase()) || results[0];
      if (!match) {
        setIvError(msg(E.TOOL_IV_NO_MATCH, { postName: IV_STATUS_POST }));
        return;
      }

      const MONTH_MAP: Record<string, string> = {
        jan: "01",
        feb: "02",
        mar: "03",
        apr: "04",
        may: "05",
        jun: "06",
        jul: "07",
        aug: "08",
        sep: "09",
        oct: "10",
        nov: "11",
        dec: "12",
      };
      const raw = match["Case Documentarily Complete"].trim();
      const parts = raw.split(/[\s-]+/);
      const monthPart = parts.find((p) => isNaN(Number(p)));
      const yearPart = parts.find((p) => /^\d{4}$/.test(p));
      const monthNum = monthPart ? MONTH_MAP[monthPart.toLowerCase().slice(0, 3)] : null;

      if (!monthNum || !yearPart) {
        setIvError(msg(E.TOOL_IV_DATE_PARSE_FAILED, { raw }));
        return;
      }
      const isoMonth = `${yearPart}-${monthNum}`;
      actions.updateMetadata({
        currentSchedulingMonthYear: isoMonth,
        schedulingDataLastUpdated: new Date().toISOString().split("T")[0],
        post: IV_STATUS_POST,
        dqPost: IV_STATUS_POST,
      });
    } catch {
      setIvError(msg(E.TOOL_IV_FETCH_FAILED));
    } finally {
      setIvLoading(false);
    }
  };

  const savedMonth = state.metadata?.currentSchedulingMonthYear as string | undefined;
  const savedUpdated = state.metadata?.schedulingDataLastUpdated as string | undefined;
  const savedPost = (state.metadata?.post || state.metadata?.dqPost || IV_STATUS_POST) as string;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col duration-380">
      {/* Queue status card */}
      <div className="relative mb-[16px] overflow-hidden rounded-[16px] bg-[#0c1b33] p-[24px_26px]">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-[0.85]" />
        <div className="mb-[8px] text-[10px] font-bold tracking-widest text-white/38 uppercase">
          Post-DQ Queue Status
        </div>
        <div
          className="mb-[18px] flex items-center gap-[10px] font-serif text-[20px] text-white/92"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#6aa8f0] shadow-[0_0_8px_rgba(106,168,240,0.6)]" />
          In queue, awaiting interview letter
        </div>
        {savedMonth && (
          <div className="mb-[18px] rounded-lg border border-[#6aa8f0]/40 bg-[#172d4b] px-3 py-2">
            <div className="text-[10px] font-semibold tracking-widest text-[#f0d98a] uppercase">
              IV Tool Result
            </div>
            <div className="text-[13px] font-semibold text-white/90">
              Scheduling through{" "}
              {(() => {
                const [year, month] = savedMonth.split("-").map(Number);
                return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
              })()}
            </div>
            <div className="text-[11px] text-white/60">{savedPost}</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-[14px] md:grid-cols-3">
          <div>
            <div className="mb-[3px] text-[10px] font-semibold tracking-widest text-white/36 uppercase">
              DQ Date
            </div>
            <div className="text-[13px] font-semibold text-[#f0d98a]">
              {state.metadata.dqDate
                ? new Date(state.metadata.dqDate + "T00:00:00").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not recorded"}
            </div>
          </div>
          <div>
            <div className="mb-[3px] text-[10px] font-semibold tracking-widest text-white/36 uppercase">
              Post
            </div>
            <div className="text-[13px] font-semibold text-white/88">
              {state.metadata.post || state.metadata.dqPost || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling grid */}
      <div className="mb-[14px] grid grid-cols-1 gap-[14px] md:grid-cols-2">
        <div className="rounded-[16px] border-[1.5px] border-[#d0e4f7] bg-[#fafcff] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="mb-[6px] text-[10px] font-bold tracking-widest text-[#2d4a6e] uppercase">
            Official IV Scheduling Status
          </div>
          <div className="mb-[4px] text-[13px] font-semibold text-[#0c1b33]">
            Embassy currently scheduling DQ month:
          </div>

          {savedMonth ? (
            <div className="mb-3">
              <div
                className="mb-1 font-serif text-[22px] font-bold text-[#0c1b33]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {(() => {
                  const [y, m] = savedMonth.split("-").map(Number);
                  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });
                })()}
              </div>
              {savedUpdated && (
                <div className="text-[10px] text-[#6b8097]">Last synced: {savedUpdated}</div>
              )}
            </div>
          ) : (
            <div className="mb-3 text-[12.5px] leading-relaxed text-[#6b8097]">
              Sync from the official IV Scheduling Status Tool to see what DQ month the embassy is
              currently processing.
            </div>
          )}

          {ivError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-600">
              {ivError}
            </div>
          )}

          <button
            onClick={handleFetch}
            disabled={ivLoading}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-bold text-white transition-all disabled:opacity-60"
          >
            {ivLoading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                {savedMonth ? "Re-sync from IV Tool" : "Sync from IV Tool"}
              </>
            )}
          </button>

          <div className="mt-[10px] inline-flex items-center gap-[4px] rounded-full border border-[#d0e4f7] bg-[#e8f1fb] px-[10px] py-[3px] text-[10px] font-semibold text-[#2d4a6e]">
            <Info size={9} strokeWidth={2.5} />
            U.S. State Department · Official
          </div>
        </div>

        {/* Estimate Card */}
        <div className="rounded-[16px] border-[1.5px] border-[#e8d47a] bg-[#fafcff] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="mb-[6px] text-[10px] font-bold tracking-widest text-[#b38600] uppercase">
            Rahvana Estimate
          </div>
          {(() => {
            const ivMonth = state.metadata?.currentSchedulingMonthYear as string;
            const dqDateStr = state.metadata?.dqDate as string;
            if (!ivMonth || !dqDateStr) {
              return (
                <div className="text-[13px] leading-relaxed text-[#6b8097]">
                  Enter the current scheduling month above from the official IV Tool to see your
                  personal estimate.
                </div>
              );
            }
            const [ivY, ivM] = ivMonth.split("-").map(Number);
            const dqDate = new Date(dqDateStr + "T00:00:00");
            const ivDate = new Date(ivY, ivM - 1, 1);
            const raw =
              (dqDate.getFullYear() - ivDate.getFullYear()) * 12 +
              (dqDate.getMonth() - ivDate.getMonth());
            const waitMonths = Math.max(0, raw);
            const low = new Date();
            low.setMonth(low.getMonth() + waitMonths);
            const high = new Date(low);
            high.setMonth(high.getMonth() + 2);
            const fmt = (d: Date) =>
              d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            return (
              <>
                <div className="mb-[2px] text-[13px] font-semibold text-[#0c1b33]">
                  Estimated interview window:
                </div>
                <div
                  className="mb-[4px] font-serif text-[20px] text-[#b38600]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {waitMonths === 0 ? "Approaching now" : `${fmt(low)} ${fmt(high)}`}
                </div>
                <div className="text-[12px] leading-[1.5] text-[#6b8097]">
                  Embassy is approx {waitMonths} month{waitMonths !== 1 ? "s" : ""} away from your
                  DQ date. Keep documents ready.
                </div>
              </>
            );
          })()}
          <div className="mt-[8px] inline-flex items-center gap-[4px] rounded-full border border-[#e8d47a] bg-[#fffbec] px-[10px] py-[3px] text-[10px] font-semibold text-[#b38600]">
            <Activity size={9} strokeWidth={2.5} />
            Rahvana Estimate · Not guaranteed
          </div>
        </div>
      </div>

      {/* While you wait + milestone line */}
      <div className="mb-[14px] grid grid-cols-1 gap-[14px] md:grid-cols-2">
        <div className="rounded-[16px] border-[1.5px] border-[#d0e4f7] bg-[#fafcff] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="mb-[12px] flex items-center gap-[9px]">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] border border-[#a8d9be] bg-[#e8f5ef]">
              <Clock size={16} className="text-[#15744f]" strokeWidth={1.8} />
            </div>
            <div className="text-[14px] font-semibold text-[#0c1b33]">While you wait</div>
          </div>
          <div className="flex flex-col gap-[7px]">
            {INTERVIEW_SCHEDULING_DATA.whileYouWait.map((item: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-[8px] text-[13px] leading-[1.5] text-[#3a4f63]"
              >
                <div className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#b8d4f0]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border-[1.5px] border-[#d0e4f7] bg-[#fafcff] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="mb-[14px] text-[13px] font-semibold text-[#0c1b33]">
            Your progress in Chapter 2
          </div>
          <div className="relative flex flex-col pl-[22px]">
            <div className="absolute top-[6px] bottom-[6px] left-[7px] w-[2px] rounded-[2px] bg-[#d0e4f7]" />
            {INTERVIEW_SCHEDULING_DATA.milestones.map((ms: any, i: number) => (
              <div key={i} className="mb-[12px] flex items-center gap-[10px] last:mb-0">
                <div
                  className={`z-[1] ml-[-22px] h-[14px] w-[14px] shrink-0 rounded-full ${
                    ms.status === "done"
                      ? "bg-[#15744f]"
                      : ms.status === "active"
                        ? "animate-pulse bg-[#2f6fd4]"
                        : "bg-[#d0e4f7]"
                  }`}
                />
                <span
                  className={`text-[13px] ${ms.status === "done" ? "font-medium text-[#0e5c3c]" : ms.status === "active" ? "font-bold text-[#2f6fd4]" : "font-medium text-[#6b8097]"}`}
                >
                  {ms.label} {ms.status === "active" && "← here"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-[14px] rounded-[16px] border-[1.5px] border-[#d0e4f7] bg-[#fafcff] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
        <div className="mb-[12px] flex items-center gap-[9px]">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] border border-[#d0e4f7] bg-[#e8f1fb]">
            <Info size={16} className="text-[#2f6fd4]" strokeWidth={1.8} />
          </div>
          <div className="text-[14px] font-semibold text-[#0c1b33]">
            How interview scheduling works at this stage
          </div>
        </div>
        <div className="flex flex-col gap-[7px]">
          {INTERVIEW_SCHEDULING_DATA.howItWorks.map((item: string, i: number) => (
            <div
              key={i}
              className="flex items-start gap-[8px] text-[13px] leading-[1.5] text-[#3a4f63]"
            >
              <div className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#b8d4f0]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
