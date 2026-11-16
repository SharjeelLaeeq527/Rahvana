"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Baby,
  ChevronDown,
  FileText,
  Heart,
  HeartCrack,
  LogOut,
  Megaphone,
  Newspaper,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Document template registry — single source of truth shared by
// the tray submenu and the /admin/document-templates viewer page.
// ─────────────────────────────────────────────────────────────
export const ADMIN_DOCUMENT_TEMPLATES = [
  {
    key: "birth-certificate",
    file: "birth_certificate.html",
    label: "Birth Certificate",
    icon: Baby,
    iconColor: "text-teal-600",
  },
  {
    key: "marriage-certificate",
    file: "marriage_certificate.html",
    label: "Marriage Certificate",
    icon: Heart,
    iconColor: "text-rose-500",
  },
  {
    key: "divorce-certificate",
    file: "divorce_certificate.html",
    label: "Divorce Certificate",
    icon: HeartCrack,
    iconColor: "text-amber-600",
  },
  {
    key: "death-certificate",
    file: "death_certificate.html",
    label: "Death Certificate",
    icon: FileText,
    iconColor: "text-slate-500",
  },
] as const;

type AdminProfileTrayProps = {
  userEmail?: string | null;
  onOpenFeatureModal: () => void;
  onOpenBlogModal: () => void;
  onLogout: () => void;
};

export function AdminProfileTray({
  userEmail,
  onOpenFeatureModal,
  onOpenBlogModal,
  onLogout,
}: AdminProfileTrayProps) {
  const [open, setOpen] = useState(false);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);

  // Close on outside click (same interaction model as the user-side tray)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const close = () => setOpen(false);

  const itemClass =
    "text-muted-foreground hover:bg-muted flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors hover:text-teal-700";

  return (
    <div className="relative" ref={trayRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Admin profile menu"
        className="flex cursor-pointer items-center justify-center"
      >
        <span className="bg-gradient-to-br from-teal-600 to-teal-800 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ring-2 ring-teal-600/20 transition-all hover:ring-teal-600/40">
          {(userEmail || "A").charAt(0).toUpperCase()}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="border-border bg-card absolute top-full right-0 z-50 mt-2 max-h-[80vh] w-76 origin-top-right overflow-y-auto rounded-xl border shadow-xl"
          >
            {/* Header */}
            <div className="border-border bg-muted/30 border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-teal-600 h-4 w-4 shrink-0" />
                <h3 className="text-foreground truncate font-bold">Admin Console</h3>
              </div>
              <p className="text-muted-foreground truncate text-sm" title={userEmail || undefined}>
                {userEmail || "No email available"}
              </p>
            </div>

            {/* Section 1 — Operations */}
            <div className="border-border border-b py-2">
              <Link href="/admin/dashboard" onClick={close} className={itemClass}>
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                View Analytics
              </Link>

              {/* Document Templates — expandable, asks which template to open */}
              <button
                onClick={() => setTemplatesExpanded((v) => !v)}
                className={`${itemClass} justify-between cursor-pointer`}
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-teal-600" />
                  Document Templates
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    templatesExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {templatesExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-muted/20 mx-3 mb-1 mt-1 rounded-lg border border-border/60 py-1">
                      <p className="text-muted-foreground px-3 pt-1 pb-1.5 text-[10px] font-semibold tracking-wider uppercase">
                        Open a True Translation template
                      </p>
                      {ADMIN_DOCUMENT_TEMPLATES.map((tpl) => {
                        const Icon = tpl.icon;
                        return (
                          <Link
                            key={tpl.key}
                            href={`/admin/document-templates?template=${tpl.key}`}
                            onClick={close}
                            className="text-muted-foreground hover:bg-muted hover:text-teal-700 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                          >
                            <Icon className={`h-4 w-4 ${tpl.iconColor}`} />
                            {tpl.label}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Section 2 — Announcements */}
            <div className="border-border border-b py-2">
              <button
                onClick={() => {
                  close();
                  onOpenFeatureModal();
                }}
                className={`${itemClass} cursor-pointer`}
              >
                <Megaphone className="h-4 w-4 text-amber-600" />
                Feature Announcement
              </button>
              <button
                onClick={() => {
                  close();
                  onOpenBlogModal();
                }}
                className={`${itemClass} cursor-pointer`}
              >
                <Newspaper className="h-4 w-4 text-violet-600" />
                Blog Announcement
              </button>
            </div>

            {/* Footer — Sign Out */}
            <div className="py-2">
              <button
                onClick={() => {
                  close();
                  onLogout();
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
