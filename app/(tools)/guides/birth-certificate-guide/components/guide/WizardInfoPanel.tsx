import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  AlertTriangle,
  Link as LinkIcon,
  ExternalLink,
  Smartphone,
  Building2,
  RefreshCcw,
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

const MethodFlashCard = () => {
  const [side, setSide] = useState<"online" | "onsite">("online");

  return (
    <div className="mb-6">
      <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
        <button
          onClick={() => setSide("online")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            side === "online" ? "bg-white shadow-sm text-teal-700" : "text-slate-500"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Online
        </button>
        <button
          onClick={() => setSide("onsite")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            side === "onsite" ? "bg-white shadow-sm text-teal-700" : "text-slate-500"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          On-site
        </button>
      </div>

      <motion.div
        key={side}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative group"
        style={{ perspective: '1000px' }}
      >
        <div className={`p-4 rounded-2xl border-2 transition-all min-h-[140px] flex flex-col justify-center ${
          side === 'online' ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
               side === 'online' ? 'bg-teal-600 text-white' : 'bg-slate-600 text-white'
            }`}>
              {side === 'online' ? <Smartphone className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
            <h5 className="font-black text-slate-800 text-sm italic">
              {side === 'online' ? 'Pak-ID Mobile App' : 'Union Council Office'}
            </h5>
          </div>
          <p className="text-[0.75rem] text-slate-600 font-medium leading-relaxed">
            {side === 'online' 
              ? 'Punjab & Islamabad residents can apply via Pak-ID app. Biometrics & photo via phone camera.' 
              : 'Visit your local Secretary UC with manual forms. Standard for Home births and non-digital regions.'}
          </p>
          <div className="mt-3 flex items-center gap-1 text-[0.65rem] font-bold text-teal-600 uppercase tracking-tighter">
            <RefreshCcw className="w-3 h-3" />
            Click toggle to see alternative
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const WizardInfoPanel = ({ data, lastVerified }: WizardInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<InfoTab>("tips");

  return (
    <aside className="w-80 min-w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden shadow-2xl shadow-slate-200 z-40">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Application Methods</h3>
        <MethodFlashCard />
      </div>

      <div className="flex border-b border-slate-200 px-1 shrink-0">
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

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
                  <p className="text-[0.85rem] leading-normal text-slate-700 font-['Plus_Jakarta_Sans',system-ui]">
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
                  <p className="text-[0.85rem] leading-normal text-slate-700 font-['Plus_Jakarta_Sans',system-ui]">
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
                  <span className="font-['Plus_Jakarta_Sans',system-ui]">{link.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 text-right text-xs text-slate-400 font-['Plus_Jakarta_Sans',system-ui] bg-slate-50/50">
        Last verified: {lastVerified}
      </div>
    </aside>
  );
};

export default WizardInfoPanel;
