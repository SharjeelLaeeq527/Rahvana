export type VisaCriteria = {
  title: string;
  description: string;
  criteria: string[];
};

export const visaCriteria: Record<string, VisaCriteria> = {
  // IMMEDIATE RELATIVES
  "IR-1": {
    title: "Immediate Relative – Spouse of US Citizen",
    description: "For spouses of US citizens married for 2 years or more.",
    criteria: [
      "Must be legally married to a U.S. citizen.",
      "The marriage must be valid and bona fide (not entered into for immigration purposes).",
      "Must have been married for at least 2 years at the time of admission.",
      "Petitioner must be a U.S. citizen typically at least 18 years old.",
    ],
  },
  "CR-1": {
    title: "Conditional Resident – Spouse of US Citizen",
    description: "For spouses of US citizens married for less than 2 years.",
    criteria: [
      "Must be legally married to a U.S. citizen.",
      "The marriage must be valid and bona fide.",
      "Have been married for less than 2 years at the time of admission.",
      "Status is conditional for 2 years; must apply to remove conditions (Form I-751) before the 2-year mark.",
    ],
  },
  "IR-5": {
    title: "Immediate Relative – Parent of US Citizen",
    description: "For parents of US citizens who are 21 years or older.",
    criteria: [
      "Petitioner must be a U.S. citizen and at least 21 years old.",
      "Must prove the biological or legal parent-child relationship.",
      "For step-parents, the marriage creating the relationship must have occurred before the child turned 18.",
      "For adoptive parents, adoption must have occurred before the child turned 16 (with some exceptions).",
    ],
  },
  "IR-2": {
    title: "Child of U.S. Citizen",
    description: "For unmarried children under 21 of US citizens.",
    criteria: [
      "Must be unmarried and under 21 years of age.",
      "Must be the biological, step, or adopted child of a U.S. citizen.",
      "Stepsons/daughters qualify if marriage occurred before age 18.",
      "Adopted children qualify if adopted before age 16 (or 18 for siblings).",
    ],
  },

  // FAMILY PREFERENCE
  "F1": {
    title: "Result: Family Preference F1",
    description: "Unmarried Sons and Daughters of U.S. Citizens.",
    criteria: [
      "Must be the unmarried son or daughter of a U.S. citizen.",
      "Must be 21 years of age or older.",
      "Must have a U.S. citizen parent petitioner.",
    ],
  },
  "F2A": {
    title: "Result: Family Preference F2A",
    description: "Spouses and Children of Permanent Residents.",
    criteria: [
      "Petitioner must be a Lawful Permanent Resident (Green Card holder).",
      "Beneficiary must be the spouse or unmarried child (under 21) of the LPR.",
      "Subject to annual visa numerical limits.",
    ],
  },
  "F2B": {
    title: "Result: Family Preference F2B",
    description: "Unmarried Sons and Daughters (21+) of Permanent Residents.",
    criteria: [
      "Petitioner must be a Lawful Permanent Resident (Green Card holder).",
      "Beneficiary must be the unmarried son or daughter (21 or older) of the LPR.",
      "Subject to annual visa numerical limits.",
    ],
  },
  "F4": {
    title: "Result: Family Preference F4",
    description: "Brothers and Sisters of Adult U.S. Citizens.",
    criteria: [
      "Petitioner must be a U.S. citizen and at least 21 years old.",
      "Beneficiary must be the sibling of the petitioner.",
      "Must prove that you share at least one common parent.",
      "Includes half-siblings and step-siblings (if relationship established before 18).",
    ],
  },

  // FIANCE
  "K-1": {
    title: "Fiancé(e) Visa",
    description: "For fiancé(e)s of US citizens intending to marry in the US.",
    criteria: [
      "Petitioner must be a U.S. citizen.",
      "Must intend to marry within 90 days of entering the U.S.",
      "Both parties must be legally free to marry.",
      "Must have met in person at least once within the 2 years before filing (unless exemption applies).",
      "Must meet minimum income requirements.",
    ],
  },

  // EMPLOYMENT
  "EB-1": {
    title: "Employment-Based First Preference",
    description: "For individuals with extraordinary ability or multinational executives.",
    criteria: [
      "Extraordinary Ability: Evidence of sustained national/international acclaim (e.g., Nobel Prize or 3/10 specific criteria like awards, publications). No employer needed.",
      "Outstanding Professors/Researchers: International recognition, 3 years experience, tenure-track job offer.",
      "Multinational Manager/Executive: Employed by firm abroad for 1 year in last 3, coming to U.S. branch in managerial role.",
    ],
  },
  "EB-2": {
    title: "Employment-Based Second Preference(EB-2)",
    description: "For professionals with advanced degrees or exceptional ability.",
    criteria: [
      "Official academic record showing that you have a degree, diploma, certificate, or similar award from a college, university, school, or other institution of learning relating to your area of exceptional ability",
      "Letters from current or former employers documenting at least 10 years of full-time experience in your occupation",
      "A license to practice your profession or certification for your profession or occupation",
      "Evidence that you have commanded a salary or other remuneration for services that demonstrates your exceptional ability",
      "Membership in a professional association(s)",
      "Recognition for your achievements and significant contributions to your industry or field by your peers, government entities, professional or business organizations",
      "Other comparable evidence of eligibility is also acceptable.",
    ],
  },
  "EB-3": {
    title: "Employment-Based Third Preference",
    description: "For skilled workers, professionals, and other workers.",
    criteria: [
      "Requires a full-time, permanent job offer and labor certification.",
      "Skilled Workers: At least 2 years of job experience or training.",
      "Professionals: U.S. baccalaureate degree or foreign equivalent degree.",
      "Unskilled Workers (Other Workers): Capable of performing unskilled labor (requiring less than 2 years training), not temporary or seasonal.",
    ],
  },
  "EB-5": {
    title: "Immigrant Investor Visa Program",
    description: "For investors who invest in US businesses and create jobs.",
    criteria: [
      "Make the necessary investment in a commercial enterprise in the United States",
      "Plan to create or preserve 10 permanent full-time jobs for qualified U.S. workers",
    ],
  },

  // HUMANITARIAN
  "Humanitarian": {
    title: "Humanitarian-Based Immigration",
    description: "Includes asylum, refugee, VAWA, and special immigrant categories.",
    criteria: [
      "Asylum: Present in U.S., unable/unwilling to return to home country due to persecution based on race, religion, nationality, membership in a particular social group, or political opinion.",
      "Refugee: Similar to asylum but applying from outside the U.S.",
      "VAWA: Abused spouse, child, or parent of U.S. Citizen/LPR.",
      "Criteria vary significantly by specific humanitarian program.",
    ],
  },

  // NON-IMMIGRANT
  "B1/B2": {
    title: "Visitor Visa (B-1/B-2)",
    description: "For temporary business or tourism visits.",
    criteria: [
      "Trip must be for a temporary visit (business, tourism, medical treatment).",
      "Must plan to stay for a specific, limited period.",
      "Must have funds to cover expenses in the U.S.",
      "Must have a residence abroad and other binding ties ensuring return.",
    ],
  },

  "F-1": {
    title: "Academic Student Visa",
    description: "For academic study in the United States.",
    criteria: [
      "Accepted at an SEVP-certified school.",
      "Enrolled as a full-time student.",
      "Proficient in English or enrolled in courses to learn English.",
      "Have sufficient funds to support yourself during studies.",
      "Maintain a residence abroad with no intent to give it up.",
    ],
  },
  "M-1": {
    title: "Vocational Student Visa",
    description: "For vocational studies in the United States.",
    criteria: [
      "Accepted at an SEVP-certified vocational institution.",
      "Enrolled in a full-time vocational or non-academic program.",
      "Proficient in English or enrolled in English courses.",
      "Sufficient funds for duration of stay.",
      "Maintain residence abroad.",
    ],
  },
  "H-1B": {
    title: "Specialty Occupation Work Visa",
    description: "For professionals in specialty occupations.",
    criteria: [
      "Job must be a specialty occupation (requires theoretical/practical application of specialized knowledge).",
      "Must have a bachelor's degree or higher (or equivalent) in the specific specialty.",
      "Employer must submit Labor Condition Application (LCA).",
      "Subject to annual cap (unless exempt).",
    ],
  },
  "L-1": {
    title: "Intracompany Transfer Visa",
    description: "For employees transferring to a US branch of the same company.",
    criteria: [
      "Qualifying relationship between U.S. company and foreign company (parent, branch, subsidiary).",
      "Employee must have worked for the foreign company for 1 continuous year within the last 3 years.",
      "Coming to work in a managerial/executive capacity (L-1A) or specialized knowledge capacity (L-1B).",
    ],
  },
  "O-1": {
    title: "Extraordinary Ability Visa",
    description: "For individuals with extraordinary ability in science, arts, business, or athletics.",
    criteria: [
      "Demonstrate extraordinary ability by sustained national/international acclaim.",
      "Must be coming to work in area of extraordinary ability.",
      "Evidence: Major international award (Nobel, etc.) OR at least 3 specific signs of recognition (prizes, membership in elite associations, major publications, etc.).",
    ],
  },
  "R-1": {
    title: "Religious Worker Visa",
    description: "For individuals working in a religious capacity.",
    criteria: [
      "Must be a member of a religious denomination for at least 2 years.",
      "Denomination must have bona fide non-profit religious status in the U.S.",
      "Coming to work at least part-time (20 hours) as a minister or in a religious vocation/occupation.",
    ],
  },
  "J-1": {
    title: "Exchange Visitor Visa",
    description: "For participants in approved exchange programs.",
    criteria: [
      "Accepted into a Department of State-designated exchange visitor program.",
      "Sufficient English proficiency.",
      "Sufficient funds to support stay.",
      "Health insurance coverage required.",
      "Mst intent to return home (some subject to 2-year home residency requirement).",
    ],
  },
  "P": {
    title: "Athlete or Artist Visa (P-1/P-2/P-3)",
    description: "For internationally recognized athletes or entertainment groups.",
    criteria: [
      "P-1A: Internationally recognized athlete or team.",
      "P-1B: Member of internationally recognized entertainment group (75% of members for 1+ year).",
      "Must be coming to the U.S. to perform in a specific event or performance.",
    ],
  },
  "Q": {
    title: "Cultural Exchange Visa",
    description: "For participants in international cultural exchange programs.",
    criteria: [
      "Must be at least 18 years old.",
      "Program must be an international cultural exchange program designated by USCIS.",
      "Must be capable of communicating effectively about your home country's culture.",
      "Integral part of duties must be sharing culture.",
    ],
  },
  "E-1 / E-2": {
    title: "Treaty Trader / Investor Visa",
    description: "For nationals of treaty countries engaged in trade or investment.",
    criteria: [
      "Must be a national of a country with which the U.S. has a requisite treaty.",
      "E-1 (Trader): Substantial trade principally between U.S. and treaty country.",
      "E-2 (Investor): Substantial 'at risk' investment in a U.S. enterprise; applicant must develop and direct the enterprise.",
    ],
  },

};
