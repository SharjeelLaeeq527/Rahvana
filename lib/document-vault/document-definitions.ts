// Document Definitions Database
// This file contains all document definitions for various visa categories

import {
  DocumentDefinition,
  DocumentCategory,
} from './types';

// ============================================================================
// CIVIL DOCUMENTS
// ============================================================================

const CIVIL_DOCS: DocumentDefinition[] = [
  {
    id: 'birth-cert-beneficiary',
    key: 'BIRTH_CERT',
    name: 'Birth Certificate',
    description: 'Official birth certificate with English translation',
    category: 'CIVIL',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Obtain Original Birth Certificate',
        description: 'Visit NADRA office or apply online to get your original birth certificate (Form-B or computerized NICOP/CNIC with date of birth).',
        resources: [
          {
            name: 'NADRA E-Sahulat Portal',
            url: 'https://www.nadra.gov.pk/',
            type: 'link',
          },
        ],
        tips: [
          'Ensure the certificate shows your full name exactly as in your passport',
          'If name differs from passport, get a name match certificate',
        ],
        estimatedTime: '1-3 days',
        cost: 'PKR 400-800',
      },
      {
        stepNumber: 2,
        title: 'Get English Translation',
        description: 'If certificate is in Urdu, get it translated by a certified translator.',
        tips: [
          'Translator must certify that translation is accurate',
          'Include translator credentials and stamp',
        ],
        estimatedTime: '1-2 days',
        cost: 'PKR 1,000-2,000',
      },
    ],
  },
  {
    id: 'nikah-nama',
    key: 'NIKAH_NAMA',
    name: 'Nikah Nama (Marriage Certificate)',
    description: 'Original Nikah Nama with English translation',
    category: 'CIVIL',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'none',
    requiredWhen: {
      visaCategories: ['IR-1', 'CR-1'],
    },
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Locate Original Nikah Nama',
        description: 'Find your original Nikah Nama document issued at the time of marriage.',
        tips: [
          'Must be signed by Nikah Registrar',
          'Should have serial number and registration details',
        ],
      },
      {
        stepNumber: 2,
        title: 'Get Certified Translation',
        description: 'Get a certified English translation of the Nikah Nama.',
        resources: [
          {
            name: 'List of Certified Translators in Pakistan',
            url: 'https://pk.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/attorneys/',
            type: 'link',
          },
        ],
        estimatedTime: '2-3 days',
        cost: 'PKR 2,000-5,000',
      },
    ],
  },
  {
    id: 'passport-beneficiary',
    key: 'PASSPORT_COPY',
    name: 'Passport Copy',
    description: 'Valid passport copy (biographical page)',
    category: 'CIVIL',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 180, // 6 months validity required
    defaultWarnDays: 60,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Check Passport Validity',
        description: 'Ensure your passport is valid for at least 6 months beyond your intended travel date.',
        tips: [
          'If passport expires soon, renew it before uploading',
          'Scan the biographical page (page with photo and details)',
        ],
      },
      {
        stepNumber: 2,
        title: 'Scan Biographical Page',
        description: 'Scan or take a clear photo of the biographical page of your passport.',
        tips: [
          'Ensure all text is readable',
          'No shadows or reflections',
          'Save as PDF or high-quality JPG',
        ],
      },
    ],
  },
  {
    id: 'cnic-beneficiary',
    key: 'CNIC',
    name: 'CNIC (Computerized National Identity Card)',
    description: 'Copy of Pakistani CNIC (both sides)',
    category: 'CIVIL',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'user_set',
    defaultWarnDays: 90,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Scan Both Sides of CNIC',
        description: 'Make clear scans or photos of both front and back of your CNIC.',
        tips: [
          'Ensure CNIC is not expired',
          'If expired, renew at NADRA office',
          'Combine both sides into one PDF file',
        ],
      },
    ],
  },
  {
    id: 'divorce-decree-beneficiary',
    key: 'DIVORCE_DECREE',
    name: 'Divorce Decree / Talaq Nama',
    description: 'Official divorce decree with translation if prior marriage',
    category: 'CIVIL',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: true, // Can have multiple if married multiple times
    validityType: 'none',
    requiredWhen: {
      scenarioFlags: { prior_marriage_beneficiary: true },
    },
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Obtain Divorce Certificate',
        description: 'Get certified copy of divorce decree from Family Court or Union Council.',
        resources: [
          {
            name: 'Union Council Divorce Certificate Guide',
            url: 'https://www.nadra.gov.pk/services/divorce-certificate/',
            type: 'link',
          },
        ],
        tips: [
          'Court-issued decrees must be certified copies',
          'Union Council certificates should have registration number',
        ],
      },
      {
        stepNumber: 2,
        title: 'Get English Translation',
        description: 'If document is in Urdu, get certified English translation.',
        estimatedTime: '2-3 days',
        cost: 'PKR 2,000-4,000',
      },
    ],
  },
  {
    id: 'death-cert-prior-spouse',
    key: 'DEATH_CERT_SPOUSE',
    name: 'Death Certificate of Former Spouse',
    description: 'Death certificate if prior spouse is deceased',
    category: 'CIVIL',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'none',
    requiredWhen: {
      scenarioFlags: { prior_marriage_beneficiary: true },
    },
  },
];

// ============================================================================
// FINANCIAL / SPONSOR DOCUMENTS
// ============================================================================

const FINANCIAL_DOCS: DocumentDefinition[] = [
  {
    id: 'i-864-affidavit',
    key: 'I864_AFFIDAVIT',
    name: 'Form I-864 (Affidavit of Support)',
    description: 'Completed and signed I-864 form',
    category: 'FINANCIAL',
    roles: ['PETITIONER'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'policy_variable',
    defaultWarnDays: 90,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Download Form I-864',
        description: 'Download the latest version of Form I-864 from USCIS website.',
        resources: [
          {
            name: 'USCIS Form I-864',
            url: 'https://www.uscis.gov/i-864',
            type: 'link',
          },
        ],
        tips: [
          'Always use the latest version of the form',
          'Fill out completely - no blank fields',
        ],
      },
      {
        stepNumber: 2,
        title: 'Complete and Sign',
        description: 'Fill out all sections accurately and sign the form.',
        tips: [
          'Use your legal name as it appears on tax returns',
          'Include household size calculation',
          'Sign and date - signature must be original',
        ],
      },
    ],
  },
  {
    id: 'tax-returns-petitioner',
    key: 'TAX_RETURNS',
    name: 'IRS Tax Returns (3 years)',
    description: 'Federal tax transcripts or returns for last 3 years',
    category: 'FINANCIAL',
    roles: ['PETITIONER'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'policy_variable',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Request IRS Tax Transcripts',
        description: 'Order tax transcripts from IRS website or by mail.',
        resources: [
          {
            name: 'Get IRS Tax Transcripts',
            url: 'https://www.irs.gov/individuals/get-transcript',
            type: 'link',
          },
        ],
        tips: [
          'Tax transcripts are preferred over returns',
          'Need last 3 years (most recent)',
          'Free service from IRS',
        ],
        estimatedTime: '5-10 business days (by mail)',
        cost: 'Free',
      },
    ],
  },
  {
    id: 'employment-letter',
    key: 'EMPLOYMENT_LETTER',
    name: 'Employment Verification Letter',
    description: 'Letter from employer confirming employment and salary',
    category: 'FINANCIAL',
    roles: ['PETITIONER'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 180, // 6 months validity
    defaultWarnDays: 60,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Request Letter from Employer',
        description: 'Contact your HR department to request an employment verification letter.',
        tips: [
          'Letter must be on company letterhead',
          'Include: job title, salary, start date, employment type (full-time/part-time)',
          'Should be dated within 6 months of submission',
          'Include HR contact information',
        ],
      },
    ],
  },
  {
    id: 'pay-stubs',
    key: 'PAY_STUBS',
    name: 'Recent Pay Stubs',
    description: 'Most recent 6 pay stubs or pay statements',
    category: 'FINANCIAL',
    roles: ['PETITIONER'],
    stages: ['NVC'],
    required: true,
    multipleFilesAllowed: true,
    validityType: 'fixed_days',
    validityDays: 180,
    defaultWarnDays: 30,
  },
  {
    id: 'w2-forms',
    key: 'W2_FORMS',
    name: 'W-2 Forms',
    description: 'W-2 forms for last tax year',
    category: 'FINANCIAL',
    roles: ['PETITIONER'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'bank-statements',
    key: 'BANK_STATEMENTS',
    name: 'Bank Statements',
    description: 'Recent bank statements (last 12 months)',
    category: 'FINANCIAL',
    roles: ['PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'fixed_days',
    validityDays: 90,
  },
];

// ============================================================================
// RELATIONSHIP EVIDENCE
// ============================================================================

const RELATIONSHIP_DOCS: DocumentDefinition[] = [
  {
    id: 'wedding-photos',
    key: 'WEDDING_PHOTOS',
    name: 'Wedding Photos',
    description: 'Photos from wedding ceremony',
    category: 'RELATIONSHIP',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      visaCategories: ['IR-1', 'CR-1'],
    },
  },
  {
    id: 'relationship-photos',
    key: 'RELATIONSHIP_PHOTOS',
    name: 'Relationship Photos',
    description: 'Photos together throughout relationship',
    category: 'RELATIONSHIP',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      visaCategories: ['IR-1', 'CR-1'],
    },
  },
  {
    id: 'communication-evidence',
    key: 'COMMUNICATION_EVIDENCE',
    name: 'Communication Evidence',
    description: 'Chat logs, call records, emails demonstrating ongoing relationship',
    category: 'RELATIONSHIP',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      visaCategories: ['IR-1', 'CR-1'],
    },
  },
  {
    id: 'joint-financial-docs',
    key: 'JOINT_FINANCIAL',
    name: 'Joint Financial Documents',
    description: 'Joint bank accounts, property, insurance, etc.',
    category: 'RELATIONSHIP',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'fixed_days',
    validityDays: 180,
    requiredWhen: {
      visaCategories: ['IR-1', 'CR-1'],
    },
  },
];

// ============================================================================
// POLICE / COURT / MILITARY
// ============================================================================

const POLICE_DOCS: DocumentDefinition[] = [
  {
    id: 'police-certificate-pakistan',
    key: 'POLICE_CERT_PK',
    name: 'Police Certificate (Pakistan)',
    description: 'Police clearance certificate from Pakistan',
    category: 'POLICE',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 365, // Valid for 1 year
    defaultWarnDays: 90,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Apply at Local Police Station',
        description: 'Visit your local police station or apply through NADRA for a police clearance certificate.',
        resources: [
          {
            name: 'Pakistan Police Verification',
            url: 'https://www.nadra.gov.pk/services/police-verification/',
            type: 'link',
          },
        ],
        tips: [
          'Bring original CNIC',
          'May require fingerprinting',
          'Valid for 1 year from issue date',
        ],
        estimatedTime: '2-4 weeks',
        cost: 'PKR 500-1,500',
      },
      {
        stepNumber: 2,
        title: 'Get English Translation',
        description: 'If certificate is in Urdu, get certified translation.',
        estimatedTime: '2-3 days',
        cost: 'PKR 1,500-3,000',
      },
    ],
  },
  {
    id: 'court-records',
    key: 'COURT_RECORDS',
    name: 'Court Records',
    description: 'Records of any arrests, convictions, or court proceedings',
    category: 'POLICE',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      scenarioFlags: { criminal_history: true },
    },
  },
  {
    id: 'military-records',
    key: 'MILITARY_RECORDS',
    name: 'Military Service Records',
    description: 'Military service records if applicable',
    category: 'POLICE',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      scenarioFlags: { military_service: true },
    },
  },
];

// ============================================================================
// MEDICAL
// ============================================================================

const MEDICAL_DOCS: DocumentDefinition[] = [
  {
    id: 'medical-exam-ds2019',
    key: 'MEDICAL_EXAM',
    name: 'Medical Examination (Form DS-2019)',
    description: 'Medical examination report from panel physician',
    category: 'MEDICAL',
    roles: ['BENEFICIARY'],
    stages: ['INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 180, // 6 months validity
    defaultWarnDays: 30,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Schedule Medical Exam',
        description: 'Book appointment with panel physician approved by U.S. Embassy Islamabad.',
        resources: [
          {
            name: 'Panel Physicians in Pakistan',
            url: 'https://pk.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/doctors/',
            type: 'link',
          },
        ],
        tips: [
          'Schedule only after receiving interview date',
          'Bring passport, photos, and vaccination records',
          'Exam includes physical, blood tests, and X-ray',
        ],
        estimatedTime: '3-4 hours for exam',
        cost: 'Approximately PKR 20,000-30,000',
      },
      {
        stepNumber: 2,
        title: 'Collect Medical Report',
        description: 'Pick up sealed medical report - DO NOT OPEN',
        tips: [
          'Report is sealed and must remain sealed',
          'Bring to interview appointment',
          'Valid for 6 months',
        ],
      },
    ],
  },
  {
    id: 'vaccination-records',
    key: 'VACCINATION_RECORDS',
    name: 'Vaccination Records',
    description: 'Proof of required vaccinations',
    category: 'MEDICAL',
    roles: ['BENEFICIARY'],
    stages: ['INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'polio-vaccine-cert',
    key: 'POLIO_CERT',
    name: 'Polio Vaccination Certificate',
    description: 'Official International Certificate of Vaccination (issued within last 12 months)',
    category: 'MEDICAL',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 365, // Valid for 1 year
    defaultWarnDays: 60,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Visit Government Hospital or Health Office',
        description: 'Get a fresh dose of Oral Polio Vaccine (OPV) from any government-approved vaccination center or hospital.',
        tips: [
          'Must be recorded on the official Yellow Card or NADRA system',
          'Make sure the date of vaccination is within 1 year of your travel date',
        ],
        estimatedTime: '1 day',
        cost: 'Free (Government Centers) / Nominal (Private)',
      },
      {
        stepNumber: 2,
        title: 'Get NADRA Immunization Certificate',
        description: 'If vaccinated through the official system, you can also download a computerized certificate from the NADRA website.',
        resources: [
          {
            name: 'NADRA SLIMS (Immunization)',
            url: 'https://nims.nadra.gov.pk/',
            type: 'link',
          },
        ],
        tips: [
          'NADRA certificate is more professional and widely accepted',
          'Keep both original and computerized copy',
        ],
        estimatedTime: '10 minutes (online)',
        cost: 'PKR 100',
      },
    ],
  },
];

// ============================================================================
// PHOTOS
// ============================================================================

const PHOTO_DOCS: DocumentDefinition[] = [
  {
    id: 'passport-photos',
    key: 'PASSPORT_PHOTOS',
    name: 'Passport-Style Photos',
    description: 'U.S. visa-compliant passport photos (2x2 inches)',
    category: 'PHOTOS',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 180, // Should be recent (6 months)
    defaultWarnDays: 30,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Get Compliant Photos',
        description: 'Get 2x2 inch photos that meet U.S. visa photo requirements.',
        resources: [
          {
            name: 'U.S. Visa Photo Requirements',
            url: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html',
            type: 'link',
          },
        ],
        tips: [
          'White or off-white background',
          'Taken within last 6 months',
          'Face directly facing camera',
          'No glasses, headphones, or accessories',
          'Neutral expression',
        ],
        estimatedTime: '30 minutes',
        cost: 'PKR 500-1,000',
      },
    ],
  },
];

// ============================================================================
// TRANSLATIONS
// ============================================================================

const TRANSLATION_DOCS: DocumentDefinition[] = [
  {
    id: 'translator-certification',
    key: 'TRANSLATOR_CERT',
    name: 'Translator Certification',
    description: 'Certification statement from translator for all translated documents',
    category: 'TRANSLATIONS',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
];

// ============================================================================
// MISC / CASE EVIDENCE
// ============================================================================

const MISC_DOCS: DocumentDefinition[] = [
  {
    id: 'ds-260',
    key: 'DS260',
    name: 'Form DS-260 Confirmation',
    description: 'Online Immigrant Visa Application confirmation page',
    category: 'MISC',
    roles: ['BENEFICIARY'],
    stages: ['NVC'],
    required: true,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'i-130-approval',
    key: 'I130_APPROVAL',
    name: 'Form I-130 Approval Notice',
    description: 'USCIS approval notice for Form I-130',
    category: 'MISC',
    roles: ['PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'nvc-fee-receipts',
    key: 'NVC_FEE_RECEIPTS',
    name: 'NVC Fee Payment Receipts',
    description: 'Proof of payment for NVC processing fees',
    category: 'MISC',
    roles: ['PETITIONER'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
];

// ============================================================================
// EDUCATION DOCUMENTS
// ============================================================================

const EDUCATION_DOCS: DocumentDefinition[] = [
  {
    id: 'matric-certificate',
    key: 'MATRIC_CERT',
    name: 'Matriculation Certificate',
    description: 'SSC/Matriculation certificate from Pakistan',
    category: 'EDUCATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Obtain Matric Certificate',
        description: 'Get your original Matriculation certificate from respective board.',
        tips: [
          'Must be original or certified copy',
          'Get English translation if in Urdu',
        ],
      },
    ],
  },
  {
    id: 'intermediate-certificate',
    key: 'INTER_CERT',
    name: 'Intermediate Certificate',
    description: 'HSSC/Intermediate certificate from Pakistan',
    category: 'EDUCATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'bachelor-degree',
    key: 'BACHELOR_DEGREE',
    name: 'Bachelor\'s Degree',
    description: 'Bachelor\'s degree certificate and transcripts',
    category: 'EDUCATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Collect Degree and Transcripts',
        description: 'Get both the degree certificate and detailed transcripts.',
        tips: [
          'HEC attestation recommended for foreign use',
          'English translation required if in Urdu',
        ],
      },
    ],
  },
  {
    id: 'master-degree',
    key: 'MASTER_DEGREE',
    name: 'Master\'s Degree',
    description: 'Master\'s degree certificate and transcripts',
    category: 'EDUCATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'professional-certificate',
    key: 'PROFESSIONAL_CERT',
    name: 'Professional Certifications',
    description: 'Professional certifications and licenses (e.g., ACCA, CA, PMP)',
    category: 'EDUCATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'hec-attestation',
    key: 'HEC_ATTESTATION',
    name: 'HEC Attestation',
    description: 'HEC attested educational documents',
    category: 'EDUCATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Get HEC Attestation',
        description: 'Apply for HEC attestation through HEC website or office.',
        resources: [
          {
            name: 'HEC Attestation Portal',
            url: 'https://hec.gov.pk/',
            type: 'link',
          },
        ],
        tips: [
          'Required for foreign use of Pakistani degrees',
          'Apply online first, then visit HEC office',
        ],
        estimatedTime: '1-2 weeks',
        cost: 'PKR 2,000-5,000',
      },
    ],
  },
];

// ============================================================================
// WORK / EMPLOYMENT DOCUMENTS
// ============================================================================

const WORK_DOCS: DocumentDefinition[] = [
  {
    id: 'experience-letter-pakistan',
    key: 'EXPERIENCE_LETTER_PK',
    name: 'Work Experience Letter (Pakistan)',
    description: 'Experience letter from Pakistani employers',
    category: 'WORK',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Request Experience Letter',
        description: 'Get a formal experience letter from each employer.',
        tips: [
          'Must be on company letterhead',
          'Include job title, duration, responsibilities',
          'Include salary information',
          'English translation required if in Urdu',
        ],
      },
    ],
  },
  {
    id: 'employment-contract-pakistan',
    key: 'EMPLOYMENT_CONTRACT_PK',
    name: 'Employment Contract (Pakistan)',
    description: 'Employment contracts from Pakistani employers',
    category: 'WORK',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'salary-slips-pakistan',
    key: 'SALARY_SLIPS_PK',
    name: 'Salary Slips (Pakistan)',
    description: 'Recent salary slips from Pakistani employment',
    category: 'WORK',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'noc-pakistan',
    key: 'NOC_PK',
    name: 'No Objection Certificate (NOC)',
    description: 'NOC from current Pakistani employer',
    category: 'WORK',
    roles: ['BENEFICIARY'],
    stages: ['INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 180,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Request NOC from Employer',
        description: 'Get No Objection Certificate from current employer.',
        tips: [
          'Required for some government or sensitive positions',
          'Should state no objection to visa issuance',
        ],
      },
    ],
  },
  {
    id: 'eobi-certificate',
    key: 'EOBI_CERT',
    name: 'EOBI Certificate',
    description: 'Employees\' Old-Age Benefits Institution certificate',
    category: 'WORK',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Get EOBI Certificate',
        description: 'Obtain EOBI certificate if you have EOBI registration.',
        resources: [
          {
            name: 'EOBI Official Website',
            url: 'https://www.eobi.gov.pk/',
            type: 'link',
          },
        ],
        tips: [
          'Shows employment history in Pakistan',
          'Useful for proving work experience',
        ],
      },
    ],
  },
];

// ============================================================================
// TRAVEL DOCUMENTS
// ============================================================================

const TRAVEL_DOCS: DocumentDefinition[] = [
  {
    id: 'previous-visa-stamps',
    key: 'PREVIOUS_VISA_STAMPS',
    name: 'Previous Visa Stamps',
    description: 'Scans of previous visas in passport',
    category: 'TRAVEL',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'travel-history',
    key: 'TRAVEL_HISTORY',
    name: 'Travel History Record',
    description: 'List of previous international travel with dates',
    category: 'TRAVEL',
    roles: ['BENEFICIARY'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'old-passport-copies',
    key: 'OLD_PASSPORT',
    name: 'Old Passport Copies',
    description: 'Copies of previous/old passports',
    category: 'TRAVEL',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Collect Old Passports',
        description: 'Gather all previous passports showing travel history.',
        tips: [
          'Scan biographical pages',
          'Scan all visa stamps',
          'Scan entry/exit stamps',
        ],
      },
    ],
  },
  {
    id: 'travel-itinerary',
    key: 'TRAVEL_ITINERARY',
    name: 'Previous Travel Itineraries',
    description: 'Previous flight itineraries or boarding passes',
    category: 'TRAVEL',
    roles: ['BENEFICIARY'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
];

// ============================================================================
// IDENTITY DOCUMENTS
// ============================================================================

const IDENTITY_DOCS: DocumentDefinition[] = [
  {
    id: 'driving-license-pakistan',
    key: 'DRIVING_LICENSE_PK',
    name: 'Driving License (Pakistan)',
    description: 'Pakistani driving license copy',
    category: 'IDENTITY',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'user_set',
    defaultWarnDays: 90,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Scan Driving License',
        description: 'Get clear scans of your Pakistani driving license.',
        tips: [
          'Both front and back',
          'Ensure all text is readable',
          'English translation if in Urdu',
        ],
      },
    ],
  },
  {
    id: 'domicile-certificate',
    key: 'DOMICILE_CERT',
    name: 'Domicile Certificate',
    description: 'District domicile certificate from Pakistan',
    category: 'IDENTITY',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Obtain Domicile Certificate',
        description: 'Get your domicile certificate from the district administration.',
        resources: [
          {
            name: 'Punjab Domicile Guide',
            url: 'https://punjab.gov.pk/',
            type: 'link',
          },
        ],
        tips: [
          'Issued by District Commissioner',
          'Shows permanent residence',
          'English translation if in Urdu',
        ],
      },
    ],
  },
  {
    id: 'prc-certificate',
    key: 'PRC_CERT',
    name: 'PRC (Permanent Residence Certificate)',
    description: 'Permanent Residence Certificate from Pakistan',
    category: 'IDENTITY',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'nicop-cnic',
    key: 'NICOP_CNIC',
    name: 'NICOP/CNIC with Photo',
    description: 'NICOP or CNIC with clear photo',
    category: 'IDENTITY',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 1825, // 5 years validity
    defaultWarnDays: 180,
  },
];

// ============================================================================
// PROPERTY / ASSETS DOCUMENTS
// ============================================================================

const PROPERTY_DOCS: DocumentDefinition[] = [
  {
    id: 'property-ownership-docs',
    key: 'PROPERTY_OWNERSHIP',
    name: 'Property Ownership Documents',
    description: 'Property deeds, registry papers, fard documents',
    category: 'PROPERTY',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Collect Property Documents',
        description: 'Gather all property ownership documents.',
        tips: [
          'Fard/registry from Patwari office',
          'Property deed/registry',
          'English translation if in Urdu',
          'Valuation certificate helpful',
        ],
      },
    ],
  },
  {
    id: 'vehicle-registration',
    key: 'VEHICLE_REGISTRATION',
    name: 'Vehicle Registration Papers',
    description: 'Vehicle registration documents in Pakistan',
    category: 'PROPERTY',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'bank-assets-pakistan',
    key: 'BANK_ASSETS_PK',
    name: 'Bank Assets in Pakistan',
    description: 'Bank account statements, fixed deposit certificates',
    category: 'PROPERTY',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'fixed_days',
    validityDays: 180,
    defaultWarnDays: 60,
  },
  {
    id: 'nra-certificate',
    key: 'NRA_CERT',
    name: 'NRA (Non-Resident Alien) Certificate',
    description: 'NRA certificate from Pakistan',
    category: 'PROPERTY',
    roles: ['BENEFICIARY'],
    stages: ['NVC'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'investment-certificates',
    key: 'INVESTMENT_CERT',
    name: 'Investment Certificates',
    description: 'Stocks, bonds, mutual fund certificates',
    category: 'PROPERTY',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
];

// ============================================================================
// IMMIGRATION HISTORY DOCUMENTS
// ============================================================================

const IMMIGRATION_DOCS: DocumentDefinition[] = [
  {
    id: 'prior-visa-denials',
    key: 'PRIOR_VISA_DENIALS',
    name: 'Prior Visa Denial Letters',
    description: 'Letters explaining prior visa denials (if any)',
    category: 'IMMIGRATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      scenarioFlags: { previous_immigration_violations: true },
    },
  },
  {
    id: 'immigration-court-docs',
    key: 'IMMIGRATION_COURT',
    name: 'Immigration Court Documents',
    description: 'Any prior immigration court proceedings or removal orders',
    category: 'IMMIGRATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      scenarioFlags: { previous_immigration_violations: true },
    },
  },
  {
    id: 'reentry-permit',
    key: 'REENTRY_PERMIT',
    name: 'Re-entry Permit (if any)',
    description: 'Re-entry permit documents',
    category: 'IMMIGRATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'prior-petition-docs',
    key: 'PRIOR_PETITION',
    name: 'Prior Immigration Petition Documents',
    description: 'Documents from prior immigration petitions',
    category: 'IMMIGRATION',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'arrival-departure-records',
    key: 'ARRIVAL_DEPARTURE',
    name: 'Arrival/Departure Records (I-94)',
    description: 'I-94 records from previous US visits',
    category: 'IMMIGRATION',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
];

// ============================================================================
// TAX DOCUMENTS (PAKISTAN)
// ============================================================================

const TAX_DOCS: DocumentDefinition[] = [
  {
    id: 'fbr-tax-returns',
    key: 'FBR_TAX_RETURNS',
    name: 'FBR Tax Returns (Pakistan)',
    description: 'FBR tax returns from Pakistan',
    category: 'TAX',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Get FBR Tax Returns',
        description: 'Download your tax returns from FBR portal.',
        resources: [
          {
            name: 'FBR Tax Portal',
            url: 'https://iris.fbr.gov.pk/',
            type: 'link',
          },
        ],
        tips: [
          'Last 3 years recommended',
          'NTN certificate also helpful',
        ],
      },
    ],
  },
  {
    id: 'ntn-certificate',
    key: 'NTN_CERT',
    name: 'NTN Certificate (National Tax Number)',
    description: 'NTN certificate from FBR',
    category: 'TAX',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'tax-clearance-certificate',
    key: 'TAX_CLEARANCE',
    name: 'Tax Clearance Certificate',
    description: 'Tax clearance certificate from FBR',
    category: 'TAX',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 365,
  },
];

// ============================================================================
// LEGAL DOCUMENTS
// ============================================================================

const LEGAL_DOCS: DocumentDefinition[] = [
  {
    id: 'affidavit-bona-fide',
    key: 'AFFIDAVIT_BONA_FIDE',
    name: 'Affidavit of Bona Fide Marriage',
    description: 'Affidavit from friends/family regarding marriage',
    category: 'LEGAL',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      visaCategories: ['IR-1', 'CR-1'],
    },
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Get Affidavits from Witnesses',
        description: 'Request affidavits from friends/family who can attest to your marriage.',
        tips: [
          'Notarized by oath commissioner',
          'Include witness contact details',
          'Describe how they know the couple',
          'Mention attending wedding',
        ],
        estimatedTime: '2-3 days',
        cost: 'PKR 500-1,000 per affidavit',
      },
    ],
  },
  {
    id: 'notarized-documents',
    key: 'NOTARIZED_DOCS',
    name: 'Notarized Documents',
    description: 'Any documents requiring notarization',
    category: 'LEGAL',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'name-change-docs',
    key: 'NAME_CHANGE',
    name: 'Name Change Documents',
    description: 'Legal name change documents (if applicable)',
    category: 'LEGAL',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
    requiredWhen: {
      scenarioFlags: { name_change_any_party: true },
    },
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Collect Name Change Documents',
        description: 'Get all legal name change documentation.',
        tips: [
          'Court order for name change',
          'Gazette notification',
          'NADRA updated documents',
          'English translation if in Urdu',
        ],
      },
    ],
  },
  {
    id: 'guardianship-docs',
    key: 'GUARDIANSHIP',
    name: 'Guardianship/Custody Documents',
    description: 'Legal custody or guardianship documents for minors',
    category: 'LEGAL',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
];

// ============================================================================
// HEALTH INSURANCE DOCUMENTS
// ============================================================================

const HEALTH_INSURANCE_DOCS: DocumentDefinition[] = [
  {
    id: 'health-insurance-policy',
    key: 'HEALTH_INSURANCE',
    name: 'Health Insurance Policy',
    description: 'Health insurance policy documents',
    category: 'HEALTH_INSURANCE',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'fixed_days',
    validityDays: 365,
    defaultWarnDays: 60,
  },
  {
    id: 'insurance-coverage-letter',
    key: 'INSURANCE_COVERAGE',
    name: 'Insurance Coverage Letter',
    description: 'Letter confirming health insurance coverage',
    category: 'HEALTH_INSURANCE',
    roles: ['PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 180,
    defaultWarnDays: 30,
  },
];

// ============================================================================
// SOCIAL MEDIA DOCUMENTS
// ============================================================================

const SOCIAL_MEDIA_DOCS: DocumentDefinition[] = [
  {
    id: 'social-media-list',
    key: 'SOCIAL_MEDIA_LIST',
    name: 'Social Media Platforms List',
    description: 'List of social media platforms used in last 5 years',
    category: 'SOCIAL_MEDIA',
    roles: ['BENEFICIARY'],
    stages: ['DS260_SUBMISSION'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'List Social Media Accounts',
        description: 'Create a list of all social media platforms you\'ve used.',
        tips: [
          'Include platforms: Facebook, Instagram, Twitter, LinkedIn, TikTok, etc.',
          'Include all usernames/handles',
          'Include accounts you\'ve deleted',
          'Required for DS-260 form',
        ],
      },
    ],
  },
  {
    id: 'social-media-screenshots',
    key: 'SOCIAL_MEDIA_SS',
    name: 'Social Media Profile Screenshots',
    description: 'Screenshots of social media profiles (if requested)',
    category: 'SOCIAL_MEDIA',
    roles: ['BENEFICIARY'],
    stages: ['INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
];

// ============================================================================
// ADDRESS PROOF DOCUMENTS
// ============================================================================

const ADDRESS_PROOF_DOCS: DocumentDefinition[] = [
  {
    id: 'utility-bills-pakistan',
    key: 'UTILITY_BILLS_PK',
    name: 'Utility Bills (Pakistan)',
    description: 'Electricity, gas, water, telephone bills',
    category: 'ADDRESS_PROOF',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'fixed_days',
    validityDays: 180,
    defaultWarnDays: 30,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Collect Utility Bills',
        description: 'Gather recent utility bills showing your address.',
        tips: [
          'Last 6 months recommended',
          'Include name on bill',
          'English translation if in Urdu',
          'Shows proof of residence',
        ],
      },
    ],
  },
  {
    id: 'rent-agreement-pakistan',
    key: 'RENT_AGREEMENT_PK',
    name: 'Rent Agreement',
    description: 'Rental lease agreement',
    category: 'ADDRESS_PROOF',
    roles: ['BENEFICIARY'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'user_set',
    defaultWarnDays: 90,
    wizardSteps: [
      {
        stepNumber: 1,
        title: 'Get Rent Agreement',
        description: 'Ensure you have a valid rental agreement.',
        tips: [
          'Should be notarized',
          'Include both parties\' details',
          'English translation if in Urdu',
        ],
      },
    ],
  },
  {
    id: 'property-tax-bills',
    key: 'PROPERTY_TAX',
    name: 'Property Tax Bills',
    description: 'Property tax payment receipts',
    category: 'ADDRESS_PROOF',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'post-office-box-proof',
    key: 'PO_BOX_PROOF',
    name: 'PO Box Address Proof',
    description: 'PO Box rental receipt or ownership proof',
    category: 'ADDRESS_PROOF',
    roles: ['BENEFICIARY'],
    stages: ['NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'fixed_days',
    validityDays: 365,
  },
];

// ============================================================================
// OTHER / MISCELLANEOUS DOCUMENTS
// ============================================================================

const OTHER_DOCS: DocumentDefinition[] = [
  {
    id: 'cover-letter',
    key: 'COVER_LETTER',
    name: 'Cover Letter',
    description: 'Cover letter explaining the case',
    category: 'OTHER',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'timeline-document',
    key: 'TIMELINE',
    name: 'Relationship Timeline',
    description: 'Detailed timeline of relationship events',
    category: 'OTHER',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
  {
    id: 'correspondence-logs',
    key: 'CORRESPONDENCE_LOGS',
    name: 'Correspondence Logs',
    description: 'Logs of all official correspondence',
    category: 'OTHER',
    roles: ['BENEFICIARY', 'PETITIONER'],
    stages: ['USCIS', 'NVC', 'INTERVIEW'],
    required: false,
    multipleFilesAllowed: true,
    validityType: 'none',
  },
  {
    id: 'consular-interview-notes',
    key: 'INTERVIEW_NOTES',
    name: 'Consular Interview Notes',
    description: 'Preparation notes for consular interview',
    category: 'OTHER',
    roles: ['BENEFICIARY'],
    stages: ['INTERVIEW'],
    required: false,
    multipleFilesAllowed: false,
    validityType: 'none',
  },
];

// ============================================================================
// MASTER DOCUMENT DATABASE
// ============================================================================

export const ALL_DOCUMENTS: DocumentDefinition[] = [
  // Original categories
  ...CIVIL_DOCS,
  ...FINANCIAL_DOCS,
  ...RELATIONSHIP_DOCS,
  ...POLICE_DOCS,
  ...MEDICAL_DOCS,
  ...PHOTO_DOCS,
  ...TRANSLATION_DOCS,
  ...MISC_DOCS,
  // New comprehensive categories
  ...EDUCATION_DOCS,
  ...WORK_DOCS,
  ...TRAVEL_DOCS,
  ...IDENTITY_DOCS,
  ...PROPERTY_DOCS,
  ...IMMIGRATION_DOCS,
  ...TAX_DOCS,
  ...LEGAL_DOCS,
  ...HEALTH_INSURANCE_DOCS,
  ...SOCIAL_MEDIA_DOCS,
  ...ADDRESS_PROOF_DOCS,
  ...OTHER_DOCS,
];

// Index by key for quick lookup
export const DOCUMENTS_BY_KEY = ALL_DOCUMENTS.reduce(
  (acc, doc) => {
    acc[doc.key] = doc;
    return acc;
  },
  {} as Record<string, DocumentDefinition>
);

// Index by category
export const DOCUMENTS_BY_CATEGORY = ALL_DOCUMENTS.reduce(
  (acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  },
  {} as Record<DocumentCategory, DocumentDefinition[]>
);
