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
  placeOfMarriage?: { // For spouse
    city: string;
    state?: string;
    country: string;
  };
}

export interface MasterProfile {
  // Personal
  name: PersonName;
  otherNames?: PersonName[]; // Maiden names, aliases
  dateOfBirth: string;
  placeOfBirth: {
    city: string;
    country: string;
  };
  sex: "Male" | "Female";
  nationality?: string; // Country of citizenship
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "Separated" | "Annulled";
  
  // Application Context
  visaType?: string; // Primary visa/case type being applied for (IR-1, CR-1, K-1, etc.)
  visaCategory?: string; // Sub-category if applicable
  fullName?: string; // Full name in single field format (some forms prefer this)
  
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
      country: string;
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
  
  // Sponsor Information (when user is the beneficiary applying for visa)
  sponsor?: {
    name: PersonName;
    dateOfBirth: string;
    phone?: string;
    email?: string;
    address?: Address;
  };
  
  // Beneficiary Information (when user is the sponsor petitioning for someone)
  beneficiary?: {
    name: PersonName;
    dateOfBirth: string;
    countryOfResidence?: string;
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

  // Visa Eligibility Tool Specifics
  visaEligibility?: {
    petitionerStatus?: "US_CITIZEN" | "LPR" | "NONE";
    statusOrigin?: "NATURALIZED" | "BIRTH" | "GREEN_CARD";
    petitionerAgeGroup?: "UNDER_21" | "OVER_21";
    relationship?: "SPOUSE" | "PARENT" | "CHILD" | "SIBLING" | "FIANCE" | "OTHER" | "EMPLOYMENT" | "CHILD_UNDER_21" | "SON_DAUGHTER_ADULT" | "SON_DAUGHTER_MARRIED";
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
}

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
