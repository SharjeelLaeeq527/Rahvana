"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
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
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MegaMenu from "./MegaMenu";
import { User } from "@supabase/supabase-js";
import { useAuth, UserProfile } from "@/app/context/AuthContext";
// import { useLanguage } from "@/app/context/LanguageContext";
import { NAV_DATA } from "./navigationData";
import { ConfirmationModal } from "../shared/ConfirmationModal";
// import { useTheme } from "next-themes";

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
  },
) => {
  const { className, ...rest } = props;

  // Filter out problematic attributes that might be added by extensions
  const filteredRest = { ...rest };
  const extensionAttributes = [
    "fdprocessedid",
    "data-extension",
    "data-extension-id",
  ];
  extensionAttributes.forEach((attr) => {
    if (filteredRest[attr as keyof typeof filteredRest]) {
      delete filteredRest[attr as keyof typeof filteredRest];
    }
  });

  return (
    <button
      {...filteredRest}
      className={className}
      suppressHydrationWarning={true}
    />
  );
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
        document
          .querySelectorAll(`[${attr}]`)
          .forEach((el) => el.removeAttribute(attr));
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);
};

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
      <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    ),
    tools: <Wand2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
    guides: <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    services: <Zap className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
  };

  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { profile, isLoading, user: authUser } = useAuth();
  const resolvedUser = user ?? authUser;
  // const { language, setLanguage } = useLanguage();

  const handleMenuEnter = (menu: string) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => setActiveMenu(null), 300);
  };

  const handleNav = (id: string, e?: React.MouseEvent) => {
    setIsMenuOpen(false);
    setActiveMenu(null);

    if (onNavigate) {
      if (e) e.preventDefault();
      onNavigate(id);
    } else {
      const routes: Record<string, string> = {
        home: "/",
        journeys: "/visa-category/ir-category",
        "my-journeys": "/my-journeys",
        "my-guides": "/guides/my-guides",
        "ir1-journey": "/visa-category/ir-category/ir1-journey",
        "ir5-journey": "/visa-category/ir-category/ir5-journey",
        "k1-journey": "/visa-category/ir-category/k1-journey",
        services: "/services",
        tools: "/tools",
        pricing: "/pricing",
        dashboard: "/user-dashboard",
        mfa: "/mfa-setup",
        contact: "/#contact",
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
      };

      const targetRoute = routes[id] || "/";
      router.push(targetRoute);
    }
  };

  const isActive = (id: string, href?: string) => {
    if (activeSection && activeSection === id) return true;
    if (href && pathname === href) return true;
    return false;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md shadow-lg py-2`}
      //   scrolled
      //     ? "bg-background/80 backdrop-blur-md shadow-lg py-2"
      //     : "bg-background py-4"
      // } border-b border-border`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Desktop navigation */}
      {/* ------------------------------------------------------------------ */}
      <div className="container mx-auto px-6 py-3 md:py-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <HydrationSafeButton
            className="lg:hidden text-foreground p-1 hover:bg-muted rounded-md transition-colors"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="152 220 710 215"
              className="h-8 w-auto text-rahvana-primary fill-current"
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

          <nav className="hidden lg:flex items-center gap-1">
            <div
              className="relative py-2"
              onMouseEnter={() => handleMenuEnter("journeys")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive("journeys") || activeMenu === "journeys"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                Explore Journeys
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "journeys" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
            </div>

            {/* Toolbox */}
            <div
              className="relative py-2"
              onMouseEnter={() => handleMenuEnter("tools")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive("tools", "/tools") || activeMenu === "tools"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                Toolbox
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "tools" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
            </div>

            {/* Guides */}
            <div
              className="relative py-2"
              onMouseEnter={() => handleMenuEnter("guides")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive("guides") || activeMenu === "guides"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                Guides
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "guides" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
            </div>

            {/* Services */}
            <div
              className="relative py-2"
              onMouseEnter={() => handleMenuEnter("services")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive("services", "/services") || activeMenu === "services"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                Services
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${activeMenu === "services" ? "rotate-180" : ""}`}
                />
              </HydrationSafeButton>
            </div>

            <Link
              href="/pricing"
              onClick={(e) => handleNav("pricing", e)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                isActive("pricing", "/pricing")
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              }`}
            >
              Pricing
            </Link>

            <Link
              href="/#contact"
              onClick={(e) => handleNav("contact", e)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                isActive("contact")
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              }`}
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* --- GLOBAL MEGAMENU PLACEMENT --- */}
        <div
          className="absolute top-full left-0 right-0 max-w-7xl mx-auto px-6 pb-10 pointer-events-none"
          onMouseEnter={() => {
            if (activeMenu && activeMenu !== "profile") {
              if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
            }
          }}
          onMouseLeave={handleMenuLeave}
        >
          <div className="pointer-events-auto">
            <AnimatePresence>
              {activeMenu === "journeys" && (
                <MegaMenu key="journeys" isOpen={true} {...NAV_DATA.journeys} />
              )}
              {activeMenu === "tools" && (
                <MegaMenu key="tools" isOpen={true} {...NAV_DATA.tools} />
              )}
              {activeMenu === "guides" && (
                <MegaMenu key="guides" isOpen={true} {...NAV_DATA.guides} />
              )}
              {activeMenu === "services" && (
                <MegaMenu key="services" isOpen={true} {...NAV_DATA.services} />
              )}
            </AnimatePresence>
          </div>
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
                    variant="outline"
                    size="icon"
                    aria-label="Notifications"
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    className="relative bg-transparent hover:bg-primary/10 p-2 rounded-md text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  </HydrationSafeButton>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border border-border bg-card z-[9999] overflow-hidden origin-top-right"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">Notifications</span>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            0 New
                          </span>
                        </div>

                        {/* Empty state body */}
                        <div className="flex flex-col items-center justify-center px-6 py-10 gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
                              <BellOff className="w-7 h-7 text-muted-foreground/50" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-primary" />
                            </span>
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-foreground">You&apos;re all caught up!</p>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                              No new notifications right now. We&apos;ll let you know when something needs your attention.
                            </p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-center">
                          <button
                            className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            Dismiss
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

          {/* LOGIN / PROFILE toggle */}
          {isLoading && !resolvedUser ? (
            <div className="w-[88px] h-10 rounded-lg bg-primary/10 animate-pulse" />
          ) : user ? (
            <div
              className="relative"
              onMouseEnter={() => handleMenuEnter("profile")}
              onMouseLeave={handleMenuLeave}
            >
              <HydrationSafeButton className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 text-primary hover:bg-primary/20 transition-all shadow-sm font-semibold text-lg">
                {(
                  profile?.full_name ||
                  user?.user_metadata?.full_name ||
                  user?.user_metadata?.name ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </HydrationSafeButton>

              <AnimatePresence>
                {activeMenu === "profile" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-72 max-h-[80vh] overflow-y-auto rounded-xl shadow-xl border border-border bg-card z-9999 transform origin-top-right"
                  >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-border bg-muted/30">
                      <h3 className="font-bold text-foreground">
                        {profile?.full_name ||
                          user?.user_metadata?.full_name ||
                          user?.user_metadata?.name ||
                          "Valued User"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.email || "No email available"}
                      </p>
                    </div>

                    {/* Section 1 */}
                    <div className="py-2 border-b border-border">
                      <button
                        onClick={() => handleNav("dashboard")}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <Layout className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        My Dashboard
                      </button>
                      <button
                        onClick={() => handleNav("profile")}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        My Profile
                      </button>
                      <button
                        onClick={() => handleNav("document-vault")}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <FolderLock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Document Vault
                      </button>
                      <button
                        onClick={() => handleNav("portal-wallet")}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <LockIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        Portal Wallet
                      </button>

                      {/* <button
                        onClick={() =>
                          setTheme(theme === "dark" ? "light" : "dark")
                        }
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <div className="relative w-4 h-4">
                          <Sun className="absolute w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </div>
                        <span>Switch Theme</span>
                      </button> */}
                    </div>

                    {/* Section 2 */}
                    <div className="py-2 border-b border-border">
                      <button
                        onClick={() => handleNav("settings")}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        Account Settings
                      </button>
                      {/* <button
                        onClick={() => handleNav("view-security-questions")}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        My Credentials
                      </button> */}
                      <button
                        onClick={() => {}} // Placeholder
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors text-sm font-medium"
                      >
                        <HelpCircle className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                        Help Center
                      </button>
                    </div>

                    {/* Footer - Sign Out */}
                    <div className="py-2">
                      <button
                        onClick={() => setConfirmSignOutOpen(true)}
                        className="flex items-center gap-3 w-full py-2.5 px-5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" />
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
              className="font-semibold text-white bg-primary hover:bg-primary/90 shadow-md px-6 py-2 rounded-lg transition-all"
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
        className={`fixed inset-0 z-100 h-dvh lg:hidden transition-all duration-300 ${
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Sidebar Content */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-70 bg-white shadow-2xl flex flex-col h-dvh transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            {/* <Link
                href="/"
                onClick={(e) => handleNav("home", e)}
                className="flex items-center gap-2 group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-lg shadow-primary/20 text-white font-bold text-lg">
                  R
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  Rahvana
                </span>
              </Link> */}
            <Link
              href="/"
              onClick={(e) => handleNav("home", e)}
              className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="152 220 710 215"
                className="h-8 w-auto text-rahvana-primary fill-current"
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
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
            <nav className="flex flex-col px-4 gap-1">
              {/* <HydrationSafeButton
                  onClick={() => handleNav("home")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    isActive("home", "/")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="font-bold">Home</span>
                </HydrationSafeButton> */}

              {/* Dynamic Mobile Menu Sections */}
              {Object.values(NAV_DATA).map((section) => (
                <div key={section.id} className="mt-2">
                  <HydrationSafeButton
                    onClick={() => {
                      setExpandedSections((prev) =>
                        prev.includes(section.id)
                          ? prev.filter((s) => s !== section.id)
                          : [...prev, section.id],
                      );
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {MOBILE_ICONS[section.id] || (
                        <Briefcase className="w-5 h-5 text-primary" />
                      )}
                      <span className="font-bold">{section.label}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-400 ${
                        expandedSections.includes(section.id)
                          ? "rotate-180"
                          : ""
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
                        <div className="ml-9 mt-1 flex flex-col gap-4 border-l-2 border-slate-100 pl-4 py-2">
                          {section.tabs.map((tab) => (
                            <div key={tab.id} className="flex flex-col gap-2">
                              {/* Tab Label */}
                              <div className="text-sm font-semibold text-slate-900">
                                {tab.label}
                              </div>

                              {/* Render Categories if present */}
                              {tab.categories?.map((cat, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    {cat.label}
                                  </div>
                                  {cat.items.map((item, i) => (
                                    <Link
                                      key={i}
                                      href={item.href}
                                      onClick={() => setIsMenuOpen(false)}
                                      className={`block py-2 text-sm transition-all rounded-md px-2 ${
                                        item.disabled
                                          ? "text-slate-400 cursor-not-allowed"
                                          : isActive(item.title, item.href)
                                            ? "text-primary font-semibold bg-primary/10"
                                            : "text-slate-600 hover:text-primary hover:bg-slate-50"
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
                                  onClick={() => setIsMenuOpen(false)}
                                  className={`block py-2 text-sm transition-all rounded-md px-2 ${
                                    item.disabled
                                      ? "text-slate-400 cursor-not-allowed"
                                      : isActive(item.title, item.href)
                                        ? "text-primary font-semibold bg-primary/10"
                                        : "text-slate-600 hover:text-primary hover:bg-slate-50"
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
                              onClick={() => setIsMenuOpen(false)}
                              className="text-sm font-semibold text-primary hover:underline mt-2 flex items-center gap-1 px-2"
                            >
                              {section.footerLink.label} &rarr;
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* <div className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">General</div> */}
              <HydrationSafeButton
                onClick={() => handleNav("pricing")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  isActive("pricing")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span className="font-bold">Pricing</span>
              </HydrationSafeButton>
              {/* {isSignedIn && (
                  <>
                    <HydrationSafeButton
                      onClick={() => handleNav("dashboard")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive("dashboard", "/user-dashboard")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Layout className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      <span className="font-bold">My Dashboard</span>
                    </HydrationSafeButton>
                    <HydrationSafeButton
                      onClick={() => handleNav("my-journeys")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive("my-journeys", "/my-journeys")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold">My Journeys</span>
                    </HydrationSafeButton>
                    <HydrationSafeButton
                      onClick={() => handleNav("my-guides")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive("my-guides", "/guides/my-guides")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="font-bold">My Guides</span>
                    </HydrationSafeButton>
                    <HydrationSafeButton
                      onClick={() => handleNav("profile")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive("profile", "/profile")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <UserIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      <span className="font-bold">My Profile</span>
                    </HydrationSafeButton>
                    <HydrationSafeButton
                      onClick={() => handleNav("settings")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive("settings", "/settings")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <span className="font-bold">Account Settings</span>
                    </HydrationSafeButton>
                  </>
                )} */}
              <HydrationSafeButton
                onClick={() => handleNav("contact")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  isActive("contact")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Mail className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                <span className="font-bold">Contact</span>
              </HydrationSafeButton>
            </nav>
          </div>

          <div className="p-6 border-t bg-slate-50">
            {isLoading && !resolvedUser ? (
              <div className="w-full h-[56px] rounded-xl bg-primary/30 animate-pulse" />
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
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all ${
                  isSignedIn
                    ? "bg-transparent text-red-500 border border-red-500 hover:bg-slate-100"
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
