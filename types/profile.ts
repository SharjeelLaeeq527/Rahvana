export interface Address {
  street: string;
  unit?: string;
  unitType?: "Apt" | "Ste" | "Flr";
  city: string;
  state: string;
  zipCode: string;
  province?: string;
  postalCode?: string;
  country: string;
  dateFrom?: string;
  dateTo?: string; // "PRESENT" if current
}

export interface PersonName {
  first: string;
  middle?: string;
  last: string;
}

export interface FamilyMember {
  relationship: "Father" | "Mother" | "Spouse" | "Child" | "Sibling";
  name: PersonName;
  dateOfBirth: string; // ISO date
  placeOfBirth: {
    city: string;
    country: string;
  };
  isDeceased?: boolean;
  dateOfMarriage?: string; // For spouse
  placeOfMarriage?: {
    // For spouse
    city: string;
    state?: string;
    country: string;
  };
}

export interface MasterProfile {
  // Personal
  name: PersonName;
  otherNames?: PersonName[]; // Maiden names, aliases
  nativeFullName?: string; // Full name in native alphabet (Urdu) — DS-260 S01-Q003
  dateOfBirth: string;
  placeOfBirth: {
    city: string;
    state?: string; // Province/state — DS-260 S01-Q008 asks it; mapper already maps it
    country: string;
  };
  sex: "Male" | "Female" | "";
  nationality?: string; // Country of citizenship
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "Separated" | "Annulled";

  // Application Context
  visaType?: string; // Primary visa/case type being applied for (IR-1, CR-1, K-1, etc.)
  visaCategory?: string; // Sub-category if applicable
  visaCases?: Array<{
    id?: string;
    type?: string;
    caseType?: string;
    status?: "active" | "past" | "planned" | "current" | "previous" | "future";
    filedDate?: string;
  }>;
  fullName?: string; // Full name in single field format (some forms prefer this)
  caseNumber?: string;
  interviewDate?: string;
  interviewLocation?: string; // Embassy/consulate city (e.g. "Islamabad")
  caseStatus?: string;
  nvcInvoice?: string;
  surname?: string;

  // USCIS Approval (from I-797 Approval Notice — Chapter 1 Step I-10)
  receiptNumber?: string; // USCIS receipt number (e.g. IOE1234567890)
  approvalDate?: string; // I-130 approval date
  priorityDate?: string; // Priority date from approval notice

  // Documentary Qualification (from NVC DQ — Chapter 2 Step II-10)
  dqDate?: string; // Date DQ status was received
  dqPost?: string; // Consular post (e.g. "Islamabad")

  // Interview Outcome (from Chapter 3 Step III-06)
  interviewOutcome?: string; // "approved" | "221g" | "denied"
  outcome221gSubtype?: string; // "docs_requested" | "further_review" | etc.

  // Medical Exam (from Chapter 3 Step III-01/04)
  medicalDate?: string; // Medical appointment date
  medicalTime?: string; // Medical appointment time
  medicalClinic?: string; // IOM clinic name

  // Police Certificate (from Chapter 3 Step III-02)
  pccDate?: string; // PCC application date

  // Relationship & Family (NEW)
  spouse?: {
    name: PersonName;
    dateOfBirth: string;
    placeOfBirth: {
      city: string;
      country: string;
    };
  };
  relationship?: {
    type: string; // "Spouse", "Fiance", etc.
    startDate: string; // relationship_start_date
    marriageDate?: string; // date_of_marriage
    marriagePlace?: {
      city: string;
      state?: string; // Province/state of marriage — I-130 Item 20.b/20.c
      country: string;
    };
    marriageRegistrationNumber?: string; // NADRA MRC / Union Council registration no.
    dateOfRegistration?: string; // ISO date the marriage was registered (NADRA MRC)
    // Both parties exactly as printed on the marriage certificate. Stored faithfully
    // for display/verification — NOT auto-mapped to applicant vs sponsor (the cert
    // doesn't say which party is which; that identity comes from passports/CNIC).
    husbandName?: string;
    husbandFatherName?: string;
    wifeName?: string;
    wifeFatherName?: string;
    // Prior marriage (from a divorce decree / death certificate). Feeds I-130
    // "Names of Spouses" (prior spouse) and powers the first-marriage warning.
    priorMarriage?: {
      spouseName?: string;
      dateMarriageEnded?: string; // ISO date
      howEnded?: "divorce" | "death" | "annulment";
      country?: string;
    };
    howDidYouMeet?: string;
    numberOfInPersonVisits?: number;
    lastMeetingDate?: string;

    // Relationship Evidence
    cohabitationProof?: boolean;
    sharedFinancialAccounts?: boolean;
    weddingPhotos?: boolean;
    communicationLogs?: boolean;
    moneyTransferReceipts?: boolean;
    meetingProof?: boolean;
  };

  // Sponsor / Petitioner Information — the US spouse. The account holder is the
  // BENEFICIARY (top-level fields are theirs), so the sponsor's own biographic
  // data lives here. Feeds I-130 Part 1 (petitioner) autofill and the sponsor's
  // document OCR (US passport / citizenship proof).
  sponsor?: {
    name: PersonName;
    dateOfBirth: string;
    placeOfBirth?: { city?: string; state?: string; country?: string };
    sex?: "Male" | "Female" | "";
    nationality?: string;
    passportNumber?: string;
    passportIssueDate?: string;
    passportPlaceOfIssue?: string; // City/authority where passport was issued
    passportBookNumber?: string; // DS-260 passport book number
    passportExpiry?: string;
    passportCountry?: string;
    ssn?: string;
    alienNumber?: string;
    uscisAccountNumber?: string;
    // U.S. citizenship proof (naturalization certificate) — I-130 Items 39.a/39.c
    citizenshipCertNumber?: string;
    citizenshipCertDate?: string;
    phone?: string;
    email?: string;
    address?: Address;
  };

  // Beneficiary Information (when user is the sponsor petitioning for someone)
  // Mirrors the biographic fields forms (I-130A, DS-260) ask about the beneficiary,
  // so they can be captured once (passport/birth-cert OCR) and auto-filled everywhere.
  beneficiary?: {
    name: PersonName;
    dateOfBirth: string;
    countryOfResidence?: string;
    nationality?: string; // Country of citizenship (e.g. from passport OCR)
    sex?: "Male" | "Female" | "";
    placeOfBirth?: { city?: string; state?: string; country?: string };
    cnic?: string; // National ID (from CNIC OCR)
    nativeFullName?: string; // Full name in native alphabet (Urdu) — DS-260 S01-Q003
    passportNumber?: string;
    passportIssueDate?: string;
    passportPlaceOfIssue?: string; // City/authority where passport was issued
    passportBookNumber?: string; // DS-260 passport book number
    passportExpiry?: string;
    passportCountry?: string;
  };

  // Family Background (Parents are critical for almost all forms)
  father?: {
    name: PersonName;
    dateOfBirth: string;
    placeOfBirth: {
      city: string;
      country: string;
    };
    cityOfResidence?: string;
    countryOfResidence?: string;
    isDeceased?: boolean;
  };
  mother?: {
    name: PersonName;
    dateOfBirth: string;
    placeOfBirth: {
      city: string;
      country: string;
    };
    cityOfResidence?: string;
    countryOfResidence?: string;
    isDeceased?: boolean;
  };

  // Identifiers
  ssn?: string;
  alienNumber?: string;
  uscisAccountNumber?: string;
  passportNumber?: string;
  passportIssueDate?: string; // Date passport was issued
  passportPlaceOfIssue?: string; // City/authority where passport was issued — DS-260
  passportBookNumber?: string; // DS-260 passport book number
  passportExpiry?: string;
  passportCountry?: string; // Country that issued the passport
  cnic?: string; // National ID (Pakistan/other countries)

  // Status Info
  citizenshipStatus?: "USCitizen" | "LPR" | "Other";
  naturalizationInfo?: {
    certificateNumber?: string;
    placeOfIssuance?: string;
    dateOfIssuance?: string;
  };

  // Contact
  phone: string;
  email: string;
  currentAddress: Address;
  mailingAddress?: Address; // If different
  sameAsCurrentAddress?: boolean;

  // History
  addressHistory: Address[]; // Past 5 years

  // Family
  family: FamilyMember[];
  householdSize?: number; // household_size

  // Immigration & Travel
  visaStatus?: string;
  i94Record?: string;
  lastEntryDate?: string;
  immigrationHistory?: {
    previousVisaApplications?: boolean;
    previousVisaDenial?: boolean;
    overstayOrViolation?: boolean;
    criminalRecord?: boolean;
    removedOrDeported?: boolean;

    // Security Questions
    priorMilitaryService?: boolean;
    specializedWeaponsTraining?: boolean;
    unofficialArmedGroups?: boolean;
  };
  intendedUSState?: string; // intended_us_state_of_residence

  // Employment
  occupation: string;
  jobTitle?: string; // current_occupation_role
  industrySector?: string; // industry_sector
  employerType?: string; // employer_type
  employer: {
    name: string;
    address?: Address;
  };
  employmentHistory?: any[]; // Simplified for now

  // Financial
  annualIncome?: string; // Store as string
  financialProfile?: {
    hasTaxReturns?: boolean;
    hasEmploymentLetter?: boolean;
    hasPaystubs?: boolean;
    hasBankStatements?: boolean;

    // Sponsorship
    jointSponsorAvailable?: boolean;
    i864AffidavitSubmitted?: boolean;
    i864SupportingDocs?: boolean;
  };

  // Education
  educationLevel?: string;
  educationField?: string; // highest_education_field

  // Documents Available (for readiness check)
  documents?: {
    hasPassport?: boolean;
    hasBirthCertificate?: boolean;
    hasMarriageCertificate?: boolean;
    hasPoliceCertificate?: boolean;
    hasMedicalRecord?: boolean;
    hasPhotos?: boolean;

    // Specific Translations/Certs
    urduMarriageCertificate?: boolean;
    englishTranslationCertificate?: boolean;
    unionCouncilCertificate?: boolean;
    familyRegistrationCertificate?: boolean;

    // Interview Prep
    ds260Confirmation?: boolean;
    interviewLetter?: boolean;
    courierRegistration?: boolean;
    polioVaccination?: boolean;
    covidVaccination?: boolean;
  };

  // Affidavit Support Calculator Fields
  sponsorStatus?: "citizen" | "greenCard";
  isMilitary?: boolean;
  isMarried?: boolean;
  numberOfChildren?: number;
  taxDependents?: number;
  hasPreviousSponsorship?: boolean;
  previousSponsoredCount?: number;
  currentSponsoredApplicant?: boolean;
  currentSponsoredSpouse?: boolean;
  currentSponsoredChildren?: number;
  sponsorDeceased?: boolean;
  assetValue?: number;
  relationshipToApplicant?: string;
  isVAWA?: boolean;
  isWidow?: boolean;
  isSpecialImmigrant?: boolean;
  standaloneSponsorshipDraft?: {
    stepIdx: number;
    data: any;
    updatedAt: string;
  };
  standaloneSponsorshipCalc?: any;
  standalone221gDraft?: import("@/app/(tools)/(visa)/221g-action-planner/types/221g").TwentyTwoOneGDraft;
  standalone221gResult?: import("@/app/(tools)/(visa)/221g-action-planner/types/221g").TwentyTwoOneGResult;
  standalonePassportPhotos?: import("./passport-photo").PassportPhotoItem[];

  // Visa Eligibility Tool Specifics
  visaEligibility?: {
    petitionerStatus?: "US_CITIZEN" | "LPR" | "NONE";
    statusOrigin?: "NATURALIZED" | "BIRTH" | "GREEN_CARD";
    petitionerAgeGroup?: "UNDER_21" | "OVER_21";
    relationship?:
      | "SPOUSE"
      | "PARENT"
      | "CHILD"
      | "SIBLING"
      | "FIANCE"
      | "OTHER"
      | "EMPLOYMENT"
      | "CHILD_UNDER_21"
      | "SON_DAUGHTER_ADULT"
      | "SON_DAUGHTER_MARRIED";
    legalStatus?: "MARRIAGE_REGISTERED" | "BIOLOGICAL" | "ADOPTIVE" | "STEP";
    applicantAgeGroup?: "UNDER_21" | "OVER_21";
    applicantMaritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED_WIDOWED";
    applicantLocation?: "OUTSIDE_US" | "INSIDE_US" | "PAKISTAN" | "OTHER_COUNTRY";
    isLegallyMarried?: "YES" | "NO";
    marriageDuration?: "LESS_THAN_2" | "MORE_THAN_2";
    violationHistory?: "YES" | "NO" | "NOT_SURE";
    intent?: "PERMANENT" | "TEMPORARY";
    tempPurpose?: "TOURISM" | "STUDY" | "WORK" | "HUMANITARIAN";
    sponsorBase?: "FAMILY" | "EMPLOYMENT" | "INVESTMENT" | "HUMANITARIAN";
  };

  // Visa Case Strength Specifics
  caseStrength?: {
    caseType?: string;
    lastSessionId?: string;
    // We store the exact simplified answers from the tool
    answers?: Record<string, unknown>;
    // Or we can just store the result summary if needed, but likely we want the inputs to re-populate
  };

  // 221g Action Planner Specifics
  actionPlanner?: {
    caseStatus?: string;
    interviewDate?: string;
    lastSessionId?: string;
    documentsRequested?: string[];
    questionnaire?: Record<string, unknown>;
  };

  // Journey-scoped profile data to prevent multi-journey bleed
  journeys?: Record<string, Record<string, any>>;

  // Multi-Candidate / Beneficiary profiles (IR-5 parents, IR-2 children)
  activeCandidateId?: string;
  candidates?: import("./candidate").CandidateProfile[];
  candidateSync?: import("./candidate").CandidateSyncConfig;
}

export * from "./candidate";

export interface QuestionDefinition {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
  options?: string | string[];
  risk_tag?: string;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: QuestionDefinition[];
}

export interface QuestionnaireData {
  sections: QuestionnaireSection[];
}
