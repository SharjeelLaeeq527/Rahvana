"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Clock,
  AlertCircle,
  Loader,
  Printer,
  Download,
  RefreshCw,
  Lock,
  Crown,
  X,
} from "lucide-react";
// import { InterviewOutcomeTool } from "./components/InterviewOutcomeTool";
// import { Input221gTool } from "./components/Input221gTool";
import { useStepEntitlement } from "./useStepEntitlement";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useWizard } from "@/app/(main)/dashboard/hooks/useWizard";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { RoadmapStepV3 } from "./types";
import { DocumentPreviewModal } from "@/app/components/document-vault/DocumentPreviewModal";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DOCUMENTS_BY_KEY } from "@/lib/document-vault/document-definitions";
import { useToast } from "@/app/components/shared/ToastProvider";
import { UploadedDocument, DocumentDefinition } from "@/lib/document-vault/types";
import { useAuth } from "@/app/context/AuthContext";
import { PlanTier } from "@/lib/entitlements/config";
import { usePlan } from "@/app/context/PlanContext";
import { E, msg } from "@/lib/errors";

interface ActionStepRendererProps {
  step: RoadmapStepV3;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBack?: () => void;
  chapter?: string;
  filingType?: string;
  state?: any;
  actions?: any;
  isChapter1?: boolean;
  isChapter2?: boolean;
  isChapter3?: boolean;
  guard?: () => boolean;
}

// Tailwind-compatible color values
const COLORS = {
  navy: "var(--rv-navy)",
  ink: "var(--rv-ink)",
  soft: "var(--rv-soft)",
  muted: "var(--rv-muted)",
  line: "var(--rv-line)",
  sky: "var(--rv-sky)",
  accent: "var(--rv-blue)",
  accent2: "var(--rv-blue-dark)",
  green: "var(--rv-green)",
  greenbg: "var(--rv-green-bg)",
  primary: "var(--primary)",
  primaryDark: "color-mix(in srgb, var(--primary), transparent 20%)",
};

const CHAPTER1 = {
  accent: "var(--rv-ch1)",
  accentDark: "var(--rv-ch1-dark)",
  bg: "var(--rv-ch1-module-bg)",
  feature: "var(--rv-ch1-feature-bg)",
  panel: "var(--rv-ch1-panel)",
  text: "var(--rv-ch1-text)",
};

// Helper: Format relative time
const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getTrackingStatusDisplay = (status: any) => {
  const statusMap: Record<
    string,
    { icon: React.ReactNode; label: string; color: string; bgColor: string }
  > = {
    pre_transit: {
      icon: <Clock size={16} />,
      label: "Pre-Transit",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    in_transit: {
      icon: <Truck size={16} />,
      label: "In Transit",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    out_for_delivery: {
      icon: <MapPin size={16} />,
      label: "Out for Delivery",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    delivered: {
      icon: <CheckCircle size={16} />,
      label: "Delivered",
      color: "text-green-700",
      bgColor: "bg-green-50",
    },
    available_for_pickup: {
      icon: <Package size={16} />,
      label: "Available for Pickup",
      color: "text-purple-700",
      bgColor: "bg-purple-50",
    },
    failure: {
      icon: <AlertCircle size={16} />,
      label: "Delivery Failed",
      color: "text-red-700",
      bgColor: "bg-red-50",
    },
    unknown: {
      icon: <Loader size={16} />,
      label: "Pending Status",
      color: "text-gray-700",
      bgColor: "bg-gray-50",
    },
  };

  // ✅ STEP 1: extract real string safely
  let normalized = "";

  if (typeof status === "string") {
    normalized = status;
  } else if (status && typeof status === "object") {
    normalized = status.code || status.status || "";
  }

  normalized = normalized.toLowerCase().trim();

  // ✅ STEP 2: fallback safely
  return statusMap[normalized] ?? statusMap.unknown;
};
function PlanTierBadge({ tier }: { tier: PlanTier | null }) {
  if (!tier || tier === "free") return null;

  const styles: Record<string, { wrapper: string; iconClass: string; label: string }> = {
    basic: {
      wrapper: "border-[#a8d4d4] bg-[#e8f4f4] shadow-sm",
      iconClass: "plan-icon plan-icon--basic",
      label: "Basic",
    },
    premium: {
      wrapper: "border-[#c0c0cc] bg-[#f0f0f0] shadow-sm",
      iconClass: "plan-icon plan-icon--premium",
      label: "Premium",
    },
    executive: {
      wrapper: "border-[#e8c96a] bg-[#fdf6e3] shadow-sm",
      iconClass: "plan-icon plan-icon--executive",
      label: "Executive",
    },
  };

  const s = styles[tier];
  if (!s) return null;

  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${s.wrapper}`}
    >
      <span className={s.iconClass} />
    </span>
  );
}
function useRequiredTier(featureKey: string | null): PlanTier | null {
  const plan = usePlan();

  if (!featureKey) return null;

  // Walk tiers from lowest to highest; return the first tier that can use the feature
  const tiers: PlanTier[] = ["free", "basic", "premium", "executive"];
  for (const t of tiers) {
    break;
  }

  const executiveFeatures = [
    "polio_certificate",
    "action_221g",
    "pcc_filing",
    "mock_interview",
    "expert_doc_review_executive",
  ];
  const premiumFeatures = [
    "step_guides",
    "document_vault",
    "expert_consultation",
    "medical_booking",
    "document_translation",
    "expert_doc_review",
    "checklist_tracking",
  ];
  const basicFeatures = ["checklist_engine", "roadmap_access"];

  if (executiveFeatures.includes(featureKey)) return "executive";
  if (premiumFeatures.includes(featureKey)) return "premium";
  if (basicFeatures.includes(featureKey)) return "basic";

  // Fallback: if the feature is currently locked for the user, show their
  // required next tier; otherwise null (no badge needed).
  return plan.isLocked(featureKey) ? "premium" : null;
}

export const ActionStepRenderer: React.FC<ActionStepRendererProps> = ({
  step,
  isCompleted,
  state: propsState,
  actions: propsActions,
  onToggleComplete,
  isChapter1 = false,
  isChapter2 = false,
  isChapter3 = false,
}) => {
  // Use passed state/actions if available, otherwise fallback to hook (for backward compatibility)
  const hookData = useWizard();
  const state = propsState || hookData.state;
  const actions = propsActions || hookData.actions;
  const { showToast } = useToast();

  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [showGuideChoice, setShowGuideChoice] = useState(false);
  const [selectedGuideType, setSelectedGuideType] = useState<"print" | "download" | null>(null);
  const [statusSaved, setStatusSaved] = useState(false);
  const [selectedDropdown, setSelectedDropdown] = useState("");
  const [mailingCarrier, setMailingCarrier] = useState("");
  const [mailingTracking, setMailingTracking] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isSavingMailing, setIsSavingMailing] = useState(false);
  const [carrierError, setCarrierError] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [isEditingMailing, setIsEditingMailing] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string>("unknown");
  const [trackingLastChecked, setTrackingLastChecked] = useState<string | null>(null);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  const stepEntitlement = useStepEntitlement(step.step_key);
  // Executive-only (crown) logic
  // const isCrown = stepEntitlement.featureKey === "polio_certificate" || stepEntitlement.featureKey === "action_221g";
  const requiredTier = useRequiredTier(stepEntitlement.featureKey);
  // Only show the badge when the step is actually locked for this user
  const showTierBadge = stepEntitlement.isLocked && requiredTier !== null;

  // Responsive: track viewport width for conditional inline styles
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Document Vault Integration
  const { user } = useAuth();
  const {
    uploadedDocuments,
    initialize: initializeVault,
    hasLoadedDocsInitial,
  } = useDocumentVaultStore();

  useEffect(() => {
    if (user && !hasLoadedDocsInitial) {
      // Scope the vault to THIS journey — without the journeyId the API returns
      // every document the user ever uploaded (across all journeys), so a fresh
      // journey would show old journeys' uploads. See store getAllDocuments.
      initializeVault(user.id, undefined, state.backendId || undefined);
    }
  }, [user, hasLoadedDocsInitial, initializeVault, state.backendId]);

  const [previewConfig, setPreviewConfig] = useState<{
    isOpen: boolean;
    docDef: DocumentDefinition | null;
    uploadedDoc: UploadedDocument | null;
  }>({
    isOpen: false,
    docDef: null,
    uploadedDoc: null,
  });

  const handlePreview = (docKey: string) => {
    const docDef = DOCUMENTS_BY_KEY[docKey];
    if (!docDef) return;

    const uploadedDoc = uploadedDocuments.find((d) => d.documentDefId === docDef.id);

    if (uploadedDoc) {
      setPreviewConfig({
        isOpen: true,
        docDef,
        uploadedDoc,
      });
    } else {
      showToast(msg(E.JOURNEY_DOCUMENT_MISSING), "error");
    }
  };

  // Load persisted data from metadata on mount
  useEffect(() => {
    // Only set statusSaved if data came from DB (already saved)
    if (step.action_data?.dropdown_card) {
      const savedMethod = state.metadata?.paper_payment_method;
      if (savedMethod) setSelectedDropdown(savedMethod);
    }

    if (step.action_data?.mailing_card) {
      const savedCarrier = state.metadata?.paper_mailing_carrier;
      const savedTracking = state.metadata?.paper_mailing_tracking;
      if (savedCarrier) setMailingCarrier(savedCarrier);
      if (savedTracking) setMailingTracking(savedTracking);
      // statusSaved intentionally NOT set here — banner only shows after a fresh save action
    }
  }, [step.action_data?.dropdown_card, step.action_data?.mailing_card, state.metadata]);

  useEffect(() => {
    if (showGuide || showGuideChoice) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showGuide, showGuideChoice]);

  // Reset guideStep when step key changes, or when the guide modal is opened/closed, or when guide type changes
  useEffect(() => {
    setGuideStep(0);
  }, [step.step_key, showGuide, selectedGuideType]);

  // Close guide modals when moving to a different step
  useEffect(() => {
    setShowGuide(false);
    setShowGuideChoice(false);
  }, [step.step_key]);

  // Load tracking data from metadata on mount
  useEffect(() => {
    if (state.metadata?.tracking_status) {
      setTrackingStatus(state.metadata.tracking_status);
    }
    if (state.metadata?.tracking_last_checked_at) {
      setTrackingLastChecked(state.metadata.tracking_last_checked_at);
    }
    if (state.metadata?.delivered_at) {
      setDeliveredAt(state.metadata.delivered_at);
    }
  }, [
    state.metadata?.easypost_tracker_id,
    state.metadata?.tracking_status,
    state.metadata?.tracking_last_checked_at,
    state.metadata?.delivered_at,
  ]);

  const fetchTrackingStatus = useCallback(async () => {
    try {
      setIsLoadingTracking(true);
      const response = await fetch(`/api/easypost/tracker/status?caseId=${state.backendId}`);

      if (!response.ok) {
        console.error("[ActionStepRenderer] Failed to fetch tracking status");
        return;
      }

      const data = await response.json();

      // Update local state with latest tracking info
      setTrackingStatus(data.status);
      setTrackingLastChecked(data.lastChecked);
      if (data.deliveredAt) {
        setDeliveredAt(data.deliveredAt);
      }
    } catch (error) {
      console.error("[ActionStepRenderer] Error fetching tracking:", error);
    } finally {
      setIsLoadingTracking(false);
    }
  }, [state.backendId]);

  // Fetch tracking status periodically when tracker exists + Supabase Realtime for real-time updates
  useEffect(() => {
    if (!state.metadata?.easypost_tracker_id) return;

    let channel: any = null;
    let isMounted = true;

    let pollTimer: NodeJS.Timeout | null = null;

    // initial fetch
    fetchTrackingStatus();

    const getPollDelay = (status?: string) => {
      if (status === "out_for_delivery") {
        return 10 * 60 * 1000; // 10 min
      }
      return 6 * 60 * 60 * 1000; // 6 hours
    };

    const startPolling = (status?: string) => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }

      if (status === "delivered") return;

      const delay = getPollDelay(status);

      console.log(`[Tracking] Polling started: ${delay / 1000 / 60} min interval`);

      pollTimer = setInterval(fetchTrackingStatus, delay);
    };

    const setupRealtime = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        if (!isMounted) return;

        channel = supabase
          .channel(`tracking:${state.backendId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "case_data",
              filter: `journey_id=eq.${state.backendId}`,
            },
            (payload: any) => {
              const updatedRow = payload.new;
              if (!updatedRow) return;

              // Skip updates while user is editing mailing details
              if (isEditingMailing) return;

              // TRACKING STATUS
              if (updatedRow.data_key === "tracking_status") {
                const newStatus = updatedRow.data_value;

                console.log(`[Realtime] Status: ${newStatus}`);

                // Avoid unnecessary re-renders: only update when status actually changed
                setTrackingStatus((prev) => {
                  if (prev === newStatus) return prev;
                  // Adjust polling dynamically when status changes
                  startPolling(newStatus);
                  return newStatus;
                });
              }

              // LAST CHECKED
              if (updatedRow.data_key === "tracking_last_checked_at") {
                setTrackingLastChecked(updatedRow.data_value);
              }

              // DELIVERED TIME
              if (updatedRow.data_key === "delivered_at") {
                setDeliveredAt(updatedRow.data_value);
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Realtime setup failed:", err);
      }
    };

    setupRealtime();

    // Start polling with initial status
    startPolling(trackingStatus);

    return () => {
      isMounted = false;

      if (channel) {
        import("@/lib/supabase/client").then(({ createClient }) => {
          const supabase = createClient();
          supabase.removeChannel(channel);
        });
      }

      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [state.metadata?.easypost_tracker_id, state.backendId, fetchTrackingStatus, isEditingMailing]);

  const handlePrevGuide = () => {
    setGuideStep((prev) => Math.max(0, prev - 1));
  };

  const handleNextGuide = () => {
    setGuideStep((prev) => prev + 1);
  };

  // Validation functions for mailing inputs
  const validateCarrier = (value: string): string => {
    if (!value.trim()) {
      return msg(E.JOURNEY_MAILING_CARRIER_REQUIRED);
    }
    if (value.trim().length < 2) {
      return msg(E.JOURNEY_MAILING_CARRIER_TOO_SHORT);
    }
    return "";
  };

  const validateTracking = (value: string): string => {
    if (!value.trim()) {
      return msg(E.JOURNEY_MAILING_TRACKING_REQUIRED);
    }
    if (value.trim().length < 3) {
      return msg(E.JOURNEY_MAILING_TRACKING_TOO_SHORT);
    }
    // Allow alphanumeric and common separators
    if (!/^[a-zA-Z0-9\-\s]*$/.test(value.trim())) {
      return msg(E.JOURNEY_MAILING_TRACKING_INVALID);
    }
    return "";
  };

  const handleSaveMailing = async () => {
    // Validate carrier
    const carrierErr = validateCarrier(mailingCarrier);
    if (carrierErr) {
      setCarrierError(carrierErr);
      return;
    }

    // Validate tracking
    const trackingErr = validateTracking(mailingTracking);
    if (trackingErr) {
      setTrackingError(trackingErr);
      return;
    }

    if (!stepEntitlement.guard()) return;

    setIsSavingMailing(true);
    try {
      if (actions?.saveMailingDetails) {
        await actions.saveMailingDetails(mailingCarrier, mailingTracking);
      } else if (actions?.updateMetadata) {
        await actions.updateMetadata({
          paper_mailing_carrier: mailingCarrier,
          paper_mailing_tracking: mailingTracking,
        });
      } else {
        throw new Error(msg(E.JOURNEY_MAILING_SAVE_FAILED));
      }
      setStatusSaved(true);
      showToast("Mailing details saved successfully!", "success");
      setTimeout(() => setStatusSaved(false), 4000);

      // Create EasyPost tracker so live carrier tracking appears
      if (state.backendId && mailingCarrier && mailingTracking) {
        fetch("/api/easypost/tracker/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: state.backendId,
            carrier: mailingCarrier,
            trackingCode: mailingTracking,
          }),
        }).catch((err) =>
          console.error("[ActionStepRenderer] EasyPost tracker create failed:", err)
        );
      }
    } catch (error) {
      console.error("Failed to save mailing details:", error);
      setStatusSaved(false);
      showToast(msg(E.JOURNEY_MAILING_SAVE_FAILED), "error");
    } finally {
      setIsSavingMailing(false);
      setIsEditingMailing(false);
    }
  };

  if (!step.action_data) {
    return <div>No action data available for this step</div>;
  }

  const actionData = step.action_data;

  // Filter guide steps for step_1_11 based on selected guide type
  const getFilteredGuideSteps = () => {
    if (!actionData.guide_steps) return [];
    if (actionData.id === "paper-forms-print" && selectedGuideType) {
      return actionData.guide_steps.filter((gs: any) =>
        gs.label?.includes(selectedGuideType === "print" ? "Print" : "Download")
      );
    }
    return actionData.guide_steps || [];
  };

  const filteredSteps = getFilteredGuideSteps();
  const guideProgress = (guideStep + 1) / (filteredSteps?.length || 1);

  // Determine if info-cards section should use 2 cols or 1 col
  const hasSecondCard = actionData.dropdown_card || actionData.mailing_card;

  return (
    <div
      className={`min-h-screen`}
      // style={
      //   isChapter3
      //     ? {
      //         backgroundImage: "url('/assets/images/ch3steps-bg.png')",
      //         backgroundSize: "cover",
      //         backgroundPosition: "center",
      //         backgroundRepeat: "no-repeat",
      //         backgroundAttachment: "fixed",
      //         minHeight: "100vh",
      //       }
      //     : undefined
      // }
    >
      <style>{`
        /* Reset/base */
        .asr-root {
          min-height: 100vh;
        }
 
        /* ── Layout wrapper ── */
        .asr-wrapper {
          max-width: 768px;
          width: 100%;
          margin: 0 auto;
          padding: clamp(12px, 4vw, 32px) clamp(12px, 4vw, 32px) clamp(24px, 5vw, 48px);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
 
        /* ── Eyebrow ── */
        .asr-eyebrow {
          font-size: clamp(8px, 1.8vw, 11px);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--rv-ch1-text);
          margin-bottom: 8px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          line-height: 1.4;
        }
        .asr-eyebrow-sep { color: var(--rv-ch1); margin: 0 6px; }
        .asr-eyebrow-current { color: var(--rv-ch1); }
 
        /* ── Title ── */
        .asr-title {
          font-size: clamp(24px, 5.5vw, 40px);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }
        .asr-title--ch1 { color: var(--rv-ch1); }
        .asr-title--ch2 { color: #27192e; }
        .asr-title--default { color: var(--rv-ch1-text); }
 
        /* ── Description ── */
        .asr-desc {
          font-size: clamp(14px, 2vw, 16px);
          line-height: 1.7;
          max-width: 560px;
          margin-bottom: 16px;
        }
        .asr-desc--ch1 { color: var(--rv-ch1-text); }
        .asr-desc--ch2 { color: #b48ad6; }
        .asr-desc--default { color: var(--rv-ch1-text); }
 
        /* ── Chips ── */
        .asr-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .asr-chip {
          font-size: clamp(9px, 1.5vw, 11px);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid;
          white-space: nowrap;
        }
        .asr-chip--default {
          background: var(--rv-ch1-feature-bg);
          border-color: var(--rv-ch1-feature-bg);
          color: var(--rv-ch1);
        }
        .asr-chip--ch1 {
          background: var(--rv-ch1-feature-bg);
          border-color: rgba(130, 132, 191, 0.28);
          color: var(--rv-ch1-text);
        }
        .asr-chip--ch2 {
          background: #f4e6f3;
          border-color: #d5abd2;
          color: #520a50;
        }
 
        /* ── Hero Section ── */
        .asr-hero {
          background: var(--rv-ch1-module-bg);
          color: #fff;
          border-radius: clamp(16px, 3vw, 24px);
          padding: clamp(14px, 3.5vw, 28px);
          box-shadow: 0 18px 48px rgba(12,27,51,0.12);
          margin-bottom: 4px;
        }
        .asr-hero__heading {
          font-size: clamp(20px, 4.5vw, 30px);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .asr-hero__heading--rose { color: var(--rv-ch1); }
        .asr-hero__desc {
          font-size: clamp(13px, 1.8vw, 14px);
          line-height: 1.65;
          color: rgba(255,255,255,0.74);
        }
        .asr-hero__desc--white { color: #fff; }
        .asr-badge {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: clamp(9px, 1.4vw, 11px);
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 10px;
          margin-bottom: 12px;
        }
        .asr-badge--default {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .asr-badge--rose {
          background: var(--rv-ch1-feature-bg);
          color: var(--rv-ch1-text);
        }
 
        /* ── Action Tips Grid ── */
        .asr-tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
          gap: 10px;
          margin: 16px 0;
        }
        .asr-tip {
          background: rgba(255,255,255,0.06);
          padding: 12px;
          border-radius: 14px;
          font-size: clamp(12px, 1.6vw, 13px);
          line-height: 1.45;
          color: rgba(255,255,255,0.82);
        }
 
        /* ── CTA Buttons ── */
        .asr-cta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .asr-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: clamp(12px, 2vw, 15px) 18px;
          font-size: clamp(13px, 2vw, 15px);
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s, transform 0.2s;
          font-family: inherit;
          text-align: center;
          line-height: 1.3;
        }
        .asr-btn--rose { background: var(--rv-ch1); color: #fff; }
        .asr-btn--rose:hover { background: var(--rv-ch1-dark); }
        .asr-btn--accent { background: var(--rv-ch1); color: #fff; }
        .asr-btn--accent:hover { background: var(--rv-ch1-dark); }
        .asr-btn--sky { background: var(--rv-ch1-feature-bg); color: var(--rv-ch1-text); }
        .asr-btn--sky:hover { opacity: 0.9; }
        .asr-btn:disabled { cursor: not-allowed; opacity: 0.6; }
 
        /* ── Info Cards Row ── */
        .asr-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .asr-card {
          background: #fff;
          border: 1px solid #d7e3ef;
          border-radius: clamp(14px, 3vw, 20px);
          padding: clamp(14px, 2.5vw, 20px);
          box-shadow: 0 8px 20px rgba(12,27,51,0.04);
        }
        .asr-card__title {
          font-size: 15px;
          font-weight: 700;
          color: #0c1b33;
          margin-bottom: 6px;
        }
        .asr-card__sub {
          font-size: 13px;
          line-height: 1.55;
          color: #6b8097;
          margin-bottom: 14px;
        }
 
        /* ── Mailing Inputs ── */
        .asr-input-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .asr-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .asr-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6b8097;
        }
        .asr-input {
          padding: 12px 14px;
          border: 1px solid var(--rv-ch1-feature-bg);
          border-radius: 10px;
          font-size: clamp(13px, 1.8vw, 14px);
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          color: var(--rv-ch1-text);
          background: #fff;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        .asr-input:focus {
          border-color: var(--rv-ch1);
          box-shadow: 0 0 0 3px rgba(130,132,191,0.12);
        }
        .asr-input--error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
        }
        .asr-error-msg {
          font-size: 11px;
          font-weight: 500;
          color: #dc2626;
          margin-top: 2px;
          animation: fadeIn 0.2s ease-in;
        }
 
        /* ── Status Banner ── */
        .asr-status-banner {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: #e8f5ef;
          border: 1px solid #b8dbc8;
          border-radius: 14px;
          padding: clamp(12px, 2vw, 14px) 16px;
          color: #15744f;
          font-size: clamp(12px, 1.6vw, 13px);
          margin-top: 12px;
        }
        .asr-status-banner__icon { flex-shrink: 0; }
        .asr-status-banner__body { flex: 1; min-width: 0; }
        .asr-status-banner__heading {
          display: block;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .asr-status-banner__msg {
          font-size: clamp(11px, 1.5vw, 12px);
          display: block;
          margin-bottom: 8px;
        }
 
        /* ── Tracking Status Row ── */
        .asr-tracking-section {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(21,116,79,0.2);
        }
        .asr-tracking-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
          font-size: clamp(11px, 1.5vw, 12px);
          flex-wrap: wrap;
        }
        .asr-tracking-status {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .asr-tracking-last-checked {
          font-size: 11px;
          color: rgba(21,116,79,0.7);
          margin-bottom: 6px;
        }
        .asr-tracking-update-info {
          font-size: clamp(11px, 1.5vw, 12px);
          color: rgba(21,116,79,0.6);
          margin-bottom: 4px;
          font-weight: 500;
        }
 
        /* ── Action Items Section ── */
        .asr-action-items {
          margin-top: 16px;
          background: #fff;
          border: 1px solid #d7e3ef;
          border-radius: clamp(16px, 3vw, 22px);
          padding: clamp(14px, 2.5vw, 20px);
          box-shadow: 0 8px 22px rgba(12,27,51,0.04);
        }
        .asr-action-items__title {
          font-size: clamp(11px, 1.5vw, 13px);
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6b8097;
          margin-bottom: 12px;
        }
        .asr-action-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 14px;
          background: #fbfdff;
          border: 1px solid #e5edf6;
          margin-top: 8px;
        }
        .asr-action-item:first-child { margin-top: 0; }
        .asr-action-item__body {
          flex: 1;
          font-size: clamp(12px, 1.6vw, 13px);
          line-height: 1.55;
          color: #6b8097;
          min-width: 0;
        }
        .asr-action-item__title {
          display: block;
          font-size: clamp(13px, 1.8vw, 14px);
          font-weight: 700;
          margin-bottom: 2px;
          color: #0c1b33;
        }
 
        /* ── Full-Screen Guide Modal ── */
        .asr-guide-modal {
          position: fixed;
          inset: 0;
          background: white;
          z-index: 200;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease;
          overflow: hidden;
        }
        .asr-guide-topbar {
          display: flex;
          align-items: center;
          height: clamp(56px, 8vw, 72px);
          border-bottom: 1px solid var(--rv-ch1-feature-bg);
          padding: 0 clamp(12px, 3vw, 24px);
          gap: 16px;
          flex-shrink: 0;
          background: white;
        }
        .asr-guide-close-btn {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          background: var(--rv-ch1-feature-bg);
          border: none;
          cursor: pointer;
          color: var(--rv-ch1-text);
          font-size: 20px;
          font-weight: bold;
          transition: background 0.2s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .asr-guide-close-btn:hover { background: var(--rv-ch1-feature-bg); }
        .asr-progress-bar {
          flex: 1;
          height: 6px;
          background: var(--rv-ch1-feature-bg);
          border-radius: 10px;
          overflow: hidden;
        }
        .asr-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--rv-ch1), rgba(130,132,191,0.6));
          transition: width 0.4s ease-out;
        }
        .asr-guide-counter {
          font-size: 12px;
          font-weight: 700;
          color: var(--rv-ch1-text);
          min-width: 50px;
          text-align: right;
          flex-shrink: 0;
        }
        .asr-guide-body {
          flex: 1;
          overflow-y: auto;
          background: #fafcff;
          padding: clamp(20px, 4vw, 48px) clamp(12px, 4vw, 32px) clamp(24px, 4vw, 40px);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .asr-guide-content {
          max-width: 580px;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .asr-guide-step-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #2f6fd4;
          margin-bottom: 12px;
        }
        .asr-guide-step-title {
          font-size: clamp(18px, 3.5vw, 26px);
          font-weight: 900;
          color: #0c1b33;
          margin-bottom: 10px;
          line-height: 1.3;
        }
        .asr-guide-step-text {
          font-size: clamp(13px, 1.8vw, 14px);
          color: #3a4f63;
          line-height: 1.7;
          margin-bottom: 18px;
        }
        .asr-browser-mock {
          border: 1.5px solid #d7e3ef;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 14px 32px rgba(12,27,51,0.08);
          margin-bottom: 18px;
        }
        .asr-browser-bar {
          height: 34px;
          background: #eef3fa;
          border-bottom: 1px solid #d7e3ef;
          display: flex;
          align-items: center;
          gap: 7px;
          padding-left: 12px;
          overflow: hidden;
        }
        .asr-browser-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .asr-browser-url {
          margin-left: 8px;
          height: 20px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          background: #fff;
          border-radius: 8px;
          font-size: 10px;
          color: #6b8097;
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: clamp(140px, 40vw, 360px);
        }
        .asr-browser-content {
          min-height: clamp(160px, 30vw, 280px);
          background: linear-gradient(180deg, #fcfeff 0%, #f7fbff 100%);
          color: #6b8097;
          font-size: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .asr-guide-note {
          padding: 12px 14px;
          border-radius: 14px;
          background: #fef8e8;
          border: 1px solid #f0d98a;
          color: #8a6200;
          font-size: clamp(12px, 1.6vw, 13px);
          line-height: 1.55;
          margin-bottom: 20px;
        }
        .asr-guide-nav {
          display: flex;
          gap: 10px;
          margin-top: auto;
          flex-wrap: wrap;
        }
        .asr-btn--back {
          padding: 12px 20px;
          background: transparent;
          color: #3a4f63;
          border: 1.5px solid #d7e3ef;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: clamp(13px, 1.8vw, 14px);
          transition: all 0.2s;
          font-family: inherit;
          white-space: nowrap;
        }
        .asr-btn--back:hover { border-color: #3a4f63; color: #0c1b33; }
        .asr-btn--next {
          flex: 1;
          min-width: 120px;
          padding: 12px 20px;
          background: #2f6fd4;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          font-size: clamp(13px, 1.8vw, 14px);
          transition: all 0.2s;
          font-family: inherit;
          text-align: center;
        }
        .asr-btn--next:hover { background: #2460bb; transform: translateY(-2px); }
        .asr-btn--done {
          flex: 1;
          min-width: 120px;
          padding: 12px 20px;
          background: #15744f;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          font-size: clamp(13px, 1.8vw, 14px);
          transition: all 0.2s;
          font-family: inherit;
          text-align: center;
        }
        .asr-btn--done:hover { background: #0e5c3c; transform: translateY(-2px); }
 
        /* ── Guide Choice Modal (overlay) ── */
        .asr-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 300;
          padding: clamp(12px, 4vw, 24px);
        }
        .asr-choice-modal {
          background: #fff;
          border-radius: clamp(16px, 3vw, 24px);
          padding: clamp(20px, 5vw, 40px);
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(12,27,51,0.16);
          animation: slideUp 0.3s ease;
          position: relative;
        }
        .asr-choice-modal__heading {
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 900;
          color: #0c1b33;
          margin-bottom: 12px;
          line-height: 1.3;
          text-align: center;
        }
        .asr-choice-modal__sub {
          font-size: clamp(13px, 2vw, 15px);
          color: #3a4f63;
          line-height: 1.6;
          text-align: center;
          margin-bottom: 28px;
        }
        .asr-choice-options {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .asr-choice-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: clamp(12px, 2.5vw, 18px) clamp(14px, 2.5vw, 20px);
          background: #fff;
          border: 2px solid #d7e3ef;
          border-radius: 16px;
          cursor: pointer;
          transition: border-color 0.2s;
          text-align: left;
          width: 100%;
          font-family: inherit;
        }
        .asr-choice-option:hover { border-color: #2f6fd4; }
        .asr-choice-icon {
          width: clamp(40px, 7vw, 48px);
          height: clamp(40px, 7vw, 48px);
          min-width: clamp(40px, 7vw, 48px);
          border-radius: 12px;
          background: #e8f1fb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .asr-choice-label {
          font-size: clamp(13px, 2vw, 15px);
          font-weight: 700;
          color: #0c1b33;
          margin-bottom: 2px;
        }
        .asr-choice-sub {
          font-size: clamp(11px, 1.5vw, 13px);
          color: #6b8097;
        }
 
        /* ── Animations ── */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
 
        /* ── Spinner ── */
        .asr-spin { animation: spin 1s linear infinite; }
      `}</style>
      {/* Main Content */}
      <div className="max-w-[660px] w-full mx-auto px-2 sm:px-4 md:px-8 pt-5 md:pt-3 pb-8 md:pb-12 flex flex-col step">
        {/* Eyebrow for Paper Filing Path steps */}
        {/* {(step.step_key === "step_1_11" || 
          step.step_key === "step_1_12" || 
          step.step_key === "step_1_13" || 
          step.step_key === "step_1_14") && (
          <div className="
  text-[9px] sm:text-[10px] md:text-[11px]
  font-bold uppercase tracking-[0.12em]
  text-[#636B97]
  mb-2
  flex flex-wrap items-center gap-1
">
            Chapter 1: USCIS Petition Filing
            <span className="text-[#BDD7F1] mx-2">&gt;</span>
            <span className="text-[#3B7DD8]">{step.step_name}</span>
          </div>
        )} */}
        {/* Title */}
        <h1
          className={`page-title text-[clamp(28px,4vw,36px)] font-bold leading-[1.15] tracking-tight mb-1 ${isChapter1 ? "text-[#0c1b33]" : isChapter2 ? "text-[#27192e]" : "text-[#0c1b33]"}`}
        >
          {step.step_name}
        </h1>

        {/* Subtitle */}
        <p className="page-desc text-[15px] md:text-[16px] leading-[1.7] max-w-full md:max-w-[560px] mb-2.5 sm:mb-4 text-[#3a4f63]">
          {step.step_description}
        </p>

        {/* Chips - Pastel colors */}
        {actionData.chips && actionData.chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-5">
            {actionData.chips.map((chip, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border whitespace-nowrap"
                style={{
                  backgroundColor: isChapter1 ? "#f3f0fb" : isChapter2 ? "#f4e6f3" : "#f0f1fb",
                  borderColor: isChapter1 ? "#c9bef2" : isChapter2 ? "#d5abd2" : "#d0e4f7",
                  color: isChapter1 ? "#4a2d8a" : isChapter2 ? "#520a50" : "#2d4a6e",
                }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        {/* Hero Section */}
        <section
          style={{
            background: isChapter1 ? CHAPTER1.bg : isChapter2 ? "#1a0a18" : "#051738",
            color: "#fff",
            borderRadius: "24px",
            padding: isMobile ? "16px" : "24px",
            boxShadow: "0 18px 48px rgba(12, 27, 51, 0.12)",
            marginBottom: "16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Accent gradient line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: isChapter1
                ? "linear-gradient(90deg, var(--rv-ch1), var(--rv-ch1-module-bg), transparent)"
                : isChapter2
                  ? "linear-gradient(90deg, #520a50 0%, rgba(82,10,80,0.3) 100%)"
                  : "linear-gradient(90deg, #051738 0%, rgba(5,23,56,0.3) 100%)",
            }}
          />
          {/* Heading */}
          <h2
            style={{
              fontSize: isMobile ? "22px" : "26px",
              lineHeight: 1.15,
              marginBottom: "6px",
              fontWeight: 700,
              color: isChapter1 ? CHAPTER1.accent : isChapter2 ? "#d99dcf" : "#7ba3d9",
              textShadow: "none",
            }}
          >
            {actionData.hero_heading}
          </h2>

          {/* Description */}
          {actionData.hero_description && (
            <p
              style={{
                fontSize: "13.5px",
                lineHeight: 1.55,
                color: actionData.id === "paper-forms-print" ? CHAPTER1.text : "rgba(255, 255, 255, 0.74)",
                maxWidth: "470px",
              }}
            >
              {actionData.hero_description}
            </p>
          )}

          {/* Badge */}
          {actionData.badge && (
            <div
              style={{
                display: "inline-flex",
                padding: "6px 11px",
                borderRadius: "999px",
                background:
                  actionData.id === "paper-forms-print" ? CHAPTER1.feature : "rgba(255, 255, 255, 0.1)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                marginTop: "10px",
                marginBottom: "12px",
                color: isChapter1 ? CHAPTER1.text : isChapter2 ? "#d99dcf" : "#7ba3d9",
                backdropFilter: "blur(4px)",
                border: `1px solid ${isChapter1 ? "rgba(130,132,191,0.28)" : isChapter2 ? "rgba(217,157,207,0.4)" : "rgba(123,163,217,0.4)"}`,
              }}
            >
              {actionData.badge}
            </div>
          )}

          {/* Action Tips Grid */}
          {actionData.action_tips && actionData.action_tips.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: "10px",
                margin: "18px 0",
              }}
            >
              {actionData.action_tips.map((tip, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    padding: "12px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.82)",
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Primary CTA Button */}
          {actionData.id === "paper-forms-print" ? (
            <div
              style={{
                display: "grid",
                // gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={() => {
                  if (!stepEntitlement.guard()) return;
                  handlePreview("I130_FORM");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  background: stepEntitlement.isLocked
                    ? "#4a5568"
                    : isChapter1
                      ? CHAPTER1.accent
                      : isChapter2
                        ? "#520a50"
                        : "#051738",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "15px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!stepEntitlement.isLocked)
                    (e.target as HTMLElement).style.background = isChapter1
                      ? CHAPTER1.accentDark
                      : isChapter2
                        ? "#3d0b3d"
                        : "#041028";
                }}
                onMouseLeave={(e) => {
                  if (!stepEntitlement.isLocked)
                    (e.target as HTMLElement).style.background = isChapter1
                      ? CHAPTER1.accent
                      : isChapter2
                        ? "#520a50"
                        : "#051738";
                }}
              >
                {stepEntitlement.isLocked && <Lock size={18} className="mr-2 opacity-80" />}
                Print I-130
              </button>
              {/* <button
                onClick={() => {
                  if (!stepEntitlement.guard()) return;
                  handlePreview("I130A_FORM");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  background: stepEntitlement.isLocked
                    ? "#4a5568"
                    : isChapter1
                      ? "#8284bf"
                      : isChapter2
                        ? "#520a50"
                        : "#051738",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "15px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!stepEntitlement.isLocked)
                    (e.target as HTMLElement).style.background = isChapter1
                      ? "#7a7aaa"
                      : isChapter2
                        ? "#3d0b3d"
                        : "#041028";
                }}
                onMouseLeave={(e) => {
                  if (!stepEntitlement.isLocked)
                    (e.target as HTMLElement).style.background = isChapter1
                      ? "#8284bf"
                      : isChapter2
                        ? "#520a50"
                        : "#051738";
                }}
              >
                {stepEntitlement.isLocked && <Lock size={18} className="mr-2 opacity-80" />}
                Print I-130A
              </button> */}
            </div>
          ) : (
            actionData.cta_button &&
            actionData.cta_button.href && (
              <button
                onClick={() => {
                  if (!stepEntitlement.guard()) return;
                  if (actionData.cta_button?.href) {
                    window.open(actionData.cta_button.href, "_blank");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  background: stepEntitlement.isLocked
                    ? "#4a5568"
                    : actionData.id === "paper-forms-print"
                      ? CHAPTER1.accent
                      : COLORS.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "15px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "12px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!stepEntitlement.isLocked) {
                    (e.target as HTMLElement).style.background =
                      actionData.id === "paper-forms-print" ? CHAPTER1.accentDark : COLORS.accent2;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!stepEntitlement.isLocked) {
                    (e.target as HTMLElement).style.background =
                      actionData.id === "paper-forms-print" ? CHAPTER1.accent : COLORS.accent;
                  }
                }}
              >
                {stepEntitlement.isLocked && <Lock size={18} className="mr-2 opacity-80" />}
                {actionData.cta_button.label}
              </button>
            )
          )}

          {/* Info Cards Row */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: hasSecondCard && !isMobile ? "1fr 1fr" : "1fr",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {/* Guide Card */}
            <div
              style={{
                background: "#fff",
                border: `1px solid ${COLORS.line}`,
                borderRadius: "20px",
                padding: isMobile ? "14px" : "18px",
                boxShadow: "0 8px 20px rgba(12, 27, 51, 0.04)",
                position: "relative",
              }}
            >
              {/* Tier badge — top-right, only when step is locked */}
              {showTierBadge && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 12,
                    zIndex: 2,
                  }}
                >
                  <PlanTierBadge tier={requiredTier} />
                </div>
              )}
              <h3
                style={{
                  fontSize: "16px",
                  marginBottom: "6px",
                  color: COLORS.navy,
                  fontWeight: 700,
                }}
              >
                {actionData.guide_card?.title || "Step Guide"}
              </h3>

              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: COLORS.muted,
                  marginBottom: "14px",
                }}
              >
                {actionData.guide_card?.subtitle || "View guidance for this step"}
              </p>

              <button
                onClick={() => {
                  if (!stepEntitlement.guard()) return;
                  if (actionData.id === "paper-forms-print") {
                    setShowGuideChoice(true);
                  } else {
                    setShowGuide(true);
                  }
                }}
                style={{
                  width: "100%",
                  background: COLORS.sky,
                  color: "#1a3054",
                  border: "none",
                  borderRadius: "14px",
                  padding: "15px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.opacity = "1";
                }}
              >
                {actionData.guide_button_label || "View Guide"}
              </button>
            </div>

            {/* Dropdown Card (for payment method step) */}
            {actionData.dropdown_card && (
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: "20px",
                  padding: isMobile ? "14px" : "18px",
                  boxShadow: "0 8px 20px rgba(12, 27, 51, 0.04)",
                  position: "relative",
                }}
              >
                {showTierBadge && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 12,
                      zIndex: 2,
                    }}
                  >
                    <PlanTierBadge tier={requiredTier} />
                  </div>
                )}
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "6px",
                    color: COLORS.navy,
                    fontWeight: 700,
                  }}
                >
                  {actionData.second_card_title || actionData.dropdown_card.title}
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: COLORS.muted,
                    marginBottom: "14px",
                  }}
                >
                  {actionData.second_card_subtitle || actionData.dropdown_card.subtitle}
                </p>

                <CustomDropdown
                  options={(actionData.dropdown_card.dropdown_options || []).filter(
                    (opt) => opt.value !== ""
                  )}
                  value={selectedDropdown}
                  onChange={(value) => {
                    if (!value) return;
                    setSelectedDropdown(value);
                    setStatusSaved(false);
                  }}
                  placeholder="Select option"
                />

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={async () => {
                      if (!selectedDropdown) {
                        showToast("Please select a payment method first.", "error");
                        return;
                      }
                      if (!stepEntitlement.guard()) return;

                      setIsSavingPayment(true);
                      try {
                        if (actions?.savePaymentMethod) {
                          await actions.savePaymentMethod(selectedDropdown);
                        } else if (actions?.updateMetadata) {
                          await actions.updateMetadata({
                            paper_payment_method: selectedDropdown,
                          });
                        } else {
                          throw new Error(
                            "[ActionStepRenderer] Neither savePaymentMethod nor updateMetadata is available in actions"
                          );
                        }
                        setStatusSaved(true);
                        showToast("Payment method saved successfully!", "success");
                        setTimeout(() => setStatusSaved(false), 4000);
                      } catch (error) {
                        console.error("Failed to save payment method:", error);
                        setStatusSaved(false);
                        showToast("Failed to save payment method", "error");
                      } finally {
                        setIsSavingPayment(false);
                      }
                    }}
                    disabled={!selectedDropdown || isSavingPayment}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                    style={{
                      backgroundColor: "var(--rv-ch1)",
                    }}
                  >
                    {isSavingPayment
                      ? "Saving..."
                      : actionData.action_button_label || "Save payment method"}
                  </button>
                </div>
              </div>
            )}

            {/* Mailing Card (for tracking details step) */}
            {actionData.mailing_card && !actionData.dropdown_card && (
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: "20px",
                  padding: isMobile ? "14px" : "18px",
                  boxShadow: "0 8px 20px rgba(12, 27, 51, 0.04)",
                  position: "relative",
                }}
              >
                {showTierBadge && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 12,
                      zIndex: 2,
                    }}
                  >
                    <PlanTierBadge tier={requiredTier} />
                  </div>
                )}
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "6px",
                    color: COLORS.navy,
                    fontWeight: 700,
                  }}
                >
                  {actionData.second_card_title || actionData.mailing_card.title}
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: COLORS.muted,
                    marginBottom: "14px",
                  }}
                >
                  {actionData.second_card_subtitle || actionData.mailing_card.subtitle}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Carrier Input */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: COLORS.muted,
                      }}
                    >
                      Carrier name
                    </label>
                    <input
                      type="text"
                      placeholder={
                        actionData.mailing_card.carrier_placeholder || "Carrier (USPS, UPS, FedEx)"
                      }
                      value={mailingCarrier}
                      onChange={(e) => {
                        setMailingCarrier(e.target.value);
                        setIsEditingMailing(true);
                        if (carrierError) setCarrierError("");
                      }}
                      style={{
                        padding: "12px 14px",
                        border: `1px solid ${carrierError ? "#ef4444" : COLORS.line}`,
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        transition: "border-color 0.2s",
                        color: COLORS.ink,
                        background: "#fff",
                        outline: "none",
                        boxShadow: carrierError ? "0 0 0 3px rgba(239, 68, 68, 0.12)" : "none",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = carrierError
                          ? "#ef4444"
                          : COLORS.accent;
                        e.currentTarget.style.boxShadow = carrierError
                          ? "0 0 0 3px rgba(239, 68, 68, 0.12)"
                          : "0 0 0 3px rgba(47, 111, 212, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = carrierError ? "#ef4444" : COLORS.line;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    {carrierError && (
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#dc2626",
                          marginTop: "2px",
                          animation: "fadeIn 0.2s ease-in",
                        }}
                      >
                        {carrierError}
                      </div>
                    )}
                  </div>

                  {/* Tracking Number Input */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: COLORS.muted,
                      }}
                    >
                      Tracking number
                    </label>
                    <input
                      type="text"
                      placeholder={
                        actionData.mailing_card.tracking_placeholder || "Tracking number"
                      }
                      value={mailingTracking}
                      onChange={(e) => {
                        setMailingTracking(e.target.value);
                        setIsEditingMailing(true);
                        if (trackingError) setTrackingError("");
                      }}
                      style={{
                        padding: "12px 14px",
                        border: `1px solid ${trackingError ? "#ef4444" : COLORS.line}`,
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        transition: "border-color 0.2s",
                        color: COLORS.ink,
                        background: "#fff",
                        outline: "none",
                        boxShadow: trackingError ? "0 0 0 3px rgba(239, 68, 68, 0.12)" : "none",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = trackingError
                          ? "#ef4444"
                          : COLORS.accent;
                        e.currentTarget.style.boxShadow = trackingError
                          ? "0 0 0 3px rgba(239, 68, 68, 0.12)"
                          : "0 0 0 3px rgba(47, 111, 212, 0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = trackingError ? "#ef4444" : COLORS.line;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    {trackingError && (
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#dc2626",
                          marginTop: "2px",
                          animation: "fadeIn 0.2s ease-in",
                        }}
                      >
                        {trackingError}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveMailing}
                    disabled={
                      !mailingCarrier.trim() ||
                      !mailingTracking.trim() ||
                      isSavingMailing ||
                      !!carrierError ||
                      !!trackingError
                    }
                    style={{
                      width: "100%",
                      background: COLORS.sky,
                      color: "#1a3054",
                      border: "none",
                      borderRadius: "14px",
                      padding: "15px 18px",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor:
                        mailingCarrier.trim() &&
                        mailingTracking.trim() &&
                        !isSavingMailing &&
                        !carrierError &&
                        !trackingError
                          ? "pointer"
                          : "not-allowed",
                      opacity:
                        mailingCarrier.trim() &&
                        mailingTracking.trim() &&
                        !isSavingMailing &&
                        !carrierError &&
                        !trackingError
                          ? 1
                          : 0.6,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {isSavingMailing
                      ? "Saving..."
                      : actionData.action_button_label || "Save mailing details"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Status Message (for dropdown or mailing) */}
          {statusSaved && (actionData.dropdown_card || actionData.mailing_card) && (
            <section
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                background: COLORS.greenbg,
                border: "1px solid #b8dbc8",
                borderRadius: "14px",
                padding: "14px 16px",
                color: COLORS.green,
                fontSize: "13px",
                marginTop: "12px",
              }}
            >
              <CheckCircle size={18} style={{ flexShrink: 0 }} />

              <div style={{ flex: 1 }}>
                {/* Common Heading */}
                <strong style={{ display: "block" }}>
                  {actionData.action_button_status_heading || "Selection saved"}
                </strong>

                {/* Status Message - Different for dropdown vs mailing */}
                <span
                  style={{
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  {actionData.mailing_card && mailingTracking
                    ? (actionData.action_button_status_message || "Delivery details saved.")
                        .replace("{carrier}", mailingCarrier)
                        .replace("{tracking}", mailingTracking)
                    : (actionData.action_button_status_message || "Saved selection: {selected}.")
                        .replace("{selected}", selectedDropdown)
                        .replace("{selected_method}", selectedDropdown)}
                </span>

                {/* Tracking Status Section - Only for mailing with tracker */}
                {actionData.mailing_card && state.metadata?.easypost_tracker_id && (
                  <div
                    style={{
                      marginTop: "10px",
                      paddingTop: "10px",
                      borderTop: "1px solid rgba(21, 116, 79, 0.2)",
                    }}
                  >
                    {/* Top Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginBottom: "4px",
                        fontSize: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Left: Status */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <strong>Tracking Status:</strong>

                        {isLoadingTracking && (
                          <>
                            <Loader
                              size={14}
                              style={{
                                animation: "spin 1s linear infinite",
                              }}
                            />
                            <span>Updating...</span>
                          </>
                        )}

                        {!isLoadingTracking && (
                          <>
                            {getTrackingStatusDisplay(trackingStatus).icon}
                            <span style={{ fontWeight: 600 }}>
                              {getTrackingStatusDisplay(trackingStatus).label}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Right: Refresh Button */}
                      {/* {trackingStatus !== "delivered" && (
                            <button
                              onClick={fetchTrackingStatus}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                border: "1px solid rgba(21, 116, 79, 0.2)",
                                background: "#fff",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget;
                                el.style.background = "#f3f8f5";
                                el.style.transform = "rotate(20deg)";
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget;
                                el.style.background = "#fff";
                                el.style.transform = "rotate(0deg)";
                              }}
                            >
                              <RefreshCw size={14} color={COLORS.green} />
                            </button>
                          )} */}
                    </div>

                    {/* Last Checked */}
                    {trackingLastChecked && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(21, 116, 79, 0.7)",
                          marginBottom: "6px",
                        }}
                      >
                        Last checked: {formatRelativeTime(trackingLastChecked)}
                      </div>
                    )}

                    {/* Update Info */}
                    {trackingStatus !== "delivered" && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "rgba(21, 116, 79, 0.6)",
                          marginBottom: "4px",
                          fontWeight: 500,
                        }}
                      >
                        Updates from the carrier are checked in every 24 hours.
                      </div>
                    )}

                    {/* Delivered Date */}
                    {/* {deliveredAt && trackingStatus === "delivered" && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: COLORS.green,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            <span>
                              Delivered:{" "}
                              {new Date(deliveredAt).toLocaleDateString()}
                            </span>
                          </div>
                        )} */}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Status Message Section End */}
        </section>

        {/* Action Items Section - Enabled appearance */}
        {actionData.action_items && actionData.action_items.length > 0 && (
          <section
            style={{
              marginTop: "16px",
              background: "#fff",
              border: `1px solid ${COLORS.line}`,
              borderRadius: "22px",
              padding: isMobile ? "14px" : "20px",
              boxShadow: "0 8px 22px rgba(12, 27, 51, 0.04)",
            }}
          >
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: COLORS.muted,
                marginBottom: "12px",
              }}
            >
              {actionData.action_items_title || "Before you continue"}
            </h3>

            {actionData.action_items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "14px",
                  background: "#fbfdff",
                  border: `1px solid #e5edf6`,
                  marginTop: idx === 0 ? "0" : "8px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    lineHeight: 1.55,
                    color: COLORS.muted,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "14px",
                      marginBottom: "2px",
                      color: COLORS.navy,
                    }}
                  >
                    {item.title}
                  </strong>
                  <span>{item.description}</span>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Step Guide Overlay */}
      {showGuide &&
        filteredSteps &&
        filteredSteps.length > 0 &&
        createPortal(
          <div className="animate-in slide-in-from-bottom-[18px] fixed inset-0 z-[120] flex flex-col bg-[#fafcff] duration-[0.28s] ease-in-out">
            {/* Guide Topbar */}
            <div className="flex h-[54px] sm:h-[72px] shrink-0 items-center gap-3 sm:gap-4 border-b border-[#d0e4f7] bg-[#fafcff] px-3.5 sm:px-6">
              <button
                onClick={() => setShowGuide(false)}
                className="hover:bg-primary/20 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#f4f7fb] text-[#3a4f63] transition-all"
                aria-label="Close guide"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <div className="bg-primary/30 h-[5px] flex-1 overflow-hidden rounded-[10px]">
                <div
                  className="from-primary to-primary h-full rounded-[10px] bg-linear-to-r transition-all duration-[0.4s] ease-out"
                  style={{
                    width: `${guideProgress * 100}%`,
                  }}
                />
              </div>

              <div className="shrink-0 text-[12px] font-medium whitespace-nowrap text-[#6b8097]">
                {guideStep + 1} / {filteredSteps.length}
              </div>
            </div>

            {/* Guide Body */}
            <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto bg-white p-4 pt-5 sm:p-[48px_24px_40px]">
              <div className="flex w-full max-w-[580px] flex-col">
                {filteredSteps[guideStep] && (
                  <>
                    <div className="text-primary mb-4 text-[11px] font-semibold tracking-widest uppercase">
                      {filteredSteps[guideStep]?.label}
                    </div>

                    <h2 className="mb-2 text-[clamp(20px,3.2vw,26px)] leading-[1.3] font-black text-[#0c1b33]">
                      {filteredSteps[guideStep]?.title}
                    </h2>

                    <div
                      className="mb-5 text-[14px] leading-[1.7] text-[#3a4f63]"
                      dangerouslySetInnerHTML={{
                        __html: filteredSteps[guideStep]?.text || "",
                      }}
                    />

                    {/* Browser Mockup */}
                    <div className="relative mb-5 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                      {filteredSteps[guideStep]?.url && (
                        <div className="flex h-[34px] items-center gap-1.5 border-b border-slate-200/80 bg-[#eef3fa] px-3">
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#f26b6b]" />
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#f5c56a]" />
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#63c48f]" />
                          <div className="ml-2 flex h-5 max-w-[160px] items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-white px-2.5 text-[10px] font-mono text-slate-500 sm:max-w-none">
                            {filteredSteps[guideStep]?.url}
                          </div>
                        </div>
                      )}
                      <div className="relative flex min-h-[200px] sm:min-h-[280px] items-center justify-center bg-gradient-to-b from-[#fcfeff] to-[#f7fbff] p-2 text-slate-400">
                        <div
                          className="flex h-full w-full items-center justify-center"
                          dangerouslySetInnerHTML={{
                            __html: filteredSteps[guideStep]?.visual || "Step visual here",
                          }}
                        />
                      </div>
                    </div>

                    {/* Important Note */}
                    {filteredSteps[guideStep]?.note && (
                      <div className="mb-5 flex items-start gap-3 rounded-[12px] border border-[#f0c878]/50 bg-[#fffdf5] p-3.5 sm:p-4 text-[13px] leading-relaxed text-[#7a5800]">
                        <span className="font-bold shrink-0">Important:</span>
                        <span>{filteredSteps[guideStep]?.note}</span>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-auto flex items-center gap-3 pt-4">
                      {guideStep > 0 && (
                        <button
                          onClick={handlePrevGuide}
                          className="rounded-[14px] border border-slate-200 bg-white px-5 py-3 font-semibold text-[#3a4f63] text-xs sm:text-sm transition-all hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                        >
                          ← Back
                        </button>
                      )}
                      {guideStep < filteredSteps.length - 1 ? (
                        <button
                          onClick={handleNextGuide}
                          className="flex-1 rounded-[14px] bg-[#0d7377] px-6 py-3 text-center text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#095457] hover:-translate-y-px shadow-sm cursor-pointer"
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!stepEntitlement.guard()) return;
                            onToggleComplete();
                            setShowGuide(false);
                          }}
                          className="flex-1 rounded-[14px] bg-[#15744f] px-6 py-3 text-center text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#0e5c3c] hover:-translate-y-px shadow-sm cursor-pointer"
                        >
                          Done, return to step
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Guide Choice Modal for Step 1.11 */}
      {showGuideChoice &&
        createPortal(
          <div
            className="fixed inset-0 z-300 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setShowGuideChoice(false)}
          >
            <div
              className="relative w-full max-w-[440px] rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowGuideChoice(false)}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer border-none"
                aria-label="Close modal"
              >
                <X size={16} strokeWidth={2} />
              </button>

              <div className="text-center mb-6 pr-6 pl-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#0c1b33] mb-1.5 leading-tight">
                  Choose Your Guide
                </h2>
                <p className="text-xs sm:text-sm text-[#6b8097] leading-relaxed">
                  Select how you would like to proceed with your forms
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Print Guide Option */}
                <button
                  onClick={() => {
                    setSelectedGuideType("print");
                    setShowGuideChoice(false);
                    setShowGuide(true);
                  }}
                  className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200/80 bg-white p-4 text-left transition-all hover:border-[#0d7377] hover:bg-teal-50/40 cursor-pointer"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0d7377] transition-colors group-hover:bg-[#0d7377] group-hover:text-white">
                    <Printer size={22} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-sm sm:text-base font-bold text-[#0c1b33] transition-colors group-hover:text-[#0d7377]">
                      View Print Guide
                    </div>
                    <div className="text-xs sm:text-sm text-[#6b8097]">
                      Step-by-step guide to print your forms
                    </div>
                  </div>
                </button>

                {/* Download Guide Option */}
                <button
                  onClick={() => {
                    setSelectedGuideType("download");
                    setShowGuideChoice(false);
                    setShowGuide(true);
                  }}
                  className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200/80 bg-white p-4 text-left transition-all hover:border-[#0d7377] hover:bg-teal-50/40 cursor-pointer"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0d7377] transition-colors group-hover:bg-[#0d7377] group-hover:text-white">
                    <Download size={22} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-sm sm:text-base font-bold text-[#0c1b33] transition-colors group-hover:text-[#0d7377]">
                      View Download Guide
                    </div>
                    <div className="text-xs sm:text-sm text-[#6b8097]">
                      Step-by-step guide to download your forms
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {previewConfig.isOpen && previewConfig.docDef && previewConfig.uploadedDoc && (
        <DocumentPreviewModal
          open={previewConfig.isOpen}
          onClose={() => setPreviewConfig({ ...previewConfig, isOpen: false })}
          documentDef={previewConfig.docDef}
          uploadedDoc={previewConfig.uploadedDoc}
        />
      )}

      {stepEntitlement.upgradeModalFeature && (
        <UpgradeModal
          feature={stepEntitlement.upgradeModalFeature}
          onClose={stepEntitlement.closeUpgradeModal}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          h1 {
            font-size: 34px !important;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
