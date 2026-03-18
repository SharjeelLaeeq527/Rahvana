import { MasterProfile } from "@/types/profile";

/**
 * FIELD MAPPING REGISTRY
 * Central registry for common field name variations across different tools
 * Keys are the MasterProfile paths (dot notation), Values are arrays of possible form field names
 */
export const FIELD_MAPPINGS: Record<string, string[]> = {
  // --- Application Context (CRITICAL: Primary standardization) ---
  'visaType': ['visaType', 'caseType', 'visa_type', 'case_type', 'visa_category', 'visaCategory', 'visa_class', 'Visa Type', 'visa-type'],
  
  // --- Personal ---
  'name.first': ['pt1_l6b_givenname', 'p1_given_name', 'first_name', 'given_name', 'applicant_first_name', 'sponsor_first_name', 'givenName', 'firstName', 'S01-Q001_first'],
  'name.middle': ['pt1_l6c_middlename', 'p1_middle_name', 'middle_name', 'applicant_middle_name', 'sponsor_middle_name', 'middleName', 'S01-Q001_middle'],
  'name.last': ['pt1_l6a_familyname', 'p1_family_name', 'family_name', 'surname', 'last_name', 'applicant_last_name', 'sponsor_last_name', 'S01-Q001_last', 'S01-Q001', 'last_name'],
  'dateOfBirth': ['pt1_l22_dateofbirth', 'S01-Q006', 'dob', 'date_of_birth', 'birth_date', 'sponsor_dob', 'applicant_dob', 'dateOfBirth', 'beneficiary_dob', 'dob'],
  'placeOfBirth.city': ['S01-Q007', 'city_of_birth', 'birth_city'],
  'placeOfBirth.state': ['S01-Q008', 'state_of_birth', 'province_of_birth', 'birth_state'],
  'placeOfBirth.country': ['S01-Q009', 'country_of_birth', 'birth_country'],
  'sex': ['S01-Q004', 'sex', 'gender', 'applicant_sex', 'sponsor_sex', 'applicant_gender', 'Gender'],
  'nationality': ['nationality', 'country_of_citizenship', 'citizenship_country', 'citizen_of'],
  'maritalStatus': ['S01-Q005', 'marital_status', 'civil_status', 'current_marital_status'],

  // --- Contact ---
  'phone': ['pt5_l1_daytimephonenumber1', 'pt5_l2_mobilenumber1', 'p4_phone', 'phone_number', 'telephone', 'contact_number', 'daytime_phone', 'contactNumber', 'mobile', 'sponsor_phone', 'contactNumber'],
  'email': ['pt5_l3_email', 'p4_email', 'email_address', 'contact_email', 'email', 'sponsor_email'],
  'currentAddress.street': ['pt1_l9_streetnumbername', 'pt1_l8_streetnumbername', 'p1_addr1_street', 'street_address', 'address_line_1', 'current_street', 'mailing_street', 'address', 'sponsor_street'],
  'currentAddress.city': ['pt1_l9_cityortown', 'pt1_l8_cityortown', 'p1_addr1_city', 'city_name', 'current_city', 'mailing_city', 'city', 'sponsor_city'],
  'currentAddress.state': ['pt1_l9_state', 'pt1_l8_state', 'p1_addr1_state', 'state_province', 'current_state', 'mailing_state', 'state', 'sponsor_state'],
  'currentAddress.zipCode': ['pt1_l9_zipcode', 'pt1_l8_zipcode', 'p1_addr1_zip', 'zip', 'postal_code', 'zip_code', 'current_zip', 'mailing_zip', 'zipCode', 'sponsor_zip'],
  'currentAddress.country': ['pt1_l9_country', 'pt1_l8_country', 'p1_addr1_country', 'country_name', 'current_country', 'mailing_country', 'country_of_residence', 'beneficiary_country', 'destinationCountry', 'country', 'sponsor_country'],
  'intendedUSState': ['intended_us_state_of_residence', 'intended_state', 'destination_state', 'state_of_residence'],

  // --- Identifiers ---
  'passportNumber': ['passport_number', 'passportNumber', 'passport'],
  'passportIssueDate': ['passport_issue_date', 'passportIssueDate', 'passportIssue', 'passport_issue', 'date_of_issue'],
  'passportExpiry': ['passport_expiry', 'passportExpiryDate', 'passport_expiration_date', 'passport_expiry_date'],
  'passportCountry': ['passport_country', 'passportCountry', 'country_of_passport', 'issuing_country'],
  'ssn': ['ssn', 'social_security_number'],
  'alienNumber': ['p1_alien_number', 'a_number', 'alien_registration_number', 'alien_number'],
  'uscisAccountNumber': ['uscis_account_number', 'uscisAccountNumber', 'uscis_number', 'uscis_account'],
  'cnic': ['cnic', 'national_id', 'id_number', 'national_id_number'],

  // --- Relationship ---
  'relationship.type': ['relationship_type', 'spousal_relationship_type', 'relationshipType'],
  'relationship.startDate': ['relationship_start_date', 'relationshipStartDate'],
  'relationship.marriageDate': ['marriage_date', 'date_of_marriage', 'wedding_date'],
  'relationship.howDidYouMeet': ['how_did_you_meet', 'meeting_story'],
  'relationship.numberOfInPersonVisits': ['number_of_in_person_visits', 'visit_count'],
  
  // Relationship Evidence
  'relationship.cohabitationProof': ['cohabitation_proof'],
  'relationship.sharedFinancialAccounts': ['shared_financial_accounts'],
  'relationship.weddingPhotos': ['wedding_photos_available'],
  'relationship.communicationLogs': ['communication_logs'],
  'relationship.moneyTransferReceipts': ['money_transfer_receipts_available'],
  'relationship.meetingProof': ['meeting_proof', 'driving_license_copy_available'], // mapped driving license to generic meeting proof

  // --- Employment ---
  'occupation': ['occupation', 'current_occupation_role', 'jobTitle', 'currentOccupation', 'profession'],
  'jobTitle': ['job_title', 'position'],
  'employer.name': ['employer', 'employer_name', 'employerName', 'company_name'],
  'industrySector': ['industry_sector', 'industry'],
  'employerType': ['employer_type'],
  'annualIncome': ['p2_income', 'annual_income', 'annualIncome', 'sponsor_annual_income', 'income', 'yearly_income'],

  // --- Education ---
  'educationLevel': ['education_level', 'educationLevel', 'highest_education_level', 'highest_education'],
  'educationField': ['education_field', 'educationField', 'highest_education_field', 'field_of_study'],

  // --- Immigration History ---
  'immigrationHistory.previousVisaApplications': ['previous_visa_applications'],
  'immigrationHistory.previousVisaDenial': ['previous_visa_denial'],
  'immigrationHistory.overstayOrViolation': ['overstay_or_violation'],
  'immigrationHistory.criminalRecord': ['criminal_record'],
  'immigrationHistory.priorMilitaryService': ['prior_military_service'],
  'immigrationHistory.specializedWeaponsTraining': ['specialized_weapons_training'],
  'immigrationHistory.unofficialArmedGroups': ['unofficial_armed_groups'],

  // --- Financial Profile ---
  'householdSize': ['household_size', 'family_size'],
  'financialProfile.hasTaxReturns': ['has_tax_returns'],
  'financialProfile.hasEmploymentLetter': ['has_employment_letter'],
  'financialProfile.hasPaystubs': ['has_paystubs'],
  'financialProfile.jointSponsorAvailable': ['joint_sponsor_available'],
  'financialProfile.i864AffidavitSubmitted': ['i864_affidavit_submitted'],
  'financialProfile.i864SupportingDocs': ['i864_supporting_financial_documents'],
  'financialProfile.assetValue': ['asset_value', 'assets', 'total_assets'],

  // --- Documents ---
  'documents.hasPassport': ['passports_available', 'has_passport', 'passport_copy_available'],
  'documents.hasBirthCertificate': ['birth_certificates', 'has_birth_certificate'],
  'documents.hasPoliceCertificate': ['valid_police_clearance_certificate', 'has_police_certificate'],
  'documents.ds260Confirmation': ['ds260_confirmation'],
  'documents.interviewLetter': ['interview_letter'],
  'documents.courierRegistration': ['courier_registration'],
  'documents.hasMedicalRecord': ['medical_report_available'],
  'documents.polioVaccination': ['polio_vaccination_certificate'],
  'documents.covidVaccination': ['covid_vaccination_certificate'],
  'documents.urduMarriageCertificate': ['urdu_marriage_certificate'],
  'documents.englishTranslationCertificate': ['english_translation_certificate'],
  'documents.unionCouncilCertificate': ['union_council_certificate'],
  'documents.familyRegistrationCertificate': ['family_registration_certificate'],
  'documents.hasPhotos': ['passport_photos_2x2'],

  // --- Parents ---
  'father.name.first': ['p1_parent1_given_name', 'parent1_given_name', 'father_first_name'],
  'father.name.middle': ['p1_parent1_middle_name', 'parent1_middle_name', 'father_middle_name'],
  'father.name.last': ['p1_parent1_family_name', 'parent1_family_name', 'father_last_name'],
  'father.dateOfBirth': ['p1_parent1_dob', 'parent1_date_of_birth', 'father_dob'],
  'father.placeOfBirth.city': ['p1_parent1_city_birth', 'parent1_city_birth', 'father_birth_city'],
  'father.placeOfBirth.country': ['p1_parent1_country_birth', 'parent1_country_birth', 'father_birth_country'],
  'father.cityOfResidence': ['parent1_city_residence', 'father_current_city'],
  'father.countryOfResidence': ['p1_parent1_country_res', 'parent1_country_residence', 'father_current_country'],

  'mother.name.first': ['p1_parent2_given_name', 'parent2_given_name', 'mother_first_name'],
  'mother.name.middle': ['p1_parent2_middle_name', 'parent2_middle_name', 'mother_middle_name'],
  'mother.name.last': ['p1_parent2_family_name', 'parent2_family_name', 'mother_last_name'],
  'mother.dateOfBirth': ['p1_parent2_dob', 'parent2_date_of_birth', 'mother_dob'],
  'mother.placeOfBirth.city': ['p1_parent2_city_birth', 'parent2_city_birth', 'mother_birth_city'],
  'mother.placeOfBirth.country': ['p1_parent2_country_birth', 'parent2_country_birth', 'mother_birth_country'],
  'mother.cityOfResidence': ['parent2_city_residence', 'mother_current_city', 'parent2_city_residence'],
  'mother.countryOfResidence': ['p1_parent2_country_res', 'parent2_country_residence', 'mother_current_country', 'parent2_country_residence'],

  // --- Naturalization ---
  'citizenshipStatus': ['citizenship_status', 'citizenshipStatus'],
  'naturalizationInfo.certificateNumber': ['certificate_number', 'naturalization_certificate_number'],
  'naturalizationInfo.placeOfIssuance': ['certificate_place', 'naturalization_place'],
  'naturalizationInfo.dateOfIssuance': ['certificate_date', 'naturalization_date'],

  // --- Affidavit Support Calculator ---
  'sponsorStatus': ['sponsorStatus', 'sponsor_status'],
  'isMilitary': ['isMilitary', 'is_military', 'military_status'],
  'isMarried': ['isMarried', 'is_married', 'married_status'],
  'numberOfChildren': ['numberOfChildren', 'number_of_children', 'num_children'],
  'taxDependents': ['taxDependents', 'tax_dependents', 'dependents'],
  'hasPreviousSponsorship': ['hasPreviousSponsorship', 'has_previous_sponsorship', 'previous_sponsorship'],
  'previousSponsoredCount': ['previousSponsoredCount', 'previous_sponsored_count', 'previous_sponsored'],
  'currentSponsoredApplicant': ['currentSponsoredApplicant', 'current_sponsored_applicant', 'sponsoring_applicant'],
  'currentSponsoredSpouse': ['currentSponsoredSpouse', 'current_sponsored_spouse', 'sponsoring_spouse'],
  'currentSponsoredChildren': ['currentSponsoredChildren', 'current_sponsored_children', 'sponsoring_children'],
  'sponsorDeceased': ['sponsorDeceased', 'sponsor_deceased', 'deceased_sponsor'],
  'assetValue': ['assetValue', 'asset_value', 'assets'],
  'relationshipToApplicant': ['relationshipToApplicant', 'relationship_to_applicant', 'relationship', 'relationship_with_applicant'],
  'isVAWA': ['isVAWA', 'is_vawa', 'vawa'],
  'isWidow': ['isWidow', 'is_widow', 'widow'],
  'isSpecialImmigrant': ['isSpecialImmigrant', 'is_special_immigrant', 'special_immigrant'],
  
  // --- Visa Eligibility Tool Mappings (FutureAnswers) ---
  'visaEligibility.petitionerStatus': ['petitionerStatus'],
  'visaEligibility.statusOrigin': ['statusOrigin'],
  'visaEligibility.petitionerAgeGroup': ['petitionerAgeGroup'],
  'visaEligibility.relationship': ['relationship'], // Overlaps with generic, needs care
  'visaEligibility.legalStatus': ['legalStatus'],
  'visaEligibility.applicantAgeGroup': ['applicantAgeGroup'],
  'visaEligibility.applicantMaritalStatus': ['applicantMaritalStatus'],
  'visaEligibility.applicantLocation': ['applicantLocation'],
  'visaEligibility.isLegallyMarried': ['isLegallyMarried'],
  'visaEligibility.marriageDuration': ['marriageDuration'],
  'visaEligibility.violationHistory': ['violationHistory'],
  'visaEligibility.intent': ['intent'],
  'visaEligibility.tempPurpose': ['tempPurpose'],
  'visaEligibility.sponsorBase': ['sponsorBase'],
  
  // --- Sponsor Information (when user is beneficiary) ---
  'sponsor.name.first': ['sponsor_first_name', 'sponsor_given_name'],
  'sponsor.name.middle': ['sponsor_middle_name'],
  'sponsor.name.last': ['sponsor_last_name', 'sponsor_family_name', 'sponsor_surname'],
  'sponsor.dateOfBirth': ['sponsor_dob', 'sponsor_date_of_birth'],
  'sponsor.phone': ['sponsor_phone', 'sponsor_phone_number'],
  'sponsor.email': ['sponsor_email', 'sponsor_email_address'],
  'sponsor.address.street': ['sponsor_street', 'sponsor_street_address'],
  'sponsor.address.city': ['sponsor_city'],
  'sponsor.address.state': ['sponsor_state'],
  'sponsor.address.zipCode': ['sponsor_zip', 'sponsor_zip_code'],
  'sponsor.address.country': ['sponsor_country'],
  
  // --- Beneficiary Information (when user is sponsor) ---
  'beneficiary.name.first': ['pt2_l1b_givenname', 'beneficiary_first_name', 'beneficiary_given_name', 'applicant_first_name', 'fiance_given_name'],
  'beneficiary.name.middle': ['pt2_l1c_middlename', 'beneficiary_middle_name', 'applicant_middle_name', 'fiance_middle_name'],
  'beneficiary.name.last': ['pt2_l1a_familyname', 'beneficiary_last_name', 'beneficiary_family_name', 'applicant_last_name', 'fiance_family_name'],
  'beneficiary.dateOfBirth': ['pt2_l4_dateofbirth', 'beneficiary_dob', 'beneficiary_date_of_birth', 'applicant_dob', 'fiance_dob'],
  'beneficiary.countryOfResidence': ['pt2_l11_country', 'beneficiary_country', 'country_of_residence', 'applicant_country', 'fiance_addr_country'],
  'beneficiary.alienNumber': ['pt2_l2_aliennumber', 'beneficiary_a_number', 'fiance_a_number', 'beneficiary_alien_number'],
  'beneficiary.ssn': ['pt2_l3_ssn', 'beneficiary_ssn', 'fiance_ssn'],
  'beneficiary.address.street': ['pt2_l11_streetnumbername', 'beneficiary_street', 'fiance_street'],
  'beneficiary.address.city': ['pt2_l11_cityortown', 'beneficiary_city', 'fiance_city'],
  'beneficiary.address.state': ['pt2_l11_state', 'beneficiary_state', 'fiance_state'],
  'beneficiary.address.zipCode': ['pt2_l11_postalcode', 'pt2_l11_zipcode', 'beneficiary_zip'],
  'beneficiary.address.country': ['pt2_l11_country', 'beneficiary_country', 'fiance_country'],
  
  // --- Full Name Fields (for forms that ask for full name in one field) ---
  'fullName': ['full_name', 'fullName', 'sponsor_full_name', 'beneficiary_full_name', 'applicant_full_name'],
};

/**
 * Access a nested property safely using dot notation string
 * e.g. getNestedProperty(profile, 'name.first')
 */
function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (isObject(current)) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a nested property safely using dot notation string
 * Creates intermediate objects if they don't exist
 */
function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object';
}

function setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

/**
 * UNIVERSAL AUTO-FILL FUNCTION
 * Maps profile data to ANY form structure using the registry.
 *
 * @param profile - The user's master profile
 * @param formStructure - The target form's initial state (keys determine what we look for)
 * @returns Updated form data with autofilled values
 */
export const autoFillForm = (
  profile: MasterProfile | Partial<MasterProfile>,
  formStructure: Record<string, unknown>
): Record<string, unknown> => {
  const updatedForm = { ...formStructure } as Record<string, unknown>;

  // 1. Iterate through each field in the target form
  for (const formFieldKey of Object.keys(updatedForm)) {
    // Skip if field already has a meaningful user-entered value (optional optimization, remove if we want to overwrite)
    // Don't skip default initialization values like 0, false, null, etc., as these should be replaced by profile data on initial load
    const currentValue = updatedForm[formFieldKey];
    const isDefaultValue = currentValue === null ||
                          currentValue === "" ||
                          (typeof currentValue === 'number' && currentValue === 0) ||
                          (typeof currentValue === 'boolean' && currentValue === false);

    if (!isDefaultValue) {
      continue;
    }

    // 2. Find matching Profile Path from Registry
    let foundValue: unknown = undefined;

    for (const [profilePath, variations] of Object.entries(FIELD_MAPPINGS)) {
      if (variations.includes(formFieldKey)) {
        // Found a match! Get value from profile
        foundValue = getNestedProperty(profile as Record<string, unknown>, profilePath);

        // Special Handling for Income (strip non-numeric if target likely expects number or clean string)
        if (profilePath === 'annualIncome' && foundValue) {
           const clean = String(foundValue).replace(/[^0-9.]/g, "");
           foundValue = (typeof updatedForm[formFieldKey] === 'number') ? Number(clean) : clean;
        }

        break; // Stop checking other map entries
      }
    }

    // 3. If found, apply to form
    if (foundValue !== undefined && foundValue !== null) {
      updatedForm[formFieldKey] = foundValue;
    }
  }



  // Final Pass: Normalization
  
  // Normalize Gender (Book Appointment expects "M" / "F", Profile might have "Male" / "Female")
  if (updatedForm['gender']) {
    const g = String(updatedForm['gender']).toLowerCase();
    if (g === 'male') updatedForm['gender'] = 'M';
    else if (g === 'female') updatedForm['gender'] = 'F';
  }

  // Normalize Visa Type for 221g (removes hyphens if target is 221g like "IR1")
  if (updatedForm['visaType']) {
     const v = String(updatedForm['visaType']);
     // If the *target form* seems to use condensed codes (like IR1), we strip hyphen
     // Ideally we check if formStructure has a known key pattern, but simplistic heuristic:
     // If the mapped value has a hyphen (IR-1) but the form *might* want (IR1).
     // Since we don't know the *target's* validation, we keep it as is unless known tool.
     // However, for Book Appointment, it uses "B-2", "IR-1" etc, so Profile "IR-1" is good.
     // For 221g, it uses "IR1", "CR1". Profile "IR-1" -> "IR1".
     
     // HACK: We can try to provide both formats or check keys. 
     // For now, let's normalize specific known mis-matches if we can contextually detect them 
     // or just rely on the user to fix the slight mismatch if auto-fill gets close.
     // But user asked to fix it.
     
     // Let's brute force "IR-1" -> "IR1" simply by checking if the target form has "visaType" key 
     // and if the profile value contains a hyphen.
     
     // BETTER APPROACH: Return the value as is. The tool components should handle "IR-1" vs "IR1".
     // But wait, user said "221g form mae visa type autofill nh horhi".
     // 221g uses "IR1". Profile has "IR-1".
     // We will add a stripping logic if strict match fails? No, mapper doesn't know valid options.
     
     // Let's add specific normalization for 221g content if possible, or just standard "IR-1" -> "IR1" conversion
     // if the form structure has keys that look like 221g fields.
     if ('officerRequests' in updatedForm) { // 221g specific field
        updatedForm['visaType'] = v.replace(/-/, ""); // IR-1 -> IR1
     }
  }

  return updatedForm;
};

/**
 * REVERSE MAPPER: Maps form data BACK to MasterProfile structure
 * Allows saving data from any tool back to the central profile.
 */
export const mapFormToProfile = (
  formData: Record<string, unknown>,
  existingProfile: Partial<MasterProfile> = {}
): Partial<MasterProfile> => {
  const newProfile = { ...existingProfile } as Record<string, unknown>; // Shallow copy base

  for (const [formKey, formValue] of Object.entries(formData)) {
    if (formValue === undefined || formValue === "" || formValue === null) continue;

    // Find which profile path this form key belongs to
    for (const [profilePath, variations] of Object.entries(FIELD_MAPPINGS)) {
      if (variations.includes(formKey)) {
        // Special constraint: Don't overwrite complex objects with simple strings if not intended
        // But our paths are leaf nodes mainly, so safeMap is okay.

        // Map value based on expected type (basic inference)
        setNestedProperty(newProfile, profilePath, formValue);
        break;
      }
    }
  }

  return newProfile as Partial<MasterProfile>;
};

/**
 * Legacy wrapper for backward compatibility with existing code
 */
export const mapProfileToGenericForm = autoFillForm;

/**
 * Specialized wrapper for Visa Checker to maintain strict typing if needed
 */
export const mapProfileToVisaChecker = (profile: MasterProfile | Partial<MasterProfile>): Record<string, unknown> => {
  // Just use the generic auto-filler against a mapped structure logic
  // Since the visa checker expects a specific return type, we can infer it or just return Record<string, any>
  // The original function did specific logic, but our generic one covers 90%
  // We will re-implement the specific logic using the new system for safety

  const dummyFormStruct: Record<string, unknown> = {
     sponsor_dob: "",
     country_of_residence: "",
     intended_us_state_of_residence: "",
     relationship_start_date: "",
     marriage_date: "",
     spousal_relationship_type: "",
     how_did_you_meet: "",
     number_of_in_person_visits: 0,
     highest_education_level: "",
     highest_education_field: "",
     current_occupation_role: "",
     industry_sector: "",
     employer_type: "",
     sponsor_annual_income: 0,
     previous_visa_applications: false,
     previous_visa_denial: false,
     overstay_or_violation: false,
     criminal_record: false,
     household_size: 0,
     has_tax_returns: false,
     has_employment_letter: false,
     has_paystubs: false,
     passports_available: false,
     birth_certificates: false,
     valid_police_clearance_certificate: false,
     prior_military_service: false,
     specialized_weapons_training: false,
     unofficial_armed_groups: false,
     cohabitation_proof: false,
     shared_financial_accounts: false,
     wedding_photos_available: false,
     communication_logs: false,
     money_transfer_receipts_available: false,
     driving_license_copy_available: false, // meeting proof

     // Docs
     urdu_marriage_certificate: false,
     english_translation_certificate: false,
     union_council_certificate: false,
     family_registration_certificate: false,
     ds260_confirmation: false,
     interview_letter: false,
     courier_registration: false,
     medical_report_available: false,
     polio_vaccination_certificate: false,
     covid_vaccination_certificate: false,
     passport_photos_2x2: false,
  };

  return autoFillForm(profile, dummyFormStruct);
};


