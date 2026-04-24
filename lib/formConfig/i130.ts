// C:\Users\HP\Desktop\arachnie\Arachnie\lib\formConfig\i130.ts
import type { Field } from "./types";

export const formId = "i130"
export const formTitle = "Form I-130";
export const formSubtitle = "Petition for Alien Relative";

export const formFields: Field[] = [
  // ============================================
  // PART 1. RELATIONSHIP
  // ============================================
  {
    key: "relationship",
    pdfKey: "relationship",
    label: "1. I am filing this petition for my (Select only one box):",
    type: "radio",
    section: "Part 1. Relationship",
    options: [
      { label: "Spouse", value: "Spouse", pdfKey: "relationship_Spouse" },
      { label: "Parent", value: "Parent", pdfKey: "relationship_Parent" },
      { label: "Brother/Sister", value: "BrotherSister", pdfKey: "relationship_BrotherSister" },
      { label: "Child", value: "Child", pdfKey: "relationship_Child" },
    ],
    subQuestions: [
      {
        key: "relationship_detail",
        pdfKey: "relationship_detail",
        label: "2. If you are filing this petition for your child or parent, select the box that describes your relationship (Select only one box):",
        type: "radio",
        condition: (d) => ["Parent", "Child"].includes(d.relationship),
        options: [
          { label: "Child was born to parents who were married to each other at the time of the child's birth", value: "ChildBornMarried", pdfKey: "relationship_detail_ChildBornMarried" },
          { label: "Stepchild/Stepparent", value: "Stepchild", pdfKey: "relationship_detail_Stepchild" },
          { label: "Child was born to parents who were not married to each other at the time of the child's birth", value: "ChildBornUnmarried", pdfKey: "relationship_detail_ChildBornUnmarried" },
          { label: "Child was adopted (not an Orphan or Hague Convention adoptee)", value: "ChildAdopted", pdfKey: "relationship_detail_ChildAdopted" },
        ],
      },
      {
        key: "sibling_adoption",
        pdfKey: "sibling_adoption",
        label: "3. If the beneficiary is your brother/sister, are you related by adoption?",
        type: "radio",
        condition: (d) => d.relationship === "BrotherSister",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "sibling_adoption_Yes" },
          { label: "No", value: "No", pdfKey: "sibling_adoption_No" },
        ],
      },
    ],
  },
  {
    key: "citizen_adoption",
    pdfKey: "citizen_adoption",
    label: "4. Did you gain lawful permanent resident status or citizenship through adoption?",
    type: "radio",
    section: "Part 1. Relationship",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "citizen_adoption_Yes" },
      { label: "No", value: "No", pdfKey: "citizen_adoption_No" },
    ],
  },

  // ============================================
  // PART 2. INFORMATION ABOUT YOU (PETITIONER)
  // ============================================
  {
    key: "a_number",
    pdfKey: "a_number",
    label: "1. Alien Registration Number (A-Number) (if any)",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
    placeholder: "A-Number",
    maxLength: 9,
  },
  {
    key: "uscis_account",
    pdfKey: "uscis_account",
    label: "2. USCIS Online Account Number (if any)",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
    placeholder: "USCIS Account",
    maxLength: 12,
  },
  {
    key: "ssn",
    pdfKey: "ssn",
    label: "3. U.S. Social Security Number (if any)",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
    placeholder: "SSN",
    maxLength: 9,
  },

  // Full Name
  {
    key: "family_name",
    pdfKey: "family_name",
    label: "4. Full Name",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
    tooltip: "Enter your legal name - Make sure it matches your government-issued ID",
    subQuestions: [
      {
        key: "family_name",
        pdfKey: "family_name",
        label: "4.a. Family Name (Last Name)",
        type: "text",
        placeholder: "Last Name",
        maxLength: 35,
      },
      {
        key: "given_name",
        pdfKey: "given_name",
        label: "4.b. Given Name (First Name)",
        type: "text",
        placeholder: "First Name",
        maxLength: 35,
      },
      {
        key: "middle_name",
        pdfKey: "middle_name",
        label: "4.c. Middle Name",
        type: "text",
        placeholder: "Middle Name",
        maxLength: 35,
      },
    ],
  },

  // Other Names Used
  {
    key: "other_family_name",
    pdfKey: "other_family_name",
    label: "5.a. Family Name (Last Name) - Other Names Used",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
  },
  {
    key: "other_given_name",
    pdfKey: "other_given_name",
    label: "5.b. Given Name (First Name) - Other Names Used",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
  },
  {
    key: "other_middle_name",
    pdfKey: "other_middle_name",
    label: "5.c. Middle Name - Other Names Used",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
  },

  // Birth Info
  {
    key: "city_of_birth",
    pdfKey: "city_of_birth",
    label: "6. City/Town/Village of Birth",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
  },
  {
    key: "country_of_birth",
    pdfKey: "country_of_birth",
    label: "7. Country of Birth",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
  },
  {
    key: "date_of_birth",
    pdfKey: "date_of_birth",
    label: "8. Date of Birth (mm/dd/yyyy)",
    type: "text",
    section: "Part 2. Information About You (Petitioner)",
    placeholder: "MM/DD/YYYY",
    maxLength: 10,
  },

  // Sex
  {
    key: "sex",
    pdfKey: "sex",
    label: "9. Sex",
    type: "radio",
    section: "Part 2. Information About You (Petitioner)",
    options: [
      { label: "Male", value: "Male", pdfKey: "sex_Male" },
      { label: "Female", value: "Female", pdfKey: "sex_Female" },
    ],
  },

  // ============================================
  // CURRENT PHYSICAL ADDRESS (Item 10)
  // ============================================
  {
    key: "current_in_care_of",
    pdfKey: "current_in_care_of",
    label: "10. In Care of Name",
    type: "text",
    section: "Address History",
  },
  {
    key: "current_street",
    pdfKey: "current_street",
    label: "10.a. Street Number and Name",
    type: "text",
    section: "Address History",
  },
  {
    key: "current_unit_type",
    pdfKey: "current_unit_type",
    label: "10.b. Unit",
    type: "radio",
    section: "Address History",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "current_unit_type_Apt" },
      { label: "Ste.", value: "Ste", pdfKey: "current_unit_type_Ste" },
      { label: "Flr.", value: "Flr", pdfKey: "current_unit_type_Flr" },
    ],
  },
  {
    key: "current_unit_number",
    pdfKey: "current_unit_number",
    label: "10.c. Apt./Ste./Flr. Number",
    type: "text",
    section: "Address History",
  },
  {
    key: "current_city",
    pdfKey: "current_city",
    label: "10.d. City or Town",
    type: "text",
    section: "Address History",
  },
  {
    key: "current_state",
    pdfKey: "current_state",
    label: "10.e. State",
    type: "text",
    section: "Address History",
  },
  {
    key: "current_zip",
    pdfKey: "current_zip",
    label: "10.f. ZIP Code",
    type: "text",
    section: "Address History",
    maxLength: 5,
  },
  {
    key: "current_province",
    pdfKey: "current_province",
    label: "10.g. Province",
    type: "text",
    section: "Address History",
  },
  {
    key: "current_postal_code",
    pdfKey: "current_postal_code",
    label: "10.h. Postal Code",
    type: "text",
    section: "Address History",
  },
  {
    key: "current_country",
    pdfKey: "current_country",
    label: "10.i. Country",
    type: "text",
    section: "Address History",
  },

  // ============================================
  // MAILING ADDRESS SAME? (Item 11)
  // ============================================
  {
    key: "same_mailing_address",
    pdfKey: "same_mailing_address",
    label: "11. Is your current mailing address the same as your physical address?",
    type: "radio",
    section: "Address History",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "same_mailing_address_Yes" },
      { label: "No", value: "No", pdfKey: "same_mailing_address_No" },
    ],
  },

  // ============================================
  // MAILING ADDRESS (Item 12) - If Different
  // ============================================
  {
    key: "mailing_street",
    pdfKey: "mailing_street",
    label: "12.a. Street Number and Name",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },
  {
    key: "mailing_unit_type",
    pdfKey: "mailing_unit_type",
    label: "12.b. Unit",
    type: "radio",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "mailing_unit_type_Apt" },
      { label: "Ste.", value: "Ste", pdfKey: "mailing_unit_type_Ste" },
      { label: "Flr.", value: "Flr", pdfKey: "mailing_unit_type_Flr" },
    ],
  },
  {
    key: "mailing_unit_number",
    pdfKey: "mailing_unit_number",
    label: "12.c. Apt./Ste./Flr. Number",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },
  {
    key: "mailing_city",
    pdfKey: "mailing_city",
    label: "12.d. City or Town",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },
  {
    key: "mailing_state",
    pdfKey: "mailing_state",
    label: "12.e. State",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },
  {
    key: "mailing_zip",
    pdfKey: "mailing_zip",
    label: "12.f. ZIP Code",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },
  {
    key: "mailing_province",
    pdfKey: "mailing_province",
    label: "12.g. Province",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },
  {
    key: "mailing_postal_code",
    pdfKey: "mailing_postal_code",
    label: "12.h. Postal Code",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },
  {
    key: "mailing_country",
    pdfKey: "mailing_country",
    label: "12.i. Country",
    type: "text",
    section: "Address History",
    condition: (d) => d.same_mailing_address === "No",
  },

  // ============================================
  // CURRENT ADDRESS DATES (Item 13)
  // ============================================
  {
    key: "current_address_from",
    pdfKey: "current_address_from",
    label: "13.a. Date From (mm/dd/yyyy)",
    type: "text",
    section: "Address History",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "current_address_to",
    pdfKey: "current_address_to",
    label: "13.b. Date To (mm/dd/yyyy)",
    type: "text",
    section: "Address History",
    placeholder: "PRESENT",
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS (Item 14)
  // ============================================
  {
    key: "previous_street",
    pdfKey: "previous_street",
    label: "14.a. Street Number and Name",
    type: "text",
    section: "Address History",
  },
  {
    key: "previous_unit_type",
    pdfKey: "previous_unit_type",
    label: "14.b. Unit",
    type: "radio",
    section: "Address History",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "previous_unit_type_Apt" },
      { label: "Ste.", value: "Ste", pdfKey: "previous_unit_type_Ste" },
      { label: "Flr.", value: "Flr", pdfKey: "previous_unit_type_Flr" },
    ],
  },
  {
    key: "previous_unit_number",
    pdfKey: "previous_unit_number",
    label: "14.c. Apt./Ste./Flr. Number",
    type: "text",
    section: "Address History",
  },
  {
    key: "previous_city",
    pdfKey: "previous_city",
    label: "14.d. City or Town",
    type: "text",
    section: "Address History",
  },
  {
    key: "previous_state",
    pdfKey: "previous_state",
    label: "14.e. State",
    type: "text",
    section: "Address History",
  },
  {
    key: "previous_zip",
    pdfKey: "previous_zip",
    label: "14.f. ZIP Code",
    type: "text",
    section: "Address History",
  },
  {
    key: "previous_province",
    pdfKey: "previous_province",
    label: "14.g. Province",
    type: "text",
    section: "Address History",
  },
  {
    key: "previous_postal_code",
    pdfKey: "previous_postal_code",
    label: "14.h. Postal Code",
    type: "text",
    section: "Address History",
  },
  {
    key: "previous_country",
    pdfKey: "previous_country",
    label: "14.i. Country",
    type: "text",
    section: "Address History",
  },

  // ============================================
  // PREVIOUS ADDRESS DATES (Item 15)
  // ============================================
  {
    key: "previous_address_from",
    pdfKey: "previous_address_from",
    label: "15.a. Date From (mm/dd/yyyy)",
    type: "text",
    section: "Address History",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "previous_address_to",
    pdfKey: "previous_address_to",
    label: "15.b. Date To (mm/dd/yyyy)",
    type: "text",
    section: "Address History",
    placeholder: "MM/DD/YYYY",
  },

  // ============================================
  // MARRIAGE INFORMATION
  // ============================================
  {
    key: "number_of_marriages",
    pdfKey: "number_of_marriages",
    label: "16. How many times have you been married?",
    type: "text",
    section: "Your Marital Information",
    maxLength: 2,
  },
  {
    key: "marital_status",
    pdfKey: "marital_status",
    label: "17. Current Marital Status",
    type: "radio",
    section: "Your Marital Information",
    options: [
      { label: "Single, Never Married", value: "Single", pdfKey: "marital_status_Single" },
      { label: "Married", value: "Married", pdfKey: "marital_status_Married" },
      { label: "Divorced", value: "Divorced", pdfKey: "marital_status_Divorced" },
      { label: "Widowed", value: "Widowed", pdfKey: "marital_status_Widowed" },
      { label: "Separated", value: "Separated", pdfKey: "marital_status_Separated" },
      { label: "Annulled", value: "Annulled", pdfKey: "marital_status_Annulled" },
    ],
  },

  // ============================================
  // PAGE 3: SPOUSE & MARRIAGE DETAILS
  // ============================================
  {
    key: "spouse1_date_marriage",
    pdfKey: "Pt2Line18_DateOfMarriage",
    label: "18. Date of Current Marriage (mm/dd/yyyy)",
    type: "text",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "spouse1_place_city",
    pdfKey: "Pt2Line19a_CityTown",
    label: "19.a. City/Town of Current Marriage",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse1_place_state",
    pdfKey: "Pt2Line19b_State",
    label: "19.b. State",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse1_place_province",
    pdfKey: "Pt2Line19c_Province",
    label: "19.c. Province",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse1_place_country",
    pdfKey: "Pt2Line19d_Country",
    label: "19.d. Country",
    type: "text",
    section: "Your Marital Information",
  },

  // Spouse 1 Full Name
  {
    key: "spouse1_family_name",
   pdfKey: "Pt2Line20a_FamilyName",
    label: "20.a. Family Name (Last Name) - Spouse 1",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse1_given_name",
 pdfKey: "Pt2Line20b_GivenName",
    label: "20.b. Given Name (First Name)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse1_middle_name",
    pdfKey: "Pt2Line20c_MiddleName",
    label: "20.c. Middle Name",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse1_marriage_end_date",
    pdfKey: "Pt2Line21_DateMarriageEnded",
    label: "21. Date Marriage Ended (if applicable)",
    type: "text",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },

  // Spouse 2 (Previous Spouse)
  {
    key: "spouse2_family_name",
    pdfKey: "Pt2Line22a_FamilyName",
    label: "22.a. Family Name (Last Name) - Spouse 2",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse2_given_name",
    pdfKey: "Pt2Line22b_GivenName",
    label: "22.b. Given Name (First Name)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse2_middle_name",
    pdfKey: "Pt2Line22c_MiddleName",
    label: "22.c. Middle Name",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse2_marriage_end_date",
    pdfKey: "Pt2Line23_DateMarriageEnded",
    label: "23. Date Marriage Ended - Spouse 2",
    type: "text",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },

  // Spouse 3
  {
    key: "spouse3_family_name",
    pdfKey: "Pt2Line24_FamilyName",
    label: "24. Family Name (Last Name) - Spouse 3",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse3_given_name",
    pdfKey: "Pt2Line24_GivenName",
    label: "24. Given Name (First Name)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse3_middle_name",
    pdfKey: "Pt2Line24_MiddleName",
    label: "24. Middle Name",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse3_date_of_birth",
    pdfKey: "Pt2Line25_DateofBirth",
    label: "25. Date of Birth - Spouse 3",
    type: "text",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "spouse3_sex",
    pdfKey: "Pt2Line26",
    label: "26. Sex - Spouse 3",
    type: "radio",
    section: "Your Marital Information",
    options: [
      { label: "Male", value: "Male", pdfKey: "Pt2Line26_Male" },
      { label: "Female", value: "Female", pdfKey: "Pt2Line26_Female" },
    ],
  },

  // Spouse 3 Residence
  {
    key: "spouse3_country_birth",
    pdfKey: "Pt2Line27_CountryofBirth",
    label: "27. Country of Birth - Spouse 3",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse3_city_residence",
    pdfKey: "Pt2Line28_CityTownOrVillageOfResidence",
    label: "28. City/Town/Village of Residence - Spouse 3",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "spouse3_country_residence",
    pdfKey: "Pt2Line29_CountryOfResidence",
    label: "29. Country of Residence - Spouse 3",
    type: "text",
    section: "Your Marital Information",
  },

  // Parent 1
  {
    key: "parent1_family_name",
    pdfKey: "Pt2Line30a_FamilyName",
    label: "30.a. Family Name (Last Name) - Parent 1",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_given_name",
    pdfKey: "Pt2Line30b_GivenName",
    label: "30.b. Given Name (First Name)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_middle_name",
    pdfKey: "Pt2Line30c_MiddleName",
    label: "30.c. Middle Name",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_date_of_birth",
    pdfKey: "Pt2Line31_DateofBirth",
    label: "31. Date of Birth - Parent 1",
    type: "text",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "parent1_sex",
    pdfKey: "Pt2Line32",
    label: "32. Sex - Parent 1",
    type: "radio",
    section: "Your Marital Information",
    options: [
      { label: "Male", value: "Male", pdfKey: "Pt2Line32_Male" },
      { label: "Female", value: "Female", pdfKey: "Pt2Line32_Female" },
    ],
  },

  // Parent 1 Residence
  {
    key: "parent1_country_birth",
    pdfKey: "Pt2Line33_CountryofBirth",
    label: "33. Country of Birth - Parent 1",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_city_residence",
    pdfKey: "Pt2Line34_CityTownOrVillageOfResidence",
    label: "34. City/Town/Village of Residence - Parent 1",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_country_residence",
    pdfKey: "Pt2Line35_CountryOfResidence",
    label: "35. Country of Residence - Parent 1",
    type: "text",
    section: "Your Marital Information",
  },

  // Citizenship Status
  {
    key: "citizenship_status",
    pdfKey: "Pt2Line36",
    label: "36. I am a (Select only one box):",
    type: "radio",
    section: "Your Marital Information",
    options: [
      { label: "U.S. Citizen", value: "USCitizen", pdfKey: "Pt2Line36_USCitizen" },
      { label: "Lawful Permanent Resident", value: "LPR", pdfKey: "Pt2Line36_LPR" },
    ],
  },
  {
    key: "naturalization_certificate",
    pdfKey: "Pt2Line36",
    label: "Have you obtained a Certificate of Naturalization or Certificate of Citizenship?",
    type: "radio",
    section: "Your Marital Information",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "Pt2Line36_Yes" },
      { label: "No", value: "No", pdfKey: "Pt2Line36_No" },
    ],
  },

  // Certificate Details
  {
    key: "certificate_number",
    pdfKey: "Pt2Line37a_CertificateNumber",
    label: "37.a. Certificate Number",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "certificate_place",
    pdfKey: "Pt2Line37b_PlaceOfIssuance",
    label: "37.b. Place of Issuance",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "certificate_date",
    pdfKey: "Pt2Line37c_DateOfIssuance",
    label: "37.c. Date of Issuance (mm/dd/yyyy)",
    type: "text",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },
  // ============================================
// PAGE 4: ADDITIONAL INFORMATION (Petitioner)
// ============================================

// ============================================
// ITEM 40: ADMISSION TO THE U.S.
// ============================================
{
  key: "class_of_admission",
  pdfKey: "Pt2Line40a_ClassOfAdmission",
  label: "40.a. Class of Admission",
  type: "text",
  section: "Your U.S. Entry Information",
  placeholder: "e.g. B2, F1, H1B",
},
{
  key: "date_of_admission",
  pdfKey: "Pt2Line40b_DateOfAdmission",
  label: "40.b. Date of Admission (mm/dd/yyyy)",
  type: "text",
  section: "Your U.S. Entry Information",
  placeholder: "MM/DD/YYYY",
},
{
  key: "city_of_admission",
  pdfKey: "Pt2Line40d_CityOrTown",
  label: "40.d. City or Town of Admission",
  type: "text",
  section: "Your U.S. Entry Information",
},
{
  key: "state_of_admission",
  pdfKey: "Pt2Line40e_State",
  label: "40.e. State of Admission",
  type: "text", // ComboBox in PDF → use text or dropdown
  section: "Your U.S. Entry Information",
},

// ============================================
// ITEM 41: CURRENT EMPLOYMENT ADDRESS (If different)
// ============================================
{
  key: "employment_different_address",
  pdfKey: "employment_different_address",
  label: "41. Is your current employment address different from your current physical address?",
  type: "radio",
  section: "Employment Information",
  options: [
    { label: "Yes", value: "Yes", pdfKey: "Pt2Line41_Yes" },
    { label: "No", value: "No", pdfKey: "Pt2Line41_No" },
  ],
},

// Employment Address (Conditional)
{
  key: "employment_street",
  pdfKey: "Pt2Line41_StreetNumberName",
  label: "41.a. Street Number and Name",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
},
{
  key: "employment_unit_type",
  pdfKey: "employment_unit_type",
  label: "41.b. Unit",
  type: "radio",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
  options: [
    { label: "Apt.", value: "Apt", pdfKey: "Pt2Line41_Unit[0]" },
    { label: "Ste.", value: "Ste", pdfKey: "Pt2Line41_Unit[1]" },
    { label: "Flr.", value: "Flr", pdfKey: "Pt2Line41_Unit[2]" },
  ],
},
{
  key: "employment_unit_number",
  pdfKey: "Pt2Line41_AptSteFlrNumber",
  label: "41.c. Apt./Ste./Flr. Number",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
},
{
  key: "employment_city",
  pdfKey: "Pt2Line41_CityOrTown",
  label: "41.d. City or Town",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
},
{
  key: "employment_state",
  pdfKey: "Pt2Line41_State",
  label: "41.e. State",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
},
{
  key: "employment_zip",
  pdfKey: "Pt2Line41_ZipCode",
  label: "41.f. ZIP Code",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
  maxLength: 5,
},
{
  key: "employment_province",
  pdfKey: "Pt2Line41_Province",
  label: "41.g. Province",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
},
{
  key: "employment_postal_code",
  pdfKey: "Pt2Line41_PostalCode",
  label: "41.h. Postal Code",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
},
{
  key: "employment_country",
  pdfKey: "Pt2Line41_Country",
  label: "41.i. Country",
  type: "text",
  section: "Employment Information",
  condition: (d) => d.employment_different_address === "Yes",
},

// ============================================
// ITEM 42-43: CURRENT EMPLOYMENT DETAILS
// ============================================
{
  key: "current_occupation",
  pdfKey: "Pt2Line42_Occupation",
  label: "42. Current Occupation",
  type: "text",
  section: "Employment Information",
},
{
  key: "employment_start_date",
  pdfKey: "Pt2Line43a_DateFrom",
  label: "43.a. Date Employment Began (mm/dd/yyyy)",
  type: "text",
  section: "Employment Information",
  placeholder: "MM/DD/YYYY",
},
{
  key: "employment_end_date",
  pdfKey: "Pt2Line43b_DateTo",
  label: "43.b. Date Employment Ended (mm/dd/yyyy)",
  type: "text",
  section: "Employment Information",
  placeholder: "MM/DD/YYYY or PRESENT",
},

// ============================================
// ITEM 44-47: PREVIOUS EMPLOYMENT
// ============================================
{
  key: "previous_employer_name",
  pdfKey: "Pt2Line44_EmployerOrOrgName",
  label: "44. Name of Employer or Organization",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_employer_street",
  pdfKey: "Pt2Line45_StreetNumberName",
  label: "45.a. Street Number and Name",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_unit_type",
  pdfKey: "previous_unit_type",
  label: "45.b. Unit",
  type: "radio",
  section: "Previous Employment",
  options: [
    { label: "Apt.", value: "Apt", pdfKey: "Pt2Line45_Unit[0]" },
    { label: "Ste.", value: "Ste", pdfKey: "Pt2Line45_Unit[1]" },
    { label: "Flr.", value: "Flr", pdfKey: "Pt2Line45_Unit[2]" },
  ],
},
{
  key: "previous_unit_number",
  pdfKey: "Pt2Line45_AptSteFlrNumber",
  label: "45.c. Apt./Ste./Flr. Number",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_city",
  pdfKey: "Pt2Line45_CityOrTown",
  label: "45.d. City or Town",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_state",
  pdfKey: "Pt2Line45_State",
  label: "45.e. State",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_zip",
  pdfKey: "Pt2Line45_ZipCode",
  label: "45.f. ZIP Code",
  type: "text",
  section: "Previous Employment",
  maxLength: 5,
},
{
  key: "previous_province",
  pdfKey: "Pt2Line45_Province",
  label: "45.g. Province",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_postal_code",
  pdfKey: "Pt2Line45_PostalCode",
  label: "45.h. Postal Code",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_country",
  pdfKey: "Pt2Line45_Country",
  label: "45.i. Country",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_occupation",
  pdfKey: "Pt2Line46_Occupation",
  label: "46. Occupation",
  type: "text",
  section: "Previous Employment",
},
{
  key: "previous_employment_start",
  pdfKey: "Pt2Line47a_DateFrom",
  label: "47.a. Date From (mm/dd/yyyy)",
  type: "text",
  section: "Previous Employment",
  placeholder: "MM/DD/YYYY",
},
{
  key: "previous_employment_end",
  pdfKey: "Pt2Line47b_DateTo",
  label: "47.b. Date To (mm/dd/yyyy)",
  type: "text",
  section: "Previous Employment",
  placeholder: "MM/DD/YYYY",
},

// ============================================
// ITEM 48: ETHNICITY
// ============================================
{
  key: "ethnicity",
  pdfKey: "ethnicity",
  label: "48. Ethnicity (Select only one box)",
  type: "radio",
  section: "Physical Characteristics",
  options: [
    { label: "Hispanic or Latino", value: "hispanic", pdfKey: "Pt3Line1_Ethnicity[0]" },
    { label: "Not Hispanic or Latino", value: "not_hispanic", pdfKey: "Pt3Line1_Ethnicity[1]" },
  ],
},

// ============================================
// ITEM 49: RACE
// ============================================
{
  key: "race",
  pdfKey: "race",
  label: "49. Race (Select all that apply)",
  type: "checkbox",
  section: "Physical Characteristics",
  options: [
    { label: "White", value: "white", pdfKey: "Pt3Line2_Race_White" },
    { label: "Asian", value: "asian", pdfKey: "Pt3Line2_Race_Asian" },
    { label: "Black or African American", value: "black", pdfKey: "Pt3Line2_Race_Black" },
    { label: "American Indian or Alaska Native", value: "native", pdfKey: "Pt3Line2_Race_AmericanIndianAlaskaNative" },
    { label: "Native Hawaiian or Other Pacific Islander", value: "pacific", pdfKey: "Pt3Line2_Race_NativeHawaiianOtherPacificIslander" },
  ],
},

// ============================================
// ITEM 50: HEIGHT
// ============================================
{
  key: "height_feet",
  pdfKey: "Pt3Line3_HeightFeet",
  label: "50.a. Feet",
  type: "text",
  section: "Physical Characteristics",
  placeholder: "5",
  maxLength: 1,
},
{
  key: "height_inches",
  pdfKey: "Pt3Line3_HeightInches",
  label: "50.b. Inches",
  type: "text",
  section: "Physical Characteristics",
  placeholder: "10",
  maxLength: 2,
},

// ============================================
// ITEM 51: WEIGHT
// ============================================
{
  key: "weight_pounds",
  pdfKey: "weight_pounds",
  label: "51. Weight (in pounds)",
  type: "text",
  section: "Physical Characteristics",
  placeholder: "150",
  maxLength: 3,
  // Note: PDF splits into 3 fields — handle in backend
},

// ============================================
// ITEM 52: EYE COLOR
// ============================================
{
  key: "eye_color",
  pdfKey: "eye_color",
  label: "52. Eye Color (Select only one box)",
  type: "radio",
  section: "Physical Characteristics",
  options: [
    { label: "Black", value: "black", pdfKey: "Pt3Line5_EyeColor[0]" },
    { label: "Blue", value: "blue", pdfKey: "Pt3Line5_EyeColor[1]" },
    { label: "Brown", value: "brown", pdfKey: "Pt3Line5_EyeColor[2]" },
    { label: "Gray", value: "gray", pdfKey: "Pt3Line5_EyeColor[3]" },
    { label: "Green", value: "green", pdfKey: "Pt3Line5_EyeColor[4]" },
    { label: "Hazel", value: "hazel", pdfKey: "Pt3Line5_EyeColor[5]" },
    { label: "Maroon", value: "maroon", pdfKey: "Pt3Line5_EyeColor[6]" },
    { label: "Pink", value: "pink", pdfKey: "Pt3Line5_EyeColor[7]" },
    { label: "Unknown/Other", value: "other", pdfKey: "Pt3Line5_EyeColor[8]" },
  ],
},

 // ============================================
  // PAGE 4: ADDITIONAL INFORMATION
  // ============================================
  {
    key: "Pt2Line40a_ClassOfAdmission",
    label: "40.a. Class of Admission",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line40a_ClassOfAdmission",
    placeholder: "e.g., B-2, F-1, etc.",
  },
  {
    key: "Pt2Line40b_DateOfAdmission",
    label: "40.b. Date of Admission (mm/dd/yyyy)",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line40b_DateOfAdmission",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "Pt2Line40d_CityOrTown",
    label: "40.d. Place of Admission - City or Town",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line40d_CityOrTown",
    placeholder: "City or Town",
  },
  {
    key: "Pt2Line40e_State",
    label: "40.e. State",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line40e_State",
    placeholder: "State",
    maxLength: 2,
  },
  {
    key: "Pt2Line41_LPR",
    label: "41. Did you gain lawful permanent resident status through marriage to a U.S. citizen or lawful permanent resident?",
    section: "Immigration & Employment Information",
    type: "radio",
    pdfKey: "Pt2Line41",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "Pt2Line41_Yes" },
      { label: "No", value: "No", pdfKey: "Pt2Line41_No" },
    ],
  },
  {
    key: "Pt2Line42_Occupation",
    label: "42. Your Current Occupation (Employer 1)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line42_Occupation",
    placeholder: "Your occupation",
  },
  {
    key: "Pt2Line43a_DateFrom",
    label: "43.a. Date From (mm/dd/yyyy)",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line43a_DateFrom",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "Pt2Line43b_DateTo",
    label: "43.b. Date To (mm/dd/yyyy)",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line43b_DateTo",
    placeholder: "MM/DD/YYYY or PRESENT",
  },
  {
    key: "Pt2Line44_EmployerOrOrgName",
    label: "44. Name of Employer/Company (Employer 1)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line44_EmployerOrOrgName",
    placeholder: "Company name",
  },
  {
    key: "Pt2Line45_StreetNumberName",
    label: "45. Employer Address - Street Number and Name",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_StreetNumberName",
    placeholder: "Street address",
  },
  {
    key: "Pt2Line45_CityOrTown",
    label: "City or Town",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_CityOrTown",
    placeholder: "City",
  },
  {
    key: "Pt2Line45_State",
    label: "State",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_State",
    placeholder: "State",
    maxLength: 2,
  },
  {
    key: "Pt2Line45_ZipCode",
    label: "ZIP Code",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_ZipCode",
    placeholder: "ZIP",
    maxLength: 10,
  },
  {
    key: "Pt2Line45_Country",
    label: "Country",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_Country",
    placeholder: "Country",
  },
  {
    key: "Pt2Line46_Occupation",
    label: "46. Your Occupation (Employer 2)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line46_Occupation",
    placeholder: "Your occupation",
  },
  {
    key: "Pt2Line47a_DateFrom",
    label: "47.a. Date From (mm/dd/yyyy)",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line47a_DateFrom",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "Pt2Line47b_DateTo",
    label: "47.b. Date To (mm/dd/yyyy)",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line47b_DateTo",
    placeholder: "MM/DD/YYYY or PRESENT",
  },

  // ============================================
  // PART 3: BIOGRAPHIC INFORMATION
  // ============================================
  {
    key: "Pt3Line1_Ethnicity",
    label: "1. Ethnicity",
    section: "Biographic Information",
    type: "radio",
    pdfKey: "Pt3Line1_Ethnicity",
    options: [
      { label: "Hispanic or Latino", value: "Hispanic", pdfKey: "Pt3Line1_Ethnicity[0]" },
      { label: "Not Hispanic or Latino", value: "NotHispanic", pdfKey: "Pt3Line1_Ethnicity[1]" },
    ],
  },
  {
    key: "Pt3Line2_Race_White",
    label: "2. Race - White",
    section: "Biographic Information",
    type: "checkbox",
    pdfKey: "Pt3Line2_Race_White",
  },
  {
    key: "Pt3Line2_Race_Asian",
    label: "Asian",
    section: "Biographic Information",
    type: "checkbox",
    pdfKey: "Pt3Line2_Race_Asian",
  },
  {
    key: "Pt3Line2_Race_Black",
    label: "Black or African American",
    section: "Biographic Information",
    type: "checkbox",
    pdfKey: "Pt3Line2_Race_Black",
  },
  {
    key: "Pt3Line2_Race_AmericanIndianAlaskaNative",
    label: "American Indian or Alaska Native",
    section: "Biographic Information",
    type: "checkbox",
    pdfKey: "Pt3Line2_Race_AmericanIndianAlaskaNative",
  },
  {
    key: "Pt3Line2_Race_NativeHawaiianOtherPacificIslander",
    label: "Native Hawaiian or Other Pacific Islander",
    section: "Biographic Information",
    type: "checkbox",
    pdfKey: "Pt3Line2_Race_NativeHawaiianOtherPacificIslander",
  },
  {
    key: "Pt3Line3_HeightFeet",
    label: "3. Height - Feet",
    section: "Biographic Information",
    type: "text",
    pdfKey: "Pt3Line3_HeightFeet",
    placeholder: "Feet",
    maxLength: 1,
  },
  {
    key: "Pt3Line3_HeightInches",
    label: "Inches",
    section: "Biographic Information",
    type: "text",
    pdfKey: "Pt3Line3_HeightInches",
    placeholder: "Inches",
    maxLength: 2,
  },
  {
    key: "Pt3Line5_EyeColor",
    label: "5. Eye Color",
    section: "Biographic Information",
    type: "radio",
    pdfKey: "Pt3Line5_EyeColor",
    options: [
      { label: "Black", value: "Black", pdfKey: "Pt3Line5_EyeColor[0]" },
      { label: "Blue", value: "Blue", pdfKey: "Pt3Line5_EyeColor[1]" },
      { label: "Brown", value: "Brown", pdfKey: "Pt3Line5_EyeColor[2]" },
      { label: "Gray", value: "Gray", pdfKey: "Pt3Line5_EyeColor[3]" },
      { label: "Green", value: "Green", pdfKey: "Pt3Line5_EyeColor[4]" },
      { label: "Hazel", value: "Hazel", pdfKey: "Pt3Line5_EyeColor[5]" },
      { label: "Maroon", value: "Maroon", pdfKey: "Pt3Line5_EyeColor[6]" },
      { label: "Pink", value: "Pink", pdfKey: "Pt3Line5_EyeColor[7]" },
      { label: "Unknown/Other", value: "Unknown", pdfKey: "Pt3Line5_EyeColor[8]" },
    ],
  },
  // =============================================
// PAGE 5 - PART 3: Biographic Information
// =============================================
{
  key: "hairColor",
  label: "Hair Color",
  type: "radio",
  section: "Part 3. Biographic Information",
  pdfKey: "Pt3Line6_HairColor_Black", // ← Dummy (backend ignore karega)
  options: [
    { label: "Black", value: "black", pdfKey: "Pt3Line6_HairColor_Black" },
    { label: "Blonde", value: "blonde", pdfKey: "Pt3Line6_HairColor_Blonde" },
    { label: "Brown", value: "brown", pdfKey: "Pt3Line6_HairColor_Brown" },
    { label: "Gray", value: "gray", pdfKey: "Pt3Line6_HairColor_Gray" },
    { label: "Red", value: "red", pdfKey: "Pt3Line6_HairColor_Red" },
    { label: "Sandy", value: "sandy", pdfKey: "Pt3Line6_HairColor_Sandy" },
    { label: "White", value: "white", pdfKey: "Pt3Line6_HairColor_White" },
    { label: "Bald", value: "bald", pdfKey: "Pt3Line6_HairColor_Bald" },
    { label: "Unknown", value: "unknown", pdfKey: "Pt3Line6_HairColor_Unknown" },
  ],
},

// =============================================
// PAGE 5 - PART 4: Information About Beneficiary
// =============================================
{
  key: "alienNumber",
  label: "1. Alien Registration Number (A-Number) (if any)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line1_AlienNumber",  // ← SHORT KEY
  placeholder: "A-XXXXXXXXX",
  maxLength: 12,
},
{
  key: "uscisOnlineNumber",
  label: "2. USCIS Online Account Number (if any)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line2_USCISOnlineActNumber",
  placeholder: "USCIS Account Number",
  maxLength: 20,
},
{
  key: "ssn",
  label: "3. U.S. Social Security Number (if any)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line3_SSN",
  placeholder: "XXX-XX-XXXX",
  maxLength: 11,
},

// Full Name
{
  key: "familyName",
  label: "4.a. Family Name (Last Name)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line4a_FamilyName",
  placeholder: "Last Name",
},
{
  key: "givenName",
  label: "4.b. Given Name (First Name)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line4b_GivenName",
  placeholder: "First Name",
},
{
  key: "middleName",
  label: "4.c. Middle Name",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line4c_MiddleName",
  placeholder: "Middle Name (if applicable)",
},

// Other Names Used
{
  key: "otherFamilyName",
  label: "5.a. Other Family Name Used (if any)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "P4Line5a_FamilyName",
},
{
  key: "otherGivenName",
  label: "5.b. Other Given Name Used (if any)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line5b_GivenName",
},
{
  key: "otherMiddleName",
  label: "5.c. Other Middle Name Used (if any)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line5c_MiddleName",
},

// Birth Information
{
  key: "cityOfBirth",
  label: "7. City/Town/Village of Birth",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line7_CityTownOfBirth",
},
{
  key: "countryOfBirth",
  label: "8. Country of Birth",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line8_CountryOfBirth",
},
{
  key: "dateOfBirth",
  label: "9. Date of Birth (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Your Relative",
  pdfKey: "Pt4Line9_DateOfBirth",
  placeholder: "MM/DD/YYYY",
},

// Gender
{
  key: "gender",
  label: "Gender",
  type: "radio",
  section: "Part 4. Information About Your Relative",
  pdfKey: "gender", // backend will handle via options
  options: [
    { label: "Male", value: "male", pdfKey: "Pt4Line9_Male" },
    { label: "Female", value: "female", pdfKey: "Pt4Line9_Female" },
  ],
},

// Ever in US?
{
  key: "everInUS",
  pdfKey:"everInUS",
  label: "10. Has this person ever been in the United States?",
  type: "radio",
  section: "Part 4. Information About Your Relative",
  options: [
    { label: "Yes", value: "yes", pdfKey: "Pt4Line10_Yes" },
    { label: "No", value: "no", pdfKey: "Pt4Line10_No" },
    { label: "Unknown", value: "unknown", pdfKey: "Pt4Line10_Unknown" },
  ],
},

// Current Physical Address
{
  key: "currentStreet",

  label: "11. Current Physical Address - Street Number and Name",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_StreetNumberName",
},
{
  key: "currentUnitType",
  pdfKey: "currentUnitType",
  label: "Unit Type",
  type: "radio",
  section: "Part 4. Current Physical Address",
  options: [
    { label: "Ste.", value: "ste", pdfKey: "Pt4Line11_Unit_Ste" },
    { label: "Apt.", value: "apt", pdfKey: "Pt4Line11_Unit_Apt" },
    { label: "Flr.", value: "flr", pdfKey: "Pt4Line11_Unit_Flr" },
  ],
},
{
  key: "currentAptNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_AptSteFlrNumber",
},
{
  key: "currentCity",
  label: "City or Town",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_CityOrTown",
},
{
  key: "currentState",
  label: "State (if in U.S.)",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_State",
},
{
  key: "currentZipCode",
  label: "ZIP Code",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_ZipCode",
  maxLength: 10,
},
{
  key: "currentProvince",
  label: "Province (if outside U.S.)",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_Province",
},
{
  key: "currentPostalCode",
  label: "Postal Code (if outside U.S.)",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_PostalCode",
},
{
  key: "currentCountry",
  label: "Country",
  type: "text",
  section: "Part 4. Current Physical Address",
  pdfKey: "Pt4Line11_Country",
},

// Future Address (Intended US)
{
  key: "futureStreet",
  label: "12.a. Street Number and Name",
  type: "text",
  section: "Part 4. Address Where Your Relative Intends to Live",
  pdfKey: "Pt4Line12a_StreetNumberName",
},
{
  key: "futureUnitType",
  pdfKey: "futureUnitType",
  label: "12.b. Unit Type",
  type: "radio",
  section: "Part 4. Address Where Your Relative Intends to Live",
  options: [
    { label: "Ste.", value: "ste", pdfKey: "Pt4Line12b_Unit_Ste" },
    { label: "Apt.", value: "apt", pdfKey: "Pt4Line12b_Unit_Apt" },
    { label: "Flr.", value: "flr", pdfKey: "Pt4Line12b_Unit_Flr" },
  ],
},
{
  key: "futureAptNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 4. Address Where Your Relative Intends to Live",
  pdfKey: "Pt4Line12b_AptSteFlrNumber",
},
{
  key: "futureCity",
  label: "12.c. City or Town",
  type: "text",
  section: "Part 4. Address Where Your Relative Intends to Live",
  pdfKey: "Pt4Line12c_CityOrTown",
},
{
  key: "futureState",
  label: "12.d. State",
  type: "text",
  section: "Part 4. Address Where Your Relative Intends to Live",
  pdfKey: "Pt4Line12d_State",
},
{
  key: "futureZipCode",
  label: "12.e. ZIP Code",
  type: "text",
  section: "Part 4. Address Where Your Relative Intends to Live",
  pdfKey: "Pt4Line12e_ZipCode",
  maxLength: 10,
},

// Foreign Address
{
  key: "foreignStreet",
  label: "13. Street Number and Name",
  type: "text",
  section: "Part 4. Address Abroad (if not immigrating to U.S.)",
  pdfKey: "Pt4Line13_StreetNumberName",
},
{
  key: "foreignUnitType",
  label: "Unit Type",
  pdfKey: "foreignUnitType",
  type: "radio",
  section: "Part 4. Address Abroad (if not immigrating to U.S.)",
  options: [
    { label: "Ste.", value: "ste", pdfKey: "Pt4Line13_Unit_Ste" },
    { label: "Apt.", value: "apt", pdfKey: "Pt4Line13_Unit_Apt" },
    { label: "Flr.", value: "flr", pdfKey: "Pt4Line13_Unit_Flr" },
  ],
},
{
  key: "foreignAptNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 4. Address Abroad (if not immigrating to U.S.)",
  pdfKey: "Pt4Line13_AptSteFlrNumber",
},
{
  key: "foreignCity",
  label: "City or Town",
  type: "text",
  section: "Part 4. Address Abroad (if not immigrating to U.S.)",
  pdfKey: "Pt4Line13_CityOrTown",
},
{
  key: "foreignProvince",
  label: "Province",
  type: "text",
  section: "Part 4. Address Abroad (if not immigrating to U.S.)",
  pdfKey: "Pt4Line13_Province",
},
{
  key: "foreignPostalCode",
  label: "Postal Code",
  type: "text",
  section: "Part 4. Address Abroad (if not immigrating to U.S.)",
  pdfKey: "Pt4Line13_PostalCode",
},
{
  key: "foreignCountry",
  label: "Country",
  type: "text",
  section: "Part 4. Address Abroad (if not immigrating to U.S.)",
  pdfKey: "Pt4Line13_Country",
},

// Contact
{
  key: "daytimePhone",
  label: "14. Daytime Telephone Number",
  type: "text",
  section: "Part 4. Contact Information",
  pdfKey: "Pt4Line14_DaytimePhoneNumber",
},



// / PAGE 6 - PART 4: Continued (subform[5])


{
  key: "mobilePhone",
  label: "15. Mobile Telephone Number (if any)",
  type: "text",
  section: "Part 4. Contact Information",
  pdfKey: "Pt4Line15_MobilePhoneNumber",
},
{
  key: "email",
  label: "16. Email Address (if any)",
  type: "text",
  section: "Part 4. Contact Information",
  pdfKey: "Pt4Line16_EmailAddress",
},

// Marital Status
{
  key: "numberOfMarriages",
  label: "17. How many times has your relative been married?",
  type: "text",
  section: "Part 4. Marital Information",
  pdfKey: "Pt4Line17_NumberofMarriages",
  maxLength: 2,
},
{
  key: "maritalStatus",
  pdfKey: "maritalStatus",
  label: "18. Current Marital Status",
  type: "radio",
  section: "Part 4. Marital Information",
  options: [
    { label: "Married", value: "married", pdfKey: "Pt4Line18_Married" },
    { label: "Divorced", value: "divorced", pdfKey: "Pt4Line18_Divorced" },
    { label: "Widowed", value: "widowed", pdfKey: "Pt4Line18_Widowed" },
    { label: "Single, Never Married", value: "single", pdfKey: "Pt4Line18_Single" },
    { label: "Annulled", value: "annulled", pdfKey: "Pt4Line18_Annulled" },
    { label: "Legally Separated", value: "separated", pdfKey: "Pt4Line18_LegallySeparated" },
  ],
},

// Current Spouse (if married)
{
  key: "spouseFamilyName",
  label: "18.a. Current Spouse's Family Name",
  type: "text",
  section: "Part 4. Current Spouse Information",
  pdfKey: "Pt4Line18a_FamilyName",
  condition: (d) => d.maritalStatus === "married",
},
{
  key: "spouseGivenName",
  label: "18.b. Current Spouse's Given Name",
  type: "text",
  section: "Part 4. Current Spouse Information",
  pdfKey: "Pt4Line18b_GivenName",
  condition: (d) => d.maritalStatus === "married",
},
{
  key: "spouseMiddleName",
  label: "18.c. Current Spouse's Middle Name",
  type: "text",
  section: "Part 4. Current Spouse Information",
  pdfKey: "Pt4Line18c_MiddleName",
  condition: (d) => d.maritalStatus === "married",
},
{
  key: "dateOfMarriage",
  label: "19. Date of Current Marriage",
  type: "text",
  section: "Part 4. Current Marriage Information",
  pdfKey: "Pt4Line19_DateOfMarriage",
  condition: (d) => d.maritalStatus === "married",
},
{
  key: "marriageCity",
  label: "20.a. City/Town",
  type: "text",
  section: "Part 4. Current Marriage Information",
  pdfKey: "Pt4Line20a_CityTown",
  condition: (d) => d.maritalStatus === "married",
},
{
  key: "marriageState",
  label: "20.b. State",
  type: "text",
  section: "Part 4. Current Marriage Information",
  pdfKey: "Pt4Line20b_State",
  condition: (d) => d.maritalStatus === "married",
},
{
  key: "marriageProvince",
  label: "20.c. Province",
  type: "text",
  section: "Part 4. Current Marriage Information",
  pdfKey: "Pt4Line20c_Province",
  condition: (d) => d.maritalStatus === "married",
},
{
  key: "marriageCountry",
  label: "20.d. Country",
  type: "text",
  section: "Part 4. Current Marriage Information",
  pdfKey: "Pt4Line20d_Country",
  condition: (d) => d.maritalStatus === "married",
},

// Prior Spouse
{
  key: "priorSpouseFamilyName",
  label: "16.a. Prior Spouse Family Name",
  type: "text",
  section: "Part 4. Names of Prior Spouses",
  pdfKey: "Pt4Line16a_FamilyName",
  condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
},
{
  key: "priorSpouseGivenName",
  label: "16.b. Prior Spouse Given Name",
  type: "text",
  section: "Part 4. Names of Prior Spouses",
  pdfKey: "Pt4Line16b_GivenName",
  condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
},
{
  key: "priorSpouseMiddleName",
  label: "16.c. Prior Spouse Middle Name",
  type: "text",
  section: "Part 4. Names of Prior Spouses",
  pdfKey: "Pt4Line16c_MiddleName",
  condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
},
{
  key: "priorMarriageEndDate",
  label: "17. Date Marriage Ended",
  type: "text",
  section: "Part 4. Names of Prior Spouses",
  pdfKey: "Pt4Line17_DateMarriageEnded",
  condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
},

// page 7
{
  key: "beneficiary_familyName",
  label: "37.a. Family Name (Last Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line42a_FamilyName",
  placeholder: "Last Name",
},
{
  key: "beneficiary_givenName",
  label: "37.b. Given Name (First Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line42b_GivenName",
  placeholder: "First Name",
},
{
  key: "beneficiary_middleName",
  label: "37.c. Middle Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line42c_MiddleName",
  placeholder: "Middle Name (if any)",
},

// 38. Relationship
{
  key: "beneficiary_relationship",
  label: "38. Relationship",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line43_Relationship",
  placeholder: "e.g., Spouse, Child",
},

// 39. Date of Birth
{
  key: "beneficiary_dateOfBirth",
  label: "39. Date of Birth (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line44_DateOfBirth",
  placeholder: "MM/DD/YYYY",
},

// 40. Country of Birth
{
  key: "beneficiary_countryOfBirth",
  label: "40. Country of Birth",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line45_CountryOfBirth",
  placeholder: "Country Name",
},

// 41-44: Previous Legal Name
{
  key: "beneficiary_prevFamilyName",
  label: "41.a. Family Name (Last Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line46a_FamilyName",
  placeholder: "Last Name (if different)",
},
{
  key: "beneficiary_prevGivenName",
  label: "41.b. Given Name (First Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line46b_GivenName",
  placeholder: "First Name",
},
{
  key: "beneficiary_prevMiddleName",
  label: "41.c. Middle Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line46c_MiddleName",
  placeholder: "Middle Name",
},
{
  key: "beneficiary_prevRelationship",
  label: "42. Relationship",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line47_Relationship",
  placeholder: "e.g., Maiden Name",
},
{
  key: "beneficiary_prevDateOfBirth",
  label: "43. Date of Birth (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line48_DateOfBirth",
  placeholder: "MM/DD/YYYY",
},
{
  key: "beneficiary_prevCountryOfBirth",
  label: "44. Country of Birth",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line49_CountryOfBirth",
  placeholder: "Country Name",
},

// 45. Ever in US?
{
  key: "beneficiary_everInUS",
  label: "45. Was the beneficiary EVER in the United States?",
  type: "radio",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "beneficiary_everInUS",
  options: [
    { label: "Yes", value: "Yes", pdfKey: "Pt4Line20_Yes" },
    { label: "No",  value: "No",  pdfKey: "Pt4Line20_No" },
  ],
},

// 46.a-d: Only if Yes
{
  key: "beneficiary_classOfAdmission",
  label: "46.a. He or she arrived as a (Class of Admission):",
  type: "select",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line21a_ClassOfAdmission",
  placeholder: "Select Class of Admission",
  options: [
    { label: "1B1 - H-1B1 SPECIALTY OCCUPATION", value: "1B1", pdfKey: "dummy_1B1" },
    { label: "1B2 - H-1B2 DoD SPECIALTY", value: "1B2", pdfKey: "dummy_1B2" },
    { label: "1B3 - H-1B3 FASHION MODEL", value: "1B3", pdfKey: "dummy_1B3" },
    { label: "1B4 - H-1B4 UNIQUE PGM ARTIST-ENT", value: "1B4", pdfKey: "dummy_1B4" },
    { label: "1B5 - H-1B5 ALIEN ATHLETE", value: "1B5", pdfKey: "dummy_1B5" },
    { label: "1BS - SUPPORT PERSON OF H-1", value: "1BS", pdfKey: "dummy_1BS" },
  ],
  condition: (data) => data.beneficiary_everInUS === "Yes",
},
{
  key: "beneficiary_i94Number",
  label: "46.b. Form I-94 Arrival-Departure Record Number",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line21b_ArrivalDeparture",
  placeholder: "11-digit number",
  maxLength: 11,
  condition: (data) => data.beneficiary_everInUS === "Yes",
},
{
  key: "beneficiary_dateOfArrival",
  label: "46.c. Date of Arrival (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line21c_DateOfArrival",
  placeholder: "MM/DD/YYYY",
  condition: (data) => data.beneficiary_everInUS === "Yes",
},
{
  key: "beneficiary_stayExpiredDate",
  label: "46.d. Date authorized stay expired (mm/dd/yyyy or D/S)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line21d_DateExpired",
  placeholder: "MM/DD/YYYY or D/S",
  condition: (data) => data.beneficiary_everInUS === "Yes",
},

// 47-50: Passport / Travel Document
{
  key: "beneficiary_passportNumber",
  label: "47. Passport Number",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line22_PassportNumber",
  placeholder: "Passport Number",
},
{
  key: "beneficiary_travelDocNumber",
  label: "48. Travel Document Number",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line23_TravelDocNumber",
  placeholder: "Travel Document Number",
},
{
  key: "beneficiary_docCountryOfIssuance",
  label: "49. Country of Issuance",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line24_CountryOfIssuance",
  placeholder: "Country Name",
},
{
  key: "beneficiary_docExpirationDate",
  label: "50. Expiration Date (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line25_ExpDate",
  placeholder: "MM/DD/YYYY",
},

// 51: Employment Information
{
  key: "beneficiary_employerName",
  label: "51.a. Name of Current Employer",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_NameOfCompany",
  placeholder: "Company Name",
},
{
  key: "beneficiary_employerStreet",
  label: "51.b. Street Number and Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_StreetNumberName",
  placeholder: "123 Main St",
},

// 51.c: Unit Type (Ste/Apt/Flr) — UNIQUE KEY
{
  key: "beneficiary_employerUnitType",
  label: "51.c. Unit",
  type: "radio",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "beneficiary_employerUnitType",
  options: [
    { label: "Ste", value: "Ste", pdfKey: "Pt4Line26_Unit[0]" },
    { label: "Apt", value: "Apt", pdfKey: "Pt4Line26_Unit[1]" },
    { label: "Flr", value: "Flr", pdfKey: "Pt4Line26_Unit[2]" },
  ],
},
{
  key: "beneficiary_employerUnitNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_AptSteFlrNumber",
  placeholder: "101",
  condition: (data) => ["Ste", "Apt", "Flr"].includes(data.beneficiary_employerUnitType),
},

{
  key: "beneficiary_employerCity",
  label: "51.d. City or Town",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_CityOrTown",
  placeholder: "New York",
},
{
  key: "beneficiary_employerState",
  label: "51.e. State",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_State",
  placeholder: "NY",
},
{
  key: "beneficiary_employerZip",
  label: "51.f. ZIP Code",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_ZipCode",
  placeholder: "10001",
  maxLength: 5,
},
{
  key: "beneficiary_employerProvince",
  label: "51.g. Province",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_Province",
  placeholder: "Ontario",
},
{
  key: "beneficiary_employerPostalCode",
  label: "51.h. Postal Code",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_PostalCode",
  placeholder: "A1B 2C3",
},
{
  key: "beneficiary_employerCountry",
  label: "51.i. Country",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line26_Country",
  placeholder: "Canada",
},

// 52. Employment Start Date
{
  key: "beneficiary_employmentStartDate",
  label: "52. Date Employment Began (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line27_DateEmploymentBegan",
  placeholder: "MM/DD/YYYY",
},

// 53. Immigration Proceedings
{
  key: "beneficiary_inImmigrationProceedings",
  label: "53. Was the beneficiary EVER in immigration proceedings?",
  type: "radio",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "beneficiary_inImmigrationProceedings",
  options: [
    { label: "Yes", value: "Yes", pdfKey: "Pt4Line28_Yes" },
    { label: "No",  value: "No",  pdfKey: "Pt4Line28_No" },
  ],
},

// 54. Type of Proceedings — INDIVIDUAL CHECKBOXES (UI SUPPORTED)
{
  key: "beneficiary_proceedingRemoval",
  label: "Removal",
  type: "checkbox",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line54_Removal",
  condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
},
{
  key: "beneficiary_proceedingExclusion",
  label: "Exclusion/Deportation",
  type: "checkbox",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line54_Exclusion",
  condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
},
{
  key: "beneficiary_proceedingRescission",
  label: "Rescission",
  type: "checkbox",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line54_Rescission",
  condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
},
{
  key: "beneficiary_proceedingJudicial",
  label: "Other Judicial Proceedings",
  type: "checkbox",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line54_JudicialProceedings",
  condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
},

// 55-56: Proceeding Location & Date
{
  key: "beneficiary_proceedingCity",
  label: "55.a. City or Town",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line55a_CityOrTown",
  placeholder: "City Name",
  condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
},
{
  key: "beneficiary_proceedingState",
  label: "55.b. State",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line55b_State",
  placeholder: "NY",
  condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
},
{
  key: "beneficiary_proceedingDate",
  label: "56. Date (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line56_Date",
  placeholder: "MM/DD/YYYY",
  condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
},

// Hidden Barcode
{
  key: "beneficiary_page7Barcode",
  label: "PDF417 Barcode (Page 7)",
  type: "hidden",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "PDF417BarCode1",
  value: "form1[0].#pageSet[0].Page1[6].PDF417BarCode1[0]",
},

// =============================================
// PAGE 8 - PART 4: Information About Beneficiary (Continued)
// =============================================

// 55.a-c: Beneficiary's Previous Spouse or Person
{
  key: "beneficiary_prevSpouseFamilyName",
  label: "55.a. Family Name (Last Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line55a_FamilyName",
  placeholder: "Last Name",
},
{
  key: "beneficiary_prevSpouseGivenName",
  label: "55.b. Given Name (First Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line55b_GivenName",
  placeholder: "First Name",
},
{
  key: "beneficiary_prevSpouseMiddleName",
  label: "55.c. Middle Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line55c_MiddleName",
  placeholder: "Middle Name",
},

// 56: Previous Spouse's Address
{
  key: "beneficiary_prevSpouseStreet",
  label: "56. Street Number and Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line56_StreetNumberName",
  placeholder: "123 Main St",
},
{
  key: "beneficiary_prevSpouseUnitType",
  label: "56. Unit",
  type: "radio",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "beneficiary_prevSpouseUnitType",
  options: [
    { label: "Ste", value: "Ste", pdfKey: "Pt4Line56_Unit[0]" },
    { label: "Apt", value: "Apt", pdfKey: "Pt4Line56_Unit[1]" },
    { label: "Flr", value: "Flr", pdfKey: "Pt4Line56_Unit[2]" },
  ],
},
{
  key: "beneficiary_prevSpouseUnitNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line56_AptSteFlrNumber",
  placeholder: "101",
  condition: (data) => ["Ste", "Apt", "Flr"].includes(data.beneficiary_prevSpouseUnitType),
},
{
  key: "beneficiary_prevSpouseCity",
  label: "56. City or Town",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line56_CityOrTown",
  placeholder: "New York",
},
{
  key: "beneficiary_prevSpouseProvince",
  label: "56. Province",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line56_Province",
  placeholder: "Ontario",
},
{
  key: "beneficiary_prevSpousePostalCode",
  label: "56. Postal Code",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line56_PostalCode",
  placeholder: "A1B 2C3",
},
{
  key: "beneficiary_prevSpouseCountry",
  label: "56. Country",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line56_Country",
  placeholder: "Canada",
},

// 57: Beneficiary's Current Address in U.S.
{
  key: "beneficiary_currentUSStreet",
  label: "57. Street Number and Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_StreetNumberName",
  placeholder: "456 Elm St",
},
{
  key: "beneficiary_currentUSUnitType",
  label: "57. Unit",
  type: "radio",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "beneficiary_currentUSUnitType",
  options: [
    { label: "Ste", value: "Ste", pdfKey: "Pt4Line57_Unit[0]" },
    { label: "Apt", value: "Apt", pdfKey: "Pt4Line57_Unit[1]" },
    { label: "Flr", value: "Flr", pdfKey: "Pt4Line57_Unit[2]" },
  ],
},
{
  key: "beneficiary_currentUSUnitNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_AptSteFlrNumber",
  placeholder: "202",
  condition: (data) => ["Ste", "Apt", "Flr"].includes(data.beneficiary_currentUSUnitType),
},
{
  key: "beneficiary_currentUSCity",
  label: "57. City or Town",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_CityOrTown",
  placeholder: "Los Angeles",
},
{
  key: "beneficiary_currentUSState",
  label: "57. State",
  type: "select",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_State",
  placeholder: "Select State",
  options: [
    { label: "CA", value: "CA", pdfKey: "state_CA" },
    { label: "NY", value: "NY", pdfKey: "state_NY" },
    { label: "TX", value: "TX", pdfKey: "state_TX" },
    // Add more states as needed
  ],
},
{
  key: "beneficiary_currentUSZip",
  label: "57. ZIP Code",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_ZipCode",
  placeholder: "90210",
  maxLength: 5,
},
{
  key: "beneficiary_currentUSProvince",
  label: "57. Province",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_Province",
  placeholder: "Ontario",
},
{
  key: "beneficiary_currentUSPostalCode",
  label: "57. Postal Code",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_PostalCode",
  placeholder: "M5V 2T6",
},
{
  key: "beneficiary_currentUSCountry",
  label: "57. Country",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line57_Country",
  placeholder: "United States",
},

// 58.a-b: Dates of Marriage
{
  key: "beneficiary_marriageDateFrom",
  label: "58.a. Date Marriage Began (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line58a_DateFrom",
  placeholder: "MM/DD/YYYY",
},
{
  key: "beneficiary_marriageDateTo",
  label: "58.b. Date Marriage Ended (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line58b_DateTo",
  placeholder: "MM/DD/YYYY",
},

// 60.a-b: Beneficiary's Intended Address in U.S.
{
  key: "beneficiary_intendedCity",
  label: "60.a. City or Town",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line60a_CityOrTown",
  placeholder: "Chicago",
},
{
  key: "beneficiary_intendedState",
  label: "60.b. State",
  type: "select",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line60b_State",
  placeholder: "Select State",
  options: [
    { label: "IL", value: "IL", pdfKey: "state_IL" },
    { label: "FL", value: "FL", pdfKey: "state_FL" },
    // Add more
  ],
},

// 61.a-c: Beneficiary's Address Abroad
{
  key: "beneficiary_abroadCity",
  label: "61.a. City or Town",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line61a_CityOrTown",
  placeholder: "London",
},
{
  key: "beneficiary_abroadProvince",
  label: "61.b. Province",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line61b_Province",
  placeholder: "Greater London",
},
{
  key: "beneficiary_abroadCountry",
  label: "61.c. Country",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line61c_Country",
  placeholder: "United Kingdom",
},

// Part 5: Previous Petitions
{
  key: "hasPreviousPetition",
  label: "1. Has anyone ever filed a petition for the beneficiary before?",
  type: "radio",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "hasPreviousPetition",
  options: [
    { label: "Yes", value: "Yes", pdfKey: "Part4Line1_Yes" },
    { label: "No", value: "No", pdfKey: "Part4Line1_No" },
  ],
},

// 2.a-c: Petitioner's Name (if Yes)
{
  key: "previousPetitionerFamilyName",
  label: "2.a. Family Name (Last Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt5Line2a_FamilyName",
  condition: (data) => data.hasPreviousPetition === "Yes",
},
{
  key: "previousPetitionerGivenName",
  label: "2.b. Given Name (First Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt5Line2b_GivenName",
  condition: (data) => data.hasPreviousPetition === "Yes",
},
{
  key: "previousPetitionerMiddleName",
  label: "2.c. Middle Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt5Line2c_MiddleName",
  condition: (data) => data.hasPreviousPetition === "Yes",
},

// 3.a-b: Previous Filing Location
{
  key: "previousFilingCity",
  label: "3.a. City or Town",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt5Line3a_CityOrTown",
  condition: (data) => data.hasPreviousPetition === "Yes",
},
{
  key: "previousFilingState",
  label: "3.b. State",
  type: "select",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt5Line3b_State",
  condition: (data) => data.hasPreviousPetition === "Yes",
  options: [
    { label: "TX", value: "TX", pdfKey: "state_TX" },
    // Add more
  ],
},

// 4. Date Filed
{
  key: "previousFilingDate",
  label: "4. Date Filed (mm/dd/yyyy)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt5Line4_DateFiled",
  placeholder: "MM/DD/YYYY",
  condition: (data) => data.hasPreviousPetition === "Yes",
},

// 5. Result
{
  key: "previousFilingResult",
  label: "5. Result",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt5Line5_Result",
  placeholder: "Approved/Denied",
  condition: (data) => data.hasPreviousPetition === "Yes",
},

// 6.a-c: Beneficiary's Child
{
  key: "beneficiary_childFamilyName",
  label: "6.a. Family Name (Last Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line6a_FamilyName",
},
{
  key: "beneficiary_childGivenName",
  label: "6.b. Given Name (First Name)",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line6b_GivenName",
},
{
  key: "beneficiary_childMiddleName",
  label: "6.c. Middle Name",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line6c_MiddleName",
},

// 7. Relationship
{
  key: "beneficiary_childRelationship",
  label: "7. Relationship",
  type: "text",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "Pt4Line7_Relationship",
  placeholder: "Child",
},

// Hidden Barcode
{
  key: "beneficiary_page8Barcode",
  label: "PDF417 Barcode (Page 8)",
  type: "hidden",
  section: "Part 4. Information About Beneficiary (Continued)",
  pdfKey: "form1[0].#pageSet[0].Page1[7].PDF417BarCode1[0]",
  value: "form1[0].#pageSet[0].Page1[7].PDF417BarCode1[0]",
},


// === PAGE 9 ===
// Part 6. Petitioner’s Contact Information, Declaration, and Signature

{
  key: "petitioner_daytimePhone",
  label: "1. Daytime Telephone Number",
  type: "text",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "Pt6Line3_DaytimePhoneNumber",
  placeholder: "(123) 456-7890",
},
{
  key: "petitioner_mobile",
  label: "2. Mobile Telephone Number (if any)",
  type: "text",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "Pt6Line4_MobileNumber",
  placeholder: "(123) 456-7890",
},
{
  key: "petitioner_email",
  label: "3. Email Address (if any)",
  type: "text",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "Pt6Line5_Email",
  placeholder: "you@example.com",
},

// Interpreter Help
{
  key: "interpreter_help_english",
  label: "1.a. I can read and understand English...",
  type: "radio",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "interpreter_help_english",
  options: [
    { label: "Yes", value: "Yes", pdfKey: "Pt6Line1Checkbox[0]" },
    { label: "No", value: "No", pdfKey: "Pt6Line1Checkbox[1]" },
  ],
},
{
  key: "interpreter_language",
  label: "1.c. Language used by interpreter",
  type: "text",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "Pt6Line1b_Language",
  placeholder: "Spanish",
  condition: (data) => data.interpreter_help_english === "No",
},

// Representative Help
{
  key: "representative_help",
  label: "2.a. At my request, the preparer named below...",
  type: "checkbox",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "Pt6Line2_Checkbox",
},
{
  key: "representative_name",
  label: "2.b. Name of Preparer (if any)",
  type: "text",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "Pt6Line2_RepresentativeName",
  placeholder: "John Doe",
  condition: (data) => data.representative_help === "Yes",
},

// Signature
{
  key: "petitioner_signature",
  label: "6.a. Signature of Petitioner",
  type: "text",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "P5_Line6a_SignatureofApplicant",
  placeholder: "John A. Smith",
},
{
  key: "petitioner_signature_date",
  label: "6.b. Date of Signature (mm/dd/yyyy)",
  type: "text",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "Pt6Line6b_DateofSignature",
  placeholder: "MM/DD/YYYY",
},

// Hidden Barcode (Page 9)
{
  key: "page9_barcode",
  label: "PDF417 Barcode (Page 9)",
  type: "hidden",
  section: "Part 6. Petitioner’s Contact Information, Declaration, and Signature",
  pdfKey: "form1[0].#pageSet[0].Page1[8].PDF417BarCode1[0]",
  value: "form1[0].#pageSet[0].Page1[8].PDF417BarCode1[0]",
},


// =============================================
// PAGE 10 - PART 7 & 8: Interpreter & Preparer Details
// =============================================

// PART 7: Interpreter's Information
{
  key: "interpreter_familyName",
  label: "1.a. Interpreter's Family Name",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line1a_InterpreterFamilyName",
  placeholder: "Garcia",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_givenName",
  label: "1.b. Interpreter's Given Name",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line1b_InterpreterGivenName",
  placeholder: "Maria",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_business",
  label: "2. Interpreter's Business or Organization Name",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line2_InterpreterBusinessorOrg",
  placeholder: "ABC Translation Services",
  condition: (data) => data.interpreter_help_english === "No",
},

// Interpreter Address
{
  key: "interpreter_street",
  label: "3. Street Number and Name",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_StreetNumberName",
  placeholder: "789 Oak St",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_unitType",
  label: "3. Unit",
  type: "radio",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "interpreter_unitType",
  options: [
    { label: "Ste", value: "Ste", pdfKey: "Pt7Line3_Unit[0]" },
    { label: "Apt", value: "Apt", pdfKey: "Pt7Line3_Unit[1]" },
    { label: "Flr", value: "Flr", pdfKey: "Pt7Line3_Unit[2]" },
  ],
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_unitNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_AptSteFlrNumber",
  placeholder: "303",
  condition: (data) => data.interpreter_help_english === "No" && ["Ste", "Apt", "Flr"].includes(data.interpreter_unitType),
},
{
  key: "interpreter_city",
  label: "3. City or Town",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_CityOrTown",
  placeholder: "Miami",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_state",
  label: "3. State",
  type: "select",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_State",
  placeholder: "Select State",
  options: [
    { label: "FL", value: "FL", pdfKey: "state_FL" },
    { label: "CA", value: "CA", pdfKey: "state_CA" },
  ],
  condition: (data) => data.interpreter_help_english === "No",
},

{
  key: "interpreter_zip",
  label: "3. ZIP Code",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_ZipCode",
  placeholder: "33101",
  maxLength: 5,
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_province",
  label: "3. Province",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_Province",
  placeholder: "Ontario",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_postalCode",
  label: "3. Postal Code",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_PostalCode",
  placeholder: "M5V 2T6",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_country",
  label: "3. Country",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line3_Country",
  placeholder: "Canada",
  condition: (data) => data.interpreter_help_english === "No",
},

// Interpreter Contact
{
  key: "interpreter_daytimePhone",
  label: "4. Daytime Telephone Number",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line4_InterpreterDaytimeTelephone",
  placeholder: "(305) 555-0198",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_email",
  label: "5. Email Address",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line5_Email",
  placeholder: "maria@translation.com",
  condition: (data) => data.interpreter_help_english === "No",
},

// Interpreter Signature
{
  key: "interpreter_signature",
  label: "7.a. Signature of Interpreter",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line7a_Signature",
  placeholder: "Maria Garcia",
  condition: (data) => data.interpreter_help_english === "No",
},
{
  key: "interpreter_signature_date",
  label: "7.b. Date of Signature (mm/dd/yyyy)",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7Line7b_DateofSignature",
  placeholder: "MM/DD/YYYY",
  condition: (data) => data.interpreter_help_english === "No",
},

// Language Name (Top of Page 10)
{
  key: "interpreter_language_name",
  label: "Language Name",
  type: "text",
  section: "Part 7. Interpreter's Contact Information, Certification, and Signature",
  pdfKey: "Pt7_NameofLanguage",
  placeholder: "Spanish",
  condition: (data) => data.interpreter_help_english === "No",
},


// PART 8: Preparer's Information
{
  key: "preparer_familyName",
  label: "1.a. Preparer's Family Name",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line1a_PreparerFamilyName",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_givenName",
  label: "1.b. Preparer's Given Name",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line1b_PreparerGivenName",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_business",
  label: "2. Preparer's Business or Organization Name",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line2_BusinessName",
  condition: (data) => data.representative_help === "Yes",
},

// Preparer Address
{
  key: "preparer_street",
  label: "3. Street Number and Name",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_StreetNumberName",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_unitType",
  label: "3. Unit",
  type: "radio",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "preparer_unitType",
  options: [
    { label: "Ste", value: "Ste", pdfKey: "Pt8Line3_Unit[0]" },
    { label: "Apt", value: "Apt", pdfKey: "Pt8Line3_Unit[1]" },
    { label: "Flr", value: "Flr", pdfKey: "Pt8Line3_Unit[2]" },
  ],
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_unitNumber",
  label: "Apt/Ste/Flr Number",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_AptSteFlrNumber",
  condition: (data) => data.representative_help === "Yes" && ["Ste", "Apt", "Flr"].includes(data.preparer_unitType),
},
{
  key: "preparer_city",
  label: "3. City or Town",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_CityOrTown",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_state",
  label: "3. State",
  type: "select",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_State",
  options: [
    { label: "NY", value: "NY", pdfKey: "state_NY" },
  ],
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_zip",
  label: "3. ZIP Code",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_ZipCode",
  maxLength: 5,
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_province",
  label: "3. Province",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_Province",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_postalCode",
  label: "3. Postal Code",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_PostalCode",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_country",
  label: "3. Country",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line3_Country",
  condition: (data) => data.representative_help === "Yes",
},

// Hidden Barcode (Page 10)
{
  key: "page10_barcode",
  label: "PDF417 Barcode (Page 10)",
  type: "hidden",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "form1[0].#pageSet[0].Page1[9].PDF417BarCode1[0]",
  value: "form1[0].#pageSet[0].Page1[9].PDF417BarCode1[0]",
},


// =============================================
// PAGE 11 - PART 8: Preparer Certification
// =============================================

{
  key: "preparer_daytimePhone",
  label: "4. Daytime Telephone Number",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line4_DaytimePhoneNumber",
  placeholder: "(555) 123-4567",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_fax",
  label: "5. Fax Number (if any)",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line5_PreparerFaxNumber",
  placeholder: "(555) 987-6543",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_email",
  label: "6. Email Address (if any)",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line6_Email",
  placeholder: "preparer@lawfirm.com",
  condition: (data) => data.representative_help === "Yes",
},

// 7. Certification
{
  key: "preparer_certify",
  label: "7. I certify, under penalty of perjury...",
  type: "radio",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "preparer_certify",
  options: [
    { label: "Yes", value: "Yes", pdfKey: "Pt8Line7_Checkbox_Yes" },
    { label: "No", value: "No", pdfKey: "Pt8Line7_Checkbox_No" },
  ],
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_interpreter_used",
  label: "7.b. An interpreter was used",
  type: "radio",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "preparer_interpreter_used",
  options: [
    { label: "Yes", value: "Yes", pdfKey: "Pt8Line7b_Checkbox_Yes" },
    { label: "No", value: "No", pdfKey: "Pt8Line7b_Checkbox_No" },
  ],
  condition: (data) => data.representative_help === "Yes",
},

// Signature
{
  key: "preparer_signature",
  label: "8.a. Signature of Preparer",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line8a_Signature",
  placeholder: "Jane Doe",
  condition: (data) => data.representative_help === "Yes",
},
{
  key: "preparer_signature_date",
  label: "8.b. Date of Signature (mm/dd/yyyy)",
  type: "text",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "Pt8Line8b_DateofSignature",
  placeholder: "MM/DD/YYYY",
  condition: (data) => data.representative_help === "Yes",
},

// Hidden Barcode
{
  key: "page11_barcode",
  label: "PDF417 Barcode (Page 11)",
  type: "hidden",
  section: "Part 8. Preparer's Contact Information, Certification, and Signature",
  pdfKey: "form1[0].#pageSet[0].Page1[10].PDF417BarCode1[0]",
  value: "form1[0].#pageSet[0].Page1[10].PDF417BarCode1[0]",
},


// =============================================
// PAGE 12 - PART 9: Additional Information
// =============================================

{
  key: "additional_info_a_number",
  label: "A-Number (Top Right)",
  type: "text",
  section: "Part 9. Additional Information",
  pdfKey: "Pt2Line1_AlienNumber_Page12",
  placeholder: "A12345678",
},

// === 5 BLOCKS OF ADDITIONAL INFO ===
{
  key: "addl_3_page",
  label: "3.a. Page Number",
  type: "text",
  section: "Part 9. Additional Information",
  pdfKey: "Pt9Line3a_PageNumber",
  maxLength: 2,
},
{
  key: "addl_3_part",
  label: "3.b. Part Number",
  type: "text",
  section: "Part 9. Additional Information",
  pdfKey: "Pt9Line3b_PartNumber",
  maxLength: 2,
},
{
  key: "addl_3_item",
  label: "3.c. Item Number",
  type: "text",
  section: "Part 9. Additional Information",
  pdfKey: "Pt9Line3c_ItemNumber",
  maxLength: 3,
},
{
  key: "addl_3_text",
  label: "3.d. Additional Information",
  type: "textarea",
  section: "Part 9. Additional Information",
  pdfKey: "Pt9Line3d_AdditionalInfo",
  placeholder: "Explain here...",
},

// Repeat for 4, 5, 6, 7 → (same pattern)
{
  key: "addl_4_page", label: "4.a. Page Number", type: "text", pdfKey: "Pt9Line4a_PageNumber", maxLength: 2,
},
{
  key: "addl_4_part", label: "4.b. Part Number", type: "text", pdfKey: "Pt9Line4b_PartNumber", maxLength: 2,
},
{
  key: "addl_4_item", label: "4.c. Item Number", type: "text", pdfKey: "Pt9Line4c_ItemNumber", maxLength: 3,
},
{
  key: "addl_4_text", label: "4.d. Additional Information", type: "textarea", pdfKey: "Pt9Line4d_AdditionalInfo",
},

// Block 5 (Top Right)
{
  key: "addl_5_page", label: "5.a. Page Number", type: "text", pdfKey: "Pt9Line5a_PageNumber", maxLength: 2,
},
{
  key: "addl_5_part", label: "5.b. Part Number", type: "text", pdfKey: "Pt9Line5b_PartNumber", maxLength: 2,
},
{
  key: "addl_5_item", label: "5.c. Item Number", type: "text", pdfKey: "Pt9Line5c_ItemNumber", maxLength: 3,
},
{
  key: "addl_5_text", label: "5.d. Additional Information", type: "textarea", pdfKey: "Pt9Line5d_AdditionalInfo",
},

// Block 6
{
  key: "addl_6_page", label: "6.a. Page Number", type: "text", pdfKey: "Pt9Line6a_PageNumber", maxLength: 2,
},
{
  key: "addl_6_part", label: "6.b. Part Number", type: "text", pdfKey: "Pt9Line6b_PartNumber", maxLength: 2,
},
{
  key: "addl_6_item", label: "6.c. Item Number", type: "text", pdfKey: "Pt9Line6c_ItemNumber", maxLength: 3,
},
{
  key: "addl_6_text", label: "6.d. Additional Information", type: "textarea", pdfKey: "Pt9Line6d_AdditionalInfo",
},

// Block 7
{
  key: "addl_7_page", label: "7.a. Page Number", type: "text", pdfKey: "Pt9Line9a_PageNumber", maxLength: 2,
},
{
  key: "addl_7_part", label: "7.b. Part Number", type: "text", pdfKey: "Pt9Line7b_PartNumber", maxLength: 2,
},
{
  key: "addl_7_item", label: "7.c. Item Number", type: "text", pdfKey: "Pt9Line7c_ItemNumber", maxLength: 3,
},
{
  key: "addl_7_text", label: "7.d. Additional Information", type: "textarea", pdfKey: "Pt9Line7d_AdditionalInfo",
},

// Beneficiary Name (Repeated on Page 12)
{
  key: "beneficiary_familyName_page12",
  label: "Family Name (Repeated)",
  type: "text",
  section: "Part 9. Additional Information",
  pdfKey: "Pt2Line4a_FamilyName_Page12",
},
{
  key: "beneficiary_givenName_page12",
  label: "Given Name (Repeated)",
  type: "text",
  section: "Part 9. Additional Information",
  pdfKey: "Pt2Line4b_GivenName_Page12",
},
{
  key: "beneficiary_middleName_page12",
  label: "Middle Name (Repeated)",
  type: "text",
  section: "Part 9. Additional Information",
  pdfKey: "Pt2Line4c_MiddleName_Page12",
},

// Hidden Barcode
{
  key: "page12_barcode",
  label: "PDF417 Barcode (Page 12)",
  type: "hidden",
  section: "Part 9. Additional Information",
  pdfKey: "form1[0].#pageSet[0].Page1[11].PDF417BarCode1[0]",
  value: "form1[0].#pageSet[0].Page1[11].PDF417BarCode1[0]",
},


];

export const getInitialFormData = () => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => (data[f.key] = ""));
  return data;
};

export const sectionIntroMessages = {
  "Part 1. Relationship": {
    greeting: "Let's start with the basics",
    message: "First, we need to understand your relationship with the person you're petitioning for. This helps us determine the right visa category and requirements for your case.",
  },
  "Part 2. Information About You (Petitioner)": {
    greeting: "Now tell us about yourself",
    message: "Next, we'll collect your personal information as the petitioner. This includes your name, identification numbers, and other details USCIS needs to verify your identity.",
  },
  "Address History": {
    greeting: "Let's cover your address history",
    message: "USCIS requires a complete record of where you've lived. We'll collect your current and previous addresses to ensure all records are accurate and up to date.",
  },
  "Part 3. Biographic Information": {
    greeting: "Moving on to biographic details",
    message: "Now we'll gather some additional background information including your physical characteristics and personal history. This is standard for all immigration petitions.",
  },
  "Part 4. Information About Your Relative": {
    greeting: "Now let's learn about your relative",
    message: "We'll collect detailed information about the beneficiary - the person you're petitioning for. This includes their personal details, background, and current situation.",
  },
  "Part 5. Additional Information About Your Relative": {
    greeting: "A few more details about your relative",
    message: "We need some additional information about the beneficiary's immigration history and current status. This helps USCIS process the petition correctly.",
  },
  "Part 6. Petitioner's Declaration": {
    greeting: "Almost there - declaration section",
    message: "This section contains important declarations and certifications. Please review each question carefully as these are legal statements.",
  },
  "Part 7. Interpreter's Information": {
    greeting: "Interpreter information section",
    message: "If you used an interpreter to help complete this form, we'll need their information here. Skip this section if you completed the form without assistance.",
  },
  "Part 8. Preparer's Information": {
    greeting: "Preparer information section",
    message: "If someone else helped prepare this form, we'll need their details. Skip this if you completed it yourself.",
  },
  "Part 9. Additional Information": {
    greeting: "Final section - additional information",
    message: "This is the last section. Use this space for any extra information that didn't fit in the previous sections. You're almost done!",
  },
};

export const i130Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  sectionIntroMessages,
}

export default i130Config