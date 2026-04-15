// lib/journey/CaseStrengthEngine.ts
// Intelligent scoring engine for the IR-1 Roadmap journey.
// Analyzes case_data + journey_documents to determine overall case strength.
// ============================================================

import { CaseProfile, CaseData, Journey } from "./types";
import { CaseDataService } from "./service";
import * as db from "./data-access";

export interface StrengthScore {
  total_score: number;       // 0-100%
  risk_level: "STRONG" | "MODERATE" | "WEAK";
  positive_signals: string[];
  risk_flags: Array<{ code: string; severity: "HIGH" | "MEDIUM" | "LOW"; message: string }>;
}

export class CaseStrengthEngine {
  constructor(private caseDataService: CaseDataService) {}

  /**
   * Main calculation entry point
   * Scans case data and document statuses to compute final strength.
   */
  async calculateJourneyStrength(journeyId: string): Promise<StrengthScore> {
    try {
      // 1. Fetch case profile and all documents
      const caseProfile = await this.caseDataService.getCaseProfile(journeyId);
      const documents = await db.getJourneyDocumentsDB(journeyId);
      const journey = await db.getJourneyDB(journeyId);

      const positive_signals: string[] = [];
      const risk_flags: StrengthScore["risk_flags"] = [];
      let baseScore = 40; // Base starting point (getting through Chapter I)

      // ─────────────────────────────────────────────────────────────
      // SIGNAL 1: Required Documents Uploaded
      // ─────────────────────────────────────────────────────────────
      const requiredDocs = documents.filter((d: any) => d.is_required);
      const uploadedDocs = requiredDocs.filter((d: any) => d.status === 'uploaded');
      
      const docRatio = requiredDocs.length > 0 ? (uploadedDocs.length / requiredDocs.length) : 0;
      baseScore += (docRatio * 30); // Worth up to 30 points

      if (docRatio === 1 && requiredDocs.length > 0) {
        positive_signals.push("All required documentation currently requested has been uploaded.");
      } else if (docRatio > 0.5) {
        positive_signals.push("Majority of required documents are preserved in vault.");
      }

      // ─────────────────────────────────────────────────────────────
      // SIGNAL 2: Financial Sufficiency (Income Check)
      // ─────────────────────────────────────────────────────────────
      const income = Number(caseProfile.all_data?.sponsor_annual_income?.data_value) || 0;
      const householdSize = Number(caseProfile.all_data?.household_size?.data_value) || 2;
      
      // Basic 2025 guideline approx: $25k for 2, +$6k per extra person
      const guideline = 25500 + (Math.max(0, householdSize - 2) * 6500);

      if (income >= guideline * 1.25) {
        baseScore += 10;
        positive_signals.push("Sponsor income comfortably exceeds 125% Poverty Guidelines.");
      } else if (income >= guideline) {
        baseScore += 5;
        positive_signals.push("Sponsor income meets federal requirements.");
      } else if (caseProfile.all_data?.joint_sponsor_available?.data_value === 'yes' || caseProfile.all_data?.joint_sponsor_available?.data_value === true) {
        baseScore += 5;
        positive_signals.push("Joint sponsor has been identified to mitigate income shortfall.");
      } else {
        risk_flags.push({ 
          code: 'LOW_INCOME', 
          severity: 'HIGH', 
          message: 'Sponsor income appears below 125% of the poverty guideline for your household size.' 
        });
        baseScore -= 15;
      }

      // ─────────────────────────────────────────────────────────────
      // SIGNAL 3: Relationship Evidence
      // ─────────────────────────────────────────────────────────────
      const hasChildren = caseProfile.all_data?.children_together?.data_value === true;
      const marriageYears = this.calculateYearsElapsed(caseProfile.all_data?.marriage_date?.data_value);

      if (hasChildren) {
        baseScore += 10;
        positive_signals.push("Strong relationship evidence (children together documented).");
      }
      
      if (marriageYears >= 2) {
        baseScore += 5;
        positive_signals.push(`Long-term marriage stability (> ${Math.floor(marriageYears)} years documented).`);
      } else if (marriageYears < 0.5 && marriageYears > 0) {
         risk_flags.push({ 
          code: 'SHORT_MARRIAGE', 
          severity: 'MEDIUM', 
          message: 'Short marriage duration (< 6 months) may trigger additional relationship scrutiny.' 
        });
        baseScore -= 5;
      }

      // ─────────────────────────────────────────────────────────────
      // SIGNAL 4: Age Gap Assessment (§13.1)
      // ─────────────────────────────────────────────────────────────
      const sponsorDob = caseProfile.all_data?.sponsor_dob?.data_value;
      const beneficiaryDob = caseProfile.all_data?.beneficiary_dob?.data_value;

      if (sponsorDob && beneficiaryDob) {
        const sponsorAge = Math.floor(this.calculateYearsElapsed(sponsorDob));
        const beneficiaryAge = Math.floor(this.calculateYearsElapsed(beneficiaryDob));
        const ageGap = Math.abs(sponsorAge - beneficiaryAge);

        if (ageGap > 15) {
          risk_flags.push({ 
            code: 'HIGH_AGE_GAP', 
            severity: 'MEDIUM', 
            message: `Large age gap (${ageGap} years) between sponsor and beneficiary may trigger requests for additional bona-fide evidence.` 
          });
          baseScore -= 5;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // SIGNAL 5: Roadmap Progress
      // ─────────────────────────────────────────────────────────────
      const completion = journey?.completion_percentage || 0;
      if (completion > 50) {
        baseScore += 10;
        positive_signals.push("Roadmap is more than 50% complete (Step II.8+).");
      }

      // ─────────────────────────────────────────────────────────────
      // FINAL CALCULATION
      // ─────────────────────────────────────────────────────────────
      const finalScore = Math.min(99.99, Math.max(0, baseScore));
      
      let riskLevel: StrengthScore["risk_level"] = "MODERATE";
      if (finalScore >= 80) riskLevel = "STRONG";
      else if (finalScore < 45) riskLevel = "WEAK";

      const strengthResult: StrengthScore = {
        total_score: finalScore,
        risk_level: riskLevel,
        positive_signals: positive_signals,
        risk_flags: risk_flags
      };

      // Auto-save the score back to case_data so it stays indexed
      await this.caseDataService.setCaseData(journeyId, 'case_strength_score', finalScore, {
        is_verified: true,
        source: 'CaseStrengthEngine'
      });

      return strengthResult;

    } catch (error) {
      console.error("[CaseStrengthEngine] Error:", error);
      throw error;
    }
  }

  private calculateYearsElapsed(dateValue: any): number {
    if (!dateValue) return 0;
    const date = new Date(String(dateValue));
    if (isNaN(date.getTime())) return 0;
    
    const diff = new Date().getTime() - date.getTime();
    return diff / (1000 * 60 * 60 * 24 * 365.25);
  }
}
