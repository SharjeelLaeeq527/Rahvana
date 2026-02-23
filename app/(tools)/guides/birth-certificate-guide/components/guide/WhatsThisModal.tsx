import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Baby, Info } from "lucide-react";
import guideData from "@/data/birth-certificate-guide-data.json";

interface WhatsThisModalProps {
  open: boolean;
  onClose: () => void;
  onDontShowAgain?: (val: boolean) => void;
}

const WhatsThisModal = ({
  open,
  onClose,
  onDontShowAgain,
}: WhatsThisModalProps) => {
  const [dontShow, setDontShow] = useState(false);
  const data = guideData.wizard.whats_this;

  const handleClose = () => {
    if (dontShow && onDontShowAgain) {
      onDontShowAgain(true);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="
              fixed inset-0
              bg-black/50
              backdrop-blur-sm
              z-100
            "
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="
              fixed
              top-[50%] left-[50%]
              -translate-x-1/2 -translate-y-1/2
              w-[90%] max-w-150
              max-h-[85vh] overflow-y-auto
              bg-white
              rounded-2xl
              shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)]
              z-100
              p-8
            "
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Baby className="w-5.5 h-5.5 text-teal-700" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
                    {data.heading}
                  </h2>
                  <p className="text-[0.8rem] text-slate-500">
                    {data.sub}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="
                  w-8 h-8 rounded-lg
                  bg-slate-100
                  flex items-center justify-center
                  text-slate-500
                "
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
              What is Birth Registration?
            </h3>

            <p className="text-[0.875rem] leading-[1.7] text-slate-600 mb-6 font-['Plus_Jakarta_Sans',system-ui]">
              {data.description}
            </p>

            <h3 className="text-base font-bold text-slate-900 mb-3 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
              Quick Instructions
            </h3>

            <ol className="mb-6 list-none p-0">
              {data.quick_instructions.map((item: string, i: number) => (
                <li
                  key={i}
                  className="
                    flex items-center gap-3
                    text-[0.875rem]
                    text-slate-700
                    mb-2
                    leading-normal
                    font-['Plus_Jakarta_Sans',system-ui]
                  "
                >
                  <span className="text-teal-700 font-bold min-w-4">
                    {i + 1}.
                  </span>
                  {item}
                </li>
              ))}
            </ol>

            <div
              className="
              p-4 rounded-xl
              bg-amber-50
              border border-amber-200
              flex gap-3 items-start
            "
            >
              <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />

              <div>
                <p className="text-[0.8rem] font-bold text-amber-800 mb-1 font-['Plus_Jakarta_Sans',system-ui]">
                  Important Disclaimer
                </p>

                <p className="text-[0.8rem] leading-[1.6] text-amber-900/80 font-['Plus_Jakarta_Sans',system-ui]">
                  {data.disclaimer}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={(e) => setDontShow(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors font-['Plus_Jakarta_Sans',system-ui]">
                  Don't show this again
                </span>
              </label>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="px-6 py-2 rounded-xl bg-teal-600 text-white text-sm font-bold shadow-md hover:bg-teal-700 transition-all font-['Plus_Jakarta_Sans',system-ui]"
              >
                Got it
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatsThisModal;
