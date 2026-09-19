"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { DocumentDefinition, DocumentRole } from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  Eye,
  ChevronDown,
  // ChevronUp,
  History,
  Lock,
  ScanLine,
} from "lucide-react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { UploadedDocument } from "@/lib/document-vault/types";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import {
  mapDocumentNameToId,
  getFriendlyJourneyName,
  isDocumentApplicableToJourney,
  getCachedUserJourneys,
  setCachedUserJourneys,
  fetchUserJourneysCached,
  isSameJourneyType,
} from "@/lib/document-vault/journey-mapping";
import { isDocumentShareableAcrossCandidates } from "@/lib/document-vault/candidate-sharing";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { msg, E, errorCode } from "@/lib/errors";
import { getOcrConfig, type OcrTarget } from "@/lib/document-ocr/registry";
import { resizeImageIfNeeded } from "@/lib/document-ocr/clientImage";
import { crossCheckFields } from "@/lib/document-ocr/crossCheck";
import type { PassportFields } from "@/lib/document-ocr/passportParser";
import { useUserProfile } from "@/app/context/UserProfileContext";
import type { MasterProfile } from "@/types/profile";

/** Read a dot-path value off the in-memory profile, as a trimmed string ("" if absent). */
function readProfilePath(obj: unknown, path: string): string {
  let cur: unknown = obj;
  for (const k of path.split(".")) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[k];
    else return "";
  }
  return cur == null ? "" : String(cur).trim();
}
interface PendingUpload {
  id: string;
  file: File | null;
  type: string;
  notes: string;
  customName?: string;
}

interface MultipleDocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string; // e.g. doc_citizenship
  documentName: string; // e.g. Proof of U.S. Citizenship
  options: string[]; // e.g. ["U.S. passport", "U.S. birth certificate", ...]
  onUploadComplete: () => void;
  userJourneys?: any[];
  activeJourneyId?: string | null;
}

const OTHER_OPTION = "Other";

export function MultipleDocumentUploadModal({
  open,
  onClose,
  categoryId,
  documentName,
  options,
  onUploadComplete,
  userJourneys: userJourneysProp = [],
  activeJourneyId: activeJourneyIdProp = null,
}: MultipleDocumentUploadModalProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const {
    config,
    uploadedDocuments: vaultDocuments,
    deleteDocument,
    isDeletingIds,
    addNamedDynamicSlot,
    currentJourneyId,
  } = useDocumentVaultStore();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { profile, refreshProfile, updateProfile } = useUserProfile();

  const [userJourneys, setUserJourneys] = useState<any[]>(() => {
    if (userJourneysProp && userJourneysProp.length > 0) return userJourneysProp;
    return getCachedUserJourneys() || [];
  });
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(
    activeJourneyIdProp || currentJourneyId || null
  );
  const [sharedJourneyIds, setSharedJourneyIds] = useState<string[]>([]);

  const otherJourneys = useMemo(() => {
    return userJourneys.filter((j) => {
      if (j.id === activeJourneyId) return false;
      if (isSameJourneyType(j.journey_type, activeJourneyId)) return false;
      return true;
    });
  }, [userJourneys, activeJourneyId]);

  const [manuallyUncheckedIds, setManuallyUncheckedIds] = useState<string[]>([]);

  const visibleOtherJourneys = useMemo(() => {
    const activeJourney = userJourneys.find((x) => x.id === activeJourneyId);
    const activeBase = activeJourney ? getBaseVisaCategory(activeJourney.journey_type) : null;

    // Applicable to share to journey j, honoring the sibling-candidate rule: between two
    // candidates in the same case (same base visa category, e.g. two parents) only shareable
    // documents are offered; parent-specific docs (passport, CNIC, birth, medical...) are not.
    const shareApplicable = (j: any, defId: string, typeName: string) => {
      if (!isDocumentApplicableToJourney(defId, typeName, j.journey_type)) return false;
      const isSibling = !!activeBase && getBaseVisaCategory(j.journey_type) === activeBase;
      if (isSibling) {
        const def = ALL_DOCUMENTS.find((d) => d.id === defId);
        if (!def || !isDocumentShareableAcrossCandidates(def)) return false;
      }
      return true;
    };

    return otherJourneys.filter((j) => {
      return (
        pendingUploads.some((p) => {
          if (!p.type) {
            return shareApplicable(j, categoryId, documentName);
          }
          const targetId =
            p.type === OTHER_OPTION && p.customName ? "dynamic-OTHER" : mapDocumentNameToId(p.type);
          return shareApplicable(j, targetId, p.type);
        }) || shareApplicable(j, categoryId, documentName)
      );
    });
  }, [otherJourneys, pendingUploads, categoryId, documentName, userJourneys, activeJourneyId]);

  useEffect(() => {
    if (!open) return;

    const resolvedActiveId = activeJourneyIdProp || currentJourneyId;
    if (resolvedActiveId) {
      setActiveJourneyId(resolvedActiveId);
    }

    if (userJourneysProp && userJourneysProp.length > 0) {
      setUserJourneys(userJourneysProp);
      setCachedUserJourneys(userJourneysProp);
      if (!resolvedActiveId && userJourneysProp.length > 0) {
        setActiveJourneyId(userJourneysProp[0].id);
      }
      return;
    }

    // Check in-memory synchronous cache first
    const cached = getCachedUserJourneys();
    if (cached && cached.length > 0) {
      setUserJourneys(cached);
      if (!resolvedActiveId) {
        const saved = typeof window !== "undefined" ? sessionStorage.getItem("doc_vault_active_journey") : null;
        if (saved && cached.some((j) => j.id === saved)) {
          setActiveJourneyId(saved);
        } else {
          const active = cached.find((j) => j.status === "in_progress") || cached[0];
          setActiveJourneyId(active.id);
        }
      }
    }

    // Fetch / revalidate cached journeys
    fetchUserJourneysCached()
      .then((journeys) => {
        if (journeys && journeys.length > 0) {
          setUserJourneys(journeys);
          if (!resolvedActiveId) {
            const saved = typeof window !== "undefined" ? sessionStorage.getItem("doc_vault_active_journey") : null;
            if (saved && journeys.some((j) => j.id === saved)) {
              setActiveJourneyId(saved);
            } else {
              const active = journeys.find((j) => j.status === "in_progress") || journeys[0];
              setActiveJourneyId(active.id);
            }
          }
        }
      })
      .catch((err) => {
        console.error("MultipleDocumentUploadModal failed to fetch journeys:", err);
      });
  }, [open, userJourneysProp, activeJourneyIdProp, currentJourneyId]);

  const visibleOtherJourneysKey = useMemo(
    () => visibleOtherJourneys.map((j) => j.id).join(","),
    [visibleOtherJourneys]
  );

  useEffect(() => {
    if (!open) {
      setManuallyUncheckedIds([]);
      return;
    }
    // Opt-in by design: never auto-select a target. Keep only the targets the user has
    // explicitly ticked that are still visible.
    setSharedJourneyIds((prev) => {
      const visibleIds = visibleOtherJourneys.map((j) => j.id);
      return prev.filter((id) => visibleIds.includes(id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visibleOtherJourneysKey]);

  // ── Inline OCR auto-fill (passport) ──
  // When one of the uploaded items is a passport (e.g. the petitioner picks
  // "U.S. passport" under "Proof of U.S. Citizenship"), we read that same file
  // and offer to auto-fill the profile. Target ("self" / "beneficiary") comes
  // from the selected type's OCR config — nothing is saved until the user confirms.
  const [ocrPhase, setOcrPhase] = useState<"idle" | "reading" | "confirm">("idle");
  // Hold the just-read file so the confirm screen can offer a "Re-read" retry
  // (e.g. when the extracted values look wrong) without re-uploading.
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrFields, setOcrFields] = useState<PassportFields>({});
  const [ocrConfidence, setOcrConfidence] = useState<
    Partial<Record<keyof PassportFields, number>>
  >({});
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [ocrSaving, setOcrSaving] = useState(false);
  const [ocrTarget, setOcrTarget] = useState<OcrTarget>("self");

  // Both petitioner (self) and beneficiary passports carry the same biographic
  // fields, and the profile now stores them for either person — so capture all of
  // them regardless of target.
  const OCR_FIELD_ORDER: { key: keyof PassportFields; label: string }[] = [
    { key: "name.first", label: "Given name" },
    { key: "name.last", label: "Surname" },
    { key: "dateOfBirth", label: "Date of birth" },
    { key: "sex", label: "Sex" },
    { key: "nationality", label: "Nationality" },
    { key: "passportNumber", label: "Passport number" },
    { key: "passportExpiry", label: "Passport expiry" },
    { key: "passportCountry", label: "Issuing country" },
  ];

  // Did OCR actually read anything? Drives whether the panel says "Confirm what we
  // read" (auto-filled) or "Add your details" (blank → user types). A person's DOB
  // is the same on every document, so even a doc we can't auto-read still lets the
  // user capture it manually here and push it to the profile / journey steps.
  const ocrAnyDetected = OCR_FIELD_ORDER.some(
    ({ key }) => (ocrFields[key] ?? "").toString().trim() !== ""
  );

  // ── Mismatch detection ──
  // Compare what we read against the values already on the profile so the user can
  // reconcile conflicts (e.g. passport DOB ≠ saved DOB) before overwriting. Beneficiary
  // passports store under beneficiary.* ; self under the top-level keys. Re-runs live
  // as the user edits, so the banner clears the moment a value is reconciled.
  const crossCheck = useMemo(() => {
    if (ocrPhase !== "confirm" || !profile) return null;
    const stored: Record<string, string> = {};
    for (const { key } of OCR_FIELD_ORDER) {
      const path = ocrTarget === "beneficiary" ? `beneficiary.${key}` : key;
      const v = readProfilePath(profile, path);
      if (v) stored[key] = v;
    }
    return crossCheckFields(
      ocrFields as Record<string, string | undefined>,
      stored,
      OCR_FIELD_ORDER
    );
    // OCR_FIELD_ORDER is a stable literal; ocrFields/profile/target drive recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrPhase, profile, ocrFields, ocrTarget]);

  const mismatchKeys = useMemo(
    () => new Set((crossCheck?.mismatches ?? []).map((m) => m.key)),
    [crossCheck]
  );

  // Reset OCR panel and leave a fresh blank upload row so the user can continue.
  const dismissOcr = () => {
    setOcrPhase("idle");
    setOcrFile(null);
    setOcrFields({});
    setOcrConfidence({});
    setOcrWarnings([]);
    setPendingUploads([]);
    addPendingUpload();
  };

  const runOcr = async (file: File, target: OcrTarget) => {
    setOcrTarget(target);
    setOcrFile(file);
    setOcrPhase("reading");
    try {
      const prepared = await resizeImageIfNeeded(file);
      const formData = new FormData();
      formData.append("file", prepared, prepared.name);
      const res = await fetch("/api/documents/extract-passport", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        showToast("Uploaded. We couldn't auto-read this document, you can fill details manually.", "info");
        dismissOcr();
        return;
      }
      setOcrFields(json.fields || {});
      setOcrConfidence(json.confidence || {});
      setOcrWarnings(json.warnings || []);
      setOcrPhase("confirm");
    } catch {
      showToast("Uploaded. We couldn't auto-read this document, you can fill details manually.", "info");
      dismissOcr();
    }
  };

  const updateOcrField = (key: keyof PassportFields, value: string) => {
    setOcrFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveOcr = async () => {
    setOcrSaving(true);
    try {
      const res = await fetch("/api/profile/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: ocrFields, target: ocrTarget }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        showToast(json?.error || "Could not save details to your profile.", "error");
        return;
      }

      // The merge already persisted the values server-side (with the right
      // encryption + deep-merge). Now reflect them in the in-memory profile so
      // dependent steps (e.g. the Ch.1 Step 4 baseline) update immediately. When a
      // profile is already loaded we optimistically deep-merge — safe, the rest of
      // the object stays intact — so it works even if a refetch would fail under
      // server load. If nothing is loaded yet, fall back to a refetch.
      if (profile) {
        const name: Record<string, string> = {};
        if (ocrFields["name.first"]) name.first = ocrFields["name.first"]!;
        if (ocrFields["name.last"]) name.last = ocrFields["name.last"]!;
        const partial: Record<string, unknown> = {};
        if (ocrTarget === "beneficiary") {
          const ben: Record<string, unknown> = {};
          if (Object.keys(name).length) ben.name = name;
          if (ocrFields.dateOfBirth) ben.dateOfBirth = ocrFields.dateOfBirth;
          if (ocrFields.sex) ben.sex = ocrFields.sex;
          if (ocrFields.nationality) ben.nationality = ocrFields.nationality;
          if (ocrFields.passportNumber) ben.passportNumber = ocrFields.passportNumber;
          if (ocrFields.passportExpiry) ben.passportExpiry = ocrFields.passportExpiry;
          if (ocrFields.passportCountry) ben.passportCountry = ocrFields.passportCountry;
          partial.beneficiary = ben;
        } else {
          if (Object.keys(name).length) partial.name = name;
          if (ocrFields.dateOfBirth) partial.dateOfBirth = ocrFields.dateOfBirth;
          if (ocrFields.sex) partial.sex = ocrFields.sex;
          if (ocrFields.nationality) partial.nationality = ocrFields.nationality;
          if (ocrFields.passportNumber) partial.passportNumber = ocrFields.passportNumber;
          if (ocrFields.passportExpiry) partial.passportExpiry = ocrFields.passportExpiry;
          if (ocrFields.passportCountry) partial.passportCountry = ocrFields.passportCountry;
        }
        updateProfile(partial as Partial<MasterProfile>, { silent: true });
      } else {
        await refreshProfile();
      }

      showToast("Details saved to your profile.", "success");
      dismissOcr();
    } catch {
      showToast("Something went wrong while saving.", "error");
    } finally {
      setOcrSaving(false);
    }
  };

  // Find the base document definition
  const documentDef = useMemo<DocumentDefinition>(() => {
    return (
      ALL_DOCUMENTS.find((d) => d.id === categoryId) || {
        id: categoryId,
        key: categoryId.toUpperCase().replace(/[^A-Z]/g, "_"),
        name: documentName,
        description: "",
        category: categoryId as DocumentDefinition["category"],
        roles: ["BENEFICIARY"] as DocumentRole[],
        stages: [],
        required: false,
        multipleFilesAllowed: true,
        validityType: "none",
      }
    );
  }, [categoryId]);

  // Derive already uploaded documents and their types for this category
  const uploadedDocuments = useMemo(() => {
    const allowedIds = [categoryId, ...options.map((opt) => mapDocumentNameToId(opt))];

    const filtered = vaultDocuments.filter((d) => {
      // Direct ID match
      if (allowedIds.includes(d.documentDefId)) return true;

      return false;
    });

    // Deduplicate by storagePath
    const seen = new Set<string>();
    return filtered.filter((d) => {
      const key = d.storagePath || d.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [vaultDocuments, categoryId, options]);

  const uploadedTypes = useMemo(() => {
    return uploadedDocuments
      .map((d) => {
        if (d.notes && d.notes.startsWith("Type: ")) {
          const typeMatch = d.notes.split("\n")[0].replace("Type: ", "").trim();
          return typeMatch;
        }
        return "";
      })
      .filter(Boolean);
  }, [uploadedDocuments]);

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, UploadedDocument[]> = {};

    uploadedDocuments.forEach((doc) => {
      // Calculate the same type label as used in the UI
      let typeLabel = doc.notes?.startsWith("Type: ")
        ? doc.notes.split("\n")[0].replace("Type: ", "").trim()
        : "Document";

      // Fallback for dynamic documents without explicit type in notes
      if (
        (typeLabel === OTHER_OPTION || !typeLabel || typeLabel === "Document") &&
        doc.documentDefId?.startsWith("dynamic-")
      ) {
        const category = doc.documentDefId.split("-")[1];
        const dynamicDoc = config?.dynamicDocuments?.[category]?.find(
          (d) => d.id === doc.documentDefId
        );
        if (dynamicDoc) {
          typeLabel = dynamicDoc.name;
        }
      }

      if (!groups[typeLabel]) {
        groups[typeLabel] = [];
      }
      groups[typeLabel].push(doc);
    });

    // Apply Virtual Versioning to each group
    Object.keys(groups).forEach((typeLabel) => {
      const rawDocs = groups[typeLabel].sort(
        (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );

      const hasDuplicateVersions = rawDocs.some((v, i) =>
        rawDocs.some((v2, i2) => i !== i2 && v.version === v2.version)
      );

      groups[typeLabel] = rawDocs.map((v, idx) => ({
        ...v,
        displayVersion: hasDuplicateVersions ? idx + 1 : v.version,
      })) as any;

      // Sort by displayVersion descending for the UI
      groups[typeLabel].sort((a: any, b: any) => (b.displayVersion || 0) - (a.displayVersion || 0));
    });

    return groups as Record<string, (UploadedDocument & { displayVersion: number })[]>;
  }, [uploadedDocuments, config]);

  const toggleGroup = (typeLabel: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [typeLabel]: !prev[typeLabel],
    }));
  };

  // Make sure there is always at least one empty slot if there are available options
  useEffect(() => {
    if (open) {
      setPendingUploads((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: Math.random().toString(),
              type: "",
              notes: "",
              file: null,
              customName: "",
            },
          ];
        }
        return prev;
      });
    } else {
      setPendingUploads([]);
    }
  }, [open]);

  const addPendingUpload = () => {
    setPendingUploads((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        type: "",
        notes: "",
        file: null,
        customName: "",
      },
    ]);
  };

  const removePendingUpload = (id: string) => {
    setPendingUploads((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePendingUpload = (id: string, updates: Partial<PendingUpload>) => {
    setPendingUploads((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const processFile = (id: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: 10 }), "error");
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      showToast(msg(E.TOOL_FILE_TYPE_UNSUPPORTED), "error");
      return;
    }
    updatePendingUpload(id, { file });
  };

  const handleFileSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(id, file);
    }
  };

  const handleDragOver = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setDragActiveId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(null);
  };

  const handleDrop = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(null);

    if (uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(id, file);
    }
  };

  const getAvailableOptions = (currentSlotId: string) => {
    const usedPendingTypes = pendingUploads
      .filter((p) => p.id !== currentSlotId && p.type && p.type !== OTHER_OPTION)
      .map((p) => p.type);

    // Per user request: don't filter out uploaded types, just filter out types used in other rows
    return options.filter((opt) => !usedPendingTypes.includes(opt));
  };

  const handleUploadAll = async () => {
    const validUploads = pendingUploads.filter((p) => p.file && p.type);
    if (validUploads.length === 0) return;
    if (!config) {
      showToast(`${msg(E.VAULT_NOT_CONFIGURED)}`, "error");
      return;
    }

    setUploading(true);
    showToast(`Uploading ${validUploads.length} document(s)...`, "loading", {
      id: "multi-upload-progress",
    });

    try {
      // Step 1: Map all uploads to the main category document ID
      // This ensures they stay grouped inside this category's file list and do not leak as separate slots
      const uploadItemToDefId: Record<string, string> = {};
      for (const uploadItem of validUploads) {
        uploadItemToDefId[uploadItem.id] = categoryId;
      }

      // Need a role, if we can deduce from definition or default to BENEFICIARY
      const parentRole = documentDef.roles?.[0] || "BENEFICIARY";
      let personName = "Unknown";
      if (parentRole === "PETITIONER" && config.petitionerName) {
        personName = config.petitionerName;
      } else if (parentRole === "BENEFICIARY" && config.beneficiaryName) {
        personName = config.beneficiaryName;
      } else if (parentRole === "JOINT_SPONSOR" && config.jointSponsorName) {
        personName = config.jointSponsorName;
      }

      // Step 2: Perform file uploads SEQUENTIALLY now that all slots exist
      // Sequential upload is necessary to prevent versioning race conditions on the server
      for (const uploadItem of validUploads) {
        const formData = new FormData();
        formData.append("file", uploadItem.file!);

        const specificDefId = uploadItemToDefId[uploadItem.id];
        formData.append("documentDefId", specificDefId);

        if (specificDefId.startsWith("dynamic-")) {
          const docCategory = specificDefId.split("-")[1];
          formData.append("dynamicName", uploadItem.customName || uploadItem.type);
          formData.append("dynamicCategory", docCategory);
        }
        formData.append("role", parentRole);
        formData.append("caseId", config.caseId || "CASE");
        formData.append("personName", personName);

        // Special storage: Save the selected document type inside the notes
        const storedType =
          uploadItem.type === OTHER_OPTION && uploadItem.customName
            ? uploadItem.customName
            : uploadItem.type;

        let notesPayload = `Type: ${storedType}`;
        if (uploadItem.notes.trim()) {
          notesPayload += `\nNotes: ${uploadItem.notes.trim()}`;
        }
        formData.append("notes", notesPayload);
        if (activeJourneyId) {
          formData.append("journeyId", activeJourneyId);
        }
        const activeJourneyForShare = userJourneys.find((j) => j.id === activeJourneyId);
        const activeShareBase = activeJourneyForShare
          ? getBaseVisaCategory(activeJourneyForShare.journey_type)
          : null;
        const applicableSharedIds = sharedJourneyIds.filter((targetId) => {
          const targetJourney = userJourneys.find((j) => j.id === targetId);
          if (!targetJourney) return false;
          if (
            !isDocumentApplicableToJourney(specificDefId, uploadItem.type, targetJourney.journey_type)
          )
            return false;
          // Sibling candidate (same base visa category, e.g. the other parent): only share
          // documents that are shareable across candidates.
          const isSibling =
            !!activeShareBase && getBaseVisaCategory(targetJourney.journey_type) === activeShareBase;
          if (isSibling) {
            const def = ALL_DOCUMENTS.find((d) => d.id === specificDefId);
            if (!def || !isDocumentShareableAcrossCandidates(def)) return false;
          }
          return true;
        });

        if (applicableSharedIds.length > 0) {
          formData.append("shareWithJourneyIds", JSON.stringify(applicableSharedIds));
        }

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          showToast(`${msg(E.UPLOAD_FAILED)}`, "error", { id: "multi-upload-progress" });
          return;
        }
      }

      showToast(`Successfully uploaded ${validUploads.length} document(s)`, "success", {
        id: "multi-upload-progress",
      });

      // Provide completion callbacks
      await onUploadComplete();

      // If one of the just-uploaded items is a passport, read that file and offer
      // to auto-fill the profile (petitioner U.S. passport → self, etc.). Otherwise
      // just clear the rows and leave a blank one so the user can keep adding.
      // Identity docs (passport, birth certificate, naturalization…) all carry the
      // person's name + DOB. If the selected type OR the whole category is
      // OCR-registered, show the capture panel: a passport auto-fills via MRZ, other
      // docs come up blank for the user to type in. Either way the DOB lands in the
      // profile and flows to steps like Ch.1 Step 4. Target ("self"/"beneficiary")
      // comes from the type's config, otherwise the category's.
      const ocrItem = validUploads.find(
        (u) => u.file && (getOcrConfig(mapDocumentNameToId(u.type)) || getOcrConfig(categoryId))
      );
      if (ocrItem?.file) {
        const cfg = getOcrConfig(mapDocumentNameToId(ocrItem.type)) || getOcrConfig(categoryId);
        await runOcr(ocrItem.file, cfg?.target || "self");
      } else {
        // Keep modal open, but clear completed files and add a blank row
        setPendingUploads([]);
        addPendingUpload();
      }
    } catch (error) {
      console.error("Multi-upload error:", error);
      showToast(`${msg(E.UPLOAD_NETWORK_ERROR)}`, "error", { id: "multi-upload-progress" });
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (doc: UploadedDocument) => {
    setPreviewDoc(doc);
  };

  const handleDelete = (docId: string) => {
    setSelectedDeleteId(docId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDeleteId) return;
    try {
      setDeleteLoading(true);
      await deleteDocument(selectedDeleteId);
      showToast("Document deleted successfully", "success");
      setDeleteModalOpen(false);
      setSelectedDeleteId(null);
    } catch (error) {
      showToast(`${msg(E.VAULT_DELETE_FAILED)}`, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white flex flex-col max-h-[84vh]">
        <DialogHeader className="relative px-5 sm:px-7 pt-5 sm:pt-7 pb-4 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-black text-[#0f1f38]">
            Upload Multiple Documents
            <span className="block text-[15px] font-medium text-[#6b8097] mt-1">
              {documentName}
            </span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full absolute top-5 right-5 sm:top-7 sm:right-7 hover:bg-slate-100 transition-colors"
            onClick={handleClose}
            disabled={uploading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </Button>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-premium px-5 sm:px-7 pb-5 sm:pb-7">
          {/* ── Inline OCR auto-fill panel (shown after a passport upload) ── */}
          {ocrPhase !== "idle" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-[#0c1b33]">
                <div className="w-9 h-9 rounded-xl bg-[#e8f1fb] text-brand flex items-center justify-center">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    {ocrPhase === "reading"
                      ? "Reading your document..."
                      : ocrAnyDetected
                        ? "Confirm the details we read"
                        : "Add your details"}
                  </p>
                  <p className="text-xs text-[#6b8097]">
                    {ocrPhase === "confirm" && !ocrAnyDetected
                      ? ocrTarget === "beneficiary"
                        ? "We couldn't auto-read this, please type them in. Saved to your spouse's (beneficiary) details."
                        : "We couldn't auto-read this, please type them in. Saved to your profile."
                      : ocrTarget === "beneficiary"
                        ? "These will be saved to your spouse's (beneficiary) details."
                        : "These will be saved to your profile."}
                  </p>
                </div>
                {/* Re-read shortcut — retry the auto-read if the values look off. */}
                {ocrPhase === "confirm" && ocrFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runOcr(ocrFile, ocrTarget)}
                    disabled={ocrSaving}
                    className="rounded-xl border-[#d0e4f7] text-[#6b8097] hover:bg-slate-50 text-xs font-semibold gap-1.5"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    Re-read
                  </Button>
                )}
              </div>

              {ocrPhase === "reading" && (
                <div className="flex items-center justify-center gap-3 py-10 text-[#6b8097]">
                  <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                  <span className="text-sm font-medium">Extracting fields...</span>
                </div>
              )}

              {ocrPhase === "confirm" && (
                <>
                  {!ocrAnyDetected ? (
                    <div className="bg-[#e8f1fb] border border-[#d0e4f7] rounded-xl p-4 text-sm text-[#3a4f63]">
                      We couldn&apos;t automatically read this document. Please type the
                      details below, they&apos;ll be saved just the same.
                    </div>
                  ) : (
                    ocrWarnings.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                        <p className="font-semibold mb-1">Please double-check these</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {ocrWarnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}

                  {crossCheck && crossCheck.mismatches.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                      <p className="font-semibold mb-1">
                        These don&apos;t match what&apos;s already saved
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        {crossCheck.mismatches.map((m) => (
                          <li key={m.key}>
                            <strong>{m.label}:</strong> this document says &ldquo;{m.newValue}
                            &rdquo;, but your saved value is &ldquo;{m.oldValue}&rdquo;. Edit the
                            field below to the correct one before saving.
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {OCR_FIELD_ORDER.map(({ key, label }) => {
                      const conf = ocrConfidence[key];
                      const isMismatch = mismatchKeys.has(key);
                      return (
                        <div key={key} className="space-y-1">
                          <Label htmlFor={`ocr-${key}`} className="flex items-center gap-2">
                            {label}
                            {typeof conf === "number" && conf < 0.6 && (
                              <span className="text-xs text-amber-600">(low confidence)</span>
                            )}
                            {isMismatch && (
                              <span className="text-xs text-red-600">(doesn&apos;t match saved)</span>
                            )}
                          </Label>
                          <Input
                            id={`ocr-${key}`}
                            value={ocrFields[key] ?? ""}
                            onChange={(e) => updateOcrField(key, e.target.value)}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            className={
                              isMismatch ? "border-red-400 focus-visible:ring-red-400" : undefined
                            }
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-2 pb-2">
                    <Button
                      variant="outline"
                      onClick={dismissOcr}
                      disabled={ocrSaving}
                      className="flex-1 rounded-xl border-[#d0e4f7] text-[#6b8097] hover:bg-slate-50 font-semibold"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSaveOcr}
                      disabled={ocrSaving}
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      {ocrSaving ? "Saving..." : "Confirm & Save"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className={ocrPhase !== "idle" ? "hidden" : ""}>
          {/* Already Uploaded List */}
          {uploadedDocuments.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a4f63] mb-3">
                Already Uploaded
              </h4>
              <div className="space-y-4">
                {Object.entries(groupedDocuments).map(([typeLabel, docs]) => {
                  const latestDoc = docs[0];
                  const historicalDocs = docs.slice(1);
                  const isExpanded = expandedGroups[typeLabel];

                  return (
                    <div
                      key={typeLabel}
                      className="rounded-2xl border-2 border-[#e8f1fb] bg-white overflow-hidden shadow-sm transition-all hover:border-[#d0e4f7]"
                    >
                      {/* Accordion Header - Latest Document */}
                      <div className="flex items-center gap-4 p-4">
                        <div className="w-10 h-10 rounded-xl bg-[#eaf7f2] border border-[#b5e0d0] text-[#1a7a5e] flex items-center justify-center shrink-0">
                          <CheckCircle2 size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-[#0f1f38] text-[15px]">{typeLabel}</h4>
                            <Badge className="h-4 px-1.5 text-[9px] bg-primary text-white border-none hover:bg-primary/70 font-black tracking-wider">
                              Latest
                            </Badge>
                            {historicalDocs.length > 0 && (
                              <Badge
                                variant="outline"
                                className="h-4 px-1.5 text-[9px] border-primary/30 text-primary bg-primary/5 font-black tracking-wider"
                              >
                                {historicalDocs.length} Variants
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#6b8097] truncate">
                            {latestDoc.originalFilename} •{" "}
                            {(latestDoc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5 transition-all"
                            onClick={() => handlePreview(latestDoc)}
                          >
                            <Eye size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-red-500 hover:text-red-500 hover:bg-red-50 transition-all"
                            onClick={() => handleDelete(latestDoc.id)}
                            disabled={isDeletingIds.includes(latestDoc.id)}
                          >
                            {isDeletingIds.includes(latestDoc.id) ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </Button>
                          {historicalDocs.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 transition-all ${isExpanded ? "bg-slate-50 rotate-180" : ""}`}
                              onClick={() => toggleGroup(typeLabel)}
                            >
                              <ChevronDown size={20} />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Accordion Content - Historical Variants */}
                      {isExpanded && historicalDocs.length > 0 && (
                        <div className="border-t border-[#e8f1fb] bg-slate-50/50 p-4 pt-0">
                          <div className="flex items-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-[#6b8097]">
                            <History size={12} />
                            Previous Versions
                          </div>
                          <div className="space-y-2">
                            {historicalDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e8f1fb] shadow-xs group/variant"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-2 text-[10px] font-bold bg-slate-50 text-slate-500 border-slate-200"
                                  >
                                    v{doc.displayVersion}
                                  </Badge>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-[#3a4f63] truncate max-w-[200px]">
                                      {doc.originalFilename}
                                    </p>
                                    <p className="text-[10px] text-[#6b8097] font-medium">
                                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                                      {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg text-[#6b8097] hover:text-primary hover:bg-primary/5"
                                    onClick={() => handlePreview(doc)}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg text-red-500 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => handleDelete(doc.id)}
                                    disabled={isDeletingIds.includes(doc.id)}
                                  >
                                    {isDeletingIds.includes(doc.id) ? (
                                      <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview Modal */}
          {previewDoc && (
            <DocumentPreviewModal
              open={!!previewDoc}
              onClose={() => setPreviewDoc(null)}
              documentDef={documentDef}
              uploadedDoc={previewDoc}
              allUploadedDocs={uploadedDocuments}
            />
          )}

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            title="Delete Document?"
            description="Are you sure you want to delete this document? This cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            confirmVariant="danger"
            loading={deleteLoading}
            onConfirm={confirmDelete}
          />

          {/* Pending Uploads Rows */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a4f63]">
                Add New Documents
              </h4>
            </div>

            {pendingUploads.map((uploadItem) => {
              const availableOptions = getAvailableOptions(uploadItem.id);
              return (
                <div
                  key={uploadItem.id}
                  className="p-6 rounded-2xl border-2 border-[#e8f1fb] bg-white shadow-sm flex flex-col gap-6 relative transition-all hover:border-[#d0e4f7]"
                >
                  {/* Document Type Section */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[13px] font-semibold text-[#3a4f63]">
                        Document Type
                      </Label>
                      {pendingUploads.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-500 hover:bg-red-50 rounded-full shrink-0 transition-all"
                          onClick={() => removePendingUpload(uploadItem.id)}
                          disabled={uploading}
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                    <CustomDropdown
                      value={uploadItem.type}
                      onChange={(val) =>
                        updatePendingUpload(uploadItem.id, {
                          type: val,
                        })
                      }
                      options={Array.from(
                        new Set([
                          ...(uploadItem.type ? [uploadItem.type] : []),
                          ...availableOptions,
                          ...(!options.includes(OTHER_OPTION) ? [OTHER_OPTION] : []),
                        ])
                      ).map((opt) => ({
                        label: opt,
                        value: opt,
                        status: uploadedTypes.includes(opt) ? "uploaded" : "none",
                      }))}
                      placeholder="Select type..."
                      className="w-full [&_button]:rounded-xl [&_button]:border-2 [&_button]:border-[#e8f1fb] [&_button]:bg-slate-50/50 [&_button]:focus:border-primary [&_button]:focus:ring-4 [&_button]:focus:ring-primary/10"
                      disabled={uploading}
                    />
                  </div>

                  {/* Custom Name Section (Only if Other is selected) */}
                  {uploadItem.type === OTHER_OPTION && (
                    <div className="w-full animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label className="text-[13px] font-semibold text-[#3a4f63] mb-2 block">
                        Document Name
                      </Label>
                      <input
                        type="text"
                        placeholder="Type document name (e.g. Divorce Decree)..."
                        value={uploadItem.customName || ""}
                        onChange={(e) =>
                          updatePendingUpload(uploadItem.id, {
                            customName: e.target.value,
                          })
                        }
                        className="w-full border-2 border-primary/30 rounded-xl px-4 py-3 text-[14px] font-semibold text-[#0f1f38] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-white"
                        disabled={uploading}
                      />
                    </div>
                  )}

                  {/* File Dropzone Section - Enlarged */}
                  <div className="w-full">
                    <Label className="text-[13px] font-semibold text-[#3a4f63] mb-2 block">
                      Select File
                    </Label>
                    <div className="relative">
                      {uploadItem.file ? (
                        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[#e8f1fb] bg-slate-50/50">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg shrink-0 bg-primary/10 text-primary flex items-center justify-center">
                              <FileText size={20} />
                            </div>
                            <div>
                              <span className="text-[14px] font-semibold text-[#0f1f38] truncate block">
                                {uploadItem.file.name}
                              </span>
                              <span className="text-[11px] text-[#6b8097]">
                                {(uploadItem.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-3"
                            onClick={() =>
                              updatePendingUpload(uploadItem.id, {
                                file: null,
                              })
                            }
                            disabled={uploading}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label
                          className={`flex flex-col items-center justify-center w-full min-h-[140px] p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${
                            dragActiveId === uploadItem.id
                              ? "border-primary bg-primary/5"
                              : "border-[#d0e4f7] hover:bg-primary/[0.02] hover:border-primary"
                          }`}
                          onDragOver={(e) => handleDragOver(uploadItem.id, e)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(uploadItem.id, e)}
                        >
                          <div className="flex flex-col items-center justify-center gap-3 text-center">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                dragActiveId === uploadItem.id
                                  ? "bg-primary/20"
                                  : "bg-primary/10 group-hover:bg-primary/20"
                              }`}
                            >
                              <Upload
                                className={`w-6 h-6 transition-colors ${
                                  dragActiveId === uploadItem.id
                                    ? "text-primary"
                                    : "text-primary/70 group-hover:text-primary"
                                }`}
                              />
                            </div>
                            <div>
                              <p
                                className={`text-[15px] font-bold transition-colors ${
                                  dragActiveId === uploadItem.id
                                    ? "text-primary"
                                    : "text-[#0f1f38] group-hover:text-primary"
                                }`}
                              >
                                {dragActiveId === uploadItem.id
                                  ? "Drop it here!"
                                  : "Click or drag to upload"}
                              </p>
                              <p className="text-[12px] text-[#6b8097] mt-1 font-medium">
                                PDF, JPG, PNG or GIF (max. 10MB)
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif"
                            className="hidden"
                            onChange={(e) => handleFileSelect(uploadItem.id, e)}
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[13px] font-semibold text-[#3a4f63] block">
                        Notes (Optional)
                      </Label>
                      <span
                        className={`text-[10px] font-bold ${uploadItem.notes.length > 180 ? "text-orange-500" : "text-slate-400"}`}
                      >
                        {uploadItem.notes.length}/200
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Add a brief description or note about this document..."
                      value={uploadItem.notes}
                      onChange={(e) =>
                        updatePendingUpload(uploadItem.id, {
                          notes: e.target.value.slice(0, 200),
                        })
                      }
                      className="w-full border-2 border-[#e8f1fb] rounded-xl p-3.5 text-[14px] font-medium text-[#0f1f38] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-slate-50/50 resize-none"
                      disabled={uploading}
                    />
                  </div>
                </div>
              );
            })}

            {/* Add Button */}
            {/* {getAvailableOptions("").length > 0 && ( */}
            <Button
              variant="outline"
              className="w-full py-6 border-2 border-dashed border-[#d0e4f7] rounded-2xl text-brand font-semibold hover:border-brand hover:bg-brand/5 transition-all flex items-center justify-center gap-2"
              onClick={addPendingUpload}
              disabled={uploading}
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Another Document Type
            </Button>
            {/* )} */}
          </div>

          {/* Sibling Journeys Cross-Sharing Checkboxes */}
          {visibleOtherJourneys.length > 0 && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner mt-6">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Cross-share these documents
              </label>
              <p className="text-[11px] text-slate-500 leading-normal mb-1">
                Select which of your other active immigration journeys should also receive these uploaded files:
              </p>
              <div className="space-y-2.5">
                {visibleOtherJourneys.map((j) => {
                  const isChecked = sharedJourneyIds.includes(j.id);
                  return (
                    <div
                      key={j.id}
                      onClick={() => {
                        if (isChecked) {
                          setSharedJourneyIds(sharedJourneyIds.filter((id) => id !== j.id));
                          if (!manuallyUncheckedIds.includes(j.id)) {
                            setManuallyUncheckedIds([...manuallyUncheckedIds, j.id]);
                          }
                        } else {
                          setSharedJourneyIds([...sharedJourneyIds, j.id]);
                          setManuallyUncheckedIds(manuallyUncheckedIds.filter((id) => id !== j.id));
                        }
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                        isChecked
                          ? "bg-primary/5 border-primary shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${
                          isChecked
                            ? "bg-primary border-primary text-white scale-100"
                            : "border-slate-300 dark:border-slate-700 bg-transparent"
                        }`}>
                          {isChecked && (
                            <svg className="w-3.5 h-3.5 stroke-[3] stroke-white fill-none" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-bold transition-colors ${
                          isChecked ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                        }`}>
                          {getFriendlyJourneyName(j.journey_type, j.journey_name)}
                        </span>
                      </div>
                      {isChecked && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md animate-in fade-in zoom-in-95 duration-200">
                          Shared
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 border border-[#d0e4f7]/40 rounded-xl text-[#3a4f63] text-xs font-semibold shadow-sm mt-4">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{t("documentVaultPage.components.uploadModal.securityNotice")}</span>
          </div>
          </div>
        </div>

        {/* Action Footer */}
        <div
          className={`flex gap-4 px-5 sm:px-7 pb-5 sm:pb-7 pt-4 border-t border-slate-100 shrink-0 bg-white ${
            ocrPhase !== "idle" ? "hidden" : ""
          }`}
        >
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
            className="flex-1 py-6 rounded-xl border-2 border-[#e8f1fb] text-[#6b8097] font-semibold hover:bg-slate-50 transition-all text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadAll}
            disabled={uploading || pendingUploads.filter((p) => p.file && p.type).length === 0}
            className="flex-1 py-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-semibold disabled:bg-primary/60 text-base"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                Uploading...
              </div>
            ) : (
              `Upload ${pendingUploads.filter((p) => p.file && p.type).length} Document(s)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
