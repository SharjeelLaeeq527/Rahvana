import React from "react";
import { ExternalLink, Plus } from "lucide-react";

interface PortalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  portalUrl: string;
  hasCredentials: boolean;
  lastUpdated?: string;
  onAction: () => void;
  iconBgColor?: string;
  iconHoverBgColor?: string;
  loading?: boolean;
}

const PortalCard: React.FC<PortalCardProps> = ({
  title,
  description,
  icon,
  portalUrl,
  hasCredentials,
  lastUpdated,
  onAction,
  iconBgColor,
  iconHoverBgColor,
  loading = false,
}) => {
  return (
    <div
      className={`group relative mx-auto flex w-full max-w-85 flex-col items-center rounded-2xl border border-[#e0f0f0] bg-white p-6 transition-all duration-300 hover:border-[#0d7377]/30 hover:shadow-lg lg:max-w-100 ${
        loading ? "pointer-events-none opacity-70" : ""
      }`}
    >
      {hasCredentials && (
        <div className="absolute top-[-10px] right-[-32px] inline-flex items-center gap-1.5 rounded-full border border-[#f3ddb0] bg-[#fff7e6] px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d97706]" />
          <span className="text-[10px] font-semibold text-[#92400e]">Credentials Stored</span>
        </div>
      )}
      {/* Icon */}
      <div
        className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl px-1 py-2 text-white transition-all duration-300 ${iconBgColor} ${iconHoverBgColor} group-hover:scale-105`}
      >
        <div className="flex h-16 w-16 items-center justify-center">{icon}</div>
      </div>

      {/* Title & description */}
      <h3 className="mb-1.5 text-center text-[18px] font-bold text-[#0a1128]">{title}</h3>
      <p className="mb-5 min-h-10 text-center text-[13px] leading-relaxed text-[#67737e]">
        {description}
      </p>

      {/* Visit portal */}
      <a
        href={portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0d7377] transition-colors hover:text-[#0a5a5d]"
      >
        Visit Portal <ExternalLink size={13} />
      </a>

      {/* Divider */}
      <div className="mb-5 h-px w-full bg-[#e0f0f0]" />
      {lastUpdated && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e0f0f0] bg-[#f9fafb] px-3 py-1">
          <span className="text-[11px] font-semibold text-[#6b7280]">
            Last updated: {lastUpdated}
          </span>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={onAction}
        disabled={loading}
        className="bg-primary flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5a5d] hover:shadow-md"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </>
        ) : (
          <>
            {!hasCredentials && <Plus size={15} />}
            {hasCredentials ? "View Credentials" : "Add Credentials"}
          </>
        )}
      </button>
    </div>
  );
};

export default PortalCard;
