// Document Vault Zustand Store
// Client-side state management for document vault

import { create } from "zustand";
import {
  DocumentVaultConfig,
  UploadedDocument,
  DocumentDefinition,
  NotificationConfig,
  NotificationPreferences,
  NotificationMessage,
  ScenarioFlags,
  VisaCategory,
} from "./types";
import { generateRequiredDocuments } from "./personalization-engine";
import {
  updateDocumentStatuses,
  generateNotifications,
} from "./expiration-tracker";
import { ALL_DOCUMENTS } from "./document-definitions";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface DocumentVaultStore {
  // Configuration
  config: DocumentVaultConfig | null;
  notificationConfig: NotificationConfig | null;
  notificationPreferences: NotificationPreferences | null;

  // Documents
  uploadedDocuments: UploadedDocument[];
  requiredDocuments: DocumentDefinition[];

  // Progress tracking for wizard steps
  completedSteps: Record<string, string[]>; // documentDefId -> array of completed step IDs

  // Notification state
  notifications: NotificationMessage[];

  // UI State
  isLoading: boolean;
  selectedDocumentDefId: string | null;
  wizardOpen: boolean;
  uploadModalOpen: boolean;
  notificationCenterOpen: boolean;

  // Actions
  initialize: (userId: string, t?: TranslateFn) => Promise<void>;
  setConfig: (config: DocumentVaultConfig) => Promise<void>;
  updateScenarioFlags: (flags: Partial<ScenarioFlags>) => void;
  setVisaCategory: (category: VisaCategory) => void;

  // Document operations
  addDocument: (document: UploadedDocument) => void;
  updateDocument: (
    documentId: string,
    updates: Partial<UploadedDocument>,
  ) => void;
  deleteDocument: (documentId: string) => void;
  refreshDocumentStatuses: () => void;
  reloadDocuments: () => Promise<void>;

  // UI actions
  setSelectedDocument: (documentDefId: string | null) => void;
  openWizard: (documentDefId: string) => void;
  closeWizard: () => void;
  openUploadModal: (documentDefId: string) => void;
  closeUploadModal: () => void;
  toggleNotificationCenter: () => void;

  // Notification settings
  updateNotificationConfig: (config: Partial<NotificationConfig>) => void;
  updateNotificationPreferences: (
    prefs: Partial<NotificationPreferences>,
  ) => void;

  // Notification actions
  snoozeAllNotifications: (hours: number) => void;
  snoozeNotification: (notificationId: string, hours: number) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  refreshNotifications: (t?: TranslateFn) => void;

  // Progress tracking
  toggleStepCompletion: (documentDefId: string, stepId: string) => void;
  isStepCompleted: (documentDefId: string, stepId: string) => boolean;
  getCompletedSteps: (documentDefId: string) => string[];
  resetDocumentProgress: (documentDefId: string) => void;

  // Stats
  getStats: () => {
    total: number;
    uploaded: number;
    missing: number;
    expiring: number;
    expired: number;
    percentComplete: number;
  };

  // Notifications
  getNotifications: () => NotificationMessage[];
  getUnreadNotificationCount: () => number;
  getPendingNotificationCount: () => number;
  getUploadedNotificationCount: () => number;
  isNotificationDocumentUploaded: (notification: NotificationMessage) => boolean;
  getNotificationStatus: (notification: NotificationMessage) => 'pending' | 'uploaded';

  // Reset
  reset: () => void;
}

const initialState = {
  config: null,
  notificationConfig: null,
  notificationPreferences: null,
  uploadedDocuments: [],
  requiredDocuments: [],
  completedSteps: {},
  notifications: [],
  isLoading: false,
  selectedDocumentDefId: null,
  wizardOpen: false,
  uploadModalOpen: false,
  notificationCenterOpen: false,
};

export const useDocumentVaultStore = create<DocumentVaultStore>()(
  (set, get) => ({
    ...initialState,

    initialize: async (userId: string, t?: TranslateFn) => {
      set({ isLoading: true });

      try {
        // Load completed steps from localStorage
        let completedSteps = {};
        let notificationConfig = null;
        let notificationPreferences = null;

        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("document_vault_completed_steps");
          if (stored) {
            try {
              completedSteps = JSON.parse(stored);
            } catch (e) {
              console.error("Failed to parse completed steps:", e);
            }
          }

          // Load notification config
          const notifConfigStored = localStorage.getItem(
            `notification_config_${userId}`,
          );
          if (notifConfigStored) {
            try {
              notificationConfig = JSON.parse(notifConfigStored);
            } catch (e) {
              console.error("Failed to parse notification config:", e);
            }
          }

          // Load notification preferences
          const notifPrefsStored = localStorage.getItem(
            `notification_preferences_${userId}`,
          );
          if (notifPrefsStored) {
            try {
              notificationPreferences = JSON.parse(notifPrefsStored);
            } catch (e) {
              console.error("Failed to parse notification preferences:", e);
            }
          }
        }

        // Fetch config from API
        const configResponse = await fetch("/api/documents/config");
        const configData = await configResponse.json();
        const config = configData.config;

        // Fetch documents from API
        const docsResponse = await fetch("/api/documents/list");
        const docsData = await docsResponse.json();
        const documents = docsData.documents || [];

        if (config) {
          const requiredDocs = generateRequiredDocuments(config, true); // Include optional documents

          // Create document definitions map
          const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));

          // Update document statuses
          const updatedDocs = updateDocumentStatuses(documents, defsMap);

          set({
            config,
            uploadedDocuments: updatedDocs,
            requiredDocuments: requiredDocs,
            completedSteps,
            notificationConfig,
            notificationPreferences,
            isLoading: false,
          });

          // Generate initial notifications
          get().refreshNotifications(t);
        } else {
          set({
            isLoading: false,
            completedSteps,
            notificationConfig,
            notificationPreferences,
          });
        }
      } catch (error) {
        console.error("Failed to initialize document vault:", error);
        set({ isLoading: false });
      }
    },

    setConfig: async (config: DocumentVaultConfig) => {
      const requiredDocs = generateRequiredDocuments(config, true); // Include optional documents

      try {
        // Save to database via API
        await fetch("/api/documents/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });

        set({
          config,
          requiredDocuments: requiredDocs,
        });
      } catch (error) {
        console.error("Failed to save config:", error);
      }
    },

    updateScenarioFlags: (flags: Partial<ScenarioFlags>) => {
      const { config } = get();
      if (!config) return;

      const updatedConfig = {
        ...config,
        scenarioFlags: {
          ...config.scenarioFlags,
          ...flags,
        },
      };

      get().setConfig(updatedConfig);
    },

    setVisaCategory: (category: VisaCategory) => {
      const { config } = get();
      if (!config) return;

      const updatedConfig = {
        ...config,
        visaCategory: category,
      };

      get().setConfig(updatedConfig);
    },

    addDocument: (document: UploadedDocument) => {
      const { uploadedDocuments } = get();

      set({
        uploadedDocuments: [...uploadedDocuments, document],
      });

      // Refresh statuses
      get().refreshDocumentStatuses();
      // Refresh notifications to include the newly uploaded document
      get().refreshNotifications();
    },

    updateDocument: (
      documentId: string,
      updates: Partial<UploadedDocument>,
    ) => {
      const { uploadedDocuments } = get();

      const updatedDocs = uploadedDocuments.map((doc) =>
        doc.id === documentId ? { ...doc, ...updates } : doc,
      );

      set({ uploadedDocuments: updatedDocs });

      // Refresh statuses
      get().refreshDocumentStatuses();
      // Refresh notifications
      get().refreshNotifications();
    },

    deleteDocument: (documentId: string) => {
      const { uploadedDocuments } = get();

      set({
        uploadedDocuments: uploadedDocuments.filter(
          (doc) => doc.id !== documentId,
        ),
      });
    },

    refreshDocumentStatuses: () => {
      const { uploadedDocuments } = get();
      const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));

      const updatedDocs = updateDocumentStatuses(uploadedDocuments, defsMap);

      set({ uploadedDocuments: updatedDocs });
    },

    reloadDocuments: async () => {
      try {
        // Fetch documents from API
        const response = await fetch("/api/documents/list");
        const data = await response.json();
        const documents = (data.documents || []).map(
          (doc: Record<string, unknown>) => ({
            ...doc,
            uploadedAt: new Date(doc.uploadedAt as string),
            expirationDate: doc.expirationDate
              ? new Date(doc.expirationDate as string)
              : undefined,
          }),
        );

        const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));
        const updatedDocs = updateDocumentStatuses(documents, defsMap);
        set({ uploadedDocuments: updatedDocs });
      } catch (error) {
        console.error("Failed to reload documents:", error);
      }
    },

    setSelectedDocument: (documentDefId: string | null) => {
      set({ selectedDocumentDefId: documentDefId });
    },

    openWizard: (documentDefId: string) => {
      set({
        selectedDocumentDefId: documentDefId,
        wizardOpen: true,
      });
    },

    closeWizard: () => {
      set({
        wizardOpen: false,
      });
    },

    openUploadModal: (documentDefId: string) => {
      set({
        selectedDocumentDefId: documentDefId,
        uploadModalOpen: true,
      });
    },

    closeUploadModal: () => {
      set({
        uploadModalOpen: false,
      });
    },

    toggleNotificationCenter: () => {
      const { notificationCenterOpen } = get();
      set({ notificationCenterOpen: !notificationCenterOpen });
    },

    updateNotificationConfig: (updates: Partial<NotificationConfig>) => {
      const { notificationConfig, config } = get();

      if (!config) return;

      const updatedConfig: NotificationConfig = {
        userId: config.userId,
        emailEnabled: false,
        missingDocReminderDays: 7,
        expiryReminderDays: [90, 60, 30, 7],
        ...notificationConfig,
        ...updates,
      };

      set({ notificationConfig: updatedConfig });

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `notification_config_${config.userId}`,
          JSON.stringify(updatedConfig),
        );
      }

      // Refresh notifications after config update
      get().refreshNotifications();
    },

    updateNotificationPreferences: (
      updates: Partial<NotificationPreferences>,
    ) => {
      const { notificationPreferences, config } = get();

      if (!config) return;

      const updatedPrefs: NotificationPreferences = {
        enableMissingDocNotifications: true,
        enableExpiringNotifications: true,
        enableExpiredNotifications: true,
        missingDocReminderCadence: "weekly",
        expiryReminderThresholds: [90, 60, 30, 7],
        ...notificationPreferences,
        ...updates,
      };

      set({ notificationPreferences: updatedPrefs });

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `notification_preferences_${config.userId}`,
          JSON.stringify(updatedPrefs),
        );
      }

      // Refresh notifications after preferences update
      get().refreshNotifications();
    },

    snoozeAllNotifications: (hours: number) => {
      const { config } = get();
      if (!config) return;

      const snoozedUntil = new Date();
      snoozedUntil.setHours(snoozedUntil.getHours() + hours);

      get().updateNotificationConfig({ snoozedUntil });
    },

    snoozeNotification: (notificationId: string, hours: number) => {
      const { notifications } = get();
      const snoozedUntil = new Date();
      snoozedUntil.setHours(snoozedUntil.getHours() + hours);

      const updatedNotifications = notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, snoozedUntil } : notif,
      );

      set({ notifications: updatedNotifications });
    },

    markNotificationAsRead: (notificationId: string) => {
      const { notifications } = get();

      const updatedNotifications = notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      );

      set({ notifications: updatedNotifications });
    },

    markAllNotificationsAsRead: () => {
      const { notifications } = get();

      const updatedNotifications = notifications.map((notif) => ({
        ...notif,
        read: true,
      }));

      set({ notifications: updatedNotifications });
    },

    dismissNotification: (notificationId: string) => {
      const { notifications } = get();

      const updatedNotifications = notifications.filter(
        (notif) => notif.id !== notificationId,
      );

      set({ notifications: updatedNotifications });
    },

    refreshNotifications: (t?: TranslateFn) => {
      const {
        uploadedDocuments,
        requiredDocuments,
        notificationConfig,
        notificationPreferences,
      } = get();
      const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));
      const requiredDocIds = requiredDocuments.map((d) => d.id);

      const newNotifications = generateNotifications(
        uploadedDocuments,
        defsMap,
        requiredDocIds,
        notificationConfig || undefined,
        notificationPreferences || undefined,
        t,
      );

      // Filter out snoozed notifications
      const now = new Date();
      const activeNotifications = newNotifications.filter((notif) => {
        if (notif.snoozedUntil && now < notif.snoozedUntil) {
          return false;
        }
        return true;
      });

      set({ notifications: activeNotifications });
    },

    getStats: () => {
      const { uploadedDocuments, requiredDocuments } = get();

      // Only count mandatory documents for progress percentage
      const mandatoryDocs = requiredDocuments.filter((doc) => doc.required);
      const total = mandatoryDocs.length;

      const uploaded = mandatoryDocs.filter((md) =>
        uploadedDocuments.some(
          (ud) =>
            ud.documentDefId === md.id &&
            (ud.status === "UPLOADED" || ud.status === "NEEDS_ATTENTION"),
        ),
      ).length;

      const missing = mandatoryDocs.filter(
        (md) => !uploadedDocuments.some((ud) => ud.documentDefId === md.id),
      ).length;

      const expiring = uploadedDocuments.filter(
        (d) => d.status === "NEEDS_ATTENTION",
      ).length;

      const expired = uploadedDocuments.filter(
        (d) => d.status === "EXPIRED",
      ).length;

      return {
        total,
        uploaded,
        missing,
        expiring,
        expired,
        percentComplete: total > 0 ? Math.round((uploaded / total) * 100) : 0,
      };
    },

    getNotifications: () => {
      const { notifications } = get();
      return notifications;
    },

    getUnreadNotificationCount: () => {
      const { notifications } = get();
      return notifications.filter((notif) => !notif.read).length;
    },

    getPendingNotificationCount: () => {
      const { notifications, uploadedDocuments } = get();
      return notifications.filter((notif) => {
        // Pending if document is not uploaded (DOC_MISSING type)
        if (notif.type === "DOC_MISSING") {
          return true;
        }
        // Or if document exists but has no uploaded version
        if (notif.documentDefId) {
          const isUploaded = uploadedDocuments.some(
            (doc) =>
              doc.documentDefId === notif.documentDefId &&
              (doc.status === "UPLOADED" ||
                doc.status === "NEEDS_ATTENTION" ||
                doc.status === "EXPIRED"),
          );
          return !isUploaded;
        }
        return false;
      }).length;
    },

    getUploadedNotificationCount: () => {
      const { notifications, uploadedDocuments } = get();
      return notifications.filter((notif) => {
        // Uploaded if document exists and has been uploaded
        if (notif.documentDefId) {
          const isUploaded = uploadedDocuments.some(
            (doc) =>
              doc.documentDefId === notif.documentDefId &&
              (doc.status === "UPLOADED" ||
                doc.status === "NEEDS_ATTENTION" ||
                doc.status === "EXPIRED"),
          );
          return isUploaded;
        }
        return false;
      }).length;
    },

    isNotificationDocumentUploaded: (notification: NotificationMessage) => {
      const { uploadedDocuments } = get();
      if (!notification.documentDefId) return false;

      return uploadedDocuments.some(
        (doc) =>
          doc.documentDefId === notification.documentDefId &&
          (doc.status === "UPLOADED" ||
            doc.status === "NEEDS_ATTENTION" ||
            doc.status === "EXPIRED"),
      );
    },

    getNotificationStatus: (notification: NotificationMessage) => {
      const isUploaded = get().isNotificationDocumentUploaded(notification);
      return isUploaded ? "uploaded" : "pending";
    },

    toggleStepCompletion: (documentDefId: string, stepId: string) => {
      const { completedSteps } = get();
      const docSteps = completedSteps[documentDefId] || [];

      const isCompleted = docSteps.includes(stepId);
      const updatedSteps = isCompleted
        ? docSteps.filter((id) => id !== stepId)
        : [...docSteps, stepId];

      const newCompletedSteps = {
        ...completedSteps,
        [documentDefId]: updatedSteps,
      };

      set({ completedSteps: newCompletedSteps });

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "document_vault_completed_steps",
          JSON.stringify(newCompletedSteps),
        );
      }
    },

    isStepCompleted: (documentDefId: string, stepId: string) => {
      const { completedSteps } = get();
      const docSteps = completedSteps[documentDefId] || [];
      return docSteps.includes(stepId);
    },

    getCompletedSteps: (documentDefId: string) => {
      const { completedSteps } = get();
      return completedSteps[documentDefId] || [];
    },

    resetDocumentProgress: (documentDefId: string) => {
      const { completedSteps } = get();
      const newCompletedSteps = {
        ...completedSteps,
        [documentDefId]: [],
      };

      set({ completedSteps: newCompletedSteps });

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "document_vault_completed_steps",
          JSON.stringify(newCompletedSteps),
        );
      }
    },

    reset: async () => {
      set(initialState);
    },
  }),
);

// Helper function to create initial config
export function createInitialConfig(userId: string): DocumentVaultConfig {
  return {
    userId,
    visaCategory: "IR-1", // Default
    scenarioFlags: {},
  };
}
