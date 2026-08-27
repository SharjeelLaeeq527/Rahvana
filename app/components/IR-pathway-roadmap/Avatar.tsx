"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Avatar({ completedSteps }: { completedSteps: number[] }) {
  const [position, setPosition] = useState({ x: 100, y: 100 });

  useEffect(() => {
    const update = () => {
      const last = Math.max(...completedSteps, 0);
      const el = document.querySelectorAll("[data-step]")[last];
      if (el) {
        const rect = el.getBoundingClientRect();
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 50,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [completedSteps]);

  return (
    <motion.div
      animate={{ x: position.x - 30, y: position.y }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="fixed z-50 text-7xl pointer-events-none drop-shadow-2xl"
    >
      <div className="animate-bounce">Walker</div>
    </motion.div>
  );
}
