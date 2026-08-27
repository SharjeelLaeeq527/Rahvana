"use client";
import React from "react";
import { WizardState } from "../../(main)/dashboard/hooks/useWizard";
import { roadmapData } from "../../../data/roadmap";
import { useLanguage } from "@/app/context/LanguageContext";
import { SafeHtml } from "../shared/SafeHTML";

interface DashboardProps {
  state: WizardState;
  isSignedIn: boolean;
  onContinue: () => void;
  onNavigate: (section: string) => void;
  onToggleAuth: () => void;
}

export function Dashboard({
  state,
  isSignedIn,
  onContinue,
  onNavigate,
  onToggleAuth,
}: DashboardProps) {
  const { t } = useLanguage();

  const getTotalSteps = () => {
    return roadmapData.stages.reduce((acc, stage) => acc + stage.steps.length, 0);
  };

  const totalSteps = getTotalSteps();
  const completed = state.completedSteps.size;
  const progress = totalSteps === 0 ? 0 : Math.round((completed / totalSteps) * 100);

  return (
    <section id="dashboard" className="block">
      <div className="w-full px-6 py-[60px]">
        <h1 className="mb-4 text-[40px] font-bold">{t("dashboard.title")}</h1>
        <p className="mb-12 text-lg text-slate-500">{t("dashboard.subtitle")}</p>

        {!isSignedIn && (
          <div id="guest-dashboard-msg">
            <div className="rounded-xl border-2 border-[#f59e0b]/20 bg-[#f59e0b]/5 p-8 text-center">
              <h4 className="mb-2 text-xl font-bold">{t("dashboard.guest.headline")}</h4>
              <p className="mb-6 text-slate-500">{t("dashboard.guest.description")}</p>
              <button
                className="rounded-lg bg-[#0d9488] px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-[#0f766e]"
                onClick={onToggleAuth}
              >
                {t("dashboard.guest.signInBtn")}
              </button>
            </div>
          </div>
        )}

        {isSignedIn && (
          <div id="signed-in-dashboard">
            <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-5 text-xl font-bold">{t("dashboard.activeJourneys.title")}</h3>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="mb-2 text-lg font-bold">
                    {t("dashboard.activeJourneys.ir1Title")}
                  </h4>
                  <p className="mb-3 text-sm text-slate-500">
                    {t("dashboard.activeJourneys.startedOn")}
                  </p>
                  <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-linear-to-r from-[#0d9488] to-[#10b981] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="mb-6 flex justify-between text-[13px]">
                    <span className="font-semibold text-slate-800">
                      {completed} of {totalSteps} steps
                    </span>
                    <span className="text-slate-500">{progress}% Complete</span>
                  </div>
                  <button
                    className="w-full rounded-lg bg-[#0d9488] px-6 py-4 font-bold text-white shadow-lg transition-colors hover:bg-[#0f766e]"
                    onClick={onContinue}
                  >
                    {t("dashboard.activeJourneys.continueBtn")}
                  </button>
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 opacity-60 shadow-sm">
                  <h4 className="mb-2 font-bold">{t("dashboard.activeJourneys.startAnother")}</h4>
                  <p className="mb-3 text-sm text-slate-500">
                    {t("dashboard.activeJourneys.startAnotherDesc")}
                  </p>
                  <button
                    className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 font-bold text-slate-400"
                    disabled
                  >
                    Coming Soon
                  </button>
                </div>
              </div>

              <div>
                <h3 className="mb-5 text-xl font-bold">{t("dashboard.documentVault.title")}</h3>
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <div className="mb-2 text-4xl">📁</div>
                  <SafeHtml
                    as="p"
                    className="mb-4 text-sm text-slate-500"
                    html={t("dashboard.documentVault.description").replace(
                      "{{count}}",
                      String(Object.keys(state.docUploads || {}).length)
                    )}
                  />
                  <button
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-800 transition-colors hover:border-[#0d9488]"
                    onClick={onContinue}
                  >
                    {t("dashboard.documentVault.openVaultBtn")}
                  </button>
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="mb-4 text-[14px] font-bold tracking-wider text-slate-400 uppercase">
                    {t("dashboard.documentVault.upcomingMilestone")}
                  </h4>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#5eead4] px-3 py-2 text-lg font-bold text-[#0f766e]">
                      II
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {t("dashboard.documentVault.milestoneTitle")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("dashboard.documentVault.waitText")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="mb-5 text-xl font-bold">{t("dashboard.quickActions.title")}</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <button
                  className="group rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md"
                  onClick={() => onNavigate("ir1-journey")}
                >
                  <h4 className="mb-1 text-lg font-bold transition-colors group-hover:text-[#0d9488]">
                    {t("dashboard.quickActions.openWizard")}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {t("dashboard.quickActions.openWizardDesc")}
                  </p>
                </button>
                <button
                  className="group rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md"
                  onClick={() => onNavigate("tools")}
                >
                  <h4 className="mb-1 text-lg font-bold transition-colors group-hover:text-[#0d9488]">
                    {t("dashboard.quickActions.browseTools")}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {t("dashboard.quickActions.browseToolsDesc")}
                  </p>
                </button>
                <button
                  className="group rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md"
                  onClick={() => onNavigate("pricing")}
                >
                  <h4 className="mb-1 text-lg font-bold transition-colors group-hover:text-[#0d9488]">
                    {t("dashboard.quickActions.viewPremium")}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {t("dashboard.quickActions.viewPremiumDesc")}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
