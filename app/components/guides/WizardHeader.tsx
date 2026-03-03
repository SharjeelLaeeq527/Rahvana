import { HelpCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface WizardHeaderProps {
  onWhatsThis: () => void;
  title?: string;
}

const WizardHeader = ({
  onWhatsThis,
  title = "Family Registration Certificate (FRC)",
}: WizardHeaderProps) => {
  return (
    <header
      className="fixed top-0 left-0 w-full z-40 h-14 px-4 sm:px-6
                 flex items-center
                 bg-[linear-gradient(135deg,#0d7377,#14a0a6)] shadow-sm mt-24"
    >
      {/* Empty spacer (keeps balance) */}
      <div className="hidden md:block w-[140px]" />

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
        <span className="hidden sm:inline">What&apos;s this?</span>
      </motion.button>
    </header>
  );
};

export default WizardHeader;
