"use client";

// ─────────────────────────────────────────────────────────────────────────────
// IR1Ticker.tsx · v6, June 2026
//
// CHANGES FROM v5:
//   - policyAlert field surfaced as a high-priority "Alert" item (red dot)
//     rendered BEFORE the headline when present. Ensures IV pause is the
//     first thing a user in a post-interview stage sees in the ticker.
//   - estimate suffix "(up to interview — visa issuance paused)" passed
//     through from narrative.estimate — no special handling needed here.
//   - Item order: policyAlert → badge → headline → context → estimate → action.
//   - All prior v5 changes retained (single source of truth from narrative,
//     no duplicate estimate path, badge surfaced, confidence not dropped).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from "react";
import type { CSSProperties } from "react";
import {
  generateNarrative,
  type CaseFields,
  type NarrativeJourneyContext,
} from "@/lib/narrative/narrativeEngine";

type DotColor = "blue" | "green" | "amber" | "red" | "purple" | "gray";

interface TickerItem {
  dot: DotColor;
  tag: string;
  text: string;
}

const DOT_COLORS: Record<DotColor, string> = {
  blue: "#97C9E3",
  green: "#85D4C3",
  amber: "#E0C28D",
  red: "#E69A9A",
  purple: "#B1B1E6",
  gray: "rgba(255, 255, 255, 0.2)",
};

// ─── Item builder ─────────────────────────────────────────────────────────────

function buildItems(user: CaseFields, journeyContext?: NarrativeJourneyContext): TickerItem[] {
  const narrative = generateNarrative(user, journeyContext ?? {});
  const items: TickerItem[] = [];

  // Policy alert — always FIRST when present; red dot, hard to miss
  if (narrative.policyAlert) {
    items.push({ dot: "red", tag: "Alert", text: narrative.policyAlert });
  }

  // Stage badge
  if (narrative.badge) {
    items.push({ dot: "green", tag: "Status", text: narrative.badge });
  }

  // Headline
  if (narrative.headline) {
    items.push({ dot: "blue", tag: "Case", text: narrative.headline });
  }

  // Context
  if (narrative.why) {
    items.push({ dot: "gray", tag: "What this means?", text: narrative.why });
  }

  // Estimate — from narrative engine only (single source of truth)
  if (narrative.estimate) {
    items.push({ dot: "purple", tag: "Estimate", text: narrative.estimate });
  }

  // Action
  if (narrative.action) {
    items.push({ dot: "amber", tag: "Action", text: narrative.action });
  }

  return items;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface IR1TickerProps {
  user: CaseFields;
  journeyContext?: NarrativeJourneyContext;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

export default function IR1Ticker({
  user,
  journeyContext,
  speed = 28,
  className,
  style,
}: IR1TickerProps) {
  const items = useMemo(() => buildItems(user, journeyContext), [user, journeyContext]);

  const duration = Math.max(12, Math.min(60, speed + items.length * 1.5));

  if (items.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes ir1-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ir1-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes ir1-blink-red {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .ir1-ticker-inner {
          animation: ir1-scroll ${duration}s linear infinite;
        }
        .ir1-ticker-inner:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className={className}
        style={{
          background: "linear-gradient(90deg, #1E3840 0%, #2C4A52 40%, #2C4A52 100%)",
          border: "1px solid #3E6472",
          borderRadius: 10,
          minHeight: 44,
          display: "flex",
          alignItems: "stretch",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(28, 52, 60, 0.35), inset 0 1px 0 rgba(104, 170, 191, 0.08)",
          ...style,
        }}
      >
        {/* ── Left label ── */}
        <div
          style={{
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 9,
            flexShrink: 0,
            background: "#1A323C",
            borderRight: "1px solid #3E6472",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#ffffff",
              flexShrink: 0,
              animation: "ir1-blink 2.5s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#ffffff",
              textTransform: "uppercase",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            IR-1 Live
          </span>
        </div>

        {/* ── Scrolling strip ── */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 64,
              background: "linear-gradient(to left, #2C4A52, transparent)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          <div
            className="ir1-ticker-inner"
            style={{
              display: "flex",
              alignItems: "center",
              width: "max-content",
              whiteSpace: "nowrap",
              willChange: "transform",
            }}
          >
            {[0, 1].map((groupIndex) => (
              <div
                key={groupIndex}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  paddingLeft: groupIndex === 0 ? 20 : 0,
                }}
              >
                {items.map((item, index) => (
                  <React.Fragment key={`${groupIndex}-${item.tag}-${index}`}>
                    <TickerItemEl item={item} />
                    {index < items.length - 1 && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 1,
                          height: 13,
                          background: "#3E6472",
                          flexShrink: 0,
                          margin: "0 24px",
                        }}
                      />
                    )}
                    {index === items.length - 1 && (
                      <span style={{ display: "inline-block", width: 52 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Single item ──────────────────────────────────────────────────────────────

function TickerItemEl({ item }: { item: TickerItem }) {
  const isAction = item.tag === "Action";
  const isEstimate = item.tag === "Estimate";
  const isStatus = item.tag === "Status";
  const isAlert = item.tag === "Alert";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flexShrink: 0,
      }}
    >
      {/* Dot — alert dots blink faster */}
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          flexShrink: 0,
          background: DOT_COLORS[item.dot],
          animation: isAlert ? "ir1-blink-red 1s ease-in-out infinite" : undefined,
        }}
      />

      {/* Tag */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.09em",
          color: isAlert ? "#E69A9A" : "#A1C6D4",
          textTransform: "uppercase",
          marginRight: 1,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {item.tag}
      </span>

      {/* Text */}
      <span
        style={{
          fontSize: 12.5,
          fontWeight: isEstimate || isStatus || isAlert ? 600 : 500,
          letterSpacing: "0.01em",
          color: isAction ? "#F0DEB8" : isStatus ? "#85D4C3" : isAlert ? "#FFBCBC" : "#ffffff",
          lineHeight: 1.4,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {item.text}
      </span>
    </span>
  );
}
