import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  AlertTriangle,
  Link as LinkIcon,
  ExternalLink,
  CreditCard,
  History,
  PhoneCall,
  Globe,
  Clock,
} from "lucide-react";

interface FeeStructureTier {
  type: string;
  price: string;
  days: string;
  badge_variant?: "blue" | "purple" | "orange" | "green";
}

interface FeeStructure {
  title?: string;
  special_note?: {
    title: string;
    description: string;
  };
  tiers: FeeStructureTier[];
}

interface OfficeLocationOption {
  type: "website" | "helpline";
  title: string;
  description?: string;
  url?: string;
  phone_local?: string;
  phone_international?: string;
}

interface OfficeLocation {
  title?: string;
  options: OfficeLocationOption[];
}

export interface InfoPanelData {
  tips: string[];
  pitfalls: string[];
  links: { label: string; url: string }[];
  fee_structure?: FeeStructure | null;
  office_location?: OfficeLocation | null;
}

export interface GuideDataInfo {
  fee_structure?: FeeStructure;
  office_finder?: OfficeLocation;
  [key: string]: unknown;
}

export interface GuideData extends GuideDataInfo {
  wizard?: GuideDataInfo;
}

interface WizardInfoPanelProps {
  data: InfoPanelData;
  lastVerified: string;
  guideType: "passport" | "frc" | "cnic" | "other" | "police-verification";
  guideData?: GuideData; // Global guide data to show consistent info
  children?: React.ReactNode;
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

const STATIC_OFFICE_LOCATION: OfficeLocation = {
  title: "Find Nearest NADRA Office",
  options: [
    {
      type: "website",
      title: "NADRA Official Offices Website",
      description: "Locate the nearest NADRA Registration Center (NRC)",
      url: "https://www.nadra.gov.pk/nadraOffices",
    },
    {
      type: "helpline",
      title: "NADRA Helpline",
      description:
        "For immediate, direct assistance, you can call the NADRA helpline.",
      phone_local: "1777",
      phone_international: "+92 51 111 786 100",
    },
  ],
};

const WizardInfoPanel = ({
  data,
  lastVerified,
  guideData,
  guideType,
  children,
}: WizardInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<InfoTab>("tips");

  const feeStructure =
    data.fee_structure ||
    guideData?.fee_structure ||
    guideData?.wizard?.fee_structure ||
    null;

  const officeLocation =
    data.office_location ||
    guideData?.office_finder ||
    guideData?.wizard?.office_finder ||
    null;

  // Show office section based on availability of dynamic data or guide type
  const showOfficeSection =
    officeLocation ||
    guideType === "passport" ||
    guideType === "frc" ||
    guideType === "cnic";

  return (
    <aside
      className="h-full flex flex-col bg-white border-l border-slate-200 rounded-xl mx-4 my-3"
      style={{ height: "660px", width: "350px" }}
    >
      {/* Tabs for Tips/Pitfalls/Links */}
      <div className="flex border-b border-slate-200 p-2 rounded-t-xl">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? "text-primary border-primary"
                  : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
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
                        className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
                      >
                        <div className="shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {tip}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No tips available for this step.
                    </p>
                  ))}

                {/* Pitfalls */}
                {activeTab === "pitfalls" &&
                  (data.pitfalls && data.pitfalls.length > 0 ? (
                    data.pitfalls.map((pitfall, i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100/50"
                      >
                        <AlertTriangle className="shrink-0 w-5 h-5 mt-0.5 text-rose-500" />
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">
                          {pitfall}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
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
                        className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors group"
                      >
                        <ExternalLink className="shrink-0 w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-primary truncate">
                          {link.label}
                        </span>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No links available for this step.
                    </p>
                  ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Custom Injected Actions (Children) */}
          {children && <div className="space-y-4 mt-2 mb-6">{children}</div>}

          {/* Fee Structure Section - Always Visible */}
          {feeStructure && (
            <div className="mt-8 pb-4 border-t border-slate-200 pt-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                  {feeStructure?.title || "Fee Structure"}
                </h2>
              </div>

              {feeStructure?.special_note && (
                <div className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-4 text-white mb-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-full shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1 leading-none">
                        {feeStructure.special_note.title}
                      </h3>
                      <p className="text-white/90 leading-relaxed text-[0.8rem]">
                        {feeStructure.special_note.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Processing Tiers
                </h3>
                <div className="flex flex-col gap-3">
                  {feeStructure?.tiers?.map(
                    (tier: FeeStructureTier, i: number) => {
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
                          className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-sm gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className={`inline-block px-2 py-0.5 rounded-full text-[0.6rem] sm:text-[0.65rem] font-bold uppercase tracking-wider mb-1 ${badgeClass}`}
                            >
                              {tier.type}
                            </div>
                            <p className="text-[0.7rem] sm:text-[0.75rem] text-slate-500 flex items-center gap-1 truncate">
                              <Clock className="w-3 h-3 shrink-0" />
                              {tier.days}
                            </p>
                          </div>
                          <div className="text-base sm:text-lg font-black text-slate-900 flex items-baseline gap-1 whitespace-nowrap">
                            <span className="text-[0.65rem] sm:text-xs font-medium text-slate-400">
                              Rs.
                            </span>
                            {tier.price}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Office Location Section - Dynamic with fallback to static */}
          {showOfficeSection && (
            <div className="mt-2 pb-4 border-t border-slate-200 pt-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                  {officeLocation?.title || STATIC_OFFICE_LOCATION.title}
                </h2>
              </div>

              <div className="bg-slate-100/50 rounded-2xl p-4 border border-slate-200/60">
                <div className="flex flex-col gap-3">
                  {(
                    officeLocation?.options || STATIC_OFFICE_LOCATION.options
                  ).map((option: OfficeLocationOption, i: number) => {
                    const icons: Record<
                      string,
                      { Icon: React.ElementType; colors: string }
                    > = {
                      website: {
                        Icon: Globe,
                        colors: "bg-primary/10 text-primary",
                      },
                      helpline: {
                        Icon: PhoneCall,
                        colors: "bg-blue-100 text-blue-600",
                      },
                    };

                    const iconConfig = icons[option.type] || icons.website;
                    const { Icon, colors } = iconConfig;

                    return (
                      <div
                        key={i}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3"
                      >
                        <div className={`${colors} p-2 rounded-lg shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[0.8rem] mb-0.5">
                            {option.title}
                          </p>
                          <p className="text-[0.75rem] text-slate-500 leading-relaxed">
                            {option.description && (
                              <>
                                {option.description}
                                <br />
                              </>
                            )}

                            {option.url && (
                              <a
                                href={option.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium flex items-center gap-1"
                              >
                                Visit Official Website
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {option.phone_local && (
                              <>
                                <br />
                                <strong>Helpline:</strong> Dial{" "}
                                {option.phone_local} (from mobile users in
                                Pakistan)
                                <br />
                              </>
                            )}

                            {option.phone_international && (
                              <>
                                <strong>International Helpline:</strong>{" "}
                                {option.phone_international}
                              </>
                            )}
                          </p>
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
      <div className="p-4 border-t border-slate-200 bg-white text-xs text-slate-500 text-center rounded-b-xl">
        Last verified: {lastVerified}
      </div>
    </aside>
  );
};

export default WizardInfoPanel;
