import React from "react";
import { ExternalLink, Plus, Eye, Trash2, Edit } from "lucide-react";

interface PortalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  portalUrl: string;
  hasCredentials: boolean;
  onAdd: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const PortalCard: React.FC<PortalCardProps> = ({
  title,
  description,
  icon,
  portalUrl,
  hasCredentials,
  onAdd,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex flex-col items-center bg-white rounded-2xl border border-[#e0f0f0] p-6 w-full max-w-[340px] hover:shadow-lg hover:border-[#0d7377]/30 transition-all duration-300 group">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#e8f6f6] flex items-center justify-center mb-5 group-hover:bg-[#0d7377] group-hover:text-white text-[#0d7377] transition-colors duration-300">
        {icon}
      </div>

      {/* Title & description */}
      <h3 className="text-[18px] font-bold text-[#0a1128] mb-1.5 text-center" style={{ fontFamily: "Inter, sans-serif" }}>
        {title}
      </h3>
      <p className="text-[13px] text-[#67737e] text-center leading-relaxed mb-5 min-h-[40px]">
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

      {/* Action buttons */}
      {!hasCredentials ? (
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0d7377] to-[#14a0a6] text-white text-[13px] font-semibold hover:from-[#0a5a5d] hover:to-[#0d7377] transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus size={15} />
          Add Credentials
        </button>
      ) : (
        <div className="w-full flex flex-col gap-2.5">
          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#32e0c4] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#0d7377] uppercase tracking-wider">
              Credentials Stored
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onView}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#0d7377]/20 bg-[#e8f6f6] text-[#0d7377] text-[12px] font-semibold hover:bg-[#0d7377] hover:text-white transition-all duration-200"
            >
              <Eye size={13} />
              View
            </button>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#0d7377]/20 bg-[#e8f6f6] text-[#0d7377] text-[12px] font-semibold hover:bg-[#0d7377] hover:text-white transition-all duration-200"
            >
              <Edit size={13} />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-500 text-[12px] font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalCard;
