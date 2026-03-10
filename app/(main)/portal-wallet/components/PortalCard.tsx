import React from "react";
import { ExternalLink, Plus } from "lucide-react";

interface PortalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  portalUrl: string;
  hasCredentials: boolean;
  onAction: () => void;
}

const PortalCard: React.FC<PortalCardProps> = ({
  title,
  description,
  icon,
  portalUrl,
  hasCredentials,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center bg-white rounded-2xl border border-[#e0f0f0] p-6 w-full max-w-85 hover:shadow-lg hover:border-[#0d7377]/30 transition-all duration-300 group">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5  group-hover:text-white text-[#0d7377] transition-colors duration-300">
        {icon}
      </div>

      {/* Title & description */}
      <h3 className="text-[18px] font-bold text-[#0a1128] mb-1.5 text-center">
        {title}
      </h3>
      <p className="text-[13px] text-[#67737e] text-center leading-relaxed mb-5 min-h-10">
        {description}
      </p>

      {/* Visit portal */}
      <a
        href={portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0d7377] hover:text-[#0a5a5d] transition-colors mb-6"
      >
        Visit Portal <ExternalLink size={13} />
      </a>

      {/* Divider */}
      <div className="w-full h-px bg-[#e0f0f0] mb-5" />

      {hasCredentials && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold text-emerald-700">
            Credentials Stored
          </span>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={onAction}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md bg-primary text-white hover:bg-[#0a5a5d]"
      >
        {!hasCredentials && <Plus size={15} />}
        {hasCredentials ? "View Credentials" : "Add Credentials"}
      </button>
    </div>
  );
};

export default PortalCard;
