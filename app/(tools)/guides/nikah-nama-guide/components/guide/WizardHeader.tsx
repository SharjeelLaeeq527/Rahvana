import { HelpCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface WizardHeaderProps {
  onWhatsThis: () => void;
}

const WizardHeader = ({ onWhatsThis }: WizardHeaderProps) => {
  return (
    <header
      className="
        fixed top-0 left-0 w-full z-50
        h-14 px-6 mt-24
        flex items-center justify-center
        bg-[linear-gradient(135deg,#0d7377,#14a0a6)]
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            w-8 h-8 rounded-lg
            bg-white/20
            flex items-center justify-center
          "
        >
          <FileText className="w-4.5 h-4.5 text-white" />
        </div>

        <h1
          className="
            text-white text-base font-bold
            tracking-[-0.01em]
            font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]
          "
        >
          Nikah Nama & Marriage Registration
        </h1>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onWhatsThis}
        className="
          absolute right-6
          flex items-center gap-2
          px-4 py-2
          rounded-full
          bg-white/15 hover:bg-white/25
          backdrop-blur-md
          border border-white/25
          text-white text-sm font-semibold
          transition
          cursor-pointer
        "
      >
        <HelpCircle className="w-4 h-4" />
        What&apos;s this?
      </motion.button>
    </header>
  );
};

export default WizardHeader;
