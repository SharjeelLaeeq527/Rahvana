import React from "react";
import Link from "next/link";

import { motion } from "framer-motion";

import { MegaMenuItem } from "./MegaMenu";

interface MenuItemProps {
  item: MegaMenuItem;
  index: number;
  simple?: boolean;
}

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

export const MenuItem = ({ item, index, simple = false }: MenuItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03 }}
  >
    <Link
      href={item.disabled ? "#" : item.href}
      className={`group flex items-center gap-4 p-2 rounded-lg transition-all ${
        item.disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/5"
      }`}
    >
      {!simple && (
        <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-all group-hover:bg-primary/20">
          {item.icon}
        </div>
      )}
      {simple && (
        <div className="shrink-0 text-primary group-hover:text-primary transition-colors">
          {item.icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">
            {renderWithAbbr(item.title)}
          </span>
          {item.badge && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                item.badge === "Soon"
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
  </motion.div>
);
