import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  AlertTriangle,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

interface InfoPanelData {
  tips: string[];
  pitfalls: string[];
  links: { label: string; url: string }[];
}

interface WizardInfoPanelProps {
  data: InfoPanelData;
  lastVerified: string;
}

type InfoTab = "tips" | "pitfalls" | "links";

const TAB_CONFIG: {
  key: InfoTab;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "tips", label: "Tips", icon: Info, color: "#0d7377" },
  {
    key: "pitfalls",
    label: "Pitfalls",
    icon: AlertTriangle,
    color: "#f59e0b",
  },
  { key: "links", label: "Links", icon: LinkIcon, color: "#3b82f6" },
];

const BADGE_COLORS: Record<InfoTab, { bg: string; text: string }> = {
  tips: { bg: "#f0fdfa", text: "#0d7377" },
  pitfalls: { bg: "#fffbeb", text: "#b45309" },
  links: { bg: "#eff6ff", text: "#1d4ed8" },
};

const WizardInfoPanel = ({ data, lastVerified }: WizardInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<InfoTab>("tips");

  return (
    <aside className="w-75 min-w-75 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-slate-200 px-1">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5
                py-[0.85rem] px-2
                text-[0.8rem] font-semibold
                transition-colors
                border-b-2
              `}
              style={{
                color: isActive ? tab.color : "#64748b",
                borderBottomColor: isActive ? tab.color : "transparent",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "tips" &&
              data?.tips?.map((tip, i) => (
                <div key={i} className="flex gap-3 mb-4 items-start">
                  <span
                    className="w-6 h-6 min-w-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      background: BADGE_COLORS.tips.bg,
                      color: BADGE_COLORS.tips.text,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[0.85rem] leading-normal text-slate-700">
                    {tip}
                  </p>
                </div>
              ))}

            {activeTab === "pitfalls" &&
              data?.pitfalls?.map((pitfall, i) => (
                <div key={i} className="flex gap-3 mb-4 items-start">
                  <span
                    className="w-6 h-6 min-w-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      background: BADGE_COLORS.pitfalls.bg,
                      color: BADGE_COLORS.pitfalls.text,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[0.85rem] leading-normal text-slate-700">
                    {pitfall}
                  </p>
                </div>
              ))}

            {activeTab === "links" &&
              data?.links?.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center justify-between gap-2
                    p-3 mb-2
                    rounded-[10px]
                    border border-slate-200
                    bg-slate-50
                    text-blue-600
                    text-[0.85rem] font-medium
                    transition-all
                    hover:bg-blue-50
                    hover:border-blue-200
                  "
                >
                  {link.label}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 text-right text-xs text-slate-400">
        Last verified: {lastVerified}
      </div>
    </aside>
  );
};

export default WizardInfoPanel;
