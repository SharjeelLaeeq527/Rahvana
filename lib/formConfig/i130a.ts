import type { Field } from "./types";

export const formId = "i130a";
export const formTitle = "Form I-130A";
export const formSubtitle = "Supplemental Information for Spouse Beneficiary";

export const formFields: Field[] = [
  // ========================
  // G-28 & Attorney
  // ========================
  {
    key: "g28_attached",
    pdfKey: "g28_attached",
    label:
      "Is a Form G-28 (Notice of Entry of Appearance as Attorney or Accredited Representative) attached to this supplemental form?",
    type: "checkbox",
    section: "Attorney or Accredited Representative",
    options: [{ label: "Yes", value: "Yes", pdfKey: "g28_attached" }],
  },
  {
    key: "has_attorney_uscis_account",
    label: "Does your attorney or accredited representative have a USCIS Online Account Number?",
    type: "radio",
    section: "Attorney or Accredited Representative",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "g28_uscis_account",
        pdfKey: "attorney_uscis_acct",
        label:
          "Please provide your attorney's USCIS Online Account Number. This is a unique 12-digit number they use for online filings.",
        type: "text",
        tooltip:
          "This is the number created when your attorney makes an account at my.uscis.gov to file or track cases online. It is not the same as an A-Number. Leave blank if they have no online account.",
        condition: (d) => d.has_attorney_uscis_account === "Yes",
      },
    ],
  },
  {
    key: "has_attorney_bar_number",
    label: "Does your attorney have a State Bar Number?",
    type: "radio",
    section: "Attorney or Accredited Representative",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "attorney_bar_number",
        pdfKey: "attorney_bar_number",
        label: "What is your attorney's State Bar Number?",
        type: "text",
        tooltip:
          "A State Bar Number is the license ID a lawyer receives from the state bar association where they are allowed to practice law. Your attorney will know their own number.",
        condition: (d) => d.has_attorney_bar_number === "Yes",
      },
    ],
  },
  {
    key: "has_volag_number",
    label:
      "Do you have a Volag Number? (This is usually for representatives of voluntary agencies).",
    type: "radio",
    section: "Attorney or Accredited Representative",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_volag_number",
        pdfKey: "p1_volag_number",
        label: "What is your Volag Number?",
        type: "text",
        tooltip:
          "A Volag Number is an identifying number given to a nonprofit or voluntary agency that helps people with immigration. Leave blank if no such agency is representing you.",
        condition: (d) => d.has_volag_number === "Yes",
      },
    ],
  },

  // ========================
  // Part 1. Information About You (Spouse Beneficiary)
  // ========================
  {
    key: "p1_has_alien_number",
    label:
      "Do you have an Alien Registration Number (A-Number)? This is a 7 to 9-digit number often found on immigration documents like a Green Card.",
    type: "radio",
    section: "Part 1. Information About You (Spouse Beneficiary)",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_alien_number",
        pdfKey: "p1_alien_number",
        label: "What is your Alien Registration Number (A-Number)?",
        type: "text",
        tooltip:
          "An A-Number (Alien Registration Number) is a 7 to 9 digit number USCIS gives to non-citizens. You can find it on a green card, work permit, or immigration notices. Leave blank if there is none.",
        condition: (d) => d.p1_has_alien_number === "Yes",
        maxLength: 9,
      },
    ],
  },
  {
    key: "p1_has_uscis_account",
    label: "Do you have a USCIS Online Account Number?",
    type: "radio",
    section: "Part 1. Information About You (Spouse Beneficiary)",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p1_uscis_account",
        pdfKey: "p1_uscis_account",
        label: "What is your USCIS Online Account Number?",
        type: "text",
        tooltip:
          "This is the number created when you make an account at my.uscis.gov to file or track cases online. It is not the same as an A-Number. Leave blank if there is no online account.",
        condition: (d) => d.p1_has_uscis_account === "Yes",
        maxLength: 12,
      },
    ],
  },
  {
    key: "p1_family_name",
    pdfKey: "p1_family_name",
    label: "What is your current legal family name (last name)?",
    type: "text",
    section: "Part 1. Information About You (Spouse Beneficiary)",
    subQuestions: [
      {
        key: "p1_given_name",
        pdfKey: "p1_given_name",
        label: "What is your current legal given name (first name)?",
        type: "text",
      },
      {
        key: "p1_middle_name",
        pdfKey: "p1_middle_name",
        label: "What is your middle name? (If you don't have one, you can leave this blank).",
        type: "text",
      },
    ],
  },

  // Address History 1 (Current)
  {
    key: "p1_addr1_street",
    pdfKey: "p1_addr1_street",
    label:
      "What is your current street address? Please include the house number and street name (e.g., 123 Main St).",
    type: "text",
    section: "Address History 1 (Current)",
    subQuestions: [
      {
        key: "p1_addr1_unit_type",
        pdfKey: "p1_addr1_unit_apt", // Logic will need to handle multiple checkboxes based on value?
        // For simplicity in text config, we map to one, or use a dropdown.
        // Mapping "pdfKey" here is for display. The actual filler handles mapping logic if complex.
        // But here we are 1:1.
        // We will just expose the value fields.
        label: "Is this an apartment, suite, or floor?",
        type: "radio",
        options: [
          { label: "Apt", value: "apt", pdfKey: "p1_addr1_unit_apt" },
          { label: "Ste", value: "ste", pdfKey: "p1_addr1_unit_ste" },
          { label: "Flr", value: "flr", pdfKey: "p1_addr1_unit_flr" },
        ],
      },
      {
        key: "p1_addr1_unit_val",
        pdfKey: "p1_addr1_unit_val",
        label: "What is the unit number? (e.g., Apt 4B or Suite 200).",
        type: "text",
      },
      {
        key: "p1_addr1_city",
        pdfKey: "p1_addr1_city",
        label: "In which city or town do you currently live?",
        type: "text",
      },
      {
        key: "p1_addr1_state",
        pdfKey: "p1_addr1_state",
        label: "In which state do you currently live?",
        type: "dropdown",
        isState: true, // Or select list of states
    placeholder:"Select a state",
      },
      {
        key: "p1_addr1_zip",
        pdfKey: "p1_addr1_zip",
        label: "What is the ZIP code for your current address?",
        type: "text",
      },
      {
        key: "p1_addr1_province",
        pdfKey: "p1_addr1_province",
        label: "If you live outside the US, what is the province or region?",
        type: "text",
      },
      {
        key: "p1_addr1_postal",
        pdfKey: "p1_addr1_postal",
        label: "What is your postal code? (For addresses outside the US).",
        type: "text",
      },
      {
        key: "p1_addr1_country",
        pdfKey: "p1_addr1_country",
        label: "In which country do you currently live?",
        type: "text",
      },
      {
        key: "p1_addr1_date_from",
        pdfKey: "p1_addr1_date_from",
        label: "When did you start living at this address?",
        type: "date",
      },
      {
        key: "p1_addr1_date_to",
        pdfKey: "p1_addr1_date_to",
        label:
          "When did you stop living at this address? (If you still live here, you can enter today's date or 'Present').",
        type: "date",
      },
    ],
  },

  // Parents Information
  // {
  //   key: "p1_parents_header",
  //   label: "Parent 1 Information",
  //   type: "header",
  //   section: "Information About Your Parents",
  // },
  {
    key: "p1_parent1_family_name",
    pdfKey: "p1_parent1_family_name",
    label: "What is your father's family name (last name)?",
    type: "text",
    section: "Information About Your Parents",
    subQuestions: [
      {
        key: "p1_parent1_given_name",
        pdfKey: "p1_parent1_given_name",
        label: "What is your father's given name (first name)?",
        type: "text",
      },
      {
        key: "p1_parent1_middle_name",
        pdfKey: "p1_parent1_middle_name",
        label:
          "What is your father's middle name? (If he doesn't have one, you can leave this blank).",
        type: "text",
      },
      {
        key: "p1_parent1_dob",
        pdfKey: "p1_parent1_dob",
        label: "When was your father born? (mm/dd/yyyy)",
        type: "date",
      },
      {
        key: "p1_parent1_sex",
        pdfKey: "p1_parent1_sex_male",
        label: "Sex",
        type: "hidden",
        value: "Male",
      },
      {
        key: "p1_parent1_city_birth",
        pdfKey: "p1_parent1_city_birth",
        label: "In which city or town was your father born?",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent1_country_birth",
        pdfKey: "p1_parent1_country_birth",
        label: "In which country was your father born?",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent1_country_res",
        pdfKey: "p1_parent1_country_res",
        label: "In which country does your father currently live?",
        type: "text",
        section: "Information About Your Parents",
      },
    ],
  },

  // {
  //   key: "p1_parents2_header",
  //   label: "Parent 2 Information",
  //   type: "header",
  //   section: "Information About Your Parents",
  // },
  {
    key: "p1_parent2_family_name",
    pdfKey: "p1_parent2_family_name",
    label: "What is your mother's family name (last name)?",
    type: "text",
    section: "Information About Your Parents",
    subQuestions: [
      {
        key: "p1_parent2_given_name",
        pdfKey: "p1_parent2_given_name",
        label: "What is your mother's given name (first name)?",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent2_middle_name",
        pdfKey: "p1_parent2_middle_name",
        label:
          "What is your mother's middle name? (If she doesn't have one, you can leave this blank).",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent2_dob",
        pdfKey: "p1_parent2_dob",
        label: "When was your mother born? (mm/dd/yyyy)",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent2_sex",
        pdfKey: "p1_parent2_sex_female",
        label: "Sex",
        type: "hidden",
        value: "Female",
      },
      {
        key: "p1_parent2_city_birth",
        pdfKey: "p1_parent2_city_birth",
        label: "In which city or town was your mother born?",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent2_country_birth",
        pdfKey: "p1_parent2_country_birth",
        label: "In which country was your mother born?",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent2_city_res",
        pdfKey: "p1_parent2_city_res",
        label: "In which city or town does your mother currently live?",
        type: "text",
        section: "Information About Your Parents",
      },
      {
        key: "p1_parent2_country_res",
        pdfKey: "p1_parent2_country_res",
        label: "In which country does your mother currently live?",
        type: "text",
        section: "Information About Your Parents",
      },
    ],
  },

  // Employment
  // {
  //   key: "p2_emp_header",
  //   label: "Employment History (Last 5 Years)",
  //   type: "header",
  //   section: "Part 2. Information About Your Employment",
  // },
  {
    key: "p2_emp1_name",
    pdfKey: "p2_emp1_name",
    label:
      "What is the name of your current or most recent employer? (If you are currently unemployed, please type 'Unemployed').",
    type: "text",
    section: "Part 2. Information About Your Employment",
  },
  {
    key: "p2_emp1_street",
    pdfKey: "p2_emp1_street",
    label: "What is your employer's street address? (e.g., 123 Business Way).",
    type: "text",
    section: "Part 2. Information About Your Employment",
    subQuestions: [
      {
        key: "p2_emp1_unit_type",
        pdfKey: "p2_emp1_unit_apt",
        label: "Is this an apartment, suite, or floor?",
        type: "radio",
        options: [
          { label: "Apt", value: "apt", pdfKey: "p2_emp1_unit_apt" },
          { label: "Ste", value: "ste", pdfKey: "p2_emp1_unit_ste" },
          { label: "Flr", value: "flr", pdfKey: "p2_emp1_unit_flr" },
        ],
      },
      {
        key: "p2_emp1_unit_val",
        pdfKey: "p2_emp1_unit_val",
        label: "What is the unit number? (e.g., Suite 200).",
        type: "text",
      },
      {
        key: "p2_emp1_city",
        pdfKey: "p2_emp1_city",
        label: "In which city or town is your employer located?",
        type: "text",
      },
      {
        key: "p2_emp1_state",
        pdfKey: "p2_emp1_state",
        label: "In which state?",
        type: "dropdown",
    isState: true,
    placeholder:"Select a state",
      },
      {
        key: "p2_emp1_zip",
        pdfKey: "p2_emp1_zip",
        label: "What is the ZIP code?",
        type: "text",
      },
      {
        key: "p2_emp1_province",
        pdfKey: "p2_emp1_province",
        label: "If your employer is outside the US, what is the province or region?",
        type: "text",
      },
      {
        key: "p2_emp1_postal",
        pdfKey: "p2_emp1_postal",
        label: "What is the postal code?",
        type: "text",
      },
      {
        key: "p2_emp1_country",
        pdfKey: "p2_emp1_country",
        label: "In which country is your employer located?",
        type: "text",
      },
    ],
  },
  {
    key: "p2_emp1_occupation",
    pdfKey: "p2_emp1_occupation",
    label: "What is your job title or occupation? (e.g., Software Engineer, Manager, etc.)",
    type: "text",
    section: "Part 2. Information About Your Employment",
  },
  {
    key: "p2_emp1_date_from",
    pdfKey: "p2_emp1_date_from",
    label: "When did you start working at this job?",
    type: "date",
    section: "Part 2. Information About Your Employment",
    subQuestions: [
      {
        key: "p2_emp1_date_to",
        pdfKey: "p2_emp1_date_to",
        label:
          "When did you stop working at this job? (If you still work here, you can enter today's date or 'Present').",
        type: "date",
      },
    ],
  },
  // Employment 2
  {
    key: "p2_emp2_name",
    pdfKey: "p2_emp2_name",
    label: "What was the name of your previous employer?",
    type: "text",
    section: "Part 2. Information About Your Employment",
  },
  {
    key: "p2_emp2_street",
    pdfKey: "p2_emp2_street",
    label: "What was your previous employer's street address?",
    type: "text",
    section: "Part 2. Information About Your Employment",
    subQuestions: [
      {
        key: "p2_emp2_unit_type",
        pdfKey: "p2_emp2_unit_apt",
        label: "Was this an apartment, suite, or floor?",
        type: "radio",
        options: [
          { label: "Apt", value: "apt", pdfKey: "p2_emp2_unit_apt" },
          { label: "Ste", value: "ste", pdfKey: "p2_emp2_unit_ste" },
          { label: "Flr", value: "flr", pdfKey: "p2_emp2_unit_flr" },
        ],
        section: "Part 2. Information About Your Employment",
      },
      {
        key: "p2_emp2_unit_val",
        pdfKey: "p2_emp2_unit_val",
        label: "What was the unit number?",
        type: "text",
        section: "Part 2. Information About Your Employment",
      },
      {
        key: "p2_emp2_city",
        pdfKey: "p2_emp2_city",
        label: "In which city or town was your previous employer located?",
        type: "text",
        section: "Part 2. Information About Your Employment",
      },
      {
        key: "p2_emp2_state",
        pdfKey: "p2_emp2_state",
        label: "In which state?",
        type: "dropdown",
    isState: true,
    placeholder:"Select a state",
        section: "Part 2. Information About Your Employment",
      },
      {
        key: "p2_emp2_zip",
        pdfKey: "p2_emp2_zip",
        label: "What was the ZIP code?",
        type: "text",
        section: "Part 2. Information About Your Employment",
      },
      {
        key: "p2_emp2_province",
        pdfKey: "p2_emp2_province",
        label: "What was the province or region?",
        type: "text",
        section: "Part 2. Information About Your Employment",
      },
      {
        key: "p2_emp2_postal",
        pdfKey: "p2_emp2_postal",
        label: "What was the postal code?",
        type: "text",
        section: "Part 2. Information About Your Employment",
      },
      {
        key: "p2_emp2_country",
        pdfKey: "p2_emp2_country",
        label: "In which country was your previous employer located?",
        type: "text",
        section: "Part 2. Information About Your Employment",
      },
    ],
  },
  {
    key: "p2_emp2_occupation",
    pdfKey: "p2_emp2_occupation",
    label: "What was your job title or occupation? (e.g., Software Engineer, Manager, etc.)",
    type: "text",
    section: "Part 2. Information About Your Employment",
  },
  {
    key: "p2_emp2_date_from",
    pdfKey: "p2_emp2_date_from",
    label: "When did you start working at this job?",
    type: "date",
    section: "Part 2. Information About Your Employment",
    subQuestions: [
      {
        key: "p2_emp2_date_to",
        pdfKey: "p2_emp2_date_to",
        label: "When did you stop working at this job?",
        type: "date",
        section: "Part 2. Information About Your Employment",
      },
    ],
  },

  // Employment 3 (Part 3)
  {
    key: "",
    pdfKey: "",
    label:
      "Provide your last occupation outside the United States if not shown above.  If you never worked outside the United States, provide this information in the space provided in Part 7. ",
    type: "hidden",
    section: "Part 3. Employment Outside the United States",
  },
  {
    key: "p3_emp3_name",
    pdfKey: "p3_emp3_name",
    label:
      "What was the name of your last employer outside the United States? (If you haven't mentioned them already).",
    type: "text",
    section: "Part 3. Employment Outside the United States",
  },
  {
    key: "p3_emp3_street",
    pdfKey: "p3_emp3_street",
    label: "What was the street address of this employer?",
    type: "text",
    section: "Part 3. Employment Outside the United States",
    subQuestions: [
      {
        key: "p2_emp1_unit_type",
        pdfKey: "p2_emp1_unit_apt",
        label: "Was this an apartment, suite, or floor?",
        type: "radio",
        options: [
          { label: "Apt", value: "apt", pdfKey: "p3_emp3_unit_apt" },
          { label: "Ste", value: "ste", pdfKey: "p3_emp3_unit_ste" },
          { label: "Flr", value: "flr", pdfKey: "p3_emp3_unit_flr" },
        ],
      },
      {
        key: "p3_emp3_unit_val",
        pdfKey: "p3_emp3_unit_val",
        label: "What was the unit number?",
        type: "text",
      },
      {
        key: "p3_emp3_city",
        pdfKey: "p3_emp3_city",
        label: "In which city or town was this employer located?",
        type: "text",
      },
      {
        key: "p3_emp3_state",
        pdfKey: "p3_emp3_state",
        label: "In which state or region?",
      type: "dropdown",
    isState: true,
    placeholder:"Select a state",
      },
      {
        key: "p3_emp3_zip",
        pdfKey: "p3_emp3_zip",
        label: "What was the ZIP code or postal code?",
        type: "text",
      },
      {
        key: "p3_emp3_country",
        pdfKey: "p3_emp3_country",
        label: "In which country was this employer located?",
        type: "text",
      },
    ],
  },
  {
    key: "p3_emp3_occupation",
    pdfKey: "p3_emp3_occupation",
    label: "What was your job title or occupation at this company?",
    type: "text",
    section: "Part 3. Employment Outside the United States",
  },
  {
    key: "p3_emp3_date_from",
    pdfKey: "p3_emp3_date_from",
    label: "When did you start working there?",
    type: "text",
    section: "Part 3. Employment Outside the United States",
    subQuestions: [
      {
        key: "p3_emp3_date_to",
        pdfKey: "p3_emp3_date_to",
        label: "When did you stop working there?",
        type: "text",
      },
    ],
  },

  // Part 4
  {
    key: "p4_language_english_chk",
    pdfKey: "p4_language_english_chk",
    label:
      "Can you read and understand English? (This helps us know if you needed an interpreter for this form).",
    type: "checkbox",
    section: "Part 4.  Spouse Information",
    options: [{ label: "Yes", value: "Yes", pdfKey: "p4_language_english_chk" }],
  },

  {
    key: "p4_language_interp_lang",
    pdfKey: "p4_language_interp_lang",
    label:
      "If you used an interpreter, what language did they use to explain the questions to you?",
    type: "text",
    section: "Part 4.  Spouse Information",
  },
  {
    key: "p4_interpreter_chk",
    pdfKey: "p4_interpreter_chk",
    label:
      "Did the interpreter named in Part 5 read every question and instruction on this form to you in your native language?",
    type: "checkbox",
    section: "Part 4.  Spouse Information",
    options: [{ label: "Yes", value: "Yes", pdfKey: "p4_interpreter_chk" }],
  },
  {
    key: "p4_interpreter_name",
    pdfKey: "p4_interpreter_name",
    label: "What is the name of the interpreter who helped you?",
    type: "text",
    section: "Part 4.  Spouse Information",
  },
  {
    key: "p4_phone",
    pdfKey: "p4_phone",
    label: "What is your daytime telephone number?",
    type: "text",
    section: "Part 4.  Spouse Information",
  },
  {
    key: "p4_mobile",
    pdfKey: "p4_mobile",
    label: "What is your mobile (cell) phone number?",
    type: "text",
    section: "Part 4.  Spouse Information",
  },
  {
    key: "p4_email",
    pdfKey: "p4_email",
    label: "What is your email address? (e.g., yourname@example.com).",
    type: "text",
    section: "Part 4.  Spouse Information",
  },
  {
    key: "p4_signature",
    pdfKey: "p4_signature",
    label: "Please type your full legal name as your electronic signature.",
    type: "text",
    section: "Part 4.  Spouse Information",
  },
  {
    key: "p4_date_signed",
    pdfKey: "p4_date_signed",
    label: "What is today's date? (mm/dd/yyyy)",
    type: "date",
    section: "Part 4.  Spouse Information",
  },

  // Part 5 - Interpreter
  {
    key: "p5_interp_family_name",
    pdfKey: "p5_interp_family_name",
    label: "What is the interpreter's family name (last name)?",
    type: "text",
    section: "Part 5. Interpreter Information",
    subQuestions: [
      {
        key: "p5_interp_given_name",
        pdfKey: "p5_interp_given_name",
        label: "What is the interpreter's given name (first name)?",
        type: "text",
      },
    ],
  },
  {
    key: "p5_has_interp_business",
    label: "Is the interpreter working through a business or organization?",
    type: "radio",
    section: "Part 5. Interpreter Information",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p5_interp_business",
        pdfKey: "p5_interp_business",
        label: "What is the name of the interpreter's business or organization?",
        type: "text",
        condition: (d) => d.p5_has_interp_business === "Yes",
      },
    ],
  },
  {
    key: "p5_interp_street",
    pdfKey: "p5_interp_street",
    label: "What is the interpreter's street address?",
    type: "text",
    section: "Part 5. Interpreter Information",
    subQuestions: [
      {
        key: "p5_interp_unit_type",
        pdfKey: "p5_interp_unit_apt",
        label: "Is their address an apartment, suite, or floor?",
        type: "radio",
        options: [
          { label: "Apt", value: "apt", pdfKey: "p5_interp_unit_apt" },
          { label: "Ste", value: "ste", pdfKey: "p5_interp_unit_ste" },
          { label: "Flr", value: "flr", pdfKey: "p5_interp_unit_flr" },
        ],
      },
      {
        key: "p5_interp_unit_val",
        pdfKey: "p5_interp_unit_val",
        label: "What is the unit number?",
        type: "text",
      },
      {
        key: "p5_interp_city",
        pdfKey: "p5_interp_city",
        label: "In which city or town is the interpreter located?",
        type: "text",
      },
      {
        key: "p5_interp_state",
        pdfKey: "p5_interp_state",
        label: "In which state?",
        type: "dropdown",
    isState: true,
    placeholder:"Select a state",
      },
      {
        key: "p5_interp_zip",
        pdfKey: "p5_interp_zip",
        label: "What is the ZIP code?",
        type: "text",
      },
      {
        key: "p5_interp_province",
        pdfKey: "p5_interp_province",
        label: "If the interpreter is outside the US, what is the province or region?",
        type: "text",
      },
      {
        key: "p5_interp_postal",
        pdfKey: "p5_interp_postal",
        label: "What is the postal code?",
        type: "text",
      },
      {
        key: "p5_interp_country",
        pdfKey: "p5_interp_country",
        label: "In which country is the interpreter located?",
        type: "text",
      },
    ],
  },
  {
    key: "p5_interp_phone",
    pdfKey: "p5_interp_phone",
    label: "What is the interpreter's daytime telephone number?",
    type: "text",
    section: "Part 5. Interpreter Information",
  },
  {
    key: "p5_interp_email",
    pdfKey: "p5_interp_email",
    label: "What is the interpreter's email address?",
    type: "text",
    section: "Part 5. Interpreter Information",
  },
  {
    key: "p5_interp_language",
    pdfKey: "p5_interp_language",
    label: "What language is the interpreter fluent in? (The language used to translate for you).",
    type: "text",
    section: "Part 5. Interpreter Information",
  },
  {
    key: "p5_interp_signature",
    pdfKey: "p5_interp_signature",
    label: "Please type the interpreter's full legal name as their electronic signature.",
    type: "text",
    section: "Part 5. Interpreter Information",
    subQuestions: [
      {
        key: "p5_interp_date_signed",
        pdfKey: "p5_interp_date_signed",
        label: "On what date is the interpreter signing this form? (mm/dd/yyyy)",
        type: "date",
      },
    ],
  },
  // Part 6 - Preparer
  {
    key: "p6_prep_given_name",
    pdfKey: "p6_prep_given_name",
    label: "What is the preparer's given name (first name)?",
    type: "text",
    section: "Part 6. Preparer Information",
    subQuestions: [
      {
        key: "p6_prep_family_name",
        pdfKey: "p6_prep_family_name",
        label: "What is the preparer's family name (last name)?",
        type: "text",
      },
    ],
  },
  {
    key: "p6_has_prep_business",
    label: "Is the preparer working through a business or organization?",
    type: "radio",
    section: "Part 6. Preparer Information",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "p6_prep_business",
        pdfKey: "p6_prep_business",
        label: "What is the name of the preparer's business or organization?",
        type: "text",
        condition: (d) => d.p6_has_prep_business === "Yes",
      },
    ],
  },
  {
    key: "p6_prep_street",
    pdfKey: "p6_prep_street",
    label: "What is the preparer's street address?",
    type: "text",
    section: "Part 6. Preparer Information",
    subQuestions: [
      {
        key: "p6_prep_unit_type",
        pdfKey: "p6_prep_unit_apt",
        label: "Is their address an apartment, suite, or floor?",
        type: "radio",
        options: [
          { label: "Apt", value: "apt", pdfKey: "p6_prep_unit_apt" },
          { label: "Ste", value: "ste", pdfKey: "p6_prep_unit_ste" },
          { label: "Flr", value: "flr", pdfKey: "p6_prep_unit_flr" },
        ],
      },
      {
        key: "p6_prep_unit_val",
        pdfKey: "p6_prep_unit_val",
        label: "What is the unit number?",
        type: "text",
      },
      {
        key: "p6_prep_city",
        pdfKey: "p6_prep_city",
        label: "In which city or town is the preparer located?",
        type: "text",
      },
      {
        key: "p6_prep_state",
        pdfKey: "p6_prep_state",
        label: "In which state?",
        type: "dropdown",
    isState: true,
    placeholder:"Select a state",
      },
      {
        key: "p6_prep_zip",
        pdfKey: "p6_prep_zip",
        label: "What is the ZIP code?",
        type: "text",
      },
      {
        key: "p6_prep_province",
        pdfKey: "p6_prep_province",
        label: "If the preparer is outside the US, what is the province or region?",
        type: "text",
      },
      {
        key: "p6_prep_postal",
        pdfKey: "p6_prep_postal",
        label: "What is the postal code?",
        type: "text",
      },
      {
        key: "p6_prep_country",
        pdfKey: "p6_prep_country",
        label: "In which country is the preparer located?",
        type: "text",
      },
    ],
  },
  {
    key: "p6_prep_phone",
    pdfKey: "p6_prep_phone",
    label: "What is the preparer's daytime telephone number?",
    type: "text",
    section: "Part 6. Preparer Information",
  },
  {
    key: "p6_prep_fax",
    pdfKey: "p6_prep_fax",
    label: "What is the preparer's fax number? (If they have one).",
    type: "text",
    section: "Part 6. Preparer Information",
  },
  {
    key: "p6_prep_email",
    pdfKey: "p6_prep_email",
    label: "What is the preparer's email address?",
    type: "text",
    section: "Part 6. Preparer Information",
  },
  {
    key: "p6_prep_statement_chk",
    pdfKey: "p6_prep_statement_chk1",
    label: "Is the preparer an attorney or an accredited representative?",
    type: "radio",
    options: [
      {
        label: "I am not an attorney or accredited representative.",
        value: "not_attorney",
        pdfKey: "p6_prep_statement_chk1",
      },
      {
        label: "I am an attorney or accredited representative.",
        value: "attorney",
        pdfKey: "p6_prep_statement_chk2",
      },
    ],
    section: "Part 6. Preparer Information",
  },
  {
    key: "p6_prep_attorney_chk",
    pdfKey: "p6_prep_attorney_chk1",
    label: "Does the attorney's representation extend to this entire form?",
    type: "radio",
    options: [
      {
        label: "My representation extends to this form.",
        value: "extends",
        pdfKey: "p6_prep_attorney_chk1",
      },
      {
        label: "My representation does not extend to this form.",
        value: "does_not_extend",
        pdfKey: "p6_prep_attorney_chk2",
      },
    ],
    section: "Part 6. Preparer Information",
    condition: (d) => d.p6_prep_statement_chk === "attorney",
  },
  {
    key: "p6_prep_signature",
    pdfKey: "p6_prep_signature",
    label: "Please type the preparer's full legal name as their electronic signature.",
    type: "text",
    section: "Part 6. Preparer Information",
    subQuestions: [
      {
        key: "p6_prep_date_signed",
        pdfKey: "p6_prep_date_signed",
        label: "On what date is the preparer signing this form? (mm/dd/yyyy)",
        type: "date",
      },
    ],
  },

  // Part 7 - Additional Information
  {
    key: "p7_add_info_page1",
    pdfKey: "p7_add_info_page1",
    label: "Page Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_part1",
    pdfKey: "p7_add_info_part1",
    label: "Part Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_item1",
    pdfKey: "p7_add_info_item1",
    label: "Item Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_desc1",
    pdfKey: "p7_add_info_desc1",
    label: "Additional Information",
    type: "textarea",
    section: "Part 7. Additional Information",
  },

  {
    key: "p7_add_info_page2",
    pdfKey: "p7_add_info_page2",
    label: "Page Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_part2",
    pdfKey: "p7_add_info_part2",
    label: "Part Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_item2",
    pdfKey: "p7_add_info_item2",
    label: "Item Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_desc2",
    pdfKey: "p7_add_info_desc2",
    label: "Additional Information",
    type: "textarea",
    section: "Part 7. Additional Information",
  },

  {
    key: "p7_add_info_page3",
    pdfKey: "p7_add_info_page3",
    label: "Page Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_part3",
    pdfKey: "p7_add_info_part3",
    label: "Part Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_item3",
    pdfKey: "p7_add_info_item3",
    label: "Item Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_desc3",
    pdfKey: "p7_add_info_desc3",
    label: "Additional Information",
    type: "textarea",
    section: "Part 7. Additional Information",
  },

  {
    key: "p7_add_info_page4",
    pdfKey: "p7_add_info_page4",
    label: "Page Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_part4",
    pdfKey: "p7_add_info_part4",
    label: "Part Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_item4",
    pdfKey: "p7_add_info_item4",
    label: "Item Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_desc4",
    pdfKey: "p7_add_info_desc4",
    label: "Additional Information",
    type: "textarea",
    section: "Part 7. Additional Information",
  },

  {
    key: "p7_add_info_page5",
    pdfKey: "p7_add_info_page5",
    label: "Page Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_part5",
    pdfKey: "p7_add_info_part5",
    label: "Part Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_item5",
    pdfKey: "p7_add_info_item5",
    label: "Item Number",
    type: "text",
    section: "Part 7. Additional Information",
  },
  {
    key: "p7_add_info_desc5",
    pdfKey: "p7_add_info_desc5",
    label: "Additional Information",
    type: "textarea",
    section: "Part 7. Additional Information",
  },
];

export const getInitialFormData = () => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => (data[f.key] = ""));
  return data;
};

export const sectionIntroMessages = {
  "Attorney or Accredited Representative": {
    greeting: "Let's start with your representative",
    message:
      "If you have an attorney or an accredited representative helping you with this form, we'll collect their information first. If not, don't worry-you can skip this part.",
  },
  "Part 1. Information About You (Spouse Beneficiary)": {
    greeting: "Now, let's talk about you",
    message:
      "In this section, we'll gather some basic details about you, the spouse beneficiary. This helps USCIS identify who is receiving the benefits of this petition.",
  },
  "Address History 1 (Current)": {
    greeting: "Tell us where you live",
    message:
      "We need to know your current address and where you've lived in the past. This is a standard part of the process to ensure USCIS has your complete history.",
  },
  "Information About Your Parents": {
    greeting: "A bit about your family",
    message:
      "Now we'll ask for some information about your parents. This helps verify your family background and history.",
  },
  "Part 2. Information About Your Employment": {
    greeting: "Now let's cover your work history",
    message:
      "USCIS requires a record of your employment over the last 5 years. This helps them understand your professional background.",
  },
  "Part 3. Employment Outside the United States": {
    greeting: "Your work outside the U.S.",
    message:
      "If you've worked outside the United States, please provide those details here. This completes your professional history record.",
  },
  "Part 4. Spouse Information": {
    greeting: "Almost done-some final details",
    message:
      "This section includes your contact information and declarations. Please review everything carefully before moving forward.",
  },
  "Part 5. Interpreter Information": {
    greeting: "Interpreter details",
    message:
      "If you used an interpreter to help you understand or complete this form, we'll need their information here.",
  },
  "Part 6. Preparer Information": {
    greeting: "Preparer details",
    message:
      "If someone else helped you prepare this form, we'll need their details in this section.",
  },
  "Part 7. Additional Information": {
    greeting: "Final section-anything else?",
    message:
      "This is the last section. You can use this space for any extra information that didn't fit in the previous parts. You're almost there!",
  },
};

export const i130aConfig = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  getInitialFormData,
  sectionIntroMessages,
};

export default i130aConfig;
