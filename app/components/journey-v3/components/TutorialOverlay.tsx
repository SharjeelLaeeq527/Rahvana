import React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { TutorialVideo } from "@/app/components/shared/TutorialVideo";
import { TutorialStepV3 as TutorialStepData } from "../types";
interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tutorialIdx: number;
  setTutorialIdx: (idx: number) => void;
  tutorialPath: "household_member" | "joint_sponsor" | null;
  setTutorialPath: (path: "household_member" | "joint_sponsor" | null) => void;
  useCeacGuideData: boolean;
  setUseCeacGuideData: (use: boolean) => void;
  currentStep: any;
  uscisTutorialSteps?: any[];
  householdTutorialSteps?: any[];
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen,
  onClose,
  tutorialIdx,
  setTutorialIdx,
  tutorialPath,
  setTutorialPath,
  useCeacGuideData,
  setUseCeacGuideData,
  currentStep,
  uscisTutorialSteps = [],
  householdTutorialSteps = [],
}) => {
  if (!isOpen) return null;

  const tool = currentStep?.tool_data;
  const dynamicStepsRaw = tool?.tutorial_steps;

  let dynamicSteps: any[] | null = null;
  let commonSteps: any[] | null = null;
  let isDynamic = false;
  const effectivePath = tutorialPath || "household_member";

  if (dynamicStepsRaw) {
    if (Array.isArray(dynamicStepsRaw)) {
      dynamicSteps = dynamicStepsRaw;
      isDynamic = dynamicStepsRaw.length > 0;
    } else if (typeof dynamicStepsRaw === "object") {
      const rawSteps = dynamicStepsRaw as any;
      if (Array.isArray(rawSteps.common)) {
        commonSteps = rawSteps.common;
      }
      const branchSteps = rawSteps[effectivePath];
      if (tutorialPath && Array.isArray(commonSteps) && Array.isArray(branchSteps)) {
        dynamicSteps = [...commonSteps, ...branchSteps];
      } else if (Array.isArray(commonSteps) && !tutorialPath) {
        dynamicSteps = commonSteps;
      } else {
        dynamicSteps = branchSteps;
      }
      isDynamic = !!(dynamicSteps && dynamicSteps.length > 0);
    }
  }

  const steps =
    isDynamic && dynamicSteps
      ? dynamicSteps
      : tool?.type === "household_member"
        ? householdTutorialSteps
        : uscisTutorialSteps;

  const currentTutStep = steps[tutorialIdx];
  const branchChoiceActive =
    !tutorialPath && Array.isArray(commonSteps) && tutorialIdx === commonSteps.length - 1;

  // Specific rendering for Step 1.2 CEAC Guide if needed
  if (useCeacGuideData && currentStep?.step_key === "step_1_2") {
    const ceacSteps = (currentStep as any).tool_data?.ceac_steps || [];
    const ceacTutStep = ceacSteps[tutorialIdx];
    if (!ceacTutStep) return null;

    return (
      <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out bg-white">
        <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
          <button
            onClick={() => {
              onClose();
              setUseCeacGuideData(false);
            }}
            className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/30 transition-all cursor-pointer"
          >
            <X size={16} strokeWidth={2} />
          </button>

          <div className="flex-1 h-[5px] bg-primary/30 rounded-[10px] overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-primary rounded-[10px] transition-all duration-[0.4s] ease-out"
              style={{
                width: `${((tutorialIdx + 1) / ceacSteps.length) * 100}%`,
              }}
            />
          </div>

          <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
            {tutorialIdx + 1} / {ceacSteps.length}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center bg-white">
          <div className="w-full max-w-[580px] flex flex-col">
            <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
              {ceacTutStep.label}
            </div>
            <h2 className="text-[clamp(20px,3.2vw,26px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
              {ceacTutStep.heading}
            </h2>
            <div
              className="text-[14px] text-[#3a4f63] leading-[1.7] mb-5"
              dangerouslySetInnerHTML={{
                __html: ceacTutStep.instruction,
              }}
            />

            {ceacTutStep.choiceOptions ? (
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097] mb-2">
                  {ceacTutStep.vlabel}
                </div>
                <div className="text-[15px] text-[#3a4f63] leading-[1.65] mb-4">
                  Select the person you are adding so Rahvana can continue with the correct branch.
                </div>
              </div>
            ) : (
              <div className="w-full rounded-[10px] overflow-hidden border-[1.5px] border-[#d0e4f7] mb-5 shadow-[0_2px_12px_rgba(12,27,51,0.06)] bg-[#f8f9fb]">
                <div className="bg-[#eef3fa] border-b border-[#d0e4f7] h-[34px] flex items-center px-[14px] gap-[7px]">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#f87171]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#fbbf24]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#34d399]" />
                  <div className="flex-1 h-[20px] bg-[#fafcff] rounded-[5px] border border-[#d0e4f7] ml-[10px] flex items-center px-[10px]">
                    <span className="text-[10px] text-[#6b8097] font-mono">ceac.state.gov</span>
                  </div>
                </div>

                <div
                  className="relative w-full p-[24px_28px] flex flex-col items-center justify-center overflow-hidden"
                  style={{ aspectRatio: "4/3" }}
                >
                  <div className="absolute inset-0 flex flex-col gap-[16px] px-[24px] py-[28px] items-center justify-center">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b8097] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px] shrink-0">
                      {ceacTutStep.vlabel}
                    </span>
                    <div className="text-[18px] font-semibold text-[#0c1b33] text-center leading-snug">
                      {ceacTutStep.heading}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {branchChoiceActive && (currentTutStep as any).choiceOptions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-5">
                {(currentTutStep as any).choiceOptions.map((option: any) => {
                  const isHousehold = option.path === "household_member";
                  return (
                    <button
                      key={option.path}
                      onClick={() => {
                        setTutorialPath(option.path);
                        setTutorialIdx(commonSteps?.length || 0);
                      }}
                      className={`group relative overflow-hidden text-left rounded-[18px] border-[1.5px] p-[16px_16px_15px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(12,27,51,0.08)] ${
                        isHousehold
                          ? "border-[#a8d9be] bg-[#f2fbf6] hover:border-[#7fc4a5]"
                          : "border-[#d0e4f7] bg-[#f8fbff] hover:border-[#9dbfe9]"
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-0 h-full w-[4px] ${
                          isHousehold ? "bg-[#15744f]" : "bg-[#2f6fd4]"
                        }`}
                      />
                      <div className="flex items-start justify-between gap-4 pl-2.5">
                        <div>
                          <div className="text-[15px] font-semibold text-[#0c1b33] leading-tight">
                            {option.label}
                          </div>
                          <div className="text-[12px] text-[#5a6f85] mt-1.5 leading-[1.55] max-w-[250px]">
                            {isHousehold
                              ? "Use this when the person lives with the petitioner and their income will be counted as a household member."
                              : "Use this when the person is a separate sponsor meeting the income requirement on their own."}
                          </div>
                        </div>
                        <div
                          className={`mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border text-[16px] font-semibold ${
                            isHousehold
                              ? "border-[#a8d9be] bg-white text-[#15744f]"
                              : "border-[#cfe0f6] bg-white text-[#2f6fd4]"
                          }`}
                        >
                          →
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {ceacTutStep.note && (
              <div className="bg-[#e8f5ef] border-l-4 border-[#15744f] p-[12px_14px] rounded-[4px] mb-5">
                <div className="text-[12px] text-[#3a4f63] leading-[1.6]">{ceacTutStep.note}</div>
              </div>
            )}

            <div className="flex items-center justify-center py-[20px]">
              <div className="w-full flex gap-[10px] items-center">
                {tutorialIdx > 0 && (
                  <button
                    onClick={() => setTutorialIdx(tutorialIdx - 1)}
                    className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
                  >
                    ← Back
                  </button>
                )}
                {branchChoiceActive ? (
                  <button
                    onClick={() => setTutorialIdx(commonSteps?.length || 0)}
                    className="flex-1 p-[13px_22px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px active:translate-y-0 text-center"
                  >
                    Continue after choosing
                  </button>
                ) : tutorialIdx < ceacSteps.length - 1 ? (
                  <button
                    onClick={() => setTutorialIdx(tutorialIdx + 1)}
                    className="flex-1 p-[13px_22px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px active:translate-y-0 text-center"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      setUseCeacGuideData(false);
                    }}
                    className="flex-1 p-[13px_22px] bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center"
                  >
                    Done, return to step
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#fafcff] z-[120] flex flex-col animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out bg-white">
      {/* Tutorial Topbar */}
      <div className="flex items-center h-[72px] border-b border-[#d0e4f7] px-6 gap-4 shrink-0 bg-[#fafcff]">
        <button
          onClick={() => {
            onClose();
            setTutorialPath(null);
            setUseCeacGuideData(false);
          }}
          className="w-9 h-9 rounded-full bg-[#f4f7fb] border-none flex items-center justify-center text-[#3a4f63] hover:bg-primary/30 transition-all cursor-pointer"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="flex-1 h-[5px] bg-primary/30 rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary rounded-[10px] transition-all duration-[0.4s] ease-out"
            style={{
              width: `${((tutorialIdx + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        <div className="text-[12px] font-medium text-[#6b8097] whitespace-nowrap shrink-0">
          {tutorialIdx + 1} / {steps.length}
        </div>
      </div>

      {/* Tutorial Body */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#fafcff] p-[48px_24px_40px] flex flex-col items-center bg-white">
        <div className="w-full max-w-[580px] flex flex-col">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4">
            {isDynamic ? currentTutStep.label : (currentTutStep as any).label}
          </div>
          <h2 className="text-[clamp(20px,3.2vw,26px)] font-black text-[#0c1b33] mb-2 leading-[1.3]">
            {currentTutStep.heading}
          </h2>
          <div
            className="text-[14px] text-[#3a4f63] leading-[1.7] mb-5"
            dangerouslySetInnerHTML={{
              __html: currentTutStep.instruction,
            }}
          />

          {/* Screenshot Block */}
          {isDynamic ? (
            /* Dynamic steps: browser chrome + structured visual */
            <div className="w-full rounded-[10px] overflow-hidden border-[1.5px] border-[#d0e4f7] mb-5 shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
              {/* Browser Chrome Bar */}
              <div className="bg-[#eef3fa] border-b border-[#d0e4f7] h-[34px] flex items-center px-[14px] gap-[7px]">
                <div className="w-[10px] h-[10px] rounded-full bg-[#f87171]" />
                <div className="w-[10px] h-[10px] rounded-full bg-[#fbbf24]" />
                <div className="w-[10px] h-[10px] rounded-full bg-[#34d399]" />
                <div className="flex-1 h-[20px] bg-[#fafcff] rounded-[5px] border border-[#d0e4f7] ml-[10px] flex items-center px-[10px]">
                  <span className="text-[10px] text-[#6b8097] font-mono">
                    {(currentTutStep as TutorialStepData).url}
                  </span>
                </div>
              </div>

              {/* Content Area — aspectRatio only, no minHeight */}
              <div className="relative w-full bg-[#f8f9fb]" style={{ aspectRatio: "4/3" }}>
                {(currentTutStep as TutorialStepData).media?.src ? (
                  (currentTutStep as TutorialStepData).media?.type === "video" ? (
                    <TutorialVideo
                      key={(currentTutStep as TutorialStepData).media?.src!}
                      src={(currentTutStep as TutorialStepData).media?.src!}
                      poster={(currentTutStep as TutorialStepData).videoMeta?.poster}
                      alt={(currentTutStep as TutorialStepData).screenTitle}
                    />
                  ) : (
                    <Image
                      key={(currentTutStep as TutorialStepData).media?.src!}
                      src={(currentTutStep as TutorialStepData).media?.src!}
                      alt={(currentTutStep as TutorialStepData).screenTitle}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 580px"
                      quality={95}
                      priority={tutorialIdx === 0}
                    />
                  )
                ) : (currentTutStep as TutorialStepData).video ? (
                  <TutorialVideo
                    src={(currentTutStep as TutorialStepData).video!}
                    poster={(currentTutStep as TutorialStepData).videoMeta?.poster}
                    alt={(currentTutStep as TutorialStepData).screenTitle}
                  />
                ) : (currentTutStep as TutorialStepData).screenshot ? (
                  <Image
                    src={(currentTutStep as TutorialStepData).screenshot!}
                    alt={(currentTutStep as TutorialStepData).screenTitle}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 580px"
                    quality={95}
                    priority={tutorialIdx === 0}
                  />
                ) : (
                  /* Fallback placeholder — absolute to fill ratio box */
                  <div className="absolute inset-0 flex flex-col gap-[16px] px-[24px] py-[28px] items-center justify-center overflow-hidden">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b8097] bg-[#e8f1fb] border border-[#d0e4f7] rounded-full px-[12px] py-[4px] shrink-0">
                      {(currentTutStep as TutorialStepData).ss_label}
                    </span>

                    <div className="text-[18px] font-semibold text-[#0c1b33] text-center leading-snug">
                      {(currentTutStep as TutorialStepData).ss_headline ||
                        (currentTutStep as TutorialStepData).screenTitle}
                    </div>

                    {((currentTutStep as TutorialStepData).ss_desc ||
                      (currentTutStep as TutorialStepData).screenDesc) && (
                      <div className="text-[13px] text-[#5a6f85] leading-[1.55] bg-[#f8fafb] border-l-[3px] border-[#d0e4f7] pl-[12px] py-[8px] text-center">
                        {(currentTutStep as TutorialStepData).ss_desc ||
                          (currentTutStep as TutorialStepData).screenDesc}
                      </div>
                    )}

                    {(currentTutStep as TutorialStepData).ss_highlight && (
                      <div className="px-[16px] py-[12px] bg-[rgba(47,111,212,0.12)] border-[1.5px] border-[rgba(47,111,212,0.22)] rounded-[10px] text-[13px] font-semibold text-primary text-center">
                        ✓ {(currentTutStep as TutorialStepData).ss_highlight}
                      </div>
                    )}

                    {(currentTutStep as TutorialStepData).fields &&
                      (currentTutStep as TutorialStepData).fields!.length > 0 && (
                        <div className="flex flex-col gap-[8px] w-full max-w-[320px]">
                          {(currentTutStep as TutorialStepData).fields!.map((field, idx) =>
                            field.type === "btn" ? (
                              <div
                                key={idx}
                                className="w-full px-[16px] py-[10px] bg-[#2f6fd4] text-white border-none rounded-[8px] text-[13px] font-semibold cursor-default opacity-90 text-center"
                              >
                                {field.label}
                              </div>
                            ) : (
                              <div key={idx} className="flex flex-col gap-[4px]">
                                {field.label && (
                                  <label className="text-[12px] font-medium text-[#3a4f63]">
                                    {field.label}
                                  </label>
                                )}
                                <input
                                  type={field.isPassword ? "password" : "text"}
                                  placeholder={field.placeholder}
                                  disabled
                                  className="w-full px-[12px] py-[8px] border border-[#d0e4f7] rounded-[6px] text-[13px] bg-[#f8fafb] text-[#9a9a9a]"
                                />
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Caption Bar */}
              <div
                className={`p-[8px_14px_10px] border-t text-[11px] leading-normal ${
                  (currentTutStep as TutorialStepData).caption_class === "success"
                    ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f] font-medium"
                    : "bg-white border-[#d0e4f7] text-[#6b8097]"
                }`}
              >
                {(currentTutStep as TutorialStepData).caption}
              </div>
            </div>
          ) : (
            /* Static USCIS steps */
            <div className="w-full bg-[#eef3fa] border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-5 flex flex-col">
              {/* Browser Chrome Bar */}
              <div className="bg-[#d0e4f7] border-b border-[#d0e4f7] h-[32px] flex items-center px-[14px] gap-[7px]">
                <div className="w-[10px] h-[10px] rounded-full bg-[#f87171]" />
                <div className="w-[10px] h-[10px] rounded-full bg-[#fbbf24]" />
                <div className="w-[10px] h-[10px] rounded-full bg-[#34d399]" />
                <div className="flex-1 h-[18px] bg-[#fafcff] rounded-[4px] border border-[#d0e4f7] ml-[8px] flex items-center px-[10px]">
                  <span className="text-[10px] text-[#6b8097] font-mono">
                    {(currentTutStep as any).url}
                  </span>
                </div>
              </div>

              {/* Content Area — aspectRatio only, no minHeight */}
              <div className="relative w-full bg-[#f8f9fb]" style={{ aspectRatio: "4/3" }}>
                {(currentTutStep as any).media?.src ? (
                  (currentTutStep as any).media.type === "img" ? (
                    <Image
                      key={(currentTutStep as any).media.src}
                      src={(currentTutStep as any).media.src!}
                      alt={(currentTutStep as any).screenTitle}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 580px"
                      quality={95}
                      priority
                    />
                  ) : (
                    <TutorialVideo
                      key={(currentTutStep as any).media.src}
                      src={(currentTutStep as any).media.src!}
                      poster={(currentTutStep as any).videoMeta?.poster}
                      alt={(currentTutStep as any).screenTitle}
                    />
                  )
                ) : (
                  /* Fallback placeholder — absolute to fill ratio box */
                  <div className="absolute inset-0 flex flex-col gap-[16px] px-[24px] py-[12px] items-center justify-center overflow-hidden">
                    <div className="text-[18px] font-semibold text-[#0c1b33] text-center leading-snug">
                      {(currentTutStep as any).ss_headline || (currentTutStep as any).screenTitle}
                    </div>

                    {((currentTutStep as any).ss_desc || (currentTutStep as any).screenDesc) && (
                      <div className="text-[13px] text-[#5a6f85] leading-[1.55] bg-[#f8fafb] border-l-[3px] border-[#d0e4f7] pl-[12px] py-[8px] text-center">
                        {(currentTutStep as any).ss_desc || (currentTutStep as any).screenDesc}
                      </div>
                    )}

                    {Array.isArray((currentTutStep as any)?.fields) &&
                      ((currentTutStep as any)?.fields?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-[8px] w-full max-w-[320px]">
                          {((currentTutStep as any)?.fields ?? []).map((field: any, idx: number) =>
                            field?.type === "btn" ? (
                              <div
                                key={idx}
                                className="w-full px-[22px] py-[10px] bg-[#2f6fd4] text-white border-none rounded-[8px] text-[13px] font-semibold cursor-default opacity-90 text-center"
                              >
                                {field.label}
                              </div>
                            ) : (
                              <div key={idx} className="flex flex-col gap-[4px]">
                                {field.label && (
                                  <label className="text-[12px] font-medium text-[#3a4f63]">
                                    {field.label}
                                  </label>
                                )}
                                <input
                                  type={field.isPassword ? "password" : "text"}
                                  placeholder={field.placeholder}
                                  disabled
                                  className="w-full px-[12px] py-[8px] border border-[#d0e4f7] rounded-[6px] text-[13px] bg-[#f8fafb] text-[#9a9a9a]"
                                />
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note Block */}
          {((isDynamic && (currentTutStep as TutorialStepData).note) ||
            (!isDynamic && (currentTutStep as any).note)) && (
            <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[12px_15px] mb-[22px]">
              <div className="text-[13px] text-[#8a6200] leading-[1.55]">
                {isDynamic ? (
                  (currentTutStep as TutorialStepData).note
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: (currentTutStep as any).note!,
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex gap-[10px] items-center pb-2">
            {tutorialIdx > 0 && (
              <button
                onClick={() => setTutorialIdx(tutorialIdx - 1)}
                className="p-[13px_22px] bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
              >
                ← Back
              </button>
            )}
            {tutorialIdx < steps.length - 1 ? (
              <button
                onClick={() => setTutorialIdx(tutorialIdx + 1)}
                className="flex-1 p-[13px_22px] bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px active:translate-y-0 text-center"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 p-[13px_22px] bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center"
              >
                Done, return to step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
