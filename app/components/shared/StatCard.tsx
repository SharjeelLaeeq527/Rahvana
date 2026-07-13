import React from "react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  status: "live" | "coming-soon";
  type?: string | null; // Optional type for journey cards
  count?: number;
  countLabel?: string;
  description?: React.ReactNode;
  onClick?: () => void;
  extraContent?: React.ReactNode;
  quickAccessButton?: React.ReactNode;
  actionButton?: {
    label: string;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  icon,
  status,
  count,
  countLabel = "requests",
  description,
  onClick,
  type,
  extraContent,
  quickAccessButton,
  actionButton,
}) => {
  const isLive = status === "live";

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border p-5 transition-all duration-200
        ${isLive ? "border-[#e0f0f0] bg-white hover:shadow-md hover:border-[#0d7377]/30 cursor-pointer" : "border-[#e5e7eb] bg-[#fafbfc] cursor-default"}
      `}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        {/* <div
          className={`
            flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase
            ${isLive ? "bg-[#e8f6f6] text-[#0d7377]" : "bg-[#f3f4f6] text-[#9ca3af]"}
          `}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? "bg-[#32e0c4]" : "bg-[#d1d5db]"}`}
          />
          {isLive ? "Live" : "Coming Soon"}
        </div> */}
        <div
          className={`
          flex items-center justify-center w-11 h-11 rounded-xl mb-3
          ${isLive ? "bg-[#e8f6f6] text-[#0d7377]" : "bg-[#e5e7eb] text-[#9ca3af]"}
        `}
        >
          {icon}
        </div>

        {count !== undefined && isLive && (
          <span className="text-[22px] font-bold text-[#0a1128] leading-none">{count}</span>
        )}
      </div>

      {/* Icon */}

      {/* Title + Journey Type */}
      <div className="flex justify-between items-start gap-2">
        <h3
          className={`text-[15px] font-semibold mb-1 ${isLive ? "text-[#0a1128]" : "text-[#6b7280]"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {title}
        </h3>
        {quickAccessButton && (
          <div className="relative z-50 shrink-0">
            {quickAccessButton}
          </div>
        )}
        {type && (
          <span className="inline-block bg-[#e8f6f6] text-[#0d7377] text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2">
            {type}
          </span>
        )}
      </div>

      {extraContent && (
        <div className="mt-1.5 mb-2.5">
          {extraContent}
        </div>
      )}

      {/* Description or count label */}
      {description && (
        <div className="text-[13px] text-[#67737e] leading-relaxed mb-0">{description}</div>
      )}
      {count !== undefined && isLive && countLabel && (
        <p className="text-[12px] text-[#0d7377] font-medium mt-1">
          {count} {countLabel}
        </p>
      )}

      {actionButton && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end relative z-20">
          <Link
            href={actionButton.href}
            onClick={(e) => {
              e.stopPropagation();
              if (actionButton.onClick) {
                actionButton.onClick(e);
              }
            }}
            className="inline-flex items-center justify-center px-4 py-1.5 bg-[#0d7377] hover:bg-[#0a5c5f] text-white rounded-lg text-[12px] font-semibold transition cursor-pointer"
          >
            {actionButton.label}
          </Link>
        </div>
      )}

      {/* Decorative corner accent for live cards */}
      {isLive && (
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-[#32e0c4]/8" />
      )}
    </div>
  );
};

export default StatCard;
