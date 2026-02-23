import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  AlertTriangle,
  Link as LinkIcon,
  ExternalLink,
  CreditCard,
  History,
  Activity,
  MessageSquare,
  PhoneCall,
  Globe,
  Clock,
} from "lucide-react";

export interface InfoPanelData {
  tips: string[];
  pitfalls: string[];
  links: { label: string; url: string }[];
  fee_structure?: {
    title?: string;
    special_note?: {
      title: string;
      description: string;
    };
    tiers: {
      type: string;
      price: string;
      days: string;
      badge_variant?: "blue" | "purple" | "orange" | "green";
    }[];
  } | null;
  tracking?: {
    title?: string;
    methods: {
      type: "sms" | "phone" | "web";
      title: string;
      description: string;
      action_text?: string;
    }[];
  } | null;
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
  { key: "tips", label: "Tips", icon: Info, color: "hsl(168 80% 30%)" },
  {
    key: "pitfalls",
    label: "Pitfalls",
    icon: AlertTriangle,
    color: "hsl(35 90% 50%)",
  },
  { key: "links", label: "Links", icon: LinkIcon, color: "hsl(215 70% 50%)" },
];

const WizardInfoPanel = ({ data, lastVerified }: WizardInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<InfoTab>("tips");

  return (
    <aside
      className="w-75 min-w-75 h-full bg-white 
                 border-l border-[hsl(214_32%_91%)]
                 flex flex-col overflow-hidden"
    >
      {/* Tabs */}
      <div className="flex border-b border-[hsl(214_32%_91%)] px-1 shrink-0">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 
                          py-[0.85rem] px-2 text-[0.8rem] font-semibold
                          border-b-2 transition-colors
                          ${
                            isActive
                              ? "border-[hsl(168_80%_30%)] text-[hsl(168_80%_30%)]"
                              : "border-transparent text-[hsl(215_16%_57%)] hover:text-[hsl(220_20%_25%)] hover:bg-[hsl(215_60%_98%)]"
                          }`}
              style={
                isActive
                  ? { borderBottomColor: tab.color, color: tab.color }
                  : undefined
              }
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[hsl(214_30%_98%)]/50">
        <div className="min-h-min space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {/* Tips */}
                {activeTab === "tips" &&
                  (data.tips && data.tips.length > 0 ? (
                    data.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex gap-3 items-start bg-white p-3 rounded-xl border border-[hsl(214_32%_91%)] shadow-sm"
                      >
                        <span
                          className="w-6 h-6 min-w-6 rounded-full
                                    bg-[hsl(168_60%_95%)]
                                    text-[hsl(168_80%_30%)]
                                    flex items-center justify-center
                                    text-xs font-bold mt-0.5 shrink-0"
                        >
                          {i + 1}
                        </span>
                        <p className="text-[0.85rem] leading-normal text-[hsl(220_20%_25%)]">
                          {tip}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[0.85rem] text-[hsl(215_16%_57%)] text-center py-4">
                      No tips available for this step.
                    </p>
                  ))}

                {/* Pitfalls */}
                {activeTab === "pitfalls" &&
                  (data.pitfalls && data.pitfalls.length > 0 ? (
                    data.pitfalls.map((pitfall, i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-xl bg-[hsl(35_90%_98%)] border border-[hsl(35_90%_90%)]"
                      >
                        <AlertTriangle className="shrink-0 w-5 h-5 mt-0.5 text-[hsl(35_90%_50%)]" />
                        <p className="text-[0.85rem] leading-normal font-medium text-[hsl(220_20%_25%)]">
                          {pitfall}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[0.85rem] text-[hsl(215_16%_57%)] text-center py-4">
                      No pitfalls specified for this step.
                    </p>
                  ))}

                {/* Links */}
                {activeTab === "links" &&
                  (data.links && data.links.length > 0 ? (
                    data.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2
                                  p-3 rounded-[10px]
                                  border border-[hsl(214_32%_91%)]
                                  bg-white
                                  text-[hsl(215_70%_45%)]
                                  text-[0.85rem] font-medium
                                  hover:bg-[hsl(215_60%_98%)]
                                  hover:border-[hsl(215_70%_80%)]
                                  transition-all duration-200 group"
                      >
                        <span className="truncate text-slate-700 group-hover:text-blue-600">
                          {link.label}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))
                  ) : (
                    <p className="text-[0.85rem] text-[hsl(215_16%_57%)] text-center py-4">
                      No links available for this step.
                    </p>
                  ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Fee Structure Section */}
          {data.fee_structure && (
            <div className="pt-6 border-t border-[hsl(214_32%_91%)]">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[hsl(220_20%_20%)] mb-1.5 tracking-tight">
                  {data.fee_structure.title || "Fee Structure"}
                </h2>
              </div>

              {data.fee_structure.special_note && (
                <div className="bg-linear-to-r from-teal-600 to-teal-500 rounded-2xl p-4 text-white mb-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-full shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold mb-1 leading-none">
                        {data.fee_structure.special_note.title}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-[0.8rem]">
                        {data.fee_structure.special_note.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Processing Tiers
                </h3>
                <div className="flex flex-col gap-2.5">
                  {data.fee_structure.tiers.map((tier, i) => {
                    const badges: Record<string, string> = {
                      blue: "bg-blue-100 text-blue-700",
                      purple: "bg-purple-100 text-purple-700",
                      orange: "bg-orange-100 text-orange-700",
                      green: "bg-emerald-100 text-emerald-700",
                    };
                    const badgeClass =
                      badges[tier.badge_variant || "blue"] || badges.blue;

                    return (
                      <div
                        key={i}
                        className="bg-white border text-center border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm"
                      >
                        <div className="text-left flex flex-col gap-1.5 items-start">
                          <div
                            className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider ${badgeClass}`}
                          >
                            {tier.type}
                          </div>
                          <p className="text-[0.7rem] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {tier.days}
                          </p>
                        </div>
                        <div className="text-lg font-black text-slate-800">
                          <span className="text-[0.65rem] font-bold text-slate-400 mr-1 align-top relative top-0.5">
                            Rs.
                          </span>
                          {tier.price}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tracking Section */}
          {data.tracking &&
            data.tracking.methods &&
            data.tracking.methods.length > 0 && (
              <div className="pt-6 border-t border-[hsl(214_32%_91%)]">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[hsl(220_20%_20%)] mb-1.5 tracking-tight">
                    {data.tracking.title || "Tracking"}
                  </h2>
                </div>

                <div className="bg-[hsl(214_32%_95%)] rounded-2xl p-4 border border-[hsl(214_32%_91%)]">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    How to track
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {data.tracking.methods.map((method, i) => {
                      const icons = {
                        sms: {
                          Icon: MessageSquare,
                          colors: "bg-teal-100 text-teal-600",
                        },
                        phone: {
                          Icon: PhoneCall,
                          colors: "bg-blue-100 text-blue-600",
                        },
                        web: {
                          Icon: Globe,
                          colors: "bg-purple-100 text-purple-600",
                        },
                      };
                      const { Icon, colors } = icons[method.type] || icons.web;

                      return (
                        <div
                          key={i}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3"
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${colors}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-[0.8rem] mb-0.5">
                              {method.title}
                            </p>
                            <p
                              className="text-[0.75rem] text-slate-500 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: method.description,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t border-[hsl(214_32%_91%)] shrink-0
                   text-right text-[0.72rem] font-medium
                   text-[hsl(215_16%_60%)] bg-white"
      >
        Last verified: {lastVerified}
      </div>
    </aside>
  );
};

export default WizardInfoPanel;
