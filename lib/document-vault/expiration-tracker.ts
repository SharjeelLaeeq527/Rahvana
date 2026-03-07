// Document Expiration Tracking and Notification System

import { UploadedDocument, DocumentDefinition, DocumentStatus } from "./types";

type TranslateFn = (key: string, options?: any) => string;

/**
 * Calculates expiration date based on document definition
 */
export function calculateExpirationDate(
  documentDef: DocumentDefinition,
  uploadDate: Date,
  userProvidedDate?: Date,
): Date | undefined {
  switch (documentDef.validityType) {
    case "none":
      return undefined; // Document doesn't expire

    case "fixed_days":
      if (!documentDef.validityDays) return undefined;
      const expiryDate = new Date(uploadDate);
      expiryDate.setDate(expiryDate.getDate() + documentDef.validityDays);
      return expiryDate;

    case "user_set":
      return userProvidedDate; // User must provide expiration date

    case "policy_variable":
      return userProvidedDate; // User must provide based on their case specifics

    default:
      return undefined;
  }
}

/**
 * Checks if document is expired
 */
export function isDocumentExpired(document: UploadedDocument): boolean {
  if (!document.expirationDate) return false;

  const now = new Date();
  return now > document.expirationDate;
}

/**
 * Checks if document is expiring soon
 */
export function isDocumentExpiringSoon(
  document: UploadedDocument,
  documentDef: DocumentDefinition,
  warnDays?: number,
): boolean {
  if (!document.expirationDate) return false;

  const daysUntilExpiry = getDaysUntilExpiration(document);

  if (daysUntilExpiry === null || daysUntilExpiry < 0) return false;

  const warnThreshold = warnDays || documentDef.defaultWarnDays || 30;
  return daysUntilExpiry <= warnThreshold;
}

/**
 * Gets days until expiration (null if no expiration, negative if expired)
 */
export function getDaysUntilExpiration(
  document: UploadedDocument,
): number | null {
  if (!document.expirationDate) return null;

  // Ensure expirationDate is a Date object
  const expirationDate =
    document.expirationDate instanceof Date
      ? document.expirationDate
      : new Date(document.expirationDate);

  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Determines document status based on expiration
 */
export function determineDocumentStatus(
  document: UploadedDocument,
  documentDef: DocumentDefinition,
): DocumentStatus {
  // If no expiration date, status is simply UPLOADED
  if (!document.expirationDate) {
    return "UPLOADED";
  }

  if (isDocumentExpired(document)) {
    return "EXPIRED";
  }

  if (isDocumentExpiringSoon(document, documentDef)) {
    return "NEEDS_ATTENTION";
  }

  return "UPLOADED";
}

/**
 * Updates document statuses based on current date
 * Call this periodically to update all documents
 */
export function updateDocumentStatuses(
  documents: UploadedDocument[],
  documentDefs: Map<string, DocumentDefinition>,
): UploadedDocument[] {
  return documents.map((doc) => {
    const def = documentDefs.get(doc.documentDefId);
    if (!def) return doc;

    const newStatus = determineDocumentStatus(doc, def);

    return {
      ...doc,
      status: newStatus,
      isExpired: isDocumentExpired(doc),
    };
  });
}

/**
 * Gets documents that need attention (expiring or expired)
 */
export function getDocumentsNeedingAttention(
  documents: UploadedDocument[],
): UploadedDocument[] {
  return documents.filter(
    (doc) => doc.status === "NEEDS_ATTENTION" || doc.status === "EXPIRED",
  );
}

/**
 * Gets expiring documents grouped by urgency
 */
export interface ExpiringDocumentsGroup {
  urgent: UploadedDocument[]; // Expiring in < 7 days
  soon: UploadedDocument[]; // Expiring in 7-30 days
  later: UploadedDocument[]; // Expiring in 30-90 days
  expired: UploadedDocument[]; // Already expired
}

export function groupExpiringDocuments(
  documents: UploadedDocument[],
): ExpiringDocumentsGroup {
  const result: ExpiringDocumentsGroup = {
    urgent: [],
    soon: [],
    later: [],
    expired: [],
  };

  documents.forEach((doc) => {
    if (!doc.expirationDate) return;

    const daysUntil = getDaysUntilExpiration(doc);
    if (daysUntil === null) return;

    if (daysUntil < 0) {
      result.expired.push(doc);
    } else if (daysUntil <= 7) {
      result.urgent.push(doc);
    } else if (daysUntil <= 30) {
      result.soon.push(doc);
    } else if (daysUntil <= 90) {
      result.later.push(doc);
    }
  });

  return result;
}

/**
 * Formats expiration date for display
 */
export function formatExpirationDate(
  date: Date | string,
  t?: TranslateFn,
): string {
  // Ensure date is a Date object
  const expirationDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const daysUntil = Math.ceil(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (!t) {
    if (daysUntil < 0) {
      return `Expired ${Math.abs(daysUntil)} days ago`;
    } else if (daysUntil === 0) {
      return "Expires today";
    } else if (daysUntil === 1) {
      return "Expires tomorrow";
    } else if (daysUntil <= 7) {
      return `Expires in ${daysUntil} days`;
    } else if (daysUntil <= 30) {
      return `Expires in ${Math.ceil(daysUntil / 7)} weeks`;
    } else if (daysUntil <= 90) {
      return `Expires in ${Math.ceil(daysUntil / 30)} months`;
    } else {
      return expirationDate.toLocaleDateString();
    }
  }

  // Use translation function if provided
  if (daysUntil < 0) {
    return t("documentVaultPage.logic.expiration.expiredAgo", {
      days: Math.abs(daysUntil),
    });
  } else if (daysUntil === 0) {
    return t("documentVaultPage.logic.expiration.expiresToday");
  } else if (daysUntil === 1) {
    return t("documentVaultPage.logic.expiration.expiresTomorrow");
  } else if (daysUntil <= 7) {
    return t("documentVaultPage.logic.expiration.expiresInDays", {
      days: daysUntil,
    });
  } else if (daysUntil <= 30) {
    return t("documentVaultPage.logic.expiration.expiresInWeeks", {
      weeks: Math.ceil(daysUntil / 7),
    });
  } else if (daysUntil <= 90) {
    return t("documentVaultPage.logic.expiration.expiresInMonths", {
      months: Math.ceil(daysUntil / 30),
    });
  } else {
    return expirationDate.toLocaleDateString();
  }
}

/**
 * Gets expiration status color
 */
export function getExpirationStatusColor(
  document: UploadedDocument,
): "red" | "yellow" | "green" | "gray" {
  if (!document.expirationDate) return "gray";

  const daysUntil = getDaysUntilExpiration(document);
  if (daysUntil === null) return "gray";

  if (daysUntil < 0) return "red"; // Expired
  if (daysUntil <= 7) return "red"; // Urgent
  if (daysUntil <= 30) return "yellow"; // Soon
  return "green"; // Valid
}

/**
 * Enhanced notification generation with rate limiting and snooze support
 */
import {
  NotificationMessage,
  NotificationConfig,
  NotificationPreferences,
} from "./types";

export function generateNotifications(
  documents: UploadedDocument[],
  documentDefs: Map<string, DocumentDefinition>,
  requiredDocIds: string[],
  config?: NotificationConfig,
  preferences?: NotificationPreferences,
  t?: TranslateFn,
): NotificationMessage[] {
  const notifications: NotificationMessage[] = [];
  const now = new Date();

  // Check if notifications are globally snoozed
  if (config?.snoozedUntil && now < config.snoozedUntil) {
    return []; // All notifications snoozed
  }

  // Default preferences if not provided
  const prefs: NotificationPreferences = preferences || {
    enableMissingDocNotifications: true,
    enableExpiringNotifications: true,
    enableExpiredNotifications: true,
    missingDocReminderCadence: "weekly",
    expiryReminderThresholds: [90, 60, 30, 7],
  };

  // Missing documents notifications
  if (prefs.enableMissingDocNotifications) {
    // Check rate limiting for missing doc reminders
    const shouldShowMissingReminders = shouldSendMissingDocReminder(
      config?.lastMissingDocReminder,
      prefs.missingDocReminderCadence,
    );

    if (shouldShowMissingReminders) {
      const uploadedDocDefIds = new Set(documents.map((d) => d.documentDefId));
      const missingDocIds = requiredDocIds.filter(
        (id) => !uploadedDocDefIds.has(id),
      );

      missingDocIds.forEach((docDefId) => {
        const def = documentDefs.get(docDefId);
        if (!def) return;

        const docName = t
          ? t(`documentVaultPage.documents.${docDefId}.name`)
          : def.name;

        notifications.push({
          id: `missing_${docDefId}`,
          type: "DOC_MISSING",
          severity: "warning",
          title: t
            ? t(
                "documentVaultPage.components.logic.notifications.missingDocTitle",
              )
            : "Missing Required Document",
          message: t
            ? t(
                "documentVaultPage.components.logic.notifications.missingDocMessage",
                {
                  name: docName,
                },
              )
            : `${def.name} is required but not yet uploaded. Upload it to complete your document package.`,
          documentDefId: docDefId,
          actionRequired: true,
          createdAt: now,
          read: false,
        });
      });
    }
  }

  // Expiring/expired documents notifications
  documents.forEach((doc) => {
    const def = documentDefs.get(doc.documentDefId);
    if (!def || !doc.expirationDate) return;

    const daysUntil = getDaysUntilExpiration(doc);
    if (daysUntil === null) return;

    const docName = t
      ? t(`documentVaultPage.documents.${doc.documentDefId}.name`)
      : def.name;

    if (daysUntil < 0) {
      // Expired documents
      if (prefs.enableExpiredNotifications) {
        const daysSinceExpiry = Math.abs(daysUntil);
        notifications.push({
          id: `expired_${doc.id}`,
          type: "DOC_EXPIRED",
          severity: "error",
          title: t
            ? t("documentVaultPage.components.logic.notifications.expiredTitle")
            : "Document Expired",
          message: t
            ? t(
                "documentVaultPage.components.logic.notifications.expiredMessage",
                {
                  name: docName,
                  days: daysSinceExpiry,
                },
              )
            : `${def.name} expired ${daysSinceExpiry} day${daysSinceExpiry === 1 ? "" : "s"} ago. Please upload a renewed version immediately.`,
          documentId: doc.id,
          documentDefId: doc.documentDefId,
          actionRequired: true,
          createdAt: now,
          read: false,
        });
      }
    } else if (prefs.enableExpiringNotifications) {
      // Check if document is within any reminder reminder threshold
      const shouldNotify = prefs.expiryReminderThresholds.some((threshold) => {
        // Notify if we're at or below the threshold
        return daysUntil <= threshold;
      });

      if (shouldNotify) {
        // Check rate limiting for this specific document
        const lastReminder = config?.lastExpiryReminder?.[doc.id];
        const shouldShowReminder = shouldSendExpiryReminder(
          lastReminder,
          daysUntil,
        );

        if (shouldShowReminder) {
          // Determine severity based on days until expiry
          let severity: "error" | "warning" = "warning";
          if (daysUntil <= 7) {
            severity = "error"; // Critical: 7 days or less
          }

          let timeMessage = "";
          if (t) {
            if (daysUntil === 0) {
              timeMessage = t(
                "documentVaultPage.components.logic.notifications.expiresToday",
                { name: "" },
              ).trim();
            } else if (daysUntil === 1) {
              timeMessage = t(
                "documentVaultPage.components.logic.notifications.expiresTomorrow",
                { name: "" },
              ).trim();
            } else {
              timeMessage = t(
                "documentVaultPage.components.logic.notifications.expiringInDays",
                { name: "", days: daysUntil },
              ).trim();
            }
          } else {
            if (daysUntil === 0) {
              timeMessage = "expires today";
            } else if (daysUntil === 1) {
              timeMessage = "expires tomorrow";
            } else {
              timeMessage = `expires in ${daysUntil} days`;
            }
          }

          notifications.push({
            id: `expiring_${doc.id}`,
            type: "DOC_EXPIRING_SOON",
            severity,
            title:
              daysUntil <= 7
                ? t
                  ? t(
                      "documentVaultPage.components.logic.notifications.expiringSoonActionTitle",
                    )
                  : "Document Expiring Soon - Action Required"
                : t
                  ? t(
                      "documentVaultPage.components.logic.notifications.expiringSoonTitle",
                    )
                  : "Document Expiring Soon",
            message: t
              ? `${docName} ${timeMessage}. ${daysUntil <= 7 ? t("documentVaultPage.components.logic.notifications.renewImmediately") : t("documentVaultPage.components.logic.notifications.considerRenewing")}`
              : `${def.name} ${timeMessage}. ${daysUntil <= 7 ? "Upload a renewed version immediately." : "Consider uploading a renewed version."}`,
            documentId: doc.id,
            documentDefId: doc.documentDefId,
            actionRequired: daysUntil <= 7,
            createdAt: now,
            read: false,
          });
        }
      }
    }
  });

  // Sort by severity (error > warning > info) and then by creation date
  return notifications.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // If same severity, sort by date (newer first)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/**
 * Checks if missing document reminder should be sent based on cadence
 */
export function shouldSendMissingDocReminder(
  lastReminderDate: Date | undefined,
  cadence: "disabled" | "daily" | "weekly" | "monthly",
): boolean {
  if (cadence === "disabled") return false;
  if (!lastReminderDate) return true; // Never sent before

  const now = new Date();
  const daysSinceLastReminder = Math.floor(
    (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const cadenceDays = {
    disabled: 0,
    daily: 1,
    weekly: 7,
    monthly: 30,
  };

  return daysSinceLastReminder >= cadenceDays[cadence];
}

/**
 * Checks if expiry reminder should be sent for a specific document
 * Rate limiting: don't spam reminders for the same document
 */
export function shouldSendExpiryReminder(
  lastReminderDate: Date | undefined,
  daysUntilExpiry: number,
): boolean {
  if (!lastReminderDate) return true; // Never sent before

  const now = new Date();
  const daysSinceLastReminder = Math.floor(
    (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Rate limiting rules based on urgency
  if (daysUntilExpiry <= 7) {
    // Critical: remind daily
    return daysSinceLastReminder >= 1;
  } else if (daysUntilExpiry <= 30) {
    // Urgent: remind every 3 days
    return daysSinceLastReminder >= 3;
  } else if (daysUntilExpiry <= 60) {
    // Warning: remind weekly
    return daysSinceLastReminder >= 7;
  } else {
    // Info: remind every 2 weeks
    return daysSinceLastReminder >= 14;
  }
}

/**
 * Legacy function - kept for backward compatibility
 */
export function shouldSendReminder(
  lastReminderDate: Date | undefined,
  reminderFrequencyDays: number,
): boolean {
  if (reminderFrequencyDays === 0) return false; // Reminders disabled
  if (!lastReminderDate) return true; // Never sent before

  const now = new Date();
  const daysSinceLastReminder = Math.floor(
    (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysSinceLastReminder >= reminderFrequencyDays;
}

/**
 * Validates expiration date input
 */
export function validateExpirationDate(
  date: Date,
  uploadDate: Date,
  t?: TranslateFn,
): { valid: boolean; error?: string } {
  const now = new Date();

  if (date < now) {
    return {
      valid: false,
      error: t
        ? t("documentVaultPage.logic.validation.pastDate")
        : "Expiration date cannot be in the past",
    };
  }

  if (date < uploadDate) {
    return {
      valid: false,
      error: t
        ? t("documentVaultPage.logic.validation.beforeUpload")
        : "Expiration date cannot be before upload date",
    };
  }

  // Check if expiration date is too far in the future (e.g., > 10 years)
  const maxYears = 10;
  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() + maxYears);

  if (date > maxDate) {
    return {
      valid: false,
      error: t
        ? t("documentVaultPage.logic.validation.tooFarFuture", {
            years: maxYears,
          })
        : `Expiration date cannot be more than ${maxYears} years in the future`,
    };
  }

  return { valid: true };
}
