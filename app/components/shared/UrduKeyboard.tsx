"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Delete, Space } from "lucide-react";

interface UrduKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
}

const URDU_CHARS = [
  ["ق", "و", "ر", "ٹ", "ت", "ی", "ہ", "ا"],
  ["پ", "س", "د", "ف", "گ", "ح", "ج", "ک", "ل", "م"],
  ["ز", "ش", "چ", "ط", "ظ", "ع", "غ", "ن", "خ", "ب"],
  ["ڈ", "ذ", "ڑ", "ث", "ص", "ض", "ے", "ء", "ؤ", "ئ"],
];

export const UrduKeyboard: React.FC<UrduKeyboardProps> = ({
  isOpen,
  onClose,
  onKeyPress,
  onBackspace,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "120%", x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: "120%", x: "-50%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 z-100 w-[95vw] max-w-2xl bg-white border border-[#d0e8e9] rounded-2xl shadow-[0_12px_50px_rgba(0,0,0,0.2)] p-3 md:p-4"
        >
          <div className="w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d7377]" />
                <span className="text-[10px] font-bold text-[#0d7377] uppercase tracking-wider">
                  Urdu Keyboard
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Keyboard Grid */}
            <div className="space-y-1">
              {URDU_CHARS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1">
                  {row.map((char) => (
                    <KeyButton
                      key={char}
                      onClick={() => onKeyPress(char)}
                      className="flex-1 min-w-[32px] max-w-[48px] h-9 md:h-11 text-lg md:text-xl font-medium"
                    >
                      {char}
                    </KeyButton>
                  ))}
                </div>
              ))}

              {/* Bottom Row */}
              <div className="flex justify-center gap-1 mt-1">
                <KeyButton
                  onClick={onBackspace}
                  className="w-10 h-9 md:h-11 bg-gray-50 border-gray-200"
                >
                  <Delete className="w-4 h-4 text-gray-600" />
                </KeyButton>

                <KeyButton
                  onClick={() => onKeyPress(" ")}
                  className="flex-[2] max-w-sm h-9 md:h-11 bg-gray-50 border-gray-200"
                >
                  <Space className="w-4 h-4 text-gray-600" />
                </KeyButton>

                <KeyButton
                  onClick={onClose}
                  className="w-14 h-9 md:h-11 bg-[#0d7377] border-[#0d7377] text-[10px] font-bold hover:text-white hover:bg-[#0a5a5d]"
                >
                  DONE
                </KeyButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const KeyButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}> = ({ children, onClick, className = "" }) => (
  <motion.button
    whileHover={{ y: -2, scale: 1.02 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      flex items-center justify-center rounded-xl border-2 border-[#d0e8e9] 
      bg-white text-gray-800 shadow-sm transition-colors duration-150
      hover:border-[#0d7377] hover:text-[#0d7377]
      ${className}
    `}
  >
    {children}
  </motion.button>
);
