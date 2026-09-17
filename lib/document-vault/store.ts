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
  VaultCandidate,
} from "./types";
import { generateRequiredDocuments, getCategoryDisplayName } from "./personalization-engine";
import { updateDocumentStatuses, generateNotifications } from "./expiration-tracker";
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
  isReloadingDocs: boolean;
  hasLoadedDocsInitial: boolean;
  isDeletingIds: string[];
  selectedDocumentDefId: string | null;
  replaceDocumentId: string | null;
  wizardOpen: boolean;
  uploadModalOpen: boolean;
  notificationCenterOpen: boolean;
  currentJourneyId: string | null;

  // Multi-candidate (IR-5+): the active candidate sub-scope and the journey's roster.
  currentCandidateId: string | null;
  candidates: VaultCandidate[];

  // Actions
  initialize: (
    userId: string,
    t?: TranslateFn,
    journeyId?: string,
    candidateId?: string
  ) => Promise<void>;
  setConfig: (config: DocumentVaultConfig) => Promise<void>;
  updateScenarioFlags: (flags: Partial<ScenarioFlags>) => void;
  setVisaCategory: (category: VisaCategory) => void;

  // Document operations
  addDocument: (document: UploadedDocument) => void;
  updateDocument: (documentId: string, updates: Partial<UploadedDocument>) => void;
  deleteDocument: (documentId: string, scope?: "candidate" | "all") => void;
  refreshDocumentStatuses: () => void;
  reloadDocuments: (journeyId?: string, candidateId?: string) => Promise<void>;
  setCandidate: (candidateId: string | null) => Promise<void>;
  addDynamicSlot: (category: string) => void;
  addNamedDynamicSlot: (category: string, name: string) => Promise<string>;
  renameDynamicSlot: (categoryId: string, slotId: string, newName: string) => void;
  deleteDynamicSlot: (category: string, slotId: string) => Promise<void>;

  // UI actions
  setSelectedDocument: (documentDefId: string | null) => void;
  openWizard: (documentDefId: string) => void;
  closeWizard: () => void;
  openUploadModal: (documentDefId: string, replaceDocumentId?: string) => void;
  closeUploadModal: () => void;
  toggleNotificationCenter: () => void;

  // Notification settings
  updateNotificationConfig: (config: Partial<NotificationConfig>) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;

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
  getNotificationStatus: (notification: NotificationMessage) => "pending" | "uploaded";

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
  isReloadingDocs: false,
  hasLoadedDocsInitial: false,
  isDeletingIds: [],
  selectedDocumentDefId: null,
  replaceDocumentId: null,
  wizardOpen: false,
  uploadModalOpen: false,
  notificationCenterOpen: false,
  currentJourneyId: null,
  currentCandidateId: null,
  candidates: [],
};

export const useDocumentVaultStore = create<DocumentVaultStore>()((set, get) => ({
  ...initialState,

  initialize: async (userId: string, t?: TranslateFn, journeyId?: string, candidateId?: string) => {
    set({
      isLoading: true,
      currentJourneyId: journeyId || null,
      currentCandidateId: candidateId || null,
    });

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
        const notifConfigStored = localStorage.getItem(`notification_config_${userId}`);
        if (notifConfigStored) {
          try {
            notificationConfig = JSON.parse(notifConfigStored);
          } catch (e) {
            console.error("Failed to parse notification config:", e);
          }
        }

        // Load notification preferences
        const notifPrefsStored = localStorage.getItem(`notification_preferences_${userId}`);
        if (notifPrefsStored) {
          try {
            notificationPreferences = JSON.parse(notifPrefsStored);
          } catch (e) {
            console.error("Failed to parse notification preferences:", e);
          }
        }
      }

      // Fetch config from API (filtered by journey if provided)
      const configResponse = await fetch(journeyId ? `/api/documents/config?journeyId=${journeyId}` : "/api/documents/config");
      const configData = await configResponse.json();
      const config = configData.config;

      // Fetch documents from API (filtered by journey + candidate if provided)
      const listUrl = journeyId
        ? `/api/documents/list?journeyId=${journeyId}${candidateId ? `&candidateId=${candidateId}` : ""}`
        : "/api/documents/list";
      const docsResponse = await fetch(listUrl);
      const docsData = await docsResponse.json();
      const documents = docsData.documents || [];

      if (config) {
        const requiredDocs = generateRequiredDocuments(config, true, documents); // Include optional documents

        // Create document definitions map
        const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));

        // Update document statuses
        const updatedDocs = updateDocumentStatuses(documents, defsMap);

        set({
          config,
          uploadedDocuments: updatedDocs,
          requiredDocuments: requiredDocs,
          candidates: config.candidates || [],
          completedSteps,
          notificationConfig,
          notificationPreferences,
          isLoading: false,
        });

        // Generate initial notifications
        get().refreshNotifications(t);
      } else {
        // No config yet — but still store any documents that already exist
        const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));
        const updatedDocs = updateDocumentStatuses(documents, defsMap);
        set({
          uploadedDocuments: updatedDocs,
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
    // Automatic Consolidation: Merge any duplicate slots with the same name/category
    if (config.dynamicDocuments) {
      const cleanedDynamicDocs: Record<string, any[]> = {};

      Object.entries(config.dynamicDocuments).forEach(([category, slots]) => {
        const seenNames = new Map<string, string>(); // name -> id
        const uniqueSlots: any[] = [];

        slots.forEach((slot) => {
          const normalized = slot.name.trim().toLowerCase();
          if (seenNames.has(normalized)) {
            // Duplicate found! Skip adding the duplicate slot
            return;
          }
          seenNames.set(normalized, slot.id);
          uniqueSlots.push(slot);
        });

        cleanedDynamicDocs[category] = uniqueSlots;
      });

      config.dynamicDocuments = cleanedDynamicDocs;
    }

    const { uploadedDocuments } = get();
    const journeyId = config.journeyId !== undefined ? config.journeyId : get().currentJourneyId;
    const configWithJourney = {
      ...config,
      journeyId,
    };

    const uploadedDocIds = uploadedDocuments.map((d) => d.documentDefId);
    const requiredDocs = generateRequiredDocuments(configWithJourney, true, uploadedDocuments); // Include optional documents

    // Set config in store IMMEDIATELY — don't wait for DB. Keep the separate `candidates`
    // state in sync so the candidate switcher reflects roster changes without a reload.
    set({
      config: configWithJourney,
      requiredDocuments: requiredDocs,
      candidates: configWithJourney.candidates || [],
    });

    try {
      // Try to persist to DB (best effort — store is already updated above)
      await fetch("/api/documents/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configWithJourney),
      });
    } catch (error) {
      console.error("Failed to persist config to DB (config still active for session):", error);
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

  updateDocument: (documentId: string, updates: Partial<UploadedDocument>) => {
    const { uploadedDocuments } = get();

    const updatedDocs = uploadedDocuments.map((doc) =>
      doc.id === documentId ? { ...doc, ...updates } : doc
    );

    set({ uploadedDocuments: updatedDocs });

    // Refresh statuses
    get().refreshDocumentStatuses();
    // Refresh notifications
    get().refreshNotifications();
  },

  deleteDocument: async (documentId: string, scope: "candidate" | "all" = "candidate") => {
    set({ isDeletingIds: [...get().isDeletingIds, documentId] });
    try {
      const response = await fetch(`/api/documents/${documentId}?scope=${scope}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document from server");
      }

      const { uploadedDocuments, isDeletingIds } = get();
      set({
        uploadedDocuments: uploadedDocuments.filter((doc) => doc.id !== documentId),
        isDeletingIds: isDeletingIds.filter((id) => id !== documentId),
      });

      // Refresh statuses and notifications
      get().refreshDocumentStatuses();
      get().refreshNotifications();
    } catch (error) {
      console.error("Failed to delete document:", error);
      set({
        isDeletingIds: get().isDeletingIds.filter((id) => id !== documentId),
      });
      throw error; // Re-throw so UI can handle it (e.g. toast)
    }
  },

  refreshDocumentStatuses: () => {
    const { uploadedDocuments } = get();
    const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));

    const updatedDocs = updateDocumentStatuses(uploadedDocuments, defsMap);

    set({ uploadedDocuments: updatedDocs });
  },

  reloadDocuments: async (journeyId?: string, candidateId?: string) => {
    const { hasLoadedDocsInitial, currentJourneyId, currentCandidateId } = get();
    const targetJourneyId = journeyId || currentJourneyId || undefined;
    const targetCandidateId =
      candidateId !== undefined ? candidateId : currentCandidateId || undefined;
    const isNewJourney = journeyId && journeyId !== currentJourneyId;
    const isNewCandidate = candidateId !== undefined && candidateId !== currentCandidateId;
    if (!hasLoadedDocsInitial || isNewJourney || isNewCandidate) {
      set({
        isReloadingDocs: true,
        currentJourneyId: targetJourneyId || null,
        currentCandidateId: targetCandidateId || null,
      });
    }
    try {
      // 1. Fetch config from API for this journey
      const configUrl = targetJourneyId ? `/api/documents/config?journeyId=${targetJourneyId}` : "/api/documents/config";
      const configResponse = await fetch(configUrl);
      const configData = await configResponse.json();
      const config = configData.config;

      // 2. Fetch documents from API (filtered by journey + candidate if provided)
      const url = targetJourneyId
        ? `/api/documents/list?journeyId=${targetJourneyId}${targetCandidateId ? `&candidateId=${targetCandidateId}` : ""}`
        : "/api/documents/list";
      const response = await fetch(url);
      const data = await response.json();
      const documents = (data.documents || []).map((doc: Record<string, unknown>) => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt as string),
        expirationDate: doc.expirationDate ? new Date(doc.expirationDate as string) : undefined,
      }));

      const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));
      const updatedDocs = updateDocumentStatuses(documents, defsMap);

      // 3. Regenerate requiredDocuments if config is available
      if (config) {
        const requiredDocs = generateRequiredDocuments(config, true, updatedDocs);
        set({
          config,
          uploadedDocuments: updatedDocs,
          requiredDocuments: requiredDocs,
          candidates: config.candidates || [],
          isReloadingDocs: false,
          hasLoadedDocsInitial: true,
        });
      } else {
        set({
          config: null,
          uploadedDocuments: updatedDocs,
          requiredDocuments: [],
          isReloadingDocs: false,
          hasLoadedDocsInitial: true,
        });
      }
    } catch (error) {
      console.error("Failed to reload documents:", error);
      set({ isReloadingDocs: false });
    }
  },

  setCandidate: async (candidateId: string | null) => {
    const { currentJourneyId, currentCandidateId } = get();
    if (candidateId === currentCandidateId) return;
    // reloadDocuments handles state + fetch for the newly active candidate.
    await get().reloadDocuments(currentJourneyId || undefined, candidateId ?? undefined);
  },

  addDynamicSlot: (category: string) => {
    const { config } = get();
    if (!config) return;

    const dynamicDocs = config.dynamicDocuments || {};
    const slots = dynamicDocs[category] || [];
    const updatedSlots = [...slots];

    // Get consistent naming from personalization-engine
    const displayName = getCategoryDisplayName(category);
    const baseName = displayName.replace(/ (Documents|Evidence)$/, "");

    if (updatedSlots.length === 0) {
      // Materialize the first slot (ID matching the engine's default)
      updatedSlots.push({
        id: `dynamic-${category}-1`,
        name: `${baseName} Document (1)`,
      });

      // Only add the second one if the category normally shows a default virtual slot.
      // For CIVIL, MISC, TRANSLATIONS, and OTHER, no default virtual slot is shown,
      // so adding just the first slot is enough to show a single card.
      if (!["CIVIL", "MISC", "TRANSLATIONS", "OTHER"].includes(category)) {
        updatedSlots.push({
          id: `dynamic-${category}-${Date.now()}-2`,
          name: `${baseName} Document (2)`,
        });
      }
    } else {
      // Standard addition
      const newIndex = updatedSlots.length + 1;
      updatedSlots.push({
        id: `dynamic-${category}-${Date.now()}`,
        name: `${baseName} Document (${newIndex})`,
      });
    }

    const updatedDynamicDocs = {
      ...dynamicDocs,
      [category]: updatedSlots,
    };

    const updatedConfig = {
      ...config,
      dynamicDocuments: updatedDynamicDocs,
    };

    get().setConfig(updatedConfig);
  },

  addNamedDynamicSlot: async (category: string, name: string) => {
    const { config } = get();
    if (!config) return "";

    const dynamicDocs = config.dynamicDocuments || {};
    const slots = dynamicDocs[category] || [];

    const normalizedName = name.trim().toLowerCase();

    // Check if a slot with this name already exists to avoid duplicates
    const existingSlot = slots.find((s) => s.name.trim().toLowerCase() === normalizedName);
    if (existingSlot) return existingSlot.id;

    const newId = `dynamic-${category}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const updatedSlots = [...slots, { id: newId, name }];

    const updatedDynamicDocs = {
      ...dynamicDocs,
      [category]: updatedSlots,
    };

    const updatedConfig = {
      ...config,
      dynamicDocuments: updatedDynamicDocs,
    };

    await get().setConfig(updatedConfig);
    return newId;
  },

  renameDynamicSlot: (category: string, slotId: string, newName: string) => {
    const { config } = get();
    if (!config) return;

    const dynamicDocs = config.dynamicDocuments || {};
    const slots = dynamicDocs[category] || [];

    const updatedSlots = slots.map((slot) =>
      slot.id === slotId ? { ...slot, name: newName } : slot
    );

    const updatedDynamicDocs = {
      ...dynamicDocs,
      [category]: updatedSlots,
    };

    const updatedConfig = {
      ...config,
      dynamicDocuments: updatedDynamicDocs,
    };

    get().setConfig(updatedConfig);
  },

  deleteDynamicSlot: async (category: string, slotId: string) => {
    const { config, uploadedDocuments } = get();
    if (!config) return;

    // 1. Delete all uploaded files associated with this slot ID from the server
    const docsToDelete = uploadedDocuments.filter((d) => d.documentDefId === slotId);
    for (const doc of docsToDelete) {
      try {
        await fetch(`/api/documents/${doc.id}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error(`Failed to delete dynamic file ${doc.id}:`, error);
      }
    }

    // 2. Remove the slot from dynamicDocuments config
    const dynamicDocs = config.dynamicDocuments || {};
    const slots = dynamicDocs[category] || [];
    const updatedSlots = slots.filter((slot) => slot.id !== slotId);

    const updatedDynamicDocs = {
      ...dynamicDocs,
      [category]: updatedSlots,
    };

    const updatedConfig = {
      ...config,
      dynamicDocuments: updatedDynamicDocs,
    };

    // 3. Update the config and set the store state
    await get().setConfig(updatedConfig);

    // 4. Update the uploaded documents state locally
    set({
      uploadedDocuments: get().uploadedDocuments.filter((d) => d.documentDefId !== slotId),
    });

    // 5. Refresh statuses and notifications
    get().refreshDocumentStatuses();
    get().refreshNotifications();
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

  openUploadModal: (documentDefId: string, replaceDocumentId?: string) => {
    set({
      selectedDocumentDefId: documentDefId,
      replaceDocumentId: replaceDocumentId || null,
      uploadModalOpen: true,
    });
  },

  closeUploadModal: () => {
    set({
      uploadModalOpen: false,
      replaceDocumentId: null,
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
      localStorage.setItem(`notification_config_${config.userId}`, JSON.stringify(updatedConfig));
    }

    // Refresh notifications after config update
    get().refreshNotifications();
  },

  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => {
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
        JSON.stringify(updatedPrefs)
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
      notif.id === notificationId ? { ...notif, snoozedUntil } : notif
    );

    set({ notifications: updatedNotifications });
  },

  markNotificationAsRead: (notificationId: string) => {
    const { notifications } = get();

    const updatedNotifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
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

    const updatedNotifications = notifications.filter((notif) => notif.id !== notificationId);

    set({ notifications: updatedNotifications });
  },

  refreshNotifications: (t?: TranslateFn) => {
    const { uploadedDocuments, requiredDocuments, notificationConfig, notificationPreferences } =
      get();
    const defsMap = new Map(ALL_DOCUMENTS.map((d) => [d.id, d]));
    const requiredDocIds = requiredDocuments.map((d) => d.id);

    const newNotifications = generateNotifications(
      uploadedDocuments,
      defsMap,
      requiredDocIds,
      notificationConfig || undefined,
      notificationPreferences || undefined,
      t
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
          (ud.status === "UPLOADED" || ud.status === "NEEDS_ATTENTION")
      )
    ).length;

    const missing = mandatoryDocs.filter(
      (md) => !uploadedDocuments.some((ud) => ud.documentDefId === md.id)
    ).length;

    const expiring = uploadedDocuments.filter((d) => d.status === "NEEDS_ATTENTION").length;

    const expired = uploadedDocuments.filter((d) => d.status === "EXPIRED").length;

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
              doc.status === "EXPIRED")
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
              doc.status === "EXPIRED")
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
        (doc.status === "UPLOADED" || doc.status === "NEEDS_ATTENTION" || doc.status === "EXPIRED")
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
      localStorage.setItem("document_vault_completed_steps", JSON.stringify(newCompletedSteps));
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
      localStorage.setItem("document_vault_completed_steps", JSON.stringify(newCompletedSteps));
    }
  },

  reset: async () => {
    set(initialState);
  },
}));

// Helper function to create initial config
export function createInitialConfig(userId: string): DocumentVaultConfig {
  return {
    userId,
    visaCategory: "IR-1", // Default
    scenarioFlags: {},
  };
}
