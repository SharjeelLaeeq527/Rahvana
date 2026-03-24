"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";

interface AnimationState {
  id: string;
  startX: number;
  startY: number;
}

export function SaveGuideAnimation() {
  const [animations, setAnimations] = useState<AnimationState[]>([]);

  useEffect(() => {
    const handleSaveAnimation = (e: CustomEvent) => {
      const { startX, startY } = e.detail;
      const newAnim = {
        id: Math.random().toString(36).substring(7),
        startX,
        startY,
      };

      setAnimations((prev) => [...prev, newAnim]);

      // Auto-remove the animation from state after it finishes (2.5s)
      setTimeout(() => {
        setAnimations((prev) => prev.filter((a) => a.id !== newAnim.id));
      }, 2500);
    };

    window.addEventListener(
      "animate-save-guide",
      handleSaveAnimation as EventListener,
    );
    return () => {
      window.removeEventListener(
        "animate-save-guide",
        handleSaveAnimation as EventListener,
      );
    };
  }, []);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 99999 }}
    >
      <AnimatePresence>
        {animations.map((anim) => (
          <PlaneParticle key={anim.id} anim={anim} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function PlaneParticle({ anim }: { anim: AnimationState }) {
  const [targetCoords, setTargetCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    // Find destination target
    const targetEl = document.getElementById("my-dashboard-menu-item");
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      setTargetCoords({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    } else {
      // Fallback destination if the profile dropdown isn't loaded/visible yet
      setTargetCoords({
        x: window.innerWidth - 60,
        y: 40,
      });
    }
  }, []);

  if (!targetCoords) return null;

  return (
    <motion.div
      initial={{
        x: anim.startX - 12,
        y: anim.startY - 12,
        scale: 0.5,
        opacity: 0,
        rotate: -45,
      }}
      animate={{
        x: [
          anim.startX - 12,
          anim.startX - 12 + (targetCoords.x - anim.startX) * 0.2,
          anim.startX + (targetCoords.x - anim.startX) * 0.8 - 12,
          targetCoords.x - 12,
          targetCoords.x - 12,
        ],
        y: [
          anim.startY - 12,
          anim.startY + (targetCoords.y - anim.startY) * 0.2 - 80, // Arc up
          anim.startY + (targetCoords.y - anim.startY) * 0.8 - 80, // Maintain Arc
          targetCoords.y - 12,
          targetCoords.y - 12,
        ],
        scale: [0.5, 1.2, 1.2, 0.6, 0],
        opacity: [0, 1, 1, 1, 0],
        rotate: [-45, -20, 20, 45, 45],
      }}
      transition={{
        duration: 1.8,
        ease: "easeInOut",
        times: [0, 0.1, 0.6, 0.85, 1], // Arrives at 85%, then shrinks into the button over the last 15%
      }}
      className="absolute text-primary"
    >
      <div className="bg-primary/10 p-2 rounded-full shadow-lg border border-primary/20 backdrop-blur-sm">
        <Send className="w-5 h-5 fill-primary text-primary" />
      </div>
    </motion.div>
  );
}
