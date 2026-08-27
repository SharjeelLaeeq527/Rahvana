import React from "react";
import Link from "next/link";
import Image from "next/image";

import { MegaMenuItem } from "./MegaMenu";

interface MenuItemProps {
  item: MegaMenuItem;
  index: number;
  simple?: boolean;
}

const NAVBAR_ICON_BY_TITLE: Record<string, string> = {
  "IR-1 / CR-1": "/icons/ir-1-cr-1.svg",
  "K-1": "/icons/k-1.svg",
  "K-3": "/icons/k-3.svg",
  "IR-5": "/icons/ir-5.svg",
  "IR-2 / CR-2": "/icons/ir-2-cr-2.svg",
  "IR-3 / IR-4 (and Hague variants)": "/icons/ir-3-ir-4.svg",
  "F-1": "/icons/f-1.svg",
  "F-2A": "/icons/f-2a.svg",
  "F-2B": "/icons/f-2b.svg",
  "F-3": "/icons/f-3.svg",
  "F-4": "/icons/f-4.svg",
  Refugee: "/icons/refugee.svg",
  Asylum: "/icons/asylum.svg",
  Parole: "/icons/parole.svg",
  "Case Strength Analyzer": "/icons/case-strength-analyser.svg",
  "221(g) Action Planner": "/icons/221g-action-plan.svg",
  // "Visa Path Finder": "/icons/visa-path-finder.svg",
  "Interview Prep": "/icons/interview-prep.svg",
  "Sponsorship Calculator": "/icons/sponsorship-calculator.svg",
  "DQ Status Check": "/icons/dq-case-tracker.svg",
  // "Visa Bulletin Monitor": "/icons/visa-bulletin-monitor.svg",
  "Photo Booth": "/icons/photo-booth.svg",
  "PDF Tool Kit": "/icons/pdf-toolbox.svg",
  "Snap & Sign": "/icons/snap-and-sign.svg",
  "Smart Form Filler": "/icons/smart-form-filler.svg",
  Passport: "/icons/passport-guide.svg",
  CNIC: "/icons/cnic-guide.svg",
  "Birth Certificate": "/icons/birth-certificate.svg",
  FRC: "/icons/frc-guide.svg",
  "Marriage Registration": "/icons/marriage-registration.svg",
  "Police Character Certificate": "/icons/police-certificate.svg",
  "Polio Vaccination": "/icons/polio-vaccination-guide.svg",
  "Expert Consultation": "/icons/book-consultation.svg",
  "Expert Case Review": "/icons/expert-case-review.svg",
  "PCC Filing Service, Sindh": "/icons/pcc-filling-service-sindh.svg",
  "PCC Filing Service, Punjab (Coming Soon)": "/icons/pcc-filling-service-punjab.svg",
  "PCC Filing Service, KPK (Coming Soon)": "/icons/pcc-filling-service-kpk.svg",
  "PCC Filing Service, Balochistan (Coming Soon)": "/icons/pcc-filling-service-balochistan.svg",
  "Book Medical Appointment": "/icons/book-medical-appointment.svg",
  "Urdu → English Translation": "/icons/urdu-english-translation.svg",
};

const renderWithAbbr = (text: string) => {
  if (!text.includes("PCC")) return text;
  const parts = text.split("PCC");
  return parts.reduce((acc, part, i) => {
    if (i === 0) return [part];
    return [
      ...acc,
      <abbr
        key={i}
        title="Police Clearance Certificate"
        className="cursor-help underline decoration-dashed decoration-slate-400"
      >
        PCC
      </abbr>,
      part,
    ];
  }, [] as React.ReactNode[]);
};

export const MenuItem = ({ item, index, simple = false }: MenuItemProps) => {
  const iconSrc = NAVBAR_ICON_BY_TITLE[item.title];
  const iconNode = iconSrc ? (
    <Image
      src={iconSrc}
      alt={`${item.title} icon`}
      width={55}
      height={55}
      className="h-[55px] w-[55px]"
    />
  ) : (
    item.icon
  );

  return (
    <div>
      <Link
        href={item.disabled ? "#" : item.href}
        className={`group flex items-center gap-4 p-2 rounded-lg transition-all ${item.disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-[#0d7377]/5"
          }`}
      >
        <div className="shrink-0 flex items-center justify-center w-[55px] h-[55px]">
          {iconNode}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 group-hover:text-[#0d7377] transition-colors">
              {renderWithAbbr(item.title)}
            </span>
            {item.badge && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.badge === "Soon"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-emerald-100 text-emerald-700 font-black"
                  }`}
              >
                {item.badge}
              </span>
            )}
          </div>
          {!simple && (
            <p className="text-xs text-slate-500 line-clamp-1 truncate">
              {renderWithAbbr(item.description)}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};
