// Document Vault Type Definitions

export type VisaCategory =
  | 'IR-1' // Immediate Relative - Spouse of U.S. Citizen
  | 'CR-1' // Conditional Resident - Spouse of U.S. Citizen (married < 2 years)
  | 'IR-2' // Immediate Relative - Unmarried Child under 21 of U.S. Citizen
  | 'CR-2' // Conditional Resident - Unmarried Child under 21 of U.S. Citizen
  | 'IR-5' // Immediate Relative - Parent of U.S. Citizen
  | 'F1'   // Family First Preference - Unmarried Sons/Daughters of U.S. Citizens
  | 'F2A'  // Family Second Preference - Spouses/Children of LPR
  | 'F2B'  // Family Second Preference - Unmarried Sons/Daughters of LPR
  | 'F3'   // Family Third Preference - Married Sons/Daughters of U.S. Citizens
  | 'F4';  // Family Fourth Preference - Siblings of U.S. Citizens

export type ProcessStage = 'USCIS' | 'NVC' | 'INTERVIEW' | 'DS260_SUBMISSION';

export type DocumentRole =
  | 'PETITIONER'
  | 'BENEFICIARY'
  | 'JOINT_SPONSOR'
  | 'HOUSEHOLD_MEMBER';

export type DocumentCategory =
  // Original categories
  | 'CIVIL'
  | 'FINANCIAL'
  | 'RELATIONSHIP'
  | 'POLICE'
  | 'MEDICAL'
  | 'PHOTOS'
  | 'TRANSLATIONS'
  | 'MISC'
  // New comprehensive categories
  | 'EDUCATION'        // Degrees, transcripts, certificates
  | 'WORK'             // Employment letters, NOC, experience letters
  | 'TRAVEL'           // Previous visas, travel history
  | 'IDENTITY'         // ID cards, driving licenses, domicile
  | 'PROPERTY'         // Property ownership, assets
  | 'IMMIGRATION'      // Prior immigration documents, petitions
  | 'TAX'              // Tax returns (Pakistan FBR)
  | 'LEGAL'            // Legal documents, affidavits, notarized docs
  | 'HEALTH_INSURANCE' // Health insurance documents
  | 'SOCIAL_MEDIA'     // Social media handles history
  | 'ADDRESS_PROOF'    // Utility bills, rent agreements
  | 'OTHER';

export type ValidityType =
  | 'none'           // Document doesn't expire
  | 'fixed_days'     // Fixed validity period (e.g., police cert - 1 year)
  | 'user_set'       // User manually sets expiration
  | 'policy_variable'; // Depends on post/case specifics

export type DocumentStatus =
  | 'MISSING'         // No file uploaded
  | 'UPLOADED'        // File(s) uploaded
  | 'NEEDS_ATTENTION' // Expiring soon or issue detected
  | 'EXPIRED';        // Past expiration date

export interface ScenarioFlags {
  // Marriage/Relationship
  prior_marriage_petitioner?: boolean;
  prior_marriage_beneficiary?: boolean;
  name_change_any_party?: boolean;

  // Children
  child_adopted?: boolean;
  child_stepchild?: boolean;
  child_legitimation_or_custody_complexity?: boolean;

  // Financial
  joint_sponsor_used?: boolean;
  household_member_used?: boolean;
  domicile_needs_proof?: boolean;

  // Background
  police_certificate_required?: boolean;
  military_service?: boolean;
  previous_immigration_violations?: boolean;
  criminal_history?: boolean;
}

export interface DocumentDefinition {
  id: string;
  key: string; // Stable key for naming (e.g., BIRTH_CERT, NIKAH_NAMA)
  name: string;
  description: string;
  category: DocumentCategory;
  roles: DocumentRole[]; // Who provides this document
  stages: ProcessStage[]; // Where it's used
  required: boolean;
  multipleFilesAllowed: boolean;

  // Validity tracking
  validityType: ValidityType;
  validityDays?: number; // For fixed_days type
  defaultWarnDays?: number; // Days before expiry to warn

  // Wizard guidance
  wizardSteps?: DocumentWizardStep[];

  // Conditional logic
  requiredWhen?: {
    visaCategories?: VisaCategory[];
    scenarioFlags?: Partial<ScenarioFlags>;
  };
}

export interface DocumentWizardStep {
  stepNumber: number;
  title: string;
  description: string;
  resources?: {
    name: string;
    url: string;
    type: 'link' | 'pdf' | 'video';
  }[];
  tips?: string[];
  estimatedTime?: string;
  cost?: string;
}

export interface UploadedDocument {
  isRead: unknown;
  id: string;
  userId: string;
  documentDefId: string; // References DocumentDefinition

  // File info
  originalFilename: string;
  standardizedFilename: string;
  fileSize: number;
  mimeType: string;
  storagePath: string; // Local path for now

  // Compressed file info (for files >4MB - NVC/USCIS requirement)
  hasCompressedVersion: boolean;
  compressedFilename?: string;
  compressedFileSize?: number;
  compressedStoragePath?: string;

  // Metadata
  uploadedAt: Date;
  uploadedBy: DocumentRole;
  version: number;

  // Expiration tracking
  expirationDate?: Date;
  isExpired: boolean;

  // Status
  status: DocumentStatus;
  notes?: string;
}

export interface DocumentVaultConfig {
  userId: string;
  visaCategory: VisaCategory;
  scenarioFlags: ScenarioFlags;
  caseId?: string; // USCIS receipt or NVC case number

  // User info for naming
  petitionerName?: string;
  beneficiaryName?: string;
  jointSponsorName?: string;
}

export type NotificationType =
  | 'DOC_MISSING'
  | 'DOC_EXPIRING_SOON'
  | 'DOC_EXPIRED'
  | 'DOC_RENAMED'
  | 'DOC_UPLOADED';

export type NotificationSeverity = 'info' | 'warning' | 'error';

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  documentId?: string;
  documentDefId?: string;
  actionRequired: boolean;
  createdAt: Date;
  read: boolean;
  snoozedUntil?: Date;
}

export interface NotificationConfig {
  userId: string;

  // Channels (only in-app for now)
  emailEnabled: boolean; // Future: email notifications
  email?: string;

  // Reminder frequency
  missingDocReminderDays: number; // 0 = disabled, 1 = daily, 7 = weekly, 30 = monthly
  expiryReminderDays: number[]; // Days before expiry (e.g., [90, 60, 30, 7])

  // Snooze - global snooze for all notifications
  snoozedUntil?: Date;

  // Last reminder tracking (to prevent spam)
  lastMissingDocReminder?: Date;
  lastExpiryReminder?: Record<string, Date>; // documentId -> last reminder date
}

export interface NotificationPreferences {
  // Enable/disable notification types
  enableMissingDocNotifications: boolean;
  enableExpiringNotifications: boolean;
  enableExpiredNotifications: boolean;

  // Reminder cadence
  missingDocReminderCadence: 'disabled' | 'daily' | 'weekly' | 'monthly';
  expiryReminderThresholds: number[]; // [90, 60, 30, 7] days before expiry
}

export interface ExportOptions {
  includeArchived: boolean;
  structureByCategory: boolean;
  includeMetadata: boolean; // Export a metadata.json file
}

export interface ValidationRule {
  type: 'file_size' | 'file_type' | 'file_count' | 'expiration_date';
  value: string | number | string[] | boolean;
  message: string;
}
