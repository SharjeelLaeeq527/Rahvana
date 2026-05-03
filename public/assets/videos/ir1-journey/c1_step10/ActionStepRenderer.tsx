"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  AlertCircle,
  Loader,
  CheckCircle,
} from "lucide-react";
import { useWizard } from "@/app/(main)/dashboard/hooks/useWizard";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { RoadmapStep } from "../types";

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

// Per-chapter theme tokens
const CHAPTER_THEME = {
  ch1: {
    heroBg: "linear-gradient(180deg, #28151c 0%, #1e0f15 100%)",
    heroAccent: "#c0596a",
    heroAccentLight: "rgba(192,89,106,0.18)",
    chipBg: "#fbeaec",
    chipBorder: "#f0c0c8",
    chipText: "#c0596a",
    titleClass: "accent-brown",
    subtitleClass: "accent-brown",
    chipsClass: "accent-rose",
    chipItemClass: "accent-rose-bg border-rose-200 text-[#c0596a]",
    guideBtn: "#fbeaec",
    guideBtnText: "#28151c",
    statusBg: "#fbeaec",
    statusBorder: "#f0c0c8",
    statusColor: "#c0596a",
    // bgClass: "ch1step-bg",
  },
  ch2: {
    heroBg: "linear-gradient(180deg, #1e0f2e 0%, #180b28 100%)",
    heroAccent: "#865aa7",
    heroAccentLight: "rgba(134,90,167,0.18)",
    chipBg: "#f3f0fb",
    chipBorder: "#c9bef2",
    chipText: "#865aa7",
    titleClass: "text-[#27192e]",
    subtitleClass: "text-[#b48ad6]",
    chipsClass: "accent-purple",
    chipItemClass: "bg-[#f3f0fb] border-[#c9bef2] text-[#865aa7]",
    guideBtn: "#f3f0fb",
    guideBtnText: "#27192e",
    statusBg: "#f3f0fb",
    statusBorder: "#c9bef2",
    statusColor: "#865aa7",
    // bgClass: "ch2step-bg",
  },
  ch3: {
    heroBg: "linear-gradient(180deg, #0c2620 0%, #081e19 100%)",
    heroAccent: "#2a7a6b",
    heroAccentLight: "rgba(42,122,107,0.18)",
    chipBg: "#e8f5f3",
    chipBorder: "#9fd0ca",
    chipText: "#2a7a6b",
    titleClass: "text-[#0d2922]",
    subtitleClass: "text-[#4aaa99]",
    chipsClass: "",
    chipItemClass: "bg-[#e8f5f3] border-[#9fd0ca] text-[#2a7a6b]",
    guideBtn: "#e8f5f3",
    guideBtnText: "#0d2922",
    statusBg: "#e8f5f3",
    statusBorder: "#9fd0ca",
    statusColor: "#2a7a6b",
    // bgClass: "ch3step-bg",
  },
  default: {
    heroBg: "linear-gradient(180deg, #122541 0%, #0f2038 100%)",
    heroAccent: "#2f6fd4",
    heroAccentLight: "rgba(47,111,212,0.18)",
    chipBg: "#e8f1fb",
    chipBorder: "#d0e4f7",
    chipText: "#2f6fd4",
    titleClass: "text-navy",
    subtitleClass: "text-soft",
    chipsClass: "",
    chipItemClass: "bg-[#e8f1fb] border-[#d0e4f7] text-[#2f6fd4]",
    guideBtn: "#e8f1fb",
    guideBtnText: "#1a3054",
    statusBg: COLORS.greenbg,
    statusBorder: "#b8dbc8",
    statusColor: COLORS.green,
    bgClass: "",
  },
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

// Helper: Get tracking status icon and color
const getTrackingStatusDisplay = (status: string) => {
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

  return (
    statusMap[status] || {
      icon: <Loader size={16} />,
      label: status,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
    }
  );
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

  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [statusSaved, setStatusSaved] = useState(isCompleted);
  const [selectedDropdown, setSelectedDropdown] = useState("");
  const [mailingCarrier, setMailingCarrier] = useState("");
  const [mailingTracking, setMailingTracking] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isSavingMailing, setIsSavingMailing] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string>("unknown");
  const [trackingLastChecked, setTrackingLastChecked] = useState<string | null>(null);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  // Resolve active theme
  const theme = isChapter1
    ? CHAPTER_THEME.ch1
    : isChapter2
    ? CHAPTER_THEME.ch2
    : isChapter3
    ? CHAPTER_THEME.ch3
    : CHAPTER_THEME.default;

  // Load persisted data from metadata on mount
  useEffect(() => {
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
      if (savedCarrier && savedTracking) {
        setStatusSaved(true);
      } else {
        setStatusSaved(false);
      }
    }
  }, [step.action_data?.dropdown_card, step.action_data?.mailing_card, state.metadata]);

  useEffect(() => {
    if (showGuide) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showGuide]);

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

  // Fetch tracking status periodically when tracker exists
  useEffect(() => {
    if (!state.metadata?.easypost_tracker_id || trackingStatus === "delivered") {
      return;
    }

    const fetchTrackingStatus = async () => {
      try {
        setIsLoadingTracking(true);
        const response = await fetch(
          `/api/easypost/tracker/status?caseId=${state.backendId}`
        );
        if (!response.ok) return;
        const data = await response.json();
        setTrackingStatus(data.status);
        setTrackingLastChecked(data.lastChecked);
        if (data.deliveredAt) setDeliveredAt(data.deliveredAt);
      } catch (error) {
        console.error("[ActionStepRenderer] Error fetching tracking:", error);
      } finally {
        setIsLoadingTracking(false);
      }
    };

    fetchTrackingStatus();
    const pollInterval = 5 * 60 * 1000;
    const intervalId = setInterval(fetchTrackingStatus, pollInterval);
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [state.metadata?.easypost_tracker_id, state.backendId, trackingStatus]);

  const handlePrevGuide = () => setGuideStep((prev) => Math.max(0, prev - 1));
  const handleNextGuide = () => setGuideStep((prev) => prev + 1);

  const handleSaveMailing = async () => {
    if (!mailingCarrier.trim() || !mailingTracking.trim()) return;
    if (!actions?.saveMailingDetails) return;
    setIsSavingMailing(true);
    try {
      await actions.saveMailingDetails(mailingCarrier, mailingTracking);
      setStatusSaved(true);
    } catch (error) {
      console.error("Failed to save mailing details:", error);
      setStatusSaved(false);
    } finally {
      setIsSavingMailing(false);
    }
  };

  if (!step.action_data) {
    return <div>No action data available for this step</div>;
  }

  const actionData = step.action_data;
  const guideProgress = guideStep / (actionData.guide_steps?.length || 1);

  return (
    <div className={`min-h-screen relative ${theme.bgClass}`}>
      {/* Chapter background image overlay (ch2 / ch3) */}
      {(isChapter2 || isChapter3) && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          // style={{
          //   backgroundImage: isChapter2
          //     ? "url(/assets/images/ch2steps-bg.png)"
          //     : "url(/assets/images/ch3steps-bg.png)",
          //   opacity: 0.5,
          // }}
        />
      )}

      {/* Main Content */}
      <div className={`max-w-3xl mx-auto px-4 sm:px-5 md:px-5.5 py-8 sm:py-10 md:py-12 ${isChapter1 || isChapter2 || isChapter3 ? "step-modal-spacing" : ""} relative z-10`}>

        {/* Eyebrow for Paper Filing Path steps */}
        {(step.step_key === "step_1_11" ||
          step.step_key === "step_1_12" ||
          step.step_key === "step_1_13" ||
          step.step_key === "step_1_14") && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-soft mb-2 text-[#636B97]">
            Chapter 1 : USCIS Petition Filing{" "}
            <span className="text-[#BDD7F1] mx-2">&gt;</span>{" "}
            <span className="text-[#3B7DD8]">{step.step_name}</span>
          </div>
        )}

        {/* Title */}
        <h1 className={`text-3xl sm:text-4xl leading-tight font-black -tracking-wide mb-3 ${theme.titleClass}`}>
          {step.step_name}
        </h1>

        {/* Subtitle */}
        <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mb-5 sm:mb-5.5 ${theme.subtitleClass}`}>
          {step.step_description}
        </p>

        {/* Chips */}
        {actionData.chips && actionData.chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {actionData.chips.map((chip, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full border ${theme.chipItemClass}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        {/* Hero Section */}
        <section
          style={{
            background: theme.heroBg,
            color: "#fff",
            borderRadius: "24px",
            padding: "clamp(16px, 4vw, 24px)",
            boxShadow: "0 18px 48px rgba(12, 27, 51, 0.12)",
            marginBottom: "16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Accent stripe at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, ${theme.heroAccent} 0%, transparent 100%)`,
            }}
          />

          {/* Heading */}
          <h2 style={{ fontSize: "clamp(20px, 5vw, 28px)", lineHeight: 1.15, marginBottom: "6px", fontWeight: 700 }}>
            {actionData.hero_heading}
          </h2>

          {/* Description */}
          {actionData.hero_description && (
            <p style={{ fontSize: "clamp(13px, 3vw, 14px)", lineHeight: 1.65, color: "rgba(255,255,255,0.74)" }}>
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
                background: `${theme.heroAccentLight}`,
                border: `1px solid ${theme.heroAccent}40`,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginTop: "10px",
                marginBottom: "12px",
                color: "#fff",
              }}
            >
              {actionData.badge}
            </div>
          )}

          {/* Action Tips Grid — 1 col on mobile, 2 col on sm+ */}
          {actionData.action_tips && actionData.action_tips.length > 0 && (
            <div
              className="action-tips-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                gap: "10px",
                margin: "18px 0",
              }}
            >
              {actionData.action_tips.map((tip, idx) => (
                <div
                  key={idx}
                  style={{
                    background: `${theme.heroAccentLight}`,
                    border: `1px solid ${theme.heroAccent}30`,
                    padding: "12px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    lineHeight: 1.45,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* Primary CTA Button */}
          {actionData.cta_button && actionData.cta_button.href && (
            <button
              onClick={() => {
                if (actionData.cta_button?.href) {
                  window.open(actionData.cta_button.href, "_blank");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                background: theme.heroAccent,
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "15px 18px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                marginTop: "12px",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "0.88"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
            >
              {actionData.cta_button.label}
            </button>
          )}

          {/* Info Cards Row — stacks to 1 col on mobile, 2 col when secondary card present on sm+ */}
          <section className={`info-cards-section${(actionData.dropdown_card || actionData.mailing_card) ? " has-two-cards" : ""}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
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
                padding: "clamp(14px, 4vw, 18px)",
                boxShadow: "0 8px 20px rgba(12, 27, 51, 0.04)",
              }}
            >
              <h3 style={{ fontSize: "16px", marginBottom: "6px", color: COLORS.navy, fontWeight: 700 }}>
                {actionData.guide_card?.title || "Step Guide"}
              </h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: COLORS.muted, marginBottom: "14px" }}>
                {actionData.guide_card?.subtitle || "View guidance for this step"}
              </p>
              <button
                onClick={() => setShowGuide(true)}
                style={{
                  width: "100%",
                  background: theme.guideBtn,
                  color: theme.guideBtnText,
                  border: `1px solid ${theme.chipBorder}`,
                  borderRadius: "14px",
                  padding: "15px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "0.8"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
              >
                {actionData.guide_button_label || "View Guide"}
              </button>
            </div>

            {/* Dropdown Card */}
            {actionData.dropdown_card && (
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: "20px",
                  padding: "clamp(14px, 4vw, 18px)",
                  boxShadow: "0 8px 20px rgba(12, 27, 51, 0.04)",
                }}
              >
                <h3 style={{ fontSize: "16px", marginBottom: "6px", color: COLORS.navy, fontWeight: 700 }}>
                  {actionData.second_card_title || actionData.dropdown_card.title}
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: COLORS.muted, marginBottom: "14px" }}>
                  {actionData.second_card_subtitle || actionData.dropdown_card.subtitle}
                </p>
                <CustomDropdown
                  options={(actionData.dropdown_card.dropdown_options || []).filter((opt) => opt.value !== "")}
                  value={selectedDropdown}
                  onChange={async (value) => {
                    if (!value) return;
                    if (!actions?.savePaymentMethod) return;
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

            {/* Mailing Card */}
            {actionData.mailing_card && !actionData.dropdown_card && (
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: "20px",
                  padding: "clamp(14px, 4vw, 18px)",
                  boxShadow: "0 8px 20px rgba(12, 27, 51, 0.04)",
                }}
              >
                <h3 style={{ fontSize: "16px", marginBottom: "6px", color: COLORS.navy, fontWeight: 700 }}>
                  {actionData.second_card_title || actionData.mailing_card.title}
                </h3>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: COLORS.muted, marginBottom: "14px" }}>
                  {actionData.second_card_subtitle || actionData.mailing_card.subtitle}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder={actionData.mailing_card.carrier_placeholder || "Carrier (USPS, UPS, FedEx)"}
                    value={mailingCarrier}
                    onChange={(e) => setMailingCarrier(e.target.value)}
                    style={{
                      padding: "12px 14px",
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      transition: "border-color 0.2s",
                      color: COLORS.ink,
                      background: "#fff",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = theme.heroAccent; }}
                    onBlur={(e) => { e.target.style.borderColor = COLORS.line; }}
                  />
                  <input
                    type="text"
                    placeholder={actionData.mailing_card.tracking_placeholder || "Tracking number"}
                    value={mailingTracking}
                    onChange={(e) => setMailingTracking(e.target.value)}
                    style={{
                      padding: "12px 14px",
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      transition: "border-color 0.2s",
                      color: COLORS.ink,
                      background: "#fff",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = theme.heroAccent; }}
                    onBlur={(e) => { e.target.style.borderColor = COLORS.line; }}
                  />
                  <button
                    onClick={handleSaveMailing}
                    disabled={!mailingCarrier.trim() || !mailingTracking.trim() || isSavingMailing}
                    style={{
                      width: "100%",
                      background: theme.guideBtn,
                      color: theme.guideBtnText,
                      border: `1px solid ${theme.chipBorder}`,
                      borderRadius: "14px",
                      padding: "15px 18px",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: mailingCarrier.trim() && mailingTracking.trim() && !isSavingMailing ? "pointer" : "not-allowed",
                      opacity: mailingCarrier.trim() && mailingTracking.trim() && !isSavingMailing ? 1 : 0.6,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {isSavingMailing ? "Saving..." : (actionData.action_button_label || "Save mailing details")}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Status Message */}
          {statusSaved && (actionData.dropdown_card || actionData.mailing_card) && (
            <section
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                background: theme.statusBg,
                border: `1px solid ${theme.statusBorder}`,
                borderRadius: "14px",
                padding: "14px 16px",
                color: theme.statusColor,
                fontSize: "13px",
                marginTop: "12px",
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block" }}>
                  {actionData.action_button_status_heading || "Selection saved"}
                </strong>
                <span style={{ fontSize: "12px", display: "block", marginBottom: "8px", wordBreak: "break-word" }}>
                  {actionData.mailing_card && mailingTracking
                    ? (actionData.action_button_status_message || "Delivery details saved.")
                        .replace("{carrier}", mailingCarrier)
                        .replace("{tracking}", mailingTracking)
                    : (actionData.action_button_status_message || "Saved selection: {selected}.")
                        .replace("{selected}", selectedDropdown)
                        .replace("{selected_method}", selectedDropdown)}
                </span>

                {/* Tracking Status Section */}
                {actionData.mailing_card && state.metadata?.easypost_tracker_id && (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${theme.statusColor}30` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "12px", flexWrap: "wrap" }}>
                      <strong>Tracking Status:</strong>
                      {isLoadingTracking && (
                        <>
                          <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
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
                    {trackingLastChecked && (
                      <div style={{ fontSize: "11px", color: `${theme.statusColor}90`, marginBottom: "4px" }}>
                        Last checked: {formatRelativeTime(trackingLastChecked)}
                      </div>
                    )}
                    {deliveredAt && trackingStatus === "delivered" && (
                      <div style={{ fontSize: "11px", fontWeight: 600, color: theme.statusColor }}>
                        ✅ Delivered: {new Date(deliveredAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </section>

        {/* Action Items Section */}
        {actionData.action_items && actionData.action_items.length > 0 && (
          <section
            style={{
              marginTop: "16px",
              background: "#fff",
              border: `1px solid ${COLORS.line}`,
              borderRadius: "22px",
              padding: "clamp(14px, 4vw, 20px)",
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
                <div style={{ flex: 1, fontSize: "13px", lineHeight: 1.55, color: COLORS.muted, minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: "14px", marginBottom: "2px", color: COLORS.navy }}>
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
      {showGuide && actionData.guide_steps && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            inset: 0,
            background: "#fafcff",
            zIndex: 200,
            flexDirection: "column",
            animation: "fadeIn 0.3s ease",
          }} guide-bg
        >
          {/* Topbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "72px",
              borderBottom: `1px solid ${COLORS.line}`,
              paddingLeft: "clamp(12px, 4vw, 20px)",
              paddingRight: "clamp(12px, 4vw, 20px)",
              gap: "12px",
              flexShrink: 0,
              background: "#fafcff",
            }}
          >
            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: "36px",
                height: "36px",
                minWidth: "36px",
                borderRadius: "50%",
                background: "#f4f7fb",
                border: "none",
                cursor: "pointer",
                color: COLORS.soft,
                fontSize: "20px",
                fontWeight: "bold",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = theme.guideBtn; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#f4f7fb"; }}
            >
              ×
            </button>

            <div style={{ flex: 1, height: "6px", background: "#d0e4f7", borderRadius: "10px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${theme.heroAccent}, ${theme.heroAccent}99)`,
                  width: `${guideProgress * 100}%`,
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>

            <div style={{ fontSize: "12px", fontWeight: 700, color: COLORS.muted, minWidth: "48px", textAlign: "right", flexShrink: 0 }}>
              {guideStep + 1} / {actionData.guide_steps.length}
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#fafcff",
              padding: "clamp(24px, 5vw, 48px) clamp(16px, 5vw, 24px) 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ maxWidth: "580px", width: "100%", display: "flex", flexDirection: "column" }}>
              {actionData.guide_steps[guideStep] && (
                <>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: theme.heroAccent,
                      marginBottom: "12px",
                    }}
                  >
                    {actionData.guide_steps[guideStep].label}
                  </div>

                  <h2
                    style={{
                      fontSize: "clamp(18px, 4vw, 26px)",
                      fontWeight: 900,
                      color: COLORS.navy,
                      marginBottom: "10px",
                      lineHeight: 1.3,
                    }}
                  >
                    {actionData.guide_steps[guideStep].title}
                  </h2>

                  <div
                    style={{ fontSize: "clamp(13px, 3vw, 14px)", color: COLORS.soft, lineHeight: 1.7, marginBottom: "18px" }}
                    dangerouslySetInnerHTML={{ __html: actionData.guide_steps[guideStep].text }}
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
                      <div style={{ width: "9px", height: "9px", minWidth: "9px", borderRadius: "50%", background: "#f26b6b" }} />
                      <div style={{ width: "9px", height: "9px", minWidth: "9px", borderRadius: "50%", background: "#f5c56a" }} />
                      <div style={{ width: "9px", height: "9px", minWidth: "9px", borderRadius: "50%", background: "#63c48f" }} />
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
                          maxWidth: "calc(100% - 60px)",
                        }}
                      >
                        {actionData.guide_steps[guideStep].url}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "clamp(14px, 4vw, 22px)",
                        minHeight: "200px",
                        background: "linear-gradient(180deg, #fcfeff 0%, #f7fbff 100%)",
                        color: COLORS.muted,
                        fontSize: "13px",
                        overflowX: "auto",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: actionData.guide_steps[guideStep].visual || "Step visual here",
                      }}
                    />
                  </div>

                  {/* Note */}
                  {actionData.guide_steps[guideStep].note && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: `${theme.chipBg}`,
                        border: `1px solid ${theme.chipBorder}`,
                        color: theme.chipText,
                        fontSize: "13px",
                        lineHeight: 1.55,
                        marginBottom: "20px",
                      }}
                    >
                      <strong>Important:</strong> {actionData.guide_steps[guideStep].note}
                    </div>
                  )}

                  {/* Navigation */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                    {guideStep > 0 && (
                      <button
                        onClick={handlePrevGuide}
                        style={{
                          padding: "12px 16px",
                          background: "transparent",
                          color: COLORS.soft,
                          border: `1.5px solid ${COLORS.line}`,
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          fontFamily: "inherit",
                          flexShrink: 0,
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
                    {guideStep < actionData.guide_steps.length - 1 ? (
                      <button
                        onClick={handleNextGuide}
                        style={{
                          flex: 1,
                          padding: "12px 20px",
                          background: theme.heroAccent,
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
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "0.88"; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
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
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#0e5c3c"; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.background = COLORS.green; }}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Action tips: 1 col mobile, 2 col sm+ */
        @media (min-width: 480px) {
          .action-tips-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        /* Info cards: 1 col always on mobile, side-by-side on sm+ when two cards present */
        @media (min-width: 540px) {
          .info-cards-section.has-two-cards {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        /* Shrink border-radius on very small screens */
        @media (max-width: 360px) {
          .info-cards-section > div,
          section[style*="border-radius: 22px"] {
            border-radius: 14px !important;
          }
        }

        /* Ensure inputs are full-width and don't overflow on small screens */
        input[type="text"] {
          width: 100%;
          box-sizing: border-box;
          -webkit-appearance: none;
        }

        /* Prevent horizontal scroll bleed */
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};