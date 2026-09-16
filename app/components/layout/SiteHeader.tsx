"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  BellOff,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Zap,
  Briefcase,
  Layout,
  Settings,
  HelpCircle,
  Lock as LockIcon,
  CreditCard,
  Mail,
  BookOpen,
  FolderLock,
  Wand2,
  HelpCircleIcon,
  ToolCase,
  Wrench,
  Info,
  LifeBuoy,
  MessageSquare,
  Calculator,
  Clock,
  Camera,
  Files,
  Map,
  PenTool,
  Globe,
  Shield,
  FileText,
  Heart,
  HeartOff,
  // Star,
  // StarOff,
  Syringe,
  Pin,
  // PinOff,
  List,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuickAccess } from "@/app/context/QuickAccessContext";
import MegaMenu from "./MegaMenu";
import { User } from "@supabase/supabase-js";
import { useAuth, UserProfile } from "@/app/context/AuthContext";
// import { useLanguage } from "@/app/context/LanguageContext";
import { NAV_DATA } from "./navigationData";
import { ConfirmationModal } from "../shared/ConfirmationModal";
import { requestNavigation } from "@/lib/guides/navigationGuardStore";
// import { useTheme } from "next-themes";
import { ir1journeyHref, ir5journeyHref } from "@/lib/constants/routes";

interface HeaderProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
  isSignedIn?: boolean;
  onToggleAuth?: () => void;
  user?: User | null;
  profile?: UserProfile | null;
}

// --------------------------------------------------------------------------
//  Hydration-safe button – suppresses warnings for extension-injected attrs
// --------------------------------------------------------------------------
const HydrationSafeButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
  }
) => {
  const { className, ...rest } = props;

  // Filter out problematic attributes that might be added by extensions
  const filteredRest = { ...rest };
  const extensionAttributes = ["fdprocessedid", "data-extension", "data-extension-id"];
  extensionAttributes.forEach((attr) => {
    if (filteredRest[attr as keyof typeof filteredRest]) {
      delete filteredRest[attr as keyof typeof filteredRest];
    }
  });

  return <button {...filteredRest} className={className} suppressHydrationWarning={true} />;
};

// --------------------------------------------------------------------------
//  Global clean-up – runs once, removes any extension-injected attrs
// --------------------------------------------------------------------------
const useExtensionCleanup = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Remove common attributes added by browser extensions
      const extensionAttrs = [
        "fdprocessedid",
        "data-extension",
        "data-extension-id",
        "_moz-generated-content-before",
        "_moz-generated-content-after",
      ];

      extensionAttrs.forEach((attr) => {
        document.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);
};

const QUICK_ACCESS_ICON_MAP: Record<string, React.ComponentType<any>> = {
  LifeBuoy,
  MessageSquare,
  Calculator,
  Clock,
  Camera,
  Files,
  PenTool,
  Wand2,
  Zap,
  Globe,
  Shield,
  FileText,
  Heart,
  Syringe,
  Briefcase,
  BookOpen,
};

interface QuickAccessItemStyle {
  bg: string;
  lightBg: string;
  hoverBorder: string;
  hoverText: string;
}

const QUICK_ACCESS_ITEM_STYLES: Record<string, QuickAccessItemStyle> = {
  violet: {
    bg: "bg-violet-600 text-white dark:bg-violet-500",
    lightBg: "bg-violet-600/10 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
    hoverBorder: "hover:border-violet-600/30 hover:bg-violet-600/5",
    hoverText: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
  },
  emerald: {
    bg: "bg-emerald-600 text-white dark:bg-emerald-500",
    lightBg: "bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-600/30 hover:bg-emerald-600/5",
    hoverText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  amber: {
    bg: "bg-amber-600 text-white dark:bg-amber-500",
    lightBg: "bg-amber-600/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hoverBorder: "hover:border-amber-600/30 hover:bg-amber-600/5",
    hoverText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
  rose: {
    bg: "bg-rose-600 text-white dark:bg-rose-500",
    lightBg: "bg-rose-600/10 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
    hoverBorder: "hover:border-rose-600/30 hover:bg-rose-600/5",
    hoverText: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
  },
  cyan: {
    bg: "bg-cyan-600 text-white dark:bg-cyan-500",
    lightBg: "bg-cyan-600/10 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    hoverBorder: "hover:border-cyan-600/30 hover:bg-cyan-600/5",
    hoverText: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
  },
  green: {
    bg: "bg-green-600 text-white dark:bg-green-500",
    lightBg: "bg-green-600/10 dark:bg-green-500/10 text-green-600 dark:text-green-400",
    hoverBorder: "hover:border-green-600/30 hover:bg-green-600/5",
    hoverText: "group-hover:text-green-600 dark:group-hover:text-green-400",
  },
  teal: {
    bg: "bg-teal-600 text-white dark:bg-teal-500",
    lightBg: "bg-teal-600/10 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400",
    hoverBorder: "hover:border-teal-600/30 hover:bg-teal-600/5",
    hoverText: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
  },
  indigo: {
    bg: "bg-indigo-600 text-white dark:bg-indigo-500",
    lightBg: "bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    hoverBorder: "hover:border-indigo-600/30 hover:bg-indigo-600/5",
    hoverText: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
  },
  default: {
    bg: "bg-[#0d7377] text-white",
    lightBg: "bg-[#0d7377]/10 text-[#0d7377] dark:bg-[#0d7377]/20 dark:text-[#32e0c4]",
    hoverBorder: "hover:border-[#0d7377]/30 hover:bg-[#0d7377]/5",
    hoverText: "group-hover:text-[#0d7377] dark:group-hover:text-[#32e0c4]",
  },
};

function getQuickAccessItemStyle(item: any): QuickAccessItemStyle {
  if (item.id.startsWith("guide-")) {
    const guideId = item.id.replace("guide-", "");
    const isPakDoc = [
      "passport",
      "police-verification",
      "cnic",
      "birth-certificate",
      "frc",
      "marriage-certificate",
    ].includes(guideId);
    return isPakDoc ? QUICK_ACCESS_ITEM_STYLES.green : QUICK_ACCESS_ITEM_STYLES.teal;
  }

  if (item.id.startsWith("service-")) {
    const serviceId = item.id.replace("service-", "");
    if (serviceId === "book-a-consultation") {
      return QUICK_ACCESS_ITEM_STYLES.indigo;
    }
    if (serviceId.includes("pcc-filing-service")) {
      return QUICK_ACCESS_ITEM_STYLES.emerald;
    }
    if (serviceId === "book-medical-appointment") {
      return QUICK_ACCESS_ITEM_STYLES.rose;
    }
    if (serviceId.includes("translation")) {
      return QUICK_ACCESS_ITEM_STYLES.amber;
    }
    return QUICK_ACCESS_ITEM_STYLES.indigo;
  }

  const toolId = item.id;
  if (["221g-action-planner", "221g-planner", "interview-prep"].includes(toolId)) {
    return QUICK_ACCESS_ITEM_STYLES.violet;
  }
  if (["sponsorship-calculator"].includes(toolId)) {
    return QUICK_ACCESS_ITEM_STYLES.emerald;
  }
  if (["queue-watch", "photo-booth"].includes(toolId)) {
    return QUICK_ACCESS_ITEM_STYLES.amber;
  }
  if (["pdf-toolkit", "snap-sign"].includes(toolId)) {
    return QUICK_ACCESS_ITEM_STYLES.rose;
  }
  if (["form-forge"].includes(toolId)) {
    return QUICK_ACCESS_ITEM_STYLES.cyan;
  }

  return QUICK_ACCESS_ITEM_STYLES.default;
}

// How many notifications to show before the user opts into "See More".
const NOTIF_PAGE_SIZE = 8;

// Compact relative timestamp, e.g. "Just now", "5m ago", "3h ago", "2d ago".
// Falls back to an absolute date for anything older than a week.
function formatNotifTime(value?: string | number | Date | null): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  if (diff < 0) return "Just now";

  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: new Date(then).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function SiteHeader({
  activeSection,
  onNavigate,
  isSignedIn = false,
  onToggleAuth,
  user,
}: HeaderProps = {}) {
  // Run cleanup once
  useExtensionCleanup();
  const router = useRouter();
  // const { theme, setTheme } = useTheme();

  const MOBILE_ICONS: Record<string, React.ReactNode> = {
    journeys: (
      <div className="flex h-[55px] w-[55px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
        <Image
          src="/icons/visa-journeys.svg"
          alt="Journeys icon"
          width={55}
          height={55}
          className="h-[55px] w-[55px]"
        />
      </div>
    ),
    tools: (
      <div className="flex h-[55px] w-[55px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
        <Image
          src="/icons/visa-application-tools-guides.svg"
          alt="Tools icon"
          width={55}
          height={55}
          className="h-[55px] w-[55px]"
        />
      </div>
    ),
    guides: (
      <div className="flex h-[55px] w-[55px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
        <Image
          src="/icons/passport-guide.svg"
          alt="Guides icon"
          width={55}
          height={55}
          className="h-[55px] w-[55px]"
        />
      </div>
    ),
    services: (
      <div className="flex h-[55px] w-[55px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
        <Image
          src="/icons/book-consultation.svg"
          alt="Services icon"
          width={55}
          height={55}
          className="h-[55px] w-[55px]"
        />
      </div>
    ),
  };

  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);
  const quickAccessRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rahvana_quick_access_view");
      if (saved === "grid" || saved === "list") {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("rahvana_quick_access_view", mode);
    } catch {}
  };

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("rahvana_notif_read");
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const notifRef = useRef<HTMLDivElement>(null);

  // Quick Access context
  const { items: quickAccessItems, removeItem: removeQuickAccessItem } = useQuickAccess();

  // Real notification data
  const [notifList, setNotifList] = useState<any[]>([]);
  const [notifJourneyId, setNotifJourneyId] = useState<string | null>(null);
  const [expandedNotifs, setExpandedNotifs] = useState<Set<string>>(new Set());
  // How many notifications are currently rendered. Starts capped; "See More"
  // reveals the rest and switches the list into infinite-scroll mode.
  const [visibleNotifCount, setVisibleNotifCount] = useState(NOTIF_PAGE_SIZE);
  const [notifSeeAll, setNotifSeeAll] = useState(false);
  const notifScrollRef = useRef<HTMLDivElement>(null);
  const notifSentinelRef = useRef<HTMLDivElement>(null);
  const toggleExpand = (id: string) =>
    setExpandedNotifs((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const profileRef = useRef<HTMLDivElement>(null);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [arrowOffset, setArrowOffset] = useState(40);

  const showToggle = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";

  const journeyButtonText = showToggle ? "Explore Journeys" : "IR-1 Journey";

  const journeyButtonHref = showToggle ? "/visa-category" : ir1journeyHref;

  const journeyNavigationId = showToggle ? "journeys" : "ir1-journey";

  // Refs for each nav button wrapper — used to calculate arrow position
  const navRefs = useRef<Record<string, HTMLDivElement | null>>({
    journeys: null,
    tools: null,
    guides: null,
    services: null,
  });
  const megaMenuContainerRef = useRef<HTMLDivElement | null>(null);

  const handleLinkClick = (e: React.MouseEvent) => {
    if (
      e.metaKey || // CMD (Mac)
      e.ctrlKey || // CTRL (Windows)
      e.shiftKey ||
      e.button === 1 // Middle click
    ) {
      return; // browser ko handle karne do
    }

    setIsMenuOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // Notification
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      // Quick Access
      if (quickAccessRef.current && !quickAccessRef.current.contains(target)) {
        setQuickAccessOpen(false);
      }
      // Mega Menus or Profile Menu
      if (activeMenu) {
        if (activeMenu === "profile") {
          if (profileRef.current && !profileRef.current.contains(target)) {
            setActiveMenu(null);
          }
        } else {
          const isInsideMegaMenu = megaMenuContainerRef.current?.contains(target);
          const isInsideNavTrigger = navRefs.current[activeMenu]?.contains(target);
          if (!isInsideMegaMenu && !isInsideNavTrigger) {
            setActiveMenu(null);
          }
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeMenu]);

  // Open profile menu on global event
  useEffect(() => {
    const handleOpenMenu = () => {
      setActiveMenu("profile");
    };
    window.addEventListener("open-profile-menu", handleOpenMenu);
    return () => window.removeEventListener("open-profile-menu", handleOpenMenu);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setActiveMenu(null);
    setIsMenuOpen(false);
    setNotificationsOpen(false);
    setQuickAccessOpen(false);
  }, [pathname]);
  const { profile, isLoading, user: authUser } = useAuth();
  const resolvedUser = user ?? authUser;

  const fetchNotifications = useCallback(async () => {
    try {
      // 1. Fetch journey reminders for all journeys in parallel
      let journeyReminders: any[] = [];
      try {
        const res = await fetch("/api/journeys");
        if (res.ok) {
          const data = await res.json();
          const journeys = data?.data || [];

          const promises = journeys.map(async (j: any) => {
            const journeyId = j?.journey?.id;
            if (!journeyId) return [];
            try {
              const r = await fetch(`/api/v1/journeys/${journeyId}/reminders`);
              if (r.ok) {
                const d = await r.json();
                return (d.reminders ?? []).map((n: any) => ({
                  ...n,
                  _source: "journey" as const,
                }));
              }
            } catch {}
            return [];
          });

          const results = await Promise.all(promises);
          journeyReminders = results.flat();

          // Set active journey ID as fallback/context if not already set
          if (journeys.length > 0) {
            const active =
              journeys.find((j: any) => j.journey?.status === "in_progress") || journeys[0];
            const activeId = active?.journey?.id;
            if (activeId) setNotifJourneyId((prev) => prev || activeId);
          }
        }
      } catch {}

      // 2. Fetch in-app notifications (appointment status updates, etc.)
      let appNotifications: any[] = [];
      try {
        const appRes = await fetch("/api/notifications");
        if (appRes.ok) {
          const appData = await appRes.json();
          appNotifications = (appData.notifications ?? []).map((n: any) => ({
            ...n,
            _source: "app" as const,
          }));
        }
      } catch {}

      // 3. Merge and sort by created_at descending
      const merged = [...journeyReminders, ...appNotifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifList(merged);
    } catch {}
  }, []);

  // Throttle guard so rapid tab-focus switches don't refetch the whole fan-out.
  const lastNotifFetchRef = useRef(0);

  const runFetchNotifications = useCallback(() => {
    lastNotifFetchRef.current = Date.now();
    fetchNotifications();
  }, [fetchNotifications]);

  // Fetch on mount — so bell badge and data are ready before user clicks.
  // Keyed on the user ID (not the user object): AuthContext re-emits a NEW user
  // reference on every auth event, and keying on the object would re-trigger the
  // whole per-journey notification fan-out each time (extra Supabase Disk IO).
  useEffect(() => {
    if (resolvedUser?.id) runFetchNotifications();
  }, [resolvedUser?.id, runFetchNotifications]);

  // Background refresh. Poll every 10 minutes AND only while the tab is visible —
  // a hidden/background tab makes zero DB calls. When the tab becomes visible
  // again we catch up once (throttled to at most once per minute). This replaces
  // the old always-on 2-minute poll, which fanned out reads (journeys progress +
  // per-journey reminders + notifications) for every user on every open tab.
  useEffect(() => {
    if (!resolvedUser?.id) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      runFetchNotifications();
    };
    const interval = setInterval(tick, 10 * 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastNotifFetchRef.current < 60 * 1000) return;
      runFetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [resolvedUser?.id, runFetchNotifications]);

  // Re-fetch immediately when any data save triggers refresh-reminders
  useEffect(() => {
    if (!resolvedUser?.id) return;
    window.addEventListener("refresh-reminders", fetchNotifications);
    return () => window.removeEventListener("refresh-reminders", fetchNotifications);
  }, [resolvedUser?.id, fetchNotifications]);

  const markAllRead = (ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set([...prev, ...ids]);
      try {
        localStorage.setItem("rahvana_notif_read", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const markOneRead = (id: string) => {
    // Find the notification to determine its source
    const notif = notifList.find((n: any) => n.id === id);

    if (notif?._source === "app") {
      // Server-side: mark as read via API
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "read" }),
      }).catch(() => {});
      // Update local state immediately
      setNotifList((prev) => prev.map((n: any) => (n.id === id ? { ...n, is_read: true } : n)));
    } else {
      // Journey reminders: use localStorage-based tracking
      setReadIds((prev) => {
        const next = new Set([...prev, id]);
        try {
          localStorage.setItem("rahvana_notif_read", JSON.stringify([...next]));
        } catch {}
        return next;
      });
    }
  };

  const handleBellClick = () => {
    setNotificationsOpen((prev) => !prev);
  };

  // Reset the paging whenever the dropdown closes, so it always reopens
  // collapsed to the initial page.
  useEffect(() => {
    if (!notificationsOpen) {
      setVisibleNotifCount(NOTIF_PAGE_SIZE);
      setNotifSeeAll(false);
    }
  }, [notificationsOpen]);

  // Infinite scroll: once the user opts into "See More", reveal more rows as
  // the sentinel at the bottom of the scroll area comes into view.
  useEffect(() => {
    if (!notificationsOpen || !notifSeeAll) return;
    const sentinel = notifSentinelRef.current;
    const root = notifScrollRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleNotifCount((prev) =>
            prev >= notifList.length ? prev : prev + NOTIF_PAGE_SIZE
          );
        }
      },
      { root, rootMargin: "0px 0px 120px 0px", threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [notificationsOpen, notifSeeAll, notifList.length]);

  const dismissNotif = async (id: string) => {
    const notif = notifList.find((n: any) => n.id === id);
    setNotifList((prev) => prev.filter((n) => n.id !== id));

    if (notif?._source === "app") {
      // Dismiss via notifications API
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "dismiss" }),
      }).catch(() => {});
    } else {
      const targetJourneyId = notif?.journey_id || notifJourneyId;
      if (targetJourneyId) {
        // Dismiss via journey reminders API
        await fetch(`/api/v1/journeys/${targetJourneyId}/reminders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "dismiss" }),
        }).catch(() => {});
      }
    }
  };

  // Unread count: journey reminders use localStorage readIds, app notifications use server is_read
  const unreadCount = notifList.filter((n: any) => {
    if (n._source === "app") return !n.is_read;
    return !readIds.has(n.id);
  }).length;

  // const { language, setLanguage } = useLanguage();

  const handleMenuEnter = (menu: string) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setActiveMenu(menu);

    // Calculate arrow offset: center of the nav button relative to megamenu container left edge
    const btnEl = navRefs.current[menu];
    const containerEl = megaMenuContainerRef.current;
    if (btnEl && containerEl) {
      const btnRect = btnEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      const centerX = btnRect.left + btnRect.width / 2 - containerRect.left;
      setArrowOffset(Math.max(16, centerX - 8)); // -8 = half arrow width (16px/2)
    }
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => setActiveMenu(null), 100);
  };

  const handleNav = (id: string, e?: React.MouseEvent) => {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) {
      return;
    }

    setIsMenuOpen(false);
    setActiveMenu(null);

    if (onNavigate) {
      if (e) e.preventDefault();
      onNavigate(id);
    } else {
      if (e) e.preventDefault();

      const routes: Record<string, string> = {
        home: "/",
        journeys: "/visa-category",
        "my-journeys": "/my-journeys",
        "my-guides": "/guides/my-guides",
        "ir1-journey": ir1journeyHref,
        "ir5-journey": ir5journeyHref,
        "k1-journey": "/visa-category/k1-journey",
        services: "/resources?tab=services",
        tools: "/resources?tab=toolbox",
        guides: "/resources?tab=guides",
        pricing: "/pricing",
        dashboard: "/user-dashboard",
        mfa: "/mfa-setup",
        contact: "/#contact",
        faq: "#faq",
        passport: "/passport",
        "passport-guide": "/guides/passport-guide",
        "visa-strength-guide": "/guides/visa-strength-guide",
        "frc-guide": "/guides/frc-guide",
        pdf: "/pdf-processing",
        signature: "/signature-image-processing",
        iv: "/iv-tool",
        forms: "/visa-forms",
        checker: "/visa-checker",
        "document-vault": "/document-vault",
        "affidavit-support-calculator": "/affidavit-support-calculator",
        "visa-eligibility": "/visa-eligibility",
        "Book Appintment": "/book-appointment",
        "Police Verification": "/guides/police-verification-guide",
        "document-translation": "/document-translation",
        "221g-action-planner": "/221g-action-planner",
        "visa-case-strength-checker": "/visa-case-strength-checker",
        "view-security-questions": "/view-security-questions",
        "courier-registration": "/courier-registration",
        "custom-requirements": "/custom-requirements",
        "interview-prep": "/interview-prep",
        profile: "/profile",
        settings: "/settings",
        "portal-wallet": "/portal-wallet",
        about: "/about",
        blog: "/blog",
      };

      const targetRoute = routes[id] || "/";

      // If a navigation guard is active, defer to it (opens confirmation modal)
      if (requestNavigation(targetRoute)) return;

      router.push(targetRoute);
    }
  };

  const isActive = (id: string, href?: string) => {
    if (activeSection && activeSection === id) return true;
    if (href && pathname === href) return true;
    return false;
  };

  const [scrolled, setScrolled] = useState(false);
  const [heroTransitioned, setHeroTransitioned] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleHeroTransition = (event: Event) => {
      const customEvent = event as CustomEvent<{ transitioned?: boolean }>;
      setHeroTransitioned(Boolean(customEvent.detail?.transitioned));
    };

    window.addEventListener("home-hero-transition", handleHeroTransition);
    return () => {
      window.removeEventListener("home-hero-transition", handleHeroTransition);
    };
  }, []);

  const isHomeHeroState = pathname === "/" && !scrolled && !heroTransitioned;
  const isHomeHeroP2State = pathname === "/" && !scrolled && heroTransitioned;
  // /home-page has a light gradient hero — transparent header but teal text (not white)
  const isHomepageHeroState = pathname === "/" && !scrolled;
  return (
    <header
      className={`fixed top-0 right-0 left-0 z-100 w-full transition-all duration-300 ${
        isHomeHeroState || isHomeHeroP2State || isHomepageHeroState
          ? "border-none bg-transparent py-4 shadow-none"
          : "bg-background py-2 shadow-lg"
      }`}
      style={
        isHomeHeroState || isHomeHeroP2State || isHomepageHeroState
          ? { background: "rgba(0,0,0,0)", boxShadow: "none", border: "none" }
          : {}
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* Desktop navigation */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`flex w-full items-center justify-between px-8 ${isHomeHeroState ? "text-white" : ""}`}
      >
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <HydrationSafeButton
            className={`rounded-md p-1 transition-colors lg:hidden ${
              isHomeHeroState
                ? "text-TEAL hover:bg-white/15"
                : isHomepageHeroState
                  ? "text-[#0d7377] hover:bg-[#0d7377]/10"
                  : "text-foreground hover:bg-muted"
            }`}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </HydrationSafeButton>

          {/* Brand/Logo */}
          <Link
            href="/"
            onClick={(e) => handleNav("home", e)}
            className="group flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="152 220 710 215"
              className={`h-8 w-auto fill-current ${
                isHomeHeroState
                  ? "text-white drop-shadow-sm"
                  : isHomeHeroP2State || isHomepageHeroState
                    ? "!text-[#0d7377]"
                    : "text-rahvana-primary"
              }`}
              style={
                isHomeHeroP2State || isHomepageHeroState
                  ? { color: "#0d7377", fill: "#0d7377/20" }
                  : {}
              }
            >
              <path d="M194.478302,411.482117C188.648972,398.666321 181.184067,387.211884 174.078979,375.556946C161.946335,355.654999 154.218430,334.429535 152.466766,310.927032C150.965759,290.787415 151.490814,271.069061 158.657028,251.953415C161.906097,243.286591 167.372574,236.333282 175.068100,231.098938C187.972153,222.321823 212.377777,222.515015 222.031631,242.165817C226.003326,250.250381 232.154404,254.994858 241.386230,255.103607C240.874603,257.700470 239.210571,257.303253 238.057617,257.539734C214.604111,262.350281 200.098267,276.975067 192.363480,299.065857C184.921768,320.319672 187.555267,352.132874 198.628662,372.172211C195.346085,360.736084 194.548477,349.072571 194.585556,337.231354C194.686203,305.091156 209.071442,282.030487 237.587112,267.388245C252.463837,259.749298 268.363953,254.738281 283.791870,248.515182C300.024750,241.967392 315.867065,234.607849 330.889893,225.571030C331.848022,224.994675 332.727417,224.133804 334.330139,224.642090C334.086884,229.016586 332.356110,232.995224 331.110291,237.029678C325.877838,253.974487 319.356995,270.258270 307.731262,284.109070C295.584656,298.580475 279.797791,306.307983 261.751282,310.259583C255.743668,311.575104 249.729248,312.898682 243.795959,314.506500C229.390137,318.410126 220.388382,329.212219 218.286926,343.947327C216.575470,355.947906 217.905655,367.798737 218.737152,379.737518C219.623474,392.463135 221.756760,405.206818 219.303925,418.003387C217.963852,424.994537 214.710114,430.344635 207.688766,433.006439C204.303909,434.289673 202.544754,433.679260 201.368622,430.074707C199.358749,423.914886 196.908096,417.898895 194.478302,411.482117z"></path>
              <path d="M347.022308,320.000671C347.016052,314.839264 347.105347,310.174835 346.965759,305.517273C346.865234,302.162506 348.128204,300.629364 351.628418,300.734467C356.786560,300.889313 361.960175,300.922363 367.113922,300.699646C370.973633,300.532806 372.427643,301.928192 372.368347,305.879303C372.186157,318.023376 372.301971,330.171936 372.301971,342.083649C373.283447,342.867767 373.819183,342.426117 374.318726,342.006836C383.782745,334.063324 394.575775,332.615875 406.196838,335.633057C415.899536,338.152130 422.744904,346.587646 423.310516,356.622040C424.267090,373.593201 423.737030,390.584991 423.953217,407.566589C423.995270,410.868988 423.022247,412.495087 419.405853,412.347473C414.084778,412.130249 408.740967,412.096069 403.421997,412.329346C399.633331,412.495514 398.561127,410.970825 398.606415,407.354187C398.766998,394.531891 398.675171,381.706299 398.663269,368.881958C398.653717,358.575378 395.399567,354.366302 387.286011,354.116821C377.843262,353.826508 372.628845,358.719452 372.391693,368.828339C372.122253,380.313904 372.349670,391.810638 372.318054,403.302399C372.289795,413.578827 373.113983,412.175079 363.109467,412.274994C359.445770,412.311584 355.772827,412.113037 352.119568,412.309662C348.129639,412.524414 346.894379,410.660309 346.908722,406.924530C346.998840,383.444702 346.970551,359.964386 346.985443,336.484253C346.988831,331.156372 347.007996,325.828522 347.022308,320.000671z"></path>
              <path d="M320.909363,412.311096C317.090668,412.315186 313.737823,412.059113 310.437317,412.365967C305.318787,412.841858 301.746216,411.882538 302.918549,404.615967C295.871124,410.791656 288.552673,413.763123 280.156006,414.249451C254.958969,415.708740 237.504608,396.636383 239.498611,370.735535C239.781265,367.064178 240.334641,363.492889 241.348862,359.967224C249.310272,332.292297 281.741791,328.266632 299.022125,340.520233C300.048828,341.248291 300.767242,342.583801 302.297913,342.519531C303.777649,335.660950 303.777649,335.661041 311.217407,335.661530C315.046356,335.661774 318.896240,335.913361 322.698822,335.596771C327.228424,335.219635 328.372986,337.188049 328.342041,341.407928C328.185883,362.715698 328.266510,384.025238 328.261688,405.334137C328.260132,412.186127 328.256805,412.186127 320.909363,412.311096M301.669952,365.008423C295.854095,354.320007 283.816345,350.650452 274.124878,356.611633C264.651733,362.438538 261.929047,377.159515 268.562775,386.684814C274.734344,395.546509 288.041443,397.276093 296.853241,389.902008C304.682800,383.349915 304.819550,374.753296 301.669952,365.008423z"></path>
              <path d="M605.060913,373.000000C605.062988,384.657990 604.973816,395.817139 605.115417,406.973328C605.163574,410.764404 603.888367,412.517792 599.916382,412.297821C596.098145,412.086365 592.258423,412.278320 588.428223,412.263885C581.340210,412.237213 581.340271,412.228333 580.396484,405.534912C578.652649,405.182587 577.723206,406.577301 576.587097,407.410583C564.256653,416.454071 551.032898,416.485992 537.883057,410.164795C525.372864,404.151062 519.815430,393.082336 518.661011,379.565979C517.650513,367.735138 519.446167,356.688538 527.285583,347.204102C539.560242,332.353760 562.272705,329.781647 577.620483,341.553528C578.269348,342.051208 578.930420,342.532898 579.531860,342.981750C579.975769,342.721405 580.485229,342.552582 580.478455,342.407898C580.185974,336.163940 583.752686,335.041809 589.019958,335.614197C592.147156,335.954010 595.341675,335.664795 598.505798,335.677979C604.895813,335.704559 605.023010,335.813751 605.037109,342.023712C605.060242,352.182434 605.053894,362.341248 605.060913,373.000000M560.688660,354.010437C551.697937,354.960571 545.673096,359.988037 543.586243,368.281647C541.270569,377.484711 544.135803,386.858582 550.601074,391.231262C557.524597,395.913879 567.137268,395.721375 574.094788,390.760834C580.548767,386.159302 583.183777,376.489594 580.517395,367.191528C578.133301,358.877991 571.864624,354.512573 560.688660,354.010437z"></path>
              <path d="M791.203979,365.000000C791.216858,379.151947 791.068298,392.806946 791.330078,406.454102C791.419312,411.109009 789.796753,412.746704 785.268616,412.344116C781.965149,412.050415 778.614258,412.285797 775.284485,412.293915C768.156677,412.311279 768.156677,412.313538 767.357422,405.215393C764.213135,407.193054 761.370483,409.448242 758.167908,410.920929C733.721130,422.162598 707.000671,405.737396 705.710083,378.830902C705.135010,366.839264 706.926270,355.504913 715.175415,346.176605C727.394165,332.359222 748.536804,330.064270 763.725403,340.652008C764.770203,341.380341 765.547607,342.627289 767.044250,342.615326C768.603943,335.673187 768.603943,335.673187 776.271057,335.669495C791.293762,335.662231 791.290283,335.662231 791.225891,350.515137C791.205688,355.176697 791.210022,359.838379 791.203979,365.000000M768.573364,376.996460C769.015320,373.435791 768.214661,370.040833 767.117615,366.707123C764.123230,357.607910 755.689209,352.825104 745.305481,354.289215C737.101746,355.445923 731.056091,363.018951 730.341125,373.034027C729.616272,383.187927 734.786743,391.471527 743.217041,393.662537C755.729126,396.914307 764.723938,391.261047 768.573364,376.996460z"></path>
              <path d="M697.327026,399.984680C697.339050,412.311646 697.339050,412.311615 685.404663,412.283051C670.974670,412.248474 670.964172,412.248535 670.934204,397.847595C670.912354,387.349304 670.950134,376.850830 670.910339,366.352631C670.877319,357.649750 667.768311,354.120880 660.178406,354.030457C651.960327,353.932495 646.475220,358.640869 646.328003,366.479462C646.090149,379.139923 646.175232,391.806488 646.130127,404.470490C646.102478,412.239929 646.107666,412.248108 638.147339,412.267700C633.814819,412.278351 629.479553,412.159454 625.150574,412.280670C622.015259,412.368408 620.641907,411.190186 620.652283,407.922607C620.723999,385.259857 620.724670,362.596588 620.651917,339.933838C620.641296,336.624023 622.086670,335.543457 625.194092,335.645996C629.355530,335.783325 633.524902,335.671936 637.690918,335.677185C645.251038,335.686707 645.251038,335.689728 646.772644,342.860565C652.933044,338.273254 659.430969,334.844513 667.182312,334.359741C685.805542,333.194977 696.572632,343.763824 697.123047,358.999908C697.610107,372.480835 697.291077,385.990845 697.327026,399.984680z"></path>
              <path d="M462.865234,349.315674C466.810211,360.099579 470.616516,370.517090 474.916962,382.287018C479.384949,370.264709 483.446716,359.611023 487.304840,348.884125C492.050720,335.688873 491.977295,335.663025 505.813934,335.672577C509.450104,335.675079 513.086243,335.672974 516.388855,335.672974C517.832825,337.670685 516.935730,339.029816 516.375854,340.352936C506.968994,362.584229 497.464996,384.774902 488.184998,407.058929C486.539337,411.010712 484.388458,412.776581 479.977966,412.379303C475.350067,411.962463 470.655884,412.190247 465.993652,412.284424C463.688049,412.331024 462.271484,411.462463 461.363007,409.333313C451.367401,385.906311 441.325592,362.499023 431.328247,339.072754C431.024841,338.361816 431.069000,337.502533 430.862396,336.117645C439.559174,335.296478 447.964783,335.637482 456.359894,335.899841C458.206085,335.957550 458.559937,337.773163 459.088776,339.116821C460.368408,342.367920 461.522064,345.668579 462.865234,349.315674z"></path>
            </svg>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <div className="relative pt-2 pb-0">
              <Link
                href={journeyButtonHref}
                onClick={(e) => handleNav(journeyNavigationId, e)}
                className={`block rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isHomeHeroState
                    ? isActive(journeyNavigationId, journeyButtonHref)
                      ? "bg-muted text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                    : isHomeHeroP2State || isHomepageHeroState
                      ? "text-[#0d7377] hover:bg-[#0d7377]/10 hover:text-[#0d7377]"
                      : isActive(journeyNavigationId, journeyButtonHref)
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                {journeyButtonText}
              </Link>
            </div>

            {/* 
<div
  ref={(el) => { navRefs.current["journeys"] = el; }}
  className="relative pt-2 pb-0"
  onMouseEnter={() => handleMenuEnter("journeys")}
  onMouseLeave={handleMenuLeave}
>
  <HydrationSafeButton
    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
      isActive("journeys") || activeMenu === "journeys"
        ? isHomeHeroState
          ? "bg-white/20 text-white"
          : "bg-muted text-[#0d7377]"
        : isHomeHeroState
          ? "text-white/90 hover:bg-white/15 hover:text-white"
          : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
    }`}
  >
    Explore Journeys
    <ChevronDown
      className={`h-4 w-4 transition-transform duration-300 ${
        activeMenu === "journeys" ? "rotate-180" : ""
      }`}
    />
  </HydrationSafeButton>

  {activeMenu === "journeys" && (
    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
  )}
</div>
*/}

            {/* Resources */}
            <div
              ref={(el) => {
                navRefs.current["resources"] = el;
              }}
              className="relative pt-2 pb-0"
              onMouseEnter={() => handleMenuEnter("resources")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isHomeHeroState
                    ? isActive("resources") || activeMenu === "resources"
                      ? "bg-muted text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                    : isHomeHeroP2State || isHomepageHeroState
                      ? "text-[#3fb8bc] hover:bg-[#0d7377]/10 hover:text-[#0d7377]"
                      : isActive("resources") || activeMenu === "resources"
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                My Resources
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "resources" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
              {/* Active indicator bar */}
              {activeMenu === "resources" && (
                <span className="bg-primary absolute right-3 bottom-0 left-3 h-0.5 rounded-full" />
              )}
            </div>

            {/* Commented out - Tools, Guides, Services - Now under Resources */}
            {/*
            <div
              ref={(el) => {
                navRefs.current["tools"] = el;
              }}
              className="relative pt-2 pb-0"
              onMouseEnter={() => handleMenuEnter("tools")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive("tools", "/tools") || activeMenu === "tools"
                    ? isHomeHeroState
                      ? "bg-white/20 text-white"
                      : "bg-muted text-[#0d7377]"
                    : isHomeHeroState
                      ? "text-white/90 hover:bg-white/15 hover:text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                Toolbox
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "tools" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
              {activeMenu === "tools" && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
              )}
            </div>

            <div
              ref={(el) => {
                navRefs.current["guides"] = el;
              }}
              className="relative pt-2 pb-0"
              onMouseEnter={() => handleMenuEnter("guides")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive("guides") || activeMenu === "guides"
                    ? isHomeHeroState
                      ? "bg-white/20 text-white"
                      : "bg-muted text-[#0d7377]"
                    : isHomeHeroState
                      ? "text-white/90 hover:bg-white/15 hover:text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                Guides
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "guides" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
              {activeMenu === "guides" && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
              )}
            </div>

            <div
              ref={(el) => {
                navRefs.current["services"] = el;
              }}
              className="relative pt-2 pb-0"
              onMouseEnter={() => handleMenuEnter("services")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive("services", "/services") || activeMenu === "services"
                    ? isHomeHeroState
                      ? "bg-white/20 text-white"
                      : "bg-muted text-[#0d7377]"
                    : isHomeHeroState
                      ? "text-white/90 hover:bg-white/15 hover:text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                Services
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "services" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
              {activeMenu === "services" && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
              )}
            </div>
            */}
            <div className="relative pt-2 pb-0">
              <Link
                href="/blog"
                onClick={(e) => handleNav("blog", e)}
                className={`block rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isHomeHeroState
                    ? isActive("blog", "/blog")
                      ? "bg-muted text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                    : isHomeHeroP2State || isHomepageHeroState
                      ? "text-[#3fb8bc] hover:bg-[#0d7377]/8 hover:text-[#0d7377]"
                      : isActive("blog", "/blog")
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                Blog
              </Link>
            </div>
            <div className="relative pt-2 pb-0">
              <Link
                href="/about"
                onClick={(e) => handleNav("about", e)}
                className={`block rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isHomeHeroState
                    ? isActive("about", "/about")
                      ? "bg-muted text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                    : isHomeHeroP2State || isHomepageHeroState
                      ? "text-[#3fb8bc] hover:bg-[#0d7377]/8 hover:text-[#0d7377]"
                      : isActive("about", "/about")
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                About
              </Link>
            </div>

            <div className="relative pt-2 pb-0">
              <Link
                href="/pricing"
                onClick={(e) => handleNav("pricing", e)}
                className={`block rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isHomeHeroState
                    ? isActive("pricing", "/pricing")
                      ? "bg-muted text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                    : isHomeHeroP2State || isHomepageHeroState
                      ? "text-[#3fb8bc] hover:bg-[#0d7377]/8 hover:text-[#0d7377]"
                      : isActive("pricing", "/pricing")
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                Pricing
              </Link>
            </div>
            {pathname === "/" && (
              <div className="relative pt-2 pb-0">
                <Link
                  href="/#faq"
                  onClick={(e) => handleNav("faq", e)}
                  className={`block rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    isHomeHeroState
                      ? isActive("faq")
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                      : isHomeHeroP2State || isHomepageHeroState
                        ? "text-[#3fb8bc] hover:bg-[#0d7377]/10 hover:text-[#0d7377]"
                        : isActive("faq")
                          ? "bg-muted text-[#0d7377]"
                          : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                  }`}
                >
                  FAQ
                </Link>
              </div>
            )}
            <div className="relative pt-2 pb-0">
              <Link
                href="/#contact"
                onClick={(e) => handleNav("contact", e)}
                className={`block rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isHomeHeroState
                    ? isActive("contact")
                      ? "bg-muted text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                    : isHomeHeroP2State || isHomepageHeroState
                      ? "text-[#3fb8bc] hover:bg-[#0d7377]/10 hover:text-[#0d7377]"
                      : isActive("contact")
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                Contact
              </Link>
            </div>
          </nav>
        </div>

        {/* --- GLOBAL MEGAMENU PLACEMENT --- */}
        <div
          ref={megaMenuContainerRef}
          className="pointer-events-auto absolute top-[calc(100%-14px)] right-0 left-0 z-[9999] w-full px-6"
          onMouseEnter={() => {
            if (activeMenu && activeMenu !== "profile") {
              if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
            }
          }}
          onMouseLeave={handleMenuLeave}
        >
          {activeMenu === "journeys" && (
            <MegaMenu
              key="journeys"
              isOpen={true}
              arrowOffset={arrowOffset}
              {...NAV_DATA.journeys}
            />
          )}
          {activeMenu === "resources" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
              style={{ width: "200px", left: `${arrowOffset - 90}px` }}
            >
              <div>
                <Link
                  href="/resources?tab=toolbox"
                  onClick={handleLinkClick}
                  className="text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:text-[#0d7377]"
                >
                  <Wrench className="h-4 w-4 text-[#0d7377] dark:text-teal-400" />
                  My Tools
                </Link>
                <Link
                  href="/resources?tab=services"
                  onClick={handleLinkClick}
                  className="text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:text-[#0d7377]"
                >
                  <Briefcase className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  My Services
                </Link>
                <Link
                  href="/resources?tab=guides"
                  onClick={handleLinkClick}
                  className="text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:text-[#0d7377]"
                >
                  <BookOpen className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                  My Guides
                </Link>
              </div>
            </motion.div>
          )}
      
        </div>

        {/* Right side – Search + Login */}

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          {/* <HydrationSafeButton
            onClick={() => setLanguage(language === "en" ? "ur" : "en")}
            className="flex items-center gap-1 p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors font-medium border border-border"
            title="Toggle Language"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs uppercase leading-none mt-0.5">
              {language === "en" ? "اردو" : "EN"}
            </span>
          </HydrationSafeButton> */}

          {isLoading && !resolvedUser
            ? null
            : isSignedIn && (
                <div className="relative" ref={notifRef}>
                  <HydrationSafeButton
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    onClick={handleBellClick}
                    className={`relative rounded-md border-0 shadow-none transition-colors ${
                      isHomeHeroState
                        ? "text-white"
                        : isHomeHeroP2State
                          ? "text-[#0d7377]"
                          : "text-rahvana-primary"
                    }`}
                    style={{
                      padding: 0,
                      width: 40,
                      height: 40,
                      background: "none",
                      boxShadow: "none",
                      border: "none",
                      borderRadius: "50%",
                    }}
                  >
                    <div className="relative inline-flex">
                      <Bell
                        className="h-5 w-5"
                        aria-hidden="true"
                        style={
                          isHomeHeroState
                            ? { color: "#305d5aff" }
                            : isHomeHeroP2State
                              ? { color: "#0d7377" }
                              : { color: "var(--rahvana-primary, #0d7377)" }
                        }
                      />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/50 bg-red-500 text-[9px] font-medium text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </HydrationSafeButton>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="fixed top-[76px] right-0 left-1/2 z-9999 mt-1 w-[calc(100vw-32px)] max-w-sm origin-top -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl md:absolute md:top-full md:right-0 md:left-auto md:w-80 md:origin-top-right md:-translate-x-0"
                      >
                        {/* Header */}
                        <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-[#0d7377]" />
                            <span className="text-foreground text-sm font-bold">Notifications</span>
                          </div>
                          <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase">
                            {unreadCount > 0 ? `${unreadCount} New` : "0 New"}
                          </span>
                        </div>

                        {/* Body */}
                        <div ref={notifScrollRef} className="max-h-[340px] overflow-y-auto">
                          {notifList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-4 px-6 py-10">
                              <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-2xl">
                                <BellOff className="text-muted-foreground/50 h-6 w-6" />
                              </div>
                              <div className="space-y-1 text-center">
                                <p className="text-foreground text-sm font-semibold">
                                  All caught up!
                                </p>
                                <p className="text-muted-foreground mx-auto max-w-[180px] text-xs leading-relaxed">
                                  No pending notifications right now.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="divide-border divide-y">
                                {notifList.slice(0, visibleNotifCount).map((n: any) => {
                                  const isExpanded = expandedNotifs.has(n.id);
                                  const bodyLong = n.body && n.body.length > 80;
                                  const isRead =
                                    n._source === "app" ? !!n.is_read : readIds.has(n.id);
                                  const timeLabel = formatNotifTime(n.created_at);
                                  return (
                                    <div
                                      key={n.id}
                                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                                        !isRead
                                          ? n.priority === "critical" || n.priority === "high"
                                            ? "bg-orange-50 hover:bg-orange-100/60"
                                            : "bg-[#f0f7ff] hover:bg-[#e8f2fb]"
                                          : "hover:bg-muted/30 bg-white"
                                      }`}
                                    >
                                      {/* Unread dot — only when unread */}
                                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0">
                                        {!isRead && (
                                          <div
                                            className={`h-1.5 w-1.5 rounded-full ${n.priority === "critical" ? "bg-red-500" : n.priority === "high" ? "bg-orange-400" : "bg-[#0d7377]"}`}
                                          />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <p
                                            className={`text-foreground text-[12px] ${isRead ? "font-medium opacity-70" : "font-bold"}`}
                                          >
                                            {n.title}
                                          </p>
                                          {timeLabel && (
                                            <span className="text-muted-foreground/70 mt-0.5 shrink-0 text-[10px] whitespace-nowrap">
                                              {timeLabel}
                                            </span>
                                          )}
                                        </div>
                                        <p
                                          className={`mt-0.5 text-[11px] leading-relaxed ${isRead ? "text-muted-foreground/60" : "text-muted-foreground"} ${isExpanded ? "" : "line-clamp-2"}`}
                                        >
                                          {n.body}
                                        </p>
                                        {bodyLong && (
                                          <button
                                            onClick={() => toggleExpand(n.id)}
                                            className="mt-0.5 text-[10px] font-bold text-[#0d7377] hover:underline"
                                          >
                                            {isExpanded ? "Show less ↑" : "Read more ↓"}
                                          </button>
                                        )}
                                        {!isRead && (
                                          <button
                                            onClick={() => markOneRead(n.id)}
                                            className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#0d7377] hover:underline"
                                          >
                                            <span className="flex h-3 w-3 items-center justify-center rounded-full border border-[#0d7377] text-[7px]">
                                              ✓
                                            </span>
                                            Mark as read
                                          </button>
                                        )}
                                        {n.action_label && n.action_url && (
                                          <a
                                            href={n.action_url}
                                            className="mt-1 inline-block text-[10px] font-black tracking-wide text-[#0d7377] uppercase hover:underline"
                                          >
                                            {n.action_label} →
                                          </a>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => dismissNotif(n.id)}
                                        className="text-muted-foreground mt-0.5 shrink-0 text-[10px] hover:text-red-400"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {notifList.length > visibleNotifCount &&
                                (!notifSeeAll ? (
                                  <button
                                    onClick={() => setNotifSeeAll(true)}
                                    className="hover:bg-muted/50 border-border w-full border-t px-4 py-2.5 text-xs font-bold text-[#0d7377] transition-colors"
                                  >
                                    See More ({notifList.length - visibleNotifCount})
                                  </button>
                                ) : (
                                  <div
                                    ref={notifSentinelRef}
                                    className="text-muted-foreground/70 flex items-center justify-center px-4 py-3 text-[10px]"
                                  >
                                    Loading more...
                                  </div>
                                ))}
                            </>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="border-border bg-muted/20 flex items-center justify-between border-t px-4 py-3">
                          {notifList.length > 0 && (
                            <button
                              className="text-muted-foreground text-xs font-medium transition-colors hover:text-red-400"
                              onClick={() => notifList.forEach((n: any) => dismissNotif(n.id))}
                            >
                              Delete all
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

          {/* ── Favorite Items Button ── */}
          {isSignedIn && (
            <div className="relative" ref={quickAccessRef}>
              <HydrationSafeButton
                aria-label="Quick Access List"
                onClick={() => {
                  setQuickAccessOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                className={`relative rounded-md border-0 shadow-none transition-colors ${
                  isHomeHeroState
                    ? "text-white"
                    : isHomeHeroP2State
                      ? "text-[#0d7377]"
                      : quickAccessOpen
                        ? "text-[#0d7377]"
                        : "text-rahvana-primary"
                }`}
                style={{
                  padding: 0,
                  width: 40,
                  height: 40,
                  background: "none",
                  boxShadow: "none",
                  border: "none",
                  borderRadius: "50%",
                }}
              >
                <div className="relative inline-flex">
                  <Heart
                    className={`h-5 w-5 transition-all duration-200 ${quickAccessOpen ? "fill-[#0d7377] text-[#0d7377]" : ""}`}
                    style={
                      isHomeHeroState
                        ? { color: "#305d5aff" }
                        : isHomeHeroP2State
                          ? { color: "#0d7377" }
                          : {}
                    }
                  />
                  {quickAccessItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/50 bg-[#0d7377] text-[9px] font-medium text-white">
                      {quickAccessItems.length > 9 ? "9+" : quickAccessItems.length}
                    </span>
                  )}
                </div>
              </HydrationSafeButton>

              <AnimatePresence>
                {quickAccessOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="fixed top-[76px] right-0 left-1/2 z-[9999] mt-1 w-[calc(100vw-32px)] max-w-sm origin-top -translate-x-1/2 overflow-visible rounded-xl border border-slate-200 bg-white shadow-xl md:absolute md:top-full md:right-0 md:left-auto md:w-72 md:origin-top-right md:-translate-x-0"
                  >
                    {/* Header */}
                    <div className="border-border bg-muted/30 flex items-center justify-between rounded-t-xl border-b px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-[#0d7377] text-[#0d7377]" />
                        <span className="text-foreground text-sm font-bold">Favorites</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        {quickAccessItems.length > 0 && (
                          <div className="flex items-center rounded-lg border border-slate-200/60 bg-slate-100 p-0.5 dark:bg-slate-800">
                            <button
                              onClick={() => handleViewModeChange("list")}
                              className={`rounded-md p-1 transition-all ${
                                viewMode === "list"
                                  ? "bg-white text-[#0d7377] shadow-xs dark:bg-slate-700"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              title="List View"
                            >
                              <List className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleViewModeChange("grid")}
                              className={`rounded-md p-1 transition-all ${
                                viewMode === "grid"
                                  ? "bg-white text-[#0d7377] shadow-xs dark:bg-slate-700"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              title="Grid View"
                            >
                              <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase">
                          {quickAccessItems.length}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[320px] overflow-y-auto">
                      {quickAccessItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d7377]/8">
                            <Heart className="h-5 w-5 text-[#0d7377]/40" />
                          </div>
                          <div className="space-y-1 text-center">
                            <p className="text-foreground text-sm font-semibold">
                              No favorites yet
                            </p>
                            <p className="text-muted-foreground mx-auto max-w-[200px] text-xs leading-relaxed">
                              Favorite any tool, guide, or service card to access it here.
                            </p>
                          </div>
                        </div>
                      ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-3 gap-3 p-4">
                          {quickAccessItems.map((item) => {
                            const style = getQuickAccessItemStyle(item);
                            return (
                              <div
                                key={item.id}
                                className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl border border-slate-100 transition-all duration-200 dark:border-slate-800 ${style.hoverBorder}`}
                                title={item.title}
                              >
                                <Link
                                  href={item.href}
                                  onClick={() => setQuickAccessOpen(false)}
                                  className="flex h-full w-full flex-col items-center justify-center p-2 text-center"
                                >
                                  <div
                                    className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg shadow-xs transition-transform duration-200 group-hover:scale-110 ${style.bg}`}
                                  >
                                    <div className="absolute inset-0.5 rounded-[9px] bg-white/15" />
                                    {(() => {
                                      const IconComponent =
                                        (item.icon_name && QUICK_ACCESS_ICON_MAP[item.icon_name]) ||
                                        Pin;
                                      return <IconComponent className="relative z-10 h-5 w-5" />;
                                    })()}
                                  </div>
                                </Link>

                                {/* Unfavorite button - appears on hover */}
                                <button
                                  onClick={() => removeQuickAccessItem(item.id)}
                                  className="text-muted-foreground absolute -top-1.5 -right-1.5 z-10 rounded-full border border-slate-200 bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:border-red-200 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800"
                                  title="Unfavorite"
                                >
                                  <HeartOff className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="divide-border divide-y">
                          {quickAccessItems.map((item) => {
                            const style = getQuickAccessItemStyle(item);
                            return (
                              <div
                                key={item.id}
                                className="hover:bg-muted/40 group flex items-center gap-3 px-4 py-3 transition-colors"
                              >
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.lightBg}`}
                                >
                                  {(() => {
                                    const IconComponent =
                                      (item.icon_name && QUICK_ACCESS_ICON_MAP[item.icon_name]) ||
                                      Pin;
                                    return <IconComponent className="h-3.5 w-3.5" />;
                                  })()}
                                </div>
                                <Link
                                  href={item.href}
                                  onClick={() => setQuickAccessOpen(false)}
                                  className="min-w-0 flex-1"
                                >
                                  <p
                                    className={`text-foreground truncate text-sm font-medium ${style.hoverText} transition-colors`}
                                  >
                                    {item.title}
                                  </p>
                                </Link>
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    onClick={() => removeQuickAccessItem(item.id)}
                                    className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-red-50 hover:text-red-500"
                                    title="Unfavorite"
                                  >
                                    <HeartOff className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-border bg-muted/20 flex items-center justify-between rounded-b-xl border-t px-4 py-2.5">
                      <Link
                        href="/resources"
                        onClick={() => setQuickAccessOpen(false)}
                        className="flex items-center gap-1 text-xs font-medium text-[#0d7377] transition-colors hover:underline"
                      >
                        <Wrench className="h-3 w-3" />
                        Browse all resources
                      </Link>
                      {quickAccessItems.length > 0 && (
                        <button
                          className="text-muted-foreground text-xs font-medium transition-colors hover:text-red-400"
                          onClick={async () => {
                            for (const item of quickAccessItems) {
                              await removeQuickAccessItem(item.id);
                            }
                          }}
                        >
                          Unfavorite all
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* LOGIN / PROFILE toggle */}
          {isLoading && !resolvedUser ? (
            <div className="h-10 w-22 animate-pulse rounded-lg bg-[#0d7377]/10" />
          ) : user ? (
            <div
              className="relative"
              ref={profileRef}
              onPointerEnter={(e) => {
                // Ignore touch pointer types to prevent double-triggering on mobile
                if (e.pointerType === "touch") return;
                handleMenuEnter("profile");
              }}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                onClick={(e) => {
                  e.stopPropagation();
                  if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
                  setActiveMenu(activeMenu === "profile" ? null : "profile");
                }}
                className={`mb-2 flex h-auto w-auto items-center justify-center rounded-none p-0 text-lg font-semibold shadow-none transition-all ${
                  isHomeHeroState
                    ? "text-white"
                    : isHomeHeroP2State
                      ? "text-[#0d7377]"
                      : "text-rahvana-primary"
                }`}
                style={{
                  background: "none",
                  boxShadow: "none",
                  border: "none",
                  width: "auto",
                  height: "auto",
                  padding: 0,
                  borderRadius: 0,
                }}
              >
                <span
                  style={
                    isHomeHeroState
                      ? { color: "#305d5aff" }
                      : isHomeHeroP2State
                        ? { color: "#0d7377" }
                        : { color: "var(--rahvana-primary, #0d7377)" }
                  }
                  // className={`flex items-center justify-center w-[34px] h-[34px] rounded-full border-[1.5px] text-[15px] font-bold transition-colors ${
                  //   isHomeHeroState || isHomeHeroP2State
                  //     ? "bg-white/20 border-white/40 text-white"
                  //     : "bg-[#0d7377]/10 border-[#0d7377]/30 text-[#0d7377]"
                  // }`}
                >
                  {(
                    profile?.full_name ||
                    user?.user_metadata?.full_name ||
                    user?.user_metadata?.name ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </HydrationSafeButton>

              <AnimatePresence>
                {activeMenu === "profile" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-full right-0 z-9999 mt-1 max-h-[80vh] w-72 origin-top-right transform overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                  >
                    {/* Header */}
                    <div className="border-border bg-muted/30 border-b px-5 py-4">
                      <h3 className="text-foreground font-bold">
                        {profile?.full_name ||
                          user?.user_metadata?.full_name ||
                          user?.user_metadata?.name ||
                          "Valued User"}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {user?.email || "No email available"}
                      </p>
                    </div>

                    {/* Section 1 */}
                    <div className="border-border border-b py-2">
                      <button
                        onClick={() => handleNav("profile")}
                        className="text-muted-foreground hover:bg-muted flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors hover:text-teal-700"
                      >
                        <UserIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        My Profile
                      </button>
                      <button
                        onClick={() => handleNav("my-journeys")}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-teal-700 transition-colors text-sm font-medium"
                      >
                        <Map className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        My Journeys
                      </button>
                      <button
                        onClick={() => handleNav("document-vault")}
                        className="text-muted-foreground hover:bg-muted flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors hover:text-teal-700"
                      >
                        <FolderLock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Document Vault
                      </button>
                      <button
                        onClick={() => handleNav("portal-wallet")}
                        className="text-muted-foreground hover:bg-muted flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors hover:text-teal-700"
                      >
                        <LockIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                        Portal Wallet
                      </button>
                    </div>

                    {/* Section 2 */}
                    <div className="border-border border-b py-2">
                      <button
                        onClick={() => handleNav("settings")}
                        className="text-muted-foreground hover:bg-muted flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors hover:text-teal-700"
                      >
                        <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        Account Settings
                      </button>
                    </div>

                    {/* Footer - Sign Out */}
                    <div className="py-2">
                      <button
                        onClick={() => setConfirmSignOutOpen(true)}
                        className="flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <HydrationSafeButton
              onClick={() => onToggleAuth?.()}
              className={`rounded-lg px-6 py-2 font-semibold shadow-md transition-all ${
                isHomeHeroState
                  ? "bg-white/50 text-[#6d9a9b] hover:bg-white/65"
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              LOGIN
            </HydrationSafeButton>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile Sidebar Overlay */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`fixed inset-0 z-100 h-dvh transition-all duration-300 lg:hidden ${
          isMenuOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Sidebar Content */}
        <div
          className={`absolute top-0 bottom-0 left-0 flex h-dvh w-70 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <Link
              href="/"
              onClick={(e) => handleNav("home", e)}
              className="group flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="152 220 710 215"
                className="text-rahvana-primary h-8 w-auto fill-current"
              >
                <path d="M194.478302,411.482117C188.648972,398.666321 181.184067,387.211884 174.078979,375.556946C161.946335,355.654999 154.218430,334.429535 152.466766,310.927032C150.965759,290.787415 151.490814,271.069061 158.657028,251.953415C161.906097,243.286591 167.372574,236.333282 175.068100,231.098938C187.972153,222.321823 212.377777,222.515015 222.031631,242.165817C226.003326,250.250381 232.154404,254.994858 241.386230,255.103607C240.874603,257.700470 239.210571,257.303253 238.057617,257.539734C214.604111,262.350281 200.098267,276.975067 192.363480,299.065857C184.921768,320.319672 187.555267,352.132874 198.628662,372.172211C195.346085,360.736084 194.548477,349.072571 194.585556,337.231354C194.686203,305.091156 209.071442,282.030487 237.587112,267.388245C252.463837,259.749298 268.363953,254.738281 283.791870,248.515182C300.024750,241.967392 315.867065,234.607849 330.889893,225.571030C331.848022,224.994675 332.727417,224.133804 334.330139,224.642090C334.086884,229.016586 332.356110,232.995224 331.110291,237.029678C325.877838,253.974487 319.356995,270.258270 307.731262,284.109070C295.584656,298.580475 279.797791,306.307983 261.751282,310.259583C255.743668,311.575104 249.729248,312.898682 243.795959,314.506500C229.390137,318.410126 220.388382,329.212219 218.286926,343.947327C216.575470,355.947906 217.905655,367.798737 218.737152,379.737518C219.623474,392.463135 221.756760,405.206818 219.303925,418.003387C217.963852,424.994537 214.710114,430.344635 207.688766,433.006439C204.303909,434.289673 202.544754,433.679260 201.368622,430.074707C199.358749,423.914886 196.908096,417.898895 194.478302,411.482117z"></path>
                <path d="M347.022308,320.000671C347.016052,314.839264 347.105347,310.174835 346.965759,305.517273C346.865234,302.162506 348.128204,300.629364 351.628418,300.734467C356.786560,300.889313 361.960175,300.922363 367.113922,300.699646C370.973633,300.532806 372.427643,301.928192 372.368347,305.879303C372.186157,318.023376 372.301971,330.171936 372.301971,342.083649C373.283447,342.867767 373.819183,342.426117 374.318726,342.006836C383.782745,334.063324 394.575775,332.615875 406.196838,335.633057C415.899536,338.152130 422.744904,346.587646 423.310516,356.622040C424.267090,373.593201 423.737030,390.584991 423.953217,407.566589C423.995270,410.868988 423.022247,412.495087 419.405853,412.347473C414.084778,412.130249 408.740967,412.096069 403.421997,412.329346C399.633331,412.495514 398.561127,410.970825 398.606415,407.354187C398.766998,394.531891 398.675171,381.706299 398.663269,368.881958C398.653717,358.575378 395.399567,354.366302 387.286011,354.116821C377.843262,353.826508 372.628845,358.719452 372.391693,368.828339C372.122253,380.313904 372.349670,391.810638 372.318054,403.302399C372.289795,413.578827 373.113983,412.175079 363.109467,412.274994C359.445770,412.311584 355.772827,412.113037 352.119568,412.309662C348.129639,412.524414 346.894379,410.660309 346.908722,406.924530C346.998840,383.444702 346.970551,359.964386 346.985443,336.484253C346.988831,331.156372 347.007996,325.828522 347.022308,320.000671z"></path>
                <path d="M320.909363,412.311096C317.090668,412.315186 313.737823,412.059113 310.437317,412.365967C305.318787,412.841858 301.746216,411.882538 302.918549,404.615967C295.871124,410.791656 288.552673,413.763123 280.156006,414.249451C254.958969,415.708740 237.504608,396.636383 239.498611,370.735535C239.781265,367.064178 240.334641,363.492889 241.348862,359.967224C249.310272,332.292297 281.741791,328.266632 299.022125,340.520233C300.048828,341.248291 300.767242,342.583801 302.297913,342.519531C303.777649,335.660950 303.777649,335.661041 311.217407,335.661530C315.046356,335.661774 318.896240,335.913361 322.698822,335.596771C327.228424,335.219635 328.372986,337.188049 328.342041,341.407928C328.185883,362.715698 328.266510,384.025238 328.261688,405.334137C328.260132,412.186127 328.256805,412.186127 320.909363,412.311096M301.669952,365.008423C295.854095,354.320007 283.816345,350.650452 274.124878,356.611633C264.651733,362.438538 261.929047,377.159515 268.562775,386.684814C274.734344,395.546509 288.041443,397.276093 296.853241,389.902008C304.682800,383.349915 304.819550,374.753296 301.669952,365.008423z"></path>
                <path d="M605.060913,373.000000C605.062988,384.657990 604.973816,395.817139 605.115417,406.973328C605.163574,410.764404 603.888367,412.517792 599.916382,412.297821C596.098145,412.086365 592.258423,412.278320 588.428223,412.263885C581.340210,412.237213 581.340271,412.228333 580.396484,405.534912C578.652649,405.182587 577.723206,406.577301 576.587097,407.410583C564.256653,416.454071 551.032898,416.485992 537.883057,410.164795C525.372864,404.151062 519.815430,393.082336 518.661011,379.565979C517.650513,367.735138 519.446167,356.688538 527.285583,347.204102C539.560242,332.353760 562.272705,329.781647 577.620483,341.553528C578.269348,342.051208 578.930420,342.532898 579.531860,342.981750C579.975769,342.721405 580.485229,342.552582 580.478455,342.407898C580.185974,336.163940 583.752686,335.041809 589.019958,335.614197C592.147156,335.954010 595.341675,335.664795 598.505798,335.677979C604.895813,335.704559 605.023010,335.813751 605.037109,342.023712C605.060242,352.182434 605.053894,362.341248 605.060913,373.000000M560.688660,354.010437C551.697937,354.960571 545.673096,359.988037 543.586243,368.281647C541.270569,377.484711 544.135803,386.858582 550.601074,391.231262C557.524597,395.913879 567.137268,395.721375 574.094788,390.760834C580.548767,386.159302 583.183777,376.489594 580.517395,367.191528C578.133301,358.877991 571.864624,354.512573 560.688660,354.010437z"></path>
                <path d="M791.203979,365.000000C791.216858,379.151947 791.068298,392.806946 791.330078,406.454102C791.419312,411.109009 789.796753,412.746704 785.268616,412.344116C781.965149,412.050415 778.614258,412.285797 775.284485,412.293915C768.156677,412.311279 768.156677,412.313538 767.357422,405.215393C764.213135,407.193054 761.370483,409.448242 758.167908,410.920929C733.721130,422.162598 707.000671,405.737396 705.710083,378.830902C705.135010,366.839264 706.926270,355.504913 715.175415,346.176605C727.394165,332.359222 748.536804,330.064270 763.725403,340.652008C764.770203,341.380341 765.547607,342.627289 767.044250,342.615326C768.603943,335.673187 768.603943,335.673187 776.271057,335.669495C791.293762,335.662231 791.290283,335.662231 791.225891,350.515137C791.205688,355.176697 791.210022,359.838379 791.203979,365.000000M768.573364,376.996460C769.015320,373.435791 768.214661,370.040833 767.117615,366.707123C764.123230,357.607910 755.689209,352.825104 745.305481,354.289215C737.101746,355.445923 731.056091,363.018951 730.341125,373.034027C729.616272,383.187927 734.786743,391.471527 743.217041,393.662537C755.729126,396.914307 764.723938,391.261047 768.573364,376.996460z"></path>
                <path d="M697.327026,399.984680C697.339050,412.311646 697.339050,412.311615 685.404663,412.283051C670.974670,412.248474 670.964172,412.248535 670.934204,397.847595C670.912354,387.349304 670.950134,376.850830 670.910339,366.352631C670.877319,357.649750 667.768311,354.120880 660.178406,354.030457C651.960327,353.932495 646.475220,358.640869 646.328003,366.479462C646.090149,379.139923 646.175232,391.806488 646.130127,404.470490C646.102478,412.239929 646.107666,412.248108 638.147339,412.267700C633.814819,412.278351 629.479553,412.159454 625.150574,412.280670C622.015259,412.368408 620.641907,411.190186 620.652283,407.922607C620.723999,385.259857 620.724670,362.596588 620.651917,339.933838C620.641296,336.624023 622.086670,335.543457 625.194092,335.645996C629.355530,335.783325 633.524902,335.671936 637.690918,335.677185C645.251038,335.686707 645.251038,335.689728 646.772644,342.860565C652.933044,338.273254 659.430969,334.844513 667.182312,334.359741C685.805542,333.194977 696.572632,343.763824 697.123047,358.999908C697.610107,372.480835 697.291077,385.990845 697.327026,399.984680z"></path>
                <path d="M462.865234,349.315674C466.810211,360.099579 470.616516,370.517090 474.916962,382.287018C479.384949,370.264709 483.446716,359.611023 487.304840,348.884125C492.050720,335.688873 491.977295,335.663025 505.813934,335.672577C509.450104,335.675079 513.086243,335.672974 516.388855,335.672974C517.832825,337.670685 516.935730,339.029816 516.375854,340.352936C506.968994,362.584229 497.464996,384.774902 488.184998,407.058929C486.539337,411.010712 484.388458,412.776581 479.977966,412.379303C475.350067,411.962463 470.655884,412.190247 465.993652,412.284424C463.688049,412.331024 462.271484,411.462463 461.363007,409.333313C451.367401,385.906311 441.325592,362.499023 431.328247,339.072754C431.024841,338.361816 431.069000,337.502533 430.862396,336.117645C439.559174,335.296478 447.964783,335.637482 456.359894,335.899841C458.206085,335.957550 458.559937,337.773163 459.088776,339.116821C460.368408,342.367920 461.522064,345.668579 462.865234,349.315674z"></path>
              </svg>
            </Link>
            <HydrationSafeButton
              className="hover:bg-muted text-muted-foreground rounded-lg p-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </HydrationSafeButton>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="flex flex-col gap-1 px-4">
              {/* Explore Journey Link */}
              <Link
                href={journeyButtonHref}
                onClick={(e) => handleNav(journeyNavigationId, e)}
                className={`block rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isHomeHeroState
                    ? isActive(journeyNavigationId, journeyButtonHref)
                      ? "bg-muted text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                    : isHomeHeroP2State || isHomepageHeroState
                      ? "text-[#0d7377] hover:bg-[#0d7377]/10 hover:text-[#0d7377]"
                      : isActive(journeyNavigationId, journeyButtonHref)
                        ? "bg-muted text-[#0d7377]"
                        : "text-muted-foreground hover:bg-muted hover:text-[#0d7377]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-[#0d7377]" />
                  <span className="font-bold">{journeyButtonText}</span>
                </div>
              </Link>

              {/* Resources Section - Mobile */}
              <div className="mt-2">
                <HydrationSafeButton
                  onClick={() => {
                    setExpandedSections((prev) =>
                      prev.includes("resources")
                        ? prev.filter((s) => s !== "resources")
                        : [...prev, "resources"]
                    );
                  }}
                  className="text-muted-foreground hover:bg-muted flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ToolCase className="h-5 w-5 text-[#db8090] dark:text-[#db8090]" />
                    <span className="font-bold">My Resources</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-400 ${
                      expandedSections.includes("resources") ? "rotate-180" : ""
                    }`}
                  />
                </HydrationSafeButton>

                <AnimatePresence initial={false}>
                  {expandedSections.includes("resources") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 ml-9 flex flex-col gap-2 border-l-2 border-slate-100 py-2 pl-4">
                        <Link
                          href="/resources?tab=toolbox"
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-md px-2 py-2 text-sm text-slate-600 transition-all hover:bg-slate-50 hover:text-[#0d7377]"
                        >
                          My Tools
                        </Link>
                        <Link
                          href="/resources?tab=services"
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-md px-2 py-2 text-sm text-slate-600 transition-all hover:bg-slate-50 hover:text-[#0d7377]"
                        >
                          My Services
                        </Link>
                        <Link
                          href="/resources?tab=guides"
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-md px-2 py-2 text-sm text-slate-600 transition-all hover:bg-slate-50 hover:text-[#0d7377]"
                        >
                          My Guides
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dynamic Mobile Menu Sections */}
              {Object.values(NAV_DATA).map((section) => {
                // Skip journeys and tools, guides, services sections
                if (
                  section.id === "journeys" ||
                  section.id === "tools" ||
                  section.id === "guides" ||
                  section.id === "services"
                ) {
                  return null;
                }
                return (
                  <div key={section.id} className="mt-2">
                    <HydrationSafeButton
                      onClick={() => {
                        setExpandedSections((prev) =>
                          prev.includes(section.id)
                            ? prev.filter((s) => s !== section.id)
                            : [...prev, section.id]
                        );
                      }}
                      className="text-muted-foreground hover:bg-muted flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {MOBILE_ICONS[section.id] || (
                          <Briefcase className="h-5 w-5 text-[#0d7377]" />
                        )}
                        <span className="font-bold">{section.label}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-400 ${
                          expandedSections.includes(section.id) ? "rotate-180" : ""
                        }`}
                      />
                    </HydrationSafeButton>

                    <AnimatePresence initial={false}>
                      {expandedSections.includes(section.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 ml-9 flex flex-col gap-4 border-l-2 border-slate-100 py-2 pl-4">
                            {section.tabs.map((tab) => (
                              <div key={tab.id} className="flex flex-col gap-2">
                                {/* Tab Label */}
                                <div className="text-sm font-semibold text-slate-900">
                                  {tab.label}
                                </div>

                                {/* Render Categories if present */}
                                {tab.categories?.map((cat, idx) => (
                                  <div key={idx} className="flex flex-col gap-1">
                                    <div className="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                      {cat.label}
                                    </div>
                                    {cat.items.map((item, i) => (
                                      <Link
                                        key={i}
                                        href={item.href}
                                        onClick={handleLinkClick}
                                        className={`block rounded-md px-2 py-2 text-sm transition-all ${
                                          item.disabled
                                            ? "cursor-not-allowed text-slate-400"
                                            : isActive(item.title, item.href)
                                              ? "bg-[#0d7377]/10 font-semibold text-[#0d7377]"
                                              : "text-slate-600 hover:bg-slate-50 hover:text-[#0d7377]"
                                        }`}
                                      >
                                        <span className="flex items-center gap-2">
                                          {item.title}
                                          {/* {item.badge && (
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            item.badge === "Live"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {item.badge}
                                        </span>
                                      )} */}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                ))}

                                {/* Render Direct Items if present */}
                                {tab.items?.map((item, i) => (
                                  <Link
                                    key={i}
                                    href={item.href}
                                    onClick={handleLinkClick}
                                    className={`block rounded-md px-2 py-2 text-sm transition-all ${
                                      item.disabled
                                        ? "cursor-not-allowed text-slate-400"
                                        : isActive(item.title, item.href)
                                          ? "bg-[#0d7377]/10 font-semibold text-[#0d7377]"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-[#0d7377]"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      {item.title}
                                      {/* {item.badge && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        item.badge === "Live"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )} */}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            ))}

                            {/* Footer Link */}
                            {section.footerLink && (
                              <Link
                                href={section.footerLink.href}
                                onClick={handleLinkClick}
                                className="mt-2 flex items-center gap-1 px-2 text-sm font-semibold text-[#0d7377] hover:underline"
                              >
                                {section.footerLink.label} &rarr;
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* <div className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">General</div> */}
              <HydrationSafeButton
                onClick={() => handleNav("blog")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  isActive("blog")
                    ? "bg-[#0d7377]/10 text-[#0d7377]"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <FileText className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                <span className="font-bold">Blog</span>
              </HydrationSafeButton>
              <HydrationSafeButton
                onClick={() => handleNav("about")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  isActive("about")
                    ? "bg-[#0d7377]/10 text-[#0d7377]"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <span className="font-bold">About</span>
              </HydrationSafeButton>
              <HydrationSafeButton
                onClick={() => handleNav("pricing")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  isActive("pricing")
                    ? "bg-[#0d7377]/10 text-[#0d7377]"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <CreditCard className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                <span className="font-bold">Pricing</span>
              </HydrationSafeButton>
              {pathname === "/" && (
                <HydrationSafeButton
                  onClick={() => handleNav("faq")}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    isActive("faq")
                      ? "bg-[#0d7377]/10 text-[#0d7377]"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <HelpCircleIcon className="text- h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                  <span className="font-bold">FAQ</span>
                </HydrationSafeButton>
              )}
              <HydrationSafeButton
                onClick={() => handleNav("contact")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  isActive("contact")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Mail className="h-5 w-5 text-[#0d7377]" />
                <span className="font-bold">Contact</span>
              </HydrationSafeButton>
            </nav>
          </div>

          <div className="border-t bg-slate-50 p-6">
            {isLoading && !resolvedUser ? (
              <div className="bg-primary/30 h-14 w-full animate-pulse rounded-xl" />
            ) : (
              <HydrationSafeButton
                onClick={() => {
                  if (isSignedIn) {
                    setConfirmSignOutOpen(true);
                  } else {
                    onToggleAuth?.();
                    setIsMenuOpen(false);
                  }
                }}
                className={`w-full rounded-xl py-4 font-bold shadow-lg transition-all ${
                  isSignedIn
                    ? "border border-red-500 bg-transparent text-red-500 hover:bg-slate-100"
                    : "bg-[#0d9488] text-white hover:bg-[#0f766e]"
                }`}
              >
                {isSignedIn ? "Sign Out" : "Login"}
              </HydrationSafeButton>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={confirmSignOutOpen}
        onOpenChange={setConfirmSignOutOpen}
        title="Sign Out?"
        description="Are you sure you want to sign out? You will need to log in again to access your account."
        cancelText="Cancel"
        confirmText="Sign Out"
        onConfirm={() => {
          onToggleAuth?.(); // Sign out
          setConfirmSignOutOpen(false);
          setActiveMenu(null); // Close your menu
        }}
      />
    </header>
  );
}
