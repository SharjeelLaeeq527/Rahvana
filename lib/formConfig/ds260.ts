import type { Field } from "./types";

export const formId = "ds260";
export const formTitle = "Form DS-260";
export const formSubtitle = "Immigrant Visa Electronic Application";

export const formFields: Field[] = [
  {
    key: "S01-Q001",
    pdfKey: "S01-Q001",
    label:
      "What is your full legal name? (Please enter it as: Last Name, First Name)",
    originalLabel: "Name Provided (Surnames, Given Names)",
    type: "text",
    section: "SECTION 1: Personal Information - Name and Identity",
    tooltip: `- Enter your name EXACTLY as it appears in your passport - Use the same order as passport: surnames first, then given names - Include all names shown; do not leave out middle names - Common mistake: reversing surname and given name order`,
  },
  {
    key: "S01-has_native_name",
    label:
      "Is your name normally written in a script other than the standard English alphabet? (For example: Arabic, Chinese, or Russian script)",
    type: "radio",
    section: "SECTION 1: Personal Information - Name and Identity",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S01-Q002",
        pdfKey: "S01-Q002",
        label:
          "Please type your name exactly as it is written in your native script.",
        originalLabel: "Full Name in Native Language",
        type: "text",
        tooltip: `- Only required if your native language uses non-Roman characters (Arabic, Chinese, Russian, etc.) - Type your name in the native script - If your native language uses Roman letters (English, Spanish, French), you may skip this or write 'SAME'`,
        condition: (data: Record<string, string>) =>
          data["S01-has_native_name"] === "Yes",
      },
    ],
  },
  {
    key: "S01-Q003",
    pdfKey: "S01-Q003",
    label:
      "Have you ever gone by any other names? (This includes maiden names, nicknames, or any other professional or religious names you've used formally.)",
    originalLabel: "Other Names Used",
    type: "text",
    section: "SECTION 1: Personal Information - Name and Identity",
    tooltip: `- Include maiden names, previous married names, nicknames used on official documents - Include aliases, professional names, religious names if used formally - Do NOT include casual nicknames never used on documents - Answer 'NO' only if you have never used another name officially`,
  },
  {
    key: "S01-Q004",
    pdfKey: "S01-Q004",
    label:
      "What is your gender? (Please select the gender shown on your official passport.)",
    originalLabel: "Sex",
    type: "radio",
    section: "SECTION 1: Birth Information",
    tooltip: `- Select Male or Female as shown on your passport - Must match your passport exactly - If passport shows different gender from birth certificate, use passport`,
    options: [
      { label: "Male", value: "Male", pdfKey: "S01-Q004_Male" },
      { label: "Female", value: "Female", pdfKey: "S01-Q004_Female" },
    ],
  },
  {
    key: "S01-Q005",
    pdfKey: "S01-Q005",
    label:
      "What is your current marital status? (Are you single, married, divorced, or widowed?)",
    originalLabel: "Current Marital Status",
    type: "text",
    section: "SECTION 1: Birth Information",
    tooltip: `- Options: Single, Married, Widowed, Divorced, Legally Separated - Choose current status on the date you fill out the form - If divorced, you must have final divorce decree - If separated but not legally divorced, choose 'Married'`,
  },
  {
    key: "S01-Q006",
    pdfKey: "S01-Q006",
    label:
      "When were you born? (Please use the format: DD Month YYYY, for example: 15 January 1985)",
    originalLabel: "Date of Birth",
    type: "date",
    section: "SECTION 1: Birth Information",
    tooltip: `- Use format: DD Month YYYY (e.g., 15 January 1985) - Must match your passport and birth certificate - If documents show different dates, bring both to interview and explain - Cannot be changed after submission without unlocking form`,
  },
  {
    key: "S01-Q007",
    pdfKey: "S01-Q007",
    label: "In which city or town were you born?",
    originalLabel: "City of Birth",
    type: "text",
    section: "SECTION 1: Birth Information",
    tooltip: `- Use the city name as shown on your birth certificate - If born in rural area, use nearest town or district - Spell using Roman letters`,
  },
  {
    key: "S01-Q008",
    pdfKey: "S01-Q008",
    label: "What state, province, or region were you born in?",
    originalLabel: "State/Province of Birth",
    type: "text",
    section: "SECTION 1: Birth Information",
    tooltip: `- Use official state/province name from birth certificate - If country has no states/provinces, enter 'DOES NOT APPLY' or the country name - For former countries (e.g., USSR, Yugoslavia), use the region at time of birth`,
  },
  {
    key: "S01-Q009",
    pdfKey: "S01-Q009",
    label: "In which country were you born?",
    originalLabel: "Country/Region of Birth",
    type: "text",
    section: "SECTION 1: Birth Information",
    tooltip: `- Use current country name (e.g., if born in USSR, specify Russia, Ukraine, etc.) - If country no longer exists, use modern equivalent - Must match birth certificate country field`,
  },
  {
    key: "S01-Q010",
    pdfKey: "S01-Q010",
    label: "What is your current nationality or citizenship?",
    originalLabel: "Country/Region of Origin (Nationality)",
    type: "text",
    section: "SECTION 1: Passport and Citizenship",
    tooltip: `- Enter the country that issued your passport - If you have dual citizenship, enter the nationality of the passport you will use - This is your citizenship, not your ethnicity or place of birth`,
  },
  {
    key: "S01-Q011",
    pdfKey: "S01-Q011",
    label:
      "What kind of travel document will you be using for your trip? (Most people use a Passport)",
    originalLabel: "Document Type",
    type: "text",
    section: "SECTION 1: Passport and Citizenship",
    tooltip: `- Most applicants select 'PASSPORT' - Other options: Travel Document, Refugee Travel Document - Must be valid for at least 6 months beyond intended entry date`,
  },
  {
    key: "S01-Q012",
    pdfKey: "S01-Q012",
    label: "What is your passport number?",
    originalLabel: "Document ID (Passport Number)",
    type: "text",
    section: "SECTION 1: Passport and Citizenship",
    tooltip: `- Enter exactly as shown on passport bio-data page - Include all letters and numbers; no spaces - Double-check for accuracy - errors delay processing`,
  },
  {
    key: "S01-Q013",
    pdfKey: "S01-Q013",
    label: "Which country issued your passport?",
    originalLabel: "Country/Authority that Issued Document",
    type: "text",
    section: "SECTION 1: Passport and Citizenship",
    tooltip: `- Must match your nationality - Enter official country name (e.g., 'PAKISTAN' not 'Islamic Republic of Pakistan')`,
  },
  {
    key: "S01-Q014",
    pdfKey: "S01-Q014",
    label: "When was your passport issued?",
    originalLabel: "Issuance Date",
    type: "date",
    section: "SECTION 1: Passport and Citizenship",
    tooltip: `- Found on passport bio-data page - Format: DD Month YYYY - Must be before expiration date`,
  },
  {
    key: "S01-Q015",
    pdfKey: "S01-Q015",
    label: "And when does your passport expire?",
    originalLabel: "Expiration Date",
    type: "date",
    section: "SECTION 1: Passport and Citizenship",
    tooltip: `- Found on passport bio-data page - Passport must be valid for at least 6 months beyond your intended entry - Renew passport BEFORE filling DS-260 if expiring soon`,
  },
  {
    key: "S01-Q016",
    pdfKey: "S01-Q016",
    label:
      "Do you currently hold, or have you ever held, citizenship in any other country?",
    originalLabel:
      "Do you hold or have you held any nationality other than the one you have indicated above?",
    type: "radio",
    section: "SECTION 1: Passport and Citizenship",
    tooltip: `- Answer YES if you have dual citizenship or previously held another citizenship - Answer YES even if you renounced the other citizenship - Includes citizenship by birth, descent, naturalization, or marriage - You will need to provide details if you answer YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S01-Q016_Yes" },
      { label: "No", value: "No", pdfKey: "S01-Q016_No" },
    ],
    subQuestions: [
      {
        key: "S01-Q016A",
        pdfKey: "S01-Q016A",
        label:
          "Please list the other countries where you hold or have held citizenship.",
        originalLabel: "Other Citizenship Country",
        type: "text",
        tooltip: `- List all other citizenships (current or previous) - Include country name and whether current or renounced - Example: 'Pakistan (current), India (renounced 2010)'`,
        condition: (data: Record<string, string>) => data["S01-Q016"] === "Yes",
      },
    ],
  },
  {
    key: "S01-Q017",
    pdfKey: "S01-Q017",
    label:
      "Where do you live right now, and when did you move to this address?",
    originalLabel:
      "Present Address (Street Address, City, State/Province, Postal Code, Country, From Date)",
    type: "date",
    section: "SECTION 1: Address and Phone Information",
    tooltip: `- Provide your physical address where you currently live - Include apartment/unit number if applicable - From Date: month and year you moved to this address (e.g., 'JANUARY 2020') - This must be your actual residence, not a P.O. Box`,
  },
  {
    key: "S01-Q018",
    pdfKey: "S01-Q018",
    label: "Have you lived anywhere else since you turned 16 years old?",
    originalLabel:
      "Have you lived anywhere other than this address since the age of sixteen?",
    type: "radio",
    section: "SECTION 1: Address and Phone Information",
    tooltip: `- Answer YES if you have lived anywhere else since age 16 - You must list ALL addresses for the years since age 16 - Include addresses in all countries - Prepare list in advance: address, city, country, from/to dates - List in reverse chronological order (most recent first)`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S01-Q018_Yes" },
      { label: "No", value: "No", pdfKey: "S01-Q018_No" },
    ],
    subQuestions: [
      {
        key: "S01-Q018A",
        pdfKey: "S01-Q018A",
        label:
          "Please list all the other places you've lived since you were 16, starting with the most recent.",
        originalLabel: "Previous Addresses",
        type: "textarea",
        section: "SECTION 1: Address and Phone Information",
        tooltip: `- List ALL addresses since age 16 in reverse chronological order - Format: Street, City, Country, From Month/Year - To Month/Year - Include all countries - Be comprehensive`,
        condition: (data: Record<string, string>) => data["S01-Q018"] === "Yes",
      },
    ],
  },
  {
    key: "S01-Q019",
    pdfKey: "S01-Q019",
    label:
      "What is your primary phone number? (Please include your country code, like +92 for Pakistan)",
    originalLabel: "Primary Phone Number",
    type: "text",
    section: "SECTION 1: Address and Phone Information",
    tooltip: `- Include country code (e.g., +92 for Pakistan) - Format: +[country code][number] or as CEAC format allows - Must be a number where you can be reached - NVC and embassy will use this to contact you`,
  },
  {
    key: "S01-has_secondary_phone",
    label: "Do you have another phone number we can use as a backup?",
    type: "radio",
    section: "SECTION 1: Address and Phone Information",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S01-Q020",
        pdfKey: "S01-Q020",
        label: "What is your secondary phone number?",
        originalLabel: "Secondary Phone Number",
        type: "text",
        tooltip: `- Provide if available (alternate mobile, family member's number) - Can enter 'DOES NOT APPLY' if you do not have one - Useful to provide backup contact number`,
        condition: (data: Record<string, string>) =>
          data["S01-has_secondary_phone"] === "Yes",
      },
    ],
  },
  {
    key: "S01-has_work_phone",
    label: "Do you have a work phone number?",
    type: "radio",
    section: "SECTION 1: Address and Phone Information",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S01-Q021",
        pdfKey: "S01-Q021",
        label: "What is your work phone number?",
        originalLabel: "Work Phone Number",
        type: "text",
        tooltip: `- Provide if you are employed and have work phone - Can enter 'DOES NOT APPLY' if not employed or no work phone`,
        condition: (data: Record<string, string>) =>
          data["S01-has_work_phone"] === "Yes",
      },
    ],
  },
  {
    key: "S01-has_other_phones",
    label: "Have you used any other phone numbers in the last 5 years?",
    type: "radio",
    section: "SECTION 1: Address and Phone Information",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S01-Q022",
        pdfKey: "S01-Q022",
        label: "Please list any other phone numbers you've used recently.",
        originalLabel: "Other Telephone Numbers Used",
        type: "text",
        tooltip: `- Answer YES if you had different phone numbers recently - Include old mobile numbers, landlines you used - Embassy may verify contact history`,
        condition: (data: Record<string, string>) =>
          data["S01-has_other_phones"] === "Yes",
      },
    ],
  },
  {
    key: "S01-Q023",
    pdfKey: "S01-Q023",
    label: "What is your primary email address?",
    originalLabel: "Email Address",
    type: "text",
    section: "SECTION 1: Email and Social Media",
    tooltip: `- Use an email you check regularly - NVC will send important updates to this email - Avoid email addresses that may become inactive - Common issue: typos in email address cause missed communications`,
  },
  {
    key: "S01-has_other_emails",
    label: "Have you used any other email addresses in the last 5 years?",
    type: "radio",
    section: "SECTION 1: Email and Social Media",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S01-Q024",
        pdfKey: "S01-Q024",
        label: "Please list those other email addresses.",
        originalLabel: "Other Email Addresses Used",
        type: "text",
        section: "SECTION 1: Email and Social Media",
        tooltip: `- Answer YES if you used other emails for official purposes - Include old work emails, school emails - List each with dates used if possible`,
        condition: (data: Record<string, string>) =>
          data["S01-has_other_emails"] === "Yes",
      },
    ],
  },
  {
    key: "S01-Q025",
    pdfKey: "S01-Q025",
    label:
      "Which social media platforms have you used in the last 5 years? (Examples: Facebook, Instagram, WhatsApp, etc.)",
    originalLabel: "Social Media Provider/Platform",
    type: "text",
    section: "SECTION 1: Email and Social Media",
    tooltip: `- List ALL social media platforms used in the last 5 years - Include: Facebook, Twitter/X, Instagram, LinkedIn, TikTok, YouTube, WhatsApp, etc. - Must list even if account is inactive or deactivated - Provide username/handle for each platform - U.S. government WILL review your social media`,
  },
  {
    key: "S01-has_other_social",
    label:
      "Are there any other social media platforms you've used that aren't listed above?",
    type: "radio",
    section: "SECTION 1: Email and Social Media",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S01-Q026",
        pdfKey: "S01-Q026",
        label: "Please list any other social media accounts you have.",
        originalLabel: "Other Social Media Used",
        type: "text",
        section: "SECTION 1: Email and Social Media",
        tooltip: `- Include any platforms not covered above - Examples: Reddit, Telegram, Discord, dating apps, forums - Be comprehensive - failure to disclose can result in visa denial`,
        condition: (data: Record<string, string>) =>
          data["S01-has_other_social"] === "Yes",
      },
    ],
  },
  {
    key: "S01-Q027",
    pdfKey: "S01-Q027",
    label:
      "Is your mailing address the same as the home address you just provided?",
    originalLabel: "Is your Mailing Address the same as your Present Address?",
    type: "radio",
    section: "SECTION 1: Email and Social Media",
    tooltip: `- Answer YES if mail comes to your present address - Answer NO if you use P.O. Box or different mailing address - If NO, you will provide separate mailing address`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S01-Q027_Yes" },
      { label: "No", value: "No", pdfKey: "S01-Q027_No" },
    ],
  },
  {
    key: "S01-Q028",
    pdfKey: "S01-Q028",
    label:
      "Do you know where you'll be living once you arrive in the United States? (This is usually your petitioner or sponsor's address)",
    originalLabel:
      "Do you have an address in the United States where you intend to live?",
    type: "date",
    section: "SECTION 1: U.S. Address Information",
    tooltip: `- Usually you enter your petitioner's address or sponsor's address - Must be a physical address, not P.O. Box - You can change this later if needed`,
  },
  {
    key: "S01-Q029",
    pdfKey: "S01-Q029",
    label: "Who is currently living at that U.S. address?",
    originalLabel: "Name of person currently living at address",
    type: "text",
    section: "SECTION 1: U.S. Address Information",
    tooltip: `- Usually your petitioner/sponsor's name - Enter full name as it appears on their ID`,
  },
  {
    key: "S01-Q030",
    pdfKey: "S01-Q030",
    label: "What is the full U.S. address where you intend to live?",
    originalLabel: "U.S. Address (Street, City, State, ZIP Code)",
    type: "text",
    section: "SECTION 1: U.S. Address Information",
    tooltip: `- Include apartment/unit number - Use proper U.S. state abbreviations (e.g., CA for California) - Verify ZIP code accuracy - use USPS.com if needed`,
  },
  {
    key: "S01-Q031",
    pdfKey: "S01-Q031",
    label:
      "Would you like your Green Card (Permanent Residence Card) to be mailed to this same U.S. address?",
    originalLabel:
      "Is this address where you want your Permanent Residence Card (Green Card) mailed?",
    type: "radio",
    section: "SECTION 1: U.S. Address Information",
    tooltip: `- Answer YES if this is where you want green card delivered - Green card usually arrives 90-120 days after U.S. entry - Must be secure location where mail is not stolen`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S01-Q031_Yes" },
      { label: "No", value: "No", pdfKey: "S01-Q031_No" },
    ],
  },
  {
    key: "S02-Q001",
    pdfKey: "S02-Q001",
    label: "What is your father's last name (surname)?",
    originalLabel: "Father's Surnames",
    type: "text",
    section: "SECTION 2: Father's Information",
    tooltip: `- Enter as shown on your birth certificate - If unknown, enter 'DO NOT KNOW' or 'UNKNOWN' - Provide best information available`,
  },
  {
    key: "S02-Q002",
    pdfKey: "S02-Q002",
    label: "What is your father's first name (given name)?",
    originalLabel: "Father's Given Names",
    type: "text",
    section: "SECTION 2: Father's Information",
    tooltip: `- Include all first and middle names if known - If unknown, enter 'DO NOT KNOW'`,
  },
  {
    key: "S02-Q003",
    pdfKey: "S02-Q003",
    label: "When was your father born?",
    originalLabel: "Father's Date of Birth",
    type: "date",
    section: "SECTION 2: Father's Information",
    tooltip: `- Format: DD Month YYYY - If exact date unknown, estimate (month and year minimum) - Can enter 'DO NOT KNOW' if truly unknown`,
  },
  {
    key: "S02-Q004",
    pdfKey: "S02-Q004",
    label: "In which city or town was your father born?",
    originalLabel: "Father's City of Birth",
    type: "text",
    section: "SECTION 2: Father's Information",
    tooltip: `- Provide city name if known - Enter 'DO NOT KNOW' if unknown`,
  },
  {
    key: "S02-Q005",
    pdfKey: "S02-Q005",
    label: "In what state, province, or region was he born?",
    originalLabel: "Father's State/Province of Birth",
    type: "text",
    section: "SECTION 2: Father's Information",
    tooltip: `- Provide if known - Can enter 'DO NOT KNOW'`,
  },
  {
    key: "S02-Q006",
    pdfKey: "S02-Q006",
    label: "In which country was your father born?",
    originalLabel: "Father's Country/Region of Birth",
    type: "text",
    section: "SECTION 2: Father's Information",
    tooltip: `- Use modern country name - If country no longer exists, use current equivalent - This must be answered even if other details unknown`,
  },
  {
    key: "S02-Q007",
    pdfKey: "S02-Q007",
    label: "Is your father still living?",
    originalLabel: "Is your father still living?",
    type: "radio",
    section: "SECTION 2: Father's Information",
    tooltip: `- Answer YES if living, NO if deceased - If NO, you must provide year of death - Bring death certificate to interview if available`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S02-Q007_Yes" },
      { label: "No", value: "No", pdfKey: "S02-Q007_No" },
    ],
    subQuestions: [
      {
        key: "S02-Q007A",
        pdfKey: "S02-Q007A",
        label: "In what year did your father pass away?",
        originalLabel: "Father's Year of Death",
        type: "date",
        section: "SECTION 2: Father's Information",
        tooltip: `- Provide the year of death (e.g., 2015) - Approximate year is acceptable if exact year unknown`,
        condition: (data: Record<string, string>) => data["S02-Q007"] === "No",
      },
    ],
  },
  {
    key: "S02-Q008",
    pdfKey: "S02-Q008",
    label: "What was your mother's last name at birth? (her maiden name)",
    originalLabel: "Mother's Surnames at Birth",
    type: "date",
    section: "SECTION 2: Mother's Information",
    tooltip: `- Use her surname before marriage - Check birth certificate if available - If unknown, enter 'DO NOT KNOW'`,
  },
  {
    key: "S02-Q009",
    pdfKey: "S02-Q009",
    label: "What is your mother's first name (given name)?",
    originalLabel: "Mother's Given Names",
    type: "text",
    section: "SECTION 2: Mother's Information",
    tooltip: `- Include all first and middle names - If unknown, enter 'DO NOT KNOW'`,
  },
  {
    key: "S02-Q010",
    pdfKey: "S02-Q010",
    label: "When was your mother born?",
    originalLabel: "Mother's Date of Birth",
    type: "date",
    section: "SECTION 2: Mother's Information",
    tooltip: `- Format: DD Month YYYY - Estimate if exact date unknown - Can enter 'DO NOT KNOW'`,
  },
  {
    key: "S02-Q011",
    pdfKey: "S02-Q011",
    label: "In which city or town was your mother born?",
    originalLabel: "Mother's City of Birth",
    type: "text",
    section: "SECTION 2: Mother's Information",
    tooltip: `- Provide if known - Enter 'DO NOT KNOW' if unknown`,
  },
  {
    key: "S02-Q012",
    pdfKey: "S02-Q012",
    label: "In what state, province, or region was she born?",
    originalLabel: "Mother's State/Province of Birth",
    type: "text",
    section: "SECTION 2: Mother's Information",
    tooltip: `- Provide if known - Can enter 'DO NOT KNOW'`,
  },
  {
    key: "S02-Q013",
    pdfKey: "S02-Q013",
    label: "In which country was your mother born?",
    originalLabel: "Mother's Country/Region of Birth",
    type: "text",
    section: "SECTION 2: Mother's Information",
    tooltip: `- Use modern country name - Must be answered`,
  },
  {
    key: "S02-Q014",
    pdfKey: "S02-Q014",
    label: "Is your mother still living?",
    originalLabel: "Is your mother still living?",
    type: "radio",
    section: "SECTION 2: Mother's Information",
    tooltip: `- Answer YES if living, NO if deceased - Provide year of death if NO`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S02-Q014_Yes" },
      { label: "No", value: "No", pdfKey: "S02-Q014_No" },
    ],
    subQuestions: [
      {
        key: "S02-Q014A",
        originalLabel: "Mother's Year of Death",
        pdfKey: "S02-Q014A",
        label: "In what year did your mother pass away?",
        type: "date",
        section: "SECTION 2: Mother's Information",
        tooltip: `- Provide the year of death (e.g., 2015) - Approximate year is acceptable if exact year unknown`,
        condition: (data: Record<string, string>) => data["S02-Q014"] === "No",
      },
    ],
  },
  {
    key: "S02-Q015",
    pdfKey: "S02-Q015",
    label:
      "Have you ever been married before? (Select 'Yes' even if it was a very brief marriage in the past)",
    originalLabel: "Do you have any previous spouses?",
    type: "radio",
    section: "SECTION 2: Previous Marriages",
    tooltip: `- Answer YES if you were previously married and divorced, widowed, or annulled - Answer NO if this is your first marriage - You must list ALL previous marriages, even if very brief - Common mistake: forgetting to list a short marriage`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S02-Q015_Yes" },
      { label: "No", value: "No", pdfKey: "S02-Q015_No" },
    ],
    subQuestions: [
      {
        key: "S02-Q016",
        pdfKey: "S02-Q016",
        label: "How many times were you married in the past?",
        originalLabel: "Number of Previous Spouses",
        type: "text",
        tooltip: `- Count all previous marriages - Include marriages that ended in divorce, death, or annulment`,
        condition: (data: Record<string, string>) => data["S02-Q015"] === "Yes",
      },
      {
        key: "S02-Q017",
        pdfKey: "S02-Q017",
        label: "What is the full legal name of your previous spouse?",
        originalLabel: "Previous Spouse Name (Full Name)",
        type: "text",
        tooltip: `- Provide full name: surname and given names - Use legal name at time of marriage - You will provide this for each previous spouse`,
        condition: (data: Record<string, string>) => data["S02-Q015"] === "Yes",
      },
    ],
  },
  {
    key: "S02-Q018",
    pdfKey: "S02-Q018",
    label: "What is the date of birth of your previous spouse?",
    originalLabel: "Date of Birth (Previous Spouse)",
    type: "date",
    section: "SECTION 2: Previous Marriages",
    tooltip: `- Format: DD Month YYYY - Provide if known; estimate if unsure`,
    condition: (data: Record<string, string>) => data["S02-Q015"] === "Yes",
    subQuestions: [],
  },
  {
    key: "S02-Q019",
    pdfKey: "S02-Q019",
    label: "On what date did you marry this spouse?",
    originalLabel: "Date of Marriage",
    type: "date",
    section: "SECTION 2: Previous Marriages",
    tooltip: `- Use date from marriage certificate - Format: DD Month YYYY`,
    condition: (data: Record<string, string>) => data["S02-Q015"] === "Yes",
  },
  {
    key: "S02-Q020",
    pdfKey: "S02-Q020",
    label: "On what date did this marriage legally end?",
    originalLabel: "Date Marriage Ended",
    type: "date",
    section: "SECTION 2: Previous Marriages",
    tooltip: `- For divorce: use final decree date - For death: use date on death certificate - Format: DD Month YYYY`,
    condition: (data: Record<string, string>) => data["S02-Q015"] === "Yes",
  },
  {
    key: "S02-Q021",
    pdfKey: "S02-Q021",
    label:
      "How did this marriage end? (For example: Divorce, Death, or Annulment)",
    originalLabel: "How was your marriage terminated?",
    type: "text",
    section: "SECTION 2: Previous Marriages",
    tooltip: `- Options: Divorce, Death (widowed), Annulment - Must have legal document proving termination - Common issue: no final divorce decree (still legally married)`,
    condition: (data: Record<string, string>) => data["S02-Q015"] === "Yes",
  },
  {
    key: "S02-Q022",
    pdfKey: "S02-Q022",
    label: "In which country was the marriage legally terminated?",
    originalLabel: "Country/Region where marriage was terminated",
    type: "text",
    section: "SECTION 2: Previous Marriages",
    tooltip: `- Country where divorce was granted or death occurred - Must match document country`,
    condition: (data: Record<string, string>) => data["S02-Q015"] === "Yes",
  },
  {
    key: "S02-Q023",
    pdfKey: "S02-Q023",
    label:
      "Do you have any children? (Please include all biological, legally adopted, and step-children)",
    originalLabel: "Do you have any children?",
    type: "radio",
    section: "SECTION 2: Children - Basic Information",
    tooltip: `- Answer YES even if children are adults - Include ALL children: biological, adopted, step-children if legally adopted - Include children even if not immigrating with you - Must list even if child is deceased or you have no contact`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S02-Q023_Yes" },
      { label: "No", value: "No", pdfKey: "S02-Q023_No" },
    ],
    subQuestions: [
      {
        key: "S02-Q024",
        pdfKey: "S02-Q024",
        label: "How many children do you have in total?",
        originalLabel: "Number of Children",
        type: "text",
        tooltip: `- Count all children, regardless of age - Include children from all marriages/relationships`,
        condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
      },
    ],
  },
  {
    key: "S02-Q025",
    pdfKey: "S02-Q025",
    label: "What is the full legal name of your child?",
    originalLabel: "Child Name (Full Name)",
    type: "text",
    section: "SECTION 2: Children - Basic Information",
    tooltip: `- Provide full legal name: surname and given names - Use name from birth certificate - Repeat for each child`,
    condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
  },
  {
    key: "S02-Q026",
    pdfKey: "S02-Q026",
    label: "When was this child born? (Format: DD Month YYYY)",
    originalLabel: "Date of Birth (Child)",
    type: "date",
    section: "SECTION 2: Children - Basic Information",
    tooltip: `- Format: DD Month YYYY - Must match birth certificate`,
    condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
  },
  {
    key: "S02-Q027",
    pdfKey: "S02-Q027",
    label: "In which city or town was this child born?",
    originalLabel: "City of Birth (Child)",
    type: "text",
    section: "SECTION 2: Children - Basic Information",
    tooltip: `- Use city from birth certificate`,
    condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
  },
  {
    key: "S02-Q028",
    pdfKey: "S02-Q028",
    label: "What state, province, or region was this child born in?",
    originalLabel: "State of Birth (Child)",
    type: "text",
    section: "SECTION 2: Children - Location",
    tooltip: `- Use state/province from birth certificate`,
    condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
  },
  {
    key: "S02-Q029",
    pdfKey: "S02-Q029",
    label: "In which country was this child born?",
    originalLabel: "Country/Region of Birth (Child)",
    type: "text",
    section: "SECTION 2: Children - Location",
    tooltip: `- Use country from birth certificate`,
    condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
  },
  {
    key: "S02-Q030",
    pdfKey: "S02-Q030",
    label: "Does this child live with you at your current home address?",
    originalLabel: "Does this child live with you?",
    type: "radio",
    section: "SECTION 2: Children - Location",
    tooltip: `- Answer YES if child lives with you - Answer NO if child lives elsewhere (even temporarily)`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S02-Q030_Yes" },
      { label: "No", value: "No", pdfKey: "S02-Q030_No" },
    ],
    condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
  },
  {
    key: "S02-Q031",
    pdfKey: "S02-Q031",
    label: "What is the current address where your child lives?",
    originalLabel: "Address (Child)",
    type: "text",
    section: "SECTION 2: Children - Immigration Plans",
    tooltip: `- Required if child does not live with you - Provide complete address where child currently resides`,
    condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
  },
  {
    key: "S02-Q032",
    pdfKey: "S02-Q032",
    label: "Will this child be traveling to the U.S. with you now?",
    originalLabel: "Is this child immigrating to the U.S. with you?",
    type: "radio",
    section: "SECTION 2: Children - Immigration Plans",
    tooltip: `- Answer YES only if child is included in same visa application - Answer NO if child is not immigrating or will follow later`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S02-Q032_Yes" },
      { label: "No", value: "No", pdfKey: "S02-Q032_No" },
    ],
    subQuestions: [
      {
        key: "S02-Q033",
        pdfKey: "S02-Q033",
        label:
          "Will this child be joining you in the U.S. at a later date? (This is known as 'follow-to-join')",
        originalLabel:
          "Is this child immigrating to the U.S. at a later date to join you?",
        type: "date",
        section: "SECTION 2: Children - Immigration Plans",
        tooltip: `- Answer YES if child will immigrate later through follow-to-join petition - Answer NO if child is U.S. citizen, permanent resident, or not immigrating`,
        condition: (data: Record<string, string>) => data["S02-Q023"] === "Yes",
      },
    ],
  },
  {
    key: "S03-Q001",
    pdfKey: "S03-Q001",
    label:
      "Have you ever visited or lived in the United States before? (Even if it was just for one day)",
    originalLabel: "Have you ever been in the U.S.?",
    type: "radio",
    section: "SECTION 3: Previous U.S. Travel",
    tooltip: `- Answer YES if you have EVER been to the U.S., even for one day - Includes tourist visits, business trips, student visas, transit - If YES, you must provide details of last 5 visits - Common mistake: forgetting short visits or airport transits`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S03-Q001_Yes" },
      { label: "No", value: "No", pdfKey: "S03-Q001_No" },
    ],
  },
  {
    key: "S03-has_a_number",
    label:
      "Have you ever been issued an Alien Registration Number (A-Number) by U.S. immigration?",
    type: "radio",
    section: "SECTION 3: Previous U.S. Travel",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S03-Q002",
        pdfKey: "S03-Q002",
        label:
          "What is your Alien Registration Number? (It usually starts with an 'A' followed by 8 or 9 digits)",
        type: "text",
        section: "SECTION 3: Previous U.S. Travel",
        tooltip: `- A-Number is an 8-9 digit number (e.g., A012345678) - You have one if you previously applied for green card, asylum, or certain work permits - Check old immigration documents, work permits (EAD), or notices - Answer NO if you only had tourist visas`,
        condition: (data: Record<string, string>) =>
          data["S03-has_a_number"] === "Yes",
      },
    ],
  },
  {
    key: "S03-Q003",
    pdfKey: "S03-Q003",
    label:
      "Please provide the dates and length of stay for your last five visits to the U.S.",
    originalLabel:
      "Provide information on your last five U.S. visits (Date Arrived, Length of Stay)",
    type: "date",
    section: "SECTION 3: Previous U.S. Travel",
    tooltip: `- List up to 5 most recent U.S. visits - For each visit provide: arrival date and length of stay (days/months) - Check passport stamps for exact dates - Include purpose of visit if asked (tourism, business, family, etc.)`,
    condition: (data: Record<string, string>) => data["S03-Q001"] === "Yes",
  },
  {
    key: "S03-Q004",
    pdfKey: "S03-Q004",
    label: "Have you ever been issued a U.S. visa in the past?",
    originalLabel: "Have you ever been issued a U.S. Visa?",
    type: "radio",
    section: "SECTION 3: U.S. Visa History",
    tooltip: `- Answer YES if you ever had any type of U.S. visa (tourist, student, work, etc.) - Check old passports for visa stamps or stickers - If YES, provide details: issue date, visa type, visa number`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S03-Q004_Yes" },
      { label: "No", value: "No", pdfKey: "S03-Q004_No" },
    ],
  },
  {
    key: "S03-Q005",
    pdfKey: "S03-Q005",
    label: "When was your most recent U.S. visa issued?",
    originalLabel: "Date Visa Was Issued",
    type: "date",
    section: "SECTION 3: U.S. Visa History",
    tooltip: `- Date shown on visa stamp/sticker - Format: DD Month YYYY - Provide for most recent visa if you had multiple`,
    condition: (data: Record<string, string>) => data["S03-Q004"] === "Yes",
  },
  {
    key: "S03-Q006",
    pdfKey: "S03-Q006",
    label:
      "What was the classification of that visa? (For example: B1/B2, F1, H1B)",
    originalLabel: "Visa Classification",
    type: "text",
    section: "SECTION 3: U.S. Visa History",
    tooltip: `- Common types: B1/B2 (tourist/business), F1 (student), H1B (work), J1 (exchange) - Found on visa stamp - Be specific (e.g., 'B1/B2' not just 'tourist')`,
    condition: (data: Record<string, string>) => data["S03-Q004"] === "Yes",
  },
  {
    key: "S03-Q007",
    pdfKey: "S03-Q007",
    label:
      "What was the visa number? (This is the 8-digit red number on your visa sticker)",
    originalLabel: "Visa Number",
    type: "text",
    section: "SECTION 3: U.S. Visa History",
    tooltip: `- Red number on visa stamp (8 digits, usually starts with year) - Found on visa sticker in passport - Provide if available; estimate if unsure`,
    condition: (data: Record<string, string>) => data["S03-Q004"] === "Yes",
  },
  {
    key: "S03-Q008",
    pdfKey: "S03-Q008",
    label: "Have any of your U.S. visas ever been lost or stolen?",
    originalLabel: "Have any of your U.S. visas ever been lost or stolen?",
    type: "radio",
    section: "SECTION 3: U.S. Visa History",
    tooltip: `- Answer YES if a visa in an old passport was lost/stolen - Provide explanation if YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S03-Q008_Yes" },
      { label: "No", value: "No", pdfKey: "S03-Q008_No" },
    ],
  },
  {
    key: "S03-Q009",
    pdfKey: "S03-Q009",
    label: "Has the U.S. government ever canceled or revoked a visa you held?",
    originalLabel:
      "Have any of your U.S. visas ever been cancelled or revoked?",
    type: "radio",
    section: "SECTION 3: U.S. Visa History",
    tooltip: `- Answer YES if embassy ever cancelled your visa - Includes visas marked 'cancelled without prejudice' - Provide full explanation if YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S03-Q009_Yes" },
      { label: "No", value: "No", pdfKey: "S03-Q009_No" },
    ],
  },
  {
    key: "S03-Q010",
    pdfKey: "S03-Q010",
    label:
      "Have you ever been denied a U.S. visa, or been refused entry at a U.S. border or airport?",
    originalLabel:
      "Have you ever been refused a U.S. visa, been refused admission to the U.S., or withdrawn your application for admission at the port of entry?",
    type: "radio",
    section: "SECTION 3: U.S. Visa History",
    tooltip: `- Answer YES if embassy ever denied your visa application - Answer YES if you were turned away at U.S. airport/border - Answer YES if you withdrew application while being questioned at entry - CRITICAL: Must explain circumstances - visa denial history affects current application - Gather refusal letters or documents if available`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S03-Q010_Yes" },
      { label: "No", value: "No", pdfKey: "S03-Q010_No" },
    ],
  },
  {
    key: "S04-Q001",
    pdfKey: "S04-Q001",
    label: "What is your primary occupation or current job title?",
    originalLabel: "Primary Occupation",
    type: "text",
    section: "SECTION 4: Employment Information",
    tooltip: `- Enter your current job title or occupation - If not employed: 'NOT EMPLOYED', 'RETIRED', 'STUDENT', 'HOMEMAKER' - Be specific (e.g., 'Software Engineer' not just 'Engineer') - Use standard occupation names when possible`,
  },
  {
    key: "S04-Q002",
    pdfKey: "S04-Q002",
    label: "Do you have any other jobs or secondary occupations?",
    originalLabel: "Do you have any other occupations?",
    type: "radio",
    section: "SECTION 4: Employment Information",
    tooltip: `- Answer YES if you have part-time or secondary employment - Include freelance work if significant`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q002_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q002_No" },
    ],
  },
  {
    key: "S04-Q003",
    pdfKey: "S04-Q003",
    label:
      "What type of work do you intend to do once you are in the United States?",
    originalLabel: "In which occupation do you intend to work in the U.S.?",
    type: "text",
    section: "SECTION 4: Employment Information",
    tooltip: `- This can be same as current occupation or different - If not planning to work: 'NOT EMPLOYED' or 'RETIRED' - Be realistic - this is not binding but should be truthful`,
  },
  {
    key: "S04-Q004",
    pdfKey: "S04-Q004",
    label: "Were you previously employed or had any jobs in the past?",
    originalLabel: "Were you previously employed?",
    type: "radio",
    section: "SECTION 4: Employment Information",
    tooltip: `- Answer YES if you worked before (even if currently unemployed) - You must provide employment history if YES - List most recent employers first`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q004_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q004_No" },
    ],
  },
  {
    key: "S04-Q005",
    pdfKey: "S04-Q005",
    label:
      "Please list your previous employers, including addresses and the dates you worked there.",
    originalLabel:
      "Employer Name, Address, Job Title, Supervisor, Employment Dates",
    type: "date",
    section: "SECTION 4: Employment Information",
    tooltip: `- Provide for last 5-10 years of employment (or all if less) - Include: company name, full address, your job title, supervisor name, dates (from-to) - Use format: Month YYYY to Month YYYY - Gather old employment letters, contracts, or pay stubs - Common issue: not remembering exact dates - estimate month/year`,
    condition: (data: Record<string, string>) => data["S04-Q004"] === "Yes",
  },
  {
    key: "S04-Q006",
    pdfKey: "S04-Q006",
    label:
      "Have you attended any schools (high school, college, or university) at a secondary level or higher?",
    originalLabel:
      "Have you attended any educational institutions at a secondary level or above?",
    type: "radio",
    section: "SECTION 4: Education and Travel",
    tooltip: `- Answer YES if you completed secondary school (high school) or higher - Secondary = high school; above = college, university, vocational school - List all institutions attended after primary school - Answer NO only if you completed only elementary/primary school`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q006_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q006_No" },
    ],
    subQuestions: [
      {
        key: "S04-Q007",
        pdfKey: "S04-Q007",
        label: "How many educational institutions have you attended in total?",
        originalLabel: "Number of Educational Institutions Attended",
        type: "text",
        section: "SECTION 4: Education and Travel",
        tooltip: `- Count all secondary and post-secondary institutions - Include schools where you completed programs and those you attended but did not complete`,
        condition: (data: Record<string, string>) => data["S04-Q006"] === "Yes",
      },
    ],
  },
  {
    key: "S04-Q008",
    pdfKey: "S04-Q008",
    label:
      "Please list the schools you attended, your course of study, and the dates of attendance.",
    originalLabel:
      "Name of Institution, Address, Course of Study, Degree/Diploma, Dates of Attendance",
    type: "date",
    section: "SECTION 4: Education and Travel",
    tooltip: `- For each school provide: name, address, subject studied, degree earned, dates attended - Include: high school, college, university, vocational training - Course of Study examples: 'Computer Science', 'Business Administration', 'General Studies' - Degree examples: 'High School Diploma', 'Bachelor of Science', 'Master of Arts' - If did not complete, note 'NO DEGREE' but still list attendance`,
    condition: (data: Record<string, string>) => data["S04-Q006"] === "Yes",
  },
  {
    key: "S04-Q009",
    pdfKey: "S04-Q009",
    label:
      "Have you traveled to any countries outside of your home country in the last 5 years?",
    originalLabel:
      "Have you traveled to any countries/regions within the last five years?",
    type: "radio",
    section: "SECTION 4: Education and Travel",
    tooltip: `- List ALL countries visited in last 5 years - Include even brief visits or transit - Check passport stamps to ensure nothing is missed - Common mistake: forgetting short trips or transit stops`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q009_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q009_No" },
    ],
  },
  {
    key: "S04-Q010",
    pdfKey: "S04-Q010",
    label:
      "Have you ever served in the military or armed forces of any country?",
    originalLabel: "Have you ever served in the military?",
    type: "radio",
    section: "SECTION 4: Military, Organizations, and Skills",
    tooltip: `- Answer YES if you served in military, including mandatory service - Include all countries where you served - Provide: country, branch, rank, specialty, dates of service - Include reserve or national guard service`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q010_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q010_No" },
    ],
  },
  {
    key: "S04-Q011",
    pdfKey: "S04-Q011",
    label:
      "Have you ever been a member of any professional, social, or charitable organizations?",
    originalLabel:
      "Have you belonged to, contributed to, or worked for any professional, social, or charitable organization?",
    type: "radio",
    section: "SECTION 4: Military, Organizations, and Skills",
    tooltip: `- Include: professional associations, charities, social clubs, religious organizations - Include: labor unions, political parties (if applicable) - Be honest - membership itself is not disqualifying - Provide organization name, role, dates of membership`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q011_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q011_No" },
    ],
  },
  {
    key: "S04-Q012",
    pdfKey: "S04-Q012",
    label:
      "Do you have any specialized training or skills involving weapons, explosives, or dangerous materials?",
    originalLabel:
      "Do you have any specialized skills or training, including firearms, explosives, nuclear, biological, or chemical experience?",
    type: "radio",
    section: "SECTION 4: Military, Organizations, and Skills",
    tooltip: `- Answer YES if you have training in firearms, explosives, nuclear, biological, or chemical materials - Include military training, police training, or occupational training - Be truthful - this is a security question - Provide details of training if YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q012_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q012_No" },
    ],
  },
  {
    key: "S04-Q013",
    pdfKey: "S04-Q013",
    label:
      "Have you ever been involved with any rebel groups (groups fighting against a government), militias (private citizen armies), or other unofficial armed groups?",
    originalLabel:
      "Have you ever served in, been a member of, or been involved with a paramilitary unit, vigilante unit, rebel group, guerrilla group, or insurgent organization?",
    type: "radio",
    section: "SECTION 4: Military, Organizations, and Skills",
    tooltip: `- Answer truthfully - this is a critical security question - Includes rebel groups, militias, insurgent groups, vigilante groups - If YES, you must provide full details and may need waiver - Seek legal advice before answering YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q013_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q013_No" },
    ],
  },
  {
    key: "S04-Q014",
    pdfKey: "S04-Q014",
    label:
      "Can you speak or read any languages other than your native language?",
    originalLabel:
      "Can you speak and/or read languages other than your native language?",
    type: "radio",
    section: "SECTION 4: Military, Organizations, and Skills",
    tooltip: `- List all languages you can speak or read - Include level of proficiency if asked (fluent, conversational, basic) - Common mistake: not listing English if native language is different`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S04-Q014_Yes" },
      { label: "No", value: "No", pdfKey: "S04-Q014_No" },
    ],
  },
  {
    key: "S05-Q001",
    pdfKey: "S05-Q001",
    label:
      "What is your relationship to the person (petitioner) who is sponsoring your visa?",
    originalLabel: "Petitioner is my:",
    type: "text",
    section: "SECTION 5: Petitioner Information",
    tooltip: `- Common relationships: Spouse, Parent, Child, Sibling - This person filed Form I-130 or I-140 for you - Must match relationship shown on approval notice (I-797)`,
  },
  {
    key: "S05-Q002",
    pdfKey: "S05-Q002",
    label: "What is the full legal name of your petitioner?",
    originalLabel: "Petitioner Name",
    type: "text",
    section: "SECTION 5: Petitioner Information",
    tooltip: `- Enter full legal name: surname and given names - Must match name on I-130 approval notice exactly - Check I-797 approval notice for correct spelling`,
  },
  {
    key: "S05-Q003",
    pdfKey: "S05-Q003",
    label: "What is your petitioner's current residential address?",
    originalLabel:
      "Petitioner Address (Street, City, State, ZIP Code, Country)",
    type: "text",
    section: "SECTION 5: Petitioner Information",
    tooltip: `- Provide petitioner's current residential address in the U.S. - Must be U.S. address if petitioner lives in the U.S. - Include apartment/unit number - Verify correct ZIP code`,
  },
  {
    key: "S05-Q004",
    pdfKey: "S05-Q004",
    label: "What is your petitioner's primary phone number?",
    originalLabel: "Petitioner Telephone",
    type: "text",
    section: "SECTION 5: Petitioner Information",
    tooltip: `- Include country code (+1 for U.S.) - Format: +1 (XXX) XXX-XXXX for U.S. numbers - Must be current, working number`,
  },
  {
    key: "S05-has_petitioner_mobile",
    label: "Does your petitioner have a mobile or cell phone number?",
    type: "radio",
    section: "SECTION 5: Petitioner Information",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    subQuestions: [
      {
        key: "S05-Q005",
        pdfKey: "S05-Q005",
        label: "What is your petitioner's mobile phone number?",
        originalLabel: "Petitioner Mobile/Cell Telephone",
        type: "text",
        tooltip: `- Provide if different from primary phone - Embassy may call petitioner for verification`,
        condition: (data: Record<string, string>) =>
          data["S05-has_petitioner_mobile"] === "Yes",
      },
    ],
  },
  {
    key: "S05-Q006",
    pdfKey: "S05-Q006",
    label: "What is your petitioner's primary email address?",
    originalLabel: "Petitioner Email Address",
    type: "text",
    section: "SECTION 5: Petitioner Information",
    tooltip: `- Must be an email petitioner checks regularly - NVC may send updates to this email - Verify spelling carefully - typos cause missed communications`,
  },
  {
    key: "S06-Q001",
    pdfKey: "S06-Q001",
    label:
      "Do you have any illnesses that can spread from person to person (infectious diseases), such as Tuberculosis (TB)?",
    originalLabel:
      "Do you have a communicable disease of public health significance such as tuberculosis (TB)?",
    type: "radio",
    section: "SECTION 6: Health and Medical",
    tooltip: `- Answer based on current health status - TB is most common issue - you will have medical exam before interview - Answer NO unless diagnosed currently - Medical exam at interview will screen for these diseases - Having had TB in the past (and cured) is usually not a problem`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q001_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q001_No" },
    ],
  },
  {
    key: "S06-Q001_explanation",
    label: "Please explain your health condition",
    type: "textarea",
    section: "SECTION 6: Health and Medical",
    condition: (data: Record<string, string>) => data["S06-Q001"] === "Yes",
  },
  {
    key: "S06-Q002",
    pdfKey: "S06-Q002",
    label: "Do you have proof that you received all required vaccinations?",
    originalLabel:
      "Do you have documentation to establish that you have received vaccinations in accordance with U.S. law?",
    type: "radio",
    section: "SECTION 6: Health and Medical",
    tooltip: `- Answer YES if you have vaccination records - Required vaccines: MMR, Tdap, Varicella, Influenza, Polio, Hepatitis A&B, COVID-19, others - Panel physician will review/update vaccines at medical exam - Bring any vaccination records you have to medical exam - Most applicants answer YES - doctor will help complete any missing vaccines`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q002_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q002_No" },
    ],
    subQuestions: [
      {
        key: "S06-Q002_explanation",
        label: "Please explain why you do not have vaccination documentation",
        type: "textarea",
        section: "SECTION 6: Health and Medical",
        condition: (data: Record<string, string>) => data["S06-Q002"] === "No",
      },
    ],
  },
  {
    key: "S06-Q003",
    pdfKey: "S06-Q003",
    label:
      "Do you have a mental or physical condition that could make you dangerous to yourself or others?",
    originalLabel:
      "Do you have a mental or physical disorder that poses or is likely to pose a threat to the safety or welfare of yourself or others?",
    type: "radio",
    section: "SECTION 6: Health and Medical",
    tooltip: `- Answer NO unless you have serious untreated mental illness with history of violence - Having depression, anxiety, or physical disability is NOT a 'YES' answer - Only answer YES if condition involves danger/threat of harm - Panel physician will evaluate during medical exam - Seek legal advice if unsure`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q003_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q003_No" },
    ],
    subQuestions: [
      {
        key: "S06-Q003_explanation",
        label: "Please provide details of your mental or physical condition",
        type: "textarea",
        condition: (data: Record<string, string>) => data["S06-Q003"] === "Yes",
      },
    ],
  },
  {
    key: "S06-Q004",
    pdfKey: "S06-Q004",
    label: "Are you currently or have you ever been addicted to drugs?",
    originalLabel: "Are you or have you ever been a drug abuser or addict?",
    type: "radio",
    section: "SECTION 6: Health and Medical",
    tooltip: `- Answer truthfully - includes illegal drugs and misuse of prescription drugs - Past drug use without addiction: generally answer NO - Current or past addiction: answer YES and explain - Rehabilitation and time passed can help overcome this issue - Consult attorney if YES - may need waiver`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q004_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q004_No" },
    ],
    subQuestions: [
      {
        key: "S06-Q004_explanation",
        label: "Please provide details of your drug use or addiction",
        type: "textarea",
        condition: (data: Record<string, string>) => data["S06-Q004"] === "Yes",
      },
    ],
  },
  {
    key: "S06-Q005",
    pdfKey: "S06-Q005",
    label:
      "Have you ever been arrested or convicted of any crime, even if pardoned?",
    originalLabel:
      "Have you ever been arrested or convicted for any offense or crime, even though subject of a pardon, amnesty, or other similar action?",
    type: "radio",
    section: "SECTION 6: Criminal History and Drug Violations",
    tooltip: `- Answer YES if you were EVER arrested or convicted, even if charges dropped or pardoned - Includes: DUI, theft, assault, domestic violence, ANY criminal charge - Must disclose even if record was expunged or sealed - Provide: date, place, charge, outcome for each incident - Obtain police certificates and court documents - Consult attorney if YES - criminal history can lead to inadmissibility`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q005_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q005_No" },
    ],
    subQuestions: [
      {
        key: "S06-Q005_explanation",
        label: "Please provide details (date, place, charge, outcome)",
        type: "textarea",
        condition: (data: Record<string, string>) => data["S06-Q005"] === "Yes",
      },
    ],
  },
  {
    key: "S06-Q006",
    pdfKey: "S06-Q006",
    label: "Have you ever broken laws about illegal drugs?",
    originalLabel:
      "Have you ever violated, or engaged in a conspiracy to violate, any law relating to controlled substances?",
    type: "radio",
    section: "SECTION 6: Criminal History and Drug Violations",
    tooltip: `- Includes possession, sale, trafficking of illegal drugs - Answer truthfully - lying can result in permanent bar - Marijuana violations may require explanation even in states where legal - Consult attorney before answering YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q006_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q006_No" },
    ],
  },
  {
    key: "S06-Q006_explanation",
    label: "Please provide details of the drug law violation",
    type: "textarea",
    section: "SECTION 6: Criminal History and Drug Violations",
    condition: (data: Record<string, string>) => data["S06-Q006"] === "Yes",
  },
  {
    key: "S06-Q007",
    pdfKey: "S06-Q007",
    label:
      "Is your spouse, parent, or child a drug trafficker, and did you benefit from it in the last 5 years?",
    originalLabel:
      "Are you the spouse, son, or daughter of an individual who has violated any controlled substance trafficking law, and have knowingly benefited from the trafficking activities in the past five years?",
    type: "radio",
    section: "SECTION 6: Criminal History and Drug Violations",
    tooltip: `- Answer YES only if family member trafficked drugs AND you knowingly benefited - Very rare circumstance - Consult attorney if YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q007_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q007_No" },
    ],
  },
  {
    key: "S06-Q007_explanation",
    label: "Please provide details of the trafficking and benefit",
    type: "textarea",
    section: "SECTION 6: Criminal History and Drug Violations",
    condition: (data: Record<string, string>) => data["S06-Q007"] === "Yes",
  },
  {
    key: "S06-Q008",
    pdfKey: "S06-Q008",
    label:
      "Have you been involved in prostitution (offering sexual services for money) in the last 10 years, or do you plan to do so in the U.S.?",
    originalLabel:
      "Are you coming to the United States to engage in prostitution or unlawful commercialized vice or have you been engaged in prostitution or procuring prostitutes within the past 10 years?",
    type: "radio",
    section: "SECTION 6: Human Trafficking",
    tooltip: `- Answer truthfully - If YES, consult attorney - may be inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q008_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q008_No" },
    ],
  },
  {
    key: "S06-Q008_explanation",
    label: "Please provide details of your involvement",
    type: "textarea",
    section: "SECTION 6: Human Trafficking",
    condition: (data: Record<string, string>) => data["S06-Q008"] === "Yes",
  },
  {
    key: "S06-Q009",
    pdfKey: "S06-Q009",
    label:
      "Have you ever been involved in money laundering (hiding the source of illegally obtained money)?",
    originalLabel:
      "Have you ever been involved in, or do you seek to engage in, money laundering?",
    type: "radio",
    section: "SECTION 6: Human Trafficking",
    tooltip: `- Answer truthfully - Money laundering is a serious crime - If YES, consult attorney immediately`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q009_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q009_No" },
    ],
  },
  {
    key: "S06-Q009_explanation",
    label: "Please provide details of your involvement",
    type: "textarea",
    section: "SECTION 6: Human Trafficking",
    condition: (data: Record<string, string>) => data["S06-Q009"] === "Yes",
  },
  {
    key: "S06-Q010",
    pdfKey: "S06-Q010",
    label:
      "Have you ever been involved in human trafficking (illegally transporting or holding people against their will for labor or sex)?",
    originalLabel:
      "Have you ever committed or conspired to commit a human trafficking offense in the United States or outside the United States?",
    type: "radio",
    section: "SECTION 6: Human Trafficking",
    tooltip: `- Answer truthfully - This is a very serious ground of inadmissibility - If YES, consult attorney immediately`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q010_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q010_No" },
    ],
  },
  {
    key: "S06-Q010_explanation",
    label: "Please provide details of your involvement",
    type: "textarea",
    section: "SECTION 6: Human Trafficking",
    condition: (data: Record<string, string>) => data["S06-Q010"] === "Yes",
  },
  {
    key: "S06-Q011",
    pdfKey: "S06-Q011",
    label:
      "Have you helped someone identified by the U.S. President as a major human trafficker (illegally transporting or holding people against their will for labor or sex)?",
    originalLabel:
      "Have you ever knowingly aided, abetted, assisted, or colluded with an individual who has been identified by the President of the United States as a person who plays a significant role in a severe form of trafficking in persons?",
    type: "radio",
    section: "SECTION 6: Human Trafficking",
    tooltip: `- Very rare circumstance - Answer truthfully - If YES, consult attorney immediately`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q011_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q011_No" },
    ],
  },
  {
    key: "S06-Q011_explanation",
    label: "Please provide details of your involvement",
    type: "textarea",
    section: "SECTION 6: Human Trafficking",
    condition: (data: Record<string, string>) => data["S06-Q011"] === "Yes",
  },
  {
    key: "S06-Q012",
    pdfKey: "S06-Q012",
    label:
      "Is any member of your family (spouse, son, or daughter) a human trafficker, and did you benefit from it in the last 5 years?",
    originalLabel:
      "Are you the spouse, son, or daughter of an individual who has committed or conspired to commit a human trafficking offense in the United States or outside the United States and have you within the last five years, knowingly benefited from the trafficking activities?",
    type: "radio",
    section: "SECTION 6: Human Trafficking",
    tooltip: `- Very rare circumstance - Answer truthfully - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q012_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q012_No" },
    ],
  },
  {
    key: "S06-Q012_explanation",
    label: "Please provide details of the situation and benefit",
    type: "textarea",
    section: "SECTION 6: Human Trafficking",
    condition: (data: Record<string, string>) => data["S06-Q012"] === "Yes",
  },
  {
    key: "S06-Q013",
    pdfKey: "S06-Q013",
    label:
      "Do you plan to engage in espionage (spying), sabotage (damaging property to hurt a government), or other illegal activities in the U.S.?",
    originalLabel:
      "Do you seek to engage in espionage, sabotage, export control violations, or any other illegal activity while in the United States?",
    type: "radio",
    section: "SECTION 6: Terrorism and Security",
    tooltip: `- Answer NO - If you must answer YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q013_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q013_No" },
    ],
  },
  {
    key: "S06-Q013_explanation",
    label: "Please provide details of the activities",
    type: "textarea",
    section: "SECTION 6: Terrorism and Security",
    condition: (data: Record<string, string>) => data["S06-Q013"] === "Yes",
  },
  {
    key: "S06-Q014",
    pdfKey: "S06-Q014",
    label:
      "Have you ever been involved in terrorist activities, or do you plan to be involved in them while in the U.S.?",
    originalLabel:
      "Do you seek to engage in terrorist activities while in the United States or have you ever engaged in terrorist activities?",
    type: "radio",
    section: "SECTION 6: Terrorism and Security",
    tooltip: `- Answer NO unless you have been involved in terrorism - This is the most serious ground of inadmissibility - If YES, consult attorney immediately - likely permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q014_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q014_No" },
    ],
  },
  {
    key: "S06-Q014_explanation",
    label: "Please provide details of your involvement",
    type: "textarea",
    section: "SECTION 6: Terrorism and Security",
    condition: (data: Record<string, string>) => data["S06-Q014"] === "Yes",
  },
  {
    key: "S06-Q015",
    pdfKey: "S06-Q015",
    label:
      "Have you ever provided money, weapons, or any other kind of support to terrorists or terrorist groups?",
    originalLabel:
      "Have you ever or do you intend to provide financial assistance or other support to terrorists or terrorist organizations?",
    type: "radio",
    section: "SECTION 6: Terrorism and Security",
    tooltip: `- Answer NO unless applicable - This includes ANY support to designated terrorist organizations - If YES, consult attorney - likely permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q015_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q015_No" },
    ],
  },
  {
    key: "S06-Q015_explanation",
    label: "Please provide details of the support provided",
    type: "textarea",
    section: "SECTION 6: Terrorism and Security",
    condition: (data: Record<string, string>) => data["S06-Q015"] === "Yes",
  },
  {
    key: "S06-Q016",
    pdfKey: "S06-Q016",
    label: "Are you a member or a representative of a terrorist organization?",
    originalLabel:
      "Are you a member or representative of a terrorist organization?",
    type: "radio",
    section: "SECTION 6: Terrorism and Security",
    tooltip: `- Answer NO unless you are a member - If YES, consult attorney - likely permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q016_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q016_No" },
    ],
  },
  {
    key: "S06-Q016_explanation",
    label: "Please provide details of the organization and your role",
    type: "textarea",
    section: "SECTION 6: Terrorism and Security",
    condition: (data: Record<string, string>) => data["S06-Q016"] === "Yes",
  },
  {
    key: "S06-Q017",
    pdfKey: "S06-Q017",
    label:
      "Is any member of your family (spouse, son, or daughter) involved in terrorist activities, or have they supported terrorists in the last 5 years?",
    originalLabel:
      "Are you the spouse, son, or daughter of an individual who has engaged in terrorist activity, including providing financial assistance or other support to terrorists or terrorist organizations, in the last five years?",
    type: "radio",
    section: "SECTION 6: Terrorism and Security",
    tooltip: `- Answer truthfully - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q017_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q017_No" },
    ],
  },
  {
    key: "S06-Q017_explanation",
    label: "Please provide details of the family member's involvement",
    type: "textarea",
    section: "SECTION 6: Terrorism and Security",
    condition: (data: Record<string, string>) => data["S06-Q017"] === "Yes",
  },
  {
    key: "S06-Q018",
    pdfKey: "S06-Q018",
    label:
      "Have you ever participated in genocide (the killing of a large group of people on purpose, especially those of a particular ethnic group or nation)?",
    originalLabel:
      "Have you ever ordered, incited, committed, assisted, or otherwise participated in genocide?",
    type: "radio",
    section: "SECTION 6: Genocide, Torture, and Violence",
    tooltip: `- Answer NO unless you participated in genocide - If YES, consult attorney - permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q018_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q018_No" },
    ],
  },
  {
    key: "S06-Q019",
    pdfKey: "S06-Q019",
    label:
      "Have you ever participated in torture (hurting someone on purpose by causing very bad physical or mental pain)?",
    originalLabel:
      "Have you ever committed, ordered, incited, assisted, or otherwise participated in torture?",
    type: "radio",
    section: "SECTION 6: Genocide, Torture, and Violence",
    tooltip: `- Answer NO unless you participated in torture - If YES, consult attorney - permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q019_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q019_No" },
    ],
  },
  {
    key: "S06-Q020",
    pdfKey: "S06-Q020",
    label:
      "Have you ever participated in extrajudicial killings (killings not authorized by a court of law) or other acts of political violence?",
    originalLabel:
      "Have you committed, ordered, incited, assisted, or otherwise participated in extrajudicial killings, political killings, or other acts of violence?",
    type: "radio",
    section: "SECTION 6: Genocide, Torture, and Violence",
    tooltip: `- Answer NO unless you participated in such acts - If YES, consult attorney - likely inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q020_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q020_No" },
    ],
  },
  {
    key: "S06-Q021",
    pdfKey: "S06-Q021",
    label:
      "Have you ever recruited children (under age 15) to serve in an armed group, or used them to participate in fighting?",
    originalLabel:
      "Have you ever engaged in the recruitment of or the use of child soldiers?",
    type: "radio",
    section: "SECTION 6: Genocide, Torture, and Violence",
    tooltip: `- Answer NO unless applicable - If YES, consult attorney - permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q021_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q021_No" },
    ],
  },
  {
    key: "S06-Q022",
    pdfKey: "S06-Q022",
    label:
      "While serving as a government official, have you ever been responsible for severe violations of religious freedom (such as punishing someone for their beliefs)?",
    originalLabel:
      "Have you, while serving as a government official, been responsible for or directly carried out, at any time, particularly severe violations of religious freedom?",
    type: "radio",
    section: "SECTION 6: Genocide, Torture, and Violence",
    tooltip: `- Answer NO unless you were a government official who violated religious freedom - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q022_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q022_No" },
    ],
  },
  {
    key: "S06-Q023",
    pdfKey: "S06-Q023",
    label:
      "Are you currently, or have you ever been, a member of the Communist Party or any other totalitarian party (a party that controls all aspects of life)?",
    originalLabel:
      "Are you a member of or affiliated with the Communist or other totalitarian party?",
    type: "radio",
    section: "SECTION 6: Political Affiliations and Property",
    tooltip: `- Answer truthfully - Membership in Communist Party can be inadmissible, but waivers may be available - Past membership (especially involuntary) may not be disqualifying - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q023_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q023_No" },
    ],
  },
  {
    key: "S06-Q024",
    pdfKey: "S06-Q024",
    label:
      "Have you ever assisted or supported any Colombian groups known as FARC, ELN, or AUC?",
    originalLabel:
      "Have you ever directly or indirectly assisted or supported any of the groups in Columbia known as the Revolutionary Armed Forces of Columbia (FARC), National Liberation Army (ELN), or United Self-Defense Forces of Columbia (AUC)?",
    type: "radio",
    section: "SECTION 6: Political Affiliations and Property",
    tooltip: `- Answer NO unless you supported these groups - If YES, consult attorney - likely inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q024_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q024_No" },
    ],
  },
  {
    key: "S06-Q025",
    pdfKey: "S06-Q025",
    label:
      "While in a government or political position, have you ever taken property from U.S. citizens for your own personal gain?",
    originalLabel:
      "Have you ever, through abuse of governmental or political position converted for personal gain, confiscated or expropriated property in a foreign nation to which a United States national had claim of ownership?",
    type: "radio",
    section: "SECTION 6: Political Affiliations and Property",
    tooltip: `- Answer NO unless you were a foreign government official who confiscated U.S. property - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q025_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q025_No" },
    ],
  },
  {
    key: "S06-Q026",
    pdfKey: "S06-Q026",
    label:
      "Is any member of your family (spouse or child) someone who has taken property from U.S. citizens through their government position for personal gain?",
    originalLabel:
      "Are you the spouse, minor child, or agent of an individual who has through abuse of governmental or political position converted for personal gain, confiscated or expropriated property in a foreign nation to which a United States national had claim of ownership?",
    type: "radio",
    section: "SECTION 6: Political Affiliations and Property",
    tooltip: `- Very rare circumstance - Answer truthfully`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q026_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q026_No" },
    ],
  },
  {
    key: "S06-Q026_explanation",
    label: "Please provide details of the family member's actions",
    type: "textarea",
    section: "SECTION 6: Political Affiliations and Property",
    condition: (data: Record<string, string>) => data["S06-Q026"] === "Yes",
  },
  {
    key: "S06-Q027",
    pdfKey: "S06-Q027",
    label:
      "Have you ever been involved in forcing a woman to have an abortion or forcing any person to be sterilized (prevented from having children) against their will?",
    originalLabel:
      "Have you ever been directly involved in the establishment or enforcement of population controls forcing a woman to undergo an abortion against her free choice or a man or a woman to undergo sterilization against his or her free choice?",
    type: "radio",
    section: "SECTION 6: Political Affiliations and Property",
    tooltip: `- Answer NO unless you enforced such policies - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q027_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q027_No" },
    ],
  },
  {
    key: "S06-Q028",
    pdfKey: "S06-Q028",
    label:
      "Have you ever illegally shared or traded confidential U.S. business secrets related to the Chemical Weapons Convention?",
    originalLabel:
      "Have you ever disclosed or trafficked in confidential U.S. business information obtained in connection with U.S. participation in the Chemical Weapons Convention?",
    type: "radio",
    section: "SECTION 6: Fraud and Deportation",
    tooltip: `- Very rare circumstance - Answer NO unless applicable`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q028_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q028_No" },
    ],
  },
  {
    key: "S06-Q028_explanation",
    label: "Please provide details of the disclosure",
    type: "textarea",
    section: "SECTION 6: Fraud and Deportation",
    condition: (data: Record<string, string>) => data["S06-Q028"] === "Yes",
  },
  {
    key: "S06-Q029",
    pdfKey: "S06-Q029",
    label:
      "Is any member of your family (spouse or child) someone who has illegally shared or traded confidential U.S. business secrets related to the Chemical Weapons Convention?",
    originalLabel:
      "Are you the spouse, minor child, or agent of an individual who has disclosed or trafficked in confidential U.S. business information obtained in connection with U.S. participation in the Chemical Weapons Convention?",
    type: "radio",
    section: "SECTION 6: Fraud and Deportation",
    tooltip: `- Very rare circumstance - Answer truthfully`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q029_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q029_No" },
    ],
  },
  {
    key: "S06-Q029_explanation",
    label: "Please provide details of the family member's disclosure",
    type: "textarea",
    section: "SECTION 6: Fraud and Deportation",
    condition: (data: Record<string, string>) => data["S06-Q029"] === "Yes",
  },
  {
    key: "S06-Q030",
    pdfKey: "S06-Q030",
    label:
      "Have you ever lied, used fake documents, or committed fraud to get a U.S. visa or any other immigration benefit?",
    originalLabel:
      "Have you ever sought to obtain or assist others to obtain a visa, entry into the United States, or any other United States immigration benefit by fraud or willful misrepresentation or other unlawful means?",
    type: "radio",
    section: "SECTION 6: Fraud and Deportation",
    tooltip: `- Answer truthfully - this is a CRITICAL question - Includes lying on visa applications, using fake documents, etc. - If YES, you may be permanently inadmissible - Consult attorney if YES - waivers may be available in some cases`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q030_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q030_No" },
    ],
  },
  {
    key: "S06-Q030_explanation",
    label: "Please provide details of the fraud or misrepresentation",
    type: "textarea",
    section: "SECTION 6: Fraud and Deportation",
    condition: (data: Record<string, string>) => data["S06-Q030"] === "Yes",
  },
  {
    key: "S06-Q031",
    pdfKey: "S06-Q031",
    label: "Have you ever been ordered to leave (deported) from any country?",
    originalLabel: "Have you ever been removed or deported from any country?",
    type: "radio",
    section: "SECTION 6: Fraud and Deportation",
    tooltip: `- Answer YES if you were ever deported or removed from any country (not just U.S.) - Provide full details: country, date, reason - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q031_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q031_No" },
    ],
  },
  {
    key: "S06-Q041",
    pdfKey: "S06-Q041",
    label:
      "Have you ever kept a U.S. citizen child away from someone who was given legal custody (the legal right to care for the child) by a U.S. court?",
    originalLabel:
      "Have you ever withheld custody of a U.S. citizen child outside the United States from a person granted legal custody by a U.S. court?",
    type: "radio",
    section: "SECTION 6: Custody and Voting Violations",
    tooltip: `- Answer NO unless you withheld a child from legal custodian - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q041_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q041_No" },
    ],
  },
  {
    key: "S06-Q042",
    pdfKey: "S06-Q042",
    label:
      "Have you ever helped someone else keep a U.S. citizen child away from the person who has legal custody?",
    originalLabel:
      "Have you ever intentionally assisted another person in withholding custody of a U.S. citizen child outside the United States from a person granted legal custody by a U.S. court?",
    type: "radio",
    section: "SECTION 6: Custody and Voting Violations",
    tooltip: `- Answer NO unless applicable - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q042_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q042_No" },
    ],
  },
  {
    key: "S06-Q043",
    pdfKey: "S06-Q043",
    label: "Have you ever voted in a U.S. election in a way that broke the law?",
    originalLabel:
      "Have you voted in the United States in violation of any law or regulation?",
    type: "radio",
    section: "SECTION 6: Custody and Voting Violations",
    tooltip: `- Answer NO unless you voted in U.S. elections without being eligible - Only U.S. citizens can vote in federal elections - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q043_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q043_No" },
    ],
  },
  {
    key: "S06-Q044",
    pdfKey: "S06-Q044",
    label:
      "Have you ever given up your U.S. citizenship specifically to avoid paying taxes?",
    originalLabel:
      "Have you ever renounced United States citizenship for the purpose of avoiding taxation?",
    type: "radio",
    section: "SECTION 6: Custody and Voting Violations",
    tooltip: `- Answer NO unless you previously were a U.S. citizen and renounced for tax purposes - If YES, you are permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q044_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q044_No" },
    ],
  },
  {
    key: "S06-Q045",
    pdfKey: "S06-Q045",
    label:
      "Have you ever attended a public elementary or high school in the U.S. while on a student (F) visa without paying for it?",
    originalLabel:
      "Have you attended a public elementary school or a public secondary school on student (F) status after November 30, 1996 without reimbursing the school?",
    type: "radio",
    section: "SECTION 6: Custody and Voting Violations",
    tooltip: `- Answer NO unless you attended U.S. public school on F-1 visa - F-1 students generally cannot attend public elementary/secondary schools - If YES, consult attorney`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q045_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q045_No" },
    ],
  },
  {
    key: "S06-Q046",
    pdfKey: "S06-Q046",
    label:
      "Are you coming to the U.S. to work in a job that requires a special government permit (labor certification) which you do not have yet?",
    originalLabel:
      "Do you seek to enter the United States for the purpose of performing skilled or unskilled labor but have not yet been certified by the Secretary of Labor?",
    type: "radio",
    section: "SECTION 6: Professional and Military Requirements",
    tooltip: `- Answer NO for family-based immigration - This question is for employment-based cases - You have a family-based petition, not employment-based`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q046_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q046_No" },
    ],
  },
  {
    key: "S06-Q046_explanation",
    label: "Please provide details of your work plans and certification status",
    type: "textarea",
    section: "SECTION 6: Professional and Military Requirements",
    condition: (data: Record<string, string>) => data["S06-Q046"] === "Yes",
  },
  {
    key: "S06-Q047",
    pdfKey: "S06-Q047",
    label:
      "Are you a graduate of a foreign medical school planning to work as a doctor in the U.S., but you haven't passed the required U.S. medical exams yet?",
    originalLabel:
      "Are you a graduate of a foreign medical school seeking to perform medical services in the United States but have not yet passed the National Board of Medical Examiners examination or its equivalent?",
    type: "radio",
    section: "SECTION 6: Professional and Military Requirements",
    tooltip: `- Answer NO unless you are a foreign medical graduate planning to practice medicine - If YES, you need proper certification`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q047_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q047_No" },
    ],
  },
  {
    key: "S06-Q048",
    pdfKey: "S06-Q048",
    label:
      "Are you a healthcare worker planning to work in the U.S., but you haven't received the required professional certification yet?",
    originalLabel:
      "Are you a health care worker seeking to perform such work in the United States but have not yet received certification from the Commission on Graduates of Foreign Nursing Schools or from an equivalent approved independent credentialing organization?",
    type: "radio",
    section: "SECTION 6: Professional and Military Requirements",
    tooltip: `- Answer NO unless you are a healthcare worker without proper credentials - If YES, obtain certification before immigrating`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q048_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q048_No" },
    ],
  },
  {
    key: "S06-Q049",
    pdfKey: "S06-Q049",
    label: "Are you permanently stopped from ever becoming a U.S. citizen?",
    originalLabel: "Are you permanently ineligible for U.S. citizenship?",
    type: "radio",
    section: "SECTION 6: Professional and Military Requirements",
    tooltip: `- Answer NO unless you have been specifically told you are permanently ineligible - Very rare - consult attorney if YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q049_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q049_No" },
    ],
  },
  {
    key: "S06-Q050",
    pdfKey: "S06-Q050",
    label:
      "Have you ever left the U.S. specifically to avoid serving in the military during a war?",
    originalLabel:
      "Have you ever departed the United States in order to evade military service during a time of war?",
    type: "radio",
    section: "SECTION 6: Professional and Military Requirements",
    tooltip: `- Answer NO unless you evaded U.S. military draft - Very rare circumstance`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q050_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q050_No" },
    ],
  },
  {
    key: "S06-Q050_explanation",
    label: "Please provide details of your departure",
    type: "textarea",
    section: "SECTION 6: Professional and Military Requirements",
    condition: (data: Record<string, string>) => data["S06-Q050"] === "Yes",
  },
  {
    key: "S06-Q051",
    pdfKey: "S06-Q051",
    label:
      "Are you coming to the U.S. to practice polygamy (having more than one husband or wife at the same time)?",
    originalLabel: "Are you coming to the U.S. to practice polygamy?",
    type: "radio",
    section: "SECTION 6: Other Inadmissibility Grounds",
    tooltip: `- Answer NO unless you practice polygamy - Polygamy is illegal in the U.S. and a ground of inadmissibility`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q051_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q051_No" },
    ],
  },
  {
    key: "S06-Q051_explanation",
    label: "Please provide details of your situation",
    type: "textarea",
    section: "SECTION 6: Other Inadmissibility Grounds",
    condition: (data: Record<string, string>) => data["S06-Q051"] === "Yes",
  },
  {
    key: "S06-Q052",
    pdfKey: "S06-Q052",
    label:
      "Did you previously have a J-1 visa (exchange visitor) and still have a requirement to live in your home country for two years?",
    originalLabel:
      "Are you a former exchange visitor (J) who has not yet fulfilled the two-year foreign residence requirement?",
    type: "radio",
    section: "SECTION 6: Other Inadmissibility Grounds",
    tooltip: `- Answer NO unless you previously had J-1 visa with 2-year requirement - If YES, you must complete 2 years in home country or get waiver - Consult attorney if YES`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q052_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q052_No" },
    ],
  },
  {
    key: "S06-Q053",
    pdfKey: "S06-Q053",
    label:
      "Has the U.S. government ever decided that you knowingly submitted a fake or untruthful application for asylum?",
    originalLabel:
      "Has the Secretary of Homeland Security of the United States ever determined that you knowingly made a frivolous application for asylum?",
    type: "radio",
    section: "SECTION 6: Other Inadmissibility Grounds",
    tooltip: `- Answer NO unless you filed asylum claim deemed frivolous - If YES, you are permanently inadmissible`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q053_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q053_No" },
    ],
  },
  {
    key: "S06-Q054",
    pdfKey: "S06-Q054",
    label:
      "Do you think you will need to depend on U.S. government financial help (like welfare) after you arrive?",
    originalLabel:
      "Are you likely to become a public charge after you are admitted to the United States?",
    type: "radio",
    section: "SECTION 6: Other Inadmissibility Grounds",
    tooltip: `- Answer NO - your sponsor is providing financial support - Your sponsor filed Affidavit of Support (Form I-864) to ensure you won't need public assistance - Most family-based applicants answer NO`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S06-Q054_Yes" },
      { label: "No", value: "No", pdfKey: "S06-Q054_No" },
    ],
  },
  {
    key: "S06-Q054_explanation",
    label: "Please provide details of your financial situation",
    type: "textarea",
    section: "SECTION 6: Other Inadmissibility Grounds",
    condition: (data: Record<string, string>) => data["S06-Q054"] === "Yes",
  },
  {
    key: "S07-Q001",
    pdfKey: "S07-Q001",
    label: "Have you ever applied for a U.S. Social Security Number (SSN) before?",
    originalLabel: "Have you ever applied for a Social Security number?",
    type: "radio",
    section: "SECTION 7: Social Security Number",
    tooltip: `- Answer YES only if you previously applied for SSN while in the U.S. - Most immigrant visa applicants answer NO - If you worked in U.S. previously, you may have SSN`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S07-Q001_Yes" },
      { label: "No", value: "No", pdfKey: "S07-Q001_No" },
    ],
  },
  {
    key: "S07-Q002",
    pdfKey: "S07-Q002",
    label:
      "Would you like the U.S. government to issue you a Social Security Number and mail you a card when you arrive?",
    originalLabel:
      "Do you want the Social Security Administration to issue a Social Security number and a card?",
    type: "date",
    section: "SECTION 7: Social Security Number",
    tooltip: `- Answer YES - you will need SSN to work in U.S. - SSN card will be mailed to you after arrival - Free service - no reason to answer NO`,
  },
  {
    key: "S07-Q003",
    pdfKey: "S07-Q003",
    label:
      "Do you give permission for the government to share your information between agencies so they can issue your Social Security Number?",
    originalLabel:
      "Do you authorize disclosure of information from this form to the Department of Homeland Security, the Social Security Administration, and such other U.S. Government agencies as may be required for the purposes of assigning you a social security number (SSN) and issuing you a Social Security card and do you authorize the Social Security Administration to share your SSN with the Department of Homeland Security?",
    type: "text",
    section: "SECTION 7: Social Security Number",
    tooltip: `- Answer YES - this is standard authorization - Required to receive SSN automatically - Safe to authorize - standard process`,
  },
  {
    key: "S08-Q001",
    pdfKey: "S08-Q001",
    label: "Did someone help you fill out this form?",
    originalLabel: "Did anyone assist you in filling out this application?",
    type: "radio",
    section: "SECTION 8: Preparer Information",
    tooltip: `- Answer YES if family member, friend, or attorney helped - Answer YES even if you filled it out yourself but someone reviewed it - Must provide preparer information if YES - Lying about preparer assistance can cause visa denial`,
    options: [
      { label: "Yes", value: "Yes", pdfKey: "S08-Q001_Yes" },
      { label: "No", value: "No", pdfKey: "S08-Q001_No" },
    ],
  },
  {
    key: "S08-Q002",
    pdfKey: "S08-Q002",
    label: "What is the full name of the person who helped you?",
    originalLabel: "Preparer Surnames and Given Names",
    type: "text",
    section: "SECTION 8: Preparer Information",
    tooltip: `- Provide full legal name - Can be family member, friend, or attorney`,
    condition: (data: Record<string, string>) => data["S08-Q001"] === "Yes",
  },
  {
    key: "S08-has_organization",
    label: "Does the person who helped you work for a company or a law firm?",
    type: "radio",
    section: "SECTION 8: Preparer Information",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    condition: (data: Record<string, string>) => data["S08-Q001"] === "Yes",
  },
  {
    key: "S08-Q003",
    pdfKey: "S08-Q003",
    label: "What is the name of the company or law firm they work for?",
    originalLabel: "Organization Name",
    type: "text",
    section: "SECTION 8: Preparer Information",
    tooltip: `- Enter law firm name if attorney helped - Enter 'DOES NOT APPLY' if family member/friend helped`,
    condition: (data: Record<string, string>) =>
      data["S08-has_organization"] === "Yes",
  },
  {
    key: "S08-Q004",
    pdfKey: "S08-Q004",
    label: "What is the address of the person who helped you?",
    originalLabel: "Preparer Address (Street, City, State, ZIP, Country)",
    type: "text",
    section: "SECTION 8: Preparer Information",
    tooltip: `- Provide complete address - If attorney, use law office address`,
    condition: (data: Record<string, string>) => data["S08-Q001"] === "Yes",
  },
  {
    key: "S08-Q005",
    pdfKey: "S08-Q005",
    label:
      "How is this person related to you? (For example: Son, Friend, or Attorney)",
    originalLabel: "Relationship to You",
    type: "text",
    section: "SECTION 8: Preparer Information",
    tooltip: `- Examples: Daughter, Son, Attorney, Friend - Be specific and honest`,
    condition: (data: Record<string, string>) => data["S08-Q001"] === "Yes",
  },
];

export const pdfSectionTitles: Record<string, string> = {
  // SECTION 1
  "SECTION 1: Personal Information - Name and Identity":
    "SECTION 1: PERSONAL INFORMATION",
  "SECTION 1: Birth Information": "SECTION 1: PERSONAL INFORMATION",
  "SECTION 1: Passport and Citizenship": "SECTION 1: PERSONAL INFORMATION",
  "SECTION 1: Address and Phone Information": "SECTION 1: PERSONAL INFORMATION",
  "SECTION 1: Email and Social Media": "SECTION 1: PERSONAL INFORMATION",
  "SECTION 1: U.S. Address Information": "SECTION 1: PERSONAL INFORMATION",

  // SECTION 2
  "SECTION 2: Father's Information": "SECTION 2: FAMILY INFORMATION",
  "SECTION 2: Mother's Information": "SECTION 2: FAMILY INFORMATION",
  "SECTION 2: Previous Marriages": "SECTION 2: FAMILY INFORMATION",
  "SECTION 2: Children - Basic Information": "SECTION 2: FAMILY INFORMATION",
  "SECTION 2: Children - Location": "SECTION 2: FAMILY INFORMATION",
  "SECTION 2: Children - Immigration Plans": "SECTION 2: FAMILY INFORMATION",

  // SECTION 3
  "SECTION 3: Previous U.S. Travel":
    "SECTION 3: PREVIOUS U.S. TRAVEL INFORMATION",
  "SECTION 3: U.S. Visa History": "SECTION 3: PREVIOUS U.S. TRAVEL INFORMATION",

  // SECTION 4
  "SECTION 4: Employment Information":
    "SECTION 4: WORK/EDUCATION/TRAINING INFORMATION",
  "SECTION 4: Education and Travel":
    "SECTION 4: WORK/EDUCATION/TRAINING INFORMATION",
  "SECTION 4: Military, Organizations, and Skills":
    "SECTION 4: WORK/EDUCATION/TRAINING INFORMATION",

  // SECTION 5
  "SECTION 5: Petitioner Information": "SECTION 5: PETITIONER INFORMATION",

  // SECTION 6
  "SECTION 6: Health and Medical":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Criminal History and Drug Violations":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Human Trafficking":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Terrorism and Security":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Genocide, Torture, and Violence":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Political Affiliations and Property":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Fraud and Deportation":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Custody and Voting Violations":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 6: Professional and Military Requirements":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",
  "SECTION 60: Other Inadmissibility Grounds":
    "SECTION 6: SECURITY AND BACKGROUND INFORMATION",

  // SECTION 7
  "SECTION 7: Social Security Number":
    "SECTION 7: SOCIAL SECURITY NUMBER INFORMATION",
  "SECTION 7: SOCIAL SECURITY NUMBER INFORMATION":
    "SECTION 7: SOCIAL SECURITY NUMBER INFORMATION",

  // SECTION 8
  "SECTION 8: Preparer Information": "SECTION 8: PREPARER OF APPLICATION",
};

export const getInitialFormData = () => {
  const data: Record<string, string> = {};
  formFields.forEach((f) => (data[f.key] = ""));
  return data;
};
export const ds260Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
};

export default ds260Config;
