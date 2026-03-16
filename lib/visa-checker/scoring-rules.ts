import { RiskSeverity, FlagCode } from "./types";
import {
  MAX_TOTAL_SCORE,
  MIN_TOTAL_SCORE,
  COMPONENT_WEIGHTS,
  RISK_POINTS_DEDUCTION,
  INCOME_THRESHOLDS,
  RELATIONSHIP_THRESHOLDS,
} from "./scoring-config";
import { IMPROVEMENT_MESSAGES } from "./improvements";

interface RiskFlag {
  flagCode: FlagCode;
  severity: RiskSeverity;
  explanation: string;
  improvement: string;
}

interface ScoringResult {
  score: number;
  risks: RiskFlag[];
}

export class ScoringRules {
  static calculateIncomeScore(
    answers: Record<string, unknown>,
    income: number,
    householdSize: number,
  ): ScoringResult {
    const risks: RiskFlag[] = [];
    let score = COMPONENT_WEIGHTS.INCOME_AND_FINANCIAL;

    // Calculate poverty guideline threshold using configurable values
    const povertyThreshold =
      INCOME_THRESHOLDS.POVERTY_GUIDELINE_BASE +
      INCOME_THRESHOLDS.ADDITIONAL_PER_PERSON * Math.max(0, householdSize - 1);
    
    // Active duty military sponsors only need 100% of the poverty guideline
    const isMilitary = answers.industry_sector === "Military/Defense" || answers.prior_military_service === true;
    const criticalRatio = isMilitary ? 1.0 : INCOME_THRESHOLDS.CRITICAL_RATIO;
    const warningRatio = isMilitary ? 1.25 : INCOME_THRESHOLDS.WARNING_RATIO;
    
    const incomeRatio = income / povertyThreshold;

    if (incomeRatio < criticalRatio) {
      risks.push({
        flagCode: "SPONSOR_INCOME_BELOW_GUIDELINE",
        severity: "HIGH",
        explanation: `Income ($${income.toLocaleString()}) is below ${
          criticalRatio * 100
        }% of poverty guideline ($${povertyThreshold.toLocaleString()})`,
        improvement: IMPROVEMENT_MESSAGES.SPONSOR_INCOME_BELOW_GUIDELINE_HIGH,
      });
      score -= RISK_POINTS_DEDUCTION.HIGH;
    } else if (incomeRatio < warningRatio) {
      risks.push({
        flagCode: "SPONSOR_INCOME_BELOW_GUIDELINE",
        severity: "MEDIUM",
        explanation: `Income ($${income.toLocaleString()}) is below ${
          warningRatio * 100
        }% of poverty guideline ($${povertyThreshold.toLocaleString()})`,
        improvement: IMPROVEMENT_MESSAGES.SPONSOR_INCOME_BELOW_GUIDELINE_MEDIUM,
      });
      score -= RISK_POINTS_DEDUCTION.MEDIUM;
    }

    // Public Charge Risk Assessment (Education & Occupation)
    const educationLevel = answers.highest_education_level as string;
    const isHighRiskIndustry = answers.industry_sector === "Unemployed/Student";
    
    if (isHighRiskIndustry) {
      risks.push({
        flagCode: "PUBLIC_CHARGE_RISK",
        severity: "LOW",
        explanation: "Unemployed or student status may increase 'Public Charge' scrutiny during the visa interview.",
        improvement: IMPROVEMENT_MESSAGES.PUBLIC_CHARGE_RISK,
      });
      score -= 2;
    } else if (educationLevel === "No formal education" || educationLevel === "Primary education") {
      risks.push({
        flagCode: "PUBLIC_CHARGE_RISK",
        severity: "LOW",
        explanation: "Lower formal education levels can be a factor in Public Charge assessments.",
        improvement: IMPROVEMENT_MESSAGES.PUBLIC_CHARGE_RISK,
      });
      score -= 2;
    }

    const MIN_FINANCIAL_SCORE =
      COMPONENT_WEIGHTS.INCOME_AND_FINANCIAL * 0.2;

    score = Math.min(COMPONENT_WEIGHTS.INCOME_AND_FINANCIAL, Math.max(score, MIN_FINANCIAL_SCORE));

    return { score, risks };
  }

  static calculateRelationshipScore(
    answers: Record<string, unknown>,
  ): ScoringResult {
    const risks: RiskFlag[] = [];
    let score = COMPONENT_WEIGHTS.RELATIONSHIP_STRENGTH;

    // Relationship duration calculations
    const currentDate = new Date();
    const marriageDate = answers.marriage_date ? new Date(String(answers.marriage_date)) : null;
    const relationshipStartDate = answers.relationship_start_date ? new Date(String(answers.relationship_start_date)) : null;

    let durationMonths = 0;
    let effectiveRelMonths = 0;

    if (marriageDate) {
      durationMonths = (currentDate.getTime() - marriageDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    }

    if (relationshipStartDate) {
      effectiveRelMonths = (currentDate.getTime() - relationshipStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    } else {
      effectiveRelMonths = durationMonths;
    }

    // High Relationship History Bonus
    if (effectiveRelMonths >= 24) {
      score += 5;
      risks.push({
        flagCode: "LONG_RELATIONSHIP_HISTORY",
        severity: "LOW",
        explanation: `Strong relationship history (${Math.round(effectiveRelMonths / 12)} years of commitment documented).`,
        improvement: IMPROVEMENT_MESSAGES.LONG_RELATIONSHIP_HISTORY,
      });
    }

    // Marriage Duration Risk
    if (marriageDate && durationMonths < RELATIONSHIP_THRESHOLDS.SHORT_DURATION_MONTHS) {
      const isMitigated = effectiveRelMonths >= 24;
      const severity = isMitigated ? "MEDIUM" : "HIGH";
      const deduction = isMitigated ? RISK_POINTS_DEDUCTION.MEDIUM : RISK_POINTS_DEDUCTION.HIGH;
      
      risks.push({
        flagCode: "SHORT_RELATIONSHIP_DURATION",
        severity,
        explanation: `Marriage duration is short (${Math.round(durationMonths)} months < ${RELATIONSHIP_THRESHOLDS.SHORT_DURATION_MONTHS} months).${
          isMitigated ? " This is mitigated by your long-term relationship history." : ""
        }`,
        improvement: IMPROVEMENT_MESSAGES.SHORT_RELATIONSHIP_DURATION,
      });
      score -= deduction;
    }

    // I-751 Reminder for CR-1 holders (marriage < 2 years)
    if (marriageDate && durationMonths < 24) {
      risks.push({
        flagCode: "CR1_I751_REMINDER",
        severity: "LOW",
        explanation: "Conditional status applies (CR-1) because the marriage is less than 2 years old.",
        improvement: IMPROVEMENT_MESSAGES.CR1_I751_REMINDER,
      });
    }


    // Bonus for children together (Strong evidence of bona fide relationship)
    if (answers.children_together === true) {
      score += 10;
    }

    // Check for in-person meetings
    const inPersonVisits = Number(answers.number_of_in_person_visits) || 0;
    if (inPersonVisits <= RELATIONSHIP_THRESHOLDS.CRITICAL_IN_PERSON_VISITS) {
      risks.push({
        flagCode: "NO_IN_PERSON_MEETINGS",
        severity: "HIGH",
        explanation: `No in-person meetings reported (${inPersonVisits} visits)`,
        improvement: IMPROVEMENT_MESSAGES.NO_IN_PERSON_MEETINGS_HIGH,
      });
      score -= RISK_POINTS_DEDUCTION.HIGH;
    } else if (inPersonVisits < RELATIONSHIP_THRESHOLDS.MIN_IN_PERSON_VISITS) {
      risks.push({
        flagCode: "NO_IN_PERSON_MEETINGS",
        severity: "MEDIUM",
        explanation: `Limited in-person meetings (${inPersonVisits} visits < ${RELATIONSHIP_THRESHOLDS.MIN_IN_PERSON_VISITS})`,
        improvement: IMPROVEMENT_MESSAGES.NO_IN_PERSON_MEETINGS_MEDIUM,
      });
      score -= RISK_POINTS_DEDUCTION.MEDIUM;
    }

    // Check for cohabitation evidence
    const cohabitationProof = Boolean(answers.cohabitation_proof);
    if (!cohabitationProof) {
      const hasChildren = answers.children_together === true;
      const severity = hasChildren ? "LOW" : "MEDIUM";
      const deduction = hasChildren ? RISK_POINTS_DEDUCTION.LOW : RISK_POINTS_DEDUCTION.MEDIUM;
      
      risks.push({
        flagCode: "NO_COHABITATION_EVIDENCE",
        severity,
        explanation: `No cohabitation evidence provided.${hasChildren ? " (Strongly mitigated by having children together)" : ""}`,
        improvement: IMPROVEMENT_MESSAGES.NO_COHABITATION_EVIDENCE,
      });
      score -= deduction;
    }

    // Check for shared financials
    const sharedFinancials =
      Boolean(answers.shared_financial_accounts) ||
      Boolean(answers.money_transfer_receipts_available) ||
      false;
    if (!sharedFinancials) {
      risks.push({
        flagCode: "NO_SHARED_FINANCIALS",
        severity: "MEDIUM",
        explanation: "No shared financial evidence",
        improvement: IMPROVEMENT_MESSAGES.NO_SHARED_FINANCIALS,
      });
      score -= RISK_POINTS_DEDUCTION.MEDIUM;
    }

    // Check for wedding photos
    const weddingPhotos = Boolean(answers.wedding_photos_available);
    if (!weddingPhotos) {
      risks.push({
        flagCode: "NO_WEDDING_PHOTOS",
        severity: "LOW",
        explanation: "No wedding photos available",
        improvement: IMPROVEMENT_MESSAGES.NO_WEDDING_PHOTOS,
      });
      score -= RISK_POINTS_DEDUCTION.LOW;
    }

    // Check for communication history
    const commLogs = Boolean(answers.communication_logs);
    if (!commLogs) {
      risks.push({
        flagCode: "NO_COMMUNICATION_HISTORY",
        severity: "LOW",
        explanation: "No communication history provided",
        improvement: IMPROVEMENT_MESSAGES.NO_COMMUNICATION_HISTORY,
      });
      score -= RISK_POINTS_DEDUCTION.LOW;
    }

    // Check for age gap between sponsor and beneficiary
    const sponsorDob = answers.sponsor_dob
      ? new Date(String(answers.sponsor_dob))
      : null;
    const beneficiaryDob = answers.beneficiary_dob
      ? new Date(String(answers.beneficiary_dob))
      : null;

    if (sponsorDob && beneficiaryDob) {
      const sponsorAge = this.calculateAge(new Date(sponsorDob));
      const beneficiaryAge = this.calculateAge(new Date(beneficiaryDob));
      const ageGap = Math.abs(sponsorAge - beneficiaryAge);

      // If age gap is too large (> 15 years), it may raise questions about the relationship
      if (ageGap > 15) {
        risks.push({
          flagCode: "AGE_GAP_HIGH",
          severity: "HIGH",
          explanation: `Large age gap (${ageGap} years) between sponsor (${sponsorAge} years) and beneficiary (${beneficiaryAge} years)`,
          improvement: IMPROVEMENT_MESSAGES.AGE_GAP_HIGH,
        });
        score -= RISK_POINTS_DEDUCTION.HIGH;
      }
    }

    const MIN_RELATIONSHIP_SCORE = COMPONENT_WEIGHTS.RELATIONSHIP_STRENGTH * 0.2;

    score = Math.min(COMPONENT_WEIGHTS.RELATIONSHIP_STRENGTH, Math.max(score, MIN_RELATIONSHIP_SCORE));

    return { score, risks };
  }

  static calculateDocumentScore(
    answers: Record<string, unknown>,
  ): ScoringResult {
    const risks: RiskFlag[] = [];
    let score = COMPONENT_WEIGHTS.DOCUMENT_COMPLETENESS;

    // Critical documents check
    const criticalDocs: [string, FlagCode, string][] = [
      [
        "urdu_marriage_certificate",
        "NO_MARRIAGE_CERTIFICATE",
        "Marriage certificate",
      ],
      [
        "english_translation_certificate",
        "NO_MARRIAGE_TRANSLATION",
        "Marriage certificate translation",
      ],
      ["birth_certificates", "NO_BIRTH_CERTIFICATES", "Birth certificates"],
      ["passports_available", "NO_VALID_PASSPORTS", "Valid passports"],
      [
        "nadra_marriage_registration_cert",
        "NO_NADRA_MARRIAGE_CERT",
        "NADRA marriage certificate",
      ],
      [
        "family_registration_certificate",
        "NO_FRC_AVAILABLE",
        "Family Registration Certificate",
      ],
      [
        "valid_police_clearance_certificate",
        "NO_VALID_POLICE_CLEARANCE_CERTIFICATE",
        "Police certificate",
      ],
      ["medical_report_available", "NO_MEDICAL_REPORT", "Medical report"],
      ["ds260_confirmation", "DS260_NOT_SUBMITTED", "DS-260 confirmation"],
    ];

    // Conditional: Prior marriage docs
    if (answers.prior_marriages_exist === true) {
      criticalDocs.push([
        "prior_marriage_termination_docs",
        "MISSING_PRIOR_MARRIAGE_DOCS",
        "Prior marriage termination documents",
      ]);
    }

    for (const [docKey, flagCode, docName] of criticalDocs) {
      if (!answers[docKey]) {
        let improvementMsg: string;
        switch (flagCode) {
          case "NO_MARRIAGE_CERTIFICATE":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_MARRIAGE_CERTIFICATE;
            break;
          case "NO_MARRIAGE_TRANSLATION":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_MARRIAGE_TRANSLATION;
            break;
          case "NO_BIRTH_CERTIFICATES":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_BIRTH_CERTIFICATES;
            break;
          case "NO_VALID_PASSPORTS":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_VALID_PASSPORTS;
            break;
          case "NO_NADRA_MARRIAGE_CERT":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_NADRA_MARRIAGE_CERT;
            break;
          case "NO_FRC_AVAILABLE":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_FRC_AVAILABLE;
            break;
          case "NO_VALID_POLICE_CLEARANCE_CERTIFICATE":
            improvementMsg =
              IMPROVEMENT_MESSAGES.NO_VALID_POLICE_CLEARANCE_CERTIFICATE;
            break;
          case "NO_MEDICAL_REPORT":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_MEDICAL_REPORT;
            break;
          case "DS260_NOT_SUBMITTED":
            improvementMsg = IMPROVEMENT_MESSAGES.DS260_NOT_SUBMITTED;
            break;
          case "MISSING_PRIOR_MARRIAGE_DOCS":
            improvementMsg = IMPROVEMENT_MESSAGES.MISSING_PRIOR_MARRIAGE_DOCS;
            break;
          default:
            improvementMsg = `Critical document missing: ${docName}`;
        }

        risks.push({
          flagCode,
          severity: "HIGH",
          explanation: `No ${docName} provided`,
          improvement: improvementMsg,
        });
        score -= RISK_POINTS_DEDUCTION.HIGH;
      }
    }

    // Important documents check
    const importantDocs: [string, FlagCode | null, string][] = [
      ["passport_copy_available", "NO_PASSPORT_COPY", "Passport copy"],
    ];

    for (const [docKey, flagCode, docName] of importantDocs) {
      if (!answers[docKey]) {
        if (flagCode) {
          let improvementMsg: string;
          switch (flagCode) {
            case "NO_PASSPORT_COPY":
              improvementMsg = IMPROVEMENT_MESSAGES.NO_PASSPORT_COPY;
              break;
            default:
              improvementMsg = `Important document missing: ${docName}`;
          }

          risks.push({
            flagCode,
            severity: "MEDIUM",
            explanation: `No ${docName} provided`,
            improvement: improvementMsg,
          });
          score -= 3;
        }
      }
    }

    // Application documents check
    const appDocs: [string, FlagCode, string][] = [
      ["interview_letter", "NO_INTERVIEW_LETTER", "Interview letter"],
      ["passport_photos_2x2", "NO_PASSPORT_PHOTOS_2X2", "Passport photos"],
    ];

    for (const [docKey, flagCode, docName] of appDocs) {
      if (!answers[docKey]) {
        let improvementMsg: string;
        switch (flagCode) {
          case "NO_INTERVIEW_LETTER":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_INTERVIEW_LETTER;
            break;
          case "NO_PASSPORT_PHOTOS_2X2":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_PASSPORT_PHOTOS_2X2;
            break;
          default:
            improvementMsg = `Required application document missing: ${docName}`;
        }

        risks.push({
          flagCode,
          severity: "MEDIUM",
          explanation: `No ${docName} provided`,
          improvement: improvementMsg,
        });
        score -= 3;
      }
    }
    // Vaccination documents
    const polioVaccine = answers.polio_vaccination_certificate || false;

    if (!polioVaccine) {
      risks.push({
        flagCode: "NO_POLIO_VACCINATION_PROOF",
        severity: "MEDIUM",
        explanation: "No polio vaccination proof. Per CDC guidance, Pakistan is a high-risk country for polio, making this requirement critical for immigrant visa applicants.",
        improvement: IMPROVEMENT_MESSAGES.NO_POLIO_VACCINATION_PROOF,
      });
      score -= 2;
    }

    // Check for financial documentation
    const financialDocs: [string, FlagCode, string][] = [
      ["has_tax_returns", "NO_TAX_RETURNS_AVAILABLE", "Tax returns"],
      ["has_employment_letter", "NO_EMPLOYMENT_PROOF", "Employment letter"],
      ["has_paystubs", "NO_PAYSTUBS", "Pay stubs"],
    ];

    for (const [docKey, flagCode, docName] of financialDocs) {
      if (!answers[docKey]) {
        let improvementMsg: string;
        switch (flagCode) {
          case "NO_TAX_RETURNS_AVAILABLE":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_TAX_RETURNS_AVAILABLE;
            break;
          case "NO_EMPLOYMENT_PROOF":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_EMPLOYMENT_PROOF;
            break;
          case "NO_PAYSTUBS":
            improvementMsg = IMPROVEMENT_MESSAGES.NO_PAYSTUBS;
            break;
          default:
            improvementMsg = `Financial documentation missing: ${docName}`;
        }

        risks.push({
          flagCode,
          severity: "MEDIUM",
          explanation: `No ${docName} provided`,
          improvement: improvementMsg,
        });
        score -= 5;
      }
    }

    const MIN_DOCUMENT_SCORE = COMPONENT_WEIGHTS.DOCUMENT_COMPLETENESS * 0.2;

    score = Math.min(COMPONENT_WEIGHTS.DOCUMENT_COMPLETENESS, Math.max(score, MIN_DOCUMENT_SCORE));

    return { score, risks };
  }

  static calculateImmigrationHistoryScore(
    answers: Record<string, unknown>,
  ): ScoringResult {
    const risks: RiskFlag[] = [];
    let score = COMPONENT_WEIGHTS.IMMIGRATION_HISTORY;

    // Check for previous visa issues
    if (answers.previous_visa_denial) {
      risks.push({
        flagCode: "PREVIOUS_US_VISA_DENIAL",
        severity: "HIGH",
        explanation: "Previous US visa denial",
        improvement: IMPROVEMENT_MESSAGES.PREVIOUS_US_VISA_DENIAL,
      });
      score -= RISK_POINTS_DEDUCTION.HIGH;
    }

    if (answers.overstay_or_violation) {
      risks.push({
        flagCode: "PRIOR_IMMIGRATION_VIOLATION",
        severity: "HIGH",
        explanation: "Prior immigration violation",
        improvement: IMPROVEMENT_MESSAGES.PRIOR_IMMIGRATION_VIOLATION,
      });
      score -= RISK_POINTS_DEDUCTION.HIGH;
    }

    if (answers.criminal_record) {
      risks.push({
        flagCode: "CRIMINAL_HISTORY_PRESENT",
        severity: "HIGH",
        explanation: "Criminal record present",
        improvement: IMPROVEMENT_MESSAGES.CRIMINAL_HISTORY_PRESENT,
      });
      score -= RISK_POINTS_DEDUCTION.HIGH;
    }

    // Check for cousin marriage risk based on intended state
    const spousalRelationshipType = answers.spousal_relationship_type;
    const intendedState = answers.intended_us_state_of_residence as string;

    if (spousalRelationshipType === "First cousins" && intendedState) {
      // States that prohibit or restrict cousin marriages
      const restrictedStates = [
        "Arizona",
        "Arkansas",
        "Connecticut",
        "Delaware",
        "Idaho",
        "Illinois",
        "Indiana",
        "Iowa",
        "Kansas",
        "Kentucky",
        "Louisiana",
        "Michigan",
        "Minnesota",
        "Mississippi",
        "Missouri",
        "Montana",
        "Nebraska",
        "Nevada",
        "North Dakota",
        "Ohio",
        "Oklahoma",
        "Oregon",
        "Pennsylvania",
        "South Dakota",
        "Tennessee",
        "Texas",
        "Utah",
        "Washington",
        "West Virginia",
        "Wisconsin",
        "Wyoming",
      ];

      if (restrictedStates.includes(intendedState)) {
        risks.push({
          flagCode: "MARRIAGE_INVALID_IN_INTENDED_STATE",
          severity: "MEDIUM",
          explanation: `Cousin marriage may face legal or policy scrutiny in ${intendedState}`,
          improvement: IMPROVEMENT_MESSAGES.MARRIAGE_INVALID_IN_INTENDED_STATE,
        });
        score -= RISK_POINTS_DEDUCTION.MEDIUM;
      }
    }

    // Check for joint sponsor
    const householdSize = Math.max(
      1,
      Number(answers.household_size) || 2,
    );
    const povertyThreshold =
      INCOME_THRESHOLDS.POVERTY_GUIDELINE_BASE +
      INCOME_THRESHOLDS.ADDITIONAL_PER_PERSON * Math.max(0, householdSize - 1);
    
    const isMilitary = answers.industry_sector === "Military/Defense" || answers.prior_military_service === true;
    const requiredRatio = isMilitary ? 1.0 : INCOME_THRESHOLDS.CRITICAL_RATIO;

    if (
      Number(answers.sponsor_annual_income) < povertyThreshold * requiredRatio &&
      !answers.joint_sponsor_available
    ) {
      risks.push({
        flagCode: "NO_JOINT_SPONSOR_WHEN_REQUIRED",
        severity: "HIGH",
        explanation: "No joint sponsor when income is insufficient",
        improvement: IMPROVEMENT_MESSAGES.NO_JOINT_SPONSOR_WHEN_REQUIRED,
      });
      score -= 15;
    }

    // Check I-864 documents
    if (!answers.i864_affidavit_submitted) {
      risks.push({
        flagCode: "NO_I864_SUBMITTED",
        severity: "HIGH",
        explanation: "Form I-864 not submitted",
        improvement: IMPROVEMENT_MESSAGES.NO_I864_SUBMITTED,
      });
      score -= 10;
    }

    if (!answers.i864_supporting_financial_documents) {
      risks.push({
        flagCode: "I864_FINANCIAL_EVIDENCE_WEAK",
        severity: "MEDIUM",
        explanation: "No supporting financial documents for I-864",
        improvement: IMPROVEMENT_MESSAGES.I864_FINANCIAL_EVIDENCE_WEAK,
      });
      score -= 5;
    }

    // Background & Security Risks (Integrated into Immigration/Background score)
    if (
      answers.industry_sector === "Military/Defense" ||
      answers.prior_military_service === true
    ) {
      risks.push({
        flagCode: "WORKING_IN_DEFENSE_SECTOR",
        severity: "MEDIUM",
        explanation:
          "Defense or military background can trigger additional security screening (Administrative Processing).",
        improvement: IMPROVEMENT_MESSAGES.WORKING_IN_DEFENSE_SECTOR,
      });
      score -= RISK_POINTS_DEDUCTION.MEDIUM;
    }

    if (answers.specialized_weapons_training === true) {
      risks.push({
        flagCode: "DUAL_USE_TECHNOLOGY_RISK",
        severity: "HIGH",
        explanation:
          "Specialized training involving weapons or hazardous materials may raise security-related concerns.",
        improvement: IMPROVEMENT_MESSAGES.DUAL_USE_TECHNOLOGY_RISK,
      });
      score -= RISK_POINTS_DEDUCTION.HIGH;
    }

    if (answers.unofficial_armed_groups === true) {
      risks.push({
        flagCode: "WORKING_IN_DEFENSE_SECTOR",
        severity: "HIGH",
        explanation:
          "Association with unofficial armed groups is considered a serious risk factor in visa adjudication.",
        improvement: IMPROVEMENT_MESSAGES.UNOFFICIAL_ARMED_GROUPS,
      });
      score -= RISK_POINTS_DEDUCTION.HIGH;
    }

    // I-130 Status Check
    if (answers.i130_status === "Not filed yet") {
      risks.push({
        flagCode: "I130_PROCESS_NOT_STARTED",
        severity: "HIGH",
        explanation: "Form I-130 has not been filed. This is the first essential step for any spouse visa.",
        improvement: IMPROVEMENT_MESSAGES.I130_PROCESS_NOT_STARTED,
      });
      score -= 20;
    } else if (answers.i130_status === "Filed but pending" || answers.i130_status === "Pending") {
      risks.push({
        flagCode: "I130_PROCESS_NOT_STARTED",
        severity: "LOW",
        explanation: "Form I-130 is pending. While the process has started, you must wait for approval before NVC processing.",
        improvement: IMPROVEMENT_MESSAGES.I130_PROCESS_NOT_STARTED,
      });
      score -= 5;
    }

    const MIN_IMMIGRATION_SCORE = COMPONENT_WEIGHTS.IMMIGRATION_HISTORY * 0.2;

    score = Math.min(COMPONENT_WEIGHTS.IMMIGRATION_HISTORY, Math.max(score, MIN_IMMIGRATION_SCORE));

    return { score, risks };
  }

  static calculateTotalScore(answers: Record<string, unknown>) {
    // Calculate individual component scores
    const householdSize = Math.max(
      1,
      this.safeNumber(answers.household_size, 2),
    );

    const income = this.safeNumber(answers.sponsor_annual_income, 0);

    const { score: incomeScore, risks: incomeRisks } =
      this.calculateIncomeScore(answers, income, householdSize);

    const { score: relationshipScore, risks: relationshipRisks } =
      this.calculateRelationshipScore(answers);
    const { score: documentScore, risks: documentRisks } =
      this.calculateDocumentScore(answers);
    const { score: immigrationScore, risks: immigrationRisks } =
      this.calculateImmigrationHistoryScore(answers);

    // Calculate total score
    const rawTotalScore =
      incomeScore + relationshipScore + documentScore + immigrationScore;

    // Ensure score stays within database limits (DECIMAL(5,2) can handle up to 99.99)
    // But we cap at 100 as per business logic
    const totalScore = Number.isFinite(rawTotalScore)
      ? Math.min(MAX_TOTAL_SCORE, Math.max(MIN_TOTAL_SCORE, rawTotalScore))
      : MIN_TOTAL_SCORE;
    
    // Ensure we never exceed 99.99 to prevent database overflow
    // This handles edge cases where rounding might push us slightly over 100
    const finalScore = Math.min(99.99, totalScore);

    // Determine risk level
    let riskLevel: "STRONG" | "MODERATE" | "WEAK";
    if (finalScore > 80) {
      riskLevel = "STRONG";
    } else if (finalScore > 50) {
      riskLevel = "MODERATE";
    } else {
      riskLevel = "WEAK";
    }

    // Combine all risks
    const allRisks = [
      ...incomeRisks,
      ...relationshipRisks,
      ...documentRisks,
      ...immigrationRisks,
    ];

    // Generate summary reasons and suggestions
    const summaryReasons: string[] = [];
    const improvementSuggestions: string[] = [];

    if (finalScore <= 50) {
      summaryReasons.push(
        "Your case has multiple high-impact issues that could significantly affect visa approval.",
      );
      improvementSuggestions.push(
        "Prioritize resolving high-risk items such as missing critical documents, financial eligibility, or relationship evidence before proceeding.",
      );
    } else if (finalScore <= 80) {
      summaryReasons.push(
        "Your case shows legitimate strengths, but some areas may raise questions during review.",
      );
      improvementSuggestions.push(
        "Strengthen medium-risk areas by adding supporting documentation and clarifying any potential concerns.",
      );
    } else {
      summaryReasons.push(
        "Your case demonstrates strong overall eligibility with well-supported evidence.",
      );
      improvementSuggestions.push(
        "Maintain document accuracy and be prepared to clearly explain your case during the interview.",
      );
    }

    return {
      totalScore: finalScore,
      allRisks,
      riskLevel,
      summaryReasons,
      improvementSuggestions,
    };
  }

  private static safeNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  //   Calculate age from date of birth
  private static calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }
}
