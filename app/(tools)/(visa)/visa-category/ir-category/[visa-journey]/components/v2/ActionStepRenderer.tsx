"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
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

export const ActionStepRenderer: React.FC<ActionStepRendererProps> = ({
  step,
  isCompleted,
  state: propsState,
  actions: propsActions,
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

  const handlePrevGuide = () => {
    setGuideStep((prev) => Math.max(0, prev - 1));
  };

  const handleNextGuide = () => {
    setGuideStep((prev) => prev + 1);
  };

  const handleSaveMailing = async () => {
    if (!mailingCarrier.trim() || !mailingTracking.trim()) return;

    if (!actions?.saveMailingDetails) {
      console.error("[ActionStepRenderer] saveMailingDetails not available in actions");
      return;
    }

    setIsSavingMailing(true);
    try {
      // Save to database via wizard actions and wait for completion
      await actions.saveMailingDetails(mailingCarrier, mailingTracking);
      // Only show saved status after successful API call
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
    <div className="text-ink min-h-screen">
      <style>{`
        .mt { font-size: 20px; font-weight: 700; color: ${COLORS.navy}; margin-bottom: 14px; }
        .mb { border: 1px solid ${COLORS.line}; background: #fbfdff; border-radius: 14px; padding: 14px; margin-bottom: 12px; }
        .mr { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; }
        .mf { height: 42px; border: 1px solid ${COLORS.line}; border-radius: 10px; background: #fff; flex: 1; }
        .mbtn { display: inline-flex; padding: 11px 18px; border-radius: 10px; background: ${COLORS.accent}; color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer; }
        .small { font-size: 13px; color: ${COLORS.muted}; line-height: 1.6; }
        input::placeholder { color: ${COLORS.muted}; opacity: 1; }
      `}</style>
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-5.5 py-12">
        {/* Title */}
        <h1 className="text-4xl leading-tight text-navy font-black -tracking-wide mb-3">
          {step.step_name}
        </h1>

        {/* Subtitle */}
        <p className="text-base leading-relaxed text-soft max-w-2xl mb-5.5">
          {step.step_description}
        </p>

        {/* Chips - Full background colors */}
        {actionData.chips && actionData.chips.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "26px",
            }}
          >
            {actionData.chips.map((chip, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  padding: "7px 12px",
                  borderRadius: "999px",
                  background:
                    chip.type === "role"
                      ? "#e8f1fb"
                      : chip.type === "path"
                        ? "#f3f0fb"
                        : "#fffbec",
                  color:
                    chip.type === "role"
                      ? "#2f6fd4"
                      : chip.type === "path"
                        ? "#4a2d8a"
                        : "#c49a0a",
                  border:
                    chip.type === "role"
                      ? "1px solid #d0e4f7"
                      : chip.type === "path"
                        ? "1px solid #c9bef2"
                        : "1px solid #e8d47a",
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
            background: "linear-gradient(180deg, #122541 0%, #0f2038 100%)",
            color: "#fff",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 18px 48px rgba(12, 27, 51, 0.12)",
            marginBottom: "16px",
          }}
        >
          {/* Heading */}
          <h2
            style={{
              fontSize: "28px",
              lineHeight: 1.15,
              marginBottom: "6px",
              fontWeight: 700,
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
                color: "rgba(255, 255, 255, 0.74)",
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
                background: "rgba(255, 255, 255, 0.08)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginTop: "10px",
                marginBottom: "12px",
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
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                background: COLORS.accent,
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
                (e.target as HTMLElement).style.background = COLORS.accent2;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = COLORS.accent;
              }}
            >
              {actionData.cta_button.label}
            </button>
          )}

          {/* Info Cards Row */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                actionData.dropdown_card || actionData.mailing_card
                  ? "1fr 1fr"
                  : "1fr",
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
                padding: "18px",
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
                onClick={() => setShowGuide(true)}
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
                  padding: "18px",
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
                    
                    if (!actions?.savePaymentMethod) {
                      console.error("[ActionStepRenderer] savePaymentMethod not available in actions");
                      return;
                    }
                    
                    setIsSavingPayment(true);
                    try {
                      // Save to database via wizard actions and wait for completion
                      await actions.savePaymentMethod(value);
                      setSelectedDropdown(value);
                      // Only show saved status after successful API call
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
                  padding: "18px",
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
                  <input
                    type="text"
                    placeholder={
                      actionData.mailing_card.carrier_placeholder ||
                      "Carrier (USPS, UPS, FedEx)"
                    }
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
                    onFocus={(e) => {
                      e.target.style.borderColor = COLORS.accent;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = COLORS.line;
                    }}
                  />
                  <input
                    type="text"
                    placeholder={
                      actionData.mailing_card.tracking_placeholder ||
                      "Tracking number"
                    }
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
                    onFocus={(e) => {
                      e.target.style.borderColor = COLORS.accent;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = COLORS.line;
                    }}
                  />
                  <button
                    onClick={handleSaveMailing}
                    disabled={!mailingCarrier.trim() || !mailingTracking.trim() || isSavingMailing}
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
                        mailingCarrier.trim() && mailingTracking.trim() && !isSavingMailing
                          ? "pointer"
                          : "not-allowed",
                      opacity:
                        mailingCarrier.trim() && mailingTracking.trim() && !isSavingMailing
                          ? 1
                          : 0.6,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {isSavingMailing ? "Saving..." : (actionData.action_button_label || "Save mailing details")}
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

                <div>
                  <strong style={{ display: "block" }}>
                    {actionData.action_button_status_heading ||
                      "Selection saved"}
                  </strong>

                  <span style={{ fontSize: "12px", display: "block" }}>
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
                </div>
              </section>
            )}
        </section>

        {/* Info Cards Row - REMOVED, now inside hero */}

        {/* Status Message - REMOVED, now inside hero */}

        {/* Action Items Section - Enabled appearance */}
        {actionData.action_items && actionData.action_items.length > 0 && (
          <section
            style={{
              marginTop: "16px",
              background: "#fff",
              border: `1px solid ${COLORS.line}`,
              borderRadius: "22px",
              padding: "20px",
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
          }}
        >
          {/* Topbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "72px",
              borderBottom: `1px solid ${COLORS.line}`,
              paddingLeft: "20px",
              paddingRight: "20px",
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
              {guideStep + 1} / {actionData.guide_steps.length}
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#fafcff",
              padding: "48px 24px 40px",
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
              {actionData.guide_steps[guideStep] && (
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
                    {actionData.guide_steps[guideStep].label}
                  </div>

                  <h2
                    style={{
                      fontSize: "clamp(20px, 3.2vw, 26px)",
                      fontWeight: 900,
                      color: COLORS.navy,
                      marginBottom: "10px",
                      lineHeight: 1.3,
                    }}
                  >
                    {actionData.guide_steps[guideStep].title}
                  </h2>

                  <div
                    style={{
                      fontSize: "14px",
                      color: COLORS.soft,
                      lineHeight: 1.7,
                      marginBottom: "18px",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: actionData.guide_steps[guideStep].text,
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
                      }}
                    >
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: "#f26b6b",
                        }}
                      />
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: "#f5c56a",
                        }}
                      />
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: "#63c48f",
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
                        }}
                      >
                        {actionData.guide_steps[guideStep].url}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "22px",
                        minHeight: "280px",
                        background:
                          "linear-gradient(180deg, #fcfeff 0%, #f7fbff 100%)",
                        color: COLORS.muted,
                        fontSize: "13px",
                      }}
                      dangerouslySetInnerHTML={{
                        __html:
                          actionData.guide_steps[guideStep].visual ||
                          "Step visual here",
                      }}
                    />
                  </div>

                  {/* Note */}
                  {actionData.guide_steps[guideStep].note && (
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
                      {actionData.guide_steps[guideStep].note}
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
                    {guideStep < actionData.guide_steps.length - 1 ? (
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
      `}</style>
    </div>
  );
};
