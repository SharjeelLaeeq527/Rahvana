import React, { useState } from "react";
import { Info, Clock, RefreshCw, Zap, Activity } from "lucide-react";
import { INTERVIEW_SCHEDULING_DATA } from "../InterviewSchedulingData";
import { E, msg } from "@/lib/errors";

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
    const postName = (state.metadata?.dqPost || state.metadata?.post || "") as string;
    if (!postName) {
      setIvError(msg(E.TOOL_IV_POST_REQUIRED));
      return;
    }
    setIvLoading(true);
    setIvError(null);
    try {
      const res = await fetch("/api/iv-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: postName,
          visaCategory: "immediate-relative",
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
        results.find((r) => r.Post.toLowerCase().includes(postName.toLowerCase())) || results[0];
      if (!match) {
        setIvError(msg(E.TOOL_IV_NO_MATCH, { postName }));
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
      });
    } catch {
      setIvError(msg(E.TOOL_IV_FETCH_FAILED));
    } finally {
      setIvLoading(false);
    }
  };

  const savedMonth = state.metadata?.currentSchedulingMonthYear as string | undefined;
  const savedUpdated = state.metadata?.schedulingDataLastUpdated as string | undefined;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      {/* Queue status card */}
      <div className="relative bg-[#0c1b33] rounded-[16px] p-[24px_26px] mb-[16px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-[0.85]" />
        <div className="text-[10px] font-bold tracking-widest uppercase text-white/38 mb-[8px]">
          Post-DQ Queue Status
        </div>
        <div
          className="text-[20px] font-serif text-white/92 mb-[18px] flex items-center gap-[10px]"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#6aa8f0] animate-pulse shadow-[0_0_8px_rgba(106,168,240,0.6)]" />
          In queue — awaiting interview letter
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-[14px]">
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/36 mb-[3px]">
              DQ Date
            </div>
            <div className="text-[13px] font-semibold text-[#f0d98a]">
              {state.metadata.dqDate
                ? new Date(state.metadata.dqDate + "T00:00:00").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/36 mb-[3px]">
              Post
            </div>
            <div className="text-[13px] font-semibold text-white/88">
              {state.metadata.post || state.metadata.dqPost || "—"}
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/36 mb-[3px]">
              Current stage
            </div>
            <div className="text-[13px] font-semibold text-white/88">Awaiting interview letter</div>
          </div>
        </div>
      </div>

      {/* Scheduling grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
        <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-[6px]">
            Official IV Scheduling Status
          </div>
          <div className="text-[13px] font-semibold text-[#0c1b33] mb-[4px]">
            Embassy currently scheduling DQ month:
          </div>

          {savedMonth ? (
            <div className="mb-3">
              <div
                className="text-[22px] font-serif font-bold text-[#0c1b33] mb-1"
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
            <div className="text-[12.5px] text-[#6b8097] mb-3 leading-relaxed">
              Sync from the official IV Scheduling Status Tool to see what DQ month the embassy is
              currently processing.
            </div>
          )}

          {ivError && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
              {ivError}
            </div>
          )}

          <button
            onClick={handleFetch}
            disabled={ivLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[12px] font-bold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {ivLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                {savedMonth ? "Re-sync from IV Tool" : "Sync from IV Tool"}
              </>
            )}
          </button>

          <div className="inline-flex items-center gap-[4px] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[10px] py-[3px] text-[10px] font-semibold text-[#2d4a6e] mt-[10px]">
            <Info size={9} strokeWidth={2.5} />
            U.S. State Department · Official
          </div>
        </div>

        {/* Estimate Card */}
        <div className="bg-[#fafcff] border-[1.5px] border-[#e8d47a] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="text-[10px] font-bold tracking-widest uppercase text-[#b38600] mb-[6px]">
            Rahvana Estimate
          </div>
          {(() => {
            const ivMonth = state.metadata?.currentSchedulingMonthYear as string;
            const dqDateStr = state.metadata?.dqDate as string;
            if (!ivMonth || !dqDateStr) {
              return (
                <div className="text-[13px] text-[#6b8097] leading-relaxed">
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
                <div className="text-[13px] font-semibold text-[#0c1b33] mb-[2px]">
                  Estimated interview window:
                </div>
                <div
                  className="text-[20px] font-serif text-[#b38600] mb-[4px]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {waitMonths === 0 ? "Approaching now" : `${fmt(low)} – ${fmt(high)}`}
                </div>
                <div className="text-[12px] text-[#6b8097] leading-[1.5]">
                  Embassy is approx {waitMonths} month{waitMonths !== 1 ? "s" : ""} away from your
                  DQ date. Keep documents ready.
                </div>
              </>
            );
          })()}
          <div className="inline-flex items-center gap-[4px] bg-[#fffbec] border border-[#e8d47a] rounded-full px-[10px] py-[3px] text-[10px] font-semibold text-[#b38600] mt-[8px]">
            <Activity size={9} strokeWidth={2.5} />
            Rahvana Estimate · Not guaranteed
          </div>
        </div>
      </div>

      {/* While you wait + milestone line */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
        <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="flex items-center gap-[9px] mb-[12px]">
            <div className="w-[34px] h-[34px] rounded-[8px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
              <Clock size={16} className="text-[#15744f]" strokeWidth={1.8} />
            </div>
            <div className="text-[14px] font-semibold text-[#0c1b33]">While you wait</div>
          </div>
          <div className="flex flex-col gap-[7px]">
            {INTERVIEW_SCHEDULING_DATA.whileYouWait.map((item: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-[8px] text-[13px] text-[#3a4f63] leading-[1.5]"
              >
                <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] shrink-0 mt-[6px]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="text-[13px] font-semibold text-[#0c1b33] mb-[14px]">
            Your progress in Chapter 2
          </div>
          <div className="flex flex-col relative pl-[22px]">
            <div className="absolute left-[7px] top-[6px] bottom-[6px] w-[2px] bg-[#d0e4f7] rounded-[2px]" />
            {INTERVIEW_SCHEDULING_DATA.milestones.map((ms: any, i: number) => (
              <div key={i} className="flex items-center gap-[10px] mb-[12px] last:mb-0">
                <div
                  className={`w-[14px] h-[14px] rounded-full shrink-0 z-[1] ml-[-22px] ${
                    ms.status === "done"
                      ? "bg-[#15744f]"
                      : ms.status === "active"
                        ? "bg-[#2f6fd4] animate-pulse"
                        : "bg-[#d0e4f7]"
                  }`}
                />
                <span
                  className={`text-[13px] ${ms.status === "done" ? "text-[#0e5c3c] font-medium" : ms.status === "active" ? "text-[#2f6fd4] font-bold" : "text-[#6b8097] font-medium"}`}
                >
                  {ms.label} {ms.status === "active" && "← here"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#fafcff] border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[18px_20px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
        <div className="flex items-center gap-[9px] mb-[12px]">
          <div className="w-[34px] h-[34px] rounded-[8px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
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
              className="flex items-start gap-[8px] text-[13px] text-[#3a4f63] leading-[1.5]"
            >
              <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] shrink-0 mt-[6px]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
