import { HelpCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePathname } from "next/navigation";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { useQuickAccess } from "@/app/context/QuickAccessContext";

interface WizardHeaderProps {
  onWhatsThis: () => void;
  title?: string;
}

const GUIDE_ROUTE_MAP: Record<string, { id: string; title: string; icon: string }> = {
  "passport-guide": { id: "guide-passport", title: "Passport Guide", icon: "Globe" },
  "police-verification-guide": { id: "guide-police-verification", title: "Character Certificate Guide", icon: "Shield" },
  "cnic-guide": { id: "guide-cnic", title: "CNIC Guide", icon: "FileText" },
  "birth-certificate-guide": { id: "guide-birth-certificate", title: "Birth Certificate Guide", icon: "FileText" },
  "frc-guide": { id: "guide-frc", title: "FRC Guide", icon: "Globe" },
  "nikah-nama-guide": { id: "guide-marriage-certificate", title: "Marriage Registration Guide", icon: "Heart" },
  "polio-vaccination-guide": { id: "guide-vaccinations", title: "Polio Vaccination Guide", icon: "Syringe" },
};

const WizardHeader = ({ onWhatsThis, title = "Guide" }: WizardHeaderProps) => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { items } = useQuickAccess();

  const slug = pathname?.split("/").pop() || "";
  const guideInfo = GUIDE_ROUTE_MAP[slug];
  const pinned = guideInfo ? items.some((i) => i.id === guideInfo.id) : false;

  return (
    <header
      className="fixed top-0 left-0 w-full z-40 h-14 px-4 sm:px-6
                 flex items-center
                 bg-[linear-gradient(135deg,#0d7377,#14a0a6)] shadow-sm mt-16"
    >
      {/* Pinned Items button for large screens (keeps balance on the left) */}
      <div className="hidden md:flex w-[180px] shrink-0 items-center justify-start">
        {guideInfo && (
          <QuickAccessButton
            item={{
              id: guideInfo.id,
              title: guideInfo.title,
              href: pathname,
              icon_name: guideInfo.icon,
            }}
            className={
              pinned
                ? "!bg-white/20 !text-white !border-white/30 hover:!bg-red-500/20 hover:!border-red-400/50"
                : "!bg-white/10 !text-white/80 hover:!text-white !border-white/15 hover:!bg-white/20"
            }
          />
        )}
      </div>

      {/* Centered Icon + Title */}
      <div className="flex-1 md:flex-none flex items-center justify-start md:absolute md:left-1/2 md:-translate-x-1/2 gap-2 sm:gap-3 min-w-0 pr-3 md:pr-0">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>

        <h1
          className="text-white text-sm sm:text-base font-bold tracking-[-0.01em]
                       font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif] truncate"
        >
          {title}
        </h1>
      </div>

      {/* Mobile Pin Button (icon only, visible only on small devices before the what's this button) */}
      {guideInfo && (
        <div className="md:hidden mr-2 shrink-0">
          <QuickAccessButton
            item={{
              id: guideInfo.id,
              title: guideInfo.title,
              href: pathname,
              icon_name: guideInfo.icon,
            }}
            mode="icon"
            className={
              pinned
                ? "!bg-white/30 !text-white hover:!bg-red-500/20"
                : "!bg-white/10 !text-white/80 hover:!text-white"
            }
          />
        </div>
      )}

      {/* Right Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onWhatsThis}
        className="ml-auto shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full
                   bg-white/15 backdrop-blur-md
                   border border-white/25
                   text-white text-sm font-semibold
                   hover:bg-white/25
                   transition-colors duration-200"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">{t("wizard.common.whatsThis")}</span>
      </motion.button>
    </header>
  );
};

export default WizardHeader;
