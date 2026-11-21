"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import SponsorshipCalculatorTool, {
  STANDALONE_SPONSORSHIP_STORAGE_KEY,
  STANDALONE_SPONSORSHIP_DRAFT_KEY,
  SponsorshipCalculatorDraft,
} from "@/components/tools/SponsorshipCalculatorTool";
import { useUserProfile } from "@/app/context/UserProfileContext";
import type { MasterProfile } from "@/types/profile";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ToolLayout } from "@/components/tools/layout";
import type { ToolFaq, ToolRule } from "@/components/tools/layout/types";

export default function AffidavitSupportCalculatorPage() {
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();
  const { profile, updateProfile } = useUserProfile();

  const [savedResult, setSavedResult] = useState<any>(null);
  const [savedDraft, setSavedDraft] = useState<SponsorshipCalculatorDraft | null>(null);
  // Bumped on "Start Fresh" to force the still-mounted SponsorshipCalculatorTool to
  // re-initialize from a clean slate.
  const [resetKey, setResetKey] = useState(0);

  // Load isolated standalone saved calculation and draft from localStorage or user profile
  const loadStandaloneData = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const cachedResult = localStorage.getItem(STANDALONE_SPONSORSHIP_STORAGE_KEY);
      if (cachedResult) {
        setSavedResult(JSON.parse(cachedResult));
      } else if (profile?.standaloneSponsorshipCalc) {
        setSavedResult(profile.standaloneSponsorshipCalc);
      } else {
        setSavedResult(null);
      }

      const cachedDraft = localStorage.getItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      if (cachedDraft) {
        setSavedDraft(JSON.parse(cachedDraft));
      } else if (profile?.standaloneSponsorshipDraft) {
        setSavedDraft(profile.standaloneSponsorshipDraft);
      } else {
        setSavedDraft(null);
      }
    } catch {
      setSavedResult(null);
      setSavedDraft(null);
    }
  }, [profile]);

  useEffect(() => {
    setMounted(true);
    loadStandaloneData();
  }, [loadStandaloneData]);

  const initialData = useMemo(() => {
    if (savedDraft?.data) return savedDraft.data;
    if (savedResult?.raw) return savedResult.raw;
    return null;
  }, [savedDraft, savedResult]);

  const initialStep = useMemo(() => {
    if (typeof savedDraft?.stepIdx === "number") return savedDraft.stepIdx;
    if (savedResult) {
      const isExempt = savedResult.isChildCitizenshipActExempt || savedResult.isExempt;
      return isExempt ? 3 : 10;
    }
    return undefined;
  }, [savedDraft, savedResult]);

  const handleSave = (result: any) => {
    try {
      localStorage.setItem(STANDALONE_SPONSORSHIP_STORAGE_KEY, JSON.stringify(result));
      localStorage.removeItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      if (updateProfile) {
        updateProfile(
          {
            standaloneSponsorshipCalc: result,
            standaloneSponsorshipDraft: undefined,
          },
          { silent: true }
        );
      }
      setSavedResult(result);
      setSavedDraft(null);
      showToast("Sponsorship calculation saved to your account.", "success");
    } catch (e) {
      console.error("Error saving standalone sponsorship calculation:", e);
      showToast("Plan calculated successfully.", "info");
    }
  };

  const handleClearStandaloneProgress = () => {
    try {
      localStorage.removeItem(STANDALONE_SPONSORSHIP_STORAGE_KEY);
      localStorage.removeItem(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      if (updateProfile) {
        updateProfile(
          {
            standaloneSponsorshipCalc: null,
            standaloneSponsorshipDraft: null,
          } as unknown as Partial<MasterProfile>,
          { silent: true }
        );
      }
      setSavedResult(null);
      setSavedDraft(null);
      setResetKey((k) => k + 1);
      showToast("Standalone calculator progress cleared.", "info");
    } catch (e) {
      console.error("Error clearing standalone progress:", e);
    }
  };

  // Drawer Content
  const rules: ToolRule[] = useMemo(
    () => [
      {
        label: "125% HHS Poverty Guidelines Threshold",
        value:
          "For most Form I-864 filings, the petitioner's household income must equal or exceed 125% of the HHS Poverty Guidelines for their household size. Active-duty U.S. Armed Forces sponsors petitioning for their spouse or minor child must meet 100% of the poverty guidelines.",
      },
      {
        label: "Child Citizenship Act of 2000 (INA § 320) Exemption",
        value:
          "Certain biological and adopted children of U.S. citizens automatically acquire U.S. citizenship upon entry to the U.S. as lawful permanent residents. These qualifying children file Form I-864W and are entirely exempt from financial sponsorship requirements and NVC Affidavit of Support fees.",
      },
      {
        label: "Household Size Calculation Rules",
        value:
          "Your household size strictly includes: yourself (the sponsor), your spouse (even if separated, unless legally divorced), unmarried children under 21, dependents claimed on your latest federal tax return, any immigrants previously sponsored on an active I-864, and the principal immigrant plus any accompanying derivatives on this petition.",
      },
      {
        label: "Overcoming Shortfalls with Assets or Joint Sponsors",
        value:
          "If your qualifying income is below the required 125% threshold, you may bridge the gap using significant liquid assets (valued at 5× the shortfall, or 3× if petitioning for a spouse or child of a U.S. citizen) or by securing an eligible Joint Sponsor who independently meets 125% for their own household size.",
      },
    ],
    []
  );

  const faqs: ToolFaq[] = useMemo(
    () => [
      {
        question: "Can I combine my income with other household members?",
        answer:
          "Yes. Relatives living in your principal residence for at least 6 months, or your spouse (regardless of residence), can combine their income by signing Form I-864A (Contract Between Sponsor and Household Member).",
      },
      {
        question: "What if my current income is different from my last tax return?",
        answer: (
          <div className="space-y-2">
            <p>
              Your current income can be different from the income reported on your most recent tax
              return. When assessing Form I-864, the government can consider your current annual
              income, even if it has increased or decreased since your last tax filing.
            </p>
            <p>To support your current income, you can provide:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Recent pay stubs (covering the previous six months).</li>
              <li>
                An employment verification letter stating your job title, employment start date, and
                current salary.
              </li>
              <li>Your most recent federal income tax return or IRS tax transcript.</li>
            </ul>
            <p>
              If you recently started a new job, your income may still qualify if the employment is
              expected to continue and your earnings meet the required income threshold.
            </p>
          </div>
        ),
      },
      {
        question: "Does a Joint Sponsor replace the petitioner?",
        answer:
          "No. The petitioner must always execute a Form I-864 even if unemployed or earning zero income. The Joint Sponsor submits an independent Form I-864 and must qualify on their own household income without combining with the petitioner.",
      },
      {
        question: "When can Form I-864EZ be used instead of Form I-864?",
        answer:
          "Form I-864EZ is a shorter, simpler version permitted only if: (1) you are the sole petitioner, (2) you are sponsoring only one immigrant with no derivatives, and (3) your qualifying income comes entirely from your own salary or pension shown on Form W-2.",
      },
    ],
    []
  );

  const sources = useMemo(
    () => [
      {
        title: "USCIS Form I-864 Official Page",
        url: "https://www.uscis.gov/i-864",
        note: "Official forms, detailed instructions, and filing fee guidelines from USCIS.",
      },
      {
        title: "USCIS Form I-864P Poverty Guidelines",
        url: "https://www.uscis.gov/i-864p",
        note: "Current annual HHS poverty guideline threshold tables for 48 contiguous states, Alaska, and Hawaii.",
      },
      {
        title: "USCIS Form I-864W Exemption Instructions",
        url: "https://www.uscis.gov/i-864w",
        note: "Eligibility guidelines for Child Citizenship Act exemptions and Social Security 40-quarter credits.",
      },
      {
        title: "USCIS Form I-864A Contract Page",
        url: "https://www.uscis.gov/i-864a",
        note: "Contract between sponsor and household member to include additional household income.",
      },
    ],
    []
  );

  return (
    <ToolLayout
      title="Sponsorship Calculator"
      tagline="Find out if the sponsor earns enough for the Affidavit of Support."
      category="Affidavit of Support / Form I-864"
      priceOrDuration="Multi-step calculation"
      theme="sponsor"
      layout="single"
      quickAccessItem={{
        id: "sponsorship-calculator",
        title: "Sponsorship Calculator",
        href: "/affidavit-support-calculator",
        icon_name: "Calculator",
      }}
      rules={rules}
      faqs={faqs}
      sources={sources}
      disclaimer="Poverty guidelines are updated annually by the Department of Health and Human Services (HHS). Calculations are based on USCIS Form I-864P tables."
    >
      {mounted && (
        <SponsorshipCalculatorTool
          key={resetKey}
          isOpen={true}
          standalonePage={true}
          onSave={handleSave}
          initialData={initialData}
          initialStep={initialStep}
          lockState={false}
          mode="standalone"
        />
      )}
    </ToolLayout>
  );
}
