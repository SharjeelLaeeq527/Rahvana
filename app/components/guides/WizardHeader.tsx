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
  "police-verification-guide": {
    id: "guide-police-verification",
    title: "Character Certificate Guide",
    icon: "Shield",
  },
  "cnic-guide": { id: "guide-cnic", title: "CNIC Guide", icon: "FileText" },
  "birth-certificate-guide": {
    id: "guide-birth-certificate",
    title: "Birth Certificate Guide",
    icon: "FileText",
  },
  "frc-guide": { id: "guide-frc", title: "FRC Guide", icon: "Globe" },
  "nikah-nama-guide": {
    id: "guide-marriage-certificate",
    title: "Marriage Registration Guide",
    icon: "Heart",
  },
  "polio-vaccination-guide": {
    id: "guide-vaccinations",
    title: "Polio Vaccination Guide",
    icon: "Syringe",
  },
  "step-parent-guide": {
    id: "guide-step-parent",
    title: "Step-Parent Relationship Guide",
    icon: "Users",
  },
  "adoptive-parent-guide": {
    id: "guide-adoption",
    title: "Adoptive Parent & Guardianship Guide",
    icon: "Heart",
  },
  "adoption-guide": {
    id: "guide-adoption",
    title: "Adoptive Parent & Guardianship Guide",
    icon: "Heart",
  },
  "child-citizenship-guide": {
    id: "guide-child-citizenship",
    title: "Child Citizenship Guide",
    icon: "BookOpen",
  },
};

const WizardHeader = ({ onWhatsThis, title = "Guide" }: WizardHeaderProps) => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { items } = useQuickAccess();

  const slug = pathname?.split("/").pop() || "";
  const guideInfo = GUIDE_ROUTE_MAP[slug];
  const pinned = guideInfo ? items.some((i) => i.id === guideInfo.id) : false;

  return (
    <header className="fixed top-0 left-0 z-40 mt-16 flex h-14 w-full items-center bg-[linear-gradient(135deg,#0d7377,#14a0a6)] px-4 shadow-sm sm:px-6">
      {/* Pinned Items button for large screens */}
      <div className="hidden w-[180px] shrink-0 items-center justify-end overflow-visible pr-2 md:flex [&_.group>div.absolute]:!top-10 [&_.group>div.absolute]:!right-auto [&_.group>div.absolute]:!left-full [&_.group>div.absolute]:!mt-0 [&_.group>div.absolute]:!-ml-20 [&_.group>div.absolute>div.absolute]:!right-auto [&_.group>div.absolute>div.absolute]:!left-4">
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
                ? "!border-white/30 !bg-white/20 !text-white hover:!border-red-400/50 hover:!bg-red-500/20"
                : "!border-white/15 !bg-white/10 !text-white/80 hover:!bg-white/20 hover:!text-white"
            }
          />
        )}
      </div>

      {/* Centered Icon + Title */}
      <div className="flex min-w-0 flex-1 items-center justify-start gap-2 pr-3 sm:gap-3 md:absolute md:left-1/2 md:flex-none md:-translate-x-1/2 md:pr-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <FileText className="h-4 w-4 text-white" />
        </div>

        <h1 className="truncate font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif] text-sm font-bold tracking-[-0.01em] text-white sm:text-base">
          {title}
        </h1>
      </div>

      {/* Mobile Pin Button (icon only, visible only on small devices before the what's this button) */}
      {guideInfo && (
        <div className="mr-2 shrink-0 md:hidden">
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
        className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/25 sm:px-4"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{t("wizard.common.whatsThis")}</span>
      </motion.button>
    </header>
  );
};

export default WizardHeader;
