import type { Field } from "./types";

export const formId = "i485";
export const formTitle = "Form I-485";
export const formSubtitle = "Application to Register Permanent Residence or Adjust Status";

const generatePriorAddressesFields = (startIndex: number, endIndex: number): Field[] => {
  const fields: Field[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    fields.push({
      key: `p1_prior_addr_${i}_note`,
      pdfKey: "N/A",
      label: `Previous Address ${i}`,
      type: "hidden",
      section: "Address History & Social Security",
      condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= i,
      subQuestions: [
        // {
        //   key: `p1_prior_addr_${i}_in_care_of`,
        //   pdfKey: "N/A",
        //   label: "Who received mail for you at this address? (In Care Of Name - Leave blank if none)",
        //   type: "text",
        //   section: "Address History & Social Security",
        // },
        {
          key: `p1_prior_addr_${i}_street`,
          pdfKey: "N/A",
          label: "What was the House Number and Street Name?",
          type: "text",
          section: "Address History & Social Security",
        },
        {
          key: `p1_prior_addr_${i}_unit_type`,
          pdfKey: "_",
          label: "Was this home an Apartment, Suite, or Floor?",
          type: "radio",
          options: [
            { label: "Apt.", value: "Apt" },
            { label: "Ste.", value: "Ste" },
            { label: "Flr.", value: "Flr" },
          ],
          section: "Address History & Social Security",
        },
        {
          key: `p1_prior_addr_${i}_unit_val`,
          pdfKey: "N/A",
          label: "What was the Apartment, Suite, or Floor Number? (Leave blank if none)",
          type: "text",
          section: "Address History & Social Security",
        },
        {
          key: `p1_prior_addr_${i}_city`,
          pdfKey: "N/A",
          label: "What City or Town was it in?",
          type: "text",
          section: "Address History & Social Security",
        },
        {
          key: `p1_prior_addr_${i}_state`,
          pdfKey: "N/A",
          label: "What U.S. state was it in? (if in the U.S.)",
          type: "dropdown",
          isState: true,
          section: "Address History & Social Security",
          condition: (d) => !d[`p1_prior_addr_${i}_province`],
        },
        {
          key: `p1_prior_addr_${i}_zip`,
          pdfKey: "N/A",
          label: "What was the ZIP Code? (if in the U.S.)",
          type: "text",
          section: "Address History & Social Security",
          condition: (d) => !d[`p1_prior_addr_${i}_postal`],
        },
        {
          key: `p1_prior_addr_${i}_province`,
          pdfKey: "N/A",
          label: "What province was it in? (if outside the U.S.)",
          type: "text",
          section: "Address History & Social Security",
          condition: (d) => !d[`p1_prior_addr_${i}_state`],
        },
        {
          key: `p1_prior_addr_${i}_postal`,
          pdfKey: "N/A",
          label: "What was the Postal Code? (if outside the U.S.)",
          type: "text",
          section: "Address History & Social Security",
          condition: (d) => !d[`p1_prior_addr_${i}_zip`],
        },
        {
          key: `p1_prior_addr_${i}_country`,
          pdfKey: "N/A",
          label: "What country was it in?",
          type: "text",
          section: "Address History & Social Security",
        },
        {
          key: `p1_prior_addr_${i}_date_from`,
          pdfKey: "N/A",
          label: "When did you start living here? (mm/dd/yyyy)",
          type: "date",
          section: "Address History & Social Security",
        },
        {
          key: `p1_prior_addr_${i}_date_to`,
          pdfKey: "N/A",
          label: "When did you move out? (mm/dd/yyyy)",
          type: "date",
          section: "Address History & Social Security",
        },
      ],
    });
  }
  return fields;
};

export const formFields: Field[] = [
  // ============================================
  // Header Information
  // ============================================
  {
    key: "p1_has_alien_number",
    pdfKey: "_",
    label: "Do you have an Alien Registration Number (A-Number)?",
    tooltip: "This is a special 9-digit number given by USCIS to immigrants.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_alien_number",
        pdfKey: "p1_alien_number",
        label: "What is your Alien Registration Number (A-Number)?",
        placeholder: "123456789",
        type: "text",
        maxLength: 9,
        condition: (d) => d.p1_has_alien_number === "Yes",
      },
    ],
  },

  // ============================================
  // Item 1. Your Current Legal Name
  // ============================================
  {
    key: "p1_legal_family_name",
    pdfKey: "p1_legal_family_name",
    label: "What is your Last Name (Family Name)?",
    tooltip: "This is your family's main last name as written on your official passport or ID.",
    type: "text",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_legal_given_name",
    pdfKey: "p1_legal_given_name",
    label: "What is your First Name (Given Name)?",
    tooltip: "This is your main first name.",
    type: "text",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_legal_middle_name",
    pdfKey: "p1_legal_middle_name",
    label: "What is your Middle Name? (If you don't have one, you can leave this blank)",
    tooltip: "Your middle name if you have one.",
    type: "text",
    section: "Part 1. Information About You",
  },

  // ============================================
  // Item 2. Other Names You Have Used Since Birth
  // ============================================
  {
    key: "p1_has_other_names",
    pdfKey: "_",
    label: "Have you ever used any other names since you were born?",
    tooltip: "Includes maiden names, nicknames, aliases, or other legal names.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_other_name1_family",
        pdfKey: "p1_other_name1_family",
        label: "What was your first other Last Name (Family Name)?",
        type: "text",
        condition: (d) => d.p1_has_other_names === "Yes",
      },
      {
        key: "p1_other_name1_given",
        pdfKey: "p1_other_name1_given",
        label: "What was your first other First Name (Given Name)?",
        type: "text",
        condition: (d) => d.p1_has_other_names === "Yes",
      },
      {
        key: "p1_other_name1_middle",
        pdfKey: "p1_other_name1_middle",
        label: "What was your first other Middle Name?",
        type: "text",
        condition: (d) => d.p1_has_other_names === "Yes",
      },
      {
        key: "p1_other_name2_family",
        pdfKey: "p1_other_name2_family",
        label: "What was your second other Last Name (Family Name)?",
        type: "text",
        condition: (d) => d.p1_has_other_names === "Yes",
      },
      {
        key: "p1_other_name2_given",
        pdfKey: "p1_other_name2_given",
        label: "What was your second other First Name (Given Name)?",
        type: "text",
        condition: (d) => d.p1_has_other_names === "Yes",
      },
      {
        key: "p1_other_name2_middle",
        pdfKey: "p1_other_name2_middle",
        label: "What was your second other Middle Name?",
        type: "text",
        condition: (d) => d.p1_has_other_names === "Yes",
      },
    ],
  },

  // ============================================
  // Item 3. Date of Birth & Other Dates of Birth
  // ============================================
  {
    key: "p1_dob",
    pdfKey: "p1_dob",
    label: "What is your Birthday? (Date of Birth)",
    tooltip: "Enter the day you were born in mm/dd/yyyy format.",
    type: "date",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_has_other_dob",
    pdfKey: "_",
    label: "Have you ever used any other date of birth?",
    tooltip: "Select Yes if you ever used a different birth date on any official documents.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_other_dob_Yes" },
      { label: "No", value: "No", pdfKey: "p1_other_dob_No" },
    ],
    subQuestions: [
      {
        key: "p1_other_dob1",
        pdfKey: "p1_other_dob1",
        label: "First Other Birthday You Used (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p1_has_other_dob === "Yes",
      },
      {
        key: "p1_other_dob2",
        pdfKey: "p1_other_dob2",
        label: "Second Other Birthday You Used (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p1_has_other_dob === "Yes",
      },
    ],
  },

  // ============================================
  // Item 4. Alien Registration Number (A-Number)
  // ============================================
  {
    key: "p1_item4_has_alien",
    pdfKey: "_",
    label: "Do you have an Alien Registration Number (A-Number)?",
    tooltip: "This is a 9-digit number given by USCIS to immigrants.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_item4_has_alien_Yes" },
      { label: "No", value: "No", pdfKey: "p1_item4_has_alien_No" },
    ],
    subQuestions: [
      {
        key: "p1_item4_alien_number",
        pdfKey: "p1_item4_alien_number",
        label: "What is your Alien Registration Number (A-Number)?",
        placeholder: "123456789",
        type: "text",
        maxLength: 9,
        condition: (d) => d.p1_item4_has_alien === "Yes",
      },
    ],
  },

  // ============================================
  // Item 5. Other A-Numbers
  // ============================================
  {
    key: "p1_has_other_alien",
    pdfKey: "_",
    label: "Have you ever used, or been assigned, any other A-Number?",
    tooltip: "Select Yes if you ever had another 9-digit A-Number in the past.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_has_other_alien_Yes" },
      { label: "No", value: "No", pdfKey: "p1_has_other_alien_No" },
    ],
    subQuestions: [
      {
        key: "p1_other_alien_number1",
        pdfKey: "p1_other_alien_number1",
        label: "First Other A-Number",
        placeholder: "123456789",
        type: "text",
        maxLength: 9,
        condition: (d) => d.p1_has_other_alien === "Yes",
      },
      {
        key: "p1_other_alien_number2",
        pdfKey: "p1_other_alien_number2",
        label: "Second Other A-Number",
        placeholder: "123456789",
        type: "text",
        maxLength: 9,
        condition: (d) => d.p1_has_other_alien === "Yes",
      },
    ],
  },

  // ============================================
  // Item 6. Sex
  // ============================================
  {
    key: "p1_sex",
    pdfKey: "_",
    label: "What is your Sex?",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Male", value: "Male", pdfKey: "p1_sex_Male" },
      { label: "Female", value: "Female", pdfKey: "p1_sex_Female" },
    ],
  },

  // ============================================
  // Item 7. Place of Birth
  // ============================================
  {
    key: "p1_city_of_birth",
    pdfKey: "p1_city_of_birth",
    label: "What is your City or Town of Birth?",
    tooltip: "The city or village where you were born.",
    type: "text",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_country_of_birth",
    pdfKey: "p1_country_of_birth",
    label: "What is your Country of Birth?",
    tooltip: "The country where you were born.",
    type: "text",
    section: "Part 1. Information About You",
  },

  // ============================================
  // Item 8. Country of Citizenship / Nationality
  // ============================================
  {
    key: "p1_country_of_citizenship",
    pdfKey: "p1_country_of_citizenship",
    label: "What is your Country of Citizenship or Nationality?",
    tooltip: "The country that issued your passport.",
    type: "text",
    section: "Part 1. Information About You",
  },

  // ============================================
  // Item 9. USCIS Online Account Number
  // ============================================
  {
    key: "p1_has_uscis_account",
    pdfKey: "_",
    label: "Do you have a USCIS Online Account Number?",
    tooltip: "A unique 12-digit number given if you registered an account on uscis.gov.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_uscis_account_number",
        pdfKey: "p1_uscis_account_number",
        label: "What is your 12-digit USCIS Online Account Number?",
        placeholder: "123456789012",
        type: "text",
        maxLength: 12,
        condition: (d) => d.p1_has_uscis_account === "Yes",
      },
    ],
  },

  // ============================================
  // Item 10. Recent Immigration History
  // ============================================
  {
    key: "p1_passport_number",
    pdfKey: "p1_passport_number",
    label: "What is the Passport or Travel Document Number used at your last arrival?",
    tooltip: "The number printed on the passport you used when entering the U.S.",
    type: "text",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_passport_exp_date",
    pdfKey: "p1_passport_exp_date",
    label: "What is the Expiration Date of this Passport or Travel Document?",
    tooltip: "Date format: mm/dd/yyyy",
    type: "date",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_passport_country",
    pdfKey: "p1_passport_country",
    label: "What country issued this Passport or Travel Document?",
    type: "text",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_visa_number",
    pdfKey: "p1_visa_number",
    label: "What is your Nonimmigrant Visa Number used during most recent arrival? (If any)",
    tooltip: "The red 8-digit number on your US visa stamp.",
    type: "text",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_visa_issue_date",
    pdfKey: "p1_visa_issue_date",
    label: "What date was this Nonimmigrant Visa issued? (mm/dd/yyyy)",
    type: "date",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_last_arrival_city",
    pdfKey: "p1_last_arrival_city",
    label: "What City or Town did you arrive at in the U.S. during your last arrival?",
    type: "text",
    section: "Part 1. Information About You",
  },
  {
    key: "p1_last_arrival_state",
    pdfKey: "p1_last_arrival_state",
    label: "What State did you arrive at in the U.S.?",
    type: "dropdown",
    isState: true,
    section: "Part 1. Information About You",
  },
  {
    key: "p1_last_arrival_date",
    pdfKey: "p1_last_arrival_date",
    label: "What was the Date of your Last Arrival into the U.S.? (mm/dd/yyyy)",
    type: "date",
    section: "Part 1. Information About You",
  },

  // ============================================
  // Item 11. Last Arrival Entry Status
  // ============================================
  {
    key: "p1_arrival_status",
    pdfKey: "_",
    label: "When you last arrived in the United States, how did you enter?",
    tooltip: "Select how you were processed by the border/immigration officer.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      {
        label: "I was inspected at a Port of Entry and admitted",
        value: "Admitted",
        pdfKey: "p1_arrival_status_admitted_cb",
      },
      {
        label: "I was inspected at a Port of Entry and paroled",
        value: "Paroled",
        pdfKey: "p1_arrival_status_paroled_cb",
      },
      {
        label: "I came into the United States without admission or parole",
        value: "WithoutAdmission",
        pdfKey: "p1_arrival_status_without_admission_cb",
      },
      {
        label: "Other",
        value: "Other",
        pdfKey: "p1_arrival_status_other_cb",
      },
    ],
    subQuestions: [
      {
        key: "p1_arrival_admitted_as",
        pdfKey: "p1_arrival_admitted_as",
        label: "What were you admitted as? (e.g., visitor, student, temporary worker)",
        type: "text",
        condition: (d) => d.p1_arrival_status === "Admitted",
      },
      {
        key: "p1_arrival_paroled_as",
        pdfKey: "p1_arrival_paroled_as",
        label: "What were you paroled as? (e.g., humanitarian parole)",
        type: "text",
        condition: (d) => d.p1_arrival_status === "Paroled",
      },
      {
        key: "p1_arrival_status_other_text",
        pdfKey: "p1_arrival_status_other_text",
        label: "Please specify details for Other:",
        type: "text",
        condition: (d) => d.p1_arrival_status === "Other",
      },
    ],
  },

  // ============================================
  // Item 12. Form I-94 Arrival/Departure Record
  // ============================================
  {
    key: "p1_has_i94",
    pdfKey: "_",
    label: "Were you issued a Form I-94 Arrival/Departure Record when you came to the U.S.?",
    tooltip:
      "This is the official travel record given by U.S. border officers when entering the country.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_i94_family_name",
        pdfKey: "p1_i94_family_name",
        label: "Last Name (Family Name) as shown exactly on your Form I-94",
        type: "text",
        condition: (d) => d.p1_has_i94 === "Yes",
      },
      {
        key: "p1_i94_given_name",
        pdfKey: "p1_i94_given_name",
        label: "First Name (Given Name) as shown exactly on your Form I-94",
        type: "text",
        condition: (d) => d.p1_has_i94 === "Yes",
      },
      {
        key: "p1_i94_number",
        pdfKey: "p1_i94_number",
        label: "Form I-94 Arrival/Departure Record Number",
        placeholder: "11-digit number",
        type: "text",
        maxLength: 11,
        condition: (d) => d.p1_has_i94 === "Yes",
      },
      {
        key: "p1_i94_exp_date",
        pdfKey: "p1_i94_exp_date",
        label: "Expiration Date of Authorized Stay Shown on Form I-94 (mm/dd/yyyy or type D/S)",
        type: "text",
        condition: (d) => d.p1_has_i94 === "Yes",
      },
      {
        key: "p1_i94_status",
        pdfKey: "p1_i94_status",
        label: "Immigration Status on Form I-94 (e.g., B2 visitor, F1 student, H1B worker)",
        type: "text",
        condition: (d) => d.p1_has_i94 === "Yes",
      },
    ],
  },

  // ============================================
  // Item 13. First Time Physically Present in US
  // ============================================
  {
    key: "p1_first_time_in_us",
    pdfKey: "_",
    label: "Was your last arrival the first time you were physically present in the United States?",
    tooltip: "Select Yes if you had never visited or lived in the U.S. before this arrival.",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_first_time_in_us_Yes" },
      { label: "No", value: "No", pdfKey: "p1_first_time_in_us_No" },
    ],
  },

  // ============================================
  // Item 14. Current Immigration Status
  // ============================================
  {
    key: "p1_current_immigration_status",
    pdfKey: "p1_current_immigration_status",
    label: "What is your current immigration status? (If it has changed since your last arrival)",
    tooltip: "Enter your current status if it changed after entering the U.S.",
    type: "text",
    section: "Part 1. Information About You",
  },

  // ============================================
  // Item 15. Expiration Date of Current Immigration Status
  // ============================================
  {
    key: "p1_current_status_exp_date",
    pdfKey: "p1_current_status_exp_date",
    label: "Expiration Date of Current Immigration Status (mm/dd/yyyy or type D/S)",
    type: "text",
    section: "Part 1. Information About You",
  },

  // ============================================
  // Item 16. Alien Crewman Visa
  // ============================================
  {
    key: "p1_crewman_visa",
    pdfKey: "_",
    label: "Have you ever been issued an 'alien crewman' visa?",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_crewman_visa_Yes" },
      { label: "No", value: "No", pdfKey: "p1_crewman_visa_No" },
    ],
  },

  // ============================================
  // Item 17. Vessel / Aircraft Crewman Arrival
  // ============================================
  {
    key: "p1_seaman_crewman_arrival",
    pdfKey: "_",
    label:
      "Did you last arrive in the United States to join a vessel as a seaman or crewman, or while serving aboard a vessel or aircraft?",
    type: "radio",
    section: "Part 1. Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_seaman_crewman_arrival_Yes" },
      { label: "No", value: "No", pdfKey: "p1_seaman_crewman_arrival_No" },
    ],
  },

  // ============================================
  // Item 18. Current U.S. Physical Address
  // ============================================
  {
    key: "p1_phys_in_care_of",
    pdfKey: "p1_phys_in_care_of",
    label: "In Care Of Name (if any)",
    tooltip: "Name of the person who lives here, if receiving mail for you.",
    type: "text",
    section: "Current U.S. Physical Address",
  },
  {
    key: "p1_phys_street",
    pdfKey: "p1_phys_street",
    label: "Street Number and Name where you live",
    type: "text",
    section: "Current U.S. Physical Address",
  },
  {
    key: "p1_phys_unit_type",
    pdfKey: "_",
    label: "Do you live in an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Current U.S. Physical Address",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "p1_phys_unit_apt" },
      { label: "Ste.", value: "Ste", pdfKey: "p1_phys_unit_ste" },
      { label: "Flr.", value: "Flr", pdfKey: "p1_phys_unit_flr" },
    ],
  },
  {
    key: "p1_phys_unit_val",
    pdfKey: "p1_phys_unit_val",
    label: "What is your Apartment, Suite, or Floor Number?",
    type: "text",
    section: "Current U.S. Physical Address",
  },
  {
    key: "p1_phys_city",
    pdfKey: "p1_phys_city",
    label: "What City or Town do you live in?",
    type: "text",
    section: "Current U.S. Physical Address",
  },
  {
    key: "p1_phys_state",
    pdfKey: "p1_phys_state",
    label: "What State do you live in?",
    type: "dropdown",
    isState: true,
    section: "Current U.S. Physical Address",
  },
  {
    key: "p1_phys_zip",
    pdfKey: "p1_phys_zip",
    label: "What is your ZIP Code?",
    type: "text",
    section: "Current U.S. Physical Address",
  },
  {
    key: "p1_phys_date_resided_from",
    pdfKey: "p1_phys_date_resided_from",
    label: "When did you first start living at this address? (mm/dd/yyyy)",
    type: "date",
    section: "Current U.S. Physical Address",
  },

  // ============================================
  // Item 18 (Continued). Current Mailing Address
  // ============================================
  {
    key: "p1_is_current_mailing_same",
    pdfKey: "_",
    label: "Is this physical address your current mailing address?",
    tooltip: "Select Yes if you receive your mail at the address where you live.",
    type: "radio",
    section: "Current U.S. Physical Address",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_is_current_mailing_same_Yes" },
      { label: "No", value: "No", pdfKey: "p1_is_current_mailing_same_No" },
    ],
    subQuestions: [
      {
        key: "p1_mail_in_care_of",
        pdfKey: "p1_mail_in_care_of",
        label: "Who receives mail for you at this mailing address? (In Care Of Name)",
        type: "text",
        condition: (d) => d.p1_is_current_mailing_same === "No",
      },
      {
        key: "p1_mail_street",
        pdfKey: "p1_mail_street",
        label: "What is your mailing street address?",
        type: "text",
        condition: (d) => d.p1_is_current_mailing_same === "No",
      },
      {
        key: "p1_mail_unit_type",
        pdfKey: "_",
        label: "Is your mailing address an Apartment, Suite, or Floor?",
        type: "radio",
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "p1_mail_unit_apt" },
          { label: "Ste.", value: "Ste", pdfKey: "p1_mail_unit_ste" },
          { label: "Flr.", value: "Flr", pdfKey: "p1_mail_unit_flr" },
        ],
        condition: (d) => d.p1_is_current_mailing_same === "No",
      },
      {
        key: "p1_mail_unit_val",
        pdfKey: "p1_mail_unit_val",
        label: "What is your mailing Apartment, Suite, or Floor Number?",
        type: "text",
        condition: (d) => d.p1_is_current_mailing_same === "No",
      },
      {
        key: "p1_mail_city",
        pdfKey: "p1_mail_city",
        label: "What City or Town is your mailing address in?",
        type: "text",
        condition: (d) => d.p1_is_current_mailing_same === "No",
      },
      {
        key: "p1_mail_state",
        pdfKey: "p1_mail_state",
        label: "What State is your mailing address in?",
        type: "dropdown",
        isState: true,
        condition: (d) => d.p1_is_current_mailing_same === "No",
      },
      {
        key: "p1_mail_zip",
        pdfKey: "p1_mail_zip",
        label: "What is your mailing address ZIP Code?",
        type: "text",
        condition: (d) => d.p1_is_current_mailing_same === "No",
      },
    ],
  },
  // ============================================
  // Item 18 (Continued). 5-Year Residence & Prior Address
  // ============================================
  {
    key: "p1_resided_5yrs",
    pdfKey: "_",
    label: "Have you lived at your current address for at least 5 years?",
    tooltip: "Select No if you moved to your current home less than 5 years ago.",
    type: "radio",
    section: "Address History & Social Security",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_resided_5yrs_Yes" },
      { label: "No", value: "No", pdfKey: "p1_resided_5yrs_No" },
    ],
  },
  {
    key: "p1_address_count",
    pdfKey: "N/A",
    label:
      "How many other places have you lived in the last 5 years? (excluding your current address)",
    type: "text",
    section: "Address History & Social Security",
    pattern: "[0-9]*",
    inputMode: "numeric",
    maxLength: 2,
    placeholder: "E.g. 1, 2, 3...",
    condition: (d) => d.p1_resided_5yrs === "No",
  },
  {
    key: "p1_prior_address_note",
    pdfKey: "N/A",
    label: "Let's add your first previous address (a place you lived before your current home).",
    type: "hidden",
    section: "Address History & Social Security",
    condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
    subQuestions: [
      {
        key: "p1_prior_in_care_of",
        pdfKey: "p1_prior_in_care_of",
        label: "Who received mail for you at your prior address? (In Care Of Name)",
        type: "text",
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_street",
        pdfKey: "p1_prior_street",
        label: "What was your prior street address?",
        type: "text",
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_unit_type",
        pdfKey: "_",
        label: "Was your prior home an Apartment, Suite, or Floor?",
        type: "radio",
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "p1_prior_unit_apt" },
          { label: "Ste.", value: "Ste", pdfKey: "p1_prior_unit_ste" },
          { label: "Flr.", value: "Flr", pdfKey: "p1_prior_unit_flr" },
        ],
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_unit_val",
        pdfKey: "p1_prior_unit_val",
        label: "What was your prior Apartment, Suite, or Floor Number?",
        type: "text",
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_city",
        pdfKey: "p1_prior_city",
        label: "What City or Town was your prior home in?",
        type: "text",
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_state",
        pdfKey: "p1_prior_state",
        label: "What State was your prior home in? (if in U.S.)",
        type: "dropdown",
        isState: true,
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_zip",
        pdfKey: "p1_prior_zip",
        label: "What was your prior home ZIP Code? (if in U.S.)",
        type: "text",
        condition: (d) =>
          d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1 && !d.p1_prior_postal,
      },
      {
        key: "p1_prior_province",
        pdfKey: "p1_prior_province",
        label: "What Province was your prior home in? (if outside U.S.)",
        type: "text",
        condition: (d) =>
          d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1 && !d.p1_prior_state,
      },
      {
        key: "p1_prior_postal",
        pdfKey: "p1_prior_postal",
        label: "What was your prior home Postal Code? (if outside U.S.)",
        type: "text",
        condition: (d) =>
          d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1 && !d.p1_prior_zip,
      },
      {
        key: "p1_prior_country",
        pdfKey: "p1_prior_country",
        label: "What Country was your prior home in?",
        type: "text",
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_date_from",
        pdfKey: "p1_prior_date_from",
        label: "When did you start living at your prior home? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
      {
        key: "p1_prior_date_to",
        pdfKey: "p1_prior_date_to",
        label: "When did you move out of your prior home? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p1_resided_5yrs === "No" && Number(d.p1_address_count) >= 1,
      },
    ],
  },
  ...generatePriorAddressesFields(2, 8),

  // ============================================
  // Most Recent Address Outside the United States
  // ============================================
  {
    key: "p1_has_foreign_recent_address",
    pdfKey: "_",
    label:
      "Have you ever lived at a physical address outside the United States for more than 1 year?",
    tooltip:
      "Provide your most recent physical address outside the U.S. where you lived for more than 1 year.",
    type: "radio",
    section: "Address History & Social Security",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_foreign_recent_street",
        pdfKey: "p1_foreign_recent_street",
        label: "What was your street address for your most recent home outside the U.S.?",
        type: "text",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_unit_type",
        pdfKey: "_",
        label: "Was this foreign home an Apartment, Suite, or Floor?",
        type: "radio",
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "p1_foreign_recent_unit_apt" },
          { label: "Ste.", value: "Ste", pdfKey: "p1_foreign_recent_unit_ste" },
          { label: "Flr.", value: "Flr", pdfKey: "p1_foreign_recent_unit_flr" },
        ],
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_unit_val",
        pdfKey: "p1_foreign_recent_unit_val",
        label: "What was your Apartment, Suite, or Floor Number outside the U.S.?",
        type: "text",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_city",
        pdfKey: "p1_foreign_recent_city",
        label: "What City or Town did you live in outside the U.S.?",
        type: "text",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_province",
        pdfKey: "p1_foreign_recent_province",
        label: "What Province did you live in outside the U.S.?",
        type: "text",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_postal",
        pdfKey: "p1_foreign_recent_postal",
        label: "What was your Postal Code outside the U.S.?",
        type: "text",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_country",
        pdfKey: "p1_foreign_recent_country",
        label: "What Country did you live in outside the U.S.?",
        type: "text",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_date_from",
        pdfKey: "p1_foreign_recent_date_from",
        label: "When did you start living at this home outside the U.S.? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
      {
        key: "p1_foreign_recent_date_to",
        pdfKey: "p1_foreign_recent_date_to",
        label: "When did you move out of this home outside the U.S.? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p1_has_foreign_recent_address === "Yes",
      },
    ],
  },

  // ============================================
  // Item 19. Social Security Card
  // ============================================
  {
    key: "p1_ssn_issued",
    pdfKey: "_",
    label:
      "Has the Social Security Administration (SSA) ever officially issued a Social Security card to you?",
    tooltip: "Select Yes if you already have a 9-digit U.S. Social Security Number.",
    type: "radio",
    section: "Social Security Card",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p1_ssn_issued_Yes" },
      { label: "No", value: "No", pdfKey: "p1_ssn_issued_No" },
    ],
    subQuestions: [
      {
        key: "p1_ssn_number",
        pdfKey: "p1_ssn_number",
        label: "What is your U.S. Social Security Number (SSN)?",
        placeholder: "9-digit number",
        type: "text",
        maxLength: 9,
        condition: (d) => d.p1_ssn_issued === "Yes",
      },
      {
        key: "p1_want_ssa_card",
        pdfKey: "_",
        label: "Do you want the SSA to issue you a Social Security card?",
        type: "radio",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p1_want_ssa_card_Yes" },
          { label: "No", value: "No", pdfKey: "p1_want_ssa_card_No" },
        ],
        condition: (d) => d.p1_ssn_issued === "No" || d.p1_ssn_issued === "Yes",
      },
      {
        key: "p1_ssa_consent",
        pdfKey: "_",
        label:
          "Consent for Disclosure: Do you authorize disclosure of information from this application to the SSA as required for assigning an SSN and issuing a Social Security Card?",
        type: "radio",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p1_ssa_consent_Yes" },
          { label: "No", value: "No", pdfKey: "p1_ssa_consent_No" },
        ],
        condition: (d) => d.p1_want_ssa_card === "Yes",
      },
    ],
  },

  // ============================================
  // Part 2. Application Type or Filing Category (Page 5)
  // ============================================
  {
    key: "p2_eoir_proceedings",
    pdfKey: "_",
    label:
      "Are you filing for adjustment of status with the Executive Office for Immigration Review (EOIR) while in removal, exclusion, rescission, or deportation proceedings?",
    tooltip: "Select Yes if you are currently in immigration court proceedings.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p2_eoir_proceedings_Yes" },
      { label: "No", value: "No", pdfKey: "p2_eoir_proceedings_No" },
    ],
  },
  {
    key: "p2_underlying_receipt_number",
    pdfKey: "p2_underlying_receipt_number",
    label: "What is the Receipt Number of your underlying petition? (If any)",
    tooltip: "13-character receipt number starting with letters like EAC, WAC, LIN, SRC, IOE.",
    type: "text",
    section: "Part 2. Application Type or Filing Category",
  },
  {
    key: "p2_underlying_priority_date",
    pdfKey: "p2_underlying_priority_date",
    label: "What is the Priority Date from your underlying petition? (mm/dd/yyyy)",
    type: "date",
    section: "Part 2. Application Type or Filing Category",
  },
  {
    key: "p2_applicant_type",
    pdfKey: "_",
    label: "How are you filing this Form I-485?",
    tooltip:
      "Select Principal if you are the main applicant, or Derivative if applying through a spouse or parent.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      {
        label: "Principal Applicant",
        value: "Principal",
        pdfKey: "p2_applicant_type_principal_cb",
      },
      {
        label: "Derivative Applicant (applying through main applicant)",
        value: "Derivative",
        pdfKey: "p2_applicant_type_derivative_cb",
      },
    ],
    subQuestions: [
      {
        key: "p2_principal_family_name",
        pdfKey: "p2_principal_family_name",
        label: "What is the Principal Applicant's Last Name (Family Name)?",
        type: "text",
        condition: (d) => d.p2_applicant_type === "Derivative",
      },
      {
        key: "p2_principal_given_name",
        pdfKey: "p2_principal_given_name",
        label: "What is the Principal Applicant's First Name (Given Name)?",
        type: "text",
        condition: (d) => d.p2_applicant_type === "Derivative",
      },
      {
        key: "p2_principal_middle_name",
        pdfKey: "p2_principal_middle_name",
        label: "What is the Principal Applicant's Middle Name?",
        type: "text",
        condition: (d) => d.p2_applicant_type === "Derivative",
      },
      {
        key: "p2_principal_alien_number",
        pdfKey: "p2_principal_alien_number",
        label: "What is the Principal Applicant's Alien Registration Number (A-Number)?",
        placeholder: "123456789",
        type: "text",
        maxLength: 9,
        condition: (d) => d.p2_applicant_type === "Derivative",
      },
      {
        key: "p2_principal_dob",
        pdfKey: "p2_principal_dob",
        label: "What is the Principal Applicant's Birthday? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p2_applicant_type === "Derivative",
      },
    ],
  },
  {
    key: "p2_family_category",
    pdfKey: "_",
    label: "Which Family-Based category are you applying under?",
    tooltip: "Select the option that matches your family relationship.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      { label: "Spouse of a U.S. Citizen", value: "spouse_usc", pdfKey: "p2_cat_spouse_usc_cb" },
      {
        label: "Unmarried child under 21 years of age of a U.S. citizen",
        value: "child_usc",
        pdfKey: "p2_cat_child_usc_cb",
      },
      {
        label: "Parent of a U.S. citizen (if citizen is at least 21 years of age)",
        value: "parent_usc",
        pdfKey: "p2_cat_parent_usc_cb",
      },
      {
        label: "Fiancé(e) or child of fiancé(e) of a U.S. citizen (K-1/K-2 Nonimmigrant)",
        value: "k1_k2",
        pdfKey: "p2_cat_k1_k2_cb",
      },
      {
        label: "Widow or widower of a U.S. citizen",
        value: "widow_usc",
        pdfKey: "p2_cat_widow_usc_cb",
      },
      {
        label: "Spouse, child, or parent of deceased U.S. active-duty service member (NDAA)",
        value: "ndaa",
        pdfKey: "p2_cat_ndaa_cb",
      },
      {
        label: "Unmarried son or daughter of a U.S. citizen 21 years or older (F1)",
        value: "f1_son_daughter_usc",
        pdfKey: "p2_cat_f1_son_daughter_usc_cb",
      },
      {
        label: "Married son or daughter of a U.S. citizen (F3)",
        value: "f3_married_son_daughter_usc",
        pdfKey: "p2_cat_f3_married_son_daughter_usc_cb",
      },
      {
        label: "Brother or sister of a U.S. citizen at least 21 years old (F4)",
        value: "f4_sibling_usc",
        pdfKey: "p2_cat_f4_sibling_usc_cb",
      },
      {
        label: "Spouse of a lawful permanent resident (F2A)",
        value: "f2a_spouse_lpr",
        pdfKey: "p2_cat_f2a_spouse_lpr_cb",
      },
      {
        label: "Unmarried child under 21 of a lawful permanent resident (F2A)",
        value: "f2a_child_lpr",
        pdfKey: "p2_cat_f2a_child_lpr_cb",
      },
      {
        label: "Unmarried son or daughter 21 or older of a lawful permanent resident (F2B)",
        value: "f2b_son_daughter_lpr",
        pdfKey: "p2_cat_f2b_son_daughter_lpr_cb",
      },
      {
        label: "VAWA self-petitioning spouse of a U.S. citizen or LPR",
        value: "vawa_spouse",
        pdfKey: "p2_cat_vawa_spouse_cb",
      },
      {
        label: "VAWA self-petitioning child of a U.S. citizen or LPR",
        value: "vawa_child",
        pdfKey: "p2_cat_vawa_child_cb",
      },
      {
        label: "VAWA self-petitioning parent of a U.S. citizen (at least 21)",
        value: "vawa_parent",
        pdfKey: "p2_cat_vawa_parent_cb",
      },
    ],
  },

  // ============================================
  // Item 3.b. Employment-Based Categories (Page 6)
  // ============================================
  {
    key: "p2_eb_category",
    pdfKey: "_",
    label: "Which Employment-Based category are you applying under?",
    tooltip:
      "Select your category if applying based on job offer, extraordinary ability, or investment.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      {
        label: "Alien Investor (Form I-526 / Form I-526E)",
        value: "i526",
        pdfKey: "p2_cat_eb_i526_cb",
      },
      {
        label: "Alien of Extraordinary Ability (Form I-140)",
        value: "extraordinary",
        pdfKey: "p2_cat_eb_extraordinary_cb",
      },
      {
        label: "Outstanding Professor or Researcher (Form I-140)",
        value: "professor_researcher",
        pdfKey: "p2_cat_eb_professor_researcher_cb",
      },
      {
        label: "Multinational Executive or Manager (Form I-140)",
        value: "multinational_exec",
        pdfKey: "p2_cat_eb_multinational_exec_cb",
      },
      {
        label: "Member of Professions Holding Advanced Degree or Exceptional Ability (No NIW)",
        value: "advanced_degree",
        pdfKey: "p2_cat_eb_advanced_degree_cb",
      },
      {
        label: "A Professional (requiring at least a bachelor's degree)",
        value: "professional",
        pdfKey: "p2_cat_eb_professional_cb",
      },
      {
        label: "A Skilled Worker (requiring at least 2 years specialized training/experience)",
        value: "skilled_worker",
        pdfKey: "p2_cat_eb_skilled_worker_cb",
      },
      {
        label: "Any Other Worker (requiring less than 2 years training/experience)",
        value: "other_worker",
        pdfKey: "p2_cat_eb_other_worker_cb",
      },
      { label: "National Interest Waiver (NIW)", value: "niw", pdfKey: "p2_cat_eb_niw_cb" },
    ],
  },
  {
    key: "p2_i140_relative_ownership",
    pdfKey: "_",
    label:
      "Did a relative file the associated Form I-140 for you, or does a relative have a 5% or more ownership interest in the business that filed Form I-140 for you?",
    tooltip: "Select Yes if a family member owns 5% or more of the employer filing for you.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      {
        label: "N/A (I am adjusting on the basis of a Form I-140 self-petition)",
        value: "NA",
        pdfKey: "p2_i140_relative_na_cb",
      },
      { label: "No", value: "No", pdfKey: "p2_i140_relative_no_cb" },
      { label: "Yes", value: "Yes", pdfKey: "p2_i140_relative_yes_cb" },
    ],
    subQuestions: [
      {
        key: "p2_relative_relationship",
        pdfKey: "_",
        label: "What is your relationship to this relative?",
        type: "radio",
        condition: (d) => d.p2_i140_relative_ownership === "Yes",
        options: [
          { label: "Father", value: "Father", pdfKey: "p2_relative_type_father_cb" },
          { label: "Mother", value: "Mother", pdfKey: "p2_relative_type_mother_cb" },
          { label: "Child", value: "Child", pdfKey: "p2_relative_type_child_cb" },
          { label: "Adult Son", value: "AdultSon", pdfKey: "p2_relative_type_adult_son_cb" },
          {
            label: "Adult Daughter",
            value: "AdultDaughter",
            pdfKey: "p2_relative_type_adult_daughter_cb",
          },
          { label: "Brother", value: "Brother", pdfKey: "p2_relative_type_brother_cb" },
          { label: "Sister", value: "Sister", pdfKey: "p2_relative_type_sister_cb" },
          { label: "None of These", value: "None", pdfKey: "p2_relative_type_none_cb" },
        ],
      },
      {
        key: "p2_relative_status",
        pdfKey: "_",
        label: "What is the legal status of this relative?",
        type: "radio",
        condition: (d) => d.p2_i140_relative_ownership === "Yes",
        options: [
          { label: "U.S. Citizen", value: "USC", pdfKey: "p2_relative_status_usc_cb" },
          {
            label: "U.S. National",
            value: "USNational",
            pdfKey: "p2_relative_status_us_national_cb",
          },
          { label: "Lawful Permanent Resident", value: "LPR", pdfKey: "p2_relative_status_lpr_cb" },
          { label: "None of These", value: "None", pdfKey: "p2_relative_status_none_cb" },
        ],
      },
    ],
  },

  // ============================================
  // Item 3.c. Special Immigrant Categories (Page 6)
  // ============================================
  {
    key: "p2_special_immigrant_category",
    pdfKey: "_",
    label: "Which Special Immigrant category are you applying under?",
    tooltip: "Select your category if applying as a special immigrant.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      {
        label: "Special Immigrant Juvenile (Form I-360)",
        value: "juvenile",
        pdfKey: "p2_cat_special_juvenile_cb",
      },
      {
        label: "Certain Afghan or Iraqi National (Form I-360 or Form DS-157)",
        value: "afghan_iraqi",
        pdfKey: "p2_cat_special_afghan_iraqi_cb",
      },
      {
        label: "Certain International Broadcaster (Form I-360)",
        value: "broadcaster",
        pdfKey: "p2_cat_special_broadcaster_cb",
      },
      {
        label: "Certain G-4 International Org or NATO-6 Employee / Family Member (Form I-360)",
        value: "g4_nato6",
        pdfKey: "p2_cat_special_g4_nato6_cb",
      },
      {
        label: "Certain U.S. Armed Forces Members (Six and Six program, Form I-360)",
        value: "armed_forces",
        pdfKey: "p2_cat_special_armed_forces_cb",
      },
      {
        label: "Panama Canal Zone Employees (Form I-360)",
        value: "panama_canal",
        pdfKey: "p2_cat_special_panama_canal_cb",
      },
      {
        label: "Certain Physicians (Form I-360)",
        value: "physicians",
        pdfKey: "p2_cat_special_physicians_cb",
      },
      {
        label: "Certain Employee or Former Employee of the U.S. Government Abroad (Form DS-1884)",
        value: "us_govt_abroad",
        pdfKey: "p2_cat_special_us_govt_abroad_cb",
      },
      {
        label: "Religious Worker - Minister of Religion (Form I-360)",
        value: "religious_minister",
        pdfKey: "p2_cat_special_religious_minister_cb",
      },
      {
        label: "Religious Worker - Other Religious Worker (Form I-360)",
        value: "religious_other",
        pdfKey: "p2_cat_special_religious_other_cb",
      },
    ],
  },

  // ============================================
  // Item 3.d. Asylee or Refugee (Page 7)
  // ============================================
  {
    key: "p2_asylee_refugee_category",
    pdfKey: "_",
    label: "Are you applying as an Asylee or Refugee?",
    tooltip: "Select your category if you were granted asylum or refugee status.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      {
        label: "Asylum Status (Form I-589 or Form I-730)",
        value: "asylum",
        pdfKey: "p2_cat_asylum_cb",
      },
      {
        label: "Refugee Status (Form I-590 or Form I-730)",
        value: "refugee",
        pdfKey: "p2_cat_refugee_cb",
      },
    ],
    subQuestions: [
      {
        key: "p2_asylum_granted_date",
        pdfKey: "p2_asylum_granted_date",
        label: "When were you granted asylum? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p2_asylee_refugee_category === "asylum",
      },
      {
        key: "p2_refugee_admission_date",
        pdfKey: "p2_refugee_admission_date",
        label: "When were you initially admitted as a refugee? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p2_asylee_refugee_category === "refugee",
      },
    ],
  },

  // ============================================
  // Item 3.e. Human Trafficking / Crime Victim (Page 7)
  // ============================================
  {
    key: "p2_victim_category",
    pdfKey: "_",
    label: "Are you applying as a Human Trafficking or Crime Victim?",
    tooltip: "Select your category if applying under T or U visa status.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      {
        label: "Human Trafficking Victim (T Nonimmigrant, Form I-914 / I-914A)",
        value: "T_visa",
        pdfKey: "p2_cat_trafficking_t_cb",
      },
      {
        label:
          "Victim of Qualifying Criminal Activity (U Nonimmigrant, Form I-918 / I-918A / I-929)",
        value: "U_visa",
        pdfKey: "p2_cat_crime_u_cb",
      },
    ],
  },

  // ============================================
  // Item 3.f. Special Programs Based on Public Laws (Page 7)
  // ============================================
  {
    key: "p2_special_program_category",
    pdfKey: "_",
    label: "Are you applying under a Special Program based on public laws?",
    tooltip: "Select your category if applying under special public laws.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      { label: "Cuban Adjustment Act", value: "cuban_adj", pdfKey: "p2_cat_cuban_adj_cb" },
      {
        label: "Victim of Battery or Extreme Cruelty under Cuban Adjustment Act",
        value: "cuban_cruelty",
        pdfKey: "p2_cat_cuban_cruelty_cb",
      },
      {
        label: "Dependent under Haitian Refugee Immigrant Fairness Act (HRIFA)",
        value: "haitian_adj",
        pdfKey: "p2_cat_haitian_adj_cb",
      },
      {
        label: "Victim of Battery or Extreme Cruelty under HRIFA",
        value: "haitian_cruelty",
        pdfKey: "p2_cat_haitian_cruelty_cb",
      },
      { label: "Lautenberg Parolees", value: "lautenberg", pdfKey: "p2_cat_lautenberg_cb" },
      {
        label: "Diplomats or High-Ranking Officials Unable to Return Home (Section 13)",
        value: "section13_diplomat",
        pdfKey: "p2_cat_section13_diplomat_cb",
      },
      {
        label: "Nationals of Vietnam, Cambodia, and Laos (Indochinese Parolees)",
        value: "indochinese",
        pdfKey: "p2_cat_indochinese_cb",
      },
      { label: "Amerasian Act (Form I-360)", value: "amerasian", pdfKey: "p2_cat_amerasian_cb" },
    ],
  },

  // ============================================
  // Item 3.g. Additional Options (Page 7)
  // ============================================
  {
    key: "p2_additional_option_category",
    pdfKey: "_",
    label: "Are you applying under any of these additional program options?",
    tooltip: "Select Diversity Visa, Registry, or other special category.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      {
        label: "Diversity Visa Program (Green Card Lottery)",
        value: "DV",
        pdfKey: "p2_cat_dv_program_cb",
      },
      {
        label: "Continuous Residence in U.S. Since Before Jan 1, 1972 ('Registry')",
        value: "registry",
        pdfKey: "p2_cat_registry_1972_cb",
      },
      {
        label: "Individual Born in U.S. Under Diplomatic Status",
        value: "diplomatic_born",
        pdfKey: "p2_cat_us_born_diplomatic_cb",
      },
      {
        label: "S Nonimmigrants and Qualifying Family Members (Form I-854B)",
        value: "s_visa",
        pdfKey: "p2_cat_s_visa_cb",
      },
      {
        label: "Other Eligibility Category",
        value: "other",
        pdfKey: "p2_cat_other_eligibility_cb",
      },
    ],
    subQuestions: [
      {
        key: "p2_dv_rank_number",
        pdfKey: "p2_dv_rank_number",
        label: "What is your Diversity Visa Rank Number?",
        type: "text",
        condition: (d) => d.p2_additional_option_category === "DV",
      },
      {
        key: "p2_other_eligibility_text",
        pdfKey: "p2_other_eligibility_text",
        label: "Please describe your other eligibility category:",
        type: "text",
        condition: (d) => d.p2_additional_option_category === "other",
      },
    ],
  },

  // ============================================
  // Item 4 & Item 5. INA 245(i) & CSPA Questions (Page 7)
  // ============================================
  {
    key: "p2_ina_245i",
    pdfKey: "_",
    label: "Are you applying for adjustment of status based on INA section 245(i)?",
    tooltip:
      "Allows certain individuals who entered without inspection or violated status to adjust status.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p2_ina_245i_Yes" },
      { label: "No", value: "No", pdfKey: "p2_ina_245i_No" },
    ],
  },
  {
    key: "p2_cspa_child",
    pdfKey: "_",
    label:
      "Are you 21 years of age or older and applying for adjustment based on classification as a child under the Child Status Protection Act (CSPA)?",
    tooltip: "Helps prevent aging out if you turned 21 while your petition was pending.",
    type: "radio",
    section: "Part 2. Application Type or Filing Category",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p2_cspa_child_Yes" },
      { label: "No", value: "No", pdfKey: "p2_cspa_child_No" },
    ],
  },

  // ============================================
  // Part 3. Request for Exemption for Affidavit of Support (Page 8)
  // ============================================
  {
    key: "p3_affidavit_exemption",
    pdfKey: "_",
    label:
      "Are you requesting an exemption from submitting an Affidavit of Support Under Section 213A of the INA (Form I-864)?",
    tooltip: "Select the reason why you are exempt from submitting Form I-864.",
    type: "radio",
    section: "Part 3. Request for Exemption for Affidavit of Support",
    options: [
      {
        label:
          "I have earned or can receive credit for 40 qualifying quarters (credits) of work in the United States (SSA)",
        value: "40_quarters",
        pdfKey: "p3_exemption_40_quarters_cb",
      },
      {
        label:
          "I am under 18, unmarried, child of a U.S. citizen, and will automatically become a citizen under INA section 320",
        value: "child_ina320",
        pdfKey: "p3_exemption_child_ina320_cb",
      },
      {
        label: "I am applying under the widow or widower of a U.S. citizen (Form I-360) category",
        value: "widow_usc",
        pdfKey: "p3_exemption_widow_usc_cb",
      },
      {
        label: "I am applying as a VAWA self-petitioner",
        value: "vawa",
        pdfKey: "p3_exemption_vawa_cb",
      },
      {
        label:
          "None of these exemptions apply to me and I am not required by statute to submit Form I-864",
        value: "not_required",
        pdfKey: "p3_exemption_not_required_cb",
      },
      {
        label: "None of these exemptions apply and I will submit Form I-864 (No exemption request)",
        value: "submitting_i864",
        pdfKey: "p3_exemption_none_required_i864_cb",
      },
    ],
  },

  // ============================================
  // Part 4. Additional Information About You (Page 8)
  // ============================================
  {
    key: "p4_applied_visa_abroad",
    pdfKey: "_",
    label:
      "Have you ever applied for an immigrant visa to obtain permanent resident status at a U.S. Embassy or U.S. Consulate abroad?",
    tooltip:
      "Select Yes if you ever submitted a Green Card visa application at a U.S. embassy in another country.",
    type: "radio",
    section: "Part 4. Additional Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p4_applied_visa_abroad_Yes" },
      { label: "No", value: "No", pdfKey: "p4_applied_visa_abroad_No" },
    ],
    subQuestions: [
      {
        key: "p4_visa_consulate_city",
        pdfKey: "p4_visa_consulate_city",
        label: "What City or Town was the U.S. Embassy or Consulate located in?",
        type: "text",
        condition: (d) => d.p4_applied_visa_abroad === "Yes",
      },
      {
        key: "p4_visa_consulate_country",
        pdfKey: "p4_visa_consulate_country",
        label: "What Country was the U.S. Embassy or Consulate located in?",
        type: "text",
        condition: (d) => d.p4_applied_visa_abroad === "Yes",
      },
      {
        key: "p4_visa_decision",
        pdfKey: "p4_visa_decision",
        label:
          "What was the decision on your visa application? (e.g., approved, refused, denied, withdrawn)",
        type: "text",
        condition: (d) => d.p4_applied_visa_abroad === "Yes",
      },
      {
        key: "p4_visa_decision_date",
        pdfKey: "p4_visa_decision_date",
        label: "What was the date of the decision? (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p4_applied_visa_abroad === "Yes",
      },
    ],
  },
  {
    key: "p4_prev_applied_pr_us",
    pdfKey: "_",
    label: "Have you previously applied for permanent residence while inside the United States?",
    type: "radio",
    section: "Part 4. Additional Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p4_prev_applied_pr_us_Yes" },
      { label: "No", value: "No", pdfKey: "p4_prev_applied_pr_us_No" },
    ],
  },
  {
    key: "p4_lpr_rescinded",
    pdfKey: "_",
    label:
      "Have you EVER held lawful permanent resident status which was later rescinded under INA section 246?",
    type: "radio",
    section: "Part 4. Additional Information About You",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p4_lpr_rescinded_Yes" },
      { label: "No", value: "No", pdfKey: "p4_lpr_rescinded_No" },
    ],
  },
  {
    key: "p4_emp1_type",
    pdfKey: "p4_emp1_type",
    label:
      "What type of activity was your current or most recent history? (e.g., Employer, School, Self-Employed, Unemployed)",
    tooltip:
      "Enter whether this entry represents your job/company, school, self-employment, unemployment, or retirement.",
    placeholder: "e.g., Employer, School, Self-Employed, Unemployed",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_name",
    pdfKey: "p4_emp1_name",
    label: "What is the name of your current or most recent Employer, Company, or School?",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_occupation",
    pdfKey: "p4_emp1_occupation",
    label: "What is your Occupation? (If unemployed or retired, please state so)",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_street",
    pdfKey: "p4_emp1_street",
    label: "Employer/School Street Number and Name",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_unit_type",
    pdfKey: "_",
    label: "Is this employer or school address an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Employment & Educational History",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "p4_emp1_unit_apt" },
      { label: "Ste.", value: "Ste", pdfKey: "p4_emp1_unit_ste" },
      { label: "Flr.", value: "Flr", pdfKey: "p4_emp1_unit_flr" },
    ],
  },
  {
    key: "p4_emp1_unit_val",
    pdfKey: "p4_emp1_unit_val",
    label: "Apartment, Suite, or Floor Number",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_city",
    pdfKey: "p4_emp1_city",
    label: "City or Town of Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_state",
    pdfKey: "p4_emp1_state",
    label: "State of Employer/School",
    type: "dropdown",
    isState: true,
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_zip",
    pdfKey: "p4_emp1_zip",
    label: "ZIP Code of Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_province",
    pdfKey: "p4_emp1_province",
    label: "Province (if outside U.S.)",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_postal",
    pdfKey: "p4_emp1_postal",
    label: "Postal Code (if outside U.S.)",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_country",
    pdfKey: "p4_emp1_country",
    label: "Country of Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_date_from",
    pdfKey: "p4_emp1_date_from",
    label: "When did you start working or studying here? (mm/dd/yyyy)",
    type: "date",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_date_to",
    pdfKey: "p4_emp1_date_to",
    label: "When did you finish working or studying here? (mm/dd/yyyy)",
    type: "date",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp1_support_source",
    pdfKey: "p4_emp1_support_source",
    label: "If unemployed or retired, what was your source of financial support?",
    type: "text",
    section: "Employment & Educational History",
  },

  // Foreign Employer / School (Item 8)
  {
    key: "p4_emp2_foreign_name",
    pdfKey: "p4_emp2_foreign_name",
    label: "What was the name of your most recent Employer or School outside the U.S.?",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_occupation",
    pdfKey: "p4_emp2_foreign_occupation",
    label: "What was your Occupation outside the U.S.? (If unemployed or retired, state so)",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_street",
    pdfKey: "p4_emp2_foreign_street",
    label: "Foreign Employer/School Street Number and Name",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_unit_type",
    pdfKey: "_",
    label: "Was this foreign employer/school address an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Employment & Educational History",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "p4_emp2_foreign_unit_apt" },
      { label: "Ste.", value: "Ste", pdfKey: "p4_emp2_foreign_unit_ste" },
      { label: "Flr.", value: "Flr", pdfKey: "p4_emp2_foreign_unit_flr" },
    ],
  },
  {
    key: "p4_emp2_foreign_unit_val",
    pdfKey: "p4_emp2_foreign_unit_val",
    label: "Foreign Unit Number",
    placeholder: "Apt. No., Suite No., Floor No.",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_city",
    pdfKey: "p4_emp2_foreign_city",
    label: "City or Town of Foreign Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_state",
    pdfKey: "p4_emp2_foreign_state",
    label: "State/Region of Foreign Employer/School",
    type: "dropdown",
    isState: true,
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_zip",
    pdfKey: "p4_emp2_foreign_zip",
    label: "ZIP Code of Foreign Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_province",
    pdfKey: "p4_emp2_foreign_province",
    label: "Province of Foreign Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_postal",
    pdfKey: "p4_emp2_foreign_postal",
    label: "Postal Code of Foreign Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_country",
    pdfKey: "p4_emp2_foreign_country",
    label: "Country of Foreign Employer/School",
    type: "text",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_date_from",
    pdfKey: "p4_emp2_foreign_date_from",
    label: "When did you start working or studying at this foreign location? (mm/dd/yyyy)",
    type: "date",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_date_to",
    pdfKey: "p4_emp2_foreign_date_to",
    label: "When did you finish working or studying at this foreign location? (mm/dd/yyyy)",
    type: "date",
    section: "Employment & Educational History",
  },
  {
    key: "p4_emp2_foreign_support_source",
    pdfKey: "p4_emp2_foreign_support_source",
    label: "If unemployed or retired outside the U.S., what was your source of financial support?",
    type: "text",
    section: "Employment & Educational History",
  },

  // ============================================
  // Part 5. Information About Your Parents (Parent 1)
  // ============================================
  {
    key: "p5_parent1_legal_family_name",
    pdfKey: "p5_parent1_legal_family_name",
    label: "What is your Parent 1's Legal Last Name (Family Name)?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent1_legal_given_name",
    pdfKey: "p5_parent1_legal_given_name",
    label: "What is your Parent 1's Legal First Name (Given Name)?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent1_legal_middle_name",
    pdfKey: "p5_parent1_legal_middle_name",
    label: "What is your Parent 1's Legal Middle Name?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent1_birth_family_name",
    pdfKey: "p5_parent1_birth_family_name",
    label: "What was your Parent 1's Last Name at birth? (If different)",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent1_birth_given_name",
    pdfKey: "p5_parent1_birth_given_name",
    label: "What was your Parent 1's First Name at birth? (If different)",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent1_birth_middle_name",
    pdfKey: "p5_parent1_birth_middle_name",
    label: "What was your Parent 1's Middle Name at birth? (If different)",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent1_dob",
    pdfKey: "p5_parent1_dob",
    label: "What is your Parent 1's Birthday? (Date of Birth mm/dd/yyyy)",
    type: "date",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent1_country_of_birth",
    pdfKey: "p5_parent1_country_of_birth",
    label: "What is your Parent 1's Country of Birth?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },

  // Parent 2 Details
  {
    key: "p5_parent2_legal_family_name",
    pdfKey: "p5_parent2_legal_family_name",
    label: "What is your Parent 2's Legal Last Name (Family Name)?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent2_legal_given_name",
    pdfKey: "p5_parent2_legal_given_name",
    label: "What is your Parent 2's Legal First Name (Given Name)?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent2_legal_middle_name",
    pdfKey: "p5_parent2_legal_middle_name",
    label: "What is your Parent 2's Legal Middle Name?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent2_birth_family_name",
    pdfKey: "p5_parent2_birth_family_name",
    label: "What was your Parent 2's Last Name at birth? (If different)",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent2_birth_given_name",
    pdfKey: "p5_parent2_birth_given_name",
    label: "What was your Parent 2's First Name at birth? (If different)",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent2_birth_middle_name",
    pdfKey: "p5_parent2_birth_middle_name",
    label: "What was your Parent 2's Middle Name at birth? (If different)",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent2_dob",
    pdfKey: "p5_parent2_dob",
    label: "What is your Parent 2's Birthday? (Date of Birth mm/dd/yyyy)",
    type: "date",
    section: "Part 5. Information About Your Parents",
  },
  {
    key: "p5_parent2_country_of_birth",
    pdfKey: "p5_parent2_country_of_birth",
    label: "What is your Parent 2's Country of Birth?",
    type: "text",
    section: "Part 5. Information About Your Parents",
  },

  // ============================================
  // Part 6. Information About Your Marital History (Page 10)
  // ============================================
  {
    key: "p6_marital_status",
    pdfKey: "_",
    label: "What is your current marital status?",
    tooltip: "Select your current legal marital status.",
    type: "radio",
    section: "Part 6. Information About Your Marital History",
    options: [
      { label: "Single, Never Married", value: "Single", pdfKey: "p6_marital_single_cb" },
      { label: "Married", value: "Married", pdfKey: "p6_marital_married_cb" },
      { label: "Divorced", value: "Divorced", pdfKey: "p6_marital_divorced_cb" },
      { label: "Widowed", value: "Widowed", pdfKey: "p6_marital_widowed_cb" },
      { label: "Marriage Annulled", value: "Annulled", pdfKey: "p6_marital_annulled_cb" },
      { label: "Legally Separated", value: "LegallySeparated", pdfKey: "p6_marital_separated_cb" },
    ],
  },
  {
    key: "p6_spouse_armed_forces",
    pdfKey: "_",
    label:
      "If you are married, is your spouse a current member of the U.S. Armed Forces or U.S. Coast Guard?",
    type: "radio",
    section: "Part 6. Information About Your Marital History",
    options: [
      { label: "N/A", value: "NA", pdfKey: "p6_spouse_armed_forces_na_cb" },
      { label: "Yes", value: "Yes", pdfKey: "p6_spouse_armed_forces_yes_cb" },
      { label: "No", value: "No", pdfKey: "p6_spouse_armed_forces_no_cb" },
    ],
  },
  {
    key: "p6_times_married",
    pdfKey: "p6_times_married",
    label: "How many times have you been married in your life?",
    tooltip:
      "Include your current marriage, marriages abroad, annulled marriages, and marriages to the same person.",
    type: "text",
    section: "Part 6. Information About Your Marital History",
  },

  // Information About Your Current Marriage
  {
    key: "p6_spouse_legal_family_name",
    pdfKey: "p6_spouse_legal_family_name",
    label: "What is your current spouse's Last Name (Family Name)?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_legal_given_name",
    pdfKey: "p6_spouse_legal_given_name",
    label: "What is your current spouse's First Name (Given Name)?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_legal_middle_name",
    pdfKey: "p6_spouse_legal_middle_name",
    label: "What is your current spouse's Middle Name?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_alien_number",
    pdfKey: "p6_spouse_alien_number",
    label: "What is your current spouse's Alien Registration Number (A-Number)? (If any)",
    placeholder: "123456789",
    type: "text",
    maxLength: 9,
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_dob",
    pdfKey: "p6_spouse_dob",
    label: "What is your current spouse's Birthday? (Date of Birth mm/dd/yyyy)",
    type: "date",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_country_of_birth",
    pdfKey: "p6_spouse_country_of_birth",
    label: "What is your current spouse's Country of Birth?",
    type: "text",
    section: "Information About Your Current Marriage",
  },

  // Current Spouse Physical Address
  {
    key: "p6_spouse_phys_street",
    pdfKey: "p6_spouse_phys_street",
    label: "What is your current spouse's street address(Street Number and Name)?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_phys_unit_type",
    pdfKey: "_",
    label: "Is your spouse's address an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Information About Your Current Marriage",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "p6_spouse_phys_unit_apt" },
      { label: "Ste.", value: "Ste", pdfKey: "p6_spouse_phys_unit_ste" },
      { label: "Flr.", value: "Flr", pdfKey: "p6_spouse_phys_unit_flr" },
    ],
  },
  {
    key: "p6_spouse_phys_unit_val",
    pdfKey: "p6_spouse_phys_unit_val",
    label: "What is your spouse's Apartment, Suite, or Floor Number?",
    placeholder: "Apt. No., Suite No., Floor No.",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_phys_city",
    pdfKey: "p6_spouse_phys_city",
    label: "What City or Town does your spouse live in?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_phys_state",
    pdfKey: "p6_spouse_phys_state",
    label: "What State does your spouse live in?",
    type: "dropdown",
    isState: true,
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_phys_zip",
    pdfKey: "p6_spouse_phys_zip",
    label: "What is your spouse's ZIP Code?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_phys_province",
    pdfKey: "p6_spouse_phys_province",
    label: "Province (if outside U.S.)",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_phys_postal",
    pdfKey: "p6_spouse_phys_postal",
    label: "Postal Code (if outside U.S.)",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_spouse_phys_country",
    pdfKey: "p6_spouse_phys_country",
    label: "What Country does your spouse live in?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_current_marriage_city",
    pdfKey: "p6_current_marriage_city",
    label: "What City or Town were you married to your current spouse in?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_current_marriage_state_province",
    pdfKey: "p6_current_marriage_state_province",
    label: "What State or Province were you married to your current spouse in?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_current_marriage_country",
    pdfKey: "p6_current_marriage_country",
    label: "What Country were you married to your current spouse in?",
    type: "text",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_current_marriage_date",
    pdfKey: "p6_current_marriage_date",
    label: "When were you married to your current spouse? (mm/dd/yyyy)",
    type: "date",
    section: "Information About Your Current Marriage",
  },
  {
    key: "p6_current_spouse_applying_with_you",
    pdfKey: "_",
    label: "Is your current spouse applying for adjustment of status with you?",
    type: "radio",
    section: "Information About Your Current Marriage",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p6_current_spouse_applying_with_you_Yes" },
      { label: "No", value: "No", pdfKey: "p6_current_spouse_applying_with_you_No" },
    ],
  },

  // ============================================
  // Information About Prior Marriages (Page 11)
  // ============================================
  {
    key: "p6_prior_spouse1_family_name",
    pdfKey: "p6_prior_spouse1_family_name",
    label: "What was your prior spouse's Last Name (Family Name before marriage)?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_given_name",
    pdfKey: "p6_prior_spouse1_given_name",
    label: "What was your prior spouse's First Name (Given Name)?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_middle_name",
    pdfKey: "p6_prior_spouse1_middle_name",
    label: "What was your prior spouse's Middle Name?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_dob",
    pdfKey: "p6_prior_spouse1_dob",
    label: "What is your prior spouse's Birthday? (Date of Birth mm/dd/yyyy)",
    type: "date",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_country_of_birth",
    pdfKey: "p6_prior_spouse1_country_of_birth",
    label: "What is your prior spouse's Country of Birth?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_citizenship",
    pdfKey: "p6_prior_spouse1_citizenship",
    label: "What is your prior spouse's Country of Citizenship or Nationality?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_marriage_date",
    pdfKey: "p6_prior_spouse1_marriage_date",
    label: "When were you married to your prior spouse? (mm/dd/yyyy)",
    type: "date",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_marriage_city",
    pdfKey: "p6_prior_spouse1_marriage_city",
    label: "What City or Town were you married to your prior spouse in?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_marriage_state_province",
    pdfKey: "p6_prior_spouse1_marriage_state_province",
    label: "What State or Province were you married to your prior spouse in?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_marriage_country",
    pdfKey: "p6_prior_spouse1_marriage_country",
    label: "What Country were you married to your prior spouse in?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_ended_city",
    pdfKey: "p6_prior_spouse1_ended_city",
    label: "What City or Town did your marriage with your prior spouse legally end in?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_ended_state_province",
    pdfKey: "p6_prior_spouse1_ended_state_province",
    label: "What State or Province did your marriage with your prior spouse legally end in?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_ended_country",
    pdfKey: "p6_prior_spouse1_ended_country",
    label: "What Country did your marriage with your prior spouse legally end in?",
    type: "text",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_ended_date",
    pdfKey: "p6_prior_spouse1_ended_date",
    label: "When did your marriage with your prior spouse legally end? (mm/dd/yyyy)",
    type: "date",
    section: "Information About Prior Marriages",
  },
  {
    key: "p6_prior_spouse1_how_ended",
    pdfKey: "_",
    label: "How did your marriage with your prior spouse legally end?",
    type: "radio",
    section: "Information About Prior Marriages",
    options: [
      { label: "Annulled", value: "Annulled", pdfKey: "p6_prior_spouse1_how_ended_annulled_cb" },
      { label: "Divorced", value: "Divorced", pdfKey: "p6_prior_spouse1_how_ended_divorced_cb" },
      {
        label: "Spouse Deceased",
        value: "SpouseDeceased",
        pdfKey: "p6_prior_spouse1_how_ended_deceased_cb",
      },
      { label: "Other", value: "Other", pdfKey: "p6_prior_spouse1_how_ended_other_cb" },
    ],
    subQuestions: [
      {
        key: "p6_prior_spouse1_how_ended_other_text",
        pdfKey: "p6_prior_spouse1_how_ended_other_text",
        label: "Please explain how your marriage with your prior spouse ended:",
        type: "text",
        condition: (d) => d.p6_prior_spouse1_how_ended === "Other",
      },
    ],
  },

  // ============================================
  // Part 7. Information About Your Children (Page 12)
  // ============================================
  {
    key: "p7_total_children_count",
    pdfKey: "p7_total_children_count",
    label: "How many living children do you have in total anywhere in the world?",
    tooltip:
      "Includes all biological or legally adopted children, and current stepchildren of any age, whether born in the United States or other countries, married or unmarried, living with you or elsewhere and includes any missing children and those born to you outside of marriage.",
    type: "text",
    section: "Part 7. Information About Your Children",
  },

  // Child 1 Details
  {
    key: "p7_child1_family_name",
    pdfKey: "p7_child1_family_name",
    label: "What is your Child 1's Legal Last Name (Family Name)?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child1_given_name",
    pdfKey: "p7_child1_given_name",
    label: "What is your Child 1's Legal First Name (Given Name)?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child1_middle_name",
    pdfKey: "p7_child1_middle_name",
    label: "What is your Child 1's Legal Middle Name?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child1_alien_number",
    pdfKey: "p7_child1_alien_number",
    label: "What is your Child 1's Alien Registration Number (A-Number)? (If any)",
    placeholder: "123456789",
    type: "text",
    maxLength: 9,
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child1_dob",
    pdfKey: "p7_child1_dob",
    label: "What is your Child 1's Birthday? (Date of Birth mm/dd/yyyy)",
    type: "date",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child1_country_of_birth",
    pdfKey: "p7_child1_country_of_birth",
    label: "What is your Child 1's Country of Birth?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child1_relationship",
    pdfKey: "p7_child1_relationship",
    label:
      "What is your Child 1's relationship to you? (e.g., biological child, stepchild, legally adopted child)",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child1_applying_with_you",
    pdfKey: "_",
    label: "Is Child 1 also applying now on a separate Form I-485?",
    type: "radio",
    section: "Part 7. Information About Your Children",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p7_child1_applying_with_you_Yes" },
      { label: "No", value: "No", pdfKey: "p7_child1_applying_with_you_No" },
    ],
  },

  // Child 2 Details
  {
    key: "p7_child2_family_name",
    pdfKey: "p7_child2_family_name",
    label: "What is your Child 2's Legal Last Name (Family Name)?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child2_given_name",
    pdfKey: "p7_child2_given_name",
    label: "What is your Child 2's Legal First Name (Given Name)?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child2_middle_name",
    pdfKey: "p7_child2_middle_name",
    label: "What is your Child 2's Legal Middle Name?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child2_alien_number",
    pdfKey: "p7_child2_alien_number",
    label: "What is your Child 2's Alien Registration Number (A-Number)? (If any)",
    placeholder: "123456789",
    type: "text",
    maxLength: 9,
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child2_dob",
    pdfKey: "p7_child2_dob",
    label: "What is your Child 2's Birthday? (Date of Birth mm/dd/yyyy)",
    type: "date",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child2_country_of_birth",
    pdfKey: "p7_child2_country_of_birth",
    label: "What is your Child 2's Country of Birth?",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child2_relationship",
    pdfKey: "p7_child2_relationship",
    label:
      "What is your Child 2's relationship to you? (e.g., biological child, stepchild, legally adopted child)",
    type: "text",
    section: "Part 7. Information About Your Children",
  },
  {
    key: "p7_child2_applying_with_you",
    pdfKey: "_",
    label: "Is Child 2 also applying now on a separate Form I-485?",
    type: "radio",
    section: "Part 7. Information About Your Children",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p7_child2_applying_with_you_Yes" },
      { label: "No", value: "No", pdfKey: "p7_child2_applying_with_you_No" },
    ],
  },

  // ============================================
  // Part 8. Biographic Information (Page 13)
  // ============================================
  {
    key: "p8_ethnicity",
    pdfKey: "_",
    label: "What is your ethnicity?",
    type: "radio",
    section: "Part 8. Biographic Information",
    options: [
      { label: "Hispanic or Latino", value: "Hispanic", pdfKey: "p8_ethnicity_hispanic_cb" },
      {
        label: "Not Hispanic or Latino",
        value: "NotHispanic",
        pdfKey: "p8_ethnicity_not_hispanic_cb",
      },
    ],
  },
  {
    key: "p8_race",
    pdfKey: "_",
    label: "What is your race?",
    tooltip: "Select all applicable races.",
    type: "radio",
    section: "Part 8. Biographic Information",
    options: [
      {
        label: "American Indian or Alaska Native",
        value: "AmericanIndian",
        pdfKey: "p8_race_american_indian_cb",
      },
      { label: "Asian", value: "Asian", pdfKey: "p8_race_asian_cb" },
      { label: "Black or African American", value: "Black", pdfKey: "p8_race_black_cb" },
      {
        label: "Native Hawaiian or Other Pacific Islander",
        value: "Hawaiian",
        pdfKey: "p8_race_hawaiian_cb",
      },
      { label: "White", value: "White", pdfKey: "p8_race_white_cb" },
    ],
  },
  {
    key: "p8_height_feet",
    pdfKey: "p8_height_feet",
    label: "How tall are you? (Height in Feet)",
    type: "text",
    section: "Part 8. Biographic Information",
  },
  {
    key: "p8_height_inches",
    pdfKey: "p8_height_inches",
    label: "How tall are you? (Height in Inches)",
    type: "text",
    section: "Part 8. Biographic Information",
  },
  {
    key: "p8_weight_pounds",
    pdfKey: "p8_weight_digit1",
    label: "How much do you weigh in pounds?",
    placeholder: "e.g., 150",
    type: "text",
    section: "Part 8. Biographic Information",
  },
  {
    key: "p8_eye_color",
    pdfKey: "_",
    label: "What is your eye color?",
    type: "radio",
    section: "Part 8. Biographic Information",
    options: [
      { label: "Black", value: "Black", pdfKey: "p8_eye_black_cb" },
      { label: "Blue", value: "Blue", pdfKey: "p8_eye_blue_cb" },
      { label: "Brown", value: "Brown", pdfKey: "p8_eye_brown_cb" },
      { label: "Gray", value: "Gray", pdfKey: "p8_eye_gray_cb" },
      { label: "Green", value: "Green", pdfKey: "p8_eye_green_cb" },
      { label: "Hazel", value: "Hazel", pdfKey: "p8_eye_hazel_cb" },
      { label: "Maroon", value: "Maroon", pdfKey: "p8_eye_maroon_cb" },
      { label: "Pink", value: "Pink", pdfKey: "p8_eye_pink_cb" },
      { label: "Unknown / Other", value: "Other", pdfKey: "p8_eye_other_cb" },
    ],
  },
  {
    key: "p8_hair_color",
    pdfKey: "_",
    label: "What is your hair color?",
    type: "radio",
    section: "Part 8. Biographic Information",
    options: [
      { label: "Bald (No hair)", value: "Bald", pdfKey: "p8_hair_bald_cb" },
      { label: "Black", value: "Black", pdfKey: "p8_hair_black_cb" },
      { label: "Blond", value: "Blond", pdfKey: "p8_hair_blond_cb" },
      { label: "Brown", value: "Brown", pdfKey: "p8_hair_brown_cb" },
      { label: "Gray", value: "Gray", pdfKey: "p8_hair_gray_cb" },
      { label: "Red", value: "Red", pdfKey: "p8_hair_red_cb" },
      { label: "Sandy", value: "Sandy", pdfKey: "p8_hair_sandy_cb" },
      { label: "White", value: "White", pdfKey: "p8_hair_white_cb" },
      { label: "Unknown / Other", value: "Other", pdfKey: "p8_hair_other_cb" },
    ],
  },

  // ============================================
  // Part 9. General Eligibility and Inadmissibility Grounds (Page 13)
  // ============================================
  {
    key: "p9_associated_organizations",
    pdfKey: "_",
    label:
      "Have you EVER been a member of, involved in, or associated with any organization, association, fund, foundation, party, club, society, or similar group anywhere in the world?",
    tooltip:
      "Select Yes if you have ever belonged to any club, society, political party, or organization.",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_associated_organizations_Yes" },
      { label: "No", value: "No", pdfKey: "p9_associated_organizations_No" },
    ],
    subQuestions: [
      {
        key: "p9_org1_name",
        pdfKey: "p9_org1_name",
        label: "Organization 1 - Name of Organization",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org1_city",
        pdfKey: "p9_org1_city",
        label: "Organization 1 - City or Town",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org1_state_province",
        pdfKey: "p9_org1_state_province",
        label: "Organization 1 - State or Province",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org1_country",
        pdfKey: "p9_org1_country",
        label: "Organization 1 - Country",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org1_nature",
        pdfKey: "p9_org1_nature",
        label: "Organization 1 - What does this group do? (What are its goals and activities?)",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org1_involvement",
        pdfKey: "p9_org1_involvement",
        label: "Organization 1 - What was your role or job in this group?",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org1_date_from",
        pdfKey: "p9_org1_date_from",
        label: "Organization 1 - Date From (mm/dd/yyyy)",
        tooltip: "Date of Membership or Dates of Involvement",
        type: "date",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org1_date_to",
        pdfKey: "p9_org1_date_to",
        label: "Organization 1 - Date To (mm/dd/yyyy)",
        tooltip: "Ending Date of Membership or Date of Involvement",
        type: "date",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_name",
        pdfKey: "p9_org2_name",
        label: "Organization 2 - Name of Organization",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_city",
        pdfKey: "p9_org2_city",
        label: "Organization 2 - City or Town",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_state_province",
        pdfKey: "p9_org2_state_province",
        label: "Organization 2 - State or Province",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_country",
        pdfKey: "p9_org2_country",
        label: "Organization 2 - Country",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_nature",
        pdfKey: "p9_org2_nature",
        label: "Organization 2 - What does this group do? (What are its goals and activities?)",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_involvement",
        pdfKey: "p9_org2_involvement",
        label: "Organization 2 - What was your role or job in this group?",
        type: "text",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_date_from",
        pdfKey: "p9_org2_date_from",
        label: "Organization 2 - Date From (mm/dd/yyyy)",
        tooltip: "Date of Membership or Dates of Involvement",
        type: "date",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
      {
        key: "p9_org2_date_to",
        pdfKey: "p9_org2_date_to",
        label: "Organization 2 - Date To (mm/dd/yyyy)",
        tooltip: "End Date of Membership or Date of Involvement",
        type: "date",
        condition: (d) => d.p9_associated_organizations === "Yes",
      },
    ],
  },

  // Part 9 General Eligibility Questions 10-22 (Page 14)
  {
    key: "p9_denied_admission",
    pdfKey: "_",
    label: "Have you EVER been denied admission to the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_denied_admission_Yes" },
      { label: "No", value: "No", pdfKey: "p9_denied_admission_No" },
    ],
  },
  {
    key: "p9_denied_visa",
    pdfKey: "_",
    label: "Have you EVER been denied a visa to the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_denied_visa_Yes" },
      { label: "No", value: "No", pdfKey: "p9_denied_visa_No" },
    ],
  },
  {
    key: "p9_worked_unauthorized",
    pdfKey: "_",
    label: "Have you EVER worked in the United States without authorization?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_worked_unauthorized_Yes" },
      { label: "No", value: "No", pdfKey: "p9_worked_unauthorized_No" },
    ],
  },
  {
    key: "p9_violated_status_terms",
    pdfKey: "_",
    label: "Have you EVER violated the terms or conditions of your nonimmigrant status?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_violated_status_terms_Yes" },
      { label: "No", value: "No", pdfKey: "p9_violated_status_terms_No" },
    ],
  },
  {
    key: "p9_in_deportation_proceedings",
    pdfKey: "_",
    label:
      "Are you now, or have you EVER been, in deportation or removal proceedings to make you leave the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_in_deportation_proceedings_Yes" },
      { label: "No", value: "No", pdfKey: "p9_in_deportation_proceedings_No" },
    ],
  },
  {
    key: "p9_final_order_deportation",
    pdfKey: "_",
    label:
      "Have you EVER been given a final official order by a judge or officer to be deported or removed from the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_final_order_deportation_Yes" },
      { label: "No", value: "No", pdfKey: "p9_final_order_deportation_No" },
    ],
  },
  {
    key: "p9_order_reinstated",
    pdfKey: "_",
    label:
      "Have you EVER had a past deportation or removal order brought back (reinstated) against you?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_order_reinstated_Yes" },
      { label: "No", value: "No", pdfKey: "p9_order_reinstated_No" },
    ],
  },
  {
    key: "p9_failed_voluntary_departure",
    pdfKey: "_",
    label:
      "Have you EVER been allowed to leave the United States voluntarily by an immigration judge or officer, but you did not leave in time?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_failed_voluntary_departure_Yes" },
      { label: "No", value: "No", pdfKey: "p9_failed_voluntary_departure_No" },
    ],
  },
  {
    key: "p9_applied_deportation_relief",
    pdfKey: "_",
    label:
      "Have you EVER applied for any kind of relief or protection from removal, exclusion, or deportation?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_applied_deportation_relief_Yes" },
      { label: "No", value: "No", pdfKey: "p9_applied_deportation_relief_No" },
    ],
  },
  {
    key: "p9_j_exchange_subject_2yr",
    pdfKey: "_",
    label:
      "Have you EVER been a J nonimmigrant exchange visitor who was subject to the two-year foreign residence requirement?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_j_exchange_subject_2yr_Yes" },
      { label: "No", value: "No", pdfKey: "p9_j_exchange_subject_2yr_No" },
    ],
    subQuestions: [
      {
        key: "p9_j_exchange_complied_2yr",
        pdfKey: "_",
        label: "If you answered 'Yes', have you complied with the foreign residence requirement?",
        type: "radio",
        condition: (d) => d.p9_j_exchange_subject_2yr === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_j_exchange_complied_2yr_Yes" },
          { label: "No", value: "No", pdfKey: "p9_j_exchange_complied_2yr_No" },
        ],
      },
      {
        key: "p9_j_exchange_waiver_granted",
        pdfKey: "_",
        label:
          "If you answered 'No' to complying with the foreign residence requirement, have you been granted a waiver or received a favorable waiver recommendation letter?",
        type: "radio",
        condition: (d) =>
          d.p9_j_exchange_subject_2yr === "Yes" && d.p9_j_exchange_complied_2yr === "No",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_j_exchange_waiver_granted_Yes" },
          { label: "No", value: "No", pdfKey: "p9_j_exchange_waiver_granted_No" },
        ],
      },
    ],
  },

  // Criminal Acts and Violations (Instructions notice)
  {
    key: "p9_criminal_instructions_info",
    pdfKey: "_",
    label:
      "Important Notice Regarding Criminal History: For questions 22 to 41, you must answer Yes if any question applies to you—even if your records were sealed or cleared, or even if anyone (including a judge, law enforcement officer, or attorney) told you that you no longer have a record.",
    type: "hidden",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
  },
  {
    key: "p9_arrested_cited_charged",
    pdfKey: "_",
    label:
      "Have you EVER been arrested, cited, charged, or permitted to participate in a diversion program (including pre-trial diversion, deferred prosecution, deferred adjudication, or any withheld adjudication), or detained for any reason by any law enforcement official in any country?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_arrested_cited_charged_Yes" },
      { label: "No", value: "No", pdfKey: "p9_arrested_cited_charged_No" },
    ],
  },
  {
    key: "p9_committed_crime",
    pdfKey: "_",
    label:
      "Have you EVER committed a crime of any kind (even if you were not arrested, cited, charged with, or tried for that crime, or convicted)?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_committed_crime_Yes" },
      { label: "No", value: "No", pdfKey: "p9_committed_crime_No" },
    ],
  },
  {
    key: "p9_pled_guilty_convicted",
    pdfKey: "_",
    label:
      "Have you EVER pled guilty to or been convicted of a crime or offense (even if the violation was expunged, sealed, or pardoned)?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_pled_guilty_convicted_Yes" },
      { label: "No", value: "No", pdfKey: "p9_pled_guilty_convicted_No" },
    ],
  },
  {
    key: "p9_clemency_note",
    pdfKey: "_",
    label:
      "NOTE: If you were the beneficiary of a pardon, amnesty, a rehabilitation decree, or other act of clemency, provide documentation of that post-conviction action.",
    type: "hidden",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
  },

  {
    key: "p9_punished_by_judge",
    pdfKey: "_",
    label:
      "Have you EVER been ordered punished by a judge or had conditions imposed on you that restrained your liberty (such as a prison sentence, suspended sentence, house arrest, parole, probation, or community service)?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_punished_by_judge_Yes" },
      { label: "No", value: "No", pdfKey: "p9_punished_by_judge_No" },
    ],
  },
  {
    key: "p9_violated_controlled_substance",
    pdfKey: "_",
    label:
      "Have you EVER violated (or attempted or conspired to violate) any controlled substance law or regulation of a state, the U.S., or a foreign country?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_violated_controlled_substance_Yes" },
      { label: "No", value: "No", pdfKey: "p9_violated_controlled_substance_No" },
    ],
  },
  {
    key: "p9_trafficked_controlled_substance",
    pdfKey: "_",
    label:
      "Have you EVER trafficked in or benefited from, or knowingly aided, assisted, or colluded in the illegal trafficking of any controlled substances?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_trafficked_controlled_substance_Yes" },
      { label: "No", value: "No", pdfKey: "p9_trafficked_controlled_substance_No" },
    ],
  },
  {
    key: "p9_trafficker_relative_benefit",
    pdfKey: "_",
    label:
      "Are you the spouse, son, or daughter of an alien who illicitly trafficked controlled substances and you obtained, within the last 5 years, any financial or other benefit from this activity?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_trafficker_relative_benefit_Yes" },
      { label: "No", value: "No", pdfKey: "p9_trafficker_relative_benefit_No" },
    ],
    subQuestions: [
      {
        key: "p9_knew_benefit_trafficking",
        pdfKey: "_",
        label:
          "If your answer is 'Yes', did you know or should you have reasonably known that the financial or other benefit you obtained resulted from this activity?",
        type: "radio",
        condition: (d) => d.p9_trafficker_relative_benefit === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_knew_benefit_trafficking_Yes" },
          { label: "No", value: "No", pdfKey: "p9_knew_benefit_trafficking_No" },
        ],
      },
    ],
  },
  {
    key: "p9_engaged_prostitution",
    pdfKey: "_",
    label:
      "Have you EVER engaged in prostitution or are you coming to the United States to engage in prostitution?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_engaged_prostitution_Yes" },
      { label: "No", value: "No", pdfKey: "p9_engaged_prostitution_No" },
    ],
  },
  {
    key: "p9_procured_prostitutes",
    pdfKey: "_",
    label:
      "Have you EVER directly or indirectly procured or attempted to procure, or imported prostitutes or persons for the purpose of prostitution?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_procured_prostitutes_Yes" },
      { label: "No", value: "No", pdfKey: "p9_procured_prostitutes_No" },
    ],
  },
  {
    key: "p9_received_prostitution_proceeds",
    pdfKey: "_",
    label: "Have you EVER received any proceeds or money from prostitution?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_received_prostitution_proceeds_Yes" },
      { label: "No", value: "No", pdfKey: "p9_received_prostitution_proceeds_No" },
    ],
  },
  {
    key: "p9_intend_illegal_vice",
    pdfKey: "_",
    label:
      "Do you intend to engage in illegal gambling or any other form of commercialized vice while in the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_intend_illegal_vice_Yes" },
      { label: "No", value: "No", pdfKey: "p9_intend_illegal_vice_No" },
    ],
  },
  {
    key: "p9_exercised_immunity",
    pdfKey: "_",
    label:
      "Have you EVER exercised immunity (diplomatic or otherwise) to avoid being prosecuted for a criminal offense in the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_exercised_immunity_Yes" },
      { label: "No", value: "No", pdfKey: "p9_exercised_immunity_No" },
    ],
  },
  {
    key: "p9_foreign_govt_official",
    pdfKey: "_",
    label: "Have you EVER served as a foreign government official?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_foreign_govt_official_Yes" },
      { label: "No", value: "No", pdfKey: "p9_foreign_govt_official_No" },
    ],
    subQuestions: [
      {
        key: "p9_religious_freedom_violations",
        pdfKey: "_",
        label:
          "If your answer is 'Yes', have you EVER been responsible for, enforced, or directly carried out violations of religious freedoms?",
        type: "radio",
        condition: (d) => d.p9_foreign_govt_official === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_religious_freedom_violations_Yes" },
          { label: "No", value: "No", pdfKey: "p9_religious_freedom_violations_No" },
        ],
      },
    ],
  },
  {
    key: "p9_sex_trafficking",
    pdfKey: "_",
    label:
      "Have you EVER induced by force, fraud, or coercion (or otherwise been involved in) the trafficking of another person for commercial sex acts (sex trafficking)?",
    tooltip:
      "NOTE: Sex trafficking involves inducing or causing an adult to engage in a commercial sex act (any sex act performed for anything of value) through fraud, force, or coercion, or inducing or causing any person under 18 years of age to engage in a commercial sex act (even without force, fraud, or coercion). Sex trafficking may include recruiting, enticing, harboring, transporting, providing, obtaining, advertising, maintaining, patronizing, or soliciting by any means a person to engage in the commercial sex act knowing (or, in the case of advertising, with reckless disregard of the fact) that the person is under 18 years of age or that force, fraud, or coercion was used to induce or cause the person to engage in the commercial sex act. Sex trafficking may also include knowingly benefiting financially or by receiving anything of value, from participation in a venture involving sex trafficking.",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_sex_trafficking_Yes" },
      { label: "No", value: "No", pdfKey: "p9_sex_trafficking_No" },
    ],
  },
  {
    key: "p9_involuntary_servitude_slavery",
    pdfKey: "_",
    label:
      "Have you EVER trafficked a person into involuntary servitude, peonage, debt bondage, or slavery?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_involuntary_servitude_slavery_Yes" },
      { label: "No", value: "No", pdfKey: "p9_involuntary_servitude_slavery_No" },
    ],
  },
  {
    key: "p9_assisted_trafficking_persons",
    pdfKey: "_",
    label:
      "Have you EVER knowingly aided, abetted, assisted, conspired, or colluded with others in trafficking in persons for commercial sex acts or involuntary servitude, peonage, debt bondage, or slavery?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_assisted_trafficking_persons_Yes" },
      { label: "No", value: "No", pdfKey: "p9_assisted_trafficking_persons_No" },
    ],
  },
  {
    key: "p9_human_trafficker_relative_benefit",
    pdfKey: "_",
    label:
      "Are you the spouse, son, or daughter of an alien who engaged in trafficking in persons and have received or obtained, within the last 5 years, any financial or other benefits from this activity?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_human_trafficker_relative_benefit_Yes" },
      { label: "No", value: "No", pdfKey: "p9_human_trafficker_relative_benefit_No" },
    ],
    subQuestions: [
      {
        key: "p9_knew_benefit_human_trafficking",
        pdfKey: "_",
        label:
          "If your answer is 'Yes', did you know or reasonably should have known that this benefit resulted from this activity?",
        type: "radio",
        condition: (d) => d.p9_human_trafficker_relative_benefit === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_knew_benefit_human_trafficking_Yes" },
          { label: "No", value: "No", pdfKey: "p9_knew_benefit_human_trafficking_No" },
        ],
      },
    ],
  },
  {
    key: "p9_money_laundering",
    pdfKey: "_",
    label:
      "Have you EVER engaged in money laundering or have you EVER knowingly aided, assisted, abetted, conspired, or colluded with others in money laundering or do you seek to enter the U.S. to engage in such activity?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_money_laundering_Yes" },
      { label: "No", value: "No", pdfKey: "p9_money_laundering_No" },
    ],
  },
  {
    key: "p9_espionage_sabotage",
    pdfKey: "_",
    label:
      "Do you intend to engage in any activity that violates or evades any law relating to espionage (including spying) or sabotage in the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_espionage_sabotage_Yes" },
      { label: "No", value: "No", pdfKey: "p9_espionage_sabotage_No" },
    ],
  },
  {
    key: "p9_export_laws_violation",
    pdfKey: "_",
    label:
      "Do you intend to engage in any activity in the United States that violates or evades any law prohibiting the export of goods, technology, or sensitive information?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_export_laws_violation_Yes" },
      { label: "No", value: "No", pdfKey: "p9_export_laws_violation_No" },
    ],
  },
  {
    key: "p9_overthrow_govt_force",
    pdfKey: "_",
    label:
      "Do you intend to engage in any activity whose purpose includes opposing, controlling, or overthrowing the U.S. Government by force, violence, or other unlawful means?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_overthrow_govt_force_Yes" },
      { label: "No", value: "No", pdfKey: "p9_overthrow_govt_force_No" },
    ],
  },
  {
    key: "p9_other_unlawful_activity",
    pdfKey: "_",
    label: "Do you intend to engage in any other unlawful activity?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_other_unlawful_activity_Yes" },
      { label: "No", value: "No", pdfKey: "p9_other_unlawful_activity_No" },
    ],
  },
  {
    key: "p9_weapons_paramilitary_training",
    pdfKey: "_",
    label:
      "Have you EVER received any weapons training, paramilitary training, or other military-type training?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_weapons_paramilitary_training_Yes" },
      { label: "No", value: "No", pdfKey: "p9_weapons_paramilitary_training_No" },
    ],
  },
  {
    key: "p9_kidnapping_assassination_hijacking",
    pdfKey: "_",
    label:
      "Have you EVER committed kidnapping, assassination, or hijacking or sabotage of a conveyance (aircraft, vessel, vehicle, or train)?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_kidnapping_assassination_hijacking_Yes" },
      { label: "No", value: "No", pdfKey: "p9_kidnapping_assassination_hijacking_No" },
    ],
  },
  {
    key: "p9_used_weapon_explosive_danger",
    pdfKey: "_",
    label:
      "Have you EVER used a weapon or explosive or any dangerous device with the intent to endanger the safety of another person or cause damage to property?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_used_weapon_explosive_danger_Yes" },
      { label: "No", value: "No", pdfKey: "p9_used_weapon_explosive_danger_No" },
    ],
  },
  {
    key: "p9_planned_kidnapping_weapon_acts",
    pdfKey: "_",
    label:
      "Have you EVER threatened, attempted, conspired, prepared, or planned to do any of the things described in Items 43.b - 43.c?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_planned_kidnapping_weapon_acts_Yes" },
      { label: "No", value: "No", pdfKey: "p9_planned_kidnapping_weapon_acts_No" },
    ],
  },
  {
    key: "p9_incited_death_harm_acts",
    pdfKey: "_",
    label:
      "Have you EVER incited, under circumstances indicating an intention to cause death or serious bodily harm, any of the activities described in Items 43.b - 43.c?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_incited_death_harm_acts_Yes" },
      { label: "No", value: "No", pdfKey: "p9_incited_death_harm_acts_No" },
    ],
  },
  {
    key: "p9_member_group_violent_acts",
    pdfKey: "_",
    label:
      "Have you EVER participated in, or been a member of, a group or organization that did any of the activities described in Items 43.b - 43.e?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_member_group_violent_acts_Yes" },
      { label: "No", value: "No", pdfKey: "p9_member_group_violent_acts_No" },
    ],
  },
  {
    key: "p9_recruited_solicited_violent_group",
    pdfKey: "_",
    label:
      "Have you EVER recruited members or asked for money or things of value for a group or organization that did any of the activities described in Items 43.b - 43.e?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_recruited_solicited_violent_group_Yes" },
      { label: "No", value: "No", pdfKey: "p9_recruited_solicited_violent_group_No" },
    ],
  },
  {
    key: "p9_provided_support_violent_activities",
    pdfKey: "_",
    label:
      "Have you EVER provided money, a thing of value, services, or support for any of the activities described in Items 43.b - 43.e?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_provided_support_violent_activities_Yes" },
      { label: "No", value: "No", pdfKey: "p9_provided_support_violent_activities_No" },
    ],
  },
  {
    key: "p9_provided_support_violent_group",
    pdfKey: "_",
    label:
      "Have you EVER provided money, a thing of value, services, or support for an individual, group, or organization who did any of the activities described in Items 43.b - 43.e?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_provided_support_violent_group_Yes" },
      { label: "No", value: "No", pdfKey: "p9_provided_support_violent_group_No" },
    ],
  },
  {
    key: "p9_intend_violent_acts",
    pdfKey: "_",
    label:
      "Do you intend to engage in any of the activities listed in any part of Items 43.b - 43.e?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_intend_violent_acts_Yes" },
      { label: "No", value: "No", pdfKey: "p9_intend_violent_acts_No" },
    ],
  },
  {
    key: "p9_endanger_us_security",
    pdfKey: "_",
    label:
      "Do you intend to engage in any activity that could endanger the welfare, safety, or security of the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_endanger_us_security_Yes" },
      { label: "No", value: "No", pdfKey: "p9_endanger_us_security_No" },
    ],
  },
  {
    key: "p9_spouse_child_violent_person",
    pdfKey: "_",
    label:
      "Are you the spouse or child of an individual who EVER engaged in any of the activities listed in Items 43.b - 43.i?",
    tooltip:
      'NOTE: If you answered "Yes" to any part of Item Number 46., explain what your parent or spouse did, including the dates and location of the circumstances in Part 14. Additional Information.',
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_spouse_child_violent_person_Yes" },
      { label: "No", value: "No", pdfKey: "p9_spouse_child_violent_person_No" },
    ],
  },
  {
    key: "p9_sold_transported_weapons",
    pdfKey: "_",
    label:
      "Have you EVER sold, provided, or transported weapons, or assisted any person in doing so, knowing or believing they would be used against another person?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_sold_transported_weapons_Yes" },
      { label: "No", value: "No", pdfKey: "p9_sold_transported_weapons_No" },
    ],
  },
  {
    key: "p9_worked_prison_detention",
    pdfKey: "_",
    label:
      "Have you EVER worked, volunteered, or served in any prison, jail, prison camp, detention facility, labor camp, or participated in detaining people?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_worked_prison_detention_Yes" },
      { label: "No", value: "No", pdfKey: "p9_worked_prison_detention_No" },
    ],
  },
  {
    key: "p9_group_used_weapons",
    pdfKey: "_",
    label:
      "Have you EVER been a member of, assisted, or participated in any group or organization in which weapons were used against any person or threatened to be used?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_group_used_weapons_Yes" },
      { label: "No", value: "No", pdfKey: "p9_group_used_weapons_No" },
    ],
  },
  {
    key: "p9_served_military_police",
    pdfKey: "_",
    label:
      "Have you EVER served in, been a member of, assisted, or participated in any military or police unit?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_served_military_police_Yes" },
      { label: "No", value: "No", pdfKey: "p9_served_military_police_No" },
    ],
  },
  {
    key: "p9_served_armed_rebel_group",
    pdfKey: "_",
    label:
      "Have you EVER served in, been a member of, assisted, or participated in any armed group (such as a paramilitary, vigilante, rebel, or guerrilla group)?",
    type: "radio",
    tooltip:
      "If you answered Yes, in previous or this question, then include the name of the country, the name of the military unit or armed group, your rank or position and your dates of involvement in your explanation.",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_served_armed_rebel_group_Yes" },
      { label: "No", value: "No", pdfKey: "p9_served_armed_rebel_group_No" },
    ],
  },
  {
    key: "p9_communist_totalitarian_party",
    pdfKey: "_",
    label:
      "Have you EVER been a member of, or in any way affiliated with, the Communist Party or any totalitarian party in the United States or abroad?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_communist_totalitarian_party_Yes" },
      { label: "No", value: "No", pdfKey: "p9_communist_totalitarian_party_No" },
    ],
  },
  {
    key: "p9_torture",
    pdfKey: "_",
    label:
      "Have you EVER ordered, incited, called for, committed, assisted, or participated in torture?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_torture_Yes" },
      { label: "No", value: "No", pdfKey: "p9_torture_No" },
    ],
  },
  {
    key: "p9_genocide",
    pdfKey: "_",
    label:
      "Have you EVER ordered, incited, called for, committed, assisted, or participated in genocide?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_genocide_Yes" },
      { label: "No", value: "No", pdfKey: "p9_genocide_No" },
    ],
  },
  {
    key: "p9_killing_trying_kill",
    pdfKey: "_",
    label:
      "Have you EVER ordered, incited, called for, committed, assisted, or participated in killing, or trying to kill, any person?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_killing_trying_kill_Yes" },
      { label: "No", value: "No", pdfKey: "p9_killing_trying_kill_No" },
    ],
  },
  {
    key: "p9_severely_injuring_person",
    pdfKey: "_",
    label:
      "Have you EVER ordered, incited, called for, committed, assisted, or participated in intentionally and severely injuring or trying to injure any person?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_severely_injuring_person_Yes" },
      { label: "No", value: "No", pdfKey: "p9_severely_injuring_person_No" },
    ],
  },
  {
    key: "p9_child_soldiers_under15_recruited",
    pdfKey: "_",
    label:
      "Have you EVER recruited, enlisted, conscripted, or used any person under 15 years of age to take part in hostilities or serve in an armed force or group?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_child_soldiers_under15_recruited_Yes" },
      { label: "No", value: "No", pdfKey: "p9_child_soldiers_under15_recruited_No" },
    ],
  },
  {
    key: "p9_child_soldiers_under15_used",
    pdfKey: "_",
    label:
      "Have you EVER used any person under 15 years of age to take part in hostilities (such as combat, courier, sabotage, or transporting supplies)?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_child_soldiers_under15_used_Yes" },
      { label: "No", value: "No", pdfKey: "p9_child_soldiers_under15_used_No" },
    ],
  },
  {
    key: "_p9_explanation",
    pdfKey: "_",
    type: "hidden",
    label:
      'NOTE: If you answered "Yes" to any part of "from transporting weapons question to the above question", then explain what occurred, including the dates and location of the circumstances, in the space provided in Part 14. Additional Information.',
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    tooltip: "",
  },
  {
    key: "p9_public_charge_exemption_category",
    pdfKey: "_",
    label:
      "Are you exempt from the public charge ground of inadmissibility? (Select your exempt category, if applicable)",
    tooltip:
      "If you qualify under an exempt category below, select it and the Public Charge financial questions will be automatically skipped for you.",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      {
        label: "VAWA Self-Petitioner (Form I-360)",
        value: "VAWA",
        pdfKey: "p9_public_charge_vawa_cb",
      },
      {
        label: "Special Immigrant Juvenile (Form I-360)",
        value: "SIJ",
        pdfKey: "p9_public_charge_sij_cb",
      },
      {
        label: "Certain Afghan or Iraqi National (Form I-360 or Form DS-157)",
        value: "AfghanIraqi",
        pdfKey: "p9_public_charge_afghan_iraqi_cb",
      },
      {
        label: "Asylee (Form I-589 or Form I-730)",
        value: "Asylee",
        pdfKey: "p9_public_charge_asylee_cb",
      },
      {
        label: "Refugee (Form I-590 or Form I-730)",
        value: "Refugee",
        pdfKey: "p9_public_charge_refugee_cb",
      },
      {
        label: "Victim of Qualifying Criminal Activity (U Nonimmigrant) under INA section 245(m)",
        value: "UVisa",
        pdfKey: "p9_public_charge_u_visa_cb",
      },
      {
        label: "Valid U Nonimmigrant Status at time of filing",
        value: "UStatusValid",
        pdfKey: "p9_public_charge_u_status_valid_cb",
      },
      {
        label: "Human Trafficking Victim (T Nonimmigrant) under INA section 245(l)",
        value: "TVisa",
        pdfKey: "p9_public_charge_t_visa_cb",
      },
      {
        label: "Pending/Valid T Nonimmigrant Status",
        value: "TStatusValid",
        pdfKey: "p9_public_charge_t_status_valid_cb",
      },
      { label: "Cuban Adjustment Act", value: "CubanAct", pdfKey: "p9_public_charge_cuban_act_cb" },
      {
        label: "Cuban Adjustment Act for Battered Spouses and Children",
        value: "CubanBattered",
        pdfKey: "p9_public_charge_cuban_battered_cb",
      },
      {
        label: "Dependent Status under Haitian Refugee Immigrant Fairness Act (HRIFA)",
        value: "HRIFA",
        pdfKey: "p9_public_charge_haitian_cb",
      },
      {
        label:
          "Dependent Status under Haitian Refugee Immigrant Fairness Act (HRIFA) Battered Spouses and Children",
        value: "HRIFABattered",
        pdfKey: "p9_public_charge_haitian_battered_cb",
      },
      {
        label: "Cuban and Haitian Entrants under IRCA Section 202",
        value: "CubanHaitianEntrants",
        pdfKey: "p9_public_charge_cuban_haitian_entrants_cb",
      },
      {
        label: "Lautenberg Parolee",
        value: "Lautenberg",
        pdfKey: "p9_public_charge_lautenberg_cb",
      },
      {
        label: "National of Vietnam, Cambodia, or Laos",
        value: "Indochinese",
        pdfKey: "p9_public_charge_indochinese_cb",
      },
      {
        label: "Continuous Residence in U.S. Since Before Jan 1, 1972 (Registry)",
        value: "Registry",
        pdfKey: "p9_public_charge_registry_1972_cb",
      },
      {
        label: "Amerasian Homecoming Act",
        value: "Amerasian",
        pdfKey: "p9_public_charge_amerasian_cb",
      },
      {
        label: "Polish or Hungarian Parolee",
        value: "PolishHungarian",
        pdfKey: "p9_public_charge_polish_hungarian_cb",
      },
      {
        label: "Nicaraguans and Other Central Americans under NACARA Section 203",
        value: "NACARA",
        pdfKey: "p9_public_charge_nacara_cb",
      },
      {
        label: "American Indian Born in Canada or Kickapoo Tribe",
        value: "AmericanIndianKickapoo",
        pdfKey: "p9_public_charge_american_indian_kickapoo_cb",
      },
      {
        label: "Liberian Refugee Immigration Fairness (NDAA FY 2020 Sec 7611)",
        value: "Liberian",
        pdfKey: "p9_public_charge_liberian_cb",
      },
      {
        label: "Syrian National Adjusting Status under Public Law 106-378",
        value: "Syrian",
        pdfKey: "p9_public_charge_syrian_cb",
      },
      {
        label:
          "Spouse, Child, or Parent of a U.S. Active-Duty Service Member (Form I-130 or I-360)",
        value: "ActiveDutyRelative",
        pdfKey: "p9_public_charge_active_duty_relative_cb",
      },
      {
        label: "I do not fall under any of the exempt categories (Not Exempt)",
        value: "NotExempt",
        pdfKey: "p9_public_charge_not_exempt_cb",
      },
    ],
  },
  {
    key: "p9_household_size",
    pdfKey: "p9_household_size",
    label: "What is the size of your household?",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_annual_household_income",
    pdfKey: "_",
    label: "Indicate your annual household income:",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
    options: [
      { label: "$0 - $27,000", value: "0-27k", pdfKey: "p9_income_0_27k_cb" },
      { label: "$27,001 - $52,000", value: "27k-52k", pdfKey: "p9_income_27k_52k_cb" },
      { label: "$52,001 - $85,000", value: "52k-85k", pdfKey: "p9_income_52k_85k_cb" },
      { label: "$85,001 - $141,000", value: "85k-141k", pdfKey: "p9_income_85k_141k_cb" },
      { label: "Over $141,000", value: "over141k", pdfKey: "p9_income_over_141k_cb" },
    ],
  },
  {
    key: "p9_household_assets",
    pdfKey: "_",
    label: "Identify the total value of your household assets:",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
    options: [
      { label: "$0 - $18,400", value: "0-18.4k", pdfKey: "p9_assets_0_18k_cb" },
      { label: "$18,401 - $136,000", value: "18.4k-136k", pdfKey: "p9_assets_18k_136k_cb" },
      { label: "$136,001 - $321,400", value: "136k-321.4k", pdfKey: "p9_assets_136k_321k_cb" },
      { label: "$321,401 - $707,100", value: "321.4k-707.1k", pdfKey: "p9_assets_321k_707k_cb" },
      { label: "Over $707,100", value: "over707.1k", pdfKey: "p9_assets_over_707k_cb" },
    ],
  },
  {
    key: "p9_household_liabilities",
    pdfKey: "_",
    label: "Identify the total value of your household liabilities (debts):",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
    options: [
      { label: "$0", value: "0", pdfKey: "p9_liabilities_0_cb" },
      { label: "$1 - $10,100", value: "1-10.1k", pdfKey: "p9_liabilities_1_10k_cb" },
      { label: "$10,101 - $57,700", value: "10.1k-57.7k", pdfKey: "p9_liabilities_10k_57k_cb" },
      { label: "$57,701 - $186,800", value: "57.7k-186.8k", pdfKey: "p9_liabilities_57k_186k_cb" },
      { label: "Over $186,800", value: "over186.8k", pdfKey: "p9_liabilities_over_186k_cb" },
    ],
  },
  {
    key: "p9_education_level",
    pdfKey: "_",
    label: "What is the highest degree or grade of school you have completed?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
    options: [
      {
        label: "Less than a high school diploma",
        value: "LessThanHighSchool",
        pdfKey: "p9_edu_less_than_high_school_cb",
      },
      {
        label: "High school diploma, GED, or alternative credential",
        value: "HighSchoolGED",
        pdfKey: "p9_edu_high_school_ged_cb",
      },
      {
        label: "1 or more years of college credit, no degree",
        value: "SomeCollege",
        pdfKey: "p9_edu_some_college_cb",
      },
      { label: "Associate's degree", value: "Associates", pdfKey: "p9_edu_associates_cb" },
      { label: "Bachelor's degree", value: "Bachelors", pdfKey: "p9_edu_bachelors_cb" },
      { label: "Master's degree", value: "Masters", pdfKey: "p9_edu_masters_cb" },
      {
        label: "Professional degree (JD, MD, DMD, etc.)",
        value: "Professional",
        pdfKey: "p9_edu_professional_cb",
      },
      { label: "Doctorate degree", value: "Doctorate", pdfKey: "p9_edu_doctorate_cb" },
    ],
    subQuestions: [
      {
        key: "p9_edu_highest_grade_text",
        pdfKey: "p9_edu_highest_grade_text",
        label:
          "If less than a high school diploma, indicate the highest grade of school completed:",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_education_level === "LessThanHighSchool",
      },
    ],
  },
  {
    key: "p9_certifications_row1",
    pdfKey: "p9_certifications_row1",
    label: "Certifications, licenses, or skills (Item 1)",
    placeholder: "e.g., CPA, RN, Commercial Driver License, Plumbing License",
    tooltip:
      "List your certifications, lincense, skills obtained through work experience and educational certificates.",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_certifications_row2",
    pdfKey: "p9_certifications_row2",
    label: "Certifications, licenses, or skills (Item 2)",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_certifications_row3",
    pdfKey: "p9_certifications_row3",
    label: "Certifications, licenses, or skills (Item 3)",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_certifications_row4",
    pdfKey: "p9_certifications_row4",
    label: "Certifications, licenses, or skills (Item 4)",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_certifications_row5",
    pdfKey: "p9_certifications_row5",
    label: "Certifications, licenses, or skills (Item 5)",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_certifications_row6",
    pdfKey: "p9_certifications_row6",
    label: "Certifications, licenses, or skills (Item 6)",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_certifications_row7",
    pdfKey: "p9_certifications_row7",
    label: "Certifications, licenses, or skills (Item 7)",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },
  {
    key: "p9_certifications_row8",
    pdfKey: "p9_certifications_row8",
    label: "Certifications, licenses, or skills (Item 8)",
    type: "text",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
  },

  {
    key: "p9_public_cash_assistance",
    pdfKey: "_",
    label:
      "Have you EVER received Supplemental Security Income (SSI), TANF, or state/local cash assistance for income maintenance?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_public_cash_assistance_Yes" },
      { label: "No", value: "No", pdfKey: "p9_public_cash_assistance_No" },
    ],
    subQuestions: [
      {
        key: "p9_cash_benefit_row1_name",
        pdfKey: "_",
        label:
          'If your answer is "Yes," list the specific benefit(s) you received, the start and end dates of each period of receipt, the dollar amount of benefits received, and whether you received the benefits while you were in an immigration category exempt from the public charge ground of inadmissibility.',
        type: "hidden",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row1_name",
        pdfKey: "p9_cash_benefit_row1_name",
        label: "Benefit 1 - Specific Benefit Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row1_start_date",
        pdfKey: "p9_cash_benefit_row1_start_date",
        label: "Benefit 1 - Start Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row1_end_date",
        pdfKey: "p9_cash_benefit_row1_end_date",
        label: "Benefit 1 - End Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row1_amount",
        pdfKey: "p9_cash_benefit_row1_amount",
        label: "Benefit 1 - Total Dollar Amount Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row1_exempt",
        pdfKey: "_",
        label: "Benefit 1 - Were you in an exempt category when you received this benefit?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_cash_benefit_row1_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_cash_benefit_row1_exempt_No" },
        ],
      },
      // Row 2
      {
        key: "p9_cash_benefit_row2_name",
        pdfKey: "p9_cash_benefit_row2_name",
        label: "Benefit 2 - Specific Benefit Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row2_start_date",
        pdfKey: "p9_cash_benefit_row2_start_date",
        label: "Benefit 2 - Start Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row2_end_date",
        pdfKey: "p9_cash_benefit_row2_end_date",
        label: "Benefit 2 - End Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row2_amount",
        pdfKey: "p9_cash_benefit_row2_amount",
        label: "Benefit 2 - Total Dollar Amount Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row2_exempt",
        pdfKey: "_",
        label: "Benefit 2 - Were you in an exempt category when you received this benefit?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_cash_benefit_row2_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_cash_benefit_row2_exempt_No" },
        ],
      },
      // Row 3
      {
        key: "p9_cash_benefit_row3_name",
        pdfKey: "p9_cash_benefit_row3_name",
        label: "Benefit 3 - Specific Benefit Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row3_start_date",
        pdfKey: "p9_cash_benefit_row3_start_date",
        label: "Benefit 3 - Start Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row3_end_date",
        pdfKey: "p9_cash_benefit_row3_end_date",
        label: "Benefit 3 - End Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row3_amount",
        pdfKey: "p9_cash_benefit_row3_amount",
        label: "Benefit 3 - Total Dollar Amount Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row3_exempt",
        pdfKey: "_",
        label: "Benefit 3 - Were you in an exempt category when you received this benefit?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_cash_benefit_row3_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_cash_benefit_row3_exempt_No" },
        ],
      },
      // Row 4
      {
        key: "p9_cash_benefit_row4_name",
        pdfKey: "p9_cash_benefit_row4_name",
        label: "Benefit 4 - Specific Benefit Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row4_start_date",
        pdfKey: "p9_cash_benefit_row4_start_date",
        label: "Benefit 4 - Start Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row4_end_date",
        pdfKey: "p9_cash_benefit_row4_end_date",
        label: "Benefit 4 - End Date (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row4_amount",
        pdfKey: "p9_cash_benefit_row4_amount",
        label: "Benefit 4 - Total Dollar Amount Received",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
      },
      {
        key: "p9_cash_benefit_row4_exempt",
        pdfKey: "_",
        label: "Benefit 4 - Were you in an exempt category when you received this benefit?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_public_cash_assistance === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_cash_benefit_row4_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_cash_benefit_row4_exempt_No" },
        ],
      },
    ],
  },
  {
    key: "p9_institutional_care_govt",
    pdfKey: "_",
    label: "Have you EVER received long-term institutionalization at government expense?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    condition: (d) => d.p9_public_charge_exemption_category === "NotExempt",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_institutional_care_govt_Yes" },
      { label: "No", value: "No", pdfKey: "p9_institutional_care_govt_No" },
    ],
    subQuestions: [
      {
        key: "p9_inst_care_row1_institution_tooltip",
        pdfKey: "_",
        label:
          'If your answer is "Yes," list the name, city, and state for each institution, the start and end dates of each period of institutionalization, the reason you were institutionalized, and whether you were institutionalized while you were in an immigration category exempt from the public charge ground of inadmissibility.',
        type: "hidden",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row1_institution",
        pdfKey: "p9_inst_care_row1_institution",
        label: "Institution 1 - Name, City, and State",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row1_date_from",
        pdfKey: "p9_inst_care_row1_date_from",
        label: "Institution 1 - Date From (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row1_date_to",
        pdfKey: "p9_inst_care_row1_date_to",
        label: "Institution 1 - Date To (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row1_reason",
        pdfKey: "p9_inst_care_row1_reason",
        label: "Institution 1 - Reason for Institutionalization",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row1_exempt",
        pdfKey: "_",
        label: "Institution 1 - Were you in an exempt category during this institutionalization?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_inst_care_row1_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_inst_care_row1_exempt_No" },
        ],
      },
      // Row 2
      {
        key: "p9_inst_care_row2_institution",
        pdfKey: "p9_inst_care_row2_institution",
        label: "Institution 2 - Name, City, and State",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row2_date_from",
        pdfKey: "p9_inst_care_row2_date_from",
        label: "Institution 2 - Date From (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row2_date_to",
        pdfKey: "p9_inst_care_row2_date_to",
        label: "Institution 2 - Date To (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row2_reason",
        pdfKey: "p9_inst_care_row2_reason",
        label: "Institution 2 - Reason for Institutionalization",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row2_exempt",
        pdfKey: "_",
        label: "Institution 2 - Were you in an exempt category during this institutionalization?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_inst_care_row2_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_inst_care_row2_exempt_No" },
        ],
      },
      // Row 3
      {
        key: "p9_inst_care_row3_institution",
        pdfKey: "p9_inst_care_row3_institution",
        label: "Institution 3 - Name, City, and State",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row3_date_from",
        pdfKey: "p9_inst_care_row3_date_from",
        label: "Institution 3 - Date From (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row3_date_to",
        pdfKey: "p9_inst_care_row3_date_to",
        label: "Institution 3 - Date To (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row3_reason",
        pdfKey: "p9_inst_care_row3_reason",
        label: "Institution 3 - Reason for Institutionalization",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row3_exempt",
        pdfKey: "_",
        label: "Institution 3 - Were you in an exempt category during this institutionalization?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_inst_care_row3_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_inst_care_row3_exempt_No" },
        ],
      },
      // Row 4
      {
        key: "p9_inst_care_row4_institution",
        pdfKey: "p9_inst_care_row4_institution",
        label: "Institution 4 - Name, City, and State",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row4_date_from",
        pdfKey: "p9_inst_care_row4_date_from",
        label: "Institution 4 - Date From (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row4_date_to",
        pdfKey: "p9_inst_care_row4_date_to",
        label: "Institution 4 - Date To (mm/dd/yyyy)",
        type: "date",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row4_reason",
        pdfKey: "p9_inst_care_row4_reason",
        label: "Institution 4 - Reason for Institutionalization",
        type: "text",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
      },
      {
        key: "p9_inst_care_row4_exempt",
        pdfKey: "_",
        label: "Institution 4 - Were you in an exempt category during this institutionalization?",
        type: "radio",
        condition: (d) =>
          d.p9_public_charge_exemption_category === "NotExempt" &&
          d.p9_institutional_care_govt === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_inst_care_row4_exempt_Yes" },
          { label: "No", value: "No", pdfKey: "p9_inst_care_row4_exempt_No" },
        ],
      },
    ],
  },
  {
    key: "p9_failed_attend_removal_proceeding",
    pdfKey: "_",
    label:
      "Have you EVER failed or refused to attend or stay at any removal proceeding filed against you on or after April 1, 1997?",
    tooltip:
      "NOTE: If your answer is 'Yes', attach a written statement explaining why you failed or refused to attend.",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_failed_attend_removal_proceeding_Yes" },
      { label: "No", value: "No", pdfKey: "p9_failed_attend_removal_proceeding_No" },
    ],
  },
  {
    key: "p9_submitted_fraudulent_doc",
    pdfKey: "_",
    label:
      "Have you EVER submitted altered, fake, or fraudulent documents to any U.S. Government official to get an immigration benefit or entry into the U.S.?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_submitted_fraudulent_doc_Yes" },
      { label: "No", value: "No", pdfKey: "p9_submitted_fraudulent_doc_No" },
    ],
  },
  {
    key: "p9_misrepresented_info_visa",
    pdfKey: "_",
    label:
      "Have you EVER lied about, hidden, or misrepresented any information on an application or petition to obtain a visa or entry into the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_misrepresented_info_visa_Yes" },
      { label: "No", value: "No", pdfKey: "p9_misrepresented_info_visa_No" },
    ],
  },
  {
    key: "p9_falsely_claimed_us_citizen",
    pdfKey: "_",
    label: "Have you EVER falsely claimed to be a U.S. citizen (in writing or in any other way)?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_falsely_claimed_us_citizen_Yes" },
      { label: "No", value: "No", pdfKey: "p9_falsely_claimed_us_citizen_No" },
    ],
  },
  {
    key: "p9_stowaway",
    pdfKey: "_",
    label: "Have you EVER been a stowaway on a ship or aircraft arriving in the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_stowaway_Yes" },
      { label: "No", value: "No", pdfKey: "p9_stowaway_No" },
    ],
  },
  {
    key: "p9_alien_smuggling",
    pdfKey: "_",
    label:
      "Have you EVER knowingly helped, encouraged, or assisted anyone to enter or try to enter the United States illegally (alien smuggling)?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_alien_smuggling_Yes" },
      { label: "No", value: "No", pdfKey: "p9_alien_smuggling_No" },
    ],
  },
  {
    key: "p9_civil_penalty_fraudulent_docs",
    pdfKey: "_",
    label:
      "Are you under a final order of civil penalty for violating INA section 274C for use of fraudulent documents?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_civil_penalty_fraudulent_docs_Yes" },
      { label: "No", value: "No", pdfKey: "p9_civil_penalty_fraudulent_docs_No" },
    ],
  },
  {
    key: "p9_deported_removed_departed",
    pdfKey: "_",
    label:
      "Have you EVER been excluded, deported, or removed from the United States, or left the U.S. on your own after having been ordered deported or removed?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_deported_removed_departed_Yes" },
      { label: "No", value: "No", pdfKey: "p9_deported_removed_departed_No" },
    ],
  },
  {
    key: "p9_entered_without_inspection",
    pdfKey: "_",
    label:
      "Have you EVER entered the United States without being inspected and admitted or paroled?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_entered_without_inspection_Yes" },
      { label: "No", value: "No", pdfKey: "p9_entered_without_inspection_No" },
    ],
  },
  {
    key: "p9_unlawfully_present_since_1997",
    pdfKey: "_",
    label:
      "Since April 1, 1997, have you been in the United States without permission (unlawfully present)?",
    tooltip:
      "NOTE: If you answered Yes, give the dates of unlawful presence in Part 14. Additional Information.",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_unlawfully_present_since_1997_Yes" },
      { label: "No", value: "No", pdfKey: "p9_unlawfully_present_since_1997_No" },
    ],
    subQuestions: [
      {
        key: "p9_unlawful_presence_trafficking_reason",
        pdfKey: "_",
        label:
          "If your answer is 'Yes', was human trafficking a main reason for your unlawful presence in the United States?",
        tooltip:
          "NOTE: Severe trafficking in persons involves sex trafficking (the recruitment, harboring, transportation, provision, or obtaining of a person to commit a commercial sex act) induced by force, fraud, coercion, or in which the person is induced to perform such act has not reached 18 years of age, or the recruitment, harboring, transportation, provision, or obtaining of a person for labor or services, through the use of force, fraud, or coercion for the purpose of subjection to involuntary servitude, peonage, debt bondage, or slavery.",
        type: "radio",
        condition: (d) => d.p9_unlawfully_present_since_1997 === "Yes",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "p9_unlawful_presence_trafficking_reason_Yes" },
          { label: "No", value: "No", pdfKey: "p9_unlawful_presence_trafficking_reason_No" },
        ],
      },
    ],
  },
  {
    key: "p9_reentered_unlawful_over_1yr",
    pdfKey: "_",
    label:
      "Since April 1, 1997, have you EVER reentered or tried to reenter the United States without inspection after being unlawfully present for more than 1 year in total?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_reentered_unlawful_over_1yr_Yes" },
      { label: "No", value: "No", pdfKey: "p9_reentered_unlawful_over_1yr_No" },
    ],
  },
  {
    key: "p9_reentered_after_deportation",
    pdfKey: "_",
    label:
      "Have you EVER reentered or tried to reenter the United States without inspection after having been deported, excluded, or removed?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_reentered_after_deportation_Yes" },
      { label: "No", value: "No", pdfKey: "p9_reentered_after_deportation_No" },
    ],
  },
  {
    key: "p9_polygamy",
    pdfKey: "_",
    label:
      "Do you plan to practice polygamy (marrying more than one person at the same time) in the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_polygamy_Yes" },
      { label: "No", value: "No", pdfKey: "p9_polygamy_No" },
    ],
  },
  {
    key: "p9_accompanying_helpless_alien",
    pdfKey: "_",
    label:
      "Are you accompanying someone an alien is inadmissible and certified by a medical officer as helpless from illness/disability and requires your protection or guardianship?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_accompanying_helpless_alien_Yes" },
      { label: "No", value: "No", pdfKey: "p9_accompanying_helpless_alien_No" },
    ],
  },
  {
    key: "p9_withheld_us_child_custody",
    pdfKey: "_",
    label:
      "Have you EVER assisted in detaining, retaining, or withholding custody of a U.S. citizen child outside the United States from their legal guardian?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_withheld_us_child_custody_Yes" },
      { label: "No", value: "No", pdfKey: "p9_withheld_us_child_custody_No" },
    ],
  },
  {
    key: "p9_illegal_voting",
    pdfKey: "_",
    label:
      "Have you EVER voted in violation of any Federal, state, or local law in the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_illegal_voting_Yes" },
      { label: "No", value: "No", pdfKey: "p9_illegal_voting_No" },
    ],
  },
  {
    key: "p9_renounced_us_citizenship_tax",
    pdfKey: "_",
    label: "Have you EVER renounced U.S. citizenship to avoid being taxed by the United States?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_renounced_us_citizenship_tax_Yes" },
      { label: "No", value: "No", pdfKey: "p9_renounced_us_citizenship_tax_No" },
    ],
  },
  {
    key: "p9_applied_military_exemption_alien",
    pdfKey: "_",
    label:
      "Have you EVER applied for exemption or discharge from training or service in the U.S. armed forces on the ground that you are an alien?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_applied_military_exemption_alien_Yes" },
      { label: "No", value: "No", pdfKey: "p9_applied_military_exemption_alien_No" },
    ],
  },
  {
    key: "p9_relieved_military_service_alien",
    pdfKey: "_",
    label:
      "Have you EVER been relieved or discharged from U.S. military service or training on the ground that you are an alien?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_relieved_military_service_alien_Yes" },
      { label: "No", value: "No", pdfKey: "p9_relieved_military_service_alien_No" },
    ],
  },
  {
    key: "p9_convicted_military_desertion",
    pdfKey: "_",
    label: "Have you EVER been convicted of desertion from the U.S. armed forces?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_convicted_military_desertion_Yes" },
      { label: "No", value: "No", pdfKey: "p9_convicted_military_desertion_No" },
    ],
  },
  {
    key: "p9_evaded_military_service_war",
    pdfKey: "_",
    label:
      "Have you EVER left or remained outside the United States to avoid or evade training or service in the U.S. armed forces in time of war or national emergency?",
    type: "radio",
    section: "Part 9. General Eligibility and Inadmissibility Grounds",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p9_evaded_military_service_war_Yes" },
      { label: "No", value: "No", pdfKey: "p9_evaded_military_service_war_No" },
    ],
    subQuestions: [
      {
        key: "p9_evaded_military_nationality_text",
        pdfKey: "p9_evaded_military_nationality_text",
        label:
          "If your answer is 'Yes', what was your nationality or immigration status immediately before you left?",
        type: "text",
        condition: (d) => d.p9_evaded_military_service_war === "Yes",
      },
    ],
  },
  {
    key: "p10_daytime_phone",
    pdfKey: "p10_daytime_phone",
    label: "What is your daytime telephone number?",
    type: "text",
    section: "Part 10. Applicant's Contact Information, Certification, and Signature",
  },
  {
    key: "p10_mobile_phone",
    pdfKey: "p10_mobile_phone",
    label: "What is your mobile telephone number (if any)?",
    type: "text",
    section: "Part 10. Applicant's Contact Information, Certification, and Signature",
  },
  {
    key: "p10_email",
    pdfKey: "p10_email",
    label: "What is your email address (if any)?",
    type: "text",
    section: "Part 10. Applicant's Contact Information, Certification, and Signature",
  },
  {
    key: "p10_signature",
    pdfKey: "p10_signature",
    label: "Applicant's Signature (Type your full legal name)",
    tooltip:
      "I certify, under penalty of perjury, that I provided or authorized all of the responses and information contained in and submitted with my application, I read and understand or, if interpreted to me in a language in which I am fluent by the interpreter listed in Part 11., understood, all of the responses and information contained in, and submitted with, my application, and that all of the responses and the information are complete, true, and correct. Furthermore, I authorize the release of any information from any and all of my records that USCIS may need to determine my eligibility for an immigration request and to other entities and persons where necessary for the administration and enforcement of U.S. immigration law.",
    type: "text",
    section: "Part 10. Applicant's Contact Information, Certification, and Signature",
  },
  {
    key: "p10_signature_date",
    pdfKey: "p10_signature_date",
    label: "Date of Signature (mm/dd/yyyy)",
    type: "date",
    section: "Part 10. Applicant's Contact Information, Certification, and Signature",
  },
  {
    key: "p11_used_interpreter",
    pdfKey: "_",
    label: "Did an interpreter help you complete this application?",
    type: "radio",
    section: "Part 11. Interpreter's Contact Information, Certification, and Signature",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p11_used_interpreter_Yes" },
      { label: "No", value: "No", pdfKey: "p11_used_interpreter_No" },
    ],
    subQuestions: [
      {
        key: "p11_interpreter_first_name",
        pdfKey: "p11_interpreter_first_name",
        label: "Interpreter's First Name (Given Name)",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_last_name",
        pdfKey: "p11_interpreter_last_name",
        label: "Interpreter's Last Name (Family Name)",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_org_name",
        pdfKey: "p11_interpreter_org_name",
        label: "Interpreter's Business or Organization Name (if any)",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_daytime_phone",
        pdfKey: "p11_interpreter_daytime_phone",
        label: "Interpreter's Daytime Telephone Number",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_mobile_phone",
        pdfKey: "p11_interpreter_mobile_phone",
        label: "Interpreter's Mobile Telephone Number (if any)",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_email",
        pdfKey: "p11_interpreter_email",
        label: "Interpreter's Email Address (if any)",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_language",
        pdfKey: "p11_interpreter_language",
        label: "What language did the interpreter translate for you?",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_signature",
        pdfKey: "p11_interpreter_signature",
        label: "Interpreter's Signature (Type full legal name)",
        type: "text",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
      {
        key: "p11_interpreter_signature_date",
        pdfKey: "p11_interpreter_signature_date",
        label: "Date of Interpreter Signature (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p11_used_interpreter === "Yes",
      },
    ],
  },
  {
    key: "p12_used_preparer",
    pdfKey: "_",
    label: "Did someone else (a preparer or attorney) prepare this application for you?",
    type: "radio",
    section:
      "Part 12. Contact Information, Certification, and Signature of the Person Preparing this Application, if Other Than the Applicant",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "p12_used_preparer_Yes" },
      { label: "No", value: "No", pdfKey: "p12_used_preparer_No" },
    ],
    subQuestions: [
      {
        key: "p12_preparer_first_name",
        pdfKey: "p12_preparer_first_name",
        label: "Preparer's First Name (Given Name)",
        type: "text",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
      {
        key: "p12_preparer_last_name",
        pdfKey: "p12_preparer_last_name",
        label: "Preparer's Last Name (Family Name)",
        type: "text",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
      {
        key: "p12_preparer_org_name",
        pdfKey: "p12_preparer_org_name",
        label: "Preparer's Business or Organization Name (if any)",
        type: "text",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
      {
        key: "p12_preparer_daytime_phone",
        pdfKey: "p12_preparer_daytime_phone",
        label: "Preparer's Daytime Telephone Number",
        type: "text",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
      {
        key: "p12_preparer_mobile_phone",
        pdfKey: "p12_preparer_mobile_phone",
        label: "Preparer's Mobile Telephone Number (if any)",
        type: "text",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
      {
        key: "p12_preparer_email",
        pdfKey: "p12_preparer_email",
        label: "Preparer's Email Address (if any)",
        type: "text",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
      {
        key: "p12_preparer_signature",
        pdfKey: "p12_preparer_signature",
        label: "Preparer's Signature (Type full legal name)",
        tooltip:
          "I certify, under penalty of perjury, that I prepared this application for the applicant at his or her request and with express consent and that all of the responses and information contained in and submitted with the application are complete, true, and correct and reflects only information provided by the applicant. The applicant reviewed the responses and information and informed me that he or she understands the responses and information in or submitted with the application.",
        type: "text",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
      {
        key: "p12_preparer_signature_date",
        pdfKey: "p12_preparer_signature_date",
        label: "Date of Preparer Signature (mm/dd/yyyy)",
        type: "date",
        condition: (d) => d.p12_used_preparer === "Yes",
      },
    ],
  },
];

export const getInitialFormData = () => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => {
    data[f.key] = "";
    if (f.subQuestions) {
      f.subQuestions.forEach((sq) => {
        data[sq.key] = "";
      });
    }
  });
  return data;
};

export const sectionIntroMessages = {
  "Part 1. Information About You": {
    greeting: "Let's start with who you are!",
    message:
      "In this first part, we will collect your full legal name, any other names you've used in your life, your birthday, and your Alien Registration Number (A-Number) if you have one. Simple and easy!",
  },
  "Current U.S. Physical Address": {
    greeting: "Tell us where you live!",
    message:
      "Please give us your current address in the United States and where you receive your mail so USCIS can send you important notices.",
  },
  "Address History & Social Security": {
    greeting: "Your past addresses",
    message:
      "USCIS needs to know where you lived over the last 5 years and your most recent home outside the United States.",
  },
  "Social Security Card": {
    greeting: "Social Security details",
    message:
      "Tell us if you already have a Social Security Number or if you would like the Social Security Administration to issue a card for you.",
  },
  "Part 2. Application Type or Filing Category": {
    greeting: "Your Application Category",
    message:
      "In this section, select the exact category under which you are applying for your Green Card (such as family-based, spouse of a U.S. citizen, or derivative applicant).",
  },
  "Part 3. Request for Exemption for Affidavit of Support": {
    greeting: "Affidavit of Support Exemption",
    message:
      "Tell us if you qualify for an exemption from submitting Form I-864 (Affidavit of Support), or if you will be submitting Form I-864.",
  },
  "Part 4. Additional Information About You": {
    greeting: "Additional Information & History",
    message:
      "Answer questions about prior visa applications, past Green Card applications, and your employment or educational history over the last 5 years.",
  },
  "Part 5. Information About Your Parents": {
    greeting: "Information About Your Parents",
    message:
      "In this section, tell us about your mother and father, including their full legal names, names at birth, date of birth, and place of birth.",
  },
  "Part 6. Information About Your Marital History": {
    greeting: "Information About Your Marital History",
    message:
      "Tell us about your current marital status, how many times you've been married, and details about your current spouse.",
  },
  "Part 7. Information About Your Children": {
    greeting: "Information About Your Children",
    message:
      "Provide details for all your living children (including adult sons/daughters, biological children, stepchildren, and adopted children).",
  },
  "Part 8. Biographic Information": {
    greeting: "Biographic Information",
    message:
      "Provide biographic details such as ethnicity, race, height, weight, eye color, and hair color.",
  },
  "Part 9. General Eligibility and Inadmissibility Grounds": {
    greeting: "Eligibility & Inadmissibility",
    message:
      "Answer questions regarding organizations you've belonged to and general immigration eligibility grounds.",
  },
  "Part 10. Applicant's Contact Information, Certification, and Signature": {
    greeting: "Applicant Contact & Signature",
    message:
      "Provide your contact numbers, email address, and sign the application certifying that all information provided is complete, true, and correct.",
  },
  "Part 11. Interpreter's Contact Information, Certification, and Signature": {
    greeting: "Interpreter Information & Certification",
    message:
      "If an interpreter helped you complete this form by translating the questions and answers, provide their contact details and signature.",
  },
  "Part 12. Contact Information, Certification, and Signature of the Person Preparing this Application, if Other Than the Applicant":
    {
      greeting: "Preparer Information & Certification",
      message:
        "If an attorney or preparer completed this application on your behalf, provide their contact details and certification signature.",
    },
};

export const overflowFields = [
  {
    prefix: "p1_prior_addr",
    countKey: "p1_address_count",
    startIndex: 2,
    maxIndex: 8,
    pageNumber: "4",
    partNumber: "1",
    itemNumber: "18",
    labelPrefix: "Prior Address",
    fields: [
      // { suffix: "in_care_of", label: "In Care Of Name" },
      { suffix: "street", label: "Street" },
      { suffix: "unit_type", label: "Unit Type" },
      { suffix: "unit_val", label: "Unit Number" },
      { suffix: "city", label: "City" },
      { suffix: "state", label: "State" },
      { suffix: "zip", label: "Zip" },
      { suffix: "province", label: "Province" },
      { suffix: "postal", label: "Postal Code" },
      { suffix: "country", label: "Country" },
      { suffix: "date_from", label: "From" },
      { suffix: "date_to", label: "To" },
    ],
    formatInfo: (index: number, data: Record<string, string>) => {
      const careOf = data[`p1_prior_addr_${index}_in_care_of`] || "";
      const street = data[`p1_prior_addr_${index}_street`] || "";
      const unitType = data[`p1_prior_addr_${index}_unit_type`] || "";
      const unitVal = data[`p1_prior_addr_${index}_unit_val`] || "";
      const city = data[`p1_prior_addr_${index}_city`] || "";
      const state = data[`p1_prior_addr_${index}_state`] || "";
      const zip = data[`p1_prior_addr_${index}_zip`] || "";
      const province = data[`p1_prior_addr_${index}_province`] || "";
      const postal = data[`p1_prior_addr_${index}_postal`] || "";
      const country = data[`p1_prior_addr_${index}_country`] || "";
      const from = data[`p1_prior_addr_${index}_date_from`] || "";
      const to = data[`p1_prior_addr_${index}_date_to`] || "";

      const lines: string[] = [];
      lines.push(`Previous Address ${index}:`);
      // if (careOf) lines.push(`In care of: ${careOf}`);
      if (street) lines.push(`Street number/name: ${street}`);
      if (unitType) {
        lines.push(`Unit type: ${unitType}`);
      }
      if (unitVal) lines.push(`Unit number: ${unitVal}`);
      if (city) lines.push(`City/town: ${city}`);
      if (state) lines.push(`State: ${state}`);
      if (zip) lines.push(`ZIP Code: ${zip}`);
      if (province) lines.push(`Province: ${province}`);
      if (postal) lines.push(`Postal Code: ${postal}`);
      if (country) lines.push(`Country: ${country}`);
      if (from) lines.push(`Date from: ${from}`);
      if (to) lines.push(`Date to: ${to}`);

      return lines.join(", ");
    },
  },
];

export const i485Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  getInitialFormData,
  sectionIntroMessages,
  overflowFields,
};

export default i485Config;
