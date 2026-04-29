"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  AlertCircle,
  Loader,
  CheckCircle,
  Printer,
  Download,
  RefreshCw,
  Lock,
} from "lucide-react";
import { InterviewOutcomeTool } from "./InterviewOutcomeTool";
import { Input221gTool } from "./Input221gTool";
import { useStepEntitlement } from "./useStepEntitlement";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useWizard } from "@/app/(main)/dashboard/hooks/useWizard";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { RoadmapStep } from "../types";
import { DocumentPreviewModal } from "@/app/components/document-vault/DocumentPreviewModal";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { DOCUMENTS_BY_KEY } from "@/lib/document-vault/document-definitions";
import { useToast } from "@/app/components/shared/ToastProvider";
import {
  UploadedDocument,
  DocumentDefinition,
} from "@/lib/document-vault/types";
import { useAuth } from "@/app/context/AuthContext";

interface ActionStepRendererProps {
  step: RoadmapStep;
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
  navy: "#0c1b33",
  ink: "#1c2b3a",
  soft: "#3a4f63",
  muted: "#6b8097",
  line: "#d7e3ef",
  sky: "#e8f1fb",
  accent: "#2f6fd4",
  accent2: "#2460bb",
  green: "#15744f",
  greenbg: "#e8f5ef",
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

export const ActionStepRenderer: React.FC<ActionStepRendererProps> = ({
  step,
  isCompleted,
  state: propsState,
  actions: propsActions,
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
  const [selectedGuideType, setSelectedGuideType] = useState<
    "print" | "download" | null
  >(null);
  const [statusSaved, setStatusSaved] = useState(isCompleted);
  const [selectedDropdown, setSelectedDropdown] = useState("");
  const [mailingCarrier, setMailingCarrier] = useState("");
  const [mailingTracking, setMailingTracking] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isSavingMailing, setIsSavingMailing] = useState(false);
  const [carrierError, setCarrierError] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [isEditingMailing, setIsEditingMailing] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string>("unknown");
  const [trackingLastChecked, setTrackingLastChecked] = useState<string | null>(
    null,
  );
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  const stepEntitlement = useStepEntitlement(step.step_key);

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
      initializeVault(user.id);
    }
  }, [user, hasLoadedDocsInitial, initializeVault]);

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

    const uploadedDoc = uploadedDocuments.find(
      (d) => d.documentDefId === docDef.id,
    );

    if (uploadedDoc) {
      setPreviewConfig({
        isOpen: true,
        docDef,
        uploadedDoc,
      });
    } else {
      showToast(
        "This document is not uploaded in the document vault yet",
        "error",
      );
    }
  };

  // Load persisted data from metadata on mount
  useEffect(() => {
    // Only set statusSaved if data came from DB (already saved)
    if (step.action_data?.dropdown_card) {
      const savedMethod = state.metadata?.paper_payment_method;
      if (savedMethod) {
        setSelectedDropdown(savedMethod);
        setStatusSaved(true);
      } else {
        setStatusSaved(false);
      }
    }

    if (step.action_data?.mailing_card) {
      const savedCarrier = state.metadata?.paper_mailing_carrier;
      const savedTracking = state.metadata?.paper_mailing_tracking;
      if (savedCarrier) setMailingCarrier(savedCarrier);
      if (savedTracking) setMailingTracking(savedTracking);
      // Only show saved if both exist from database
      if (savedCarrier && savedTracking) {
        setStatusSaved(true);
      } else {
        setStatusSaved(false);
      }
    }
  }, [
    step.action_data?.dropdown_card,
    step.action_data?.mailing_card,
    state.metadata,
  ]);

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

  // Reset guideStep when selectedGuideType changes
  useEffect(() => {
    setGuideStep(0);
  }, [selectedGuideType]);

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
      const response = await fetch(
        `/api/easypost/tracker/status?caseId=${state.backendId}`,
      );

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

      console.log(
        `[Tracking] Polling started: ${delay / 1000 / 60} min interval`,
      );

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
                setTrackingStatus(newStatus);

                // Adjust polling dynamically
                startPolling(newStatus);
              }

              // LAST CHECKED
              if (updatedRow.data_key === "tracking_last_checked_at") {
                setTrackingLastChecked(updatedRow.data_value);
              }

              // DELIVERED TIME
              if (updatedRow.data_key === "delivered_at") {
                setDeliveredAt(updatedRow.data_value);
              }
            },
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
  }, [
    state.metadata?.easypost_tracker_id,
    state.backendId,
    fetchTrackingStatus,
    isEditingMailing,
  ]);

  const handlePrevGuide = () => {
    setGuideStep((prev) => Math.max(0, prev - 1));
  };

  const handleNextGuide = () => {
    setGuideStep((prev) => prev + 1);
  };

  // Validation functions for mailing inputs
  const validateCarrier = (value: string): string => {
    if (!value.trim()) {
      return "Carrier name is required";
    }
    if (value.trim().length < 2) {
      return "Carrier name must be at least 2 characters";
    }
    return "";
  };

  const validateTracking = (value: string): string => {
    if (!value.trim()) {
      return "Tracking number is required";
    }
    if (value.trim().length < 3) {
      return "Tracking number must be at least 3 characters";
    }
    // Allow alphanumeric and common separators
    if (!/^[a-zA-Z0-9\-\s]*$/.test(value.trim())) {
      return "Tracking number can only contain letters, numbers, dashes, and spaces";
    }
    return "";
  };

  const handleSaveMailing = async () => {
    // Validate carrier
    const carrierErr = validateCarrier(mailingCarrier);
    if (carrierErr) {
      setCarrierError(carrierErr);
    }

    // Validate tracking
    const trackingErr = validateTracking(mailingTracking);
    if (trackingErr) {
      setTrackingError(trackingErr);
    }

    if (!stepEntitlement.guard()) return;

    if (!actions?.saveMailingDetails) {
      console.error(
        "[ActionStepRenderer] saveMailingDetails not available in actions",
      );
      return;
    }

    setIsSavingMailing(true);
    try {
      // Save to database via wizard actions and wait for completion
      await actions.saveMailingDetails(mailingCarrier, mailingTracking);
      // Only show saved status after successful API call
      setStatusSaved(true);
      showToast("Mailing details saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save mailing details:", error);
      setStatusSaved(false);
      showToast("Failed to save mailing details", "error");
    } finally {
      setIsSavingMailing(false);
      // Re-enable tracking updates after save completes
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
    if (step.step_key === "step_1_11" && selectedGuideType) {
      return actionData.guide_steps.filter((gs: any) =>
        gs.label?.includes(
          selectedGuideType === "print" ? "Print" : "Download",
        ),
      );
    }
    return actionData.guide_steps || [];
  };

  const filteredSteps = getFilteredGuideSteps();
  const guideProgress = guideStep / (filteredSteps?.length || 1);

  // Determine if info-cards section should use 2 cols or 1 col
  const hasSecondCard = actionData.dropdown_card || actionData.mailing_card;

  return (
    <div
      className={`min-h-screen${isChapter3 ? " ch3step-bg" : ""}`}
      style={
        isChapter3
          ? {
              backgroundImage: "url('/assets/images/ch3steps-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
              minHeight: "100vh",
            }
          : undefined
      }
    >
      {/* Main Content */}
      <div className="max-w-3xl w-full mx-auto px-2 sm:px-4 md:px-8 pt-6 sm:pt-10 md:pt-14 pb-8 md:pb-12 flex flex-col gap-3 step step-modal-spacing">
        {/* Eyebrow for Paper Filing Path steps */}
        {(step.step_key === "step_1_11" || 
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
            Chapter 1 · Chapter 1: USCIS Petition Filing
            <span className="text-[#BDD7F1] mx-2">&gt;</span>
            <span className="text-[#3B7DD8]">{step.step_name}</span>
          </div>
        )}
        {/* Title */}
        <h1
          className={`page-title text-[clamp(30px,4.6vw,40px)] accent-brown leading-[1.12] tracking-tight mb-1 ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#27192e]" : "text-navy"}`}
        >
          {step.step_name}
        </h1>

        {/* Subtitle */}
        <p
          className={`page-desc text-[15px] md:text-[16px] leading-[1.7] max-w-full md:max-w-[560px] mb-6 ${isChapter1 ? "accent-brown" : isChapter2 ? "text-[#b48ad6]" : "text-soft"}`}
        >
          {step.step_description}
        </p>

        {/* Chips - Full background colors */}
        {actionData.chips && actionData.chips.length > 0 && (
          <div
            className={`flex flex-wrap gap-2 mb-6 ${isChapter1 ? "accent-rose" : isChapter2 ? "accent-purple" : ""}`}
          >
            {actionData.chips.map((chip, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full border ${isChapter1 ? "accent-rose-bg border-rose-200 text-[#ffff]" : isChapter2 ? "accent-purple-bg border-[#e3c6f7] text-[#b48ad6]" : "bg-[#e8f1fb] border-[#d0e4f7] text-[#2f6fd4]"}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        {/* Hero Section */}
        <section
          style={{
            background:
              step.step_key === "step_1_11"
                ? "linear-gradient(180deg, #28151c 0%, #28151c 100%)"
                : "linear-gradient(180deg, #122541 0%, #0f2038 100%)",
            color: "#fff",
            borderRadius: "24px",
            padding: isMobile ? "16px" : "24px",
            boxShadow: "0 18px 48px rgba(12, 27, 51, 0.12)",
            marginBottom: "16px",
          }}
        >
          {/* Heading */}
          <h2
            style={{
              fontSize: isMobile ? "22px" : "28px",
              lineHeight: 1.15,
              marginBottom: "6px",
              fontWeight: 700,
              color: step.step_key === "step_1_11" ? "#c0596a" : undefined,
            }}
          >
            {actionData.hero_heading}
          </h2>

          {/* Description */}
          {actionData.hero_description && (
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.65,
                color:
                  step.step_key === "step_1_11"
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.74)",
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
                padding: "8px 12px",
                borderRadius: "999px",
                background:
                  step.step_key === "step_1_11"
                    ? "#fff"
                    : "rgba(255, 255, 255, 0.08)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginTop: "10px",
                marginBottom: "12px",
                color: step.step_key === "step_1_11" ? "#7c4b26" : "#fff",
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
                    lineHeight: 1.45,
                    color: "rgba(255, 255, 255, 0.82)",
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Primary CTA Button */}
          {step.step_key === "step_1_11" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
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
                  background: stepEntitlement.isLocked ? "#4a5568" : "#c0596a",
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
                  if (!stepEntitlement.isLocked) (e.target as HTMLElement).style.background = "#a94c5a";
                }}
                onMouseLeave={(e) => {
                  if (!stepEntitlement.isLocked) (e.target as HTMLElement).style.background = "#c0596a";
                }}
              >
                {stepEntitlement.isLocked && <Lock size={18} className="mr-2 opacity-80" />}
                Print I-130
              </button>
              <button
                onClick={() => {
                  if (!stepEntitlement.guard()) return;
                  handlePreview("I130A_FORM");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  background: stepEntitlement.isLocked ? "#4a5568" : "#c0596a",
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
                  if (!stepEntitlement.isLocked) (e.target as HTMLElement).style.background = "#a94c5a";
                }}
                onMouseLeave={(e) => {
                  if (!stepEntitlement.isLocked) (e.target as HTMLElement).style.background = "#c0596a";
                }}
              >
                {stepEntitlement.isLocked && <Lock size={18} className="mr-2 opacity-80" />}
                Print I-130A
              </button>
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
                  background:
                    stepEntitlement.isLocked ? "#4a5568" : (step.step_key === "step_1_11" ? "#c0596a" : COLORS.accent),
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
                      step.step_key === "step_1_11" ? "#a94c5a" : COLORS.accent2;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!stepEntitlement.isLocked) {
                    (e.target as HTMLElement).style.background =
                      step.step_key === "step_1_11" ? "#c0596a" : COLORS.accent;
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
              gridTemplateColumns:
                hasSecondCard && !isMobile ? "1fr 1fr" : "1fr",
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
              }}
            >
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
                {actionData.guide_card?.subtitle ||
                  "View guidance for this step"}
              </p>

              <button
                onClick={() => {
                  if (!stepEntitlement.guard()) return;
                  if (step.step_key === "step_1_11") {
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
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "6px",
                    color: COLORS.navy,
                    fontWeight: 700,
                  }}
                >
                  {actionData.second_card_title ||
                    actionData.dropdown_card.title}
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: COLORS.muted,
                    marginBottom: "14px",
                  }}
                >
                  {actionData.second_card_subtitle ||
                    actionData.dropdown_card.subtitle}
                </p>

                <CustomDropdown
                  options={(
                    actionData.dropdown_card.dropdown_options || []
                  ).filter((opt) => opt.value !== "")}
                  value={selectedDropdown}
                  onChange={async (value) => {
                    if (!value) return;
                    if (!stepEntitlement.guard()) return;

                    if (!actions?.savePaymentMethod) {
                      console.error(
                        "[ActionStepRenderer] savePaymentMethod not available in actions",
                      );
                      return;
                    }

                    setIsSavingPayment(true);
                    try {
                      await actions.savePaymentMethod(value);
                      setSelectedDropdown(value);
                      setStatusSaved(true);
                    } catch (error) {
                      console.error("Failed to save payment method:", error);
                      setStatusSaved(false);
                    } finally {
                      setIsSavingPayment(false);
                    }
                  }}
                  placeholder="Select option"
                />
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
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "6px",
                    color: COLORS.navy,
                    fontWeight: 700,
                  }}
                >
                  {actionData.second_card_title ||
                    actionData.mailing_card.title}
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: COLORS.muted,
                    marginBottom: "14px",
                  }}
                >
                  {actionData.second_card_subtitle ||
                    actionData.mailing_card.subtitle}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Carrier Input */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
                        actionData.mailing_card.carrier_placeholder ||
                        "Carrier (USPS, UPS, FedEx)"
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
                        boxShadow: carrierError
                          ? "0 0 0 3px rgba(239, 68, 68, 0.12)"
                          : "none",
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
                        e.currentTarget.style.borderColor = carrierError
                          ? "#ef4444"
                          : COLORS.line;
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
                        actionData.mailing_card.tracking_placeholder ||
                        "Tracking number"
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
                        boxShadow: trackingError
                          ? "0 0 0 3px rgba(239, 68, 68, 0.12)"
                          : "none",
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
                        e.currentTarget.style.borderColor = trackingError
                          ? "#ef4444"
                          : COLORS.line;
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
                      : actionData.action_button_label ||
                        "Save mailing details"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Status Message (for dropdown or mailing) */}
          {statusSaved &&
            (actionData.dropdown_card || actionData.mailing_card) && (
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
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  {/* Common Heading */}
                  <strong style={{ display: "block" }}>
                    {actionData.action_button_status_heading ||
                      "Selection saved"}
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
                      ? (
                          actionData.action_button_status_message ||
                          "Delivery details saved."
                        )
                          .replace("{carrier}", mailingCarrier)
                          .replace("{tracking}", mailingTracking)
                      : (
                          actionData.action_button_status_message ||
                          "Saved selection: {selected}."
                        )
                          .replace("{selected}", selectedDropdown)
                          .replace("{selected_method}", selectedDropdown)}
                  </span>

                  {/* Tracking Status Section - Only for mailing with tracker */}
{actionData.mailing_card &&
  state.metadata?.easypost_tracker_id && (
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                                  {
                                    getTrackingStatusDisplay(trackingStatus)
                                      .label
                                  }
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
                            Last checked:{" "}
                            {formatRelativeTime(trackingLastChecked)}
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

      {/* Full-Screen Guide Modal */}
      {showGuide && filteredSteps && filteredSteps.length > 0 && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            inset: 0,
            background: "#fafcff",
            zIndex: 200,
            flexDirection: "column",
            animation: "fadeIn 0.3s ease",
          }}
          className="px-2 sm:px-4 md:px-8 pt-6 sm:pt-10 md:pt-14"
        >
          {/* Topbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "72px",
              borderBottom: `1px solid ${COLORS.line}`,
              paddingLeft: isMobile ? "12px" : "20px",
              paddingRight: isMobile ? "12px" : "20px",
              gap: "16px",
              flexShrink: 0,
              background: "#fafcff",
            }}
          >
            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#f4f7fb",
                border: "none",
                cursor: "pointer",
                color: COLORS.soft,
                fontSize: "20px",
                fontWeight: "bold",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "#e8f1fb";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "#f4f7fb";
              }}
            >
              ×
            </button>

            <div
              style={{
                flex: 1,
                height: "6px",
                background: "#d0e4f7",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${COLORS.accent}, #69a5ef)`,
                  width: `${guideProgress * 100}%`,
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: COLORS.muted,
                minWidth: "60px",
                textAlign: "right",
              }}
            >
              {guideStep + 1} / {filteredSteps?.length || 0}
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#fafcff",
              padding: isMobile ? "24px 16px 32px" : "48px 24px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                maxWidth: "580px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {filteredSteps[guideStep] && (
                <>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: COLORS.accent,
                      marginBottom: "12px",
                    }}
                  >
                    {filteredSteps[guideStep]?.label}
                  </div>

                  <h2
                    style={{
                      fontSize: isMobile ? "20px" : "clamp(20px, 3.2vw, 26px)",
                      fontWeight: 900,
                      color: COLORS.navy,
                      marginBottom: "10px",
                      lineHeight: 1.3,
                    }}
                  >
                    {filteredSteps[guideStep]?.title}
                  </h2>

                  <div
                    style={{
                      fontSize: "14px",
                      color: COLORS.soft,
                      lineHeight: 1.7,
                      marginBottom: "18px",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: filteredSteps[guideStep]?.text || "",
                    }}
                  />

                  {/* Browser mockup */}
                  <div
                    style={{
                      border: `1.5px solid ${COLORS.line}`,
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "#fff",
                      boxShadow: "0 14px 32px rgba(12, 27, 51, 0.08)",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        height: "34px",
                        background: "#eef3fa",
                        borderBottom: `1px solid ${COLORS.line}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        paddingLeft: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: "#f26b6b",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: "#f5c56a",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: "#63c48f",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          marginLeft: "8px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "10px",
                          paddingRight: "10px",
                          background: "#fff",
                          borderRadius: "8px",
                          fontSize: "10px",
                          color: COLORS.muted,
                          fontFamily: "monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: isMobile ? "160px" : "none",
                        }}
                      >
                        {filteredSteps[guideStep]?.url}
                      </div>
                    </div>
                    <div
                      style={{
                        minHeight: isMobile ? "200px" : "280px",
                        background:
                          "linear-gradient(180deg, #fcfeff 0%, #f7fbff 100%)",
                        color: COLORS.muted,
                        fontSize: "13px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        dangerouslySetInnerHTML={{
                          __html:
                            filteredSteps[guideStep]?.visual ||
                            "Step visual here",
                        }}
                      />
                    </div>
                  </div>

                  {/* Note */}
                  {filteredSteps[guideStep]?.note && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "#fef8e8",
                        border: "1px solid #f0d98a",
                        color: "#8a6200",
                        fontSize: "13px",
                        lineHeight: 1.55,
                        marginBottom: "20px",
                      }}
                    >
                      <strong>Important:</strong>{" "}
                      {filteredSteps[guideStep]?.note}
                    </div>
                  )}

                  {/* Navigation */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "auto",
                    }}
                  >
                    {guideStep > 0 && (
                      <button
                        onClick={handlePrevGuide}
                        style={{
                          padding: "12px 20px",
                          background: "transparent",
                          color: COLORS.soft,
                          border: `1.5px solid ${COLORS.line}`,
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          const ele = e.target as HTMLElement;
                          ele.style.borderColor = COLORS.soft;
                          ele.style.color = COLORS.navy;
                        }}
                        onMouseLeave={(e) => {
                          const ele = e.target as HTMLElement;
                          ele.style.borderColor = COLORS.line;
                          ele.style.color = COLORS.soft;
                        }}
                      >
                        ← Back
                      </button>
                    )}
                    {guideStep < (filteredSteps?.length || 0) - 1 ? (
                      <button
                        onClick={handleNextGuide}
                        style={{
                          flex: 1,
                          padding: "12px 20px",
                          background: COLORS.accent,
                          border: "none",
                          borderRadius: "10px",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          fontFamily: "inherit",
                          textAlign: "center",
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.background =
                            COLORS.accent2;
                          (e.target as HTMLElement).style.transform =
                            "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.background =
                            COLORS.accent;
                          (e.target as HTMLElement).style.transform =
                            "translateY(0)";
                        }}
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowGuide(false)}
                        style={{
                          flex: 1,
                          padding: "12px 20px",
                          background: COLORS.green,
                          border: "none",
                          borderRadius: "10px",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          fontFamily: "inherit",
                          textAlign: "center",
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.background =
                            "#0e5c3c";
                          (e.target as HTMLElement).style.transform =
                            "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.background =
                            COLORS.green;
                          (e.target as HTMLElement).style.transform =
                            "translateY(0)";
                        }}
                      >
                        Done — return to step
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guide Choice Modal for Step 1.11 */}
      {showGuideChoice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            padding: isMobile ? "16px" : "0",
          }}
          onClick={() => setShowGuideChoice(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: isMobile ? "24px 20px" : "40px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(12, 27, 51, 0.16)",
              animation: "slideUp 0.3s ease",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: isMobile ? "22px" : "26px",
                  fontWeight: 900,
                  color: COLORS.navy,
                  marginBottom: "12px",
                  lineHeight: 1.3,
                }}
              >
                Choose Your Guide
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: COLORS.soft,
                  lineHeight: 1.6,
                }}
              >
                Select how you would like to proceed with your forms
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Print Guide Option */}
              <button
                onClick={() => {
                  setSelectedGuideType("print");
                  setShowGuideChoice(false);
                  setShowGuide(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: isMobile ? "14px 16px" : "18px 20px",
                  background: "#fff",
                  border: `2px solid ${COLORS.line}`,
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor = COLORS.accent;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = COLORS.line;
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: COLORS.sky,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Printer size={24} color={COLORS.accent} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: COLORS.navy,
                      marginBottom: "2px",
                    }}
                  >
                    View Print Guide
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: COLORS.muted,
                    }}
                  >
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: isMobile ? "14px 16px" : "18px 20px",
                  background: "#fff",
                  border: `2px solid ${COLORS.line}`,
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor = COLORS.accent;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = COLORS.line;
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: COLORS.sky,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Download size={24} color={COLORS.accent} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: COLORS.navy,
                      marginBottom: "2px",
                    }}
                  >
                    View Download Guide
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: COLORS.muted,
                    }}
                  >
                    Step-by-step guide to download your forms
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {previewConfig.isOpen &&
        previewConfig.docDef &&
        previewConfig.uploadedDoc && (
          <DocumentPreviewModal
            open={previewConfig.isOpen}
            onClose={() =>
              setPreviewConfig({ ...previewConfig, isOpen: false })
            }
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