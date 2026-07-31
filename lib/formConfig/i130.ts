// C:\Users\HP\Desktop\arachnie\Arachnie\lib\formConfig\i130.ts
import type { Field } from "./types";

const getSpouseCondition = (i: number) => {
  return (d: Record<string, string>) => {
    return Number(d.number_of_marriages) >= i - 1;
  };
};

const generatePriorSpousesFields = (startIndex: number, endIndex: number): Field[] => {
  const fields: Field[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    fields.push({
      key: `spouse_${i}_history_note`,
      pdfKey: "N/A",
      label: `Previous Spouse ${i - 1}`,
      type: "hidden",
      section: "Your Marital Information",
      condition: getSpouseCondition(i),
      subQuestions: [
        {
          key: `spouse_${i}_given_name`,
          pdfKey: "N/A",
          label: "What was their first name?",
          type: "text",
          section: "Your Marital Information",
        },
        {
          key: `spouse_${i}_family_name`,
          pdfKey: "N/A",
          label: "What was their last name?",
          type: "text",
          section: "Your Marital Information",
        },
        {
          key: `spouse_${i}_middle_name`,
          pdfKey: "N/A",
          label: "What was their middle name? (If any)",
          type: "text",
          section: "Your Marital Information",
        },
        {
          key: `spouse_${i}_marriage_end_date`,
          pdfKey: "N/A",
          label: "When did this marriage end? (MM/DD/YYYY)",
          type: "date",
          section: "Your Marital Information",
          placeholder: "MM/DD/YYYY",
        },
      ],
    });
  }
  return fields;
};

export const formId = "i130";
export const formTitle = "Form I-130";
export const formSubtitle = "Petition for Alien Relative";

export const formFields: Field[] = [
  // ============================================
  // PART 1. RELATIONSHIP
  // ============================================
  {
    key: "relationship",
    pdfKey: "relationship",
    label: "Who do you want to bring to the U.S.?",
    type: "radio",
    section: "Relationship",
    options: [
      {
        label: "Husband or Wife",
        value: "Spouse",
        pdfKey: "relationship_Spouse",
      },
      { label: "Mom or Dad", value: "Parent", pdfKey: "relationship_Parent" },
      {
        label: "Brother or Sister",
        value: "BrotherSister",
        pdfKey: "relationship_BrotherSister",
      },
      {
        label: "Son or Daughter",
        value: "Child",
        pdfKey: "relationship_Child",
      },
    ],
    subQuestions: [
      {
        key: "relationship_detail",
        pdfKey: "relationship_detail",
        label:
          "1.a. Since you are helping your parent or child, tell us more about how you are related: (Select only one)",
        type: "radio",
        section: "Part 1. Relationship",
        condition: (d) => ["Parent", "Child"].includes(d.relationship),
        options: [
          {
            label: "Born when parents were married",
            value: "ChildBornMarried",
            pdfKey: "relationship_detail_ChildBornMarried",
          },
          {
            label: "Step-child or step-parent",
            value: "Stepchild",
            pdfKey: "relationship_detail_Stepchild",
          },
          {
            label: "Born when parents were NOT married",
            value: "ChildBornUnmarried",
            pdfKey: "relationship_detail_ChildBornUnmarried",
          },
          {
            label: "They were adopted",
            value: "ChildAdopted",
            pdfKey: "relationship_detail_ChildAdopted",
          },
        ],
      },
      {
        key: "sibling_adoption",
        pdfKey: "sibling_adoption",
        label: "1.a Are you and your brother or sister related because one of you was adopted?",
        type: "radio",
        section: "Part 1. Relationship",
        condition: (d) => d.relationship === "BrotherSister",
        options: [
          { label: "Yes", value: "Yes", pdfKey: "sibling_adoption_Yes" },
          { label: "No", value: "No", pdfKey: "sibling_adoption_No" },
        ],
        subQuestions: [
          {
            key: "citizen_adoption",
            pdfKey: "citizen_adoption",
            label: "Did you become a U.S. citizen or get a Green Card because you were adopted?",
            type: "radio",
            section: "Relationship",
            condition: (d) => d.sibling_adoption === "Yes",
            options: [
              { label: "Yes", value: "Yes", pdfKey: "citizen_adoption_Yes" },
              { label: "No", value: "No", pdfKey: "citizen_adoption_No" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================
  // PART 2. INFORMATION ABOUT YOU (PETITIONER)
  // ============================================
  {
    key: "has_a_number",
    label:
      "Do you have an Alien Registration Number (A-Number)? (This is a 7 to 9-digit number often found on immigration documents like a Green Card.)",
    type: "radio",
    section: "Information About You (Petitioner)",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "a_number",
        pdfKey: "a_number",
        label: "What is your Alien Registration Number (A-Number)?",
        type: "text",
        section: "Information About You (Petitioner)",
        condition: (d) => d.has_a_number === "Yes",
        placeholder: "A-Number",
        maxLength: 9,
      },
    ],
  },
  {
    key: "has_uscis_account",
    label: "Do you have a USCIS Online Account Number?",
    type: "radio",
    section: "Information About You (Petitioner)",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "uscis_account",
        pdfKey: "uscis_account",
        label: "What is your USCIS Online Account Number?",
        type: "text",
        section: "Information About You (Petitioner)",
        condition: (d) => d.has_uscis_account === "Yes",
        placeholder: "USCIS Account",
        maxLength: 12,
      },
    ],
  },
  {
    key: "has_ssn",
    label: "Do you have a U.S. Social Security Number?",
    type: "radio",
    section: "Information About You (Petitioner)",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "ssn",
        pdfKey: "ssn",
        label: "What is your U.S. Social Security Number?",
        type: "text",
        section: "Information About You (Petitioner)",
        condition: (d) => d.has_ssn === "Yes",
        placeholder: "SSN",
        maxLength: 9,
      },
    ],
  },

  // Full Name
  {
    key: "full_name_group",
    pdfKey: "N/A",
    label: "Provide your name details",
    type: "hidden",
    section: "Information About You (Petitioner)",
    subQuestions: [
      {
        key: "family_name",
        pdfKey: "family_name",
        label: "What is your last name?",
        type: "text",
        placeholder: "Last Name",
        maxLength: 35,
      },
      {
        key: "given_name",
        pdfKey: "given_name",
        label: "What is your first name?",
        type: "text",
        placeholder: "First Name",
        maxLength: 35,
      },
      {
        key: "middle_name",
        pdfKey: "middle_name",
        label: "What is your middle name?",
        type: "text",
        placeholder: "Middle Name",
        maxLength: 35,
      },
    ],
  },

  // Other Names Used
  {
    key: "has_other_names",
    label:
      "Have you ever used any other names (like a nickname or a name you had before you were married)?",
    type: "radio",
    section: "Information About You (Petitioner)",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "other_family_name",
        pdfKey: "other_family_name",
        label: "What was the other last name you used?",
        type: "text",
        section: "Information About You (Petitioner)",
        condition: (d) => d.has_other_names === "Yes",
      },
      {
        key: "other_given_name",
        pdfKey: "other_given_name",
        label: "What was the other first name you used?",
        type: "text",
        condition: (d) => d.has_other_names === "Yes",
      },
      {
        key: "other_middle_name",
        pdfKey: "other_middle_name",
        label: "What was the other middle name you used?",
        type: "text",
        condition: (d) => d.has_other_names === "Yes",
      },
    ],
  },

  // Birth Info
  {
    key: "city_of_birth",
    pdfKey: "city_of_birth",
    label: "In which city, town, or village were you born?",
    type: "text",
    section: "Information About You (Petitioner)",
  },
  {
    key: "country_of_birth",
    pdfKey: "country_of_birth",
    label: "In which country were you born?",
    type: "text",
    section: "Information About You (Petitioner)",
  },
  {
    key: "date_of_birth",
    pdfKey: "date_of_birth",
    label: "When is your birthday? (MM/DD/YYYY)",
    type: "date",
    section: "Information About You (Petitioner)",
    placeholder: "MM/DD/YYYY",
    maxLength: 10,
  },

  // Sex
  {
    key: "sex",
    pdfKey: "sex",
    label: "What is your sex?",
    type: "radio",
    section: "Information About You (Petitioner)",
    options: [
      { label: "Male", value: "Male", pdfKey: "sex_Male" },
      { label: "Female", value: "Female", pdfKey: "sex_Female" },
    ],
  },

  // Mailing Address
  {
    key: "has_another_mail",
    label: "Is there someone else's name on your mail?",
    type: "radio",
    pdfKey: "different_mail_name",
    section: "Mailing Address",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "current_in_care_of",
        label: "Please provide full name .",
        type: "text",
        pdfKey: "current_in_care_of",
        placeholder: "Full Name",
        condition: (d) => d.has_another_mail === "Yes",
      },
    ],
  },
  {
    key: "current_street",
    pdfKey: "current_street",
    label: "What is your current House Number and Street Name?",
    type: "text",
    section: "Mailing Address",
  },
  {
    key: "current_unit_type",
    pdfKey: "current_unit_type",
    label: "Is it an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Mailing Address",
    options: [
      { label: "Apt.", value: "Apt", pdfKey: "current_unit_type_Apt" },
      { label: "Ste.", value: "Ste", pdfKey: "current_unit_type_Ste" },
      { label: "Flr.", value: "Flr", pdfKey: "current_unit_type_Flr" },
    ],
  },
  {
    key: "current_unit_number",
    pdfKey: "current_unit_number",
    label: "What is your Room or Apartment Number?",
    type: "text",
    section: "Mailing Address",
  },
  {
    key: "current_city",
    pdfKey: "current_city",
    label: "What is your City or Town?",
    type: "text",
    section: "Mailing Address",
  },
  {
    key: "current_state",
    pdfKey: "current_state",
    label: "What is your State? (if you live in the U.S.)",
    type: "dropdown",
    isState: true,
    section: "Mailing Address",
    condition: (d) => !d.current_province,
  },
  {
    key: "current_zip",
    pdfKey: "current_zip",
    label: "What is the ZIP Code (if you live in the U.S.)",
    type: "text",
    section: "Mailing Address",
    maxLength: 5,
    condition: (d) => !d.current_postal_code,
  },
  {
    key: "current_province",
    pdfKey: "current_province",
    label: "What is your Province? (if you live outside the U.S.)",
    type: "text",
    section: "Mailing Address",
    condition: (d) => !d.current_state,
  },
  {
    key: "current_postal_code",
    pdfKey: "current_postal_code",
    label: "What is your Postal Code? (if you live outside the U.S.)",
    type: "text",
    section: "Mailing Address",
    condition: (d) => !d.current_zip,
  },
  {
    key: "current_country",
    pdfKey: "current_country",
    label: "What is your Country?",
    type: "text",
    section: "Mailing Address",
  },

  // ============================================
  // ADDRESS HISTORY
  // ============================================
  // {
  //   key: "address_history_note",
  //   pdfKey: "N/A",
  //   label:
  //     "Please tell us all the places you have lived in the last 5 years. Start with where you live right now, only if it's different from the mailing address you just gave us.",
  //   type: "hidden",
  //   section: "Address History",
  //   options: [{ label: "I understand", value: "ok", pdfKey: "N/A" }],
  // },

  // Address History

  {
    key: "same_mailing_address",
    pdfKey: "same_mailing_address",
    label: "Is the address where you live the same as the address where you get your mail?",
    type: "radio",
    section: "Address History",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "same_mailing_address_Yes" },
      { label: "No", value: "No", pdfKey: "same_mailing_address_No" },
    ],
    subQuestions: [
      {
        key: "address_history_note",
        pdfKey: "N/A",
        label: "Current Address",
        type: "hidden",
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No",
      },
      {
        key: "mailing_street",
        pdfKey: "mailing_street",
        label: "What is the physical House Number and Street Name?",
        type: "text",
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No",
      },
      {
        key: "mailing_unit_type",
        pdfKey: "mailing_unit_type",
        label: "Is it an Apartment, Suite, or Floor?",
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
        label: "What is the Room or Apartment Number?",
        type: "text",
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No",
      },
      {
        key: "mailing_city",
        pdfKey: "mailing_city",
        label: "In what city or town is this address located?",
        type: "text",
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No",
      },
      {
        key: "mailing_state",
        pdfKey: "mailing_state",
        label: "In what U.S. state is this address?",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No" && !d.mailing_province,
      },
      {
        key: "mailing_zip",
        pdfKey: "mailing_zip",
        label: "What is the ZIP Code? (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No" && !d.mailing_postal_code,
      },
      {
        key: "mailing_province",
        pdfKey: "mailing_province",
        label: "What is the Province? (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No" && !d.mailing_state,
      },
      {
        key: "mailing_postal_code",
        pdfKey: "mailing_postal_code",
        label: "What is the Postal Code? (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => d.same_mailing_address === "No" && !d.mailing_zip,
      },
      {
        key: "mailing_country",
        pdfKey: "mailing_country",
        label: "In what country is this address located?",
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
        label: "When did you move here?",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => d.same_mailing_address === "No",
      },
      {
        key: "current_address_to",
        pdfKey: "current_address_to",
        label: "When did you leave? (Write 'PRESENT' if you still live here)",
        type: "text",
        section: "Address History",
        placeholder: "PRESENT",
        condition: (d) => d.same_mailing_address === "No",
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS (Item 14)
  // ============================================
  {
    key: "address_count",
    pdfKey: "N/A",
    label:
      "How many other places have you lived in the last 5 years? (excluding your current address)",
    type: "text",
    section: "Address History",
    pattern: "[0-9]*",
    inputMode: "numeric",
    maxLength: 2,
    placeholder: "E.g. 1, 2, 3...",
  },
  {
    key: "address_history_note",
    pdfKey: "N/A",
    label: "Previous Address 1",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 1,
    subQuestions: [
      {
        key: "previous_street",
        pdfKey: "previous_street",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1,
      },
      {
        key: "previous_unit_type",
        pdfKey: "previous_unit_type",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "previous_unit_type_Apt" },
          { label: "Ste.", value: "Ste", pdfKey: "previous_unit_type_Ste" },
          { label: "Flr.", value: "Flr", pdfKey: "previous_unit_type_Flr" },
        ],
      },
      {
        key: "previous_unit_number",
        pdfKey: "previous_unit_number",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1,
      },
      {
        key: "previous_city",
        pdfKey: "previous_city",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1,
      },
      {
        key: "previous_state",
        pdfKey: "previous_state",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1 && !d.previous_province,
      },
      {
        key: "previous_zip",
        pdfKey: "previous_zip",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1 && !d.previous_postal_code,
      },
      {
        key: "previous_province",
        pdfKey: "previous_province",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1 && !d.previous_state,
      },
      {
        key: "previous_postal_code",
        pdfKey: "previous_postal_code",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1 && !d.previous_zip,
      },
      {
        key: "previous_country",
        pdfKey: "previous_country",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 1,
      },

      // ============================================
      // PREVIOUS ADDRESS DATES (Item 15)
      // ============================================
      {
        key: "previous_address_from",
        pdfKey: "previous_address_from",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 1,
      },
      {
        key: "previous_address_to",
        pdfKey: "previous_address_to",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 1,
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS 3
  // ============================================
  {
    key: "address_3_history_note",
    pdfKey: "N/A",
    label: "Previous Address 2",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 2,
    subQuestions: [
      {
        key: "address_3_street",
        pdfKey: "N/A",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2,
      },
      {
        key: "address_3_unit_type",
        pdfKey: "N/A",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "N/A" },
          { label: "Ste.", value: "Ste", pdfKey: "N/A" },
          { label: "Flr.", value: "Flr", pdfKey: "N/A" },
        ],
      },
      {
        key: "address_3_unit_number",
        pdfKey: "N/A",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2,
      },
      {
        key: "address_3_city",
        pdfKey: "N/A",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2,
      },
      {
        key: "address_3_state",
        pdfKey: "N/A",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2 && !d.address_3_province,
      },
      {
        key: "address_3_zip",
        pdfKey: "N/A",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2 && !d.address_3_postal_code,
      },
      {
        key: "address_3_province",
        pdfKey: "N/A",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2 && !d.address_3_state,
      },
      {
        key: "address_3_postal_code",
        pdfKey: "N/A",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2 && !d.address_3_zip,
      },
      {
        key: "address_3_country",
        pdfKey: "N/A",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 2,
      },
      {
        key: "address_3_from",
        pdfKey: "N/A",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 2,
      },
      {
        key: "address_3_to",
        pdfKey: "N/A",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 2,
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS 4
  // ============================================
  {
    key: "address_4_history_note",
    pdfKey: "N/A",
    label: "Previous Address 3",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 3,
    subQuestions: [
      {
        key: "address_4_street",
        pdfKey: "N/A",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3,
      },
      {
        key: "address_4_unit_type",
        pdfKey: "N/A",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "N/A" },
          { label: "Ste.", value: "Ste", pdfKey: "N/A" },
          { label: "Flr.", value: "Flr", pdfKey: "N/A" },
        ],
      },
      {
        key: "address_4_unit_number",
        pdfKey: "N/A",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3,
      },
      {
        key: "address_4_city",
        pdfKey: "N/A",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3,
      },
      {
        key: "address_4_state",
        pdfKey: "N/A",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3 && !d.address_4_province,
      },
      {
        key: "address_4_zip",
        pdfKey: "N/A",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3 && !d.address_4_postal_code,
      },
      {
        key: "address_4_province",
        pdfKey: "N/A",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3 && !d.address_4_state,
      },
      {
        key: "address_4_postal_code",
        pdfKey: "N/A",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3 && !d.address_4_zip,
      },
      {
        key: "address_4_country",
        pdfKey: "N/A",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 3,
      },
      {
        key: "address_4_from",
        pdfKey: "N/A",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 3,
      },
      {
        key: "address_4_to",
        pdfKey: "N/A",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 3,
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS 5
  // ============================================
  {
    key: "address_5_history_note",
    pdfKey: "N/A",
    label: "Previous Address 4",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 4,
    subQuestions: [
      {
        key: "address_5_street",
        pdfKey: "N/A",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4,
      },
      {
        key: "address_5_unit_type",
        pdfKey: "N/A",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "N/A" },
          { label: "Ste.", value: "Ste", pdfKey: "N/A" },
          { label: "Flr.", value: "Flr", pdfKey: "N/A" },
        ],
      },
      {
        key: "address_5_unit_number",
        pdfKey: "N/A",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4,
      },
      {
        key: "address_5_city",
        pdfKey: "N/A",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4,
      },
      {
        key: "address_5_state",
        pdfKey: "N/A",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4 && !d.address_5_province,
      },
      {
        key: "address_5_zip",
        pdfKey: "N/A",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4 && !d.address_5_postal_code,
      },
      {
        key: "address_5_province",
        pdfKey: "N/A",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4 && !d.address_5_state,
      },
      {
        key: "address_5_postal_code",
        pdfKey: "N/A",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4 && !d.address_5_zip,
      },
      {
        key: "address_5_country",
        pdfKey: "N/A",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 4,
      },
      {
        key: "address_5_from",
        pdfKey: "N/A",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 4,
      },
      {
        key: "address_5_to",
        pdfKey: "N/A",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 4,
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS 6
  // ============================================
  {
    key: "address_6_history_note",
    pdfKey: "N/A",
    label: "Previous Address 5",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 5,
    subQuestions: [
      {
        key: "address_6_street",
        pdfKey: "N/A",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5,
      },
      {
        key: "address_6_unit_type",
        pdfKey: "N/A",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "N/A" },
          { label: "Ste.", value: "Ste", pdfKey: "N/A" },
          { label: "Flr.", value: "Flr", pdfKey: "N/A" },
        ],
      },
      {
        key: "address_6_unit_number",
        pdfKey: "N/A",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5,
      },
      {
        key: "address_6_city",
        pdfKey: "N/A",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5,
      },
      {
        key: "address_6_state",
        pdfKey: "N/A",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5 && !d.address_6_province,
      },
      {
        key: "address_6_zip",
        pdfKey: "N/A",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5 && !d.address_6_postal_code,
      },
      {
        key: "address_6_province",
        pdfKey: "N/A",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5 && !d.address_6_state,
      },
      {
        key: "address_6_postal_code",
        pdfKey: "N/A",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5 && !d.address_6_zip,
      },
      {
        key: "address_6_country",
        pdfKey: "N/A",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 5,
      },
      {
        key: "address_6_from",
        pdfKey: "N/A",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 5,
      },
      {
        key: "address_6_to",
        pdfKey: "N/A",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 5,
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS 7
  // ============================================
  {
    key: "address_7_history_note",
    pdfKey: "N/A",
    label: "Previous Address 6",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 6,
    subQuestions: [
      {
        key: "address_7_street",
        pdfKey: "N/A",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6,
      },
      {
        key: "address_7_unit_type",
        pdfKey: "N/A",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "N/A" },
          { label: "Ste.", value: "Ste", pdfKey: "N/A" },
          { label: "Flr.", value: "Flr", pdfKey: "N/A" },
        ],
      },
      {
        key: "address_7_unit_number",
        pdfKey: "N/A",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6,
      },
      {
        key: "address_7_city",
        pdfKey: "N/A",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6,
      },
      {
        key: "address_7_state",
        pdfKey: "N/A",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6 && !d.address_7_province,
      },
      {
        key: "address_7_zip",
        pdfKey: "N/A",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6 && !d.address_7_postal_code,
      },
      {
        key: "address_7_province",
        pdfKey: "N/A",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6 && !d.address_7_state,
      },
      {
        key: "address_7_postal_code",
        pdfKey: "N/A",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6 && !d.address_7_zip,
      },
      {
        key: "address_7_country",
        pdfKey: "N/A",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 6,
      },
      {
        key: "address_7_from",
        pdfKey: "N/A",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 6,
      },
      {
        key: "address_7_to",
        pdfKey: "N/A",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 6,
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS 8
  // ============================================
  {
    key: "address_8_history_note",
    pdfKey: "N/A",
    label: "Previous Address 7",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 7,
    subQuestions: [
      {
        key: "address_8_street",
        pdfKey: "N/A",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7,
      },
      {
        key: "address_8_unit_type",
        pdfKey: "N/A",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "N/A" },
          { label: "Ste.", value: "Ste", pdfKey: "N/A" },
          { label: "Flr.", value: "Flr", pdfKey: "N/A" },
        ],
      },
      {
        key: "address_8_unit_number",
        pdfKey: "N/A",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7,
      },
      {
        key: "address_8_city",
        pdfKey: "N/A",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7,
      },
      {
        key: "address_8_state",
        pdfKey: "N/A",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7 && !d.address_8_province,
      },
      {
        key: "address_8_zip",
        pdfKey: "N/A",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7 && !d.address_8_postal_code,
      },
      {
        key: "address_8_province",
        pdfKey: "N/A",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7 && !d.address_8_state,
      },
      {
        key: "address_8_postal_code",
        pdfKey: "N/A",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7 && !d.address_8_zip,
      },
      {
        key: "address_8_country",
        pdfKey: "N/A",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 7,
      },
      {
        key: "address_8_from",
        pdfKey: "N/A",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 7,
      },
      {
        key: "address_8_to",
        pdfKey: "N/A",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 7,
      },
    ],
  },

  // ============================================
  // PREVIOUS PHYSICAL ADDRESS 9
  // ============================================
  {
    key: "address_9_history_note",
    pdfKey: "N/A",
    label: "Previous Address 8",
    type: "hidden",
    section: "Address History",
    condition: (d) => Number(d.address_count) >= 8,
    subQuestions: [
      {
        key: "address_9_street",
        pdfKey: "N/A",
        label: "House Number and Street Name",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8,
      },
      {
        key: "address_9_unit_type",
        pdfKey: "N/A",
        label: "Is it an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8,
        options: [
          { label: "Apt.", value: "Apt", pdfKey: "N/A" },
          { label: "Ste.", value: "Ste", pdfKey: "N/A" },
          { label: "Flr.", value: "Flr", pdfKey: "N/A" },
        ],
      },
      {
        key: "address_9_unit_number",
        pdfKey: "N/A",
        label: "Room or Apartment Number",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8,
      },
      {
        key: "address_9_city",
        pdfKey: "N/A",
        label: "City or Town",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8,
      },
      {
        key: "address_9_state",
        pdfKey: "N/A",
        label: "State (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8 && !d.address_9_province,
      },
      {
        key: "address_9_zip",
        pdfKey: "N/A",
        label: "ZIP Code (if in the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8 && !d.address_9_postal_code,
      },
      {
        key: "address_9_province",
        pdfKey: "N/A",
        label: "Province (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8 && !d.address_9_state,
      },
      {
        key: "address_9_postal_code",
        pdfKey: "N/A",
        label: "Postal Code (if outside the U.S.)",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8 && !d.address_9_zip,
      },
      {
        key: "address_9_country",
        pdfKey: "N/A",
        label: "Country",
        type: "text",
        section: "Address History",
        condition: (d) => Number(d.address_count) >= 8,
      },
      {
        key: "address_9_from",
        pdfKey: "N/A",
        label: "When did you move to this address? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 8,
      },
      {
        key: "address_9_to",
        pdfKey: "N/A",
        label: "When did you leave? (MM/DD/YYYY)",
        type: "date",
        section: "Address History",
        placeholder: "MM/DD/YYYY",
        condition: (d) => Number(d.address_count) >= 8,
      },
    ],
  },
  // ============================================
  // MARRIAGE INFORMATION
  // ============================================
  {
    key: "marital_status",
    pdfKey: "marital_status",
    label: "Which of these best describes you right now?",
    type: "radio",
    section: "Your Marital Information",
    options: [
      {
        label: "I have never been married",
        value: "Single",
        pdfKey: "marital_status_Single",
      },
      {
        label: "I am married",
        value: "Married",
        pdfKey: "marital_status_Married",
      },
      {
        label: "I am divorced (my marriage officially ended)",
        value: "Divorced",
        pdfKey: "marital_status_Divorced",
      },
      {
        label: "My husband or wife passed away (Widowed)",
        value: "Widowed",
        pdfKey: "marital_status_Widowed",
      },
      {
        label: "We are still married, but we live apart (Separated)",
        value: "Separated",
        pdfKey: "marital_status_Separated",
      },
      {
        label: "My marriage was officially canceled (Annulled)",
        value: "Annulled",
        pdfKey: "marital_status_Annulled",
      },
    ],
    subQuestions: [
      // ============================================
      // PAGE 3: SPOUSE & MARRIAGE DETAILS
      // ============================================
      {
        key: "number_of_marriages",
        pdfKey: "number_of_marriages",
        label: "How many times have you been married in your whole life?",
        type: "text",
        section: "Your Marital Information",
        maxLength: 2,
        pattern: "[0-9]*",
        inputMode: "numeric",
        condition: (d) => d.marital_status !== "Single",
      },
      {
        key: "spouse1_date_marriage",
        pdfKey: "Pt2Line18_DateOfMarriage",
        label: "When did you get married to your current husband or wife?",
        type: "date",
        section: "Your Marital Information",
        placeholder: "MM/DD/YYYY",
        condition: (d) => d.marital_status !== "Single",
      },
      {
        key: "spouse1_place_city",
        pdfKey: "Pt2Line19a_CityTown",
        label: "What city or town did you get married in?",
        type: "text",
        section: "Your Marital Information",
        condition: (d) => d.marital_status !== "Single",
      },
      {
        key: "spouse1_place_state",
        pdfKey: "Pt2Line19b_State",
        label: "What U.S. state did you get married in? (if in the U.S.)",
        type: "dropdown",
        isState: true,
        section: "Your Marital Information",
        condition: (d) => d.marital_status !== "Single",
      },
      {
        key: "spouse1_place_province",
        pdfKey: "Pt2Line19c_Province",
        label: "What province did you get married in? (if outside the U.S.)",
        type: "text",
        section: "Your Marital Information",
        condition: (d) => d.marital_status !== "Single",
      },
      {
        key: "spouse1_place_country",
        pdfKey: "Pt2Line19d_Country",
        label: "What country did you get married in?",
        type: "text",
        section: "Your Marital Information",
        condition: (d) => d.marital_status !== "Single",
      },

      // Spouse 1 Full Name
      {
        key: "spouse1_given_name",
        pdfKey: "Pt2Line20b_GivenName",
        label: "What is your current spouse's first name? (Spouse 1)",
        type: "text",
        section: "Your Marital Information",
        condition: (d) => d.marital_status !== "Single",
        subQuestions: [
          {
            key: "spouse1_family_name",
            pdfKey: "Pt2Line20a_FamilyName",
            label: "What is their last name?",
            type: "text",
            section: "Your Marital Information",
          },
          {
            key: "spouse1_middle_name",
            pdfKey: "Pt2Line20c_MiddleName",
            label: "What is their middle name? (If any)",
            type: "text",
            section: "Your Marital Information",
          },
        ],
      },
      {
        key: "spouse1_marriage_end_date",
        pdfKey: "Pt2Line21_DateMarriageEnded",
        label: "When did this marriage end? (Leave blank if you are still married)",
        type: "text",
        section: "Your Marital Information",
        placeholder: "MM/DD/YYYY",
        condition: (d) => d.marital_status !== "Single",
      },
    ],
  },

  // Spouse 2 (Previous Spouse)
  {
    key: "spouse2_given_name",
    pdfKey: "Pt2Line22b_GivenName",
    label: "What was your previous husband or wife's first name? (Spouse 2)",
    type: "text",
    section: "Your Marital Information",
    condition: getSpouseCondition(2),
  },
  {
    key: "spouse2_family_name",
    pdfKey: "Pt2Line22a_FamilyName",
    label: "What was their last name?",
    type: "text",
    section: "Your Marital Information",
    condition: getSpouseCondition(2),
  },
  {
    key: "spouse2_middle_name",
    pdfKey: "Pt2Line22c_MiddleName",
    label: "What was their middle name? (If any)",
    type: "text",
    section: "Your Marital Information",
    condition: getSpouseCondition(2),
  },
  {
    key: "spouse2_marriage_end_date",
    pdfKey: "Pt2Line23_DateMarriageEnded",
    label: "When did this marriage end?",
    type: "date",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
    condition: getSpouseCondition(2),
  },

  ...generatePriorSpousesFields(3, 8),

  // Parent 1
  {
    key: "parent1_family_name",
    pdfKey: "Pt2Line24_FamilyName",
    label: "What is your first parent's last name? (Parent 1)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_given_name",
    pdfKey: "Pt2Line24_GivenName",
    label: "What is your first parent's first name?",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_middle_name",
    pdfKey: "Pt2Line24_MiddleName",
    label: "What is their middle name? (If any)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_date_of_birth",
    pdfKey: "Pt2Line25_DateofBirth",
    label: "When was your first parent born?",
    type: "date",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "parent1_sex",
    pdfKey: "Pt2Line26",
    label: "What is your first parent's gender?",
    type: "radio",
    section: "Your Marital Information",
    options: [
      { label: "Male", value: "Male", pdfKey: "Pt2Line26_Male" },
      { label: "Female", value: "Female", pdfKey: "Pt2Line26_Female" },
    ],
  },

  // Parent 1 Residence
  {
    key: "parent1_country_birth",
    pdfKey: "Pt2Line27_CountryofBirth",
    label: "What country was your first parent born in?",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_city_residence",
    pdfKey: "Pt2Line28_CityTownOrVillageOfResidence",
    label: "What city or town do they live in now?",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent1_country_residence",
    pdfKey: "Pt2Line29_CountryOfResidence",
    label: "What country do they live in now?",
    type: "text",
    section: "Your Marital Information",
  },
  // Parent 2
  {
    key: "parent2_family_name",
    pdfKey: "Pt2Line30a_FamilyName",
    label: "What is your second parent's last name? (Parent 2)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent2_given_name",
    pdfKey: "Pt2Line30b_GivenName",
    label: "What is your second parent's first name?",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent2_middle_name",
    pdfKey: "Pt2Line30c_MiddleName",
    label: "What is their middle name? (If any)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent2_date_of_birth",
    pdfKey: "Pt2Line31_DateofBirth",
    label: "When was your second parent born?",
    type: "date",
    section: "Your Marital Information",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "parent2_sex",
    pdfKey: "Pt2Line32",
    label: "What is your second parent's gender?",
    type: "radio",
    section: "Your Marital Information",
    options: [
      { label: "Male", value: "Male", pdfKey: "Pt2Line32_Male" },
      { label: "Female", value: "Female", pdfKey: "Pt2Line32_Female" },
    ],
  },

  // Parent 2 Residence
  {
    key: "parent2_country_birth",
    pdfKey: "Pt2Line33_CountryofBirth",
    label: "What country was your second parent born in?",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent2_city_residence",
    pdfKey: "Pt2Line34_CityTownOrVillageOfResidence",
    label: "What city or town do they live in now?",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "parent2_country_residence",
    pdfKey: "Pt2Line35_CountryOfResidence",
    label: "What country do they live in now?",
    type: "text",
    section: "Your Marital Information",
  },

  // Citizenship Status
  {
    key: "citizenship_status",
    pdfKey: "Pt2Line36",
    label: "Are you a U.S. Citizen or a Green Card Holder?",
    type: "radio",
    section: "Your Marital Information",
    options: [
      {
        label: "I am a U.S. Citizen",
        value: "USCitizen",
        pdfKey: "Pt2Line36_USCitizen",
      },
      {
        label: "I am a Green Card Holder (Permanent Resident)",
        value: "LPR",
        pdfKey: "Pt2Line36_LPR",
      },
    ],
  },
  {
    key: "naturalization_certificate",
    pdfKey: "Pt2Line36",
    label:
      "Do you have a Certificate of Naturalization or Citizenship? (A paper proving you are a citizen)",
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
    label:
      "What is your Certificate Number? (This is usually printed in red on your Certificate of Naturalization or Citizenship)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "certificate_place",
    pdfKey: "Pt2Line37b_PlaceOfIssuance",
    label: "Where was this certificate given to you? (For example: Los Angeles, CA)",
    type: "text",
    section: "Your Marital Information",
  },
  {
    key: "certificate_date",
    pdfKey: "Pt2Line37c_DateOfIssuance",
    label: "When was this certificate issued to you? (For example: 01/15/2020)",
    type: "date",
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
    label:
      "What visa or status did you use to enter the U.S. last time? (For example: B2 for visitor, F1 for student, H1B for worker)",
    type: "text",
    section: "Your U.S. Entry Information",
    placeholder: "e.g. B2, F1, H1B",
  },
  {
    key: "date_of_admission",
    pdfKey: "Pt2Line40b_DateOfAdmission",
    label: "When did you last enter the U.S.? \n(For example: 05/20/2022)",
    type: "date",
    section: "Your U.S. Entry Information",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "city_of_admission",
    pdfKey: "Pt2Line40d_CityOrTown",
    label:
      "What U.S. city or town did you arrive in when you last entered the country? (For example: New York City)",
    type: "text",
    section: "Your U.S. Entry Information",
  },
  {
    key: "state_of_admission",
    pdfKey: "Pt2Line40e_State",
    label: "What U.S. state did you arrive in when you last entered the country?",
    type: "dropdown",
    isState: true, // ComboBox in PDF → use text or dropdown
    section: "Your U.S. Entry Information",
  },

  // ============================================
  // ITEM 41: CURRENT EMPLOYMENT ADDRESS (If different)
  // ============================================
  {
    key: "employment_different_address",
    pdfKey: "employment_different_address",
    label: "Is the address where you work different from the address where you live?",
    type: "radio",
    section: "Employment Information",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "Pt2Line41_Yes" },
      { label: "No", value: "No", pdfKey: "Pt2Line41_No" },
    ],
    subQuestions: [
      // Employment Address (Conditional)
      {
        key: "employment_street",
        pdfKey: "Pt2Line41_StreetNumberName",
        label: "What is the street address of your workplace? (For example: 123 Main St)",
        type: "text",
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
      },
      {
        key: "employment_unit_type",
        pdfKey: "employment_unit_type",
        label: "Is your workplace an Apartment, Suite, or Floor?",
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
        label:
          "What is the Apartment, Suite, or Floor number of your workplace? (For example: Suite 100)",
        type: "text",
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
      },
      {
        key: "employment_city",
        pdfKey: "Pt2Line41_CityOrTown",
        label: "What city or town do you work in? (For example: Seattle)",
        type: "text",
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
      },
      {
        key: "employment_state",
        pdfKey: "Pt2Line41_State",
        label: "What U.S. state do you work in?",
        type: "dropdown",
        isState: true,
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
      },
      {
        key: "employment_zip",
        pdfKey: "Pt2Line41_ZipCode",
        label: "What is the ZIP code of your workplace? (For example: 98101)",
        type: "text",
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
        maxLength: 5,
      },
      {
        key: "employment_province",
        pdfKey: "Pt2Line41_Province",
        label: "What province do you work in? (If outside the U.S., for example: Ontario)",
        type: "text",
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
      },
      {
        key: "employment_postal_code",
        pdfKey: "Pt2Line41_PostalCode",
        label:
          "What is the postal code of your workplace? (If outside the U.S., for example: M5H 2N2)",
        type: "text",
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
      },
      {
        key: "employment_country",
        pdfKey: "Pt2Line41_Country",
        label: "What country do you work in?",
        type: "text",
        section: "Employment Information",
        condition: (d) => d.employment_different_address === "Yes",
      },
    ],
  },

  // ============================================
  // ITEM 42-43: CURRENT EMPLOYMENT DETAILS
  // ============================================
  {
    key: "current_occupation",
    pdfKey: "Pt2Line42_Occupation",
    label: "What is your current job title? (For example: Teacher, Software Engineer, Manager)",
    type: "text",
    section: "Employment Information",
  },
  {
    key: "employment_start_date",
    pdfKey: "Pt2Line43a_DateFrom",
    label: "When did you start working at this job?",
    type: "date",
    section: "Employment Information",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "employment_end_date",
    pdfKey: "Pt2Line43b_DateTo",
    label: "When did you stop working here? (If you still work here, type 'PRESENT')",
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
    label: "What was the name of your previous employer or company?",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_employer_street",
    pdfKey: "Pt2Line45_StreetNumberName",
    label: "What was the street address of this previous job? (For example: 456 Broadway St)",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_unit_type",
    pdfKey: "previous_unit_type",
    label: "Was this workplace an Apartment, Suite, or Floor?",
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
    label: "What was the Apartment, Suite, or Floor number? (For example: Floor 2)",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_city",
    pdfKey: "Pt2Line45_CityOrTown",
    label: "What city or town was this job in? (For example: Chicago)",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_state",
    pdfKey: "Pt2Line45_State",
    label: "What U.S. state was this job in?",
    type: "dropdown",
    isState: true,
    section: "Previous Employment",
  },
  {
    key: "previous_zip",
    pdfKey: "Pt2Line45_ZipCode",
    label: "What was the ZIP code? (For example: 60601)",
    type: "text",
    section: "Previous Employment",
    maxLength: 5,
  },
  {
    key: "previous_province",
    pdfKey: "Pt2Line45_Province",
    label: "What province was this job in? (If outside the U.S.)",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_postal_code",
    pdfKey: "Pt2Line45_PostalCode",
    label: "What was the postal code? (If outside the U.S.)",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_country",
    pdfKey: "Pt2Line45_Country",
    label: "What country was this job in?",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_occupation",
    pdfKey: "Pt2Line46_Occupation",
    label: "What was your job title? (For example: Cashier, Nurse, Driver)",
    type: "text",
    section: "Previous Employment",
  },
  {
    key: "previous_employment_start",
    pdfKey: "Pt2Line47a_DateFrom",
    label: "When did you start working there?",
    type: "date",
    section: "Previous Employment",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "previous_employment_end",
    pdfKey: "Pt2Line47b_DateTo",
    label: "When did you stop working there?",
    type: "date",
    section: "Previous Employment",
    placeholder: "MM/DD/YYYY",
  },

  // ============================================
  // ITEM 48: ETHNICITY
  // ============================================
  {
    key: "ethnicity",
    pdfKey: "ethnicity",
    label: "Are you Hispanic or Latino?",
    type: "radio",
    section: "Physical Characteristics",
    options: [
      {
        label: "I am Hispanic or Latino",
        value: "hispanic",
        pdfKey: "Pt3Line1_Ethnicity[0]",
      },
      {
        label: "I am not Hispanic or Latino",
        value: "not_hispanic",
        pdfKey: "Pt3Line1_Ethnicity[1]",
      },
    ],
  },

  // ============================================
  // ITEM 49: RACE
  // ============================================
  {
    key: "race",
    pdfKey: "race",
    label: "What is your race? (You can choose more than one)",
    type: "checkbox",
    section: "Physical Characteristics",
    options: [
      { label: "White", value: "white", pdfKey: "Pt3Line2_Race_White" },
      { label: "Asian", value: "asian", pdfKey: "Pt3Line2_Race_Asian" },
      {
        label: "Black or African American",
        value: "black",
        pdfKey: "Pt3Line2_Race_Black",
      },
      {
        label: "American Indian or Alaska Native",
        value: "native",
        pdfKey: "Pt3Line2_Race_AmericanIndianAlaskaNative",
      },
      {
        label: "Native Hawaiian or Other Pacific Islander",
        value: "pacific",
        pdfKey: "Pt3Line2_Race_NativeHawaiianOtherPacificIslander",
      },
    ],
  },

  // ============================================
  // ITEM 50: HEIGHT
  // ============================================
  {
    key: "height_feet",
    pdfKey: "Pt3Line3_HeightFeet",
    label: "What is your height in Feet?",
    type: "text",
    section: "Physical Characteristics",
    placeholder: "5",
    maxLength: 5,
  },
  {
    key: "height_inches",
    pdfKey: "Pt3Line3_HeightInches",
    label: "What is your height in Inches?",
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
    label: "What is your weight? (in pounds)",
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
    label: "What is your eye color?",
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
      {
        label: "Unknown/Other",
        value: "other",
        pdfKey: "Pt3Line5_EyeColor[8]",
      },
    ],
  },

  // ============================================
  // PAGE 4: ADDITIONAL INFORMATION
  // ============================================
  {
    key: "Pt2Line40a_ClassOfAdmission",
    label:
      "What visa or status did you use to enter the U.S. last time? (For example: B2, F1, H1B)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line40a_ClassOfAdmission",
    placeholder: "e.g., B-2, F-1, etc.",
  },
  {
    key: "Pt2Line40b_DateOfAdmission",
    label: "When did you last enter the U.S.?",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line40b_DateOfAdmission",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "Pt2Line40d_CityOrTown",
    label: "What U.S. city or town did you arrive in when you last entered?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line40d_CityOrTown",
    placeholder: "City or Town",
  },
  {
    key: "Pt2Line40e_State",
    label: "What U.S. state did you arrive in when you last entered?",
    section: "Immigration & Employment Information",
    type: "dropdown",
    isState: true,
    pdfKey: "Pt2Line40e_State",
    placeholder: "State",
    maxLength: 2,
  },
  {
    key: "Pt2Line41_LPR",
    label:
      "Did you get your Green Card (lawful permanent resident status) through marriage to a U.S. citizen or Green Card holder?",
    section: "Immigration & Employment Information",
    type: "radio",
    pdfKey: "Pt2Line41",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "Pt2Line41_Yes" },
      { label: "No", value: "No", pdfKey: "Pt2Line41_No" },
    ],
  },
  {
    key: "Pt2Line40_EmployerOrCompName",
    label: "What is the name of your company? (Employer 1)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line40_EmployerOrCompName",
    placeholder: "Company name",
  },
  {
    key: "Pt2Line41_StreetNumberName",
    label: "What is the street address of Employer 1?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line41_StreetNumberName",
    placeholder: "Street address",
  },
  {
    key: "Pt2Line41_UnitType",
    label: "Is Employer 1 located in an Apartment, Suite, or Floor?",
    section: "Immigration & Employment Information",
    type: "radio",
    pdfKey: "Pt2Line41_UnitType",
    options: [
      { label: "Ste.", value: "ste", pdfKey: "Pt2Line41_Unit[1]" },
      { label: "Apt.", value: "apt", pdfKey: "Pt2Line41_Unit[0]" },
      { label: "Flr.", value: "flr", pdfKey: "Pt2Line41_Unit[2]" },
    ],
  },
  {
    key: "Pt2Line41_AptSteFlrNumber",
    label: "What is the Apartment, Suite, or Floor number? (Employer 1)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line41_AptSteFlrNumber",
    placeholder: "Number",
  },
  {
    key: "Pt2Line41_CityOrTown",
    label: "What city or town is Employer 1 in?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line41_CityOrTown",
    placeholder: "City",
  },
  {
    key: "Pt2Line41_State",
    label: "What state is Employer 1 in? (If in U.S.)",
    section: "Immigration & Employment Information",
    type: "dropdown",
    isState: true,
    pdfKey: "Pt2Line41_State",
    placeholder: "State",
    maxLength: 2,
  },
  {
    key: "Pt2Line41_ZipCode",
    label: "What is the ZIP code for Employer 1? (If in U.S.)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line41_ZipCode",
    placeholder: "ZIP",
    maxLength: 10,
  },
  {
    key: "Pt2Line41_Province",
    label: "What province is Employer 1 in? (If outside U.S.)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line41_Province",
    placeholder: "Province",
  },
  {
    key: "Pt2Line41_PostalCode",
    label: "What is the postal code for Employer 1? (If outside U.S.)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line41_PostalCode",
    placeholder: "Postal Code",
  },
  {
    key: "Pt2Line41_Country",
    label: "What country is Employer 1 in?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line41_Country",
    placeholder: "Country",
  },
  {
    key: "Pt2Line42_Occupation",
    label: "What is your current job title? (Employer 1)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line42_Occupation",
    placeholder: "Your occupation",
  },
  {
    key: "Pt2Line43a_DateFrom",
    label: "When did you start working at Employer 1?",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line43a_DateFrom",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "Pt2Line43b_DateTo",
    label: "When did you stop working at Employer 1? (Or type 'PRESENT' if you still work there)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line43b_DateTo",
    placeholder: "MM/DD/YYYY or PRESENT",
  },
  {
    key: "Pt2Line44_EmployerOrOrgName",
    label: "What is the name of your company? (Employer 2)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line44_EmployerOrOrgName",
    placeholder: "Company name",
  },
  {
    key: "Pt2Line45_StreetNumberName",
    label: "What is the street address of Employer 2?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_StreetNumberName",
    placeholder: "Street address",
  },
  {
    key: "Pt2Line45_UnitType",
    label: "Is Employer 2 located in an Apartment, Suite, or Floor?",
    section: "Immigration & Employment Information",
    type: "radio",
    pdfKey: "Pt2Line45_UnitType",
    options: [
      { label: "Ste.", value: "ste", pdfKey: "Pt2Line45_Unit[1]" },
      { label: "Apt.", value: "apt", pdfKey: "Pt2Line45_Unit[0]" },
      { label: "Flr.", value: "flr", pdfKey: "Pt2Line45_Unit[2]" },
    ],
  },
  {
    key: "Pt2Line45_AptSteFlrNumber",
    label: "What is the Apartment, Suite, or Floor number? (Employer 2)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_AptSteFlrNumber",
    placeholder: "Number",
  },
  {
    key: "Pt2Line45_CityOrTown",
    label: "What city or town is Employer 2 in?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_CityOrTown",
    placeholder: "City",
  },
  {
    key: "Pt2Line45_State",
    label: "What state is Employer 2 in? (If in U.S.)",
    section: "Immigration & Employment Information",
    type: "dropdown",
    isState: true,
    pdfKey: "Pt2Line45_State",
    placeholder: "State",
    maxLength: 2,
  },
  {
    key: "Pt2Line45_ZipCode",
    label: "What is the ZIP code for Employer 2? (If in U.S.)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_ZipCode",
    placeholder: "ZIP",
    maxLength: 10,
  },
  {
    key: "Pt2Line45_Province",
    label: "What province is Employer 2 in? (If outside U.S.)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_Province",
    placeholder: "Province",
  },
  {
    key: "Pt2Line45_PostalCode",
    label: "What is the postal code for Employer 2? (If outside U.S.)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_PostalCode",
    placeholder: "Postal Code",
  },
  {
    key: "Pt2Line45_Country",
    label: "What country is Employer 2 in?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line45_Country",
    placeholder: "Country",
  },
  {
    key: "Pt2Line46_Occupation",
    label: "What was your job title? (Employer 2)",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line46_Occupation",
    placeholder: "Your occupation",
  },
  {
    key: "Pt2Line47a_DateFrom",
    label: "When did you start working at Employer 2?",
    section: "Immigration & Employment Information",
    type: "date",
    pdfKey: "Pt2Line47a_DateFrom",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "Pt2Line47b_DateTo",
    label: "When did you stop working at Employer 2?",
    section: "Immigration & Employment Information",
    type: "text",
    pdfKey: "Pt2Line47b_DateTo",
    placeholder: "MM/DD/YYYY or PRESENT",
  },
  // ============================================
  // PART 3: BIOGRAPHIC INFORMATION
  // ============================================
  {
    key: "Pt3Line1_Ethnicity",
    label: "Are you Hispanic or Latino?",
    section: "Biographic Information",
    type: "radio",
    pdfKey: "Pt3Line1_Ethnicity",
    options: [
      {
        label: "I am Hispanic or Latino",
        value: "Hispanic",
        pdfKey: "Pt3Line1_Ethnicity[0]",
      },
      {
        label: "I am not Hispanic or Latino",
        value: "NotHispanic",
        pdfKey: "Pt3Line1_Ethnicity[1]",
      },
    ],
  },
  {
    key: "Pt3Line2_Race",
    pdfKey: "Pt3Line2_Race",
    label: "What is your race? (Select all that apply)",
    section: "Biographic Information",
    type: "checkbox",
    options: [
      {
        label: "White",
        value: "White",
        pdfKey: "Pt3Line2_Race_White",
      },
      {
        label: "Asian",
        value: "Asian",
        pdfKey: "Pt3Line2_Race_Asian",
      },
      {
        label: "Black or African American",
        value: "Black",
        pdfKey: "Pt3Line2_Race_Black",
      },
      {
        label: "American Indian or Alaska Native",
        value: "AmericanIndianAlaskaNative",
        pdfKey: "Pt3Line2_Race_AmericanIndianAlaskaNative",
      },
      {
        label: "Native Hawaiian or Other Pacific Islander",
        value: "NativeHawaiianOtherPacificIslander",
        pdfKey: "Pt3Line2_Race_NativeHawaiianOtherPacificIslander",
      },
    ],
  },
  {
    key: "Pt3Line3_HeightFeet",
    label: "What is your height in Feet?",
    section: "Biographic Information",
    type: "text",
    pdfKey: "Pt3Line3_HeightFeet",
    placeholder: "Feet",
    maxLength: 1,
  },
  {
    key: "Pt3Line3_HeightInches",
    label: "What is your height in Inches?",
    section: "Biographic Information",
    type: "text",
    pdfKey: "Pt3Line3_HeightInches",
    placeholder: "Inches",
    maxLength: 2,
  },
  {
    key: "Pt3Line5_EyeColor",
    label: "What is your eye color?",
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
      {
        label: "Unknown/Other",
        value: "Unknown",
        pdfKey: "Pt3Line5_EyeColor[8]",
      },
    ],
  },
  // =============================================
  // PAGE 5 - PART 3: Biographic Information
  // =============================================
  {
    key: "hairColor",
    label: "What is your hair color?",
    type: "radio",
    section: "Biographic Information",
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
      {
        label: "Unknown",
        value: "unknown",
        pdfKey: "Pt3Line6_HairColor_Unknown",
      },
    ],
  },

  // =============================================
  // PAGE 5 - PART 4: Information About Beneficiary
  // =============================================
  //
  // {
  //   key: "beneficiary_info",
  //   pdfKey: "N/A",
  //   label: "Information About Beneficiary",
  //   type: "hidden",
  //   section: "Information About Beneficiary",
  // },
  {
    key: "has_a_number_1",
    label: "Does the beneficiary have an Alien Registration Number (A-Number)?",
    type: "radio",
    section: "Information About Beneficiary",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "alienNumber",
        label: "What is the Alien Registration Number (A-Number)? (If the beneficiary has one)",
        type: "text",
        section: "Information About Beneficiary",
        pdfKey: "Pt4Line1_AlienNumber", // ← SHORT KEY
        placeholder: "A-XXXXXXXXX",
        maxLength: 9,
        condition: (d) => d.has_a_number_1 === "Yes",
      },
    ],
  },
  {
    key: "has_a_uscis_number",
    label: "Does the beneficiary have a USCIS Online Account Number?",
    type: "radio",
    section: "Information About Beneficiary",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "uscisOnlineNumber",
        label: "What is the USCIS Online Account Number? (If the beneficiary has one)",
        type: "text",
        section: "Information About Beneficiary",
        pdfKey: "Pt4Line2_USCISOnlineActNumber",
        placeholder: "USCIS Account Number",
        condition: (d) => d.has_a_uscis_number === "Yes",
        maxLength: 20,
      },
    ],
  },
  {
    key: "has_a_ssn_number",
    label: "Does the beneficiary have a U.S. Social Security Number?",
    type: "radio",
    section: "Information About Beneficiary",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "ssn",
        label: "What is the U.S. Social Security Number? (If the beneficiary has one)",
        type: "text",
        section: "Information About Beneficiary",
        pdfKey: "Pt4Line3_SSN",
        placeholder: "XXX-XX-XXXX",
        condition: (d) => d.has_a_ssn_number === "Yes",
        maxLength: 11,
      },
    ],
  },

  // Full Name
  {
    key: "familyName",
    label: "What is the Last Name (Family Name)?",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line4a_FamilyName",
    placeholder: "Last Name",
  },
  {
    key: "givenName",
    label: "What is the First Name (Given Name)?",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line4b_GivenName",
    placeholder: "First Name",
  },
  {
    key: "middleName",
    label: "What is the Middle Name? (Leave blank if none)",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line4c_MiddleName",
    placeholder: "Middle Name (if applicable)",
  },

  // Other Names Used
  {
    key: "otherFamilyName",
    label:
      "Has the beneficiary used any other Last Name? (For example: Maiden name. Leave blank if none)",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "P4Line5a_FamilyName",
  },
  {
    key: "otherGivenName",
    label: "Has the beneficiary used any other First Name? (Leave blank if none)",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line5b_GivenName",
  },
  {
    key: "otherMiddleName",
    label: "Has the beneficiary used any other Middle Name? (Leave blank if none)",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line5c_MiddleName",
  },

  // Birth Information
  {
    key: "cityOfBirth",
    label: "What city, town, or village was the beneficiary born in?",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line7_CityTownOfBirth",
  },
  {
    key: "countryOfBirth",
    label: "What country was the beneficiary born in?",
    type: "text",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line8_CountryOfBirth",
  },
  {
    key: "dateOfBirth",
    label: "When was the beneficiary born?",
    type: "date",
    section: "Information About Beneficiary",
    pdfKey: "Pt4Line9_DateOfBirth",
    placeholder: "MM/DD/YYYY",
  },

  // Gender
  {
    key: "gender",
    label: "What is the gender?",
    type: "radio",
    section: "Information About Beneficiary",
    pdfKey: "gender", // backend will handle via options
    options: [
      { label: "Male", value: "male", pdfKey: "Pt4Line9_Male" },
      { label: "Female", value: "female", pdfKey: "Pt4Line9_Female" },
    ],
  },

  // Ever in US?
  {
    key: "everInUS",
    pdfKey: "everInUS",
    label: "Has the beneficiary ever been in the United States?",
    type: "radio",
    section: "Information About Beneficiary",
    options: [
      { label: "Yes", value: "yes", pdfKey: "Pt4Line10_Yes" },
      { label: "No", value: "no", pdfKey: "Pt4Line10_No" },
      { label: "Unknown", value: "unknown", pdfKey: "Pt4Line10_Unknown" },
    ],
  },

  // Current Physical Address
  {
    key: "currentStreet",
    label: "What is the current street address? (For example: 123 Main St)",
    type: "text",
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_StreetNumberName",
  },
  {
    key: "currentUnitType",
    pdfKey: "currentUnitType",
    label: "Is the address an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Current Physical Address",
    options: [
      { label: "Ste.", value: "ste", pdfKey: "Pt4Line11_Unit_Ste" },
      { label: "Apt.", value: "apt", pdfKey: "Pt4Line11_Unit_Apt" },
      { label: "Flr.", value: "flr", pdfKey: "Pt4Line11_Unit_Flr" },
    ],
  },
  {
    key: "currentAptNumber",
    label: "What is the Apartment, Suite, or Floor number? (For example: Apt 4B)",
    type: "text",
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_AptSteFlrNumber",
  },
  {
    key: "currentCity",
    label: "What city or town does the beneficiary live in?",
    type: "text",
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_CityOrTown",
  },
  {
    key: "currentState",
    label: "What U.S. state does the beneficiary live in? (If applicable)",
    type: "dropdown",
    isState: true,
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_State",
  },
  {
    key: "currentZipCode",
    label: "What is the ZIP code? (If in the U.S.)",
    type: "text",
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_ZipCode",
    maxLength: 10,
  },
  {
    key: "currentProvince",
    label: "What province does the beneficiary live in? (If outside the U.S.)",
    type: "text",
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_Province",
  },
  {
    key: "currentPostalCode",
    label: "What is the postal code? (If outside the U.S.)",
    type: "text",
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_PostalCode",
  },
  {
    key: "currentCountry",
    label: "What country does the beneficiary live in?",
    type: "text",
    section: "Current Physical Address",
    pdfKey: "Pt4Line11_Country",
  },

  // Future Address (Intended US)
  {
    key: "futureStreet",
    label:
      "What is the street address where the beneficiary intends to live in the U.S.? (For example: 123 Main St)",
    type: "text",
    section: "Address Where Your Relative Intends to Live",
    pdfKey: "Pt4Line12a_StreetNumberName",
  },
  {
    key: "futureUnitType",
    pdfKey: "futureUnitType",
    label: "Is this intended address an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Address Where Your Relative Intends to Live",
    options: [
      { label: "Ste.", value: "ste", pdfKey: "Pt4Line12b_Unit_Ste" },
      { label: "Apt.", value: "apt", pdfKey: "Pt4Line12b_Unit_Apt" },
      { label: "Flr.", value: "flr", pdfKey: "Pt4Line12b_Unit_Flr" },
    ],
  },
  {
    key: "futureAptNumber",
    label: "What is the Apartment, Suite, or Floor number of this intended address?",
    type: "text",
    section: "Address Where Your Relative Intends to Live",
    pdfKey: "Pt4Line12b_AptSteFlrNumber",
  },
  {
    key: "futureCity",
    label: "What U.S. city or town does the beneficiary intend to live in?",
    type: "text",
    section: "Address Where Your Relative Intends to Live",
    pdfKey: "Pt4Line12c_CityOrTown",
  },
  {
    key: "futureState",
    label: "What U.S. state does the beneficiary intend to live in?",
    type: "dropdown",
    isState: true,
    section: "Address Where Your Relative Intends to Live",
    pdfKey: "Pt4Line12d_State",
  },
  {
    key: "futureZipCode",
    label: "What is the ZIP code of the intended address?",
    type: "text",
    section: "Address Where Your Relative Intends to Live",
    pdfKey: "Pt4Line12e_ZipCode",
    maxLength: 10,
  },

  // Foreign Address
  {
    key: "foreignStreet",
    label: "What is the street address abroad? (If the beneficiary lives outside the U.S.)",
    type: "text",
    section: "Address Abroad (if not immigrating to U.S.)",
    pdfKey: "Pt4Line13_StreetNumberName",
  },
  {
    key: "foreignUnitType",
    label: "Is this address an Apartment, Suite, or Floor?",
    pdfKey: "foreignUnitType",
    type: "radio",
    section: "Address Abroad (if not immigrating to U.S.)",
    options: [
      { label: "Ste.", value: "ste", pdfKey: "Pt4Line13_Unit_Ste" },
      { label: "Apt.", value: "apt", pdfKey: "Pt4Line13_Unit_Apt" },
      { label: "Flr.", value: "flr", pdfKey: "Pt4Line13_Unit_Flr" },
    ],
  },
  {
    key: "foreignAptNumber",
    label: "What is the Apartment, Suite, or Floor number of this address?",
    type: "text",
    section: "Address Abroad (if not immigrating to U.S.)",
    pdfKey: "Pt4Line13_AptSteFlrNumber",
  },
  {
    key: "foreignCity",
    label: "What city or town is this address in?",
    type: "text",
    section: "Address Abroad (if not immigrating to U.S.)",
    pdfKey: "Pt4Line13_CityOrTown",
  },
  {
    key: "foreignProvince",
    label: "What province is this address in?",
    type: "text",
    section: "Address Abroad (if not immigrating to U.S.)",
    pdfKey: "Pt4Line13_Province",
  },
  {
    key: "foreignPostalCode",
    label: "What is the postal code of this address?",
    type: "text",
    section: "Address Abroad (if not immigrating to U.S.)",
    pdfKey: "Pt4Line13_PostalCode",
  },
  {
    key: "foreignCountry",
    label: "What country is this address in?",
    type: "text",
    section: "Address Abroad (if not immigrating to U.S.)",
    pdfKey: "Pt4Line13_Country",
  },

  // Contact
  {
    key: "daytimePhone",
    label: "What is the beneficiary's daytime phone number?",
    type: "text",
    section: "Contact Information",
    pdfKey: "Pt4Line14_DaytimePhoneNumber",
  },

  // / PAGE 6 - PART 4: Continued (subform[5])

  {
    key: "mobilePhone",
    label: "What is the beneficiary's mobile phone number? (If the beneficiary has one)",
    type: "text",
    section: "Contact Information",
    pdfKey: "Pt4Line15_MobilePhoneNumber",
  },
  {
    key: "email",
    label: "What is the beneficiary's email address? (If the beneficiary has one)",
    type: "text",
    section: "Contact Information",
    pdfKey: "Pt4Line16_EmailAddress",
  },

  // Marital Status
  {
    key: "numberOfMarriages",
    label: "How many times has the beneficiary been married?",
    type: "text",
    section: "Marital Information",
    pdfKey: "Pt4Line17_NumberofMarriages",
    maxLength: 2,
  },
  {
    key: "maritalStatus",
    pdfKey: "maritalStatus",
    label: "What is the current marital status?",
    type: "radio",
    section: "Marital Information",
    options: [
      { label: "Married", value: "married", pdfKey: "Pt4Line18_Married" },
      { label: "Divorced", value: "divorced", pdfKey: "Pt4Line18_Divorced" },
      { label: "Widowed", value: "widowed", pdfKey: "Pt4Line18_Widowed" },
      {
        label: "Have never been married",
        value: "single",
        pdfKey: "Pt4Line18_Single",
      },
      {
        label: "Marriage was officially canceled (Annulled)",
        value: "annulled",
        pdfKey: "Pt4Line18_Annulled",
      },
      {
        label: "Legally separated",
        value: "separated",
        pdfKey: "Pt4Line18_LegallySeparated",
      },
    ],
  },

  // Current Spouse (if married)
  {
    key: "spouseFamilyName",
    label: "What is the husband's or wife's Last Name (Family Name)?",
    type: "text",
    section: "Current Spouse Information",
    pdfKey: "Pt4Line18a_FamilyName",
    condition: (d) => d.maritalStatus === "married",
    subQuestions: [
      {
        key: "spouseGivenName",
        label: "What is the husband's or wife's First Name (Given Name)?",
        type: "text",
        section: "Current Spouse Information",
        pdfKey: "Pt4Line18b_GivenName",
        condition: (d) => d.maritalStatus === "married",
      },
      {
        key: "spouseMiddleName",
        label: "What is the husband's or wife's Middle Name? (Leave blank if none)",
        type: "text",
        section: "Current Spouse Information",
        pdfKey: "Pt4Line18c_MiddleName",
        condition: (d) => d.maritalStatus === "married",
      },
    ],
  },
  {
    key: "dateOfMarriage",
    label: "When did the beneficiary get married?",
    type: "text",
    section: "Current Marriage Information",
    pdfKey: "Pt4Line19_DateOfMarriage",
    condition: (d) => d.maritalStatus === "married",
  },
  {
    key: "marriageCity",
    label: "In what city or town did the beneficiary get married?",
    type: "text",
    section: "Current Marriage Information",
    pdfKey: "Pt4Line20a_CityTown",
    condition: (d) => d.maritalStatus === "married",
  },
  {
    key: "marriageState",
    label: "In what U.S. state did the beneficiary get married? (If applicable)",
    type: "dropdown",
    isState: true,
    section: "Current Marriage Information",
    pdfKey: "Pt4Line20b_State",
    condition: (d) => d.maritalStatus === "married",
  },
  {
    key: "marriageProvince",
    label: "In what province did the beneficiary get married? (If outside the U.S.)",
    type: "text",
    section: "Current Marriage Information",
    pdfKey: "Pt4Line20c_Province",
    condition: (d) => d.maritalStatus === "married",
  },
  {
    key: "marriageCountry",
    label: "In what country did the beneficiary get married?",
    type: "text",
    section: "Current Marriage Information",
    pdfKey: "Pt4Line20d_Country",
    condition: (d) => d.maritalStatus === "married",
  },

  // Prior Spouse
  {
    key: "note",
    label:
      "Provide information on the beneficiary's current husband or wife (if the beneficiary is married) first, and then list all previous ones.",
    type: "hidden",
    section: "Names of Prior Spouses",
  },
  {
    key: "note",
    label: "Spouse 1",
    type: "hidden",
    section: "Names of Prior Spouses",
  },
  {
    key: "priorSpouseFamilyName",
    label: "What was the Last Name of the previous husband or wife?",
    type: "text",
    section: "Names of Prior Spouses",
    pdfKey: "Pt4Line16a_FamilyName",
    condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
    subQuestions: [
      {
        key: "priorSpouseGivenName",
        label: "What was the First Name of the previous husband or wife?",
        type: "text",
        section: "Names of Prior Spouses",
        pdfKey: "Pt4Line16b_GivenName",
        condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
      },
      {
        key: "priorSpouseMiddleName",
        label: "What was the Middle Name of the previous husband or wife? (Leave blank if none)",
        type: "text",
        section: "Names of Prior Spouses",
        pdfKey: "Pt4Line16c_MiddleName",
        condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
      },
    ],
  },
  {
    key: "priorMarriageEndDate",
    label: "When did this previous marriage end?",
    type: "text",
    section: "Names of Prior Spouses",
    pdfKey: "Pt4Line17_DateMarriageEnded",
    condition: (d) => parseInt(d.numberOfMarriages || "0") > 1,
  },

  // page 7
  // // Person 4
  // {
  //   key: "beneficiary_familyName",
  //   label: "What is the Last Name (Family Name)?",
  //   type: "text",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "Pt4Line42a_FamilyName",
  //   placeholder: "Last Name",
  // },
  // {
  //   key: "beneficiary_givenName",
  //   label: "What is the First Name (Given Name)?",
  //   type: "text",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "Pt4Line42b_GivenName",
  //   placeholder: "First Name",
  // },
  // {
  //   key: "beneficiary_middleName",
  //   label: "What is the Middle Name? (Leave blank if none)",
  //   type: "text",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "Pt4Line42c_MiddleName",
  //   placeholder: "Middle Name (if any)",
  // },

  // // 38. Relationship
  // {
  //   key: "beneficiary_relationship",
  //   label:
  //     "How is this person related to the family member you are helping? (Like a husband, wife, or child)",
  //   type: "text",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "Pt4Line43_Relationship",
  //   placeholder: "e.g., Spouse, Child",
  // },

  // // 39. Date of Birth
  // {
  //   key: "beneficiary_dateOfBirth",
  //   label: "When was this person born?",
  //   type: "date",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "Pt4Line44_DateOfBirth",
  //   placeholder: "MM/DD/YYYY",
  // },

  // // 40. Country of Birth
  // {
  //   key: "beneficiary_countryOfBirth",
  //   label: "What country was this person born in?",
  //   type: "text",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "Pt4Line45_CountryOfBirth",
  //   placeholder: "Country Name",
  // },

  // 41-44: Another Family Member (Spouse/Child)

  {
    key: "note",
    label: "Now, let's list the husband, wife, and children of the family member you are helping.",
    type: "hidden",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "",
  },
  {
    key: "note",
    label: "First Person",
    type: "hidden",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "",
  },
  {
    key: "beneficiary_p1_familyName",
    label: "What is their Last Name (Family Name)?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line30a_FamilyName",
    placeholder: "Last Name",
    subQuestions: [
      {
        key: "beneficiary_p1_givenName",
        label: "What is their First Name (Given Name)?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line30b_GivenName",
        placeholder: "First Name",
      },
      {
        key: "beneficiary_p1_middleName",
        label: "What is their Middle Name? (Leave blank if none)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line30c_MiddleName",
        placeholder: "Middle Name",
      },
    ],
  },
  {
    key: "beneficiary_p1_relationship",
    label:
      "How is this person related to the family member you are helping? (Like a husband, wife, or child)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line31_Relationship",
    placeholder: "e.g., Spouse, Child",
  },
  {
    key: "beneficiary_p1_dateOfBirth",
    label: "When were they born?",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line32_DateOfBirth",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "beneficiary_p1_countryOfBirth",
    label: "What country were they born in?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line49_CountryOfBirth",
    placeholder: "Country Name",
  },
  {
    key: "note",
    label: "Second Person",
    type: "hidden",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "",
  },
  {
    key: "beneficiary_p2_familyName",
    label: "What is their Last Name (Family Name)?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line34a_FamilyName",
    placeholder: "Last Name",
    subQuestions: [
      {
        key: "beneficiary_p2_givenName",
        label: "What is their First Name (Given Name)?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line34b_GivenName",
        placeholder: "First Name",
      },
      {
        key: "beneficiary_p2_middleName",
        label: "What is their Middle Name? (Leave blank if none)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line34c_MiddleName",
        placeholder: "Middle Name",
      },
    ],
  },
  {
    key: "beneficiary_p2_relationship",
    label:
      "How is this person related to the family member you are helping? (Like a husband, wife, or child)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line35_Relationship",
    placeholder: "e.g., Spouse, Child",
  },
  {
    key: "beneficiary_p2_dateOfBirth",
    label: "When were they born?",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line48_DateOfBirth",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "beneficiary_p2_countryOfBirth",
    label: "What country were they born in?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line37_CountryOfBirth",
    placeholder: "Country Name",
  },
  {
    key: "note",
    label: "Third Person",
    type: "hidden",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "",
  },
  {
    key: "beneficiary_p3_familyName",
    label: "What is their Last Name (Family Name)?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line38a_FamilyName",
    placeholder: "Last Name",
    subQuestions: [
      {
        key: "beneficiary_p3_givenName",
        label: "What is their First Name (Given Name)?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line38b_GivenName",
        placeholder: "First Name",
      },
      {
        key: "beneficiary_p3_middleName",
        label: "What is their Middle Name? (Leave blank if none)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line38c_MiddleName",
        placeholder: "Middle Name",
      },
    ],
  },
  {
    key: "beneficiary_p3_relationship",
    label:
      "How is this person related to the family member you are helping? (Like a husband, wife, or child)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line39_Relationship",
    placeholder: "e.g., Spouse, Child",
  },
  {
    key: "beneficiary_p3_dateOfBirth",
    label: "When were they born?",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line40_DateOfBirth",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "beneficiary_p3_countryOfBirth",
    label: "What country were they born in?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line41_CountryOfBirth",
    placeholder: "Country Name",
  },
  {
    key: "note",
    label: "Fourth Person",
    type: "hidden",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "",
  },
  {
    key: "beneficiary_p4_familyName",
    label: "What is their Last Name (Family Name)?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line42a_FamilyName",
    placeholder: "Last Name",
    subQuestions: [
      {
        key: "beneficiary_p4_givenName",
        label: "What is their First Name (Given Name)?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line42b_GivenName",
        placeholder: "First Name",
      },
      {
        key: "beneficiary_p4_middleName",
        label: "What is their Middle Name? (Leave blank if none)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line42c_MiddleName",
        placeholder: "Middle Name",
      },
    ],
  },
  {
    key: "beneficiary_p4_relationship",
    label:
      "How is this person related to the family member you are helping? (Like a husband, wife, or child)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line43_Relationship",
    placeholder: "e.g., Spouse, Child",
  },
  {
    key: "beneficiary_p4_dateOfBirth",
    label: "When were they born?",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line44_DateOfBirth",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "beneficiary_p4_countryOfBirth",
    label: "What country were they born in?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line45_CountryOfBirth",
    placeholder: "Country Name",
  },
  {
    key: "note",
    label: "Fifth Person",
    type: "hidden",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "",
  },
  {
    key: "beneficiary_p5_familyName",
    label: "What is their Last Name (Family Name)?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line46a_FamilyName",
    placeholder: "Last Name",
    subQuestions: [
      {
        key: "beneficiary_p5_givenName",
        label: "What is their First Name (Given Name)?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line46b_GivenName",
        placeholder: "First Name",
      },
      {
        key: "beneficiary_p5_middleName",
        label: "What is their Middle Name? (Leave blank if none)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line46c_MiddleName",
        placeholder: "Middle Name",
      },
    ],
  },
  {
    key: "beneficiary_p5_relationship",
    label:
      "How is this person related to the family member you are helping? (Like a husband, wife, or child)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line47_Relationship",
    placeholder: "e.g., Spouse, Child",
  },
  {
    key: "beneficiary_p5_dateOfBirth",
    label: "When were they born?",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line48_DateOfBirth",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "beneficiary_p5_countryOfBirth",
    label: "What country were they born in?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line49_CountryOfBirth",
    placeholder: "Country Name",
  },

  // 45. Ever in US?
  {
    key: "beneficiary_everInUS",
    label: "Has the family member you are helping EVER been inside the United States?",
    type: "radio",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "beneficiary_everInUS",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "Pt4Line20_Yes" },
      { label: "No", value: "No", pdfKey: "Pt4Line20_No" },
    ],
    subQuestions: [
      {
        key: "beneficiary_classOfAdmission",
        label:
          "When your family member last came to the U.S., what was the beneficiary's status? (Like a visitor or student)",
        type: "select",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line21a_ClassOfAdmission",
        placeholder: "Select Class of Admission",
        options: [
          // Existing options
          {
            label: "1B1 - H1B1 – Specialty Occupation",
            value: "1B1 - H1B1 – Specialty Occupation",
          },
          { label: "1B2 - H1B2 – DOD Worker", value: "1B2 - H1B2 – DOD Worker" },
          { label: "1B3 - H1B3 – 55Fashion Model", value: "1B3 - H1B3 – 55Fashion Model" },
          {
            label: "1B4 - H1B4 – Unique PGM ARTIST-ENT",
            value: "1B4 - H1B4 – Unique PGM ARTIST-ENT",
          },
          { label: "1B3 - H1B3 – Alien Athlethe", value: "1B3 - H1B3 – Alien Athlethe" },
          { label: "1BS - Support Person of H1", value: "1BS - Support Person of H1" },
          { label: "A1 – AMBASSADOR, DIPLOMAT", value: "A1 – AMBASSADOR, DIPLOMAT" },
          { label: "A2 –Other diplomatic officials", value: "A2 –Other diplomatic officials" },
          { label: "A3 – ATTENDANT OF A1, A2", value: "A3 – ATTENDANT OF A1, A2" },
          { label: "AS _ Asylum", value: "AS _ Asylum" },
          { label: "ASD - Asylum Status Denied", value: "ASD - Asylum Status Denied" },
          { label: "AW - Raw Applied for at a port", value: "AW - Raw Applied for at a port" },
          {
            label: "B1 - TEMPORARY VISITOR FOR BUSINESS",
            value: "B1 - TEMPORARY VISITOR FOR BUSINESS",
          },
          {
            label: "B1A - NI PERSNL-DOM SRVANT OF NI EMP",
            value: "B1A - NI PERSNL-DOM SRVANT OF NI EMP",
          },
          { label: "B1B - NI DOMESTIC SERVANT OF USC", value: "B1B - NI DOMESTIC SERVANT OF USC" },
          {
            label: "B1C - NI EMPLOYED BY FOREIGN AIRLINE",
            value: "B1C - NI EMPLOYED BY FOREIGN AIRLINE",
          },
          { label: "B1D - NI - MISSIONARIES", value: "B1D - NI - MISSIONARIES" },
          {
            label: "B2 - TEMPORARY VISITOR FOR PLEASURE",
            value: "B2 - TEMPORARY VISITOR FOR PLEASURE",
          },
          { label: "BE - BERING STRAIT ENTRIES", value: "BE - BERING STRAIT ENTRIES" },
          {
            label: "C1 - ALIEN IN TRANSIT THROUGH U.S.",
            value: "C1 - ALIEN IN TRANSIT THROUGH U.S.",
          },
          { label: "C2 - ALIEN IN TRANSIT TO UN HQ", value: "C2 - ALIEN IN TRANSIT TO UN HQ" },
          {
            label: "C3 - FRN GOV OFF IN TRANSIT THRU US",
            value: "C3 - FRN GOV OFF IN TRANSIT THRU US",
          },
          { label: "C4 - TRANSIT WITHOUT A VISA", value: "C4 - TRANSIT WITHOUT A VISA" },
          {
            label: "CC - CUBAN MASS MIGRATION PROJECT",
            value: "CC - CUBAN MASS MIGRATION PROJECT",
          },
          {
            label: "CH - PAROLEE (HUMANITARIAN-HQ AUTH)",
            value: "CH - PAROLEE (HUMANITARIAN-HQ AUTH)",
          },
          {
            label: "CW1 - PRINCIPAL TRANSITIONAL WORKERS",
            value: "CW1 - PRINCIPAL TRANSITIONAL WORKERS",
          },
          { label: "CW2 - DEPENDENT OF CW1", value: "CW2 - DEPENDENT OF CW1" },
          {
            label: "D1 - ALIEN CREW DEPART SAME VESSEL",
            value: "D1 - ALIEN CREW DEPART SAME VESSEL",
          },
          {
            label: "D2 - ALIEN CREW DEPART OTHER VESSEL",
            value: "D2 - ALIEN CREW DEPART OTHER VESSEL",
          },
          {
            label: "DA - ADVANCE PAROLE (DISTRICT AUTH)",
            value: "DA - ADVANCE PAROLE (DISTRICT AUTH)",
          },
          {
            label: "DE - PAROLEE (DEFERRED INSPECTION)",
            value: "DE - PAROLEE (DEFERRED INSPECTION)",
          },
          { label: "DT - PAROLEE (DISTRICT-POE AUTH)", value: "DT - PAROLEE (DISTRICT-POE AUTH)" },
          {
            label: "DX - CREW ARRIVING DETAINED ON SHIP",
            value: "DX - CREW ARRIVING DETAINED ON SHIP",
          },
          {
            label: "E1 - TREATY TRADER-SPOUSE-CHILDREN",
            value: "E1 - TREATY TRADER-SPOUSE-CHILDREN",
          },
          {
            label: "E2 - TREATY INVESTOR-SPOUSE-CHILD",
            value: "E2 - TREATY INVESTOR-SPOUSE-CHILD",
          },
          { label: "E2C - CNMI INVESTOR", value: "E2C - CNMI INVESTOR" },
          {
            label: "E3 - AUSTRALIA FREE TRADE AGREEMENT",
            value: "E3 - AUSTRALIA FREE TRADE AGREEMENT",
          },
          { label: "EAO - EMPLOYMENT ADVISORY OPTION", value: "EAO - EMPLOYMENT ADVISORY OPTION" },
          { label: "EWI - ENTRY WITHOUT INSPECTION", value: "EWI - ENTRY WITHOUT INSPECTION" },
          { label: "F1 - STUDENT - ACADEMIC", value: "F1 - STUDENT - ACADEMIC" },
          { label: "F2 - SPOUSE-CHILD OF F-1", value: "F2 - SPOUSE-CHILD OF F-1" },
          {
            label: "FSM - CFA ADM FED STATES MICRONESIA",
            value: "FSM - CFA ADM FED STATES MICRONESIA",
          },
          { label: "FUG - FAMILY UNITY GRANTED", value: "FUG - FAMILY UNITY GRANTED" },
          { label: "G1 - PRINCIPAL REP. FOREIGN GOVT", value: "G1 - PRINCIPAL REP. FOREIGN GOVT" },
          { label: "G2 - OTHER REP FOREIGN GOVT", value: "G2 - OTHER REP FOREIGN GOVT" },
          {
            label: "G3 - REP NON-RECOGNIZED FOREIGN GOV",
            value: "G3 - REP NON-RECOGNIZED FOREIGN GOV",
          },
          { label: "G4 - OFFICER-EMPLOYEE INTL. ORG.", value: "G4 - OFFICER-EMPLOYEE INTL. ORG." },
          {
            label: "G5 - ATTENDANTS OF G1, G2, G3, G4",
            value: "G5 - ATTENDANTS OF G1, G2, G3, G4",
          },
          {
            label: "GB - VISITOR WITHOUT A VISA 15 DAYS",
            value: "GB - VISITOR WITHOUT A VISA 15 DAYS",
          },
          {
            label: "GT - VISITOR WITHOUT A VISA 15 DAYS",
            value: "GT - VISITOR WITHOUT A VISA 15 DAYS",
          },
          {
            label: "H1 - ALIEN OF DIST MERIT & ABILITY",
            value: "H1 - ALIEN OF DIST MERIT & ABILITY",
          },
          { label: "H1A - REGISTERED NURSE", value: "H1A - REGISTERED NURSE" },
          { label: "H1B - SPECIALITY OCCUPATION", value: "H1B - SPECIALITY OCCUPATION" },
          { label: "H1C - NURSE RELIEF", value: "H1C - NURSE RELIEF" },
          {
            label: "H2 - TEMPORARY LABOR CERTIFICATION",
            value: "H2 - TEMPORARY LABOR CERTIFICATION",
          },
          {
            label: "H2A - TEMPORARY AGRICULTURAL WORKER",
            value: "H2A - TEMPORARY AGRICULTURAL WORKER",
          },
          { label: "H2B - TEMPORARY NON-AG WORKER", value: "H2B - TEMPORARY NON-AG WORKER" },
          {
            label: "H2R - RET(H2B)WRKR NOT SUBJCT TO CAP",
            value: "H2R - RET(H2B)WRKR NOT SUBJCT TO CAP",
          },
          { label: "H3 - ALIEN TRAINEE", value: "H3 - ALIEN TRAINEE" },
          { label: "H3A - TRAINEE", value: "H3A - TRAINEE" },
          { label: "H3B - SPECIAL EDUCATION TRAINING", value: "H3B - SPECIAL EDUCATION TRAINING" },
          {
            label: "H4 - SPS OR CHLD OF H1,H2,H3 OR H2R",
            value: "H4 - SPS OR CHLD OF H1,H2,H3 OR H2R",
          },
          { label: "HSC - FREE TRADE H1B1", value: "HSC - FREE TRADE H1B1" },
          { label: "I - FOREIGN PRESS", value: "I - FOREIGN PRESS" },
          { label: "IMM - IMMIGRANT", value: "IMM - IMMIGRANT" },
          { label: "IN - INDEFINITE PAROLE", value: "IN - INDEFINITE PAROLE" },
          { label: "J1 - EXCHANGE VISITOR - OTHERS", value: "J1 - EXCHANGE VISITOR - OTHERS" },
          { label: "J1S - EXCHANGE VISITOR - STUDENT", value: "J1S - EXCHANGE VISITOR - STUDENT" },
          { label: "J2 - SPOUSE-CHILD OF J-1", value: "J2 - SPOUSE-CHILD OF J-1" },
          { label: "J2S - SPOUSE-CHILD OF J-1S", value: "J2S - SPOUSE-CHILD OF J-1S" },
          { label: "K1 - ALIEN FIANCE(E) OF USC", value: "K1 - ALIEN FIANCE(E) OF USC" },
          { label: "K2 - CHILD OF K1", value: "K2 - CHILD OF K1" },
          { label: "K3 - SPOUSE OF USC", value: "K3 - SPOUSE OF USC" },
          { label: "K4 - CHILD OF USC", value: "K4 - CHILD OF USC" },
          { label: "L1 - INTRA-COMPANY TRANSFEREE", value: "L1 - INTRA-COMPANY TRANSFEREE" },
          { label: "L1A - MANAGER OR EXECUTIVE", value: "L1A - MANAGER OR EXECUTIVE" },
          {
            label: "L1B - SPECIALIZED KNOWLEDGE ALIEN",
            value: "L1B - SPECIALIZED KNOWLEDGE ALIEN",
          },
          { label: "L2 - SPOUSE-CHILD OF L-1", value: "L2 - SPOUSE-CHILD OF L-1" },
          { label: "LZ - BLANKET L PETITION", value: "LZ - BLANKET L PETITION" },
          {
            label: "M1 - STUDENT - VOCATIONAL-NON-ACAD.",
            value: "M1 - STUDENT - VOCATIONAL-NON-ACAD.",
          },
          { label: "M2 - SPOUSE-CHILD OF M-1", value: "M2 - SPOUSE-CHILD OF M-1" },
          {
            label: "MIS - CFA ADM REP MARSHALL ISLANDS",
            value: "MIS - CFA ADM REP MARSHALL ISLANDS",
          },
          {
            label: "ML - PAROLEE-MEDICAL, LEGAL, HUMAN",
            value: "ML - PAROLEE-MEDICAL, LEGAL, HUMAN",
          },
          {
            label: "N1 - PRINCIPAL REP. OF NATO MEMBER",
            value: "N1 - PRINCIPAL REP. OF NATO MEMBER",
          },
          { label: "N2 - OTHER REP. OF NATO MEMBER", value: "N2 - OTHER REP. OF NATO MEMBER" },
          { label: "N3 - CLERICAL STAFF FOR N-1, N-2", value: "N3 - CLERICAL STAFF FOR N-1, N-2" },
          { label: "N4 - OFFICIALS OF NATO", value: "N4 - OFFICIALS OF NATO" },
          { label: "N5 - EXPERTS EMPLOYED BY NATO", value: "N5 - EXPERTS EMPLOYED BY NATO" },
          { label: "N6 - CIVILIAN COMPONENT OF NATO", value: "N6 - CIVILIAN COMPONENT OF NATO" },
          {
            label: "N7 - ATTENDANTS OF N-1 THROUGH N-6",
            value: "N7 - ATTENDANTS OF N-1 THROUGH N-6",
          },
          {
            label: "N8 - PARENT OF SPEC IMMIGRANT CHILD",
            value: "N8 - PARENT OF SPEC IMMIGRANT CHILD",
          },
          { label: "N9 - SPOUSE-CHILD OF N8", value: "N9 - SPOUSE-CHILD OF N8" },
          {
            label: "O1 - ALIEN W-EXTRAORDINARY ABILITY",
            value: "O1 - ALIEN W-EXTRAORDINARY ABILITY",
          },
          {
            label: "O1A - EXTRAORDINARY ALIEN - NON-ARTS",
            value: "O1A - EXTRAORDINARY ALIEN - NON-ARTS",
          },
          {
            label: "O1B - EXTRAORDINARY ALIEN IN ARTS",
            value: "O1B - EXTRAORDINARY ALIEN IN ARTS",
          },
          { label: "O2 - ACCOMPANYING ALIEN TO O1", value: "O2 - ACCOMPANYING ALIEN TO O1" },
          { label: "O3 - SPOUSE-CHILD OF O-1, O-2", value: "O3 - SPOUSE-CHILD OF O-1, O-2" },
          {
            label: "OP - PAROLEE (OVERSEAS AUTHORIZED)",
            value: "OP - PAROLEE (OVERSEAS AUTHORIZED)",
          },
          { label: "P1 - ATHLETE OR ENTERTAINER", value: "P1 - ATHLETE OR ENTERTAINER" },
          { label: "P1A - ALIEN WITH ATHLETIC EVENT", value: "P1A - ALIEN WITH ATHLETIC EVENT" },
          {
            label: "P1B - ALIEN WITH ENTERTAINMENT GROUP",
            value: "P1B - ALIEN WITH ENTERTAINMENT GROUP",
          },
          { label: "P1S - SUPPORT PERSON OF P-1", value: "P1S - SUPPORT PERSON OF P-1" },
          { label: "P2 - EXHANGE ARTIST-ENTERTAINER", value: "P2 - EXHANGE ARTIST-ENTERTAINER" },
          { label: "P2S - SUPPORT PERSON OF P-2", value: "P2S - SUPPORT PERSON OF P-2" },
          {
            label: "P3 - UNIQUE PGM ARTIST-ENTERTAINER",
            value: "P3 - UNIQUE PGM ARTIST-ENTERTAINER",
          },
          { label: "P3S - SUPPORT PERSON OF P-3", value: "P3S - SUPPORT PERSON OF P-3" },
          {
            label: "P4 - SPOUSE-CHILD OF P-1, P-2, P-3",
            value: "P4 - SPOUSE-CHILD OF P-1, P-2, P-3",
          },
          { label: "PAL - CFA ADMISSION PALAU", value: "PAL - CFA ADMISSION PALAU" },
          { label: "PAR - PAROLEE", value: "PAR - PAROLEE" },
          { label: "PI - PACIFIC ISLANDER", value: "PI - PACIFIC ISLANDER" },
          { label: "Q1 - INTL CULTURAL XCHG VISITORS", value: "Q1 - INTL CULTURAL XCHG VISITORS" },
          {
            label: "Q2 - IRISH PEACE PROCESS PARTICPNTS",
            value: "Q2 - IRISH PEACE PROCESS PARTICPNTS",
          },
          { label: "Q3 - SPOUSE-CHILD OF Q2", value: "Q3 - SPOUSE-CHILD OF Q2" },
          { label: "R1 - RELIGIOUS OCCUPATION", value: "R1 - RELIGIOUS OCCUPATION" },
          { label: "R2 - SPOUSE-CHILD OF R-1", value: "R2 - SPOUSE-CHILD OF R-1" },
          { label: "RE - REFUGEE", value: "RE - REFUGEE" },
          {
            label: "RE5 - HAITIAN W-GRANTED REFUGEE STAT",
            value: "RE5 - HAITIAN W-GRANTED REFUGEE STAT",
          },
          { label: "RW - RAW APPLIED FOR AT A US CO", value: "RW - RAW APPLIED FOR AT A US CO" },
          { label: "S1 - SPECIAL AGRICULTURAL WORKER", value: "S1 - SPECIAL AGRICULTURAL WORKER" },
          { label: "S2 - SPECIAL AGRICULTURAL WORKER", value: "S2 - SPECIAL AGRICULTURAL WORKER" },
          { label: "S9 - EMERGENCY FARM WORKER", value: "S9 - EMERGENCY FARM WORKER" },
          { label: "SDF - SUSPECTED DOCUMENT FRAUD", value: "SDF - SUSPECTED DOCUMENT FRAUD" },
          { label: "ST - STOWAWAY", value: "ST - STOWAWAY" },
          {
            label: "T1 - VICTIM OF SEVERE FORM OF TRAFK",
            value: "T1 - VICTIM OF SEVERE FORM OF TRAFK",
          },
          { label: "T2 - SPOUSE OF T1", value: "T2 - SPOUSE OF T1" },
          { label: "T3 - CHILD OF T1", value: "T3 - CHILD OF T1" },
          { label: "T4 - PARENT OF T1", value: "T4 - PARENT OF T1" },
          {
            label: "T5 - UNMARRIED UNDER 18 SIBLG T1 NI",
            value: "T5 - UNMARRIED UNDER 18 SIBLG T1 NI",
          },
          { label: "TB - SPOUSE OR CHILD OF CAN. FR", value: "TB - SPOUSE OR CHILD OF CAN. FR" },
          {
            label: "TC - CANADIAN FREE TRADE AGREEMENT",
            value: "TC - CANADIAN FREE TRADE AGREEMENT",
          },
          { label: "TD - NAFTA DEPENDENT", value: "TD - NAFTA DEPENDENT" },
          { label: "TN1 - NAFTA PRINCIPAL (CANADA)", value: "TN1 - NAFTA PRINCIPAL (CANADA)" },
          { label: "TN2 - NAFTA PRINCIPAL (MEXICO)", value: "TN2 - NAFTA PRINCIPAL (MEXICO)" },
          { label: "TWO - TRANSIT WITHOUT A VISA", value: "TWO - TRANSIT WITHOUT A VISA" },
          { label: "U1 - VICTIM OF CRIMINAL ACTIVITY", value: "U1 - VICTIM OF CRIMINAL ACTIVITY" },
          { label: "U2 - SPOUSE OF U1", value: "U2 - SPOUSE OF U1" },
          { label: "U3 - CHILD OF U1", value: "U3 - CHILD OF U1" },
          { label: "U4 - PARENT OF U1", value: "U4 - PARENT OF U1" },
          {
            label: "U5 - UNMARRIED UNDER 18 SIBLG U1 NI",
            value: "U5 - UNMARRIED UNDER 18 SIBLG U1 NI",
          },
          { label: "UN - UNKNOWN", value: "UN - UNKNOWN" },
          { label: "UU - UNKNOWN", value: "UU - UNKNOWN" },
          { label: "V1 - SPOUSE OF LPR", value: "V1 - SPOUSE OF LPR" },
          { label: "V2 - CHILD OF LPR", value: "V2 - CHILD OF LPR" },
          { label: "V3 - CHILD OF V2", value: "V3 - CHILD OF V2" },
          {
            label: "WB - VISITOR FOR BUSINESS - VWPP/VWP",
            value: "WB - VISITOR FOR BUSINESS - VWPP/VWP",
          },
          { label: "WD - WITHDRAWL (I-275)", value: "WD - WITHDRAWL (I-275)" },
          { label: "WI - WITHOUT INSPECTION", value: "WI - WITHOUT INSPECTION" },
          { label: "WT - VISITOR FOR PLEASURE - VWPP", value: "WT - VISITOR FOR PLEASURE - VWPP" },
          { label: "X - EOIR", value: "X - EOIR" },
        ],
        condition: (data) => data.beneficiary_everInUS === "Yes",
      },
      {
        key: "beneficiary_i94Number",
        label:
          "What is the beneficiary's I-94 Arrival-Departure Record Number? (If the beneficiary has one)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line21b_ArrivalDeparture",
        placeholder: "11-digit number",
        maxLength: 11,
        condition: (data) => data.beneficiary_everInUS === "Yes",
      },
      {
        key: "beneficiary_dateOfArrival",
        label: "When did your family member arrive in the U.S.?",
        type: "date",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line21c_DateOfArrival",
        placeholder: "MM/DD/YYYY",
        condition: (data) => data.beneficiary_everInUS === "Yes",
      },
      {
        key: "beneficiary_stayExpiredDate",
        label:
          "How long is the beneficiary allowed to stay in the U.S.? (Look for the date on the beneficiary's I-94, or 'D/S')",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line21d_DateExpired",
        placeholder: "MM/DD/YYYY or D/S",
        condition: (data) => data.beneficiary_everInUS === "Yes",
      },
    ],
  },

  // 47-50: Passport / Travel Document
  {
    key: "beneficiary_passportNumber",
    label: "What is the beneficiary's passport number?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line22_PassportNumber",
    placeholder: "Passport Number",
  },
  {
    key: "beneficiary_travelDocNumber",
    label: "What is the beneficiary's travel document number?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line23_TravelDocNumber",
    placeholder: "Travel Document Number",
  },
  {
    key: "beneficiary_docCountryOfIssuance",
    label: "Which country issued the beneficiary's passport or travel document?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line24_CountryOfIssuance",
    placeholder: "Country Name",
  },
  {
    key: "beneficiary_docExpirationDate",
    label: "When does the beneficiary's passport or travel document expire?",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line25_ExpDate",
    placeholder: "MM/DD/YYYY",
  },

  // 51: Employment Information
  {
    key: "beneficiary_isEmployed",
    label: "Does the beneficiary have a job right now?",
    type: "radio",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "beneficiary_isEmployed",
    options: [
      { label: "Yes, the beneficiary has a job", value: "Yes", pdfKey: "dummy_yes" },
      {
        label: "No, the beneficiary is not working (Unemployed)",
        value: "No",
        pdfKey: "dummy_no",
      },
    ],
    subQuestions: [
      {
        key: "beneficiary_employerName",
        label: "What is the name of the beneficiary's current company?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_NameOfCompany",
        placeholder: "Company Name",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      {
        key: "beneficiary_employerStreet",
        label: "What is the street address of the beneficiary's company?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_StreetNumberName",
        placeholder: "123 Main St",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },

      // 51.c: Unit Type (Ste/Apt/Flr) — UNIQUE KEY
      {
        key: "beneficiary_employerUnitType",
        label: "Is the employer's address an Apartment, Suite, or Floor?",
        type: "radio",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "beneficiary_employerUnitType",
        options: [
          { label: "Ste", value: "Ste", pdfKey: "Pt4Line26_Unit[0]" },
          { label: "Apt", value: "Apt", pdfKey: "Pt4Line26_Unit[1]" },
          { label: "Flr", value: "Flr", pdfKey: "Pt4Line26_Unit[2]" },
        ],
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      {
        key: "beneficiary_employerUnitNumber",
        label: "What is the Apartment, Suite, or Floor number? (For example: Suite 101)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_AptSteFlrNumber",
        placeholder: "101",
        condition: (data) =>
          data.beneficiary_isEmployed === "Yes" &&
          ["Ste", "Apt", "Flr"].includes(data.beneficiary_employerUnitType),
      },

      {
        key: "beneficiary_employerCity",
        label: "In what city or town is the beneficiary's company located?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_CityOrTown",
        placeholder: "New York",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      {
        key: "beneficiary_employerState",
        label: "In what U.S. state is the employer located? (If applicable)",
        type: "dropdown",
        isState: true,
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_State",
        placeholder: "NY",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      {
        key: "beneficiary_employerZip",
        label: "What is the ZIP code of the employer? (If in the U.S.)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_ZipCode",
        placeholder: "10001",
        maxLength: 5,
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      {
        key: "beneficiary_employerProvince",
        label: "In what province is the employer located? (If outside the U.S.)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_Province",
        placeholder: "Ontario",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      {
        key: "beneficiary_employerPostalCode",
        label: "What is the postal code of the employer? (If outside the U.S.)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_PostalCode",
        placeholder: "A1B 2C3",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      {
        key: "beneficiary_employerCountry",
        label: "In what country is the beneficiary's company located?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line26_Country",
        placeholder: "Canada",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
      // 52. Employment Start Date
      {
        key: "beneficiary_employmentStartDate",
        label: "When did the beneficiary start working there?",
        type: "date",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line27_DateEmploymentBegan",
        placeholder: "MM/DD/YYYY",
        condition: (data) => data.beneficiary_isEmployed === "Yes",
      },
    ],
  },

  // 53. Immigration Proceedings
  {
    key: "beneficiary_inImmigrationProceedings",
    label: "Has the beneficiary ever had a case in an immigration court?",
    type: "radio",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "beneficiary_inImmigrationProceedings",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "Pt4Line28_Yes" },
      { label: "No", value: "No", pdfKey: "Pt4Line28_No" },
    ],
    subQuestions: [
      // 54. Type of Proceedings
      {
        key: "note_immigration_type",
        pdfKey: "proceeding_type",
        label: "Select all the types of court cases that apply to the beneficiary:",
        type: "radio",
        section: "Information About Beneficiary (Continued)",
        condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
        options: [
          {
            label: "Removal (The government ordered the beneficiary to leave the U.S.)",
            value: "Removal",
            pdfKey: "Pt4Line54_Removal",
          },
          {
            label: "Exclusion or Deportation (Refused entry or sent back)",
            value: "exclusion",
            pdfKey: "Pt4Line54_Exclusion",
          },
          {
            label:
              "Rescission (The government tried to take back the beneficiary's previous legal status)",
            value: "recission",
            pdfKey: "Pt4Line54_Rescission",
          },
          {
            label: "Other Court Cases (Any other immigration legal proceeding)",
            value: "other",
            pdfKey: "Pt4Line54_JudicialProceedings",
          },
        ],
      },

      // 55-56: Proceeding Location & Date
      {
        key: "beneficiary_proceedingCity",
        label: "In what city or town was the court case?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line55a_CityOrTown",
        placeholder: "City Name",
        condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
      },
      {
        key: "beneficiary_proceedingState",
        label: "In what U.S. state was the court case located?",
        type: "dropdown",
        isState: true,
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line55b_State",
        placeholder: "NY",
        condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
      },
      {
        key: "beneficiary_proceedingDate",
        label: "On what date did the court case happen?",
        type: "date",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line56_Date",
        placeholder: "MM/DD/YYYY",
        condition: (data) => data.beneficiary_inImmigrationProceedings === "Yes",
      },
    ],
  },

  // Hidden Barcode
  // {
  //   key: "beneficiary_page7Barcode",
  //   label: "PDF417 Barcode (Page 7)",
  //   type: "hidden",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "PDF417BarCode1",
  //   value: "form1[0].#pageSet[0].Page1[6].PDF417BarCode1[0]",
  // },

  // =============================================
  // PAGE 8 - PART 4: Information About Beneficiary (Continued)
  // =============================================

  // 57.a-c: Beneficiary's Name in Native Written Language
  {
    key: "beneficiary_nativeLanguageFamilyName",
    label:
      "What is the beneficiary's last name in the beneficiary's native language (like Arabic, Chinese, or Hindi)?",
    type: "text",
    section: "Beneficiary's Native Language",
    keyboardType: "urdu",
    inputMode: "none",
    pdfKey: "Pt4Line55a_FamilyName",
    placeholder: "خاندانی نام / سرنیم",
    subQuestions: [
      {
        key: "beneficiary_nativeLanguageGivenName",
        label: "What is the beneficiary's first name in the beneficiary's native language?",
        type: "text",
        section: "Beneficiary's Native Language",
        keyboardType: "urdu",
        inputMode: "none",
        pdfKey: "Pt4Line55b_GivenName",
        placeholder: "ذاتی نام",
      },
      {
        key: "beneficiary_nativeLanguageMiddleName",
        label:
          "What is the beneficiary's middle name in the beneficiary's native language? (Skip if the beneficiary doesn't have one)",
        type: "text",
        section: "Beneficiary's Native Language",
        keyboardType: "urdu",
        inputMode: "none",
        pdfKey: "Pt4Line55c_MiddleName",
        placeholder: "درمیانی نام",
      },
    ],
  },

  // 58: Beneficiary's Native Address
  {
    key: "beneficiary_nativeLanguageStreet",
    label: "What is the street address written in the beneficiary's native language?",
    type: "text",
    section: "Beneficiary's Native Language",
    keyboardType: "urdu",
    inputMode: "none",
    pdfKey: "Pt4Line56_StreetNumberName",
    placeholder: "123 Main St",
  },
  {
    key: "beneficiary_nativeLanguageUnitType",
    label: "Is it an Apartment, Suite, or Floor? (In native language)",
    type: "radio",
    section: "Beneficiary's Native Language",
    pdfKey: "beneficiary_prevSpouseUnitType",
    options: [
      { label: "Ste", value: "Ste", pdfKey: "Pt4Line56_Unit[0]" },
      { label: "Apt", value: "Apt", pdfKey: "Pt4Line56_Unit[1]" },
      { label: "Flr", value: "Flr", pdfKey: "Pt4Line56_Unit[2]" },
    ],
  },
  {
    key: "beneficiary_nativeLanguageUnitNumber",
    label: "What is the Apartment, Suite, or Floor number? (In native language)",
    type: "text",
    section: "Beneficiary's Native Language",
    keyboardType: "urdu",
    inputMode: "none",
    pdfKey: "Pt4Line56_AptSteFlrNumber",
    placeholder: "101",
    condition: (data) => ["Ste", "Apt", "Flr"].includes(data.beneficiary_nativeLanguageUnitType),
  },
  {
    key: "beneficiary_nativeLanguageCity",
    label: "In what city or town is this address? (In native language)",
    type: "text",
    section: "Beneficiary's Native Language",
    keyboardType: "urdu",
    inputMode: "none",
    pdfKey: "Pt4Line56_CityOrTown",
    placeholder: "New York",
  },
  {
    key: "beneficiary_nativeLanguageProvince",
    label: "In what province does the beneficiary live? (In native language)",
    type: "text",
    section: "Beneficiary's Native Language",
    keyboardType: "urdu",
    inputMode: "none",
    pdfKey: "Pt4Line56_Province",
    placeholder: "Ontario",
  },
  {
    key: "beneficiary_nativeLanguagePostalCode",
    label: "What is the postal code? (In native language)",
    type: "text",
    section: "Beneficiary's Native Language",
    keyboardType: "urdu",
    inputMode: "none",
    pdfKey: "Pt4Line56_PostalCode",
    placeholder: "A1B 2C3",
  },
  {
    key: "beneficiary_nativeLanguageCountry",
    label: "In what country is this address? (In native language)",
    type: "text",
    section: "Beneficiary's Native Language",
    keyboardType: "urdu",
    inputMode: "none",
    pdfKey: "Pt4Line56_Country",
    placeholder: "Canada",
  },

  // 57: Beneficiary's Current Address in U.S.
  {
    key: "beneficiary_currentUSStreet",
    label: "What is the beneficiary's current street address in the U.S.?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_StreetNumberName",
    placeholder: "456 Elm St",
  },
  {
    key: "beneficiary_currentUSUnitType",
    label: "Is this address an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "beneficiary_currentUSUnitType",
    options: [
      { label: "Ste", value: "Ste", pdfKey: "Pt4Line57_Unit[0]" },
      { label: "Apt", value: "Apt", pdfKey: "Pt4Line57_Unit[1]" },
      { label: "Flr", value: "Flr", pdfKey: "Pt4Line57_Unit[2]" },
    ],
  },
  {
    key: "beneficiary_currentUSUnitNumber",
    label: "What is the Apartment, Suite, or Floor number?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_AptSteFlrNumber",
    placeholder: "202",
    condition: (data) => ["Ste", "Apt", "Flr"].includes(data.beneficiary_currentUSUnitType),
  },
  {
    key: "beneficiary_currentUSCity",
    label: "In what city or town is this address located?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_CityOrTown",
    placeholder: "Los Angeles",
  },
  {
    key: "beneficiary_currentUSState",
    label: "In what U.S. state is this address?",
    type: "dropdown",
    isState: true,
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_State",
    placeholder: "Select State",
    // options: [
    //   { label: "CA", value: "CA", pdfKey: "state_CA" },
    //   { label: "NY", value: "NY", pdfKey: "state_NY" },
    //   { label: "TX", value: "TX", pdfKey: "state_TX" },
    //   // Add more states as needed
    // ],
  },
  {
    key: "beneficiary_currentUSZip",
    label: "What is the ZIP code for this address?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_ZipCode",
    placeholder: "90210",
    maxLength: 5,
  },
  {
    key: "beneficiary_currentUSProvince",
    label: "In what province is this address located? (If applicable)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_Province",
    placeholder: "Ontario",
  },
  {
    key: "beneficiary_currentUSPostalCode",
    label: "What is the postal code? (If applicable)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_PostalCode",
    placeholder: "M5V 2T6",
  },
  {
    key: "beneficiary_currentUSCountry",
    label: "In what country is this address located?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line57_Country",
    placeholder: "United States",
  },

  // 58.a-b: Dates of Marriage
  {
    key: "beneficiary_marriageDateFrom",
    label: "When did the beneficiary's current or most recent marriage start?",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line58a_DateFrom",
    placeholder: "MM/DD/YYYY",
  },
  {
    key: "beneficiary_marriageDateTo",
    label: "On what date did that marriage end? (Leave blank if the beneficiary is still married)",
    type: "date",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line58b_DateTo",
    placeholder: "MM/DD/YYYY",
  },

  // 60.a-b: Beneficiary's Intended Address in U.S.
  {
    key: "beneficiary_intendedCity",
    label: "In what U.S. city or town does the beneficiary plan to live?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line60a_CityOrTown",
    placeholder: "Chicago",
  },
  {
    key: "beneficiary_intendedState",
    label: "In what U.S. state does the beneficiary intend to live?",
    type: "dropdown",
    isState: true,
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line60b_State",
    placeholder: "Select State",
    // options: [
    //   { label: "IL", value: "IL", pdfKey: "state_IL" },
    //   { label: "FL", value: "FL", pdfKey: "state_FL" },
    //   // Add more
    // ],
  },

  // 61.a-c: Beneficiary's Address Abroad
  {
    key: "beneficiary_abroadCity",
    label:
      "If the beneficiary is currently outside the U.S., what city or town does the beneficiary live in?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line61a_CityOrTown",
    placeholder: "London",
  },
  {
    key: "beneficiary_abroadProvince",
    label: "In what province does the beneficiary live? (If outside the U.S.)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line61b_Province",
    placeholder: "Greater London",
  },
  {
    key: "beneficiary_abroadCountry",
    label: "In what country does the beneficiary live? (If outside the U.S.)",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line61c_Country",
    placeholder: "United Kingdom",
  },

  // Part 5: Previous Petitions
  {
    key: "hasPreviousPetition",
    label: "Have you EVER helped this family member or any other person before?",
    type: "radio",
    section: "Other Information",
    pdfKey: "hasPreviousPetition",
    options: [
      { label: "Yes", value: "Yes", pdfKey: "Pt5Line1_Yes" },
      { label: "No", value: "No", pdfKey: "Pt5Line1_No" },
    ],
    subQuestions: [
      // 2.a-c: Name of Previous Beneficiary
      {
        key: "previousPetitionerFamilyName",
        label: "What was the family name (last name) of the person you helped previously?",
        type: "text",
        section: "Other Information",
        pdfKey: "Pt5Line2a_FamilyName",
        condition: (data) => data.hasPreviousPetition === "Yes",
        placeholder: "Last Name",
      },
      {
        key: "previousPetitionerGivenName",
        label: "What was their given name (first name)?",
        type: "text",
        section: "Other Information",
        pdfKey: "Pt5Line2b_GivenName",
        condition: (data) => data.hasPreviousPetition === "Yes",
        placeholder: "First Name",
      },
      {
        key: "previousPetitionerMiddleName",
        label: "What was their middle name? (Leave blank if they don't have one)",
        type: "text",
        section: "Other Information",
        pdfKey: "Pt5Line2c_MiddleName",
        condition: (data) => data.hasPreviousPetition === "Yes",
        placeholder: "Middle Name",
      },
    ],
  },

  // 3.a-b: Previous Filing Location
  {
    key: "previousFilingCity",
    label: "In what city or town did you file that previous application?",
    type: "text",
    section: "Other Information",
    pdfKey: "Pt5Line3a_CityOrTown",
    condition: (data) => data.hasPreviousPetition === "Yes",
    placeholder: "City or Town",
  },
  {
    key: "previousFilingState",
    label: "In what U.S. state was it filed?",
    type: "dropdown",
    isState: true,
    section: "Other Information",
    pdfKey: "Pt5Line3b_State",
    condition: (data) => data.hasPreviousPetition === "Yes",
    // options: [
    //   { label: "TX", value: "TX", pdfKey: "state_TX" },
    //   // Add more
    // ],
    placeholder: "Select State",
  },

  // 4. Date Filed
  {
    key: "previousFilingDate",
    label: "On what date did you file that application? (mm/dd/yyyy)",
    type: "date",
    section: "Other Information",
    pdfKey: "Pt5Line4_DateFiled",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.hasPreviousPetition === "Yes",
  },

  // 5. Result
  {
    key: "previousFilingResult",
    label: "What was the result of that application? (For example: Approved, Denied, or Withdrawn)",
    type: "text",
    section: "Other Information",
    pdfKey: "Pt5Line5_Result",
    placeholder: "e.g. Approved or Denied",
    condition: (data) => data.hasPreviousPetition === "Yes",
  },

  {
    key: "submitting_others",
    pdfKey: "submitting_others",
    type: "radio",
    label: "Are you also helping any other family members at the same time?",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [],
  },
  {
    key: "note_relative_intro",
    pdfKey: "relativeInfo",
    type: "hidden",
    label: "Please provide the names and how you are related to each family member.",
    condition: (data) => data.submitting_others === "Yes",
  },

  // 6.a-c: Relative 1
  {
    key: "note_relative_1",
    pdfKey: "note",
    type: "hidden",
    label: "First Additional Relative",
    condition: (data) => data.submitting_others === "Yes",
  },
  {
    key: "beneficiary_childFamilyName",
    label:
      "What is the family name (last name) of the first additional family member you are helping?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line6a_FamilyName",
    condition: (data) => data.submitting_others === "Yes",
    placeholder: "Last Name",
    subQuestions: [
      {
        key: "beneficiary_childGivenName",
        label: "What is their given name (first name)?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line6b_GivenName",
        condition: (data) => data.submitting_others === "Yes",
        placeholder: "First Name",
      },
      {
        key: "beneficiary_childMiddleName",
        label: "What is their middle name? (Leave blank if they don't have one)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line6c_MiddleName",
        condition: (data) => data.submitting_others === "Yes",
        placeholder: "Middle Name",
      },

      // 7. Relationship
      {
        key: "beneficiary_childRelationship",
        label:
          "What is your relationship to this family member? (For example: Child, Parent, Brother, or Sister)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line7_Relationship",
        placeholder: "e.g. Brother",
        condition: (data) => data.submitting_others === "Yes",
      },
    ],
  },
  // 6.a-c: Relative 2
  {
    key: "note_relative_2",
    pdfKey: "note",
    type: "hidden",
    label: "Second Additional Relative",
    condition: (data) => data.submitting_others === "Yes",
  },
  {
    key: "beneficiary_childFamilyName2",
    label:
      "What is the family name (last name) of the second additional family member you are helping?",
    type: "text",
    section: "Information About Beneficiary (Continued)",
    pdfKey: "Pt4Line8a_FamilyName",
    condition: (data) => data.submitting_others === "Yes",
    placeholder: "Last Name",
    subQuestions: [
      {
        key: "beneficiary_childGivenName2",
        label: "What is their given name (first name)?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line8b_GivenName",
        condition: (data) => data.submitting_others === "Yes",
        placeholder: "First Name",
      },
      {
        key: "beneficiary_childMiddleName2",
        label: "What is their middle name? (Leave blank if they don't have one)",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line8c_MiddleName",
        condition: (data) => data.submitting_others === "Yes",
        placeholder: "Middle Name",
      },

      // 7. Relationship
      {
        key: "beneficiary_childRelationship2",
        label: "What is your relationship to this second family member?",
        type: "text",
        section: "Information About Beneficiary (Continued)",
        pdfKey: "Pt4Line9_Relationship",
        placeholder: "e.g. Sister",
        condition: (data) => data.submitting_others === "Yes",
      },
    ],
  },

  // Hidden Barcode
  // {
  //   key: "beneficiary_page8Barcode",
  //   label: "PDF417 Barcode (Page 8)",
  //   type: "hidden",
  //   section: "Information About Beneficiary (Continued)",
  //   pdfKey: "form1[0].#pageSet[0].Page1[7].PDF417BarCode1[0]",
  //   value: "form1[0].#pageSet[0].Page1[7].PDF417BarCode1[0]",
  // },

  // === PAGE 9 ===
  // Petitioner’s Contact Information, Declaration, and Signature

  {
    key: "note_petitioner_info",
    pdfKey: "note",
    type: "hidden",
    // we are getting petitioner info in this section
    label: "Now moving towards petitioner information.",
  },
  {
    key: "petitioner_daytimePhone",
    label: "What is your daytime telephone number? (Where can we reach you during the day?)",
    type: "text",
    section: "Petitioner’s Contact Information, Declaration, and Signature",
    pdfKey: "Pt6Line3_DaytimePhoneNumber",
    placeholder: "(123) 456-7890",
  },
  {
    key: "petitioner_mobile",
    label: "What is your mobile (cell phone) number? (If you have one)",
    type: "text",
    section: "Petitioner’s Contact Information, Declaration, and Signature",
    pdfKey: "Pt6Line4_MobileNumber",
    placeholder: "(123) 456-7890",
  },
  {
    key: "petitioner_email",
    label: "What is your email address? (If you have one)",
    type: "text",
    section: "Petitioner’s Contact Information, Declaration, and Signature",
    pdfKey: "Pt6Line5_Email",
    placeholder: "you@example.com",
  },

  // Signature
  {
    key: "petitioner_signature",
    label: "Please type your(petitioner) full legal name here to act as your electronic signature.",
    type: "text",
    section: "Petitioner’s Contact Information, Declaration, and Signature",
    pdfKey: "P5_Line6a_SignatureofApplicant",
    placeholder: "Type your full name",
  },
  {
    key: "petitioner_signature_date",
    label: "On what date are you(petitioner) signing this form?",
    type: "date",
    section: "Petitioner’s Contact Information, Declaration, and Signature",
    pdfKey: "Pt6Line6b_DateofSignature",
    placeholder: "MM/DD/YYYY",
  },

  // Hidden Barcode (Page 9)
  // {
  //   key: "page9_barcode",
  //   label: "PDF417 Barcode (Page 9)",
  //   type: "hidden",
  //   section:
  //     "Petitioner’s Contact Information, Declaration, and Signature",
  //   pdfKey: "form1[0].#pageSet[0].Page1[8].PDF417BarCode1[0]",
  //   value: "form1[0].#pageSet[0].Page1[8].PDF417BarCode1[0]",
  // },

  // =============================================
  // PAGE 10 - PART 7 & 8: Interpreter & Preparer Details
  // =============================================

  // PART 7: Interpreter's Information
  // Interpreter Help
  {
    key: "interpreter_help_english",
    label: "Can you read and understand English? (This helps us know if you needed an interpreter)",
    type: "radio",
    section: "Interpreter's Information",
    pdfKey: "interpreter_help_english",
    options: [
      {
        label: "Yes, I can read and understand English",
        value: "Yes",
        pdfKey: "Pt6Line1Checkbox[0]",
      },
      {
        label: "No, I needed an interpreter",
        value: "No",
        pdfKey: "Pt6Line1Checkbox[1]",
      },
    ],
    subQuestions: [
      {
        key: "interpreter_language",
        label:
          "Since you used an interpreter, what language did they use to translate the questions for you?",
        type: "text",
        section: "Interpreter's Information",
        pdfKey: "Pt6Line1b_Language",
        placeholder: "e.g. Spanish",
        condition: (data) => data.interpreter_help_english === "No",
      },
    ],
  },

  // {
  //   key: "note_interpreter_info",
  //   pdfKey: "note",
  //   type: "hidden",
  //   section:
  //         "Interpreter's Information",
  //   label:
  //     "Now, please provide information about the interpreter who helped you.",
  //   condition: (data) => data.interpreter_help_english === "No",
  // },
  {
    key: "interpreter_familyName",
    label: "What is the interpreter's family name (last name)?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line1a_InterpreterFamilyName",
    placeholder: "Last Name",
    condition: (data) => data.interpreter_help_english === "No",
    subQuestions: [
      {
        key: "interpreter_givenName",
        label: "What is their given name (first name)?",
        type: "text",
        section: "Interpreter's Information",
        pdfKey: "Pt7Line1b_InterpreterGivenName",
        placeholder: "First Name",
        condition: (data) => data.interpreter_help_english === "No",
      },
    ],
  },
  {
    key: "interpreter_business",
    label: "What is the name of the interpreter's business or organization? (If they have one)",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line2_InterpreterBusinessorOrg",
    placeholder: "e.g. ABC Translation Services",
    condition: (data) => data.interpreter_help_english === "No",
  },

  // Interpreter Address
  {
    key: "interpreter_street",
    label: "What is the interpreter's street address?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_StreetNumberName",
    placeholder: "789 Oak St",
    condition: (data) => data.interpreter_help_english === "No",
  },
  {
    key: "interpreter_unitType",
    label: "Is their address an Apartment, Suite, or Floor?",
    type: "radio",
    section: "Interpreter's Information",
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
    label: "What is the Apartment, Suite, or Floor number?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_AptSteFlrNumber",
    placeholder: "Number",
    condition: (data) =>
      data.interpreter_help_english === "No" &&
      ["Ste", "Apt", "Flr"].includes(data.interpreter_unitType),
  },
  {
    key: "interpreter_city",
    label: "In what city or town is the interpreter located?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_CityOrTown",
    placeholder: "City Name",
    condition: (data) => data.interpreter_help_english === "No",
  },
  {
    key: "interpreter_state",
    label: "In what state?",
    type: "dropdown",
    isState: true,
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_State",
    placeholder: "Select State",
    // options: [
    //   { label: "FL", value: "FL", pdfKey: "state_FL" },
    //   { label: "CA", value: "CA", pdfKey: "state_CA" },
    // ],
    condition: (data) => data.interpreter_help_english === "No",
  },

  {
    key: "interpreter_zip",
    label: "What is the ZIP code?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_ZipCode",
    placeholder: "ZIP Code",
    maxLength: 5,
    condition: (data) => data.interpreter_help_english === "No",
  },
  {
    key: "interpreter_province",
    label: "In what province is the interpreter located? (If applicable)",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_Province",
    placeholder: "Province",
    condition: (data) => data.interpreter_help_english === "No",
  },
  {
    key: "interpreter_postalCode",
    label: "What is their postal code? (If applicable)",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_PostalCode",
    placeholder: "Postal Code",
    condition: (data) => data.interpreter_help_english === "No",
  },
  {
    key: "interpreter_country",
    label: "In what country is the interpreter located?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line3_Country",
    placeholder: "Country Name",
    condition: (data) => data.interpreter_help_english === "No",
  },

  // Interpreter Contact
  {
    key: "interpreter_daytimePhone",
    label: "What is the interpreter's daytime telephone number?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line4_InterpreterDaytimeTelephone",
    placeholder: "(000) 000-0000",
    condition: (data) => data.interpreter_help_english === "No",
  },
  {
    key: "interpreter_email",
    label: "What is their email address? (If they have one)",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line5_Email",
    placeholder: "e.g. maria@example.com",
    condition: (data) => data.interpreter_help_english === "No",
  },

  // Interpreter Signature
  {
    key: "interpreter_signature",
    label: "Please type the interpreter's full legal name to act as their signature.",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line7a_Signature",
    placeholder: "Type full name",
    condition: (data) => data.interpreter_help_english === "No",
  },
  {
    key: "interpreter_signature_date",
    label: "On what date is the interpreter signing this form?",
    type: "date",
    section: "Interpreter's Information",
    pdfKey: "Pt7Line7b_DateofSignature",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.interpreter_help_english === "No",
  },

  // Language Name (Top of Page 10)
  {
    key: "interpreter_language_name",
    label: "What language did the interpreter use to translate this form for you?",
    type: "text",
    section: "Interpreter's Information",
    pdfKey: "Pt7_NameofLanguage",
    placeholder: "e.g. Spanish",
    condition: (data) => data.interpreter_help_english === "No",
  },

  // PART 8: Preparer's Information
  // {
  //   key: "note_preparer_info",
  //   pdfKey: "note",
  //   type: "hidden",
  //   label:
  //     "Now, please provide information about the person who helped prepare this form for you.",
  //   condition: (data) => data.representative_help === "Yes",
  // },
  // Representative Help
  {
    key: "representative_help",
    label: "Did someone else (like a lawyer or professional preparer) help you fill out this form?",
    type: "radio",
    section: "Petitioner’s Contact Information, Declaration, and Signature",
    pdfKey: "Pt6Line2_Checkbox",
    options: [{ label: "Yes", value: "Yes", pdfKey: "Pt6Line2_Checkbox" }],
    subQuestions: [
      {
        key: "representative_name",
        label: "What is the name of the person who helped you fill out this form?",
        type: "text",
        section: "Petitioner’s Contact Information, Declaration, and Signature",
        pdfKey: "Pt6Line2_RepresentativeName",
        placeholder: "Preparer's Name",
        condition: (data) => data.representative_help === "Yes",
      },
    ],
  },

  {
    key: "preparer_familyName",
    label: "What is the preparer's family name (last name)?",
    type: "text",
    section: "Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line1a_PreparerFamilyName",
    placeholder: "Last Name",
    condition: (data) => data.representative_help === "Yes",
    subQuestions: [
      {
        key: "preparer_givenName",
        label: "What is their given name (first name)?",
        type: "text",
        section: "Preparer's Contact Information, Certification, and Signature",
        pdfKey: "Pt8Line1b_PreparerGivenName",
        placeholder: "First Name",
        condition: (data) => data.representative_help === "Yes",
      },
    ],
  },
  {
    key: "preparer_business",
    label: "What is the name of the preparer's business or organization? (If available)",
    type: "text",
    section: "Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line2_BusinessName",
    placeholder: "Business Name",
    condition: (data) => data.representative_help === "Yes",
  },

  // Preparer Address
  {
    key: "preparer_street",
    label: "What is the preparer's street address?",
    type: "text",
    section: "Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_StreetNumberName",
    placeholder: "Street Number and Name",
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_unitType",
    label: "Is their address an Apartment, Suite, or Floor?",
    type: "radio",
    section: " Preparer's Contact Information, Certification, and Signature",
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
    label: "What is the Apartment, Suite, or Floor number?",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_AptSteFlrNumber",
    placeholder: "Number",
    condition: (data) =>
      data.representative_help === "Yes" && ["Ste", "Apt", "Flr"].includes(data.preparer_unitType),
  },
  {
    key: "preparer_city",
    label: "In what city or town is the preparer located?",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_CityOrTown",
    placeholder: "City Name",
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_state",
    label: "In what state?",
    type: "dropdown",
    isState: true,
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_State",
    // options: [{ label: "NY", value: "NY", pdfKey: "state_NY" }],
    placeholder: "Select State",
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_zip",
    label: "What is the ZIP code?",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_ZipCode",
    placeholder: "ZIP Code",
    maxLength: 5,
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_province",
    label: "In what province is the preparer located? (If applicable)",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_Province",
    placeholder: "Province",
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_postalCode",
    label: "What is their postal code? (If applicable)",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_PostalCode",
    placeholder: "Postal Code",
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_country",
    label: "In what country is the preparer located?",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line3_Country",
    placeholder: "Country Name",
    condition: (data) => data.representative_help === "Yes",
  },

  // Hidden Barcode (Page 10)
  // {
  //   key: "page10_barcode",
  //   label: "PDF417 Barcode (Page 10)",
  //   type: "hidden",
  //   section:
  //     " Preparer's Contact Information, Certification, and Signature",
  //   pdfKey: "form1[0].#pageSet[0].Page1[9].PDF417BarCode1[0]",
  //   value: "form1[0].#pageSet[0].Page1[9].PDF417BarCode1[0]",
  // },

  // =============================================
  // PAGE 11 - PART 8: Preparer Certification
  // =============================================

  {
    key: "preparer_daytimePhone",
    label: "What is the preparer's daytime telephone number?",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line4_DaytimePhoneNumber",
    placeholder: "(000) 000-0000",
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_has_a_number",
    label: "Do you have a fax number?",
    type: "radio",
    section: " Preparer's Contact Information, Certification, and Signature",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    condition: (data) => data.representative_help === "Yes",
    subQuestions: [
      {
        key: "preparer_fax",
        label: "What is the preparer's fax number? (If they have one)",
        type: "text",
        section: " Preparer's Contact Information, Certification, and Signature",
        pdfKey: "Pt8Line5_PreparerFaxNumber",
        placeholder: "Fax Number",
        condition: (data) =>
          data.representative_help === "Yes" && data.preparer_has_a_number === "Yes",
        tooltip:
          "A fax number is a telephone number used to send and receive scanned documents over a phone line. Many lawyers and professional offices still use them to share paperwork quickly.",
      },
    ],
  },
  {
    key: "preparer_email",
    label: "What is the preparer's email address? (If they have one)",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line6_Email",
    placeholder: "e.g. preparer@example.com",
    condition: (data) => data.representative_help === "Yes",
  },

  // 7. Certification
  {
    key: "preparer_certify",
    label:
      "Does the preparer certify that they prepared this form at your request and that the information is accurate?",
    type: "radio",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "preparer_certify",
    options: [
      {
        label: "Yes, they certify",
        value: "Yes",
        pdfKey: "Pt8Line7_Checkbox_Yes",
      },
      { label: "No", value: "No", pdfKey: "Pt8Line7_Checkbox_No" },
    ],
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_interpreter_used",
    label: "Did the preparer use an interpreter to assist you with this form?",
    type: "radio",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "preparer_interpreter_used",
    options: [
      {
        label: "Yes, an interpreter was used",
        value: "Yes",
        pdfKey: "Pt8Line7b_Checkbox_Yes",
      },
      {
        label: "No interpreter was used",
        value: "No",
        pdfKey: "Pt8Line7b_Checkbox_No",
      },
    ],
    condition: (data) => data.representative_help === "Yes",
  },

  // Signature
  {
    key: "preparer_signature",
    label: "Please type the preparer's full legal name to act as their signature.",
    type: "text",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line8a_Signature",
    placeholder: "Type full name",
    condition: (data) => data.representative_help === "Yes",
  },
  {
    key: "preparer_signature_date",
    label: "On what date is the preparer signing this form?",
    type: "date",
    section: " Preparer's Contact Information, Certification, and Signature",
    pdfKey: "Pt8Line8b_DateofSignature",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.representative_help === "Yes",
  },

  // Hidden Barcode
  // {
  //   key: "page11_barcode",
  //   label: "PDF417 Barcode (Page 11)",
  //   type: "hidden",
  //   section:
  //     " Preparer's Contact Information, Certification, and Signature",
  //   pdfKey: "form1[0].#pageSet[0].Page1[10].PDF417BarCode1[0]",
  //   value: "form1[0].#pageSet[0].Page1[10].PDF417BarCode1[0]",
  // },

  // =============================================
  // PAGE 12 - PART 9: Additional Information
  // =============================================

  // {
  //   key: "additional_info_a_number",
  //   label: "A-Number (Top Right)",
  //   type: "text",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt2Line1_AlienNumber_Page12",
  //   placeholder: "A12345678",
  // },

  // // === 5 BLOCKS OF ADDITIONAL INFO ===
  // {
  //   key: "addl_3_page",
  //   label: "3.a. Page Number",
  //   type: "text",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt9Line3a_PageNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_3_part",
  //   label: "3.b. Part Number",
  //   type: "text",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt9Line3b_PartNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_3_item",
  //   label: "3.c. Item Number",
  //   type: "text",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt9Line3c_ItemNumber",
  //   maxLength: 3,
  // },
  // {
  //   key: "addl_3_text",
  //   label: "3.d. Additional Information",
  //   type: "textarea",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt9Line3d_AdditionalInfo",
  //   placeholder: "Explain here...",
  // },

  // // Repeat for 4, 5, 6, 7 → (same pattern)
  // {
  //   key: "addl_4_page",
  //   label: "4.a. Page Number",
  //   type: "text",
  //   pdfKey: "Pt9Line4a_PageNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_4_part",
  //   label: "4.b. Part Number",
  //   type: "text",
  //   pdfKey: "Pt9Line4b_PartNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_4_item",
  //   label: "4.c. Item Number",
  //   type: "text",
  //   pdfKey: "Pt9Line4c_ItemNumber",
  //   maxLength: 3,
  // },
  // {
  //   key: "addl_4_text",
  //   label: "4.d. Additional Information",
  //   type: "textarea",
  //   pdfKey: "Pt9Line4d_AdditionalInfo",
  // },

  // // Block 5 (Top Right)
  // {
  //   key: "addl_5_page",
  //   label: "5.a. Page Number",
  //   type: "text",
  //   pdfKey: "Pt9Line5a_PageNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_5_part",
  //   label: "5.b. Part Number",
  //   type: "text",
  //   pdfKey: "Pt9Line5b_PartNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_5_item",
  //   label: "5.c. Item Number",
  //   type: "text",
  //   pdfKey: "Pt9Line5c_ItemNumber",
  //   maxLength: 3,
  // },
  // {
  //   key: "addl_5_text",
  //   label: "5.d. Additional Information",
  //   type: "textarea",
  //   pdfKey: "Pt9Line5d_AdditionalInfo",
  // },

  // // Block 6
  // {
  //   key: "addl_6_page",
  //   label: "6.a. Page Number",
  //   type: "text",
  //   pdfKey: "Pt9Line6a_PageNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_6_part",
  //   label: "6.b. Part Number",
  //   type: "text",
  //   pdfKey: "Pt9Line6b_PartNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_6_item",
  //   label: "6.c. Item Number",
  //   type: "text",
  //   pdfKey: "Pt9Line6c_ItemNumber",
  //   maxLength: 3,
  // },
  // {
  //   key: "addl_6_text",
  //   label: "6.d. Additional Information",
  //   type: "textarea",
  //   pdfKey: "Pt9Line6d_AdditionalInfo",
  // },

  // // Block 7
  // {
  //   key: "addl_7_page",
  //   label: "7.a. Page Number",
  //   type: "text",
  //   pdfKey: "Pt9Line9a_PageNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_7_part",
  //   label: "7.b. Part Number",
  //   type: "text",
  //   pdfKey: "Pt9Line7b_PartNumber",
  //   maxLength: 2,
  // },
  // {
  //   key: "addl_7_item",
  //   label: "7.c. Item Number",
  //   type: "text",
  //   pdfKey: "Pt9Line7c_ItemNumber",
  //   maxLength: 3,
  // },
  // {
  //   key: "addl_7_text",
  //   label: "7.d. Additional Information",
  //   type: "textarea",
  //   pdfKey: "Pt9Line7d_AdditionalInfo",
  // },

  // // Beneficiary Name (Repeated on Page 12)
  // {
  //   key: "beneficiary_familyName_page12",
  //   label: "Family Name (Repeated)",
  //   type: "text",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt2Line4a_FamilyName_Page12",
  // },
  // {
  //   key: "beneficiary_givenName_page12",
  //   label: "Given Name (Repeated)",
  //   type: "text",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt2Line4b_GivenName_Page12",
  // },
  // {
  //   key: "beneficiary_middleName_page12",
  //   label: "Middle Name (Repeated)",
  //   type: "text",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "Pt2Line4c_MiddleName_Page12",
  // },

  // // Hidden Barcode
  // {
  //   key: "page12_barcode",
  //   label: "PDF417 Barcode (Page 12)",
  //   type: "hidden",
  //   section: "Part 9. Additional Information",
  //   pdfKey: "form1[0].#pageSet[0].Page1[11].PDF417BarCode1[0]",
  //   value: "form1[0].#pageSet[0].Page1[11].PDF417BarCode1[0]",
  // },
];

export const getInitialFormData = () => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => {
    data[f.key] = "";
    if (f.options) {
      f.options.forEach((opt) => {
        if (opt.pdfKey) {
          data[opt.pdfKey] = "";
        }
      });
    }
  });
  return data;
};

export const sectionIntroMessages = {
  Relationship: {
    greeting: "Let's start with the basics",
    message:
      "First, we need to understand your relationship with the person you're petitioning for. This helps us determine the right visa category and requirements for your case.",
  },
  "Information About You (Petitioner)": {
    greeting: "Now tell us about yourself",
    message:
      "Next, we'll collect your personal information as the petitioner. This includes your name, identification numbers, and other details USCIS needs to verify your identity.",
  },
  "Address History": {
    greeting: "Let's cover your address history",
    message:
      "USCIS requires a complete record of where you've lived in the last 5 years. We'll collect your current and previous addresses to ensure all records are accurate and up to date.",
  },
  "Biographic Information": {
    greeting: "Moving on to biographic details",
    message:
      "Now we'll gather some additional background information including your physical characteristics and personal history. This is standard for all immigration petitions.",
  },
  "Information About Your Relative": {
    greeting: "Now let's learn about your relative",
    message:
      "We'll collect detailed information about the beneficiary - the person you're petitioning for. This includes their personal details, background, and current situation.",
  },
  "Additional Information About Your Relative": {
    greeting: "A few more details about your relative",
    message:
      "We need some additional information about the beneficiary's immigration history and current status. This helps USCIS process the petition correctly.",
  },
  "Petitioner's Declaration": {
    greeting: "Almost there - declaration section",
    message:
      "This section contains important declarations and certifications. Please review each question carefully as these are legal statements.",
  },
  "Interpreter's Information": {
    greeting: "Interpreter information section",
    message:
      "If you used an interpreter to help complete this form, we'll need their information here. Skip this section if you completed the form without assistance.",
  },
  "Preparer's Information": {
    greeting: "Preparer information section",
    message:
      "If someone else helped prepare this form, we'll need their details. Skip this if you completed it yourself.",
  },
  "Part 9. Additional Information": {
    greeting: "Final section - additional information",
    message:
      "This is the last section. Use this space for any extra information that didn't fit in the previous sections. You're almost done!",
  },
  "Beneficiary's Native Language": {
    greeting: "Write in your native language",
    message:
      "If your relative's language uses a different alphabet (like Arabic, Chinese, or Urdu), please write their name and address using that alphabet here.",
  },
};

export const overflowFields = [
  {
    prefix: "address",
    countKey: "address_count",
    startIndex: 3,
    maxIndex: 9,
    pageNumber: "2",
    partNumber: "2",
    itemNumber: "14",
    labelPrefix: "Address",
    fields: [
      { suffix: "street", label: "Street" },
      { suffix: "city", label: "City" },
      { suffix: "state", label: "State" },
      { suffix: "zip", label: "Zip" },
      { suffix: "from", label: "From" },
      { suffix: "to", label: "To" },
      { suffix: "country", label: "Country" },
    ],
    formatInfo: (index: number, data: Record<string, string>) => {
      const street = data[`address_${index}_street`] || "";
      const city = data[`address_${index}_city`] || "";
      const state = data[`address_${index}_state`] || "";
      const zip = data[`address_${index}_zip`] || "";
      const from = data[`address_${index}_from`] || "";
      const to = data[`address_${index}_to`] || "";
      const country = data[`address_${index}_country`] || "";

      const parts = [street, city, state, zip, country].filter(Boolean);
      let info = `Address ${index}: ${parts.join("\n ")}.`;
      if (from || to) {
        info += ` From: ${from} To: ${to}`;
      }
      return info;
    },
  },
  {
    prefix: "spouse",
    countKey: "number_of_marriages",
    startIndex: 3,
    maxIndex: 8,
    pageNumber: "3",
    partNumber: "2",
    itemNumber: "22",
    labelPrefix: "Spouse",
    fields: [
      { suffix: "given_name", label: "First Name" },
      { suffix: "family_name", label: "Last Name" },
      { suffix: "middle_name", label: "Middle Name" },
      { suffix: "marriage_end_date", label: "Marriage End Date" },
    ],
    formatInfo: (index: number, data: Record<string, string>) => {
      const givenName = data[`spouse_${index}_given_name`] || "";
      const familyName = data[`spouse_${index}_family_name`] || "";
      const middleName = data[`spouse_${index}_middle_name`] || "";
      const endDate = data[`spouse_${index}_marriage_end_date`] || "";

      const nameParts = [givenName, middleName, familyName].filter(Boolean);
      let info = `Prior Spouse ${index - 1}: ${nameParts.join(" ")}.`;
      if (endDate) {
        info += ` Marriage Ended: ${endDate}`;
      }
      return info;
    },
  },
];

export const i130Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  sectionIntroMessages,
  overflowFields,
};

export default i130Config;
