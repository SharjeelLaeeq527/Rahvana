import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Info } from "lucide-react";

interface WhatsThisData {
  heading: string;
  sub: string;
  description: string;
  quick_instructions: string[];
  disclaimer: string;
}

interface WhatsThisModalProps {
  open: boolean;
  onClose: () => void;
  data: WhatsThisData;
  documentLabel?: string;
}

const WhatsThisModal = ({
  open,
  onClose,
  data,
  documentLabel = "Family Registration Certificate",
}: WhatsThisModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            className="fixed top-1/2 left-1/2 z-101 w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto 
                       -translate-x-1/2 -translate-y-1/2
                       bg-white rounded-3xl shadow-2xl px-8 py-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome!
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Let’s walk you through the <span className="font-semibold">{documentLabel}</span> process step-by-step.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-gray-100 
                           flex items-center justify-center 
                           text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                What is a {documentLabel}?
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {data.description}
              </p>
            </div>

            {/* Quick Instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Quick Overview
              </h3>

              <ol className="space-y-3">
                {data.quick_instructions.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-700"
                  >
                    <span className="min-w-6 h-6 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>

            {/* Soft Info Note */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3 items-start">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  Helpful Note
                </p>
                <p className="text-sm leading-relaxed text-blue-700">
                  {data.disclaimer}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      localStorage.setItem("hide_whats_this_modal", "true");
                    } else {
                      localStorage.removeItem("hide_whats_this_modal");
                    }
                  }}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
                Don’t show this again
              </label>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold
                           bg-teal-600 text-white
                           hover:bg-teal-700
                           transition-colors"
              >
                Got it, let&apos;s continue →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatsThisModal;