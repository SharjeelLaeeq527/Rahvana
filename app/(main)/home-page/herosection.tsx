// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate as mAnimate,
} from "motion/react";
import * as Icons from "lucide-react";
const HERO_BG = "linear-gradient(90deg, #E4F0F6 0%, #FAFAFA 45%, #FAFAFA 55%, #FDF6EB 100%)",
  TEAL = "#2e7175",
  TEALB = "#235658",
  INDIGO = "#4a4070",
  SLATE = "#6b7c87",
  CRIMSON = "#7a4a55",
  AMBER = "#7a6535";
const FD = "'Fraunces', Georgia, serif",
  FB = "'DM Sans', system-ui, sans-serif";
const JA = "#3d7275",
  JB = "#607080",
  JC = "#8fa0a8",
  JD = "#7a6535",
  JE = "#7a4a55",
  JF = "#7a6050";
const FIVE_IDS = new Set([1, 10, 11, 15, 22]);
const INK = (a) => `rgba(12,18,42,${a})`;

const IMG = {
  standing: "/assets/images/illustartions/standing.png",
  thinking: "/assets/images/illustartions/thinking.png",
  walking: "/assets/images/illustartions/walking.png",
  reading: "/assets/images/illustartions/reading.png",
  sitting: "/assets/images/illustartions/sitting.png",
  sittingHeadDown: "/assets/images/illustartions/sittingwithheaddown.png",
  carryingBooks: "/assets/images/illustartions/carryingbooks.png",
  stressed: "/assets/images/illustartions/stressed.png",
  confused: "/assets/images/illustartions/confusedshrugging.png",
};

// Every named pose — distinct image, distinct motion
const POSES = {
  standing: {
    src: IMG.standing,
    flipX: false,
    scale: 0.8,
    yOffset: 0,
    enter: { x: 0, y: 24, scale: 0.82, rotate: 0, opacity: 0 },
    exit: { x: 0, y: 10, scale: 0.88, rotate: 0, opacity: 0 },
    spring: { type: "spring", stiffness: 240, damping: 24, mass: 0.9 },
  },
  thinking: {
    src: IMG.thinking,
    flipX: false,
    scale: 1.0,
    yOffset: 0,
    enter: { x: 0, y: 14, scale: 0.88, rotate: -4, opacity: 0 },
    exit: { x: 0, y: 8, scale: 0.9, rotate: 2, opacity: 0 },
    spring: { type: "spring", stiffness: 280, damping: 20, mass: 0.8 },
  },
  walking: {
    src: IMG.walking,
    flipX: false,
    scale: 1.0,
    yOffset: 0,
    enter: { x: -55, y: 0, scale: 0.86, rotate: 0, opacity: 0 },
    exit: { x: 44, y: 0, scale: 0.88, rotate: 0, opacity: 0 },
    spring: { type: "spring", stiffness: 320, damping: 26, mass: 0.8 },
  },
  reading: {
    src: IMG.reading,
    flipX: false,
    scale: 0.96,
    yOffset: 0,
    enter: { x: 0, y: 20, scale: 0.88, rotate: 0, opacity: 0 },
    exit: { x: 0, y: 10, scale: 0.9, rotate: 0, opacity: 0 },
    spring: { type: "spring", stiffness: 240, damping: 24, mass: 0.9 },
  },
  carryingBooks: {
    src: IMG.carryingBooks,
    flipX: false,
    scale: 1.0,
    yOffset: 0,
    enter: { x: -52, y: 8, scale: 0.84, rotate: 0, opacity: 0 },
    exit: { x: 38, y: 0, scale: 0.88, rotate: 0, opacity: 0 },
    spring: { type: "spring", stiffness: 300, damping: 24, mass: 0.8 },
  },
  stressed: {
    src: IMG.stressed,
    flipX: false,
    scale: 1.0,
    yOffset: 0,
    enter: { x: 0, y: 0, scale: 0.7, rotate: -7, opacity: 0 },
    exit: { x: 0, y: -10, scale: 0.76, rotate: 4, opacity: 0 },
    spring: { type: "spring", stiffness: 500, damping: 14, mass: 0.6 },
  },
  confused: {
    src: IMG.confused,
    flipX: false,
    scale: 0.94,
    yOffset: 0,
    enter: { x: 0, y: 0, scale: 0.78, rotate: 9, opacity: 0 },
    exit: { x: 0, y: 0, scale: 0.82, rotate: -4, opacity: 0 },
    spring: { type: "spring", stiffness: 420, damping: 18, mass: 0.7 },
  },
  sittingDown: {
    src: IMG.sittingHeadDown,
    flipX: false,
    scale: 1.1,
    yOffset: 20,
    enter: { x: 0, y: -24, scale: 0.84, rotate: 0, opacity: 0 },
    exit: { x: 0, y: 16, scale: 0.84, rotate: 0, opacity: 0 },
    spring: { type: "spring", stiffness: 180, damping: 28, mass: 1.2 },
  },
  sittingUp: {
    src: IMG.sitting,
    flipX: false,
    scale: 1.1,
    yOffset: 20,
    enter: { x: 0, y: 32, scale: 0.76, rotate: 0, opacity: 0 },
    exit: { x: 0, y: -18, scale: 0.82, rotate: 0, opacity: 0 },
    spring: { type: "spring", stiffness: 220, damping: 26, mass: 1.0 },
  },
};

const FX = { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 };

function PoseEffect({ pose }) {
  if (pose === "standing")
    return (
      <div style={FX}>
        <motion.div
          animate={{ opacity: [0.05, 0.16, 0.05], scale: [0.9, 1.06, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "54%",
            top: "30%",
            width: 46,
            height: 46,
            marginLeft: -23,
            marginTop: -23,
            borderRadius: "50%",
            background: `radial-gradient(circle,${TEAL}33,transparent 70%)`,
          }}
        />
        <motion.div
          animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          style={{
            position: "absolute",
            left: "66%",
            top: "14%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: TEAL,
            boxShadow: `0 0 8px ${TEAL}`,
          }}
        />
      </div>
    );
  if (pose === "confused")
    return (
      <div style={FX}>
        {[
          { k: 1, l: "74%", t: "8%", d: 0.0, s: 20 },
          { k: 2, l: "16%", t: "14%", d: 0.55, s: 16 },
          { k: 3, l: "52%", t: "2%", d: 0.95, s: 24 },
        ].map((p) => (
          <motion.span
            key={p.k}
            initial={{ opacity: 0, y: 10, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, -52],
              scale: [0, 1, 1, 0],
              rotate: [0, -12, 12, 0],
            }}
            transition={{ duration: 2.0, repeat: Infinity, delay: p.d, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: p.l,
              top: p.t,
              fontSize: p.s,
              fontWeight: 900,
              color: INDIGO,
              fontFamily: FD,
            }}
          >
            ?
          </motion.span>
        ))}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 80,
            height: 80,
            marginLeft: -40,
            marginTop: -40,
            border: "1.5px dashed rgba(74,64,112,0.18)",
            borderRadius: "50%",
          }}
        />
      </div>
    );
  if (pose === "thinking")
    return (
      <div style={FX}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0, 0.72, 0], scale: [0.4, 1, 0.4], y: [0, -4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
            style={{
              position: "absolute",
              left: `${62 + i * 8}%`,
              top: `${26 - i * 6}%`,
              width: 6 + i * 2,
              height: 6 + i * 2,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "50%",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.9, 0], y: [8, -4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "60%",
            top: "16%",
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 10,
            padding: "3px 9px",
            fontSize: 11,
            fontFamily: FB,
            fontWeight: 600,
            color: SLATE,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
          }}
        >
          Hmm...
        </motion.div>
      </div>
    );
  if (pose === "reading")
    return (
      <div style={FX}>
        {[
          { k: 1, l: "I-130", t: "22%", d: 0 },
          { k: 2, l: "DS-260", t: "36%", d: 0.7 },
          { k: 3, l: "NOA2", t: "50%", d: 1.3 },
          { k: 4, l: "I-864", t: "64%", d: 1.9 },
        ].map((p) => (
          <motion.div
            key={p.k}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: [0, 0.8, 0.8, 0], x: [12, 0, 0, -8] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: p.d, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "64%",
              top: p.t,
              fontSize: 10,
              fontFamily: FB,
              fontWeight: 700,
              color: TEAL,
              background: "rgba(46,113,117,0.09)",
              border: "1px solid rgba(46,113,117,0.22)",
              borderRadius: 8,
              padding: "2px 7px",
              whiteSpace: "nowrap",
            }}
          >
            {p.l}
          </motion.div>
        ))}
        <motion.div
          animate={{ y: ["80%", "10%"], opacity: [0, 0.3, 0] }}
          transition={{ duration: 2.0, repeat: Infinity, ease: "linear", repeatDelay: 0.4 }}
          style={{
            position: "absolute",
            left: "52%",
            right: "4%",
            height: 1,
            background: `linear-gradient(to right,transparent,${TEAL})`,
          }}
        />
      </div>
    );
  if (pose === "walking")
    return (
      <div style={FX}>
        <motion.div
          animate={{ scaleX: [0, 1], opacity: [0, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "6%",
            right: "14%",
            bottom: "9%",
            height: 1,
            background: `repeating-linear-gradient(to right,${SLATE} 0 6px,transparent 6px 14px)`,
            transformOrigin: "left",
          }}
        />
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.38, 0], scaleX: [0, 1, 0] }}
            transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.16 }}
            style={{
              position: "absolute",
              left: `${10 + i * 7}%`,
              bottom: "6%",
              width: 14 - i * 3,
              height: 2.5,
              background: SLATE,
              borderRadius: 2,
              transformOrigin: "right",
            }}
          />
        ))}
        <motion.div
          animate={{ opacity: [0, 0.6, 0], scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            right: "8%",
            bottom: "14%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: TEAL,
            boxShadow: `0 0 12px ${TEAL}`,
          }}
        />
      </div>
    );
  if (pose === "carryingBooks")
    return (
      <div style={FX}>
        {[
          { k: 1, l: "+ 3 tabs", t: "18%", d: 0 },
          { k: 2, l: "+ 5 more", t: "30%", d: 0.9 },
          { k: 3, l: "+ 7 more", t: "42%", d: 1.8 },
        ].map((p) => (
          <motion.div
            key={p.k}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 0.85, 0.85, 0], y: [6, 0, 0, -4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: p.d }}
            style={{
              position: "absolute",
              left: "58%",
              top: p.t,
              fontSize: 10,
              fontFamily: FB,
              fontWeight: 700,
              color: AMBER,
              background: "rgba(122,101,53,0.1)",
              border: "1px solid rgba(122,101,53,0.22)",
              borderRadius: 8,
              padding: "2px 7px",
              whiteSpace: "nowrap",
            }}
          >
            {p.l}
          </motion.div>
        ))}
        <motion.div
          animate={{ scaleY: [1, 0.87, 1], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "56%",
            bottom: "10%",
            width: 30,
            height: 6,
            background: "rgba(46,113,117,0.25)",
            borderRadius: 3,
            transformOrigin: "bottom",
          }}
        />
      </div>
    );
  if (pose === "stressed")
    return (
      <div style={FX}>
        {[
          { k: 1, l: "18%", t: "38%", d: 0 },
          { k: 2, l: "78%", t: "32%", d: 0.65 },
          { k: 3, l: "50%", t: "22%", d: 1.1 },
        ].map((p) => (
          <motion.div
            key={p.k}
            initial={{ opacity: 0, y: -8, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0], y: [-8, 18], scale: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: p.d, ease: "easeIn" }}
            style={{ position: "absolute", left: p.l, top: p.t, fontSize: 14 }}
          >
            💦
          </motion.div>
        ))}
        <motion.span
          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.15, 1.15, 0.5], y: [4, -24] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: 0.3 }}
          style={{
            position: "absolute",
            left: "46%",
            top: "12%",
            fontSize: 22,
            fontWeight: 900,
            color: CRIMSON,
            fontFamily: FD,
          }}
        >
          !
        </motion.span>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            right: "10%",
            top: "6%",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1.5px solid rgba(122,74,85,0.3)",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 1.5,
              height: 7,
              background: CRIMSON,
              transformOrigin: "bottom",
              marginLeft: -0.75,
              marginTop: -7,
            }}
          />
        </motion.div>
      </div>
    );
  if (pose === "sittingDown")
    return (
      <div style={FX}>
        {[
          { k: 1, l: "18%", t: "18%", lb: "Form 1", r: -18, d: 0 },
          { k: 2, l: "70%", t: "12%", lb: "Form 2", r: 12, d: 0.4 },
          { k: 3, l: "55%", t: "52%", lb: "I-130", r: -8, d: 0.7 },
          { k: 4, l: "12%", t: "58%", lb: "DS-260", r: 15, d: 1.0 },
        ].map((p) => (
          <motion.div
            key={p.k}
            initial={{ opacity: 0, y: -20, rotate: 0 }}
            animate={{ opacity: [0, 0.65, 0.65, 0], y: [-20, 0, 0, 8], rotate: [0, p.r] }}
            transition={{ duration: 2.0, repeat: Infinity, delay: p.d }}
            style={{
              position: "absolute",
              left: p.l,
              top: p.t,
              fontSize: 9,
              fontFamily: FB,
              fontWeight: 600,
              color: JB,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.09)",
              borderRadius: 5,
              padding: "2px 6px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {p.lb}
          </motion.div>
        ))}
        <motion.div
          animate={{ rotate: [0, 300] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
          style={{
            position: "absolute",
            right: "12%",
            top: "18%",
            width: 20,
            height: 20,
            border: "2px solid rgba(107,124,135,0.15)",
            borderTop: "2px solid rgba(107,124,135,0.6)",
            borderRadius: "50%",
          }}
        />
      </div>
    );
  if (pose === "sittingUp")
    return (
      <div style={FX}>
        <motion.div
          animate={{ opacity: [0, 0.22, 0.22, 0], scaleX: [0.6, 1, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "35%",
            top: 0,
            width: "30%",
            height: "55%",
            background: "linear-gradient(to bottom,rgba(46,113,117,0.28),transparent)",
            borderRadius: "0 0 50% 50%",
            transformOrigin: "top",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.1, 1, 0], y: [10, -10] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}
          style={{ position: "absolute", left: "58%", top: "8%", fontSize: 22 }}
        >
          🗺️
        </motion.div>
        {[
          { k: 1, l: "20%", t: "12%", d: 0.2 },
          { k: 2, l: "74%", t: "20%", d: 0.7 },
        ].map((p) => (
          <motion.span
            key={p.k}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.1, 0], y: [0, -16] }}
            transition={{ duration: 1.0, repeat: Infinity, delay: p.d }}
            style={{ position: "absolute", left: p.l, top: p.t, fontSize: 16 }}
          >
            ✨
          </motion.span>
        ))}
      </div>
    );
  return null;
}

function CharacterSprite({ pose, size = 200, style: extra = {}, isVisible = true }) {
  const cfg = POSES[pose] ?? POSES.standing;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, ...extra }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pose}
          initial={cfg.enter}
          animate={{ opacity: 1, x: 0, y: 0, scale: cfg.scale, rotate: 0 }}
          exit={cfg.exit}
          transition={cfg.spring}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            transformOrigin: "bottom center",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <img
            src={cfg.src}
            alt=""
            draggable={false}
            style={{
              width: size,
              height: size,
              objectFit: "contain",
              objectPosition: "bottom center",
              userSelect: "none",
              display: "block",
              transform: `translateY(${cfg.yOffset * (size / 200)}px) scaleX(${cfg.flipX ? -1 : 1}) translateZ(0)`,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              willChange: "transform",
            }}
          />
        </motion.div>
      </AnimatePresence>
      {/* Ambient decorative loops are simply not mounted while off-screen —
          for continuous, non-narrative loops this reads identically to a
          pause/resume without needing frame-accurate state tracking. */}
      {isVisible && <PoseEffect pose={pose} />}
    </div>
  );
}

const JARGON = [
  { id: 0, text: "I-130", x: "3%", y: "7%", sz: 13, rot: -5, col: JA, op: 1, w: "700" },
  { id: 1, text: "USCIS", x: "11%", y: "16%", sz: 26, rot: -12, col: JB, op: 0.8, w: "800" },
  { id: 2, text: "Petitioner", x: "5%", y: "28%", sz: 11, rot: 8, col: JC, op: 0.85, w: "500" },
  { id: 3, text: "RFE", x: "77%", y: "5%", sz: 24, rot: 11, col: JD, op: 0.95, w: "900" },
  { id: 4, text: "NOA1", x: "68%", y: "17%", sz: 14, rot: 6, col: JC, op: 0.85, w: "600" },
  { id: 5, text: "NOA", x: "6%", y: "87%", sz: 17, rot: 13, col: JA, op: 0.9, w: "700" },
  { id: 6, text: "Green Card", x: "20%", y: "86%", sz: 19, rot: -14, col: JB, op: 0.8, w: "700" },
  { id: 7, text: "DACA", x: "68%", y: "90%", sz: 21, rot: -11, col: JA, op: 0.95, w: "800" },
  { id: 8, text: "Embassy", x: "89%", y: "90%", sz: 14, rot: -7, col: JD, op: 0.85, w: "600" },
  { id: 9, text: "I-485", x: "87%", y: "13%", sz: 12, rot: -9, col: JA, op: 0.8, w: "600" },
  { id: 10, text: "NVC", x: "29%", y: "4%", sz: 30, rot: -5, col: JB, op: 0.65, w: "900" },
  { id: 11, text: "DS-260", x: "48%", y: "8%", sz: 15, rot: 9, col: JA, op: 0.85, w: "700" },
  { id: 12, text: "I-140", x: "38%", y: "14%", sz: 11, rot: -11, col: JD, op: 0.75, w: "600" },
  { id: 13, text: "I-864", x: "14%", y: "40%", sz: 17, rot: -6, col: JA, op: 0.95, w: "700" },
  { id: 14, text: "Biometrics", x: "3%", y: "52%", sz: 11, rot: 12, col: JC, op: 0.75, w: "500" },
  { id: 15, text: "PERM", x: "9%", y: "63%", sz: 21, rot: -13, col: JD, op: 0.9, w: "900" },
  { id: 16, text: "I-693", x: "82%", y: "26%", sz: 19, rot: -14, col: JB, op: 0.75, w: "700" },
  { id: 17, text: "AP / EAD", x: "78%", y: "42%", sz: 13, rot: 16, col: JD, op: 0.85, w: "600" },
  { id: 18, text: "485J", x: "92%", y: "47%", sz: 18, rot: -8, col: JA, op: 0.9, w: "800" },
  { id: 19, text: "I-797", x: "87%", y: "58%", sz: 12, rot: 11, col: JD, op: 0.8, w: "600" },
  { id: 20, text: "EB-2", x: "85%", y: "78%", sz: 17, rot: -17, col: JA, op: 0.85, w: "700" },
  { id: 21, text: "I-751", x: "4%", y: "80%", sz: 13, rot: 9, col: JD, op: 0.9, w: "600" },
  { id: 22, text: "EAD", x: "7%", y: "46%", sz: 22, rot: 10, col: JA, op: 0.95, w: "900" },
  { id: 23, text: "I-539", x: "2%", y: "36%", sz: 15, rot: -18, col: JD, op: 0.85, w: "600" },
  {
    id: 24,
    text: "Advance Parole",
    x: "4%",
    y: "74%",
    sz: 10,
    rot: 5,
    col: JC,
    op: 0.75,
    w: "500",
  },
  { id: 25, text: "NOA2", x: "93%", y: "64%", sz: 15, rot: -13, col: JB, op: 0.85, w: "700" },
  {
    id: 26,
    text: "Joint Sponsor",
    x: "91%",
    y: "36%",
    sz: 11,
    rot: -5,
    col: JC,
    op: 0.8,
    w: "500",
  },
  { id: 27, text: "Affidavit", x: "18%", y: "33%", sz: 12, rot: 9, col: JA, op: 0.6, w: "500" },
  { id: 28, text: "I-212", x: "14%", y: "82%", sz: 16, rot: -8, col: JA, op: 0.85, w: "700" },
  { id: 29, text: "F-1", x: "48%", y: "82%", sz: 19, rot: -18, col: JB, op: 0.75, w: "800" },
  { id: 30, text: "Tax Returns", x: "46%", y: "93%", sz: 10, rot: -10, col: JC, op: 0.7, w: "500" },
  { id: 31, text: "Interview", x: "72%", y: "55%", sz: 14, rot: 12, col: JB, op: 0.55, w: "600" },
  { id: 32, text: "Priority Date", x: "54%", y: "3%", sz: 10, rot: 7, col: JC, op: 0.8, w: "500" },
  { id: 33, text: "?", x: "18%", y: "22%", sz: 58, rot: -11, col: JB, op: 0.05, w: "700" },
  { id: 34, text: "?", x: "78%", y: "34%", sz: 44, rot: 17, col: JA, op: 0.07, w: "700" },
  {
    id: 35,
    text: "Medical Exam",
    x: "22%",
    y: "57%",
    sz: 13,
    rot: -10,
    col: JC,
    op: 0.55,
    w: "500",
  },
  { id: 36, text: "DS-5540", x: "16%", y: "72%", sz: 11, rot: 5, col: JD, op: 0.65, w: "600" },
  { id: 37, text: "I-94", x: "80%", y: "67%", sz: 17, rot: -9, col: JD, op: 0.65, w: "700" },
  { id: 38, text: "Vaccinations", x: "82%", y: "83%", sz: 11, rot: 9, col: JC, op: 0.75, w: "500" },
  { id: 39, text: "CR-1", x: "36%", y: "76%", sz: 12, rot: 10, col: JC, op: 0.65, w: "500" },
  { id: 40, text: "BIA", x: "61%", y: "64%", sz: 14, rot: -8, col: JD, op: 0.6, w: "600" },
  {
    id: 41,
    text: "Civil Documents",
    x: "42%",
    y: "19%",
    sz: 9,
    rot: -3,
    col: JC,
    op: 0.65,
    w: "500",
  },
  { id: 42, text: "AOS Fee", x: "57%", y: "19%", sz: 9, rot: -7, col: JC, op: 0.6, w: "500" },
  { id: 43, text: "Sponsor", x: "34%", y: "90%", sz: 12, rot: 7, col: JA, op: 0.8, w: "600" },
  { id: 44, text: "Appeal", x: "38%", y: "5%", sz: 13, rot: 14, col: JA, op: 0.75, w: "600" },
  { id: 45, text: "K-1 Visa", x: "64%", y: "11%", sz: 12, rot: 10, col: JD, op: 0.7, w: "600" },
  { id: 46, text: "?", x: "35%", y: "48%", sz: 80, rot: -6, col: JB, op: 0.04, w: "700" },
  { id: 47, text: "?", x: "68%", y: "28%", sz: 50, rot: 13, col: JD, op: 0.07, w: "700" },
  { id: 48, text: "?", x: "8%", y: "55%", sz: 64, rot: -19, col: JA, op: 0.06, w: "700" },
  { id: 49, text: "?", x: "90%", y: "72%", sz: 40, rot: 9, col: JB, op: 0.09, w: "700" },
  { id: 50, text: "CBP", x: "44%", y: "56%", sz: 13, rot: -11, col: JB, op: 0.5, w: "600" },
  { id: 51, text: "IR-1", x: "26%", y: "46%", sz: 10, rot: 13, col: JA, op: 0.55, w: "500" },
  { id: 52, text: "Case Review", x: "76%", y: "81%", sz: 12, rot: 7, col: JB, op: 0.7, w: "500" },
  {
    id: 53,
    text: "Marriage Cert",
    x: "10%",
    y: "23%",
    sz: 10,
    rot: 12,
    col: JC,
    op: 0.65,
    w: "500",
  },
  { id: 54, text: "Pay Stubs", x: "93%", y: "22%", sz: 10, rot: -12, col: JC, op: 0.65, w: "500" },
  { id: 55, text: "I-797C", x: "28%", y: "77%", sz: 11, rot: 9, col: JD, op: 0.7, w: "500" },
  {
    id: 56,
    text: "Employer Letter",
    x: "65%",
    y: "85%",
    sz: 9,
    rot: -4,
    col: JC,
    op: 0.6,
    w: "500",
  },
  { id: 57, text: "?", x: "58%", y: "80%", sz: 60, rot: 10, col: JB, op: 0.04, w: "700" },
  { id: 58, text: "?", x: "25%", y: "62%", sz: 46, rot: -13, col: JA, op: 0.06, w: "700" },
  { id: 59, text: "?", x: "74%", y: "48%", sz: 68, rot: -5, col: JB, op: 0.05, w: "700" },
  { id: 60, text: "Wait Times", x: "40%", y: "30%", sz: 11, rot: -8, col: JC, op: 0.62, w: "500" },
  { id: 61, text: "Processing", x: "55%", y: "45%", sz: 13, rot: 6, col: JE, op: 0.68, w: "600" },
  { id: 62, text: "Denied", x: "63%", y: "38%", sz: 16, rot: -15, col: JE, op: 0.72, w: "700" },
  { id: 63, text: "Approved", x: "32%", y: "58%", sz: 14, rot: 11, col: TEAL, op: 0.58, w: "600" },
  { id: 64, text: "Pending", x: "50%", y: "68%", sz: 12, rot: -7, col: JF, op: 0.64, w: "500" },
  { id: 65, text: "I-90", x: "42%", y: "38%", sz: 10, rot: 13, col: JA, op: 0.58, w: "500" },
  { id: 66, text: "Status Check", x: "59%", y: "25%", sz: 9, rot: -9, col: JC, op: 0.52, w: "500" },
  { id: 67, text: "Timeline", x: "25%", y: "50%", sz: 15, rot: 8, col: JD, op: 0.66, w: "600" },
  { id: 68, text: "Citizenship", x: "70%", y: "60%", sz: 11, rot: -12, col: JB, op: 0.6, w: "500" },
  {
    id: 69,
    text: "Naturalization",
    x: "15%",
    y: "58%",
    sz: 10,
    rot: 14,
    col: JC,
    op: 0.54,
    w: "500",
  },
  { id: 70, text: "I-20", x: "45%", y: "15%", sz: 12, rot: -6, col: JA, op: 0.58, w: "600" },
  {
    id: 100,
    text: "Spouse Visa Requirements",
    x: "30%",
    y: "35%",
    sz: 12,
    rot: 0,
    col: INDIGO,
    op: 0.92,
    w: "600",
    result: true,
  },
  {
    id: 101,
    text: "NVC Case Processing",
    x: "30%",
    y: "42%",
    sz: 12,
    rot: 0,
    col: INDIGO,
    op: 0.92,
    w: "600",
    result: true,
  },
  {
    id: 102,
    text: "DS-260 Form Guide",
    x: "30%",
    y: "49%",
    sz: 12,
    rot: 0,
    col: INDIGO,
    op: 0.92,
    w: "600",
    result: true,
  },
  {
    id: 103,
    text: "Interview Preparation",
    x: "30%",
    y: "56%",
    sz: 12,
    rot: 0,
    col: INDIGO,
    op: 0.92,
    w: "600",
    result: true,
  },
];
const WAVE_IDS = {
  1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  2: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  3: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 60, 61, 62, 63],
  4: [
    39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 64, 65, 66,
    67, 68, 69, 70,
  ],
  5: [100, 101, 102, 103],
};
const NARR_BEATS = [
  {
    eyebrow: "You just wanted a simple answer.",
    lines: [{ text: "WHERE TO START?" }],
    sub: "Family Visas  ·  IR-1  . IR-5",
  },
  {
    eyebrow: "But one thing leads to ten others.",
    lines: [{ text: "IT NEVER" }, { text: "STOPS." }],
  },
  {
    eyebrow: "The information is out there, sure.",
    lines: [{ text: "HOW DOES IT" }, { text: "APPLY TO YOU?" }],
  },
  {
    eyebrow: "You don't need a list of forms.",
    lines: [{ text: "YOU NEED" }, { text: "A CLEAR PATH." }],
    sub: "and that's exactly what we built.",
  },
];
const CIN_SLIDES = [
  {
    eyebrow: "Stop piecing it together yourself.",
    lines: [{ text: "SEE EXACTLY" }, { text: "WHAT'S NEXT." }],
    holdMs: 3800, // was 2800
  },
  {
    eyebrow: "Because immigration isn't a search.",
    lines: [{ text: "IT'S A" }, { text: "PROCESS." }],
    sub: "and every process needs a map.",
    holdMs: 5800, // was 4800
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A drop-in replacement for `sleep` that can be paused mid-wait and resumed
// later without losing progress. It polls a shared ref every ~120ms; while
// the ref is true it simply keeps re-checking (not consuming any of the
// remaining wait time), so the whole sequence freezes exactly where it was
// and continues from that same point once unpaused. No indicator is shown —
// the pause is purely a timing effect.
const pausableSleep = (pausedRef, ms) =>
  new Promise((resolve) => {
    let remaining = ms;
    let timer;
    const tick = () => {
      if (pausedRef.current) {
        timer = setTimeout(tick, 120);
        return;
      }
      const chunk = Math.min(remaining, 120);
      const start = Date.now();
      timer = setTimeout(() => {
        remaining -= Date.now() - start;
        if (remaining <= 0) resolve();
        else tick();
      }, chunk);
    };
    tick();
  });

const rand = (a, b) => a + Math.random() * (b - a);
const clampNum = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (v0, v1, vw, w0, w1) =>
  clampNum(v0 + (v1 - v0) * ((vw - w0) / (w1 - w0)), Math.min(v0, v1), Math.max(v0, v1));

/* ─── Shared skip control — identical look & behaviour everywhere it's used ───
   Text link (no pill), always-underlined + a corner vignette for contrast.
   Also nudges/brightens whenever the pointer is anywhere on screen (not just
   over the button itself), so it stays noticeable during a full-bleed
   animation where the person may never move toward the corner. */
function SkipIntroButton({
  onClick,
  compact = false,
  IconCmp,
  screenHovered = false,
  isVisible = true,
}) {
  const Chevron = IconCmp;
  return (
    <motion.div
      animate={{
        opacity: screenHovered ? 1 : 0.82,
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        zIndex: 45,
        width: compact ? 140 : 180,
        height: compact ? 90 : 110,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at 100% 100%, rgba(12,18,42,0.28) 0%, rgba(12,18,42,0) 70%)",
      }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        initial={{ opacity: 0, y: 6 }}
        animate={{
          opacity: 1,
          y: screenHovered ? -4 : 0,
          scale: screenHovered ? 1.06 : 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.38, ease: [0.34, 1.4, 0.64, 1] }}
        style={{
          position: "absolute",
          bottom: compact
            ? "max(16px, env(safe-area-inset-bottom))"
            : "max(22px, env(safe-area-inset-bottom))",
          right: compact ? 16 : 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          borderBottom: `1.5px solid rgba(255,255,255,0.85)`,
          background: "transparent",
          color: "#fff",
          fontFamily: FB,
          fontSize: compact ? 11 : 13,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "10px 1px 6px",
          minHeight: 40,
          cursor: "pointer",
          pointerEvents: "all",
          textShadow: screenHovered ? "0 1px 10px rgba(0,0,0,0.55)" : "0 1px 8px rgba(0,0,0,0.4)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        Skip
        <motion.span
          className="skip-intro-arrow"
          animate={{ x: !isVisible ? 0 : screenHovered ? [0, 5, 0] : [0, 2, 0] }}
          transition={{
            duration: screenHovered ? 0.9 : 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ display: "inline-flex" }}
        >
          <Chevron size={15} strokeWidth={2.75} />
        </motion.span>
      </motion.button>
    </motion.div>
  );
}

export default function HeroAnimation({ skipToEnd = false, onComplete } = {}) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmit] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [subTabs, setSubTabs] = useState({});
  const [activeTab, setActive] = useState(null);
  const [visibleJ, setVisibleJ] = useState(new Set());
  const [content, setContent] = useState({ kind: "search" });
  const [endPhase, setEndPhase] = useState(null);
  const [listWords, setListWords] = useState([]);
  const [convergingIdx, setConverging] = useState(-1);
  const [fade, setFade] = useState(0);
  const [typeText, setTypeText] = useState("");
  const HERO_TEXT = "Let's map out your visa process.";
  const [narrPhase, setNarrPhase] = useState(null);
  const [seqHl, setSeqHl] = useState(null);
  const [cVis, setCVis] = useState(new Set());
  const [charPose, setCharPose] = useState("standing");

  // Tracks whether the pointer has been active anywhere on the screen
  // recently. Used to make the skip button visibly "wake up" whenever the
  // user is engaged with the page — not just hovering the button itself.
  const [pointerActive, setPointerActive] = useState(false);
  useEffect(() => {
    let idleTimer;
    const markActive = () => {
      setPointerActive(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setPointerActive(false), 1400);
    };
    window.addEventListener("mousemove", markActive);
    window.addEventListener("touchstart", markActive, { passive: true });
    return () => {
      window.removeEventListener("mousemove", markActive);
      window.removeEventListener("touchstart", markActive);
      clearTimeout(idleTimer);
    };
  }, []);

  // Tracks whether the running async sequence should keep going. Kept as a
  // ref (not state) so the sequence can check it synchronously on every
  // tick without waiting for a re-render, and so an external "skip" call
  // can stop it immediately.
  const aliveRef = useRef(true);

  // ---- Pause / resume the whole sequence when it scrolls out of view ----
  // `pausedRef` is read synchronously by pausableSleep, so the sequence
  // freezes at exactly the point it's at (no rewind, no restart, no
  // indicator) and continues the instant the section is visible again.
  const sectionRef = useRef(null);
  const pausedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const vis = entry.isIntersecting;
        pausedRef.current = !vis;
        setIsVisible(vis);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Camera pans (mAnimate on motion values) run independently of React
  // state, so pausing the sequence's sleep loop alone wouldn't stop a pan
  // that's already in flight. We keep a handle to every camera animation
  // and pause/resume it in lockstep with visibility — the motion values
  // hold their exact current position while paused.
  const camControlsRef = useRef([]);
  useEffect(() => {
    camControlsRef.current.forEach((c) => {
      try {
        if (isVisible) c.play?.();
        else c.pause?.();
      } catch (e) {
        /* noop */
      }
    });
  }, [isVisible]);

  // Preload all pose images to prevent rendering/loading delays
  useEffect(() => {
    Object.values(IMG).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    // Also preload map image
    const mapImg = new Image();
    mapImg.src = "/assets/images/illustartions/map.png";
  }, []);

  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 800);
  useEffect(() => {
    const f = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  // ---- Fluid, continuous responsive scale (no hard breakpoint jumps) ----
  // jScale: 0..1 used to scale jargon/typography fonts smoothly between a
  // small phone (~340px) and a large desktop (~1440px).
  const jScale = lerp(0.62, 1, vw, 340, 1440);
  const isMobile = vw < 640,
    isTablet = vw >= 640 && vw < 1024; // layout-structure breakpoints only
  const isSmallPhone = vw < 380; // extra-small tier for clipping safety

  // Browser frame + character scale continuously with viewport width,
  // clamped so it never gets comically large or unreadably small.
  const browserW = clampNum(vw * 0.7, 260, 780);
  const browserAR = isMobile ? 1.05 : isTablet ? 0.52 : 0.5; // taller mockup on mobile
  const browserInnerH = clampNum(browserW * browserAR, isMobile ? 220 : 115, 375);
  const charSize = isMobile
    ? clampNum(browserW * 0.28, 70, 95)
    : clampNum(browserInnerH * 0.92, 100, 235);

  const camZoom = useMotionValue(0.8),
    camX = useMotionValue(0),
    camY = useMotionValue(0),
    camRot = useMotionValue(-2),
    shakeX = useMotionValue(0),
    shakeY = useMotionValue(0);
  const stageT = useTransform(
    [camZoom, camX, camY, camRot, shakeX, shakeY],
    ([z, x, y, r, sx, sy]) => `translate3d(${x + sx}px,${y + sy}px,0) scale(${z}) rotate(${r}deg)`
  );
  // Camera pan distances below were tuned against a desktop-width stage.
  // Scale them down proportionally on narrow viewports so the browser
  // frame never pans/zooms itself off-screen (which is what reads as
  // "cut off", since the section clips with overflow:hidden).
  const panScale = clampNum(vw / 1700, 0.28, 1);
  const zoomDampen = clampNum(0.55 + vw / 1800, 0.55, 1); // pulls zoom targets toward 1 on small screens

  useEffect(() => {
    if (narrPhase !== 3) {
      setSeqHl(null);
      return;
    }
    const ids = Array.from(visibleJ).filter((id) => JARGON[id]?.text !== "?");
    if (!ids.length) return;
    let i = 0;
    const iv = setInterval(() => {
      if (pausedRef.current) return; // freeze the highlight cycle while off-screen
      setSeqHl(ids[i % ids.length]);
      i++;
    }, 250); // slowed down seq highlight interval slightly
    return () => clearInterval(iv);
  }, [narrPhase, visibleJ]);

  // Tell the rest of the page whether the intro sequence is still running.
  // endPhase starts as `null` (animation actively playing) and only
  // becomes "hero" once the sequence finishes naturally or is skipped —
  // so this fires `playing: false` at exactly the moment the real hero
  // frame (headline + CTA) takes over.
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (endPhase !== "hero") {
      document.documentElement.dataset.heroAnimationPlaying = "true";
      (window as any).__heroAnimationPlaying = true;
      window.dispatchEvent(
        new CustomEvent("hero-animation-playing", { detail: { playing: true } })
      );
    }
  }, [endPhase]);

  useEffect(() => {
    if (
      endPhase === "hero" &&
      typeText === HERO_TEXT &&
      typeof window !== "undefined" &&
      typeof document !== "undefined"
    ) {
      document.documentElement.dataset.heroAnimationPlaying = "false";
      (window as any).__heroAnimationPlaying = false;
      window.dispatchEvent(
        new CustomEvent("hero-animation-playing", { detail: { playing: false } })
      );
    }
  }, [endPhase, typeText]);

  useEffect(() => {
    let isAlive = true;
    aliveRef.current = true;
    // Local `sleep` shadows the module-level one for this whole sequence
    // (including the `shake` and `narrate` helpers defined below, since
    // they close over this const) so every await in the sequence honours
    // the pause state.
    const sleep = (ms) => pausableSleep(pausedRef, ms);
    const cam = (to, dur = 1.4) => {
      // slightly slower camera duration default
      const ease = [0.22, 1, 0.36, 1];
      const record = (c) => c && camControlsRef.current.push(c);
      if (to.zoom != null)
        record(mAnimate(camZoom, 1 + (to.zoom - 1) * zoomDampen, { duration: dur, ease }));
      if (to.x != null) record(mAnimate(camX, to.x * panScale, { duration: dur, ease }));
      if (to.y != null) record(mAnimate(camY, to.y * panScale, { duration: dur, ease }));
      if (to.rotate != null) record(mAnimate(camRot, to.rotate, { duration: dur, ease }));
    };
    const shake = async () => {
      for (let i = 0; i < 16; i++) {
        if (!isAlive || !aliveRef.current) return;
        shakeX.set(rand(-12, 12) * panScale);
        shakeY.set(rand(-8, 8) * panScale);
        await sleep(40); // was 32
      }
      shakeX.set(0);
      shakeY.set(0);
    };
    const narrate = async (idx, holdMs, lvl) => {
      setNarrPhase(lvl);
      setContent({ kind: "narration", sceneIdx: idx });
      await sleep(holdMs);
      if (!isAlive || !aliveRef.current) return;
      setContent({ kind: "search" });
      setNarrPhase(null);
      await sleep(500); // was 300
    };
    const wave = (w) =>
      setVisibleJ((p) => {
        const n = new Set(p);
        (WAVE_IDS[w] || []).forEach((id) => n.add(id));
        return n;
      });
    (async () => {
      setTabs([]);
      setSubTabs({});
      setQuery("");
      setSubmit(false);
      setCharPose("standing");

      cam({ zoom: 0.58, x: 30, y: 40, rotate: -8 }, 0.01);
      await sleep(400); // was 200
      cam({ zoom: 0.75, x: -15, y: 10, rotate: 3 }, 2.2); // was 1.8
      await sleep(600); // was 400

      setSubmit(false);
      setCharPose("standing");
      const q1 = "how do I bring my family to the US";
      for (let i = 0; i < q1.length; i++) {
        if (!isAlive || !aliveRef.current) return;
        if (i === 3) setCharPose("thinking");
        setQuery(q1.slice(0, i + 1));
        await sleep(q1[i] === " " ? rand(120, 240) : rand(50, 110)); // was rand(75, 170) : rand(32, 85)
        if (Math.random() < 0.11 && q1[i] === " ") await sleep(rand(250, 500)); // was rand(180, 400)
      }
      await sleep(600); // was 360
      setSubmit(true);
      setCharPose("walking");
      cam({ zoom: 1.05, x: 10, y: -30, rotate: -1.5 }, 1.2); // was 0.9
      setTabs((p) => [...p, { id: "spouse", label: "Family Visa" }]);
      setActive("spouse");
      wave(1);
      await sleep(1200); // was 800

      setCharPose("reading");
      await sleep(1000); // was 600

      setCharPose("confused");
      await narrate(0, 3600, 1); // was 2400
      if (!isAlive || !aliveRef.current) return;

      setCharPose("standing");
      let len = 0;
      setQuery((q) => {
        len = q.length;
        return q;
      });
      await sleep(0);
      for (let i = 0; i < len; i++) {
        if (!isAlive || !aliveRef.current) return;
        setQuery((q) => q.slice(0, -1));
        await sleep(15); // was 10
      }
      setSubmit(false);
      await sleep(500); // was 360
      if (!isAlive || !aliveRef.current) return;

      setCharPose("thinking");
      const typo = "what is NCV";
      for (const ch of typo) {
        if (!isAlive || !aliveRef.current) return;
        setQuery((q) => q + ch);
        await sleep(rand(50, 90)); // was rand(36, 70)
      }
      await sleep(700); // was 560
      for (let i = 0; i < 3; i++) {
        if (!isAlive || !aliveRef.current) return;
        setQuery((q) => q.slice(0, -1));
        await sleep(120); // was 85
      }
      await sleep(300); // was 200
      for (const ch of "NVC") {
        if (!isAlive || !aliveRef.current) return;
        setQuery((q) => q + ch);
        await sleep(80); // was 55
      }
      await sleep(400); // was 300
      setSubmit(true);
      setTabs((p) => [...p, { id: "nvc", label: "NVC" }]);
      setActive("nvc");
      await sleep(900); // was 620

      setSubTabs({
        nvc: [
          { id: "ds260", label: "DS-260" },
          { id: "civdocs", label: "Civil Documents" },
          { id: "interview", label: "Interview" },
          { id: "fees", label: "Fees" },
          { id: "medical", label: "Medical Exam" },
          { id: "police", label: "Police Certificate" },
          { id: "affidavit", label: "Affidavit of Support" },
        ],
      });
      setActive("ds260");
      setCharPose("carryingBooks");
      cam({ zoom: 1.25, x: 120, y: -50, rotate: -4.5 }, 1.4); // was 1.0
      wave(2);
      await sleep(1000); // was 680

      setCharPose("stressed");
      await narrate(1, 3800, 2); // was 2600
      if (!isAlive || !aliveRef.current) return;

      setCharPose("walking");
      wave(3);
      cam({ zoom: 0.88, x: -40, y: 15, rotate: 2.8 }, 1.8); // was 1.4
      await sleep(700); // was 480

      setCharPose("carryingBooks");
      await narrate(2, 3600, 3); // was 2400
      if (!isAlive || !aliveRef.current) return;

      wave(4);
      await shake();
      if (!isAlive || !aliveRef.current) return;
      setCharPose("sittingDown");
      cam({ zoom: 0.72, x: 20, y: 35, rotate: -5.2 }, 1.8); // was 1.3
      await sleep(1000); // was 680

      setCharPose("reading");
      await narrate(3, 4200, 4); // was 3000
      if (!isAlive || !aliveRef.current) return;

      let len2 = 0;
      setQuery((q) => {
        len2 = q.length;
        return q;
      });
      await sleep(0);
      for (let i = 0; i < len2; i++) {
        if (!isAlive || !aliveRef.current) return;
        setQuery((q) => q.slice(0, -1));
        await sleep(15); // was 10
      }
      setSubmit(false);
      await sleep(500); // was 360
      if (!isAlive || !aliveRef.current) return;
      const q3 = "what am i missing???????";
      for (const ch of q3) {
        if (!isAlive || !aliveRef.current) return;
        setQuery((q) => q + ch);
        await sleep(rand(50, 90)); // was rand(36, 70)
      }
      await sleep(700); // was 460
      setSubmit(true);
      await sleep(1000); // was 720
      if (!isAlive || !aliveRef.current) return;

      setEndPhase("list");
      setCharPose("sittingDown");
      const words = [
        "Forms.",
        "Documents.",
        "Deadlines.",
        "Interviews.",
        "Requirements.",
        "Fees.",
        "Translations.",
        "Proofs.",
      ];
      for (let i = 0; i < words.length; i++) {
        if (!isAlive || !aliveRef.current) return;
        setListWords(words.slice(0, i + 1));
        await sleep(350); // was 220
      }
      await sleep(2200); // was 1800
      for (let i = 0; i < words.length; i++) {
        if (!isAlive || !aliveRef.current) return;
        setConverging(i);
        await sleep(75); // was 52
      }
      await sleep(700); // was 520
      setListWords([]);
      await sleep(150); // was 100
      if (!isAlive || !aliveRef.current) return;

      setEndPhase("cinematic");
      setCharPose("sittingUp");
      setCVis(new Set([0]));
      await sleep(CIN_SLIDES[0].holdMs);
      if (!isAlive || !aliveRef.current) return;
      setCVis(new Set([0, 1]));
      await sleep(CIN_SLIDES[1].holdMs);
      if (!isAlive || !aliveRef.current) return;
      setCVis(new Set());
      await sleep(600); // was 400
      if (!isAlive || !aliveRef.current) return;

      setEndPhase("fade");
      for (let i = 1; i <= 30; i++) {
        if (!isAlive || !aliveRef.current) return;
        setFade(i / 30);
        await sleep(22); // was 18
      }
      await sleep(150); // was 100
      if (!isAlive || !aliveRef.current) return;
      setFade(0);
      setEndPhase("hero");
      onComplete?.();

      const full = "Let's map out your visa process.";
      for (let i = 0; i <= full.length; i++) {
        if (!isAlive || !aliveRef.current) return;
        setTypeText(full.slice(0, i));
        await sleep(rand(45, 95)); // was rand(34, 76)
      }
    })();
    return () => {
      isAlive = false;
      aliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External skip: stop the sequence wherever it is and jump straight to
  // the finished hero frame, fully typed out.
  useEffect(() => {
    if (skipToEnd) {
      aliveRef.current = false;
      setEndPhase("hero");
      setFade(0);
      setTypeText("Let's map out your visa process.");
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipToEnd]);

  const showStage = endPhase === null;
  const isN = content.kind === "narration";
  const narrSceneIdx = isN ? content.sceneIdx : null;

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        zIndex: 50,
        height: "100dvh",
        minHeight: 380,
        width: "100%",
        overflow: "hidden",
        fontFamily: FB,
        background: "linear-gradient(135deg,#e2e8f0 0%,#cbd5e1 40%,#94a3b8 100%)",
      }}
    >
      {fade > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: HERO_BG,
            opacity: fade,
            zIndex: 60,
            pointerEvents: "none",
          }}
        />
      )}

      {endPhase !== "hero" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
          {JARGON.map((j) => {
            if (!visibleJ.has(j.id)) return null;
            const isPill = j.text !== "?",
              isResult = j.result;
            const isHl5 = narrPhase === 2 && FIVE_IDS.has(j.id);
            const isSeqH = narrPhase === 3 && seqHl === j.id;
            const isJitter = narrPhase === 4 && isPill;
            let dop = j.op;
            if (isN) dop = j.op * (isHl5 ? 0.7 : 0.15);
            else if (["list", "cinematic", "fade"].includes(endPhase)) dop = 0;
            const ssz = Math.max(j.sz * jScale, isResult ? 9 : isPill ? 8 : 18);
            const ax = isJitter
              ? [0, ((j.id * 7) % 13) - 6, -((j.id * 13) % 11) + 5, ((j.id * 13) % 11) - 5, 0]
              : 0;
            const ay = isJitter
              ? [0, ((j.id * 11) % 9) - 4, -((j.id * 5) % 13) + 6, ((j.id * 5) % 13) - 6, 0]
              : 0;
            if (isResult)
              return (
                <div
                  key={j.id}
                  style={{
                    position: "absolute",
                    left: j.x,
                    top: j.y,
                    transform: "translate(-50%,-50%)",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: dop, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: j.id * 0.08 }}
                    style={{
                      background: "rgba(255,255,255,0.98)",
                      border: "1px solid rgba(74,64,112,0.18)",
                      borderLeft: "3px solid rgba(74,64,112,0.45)",
                      borderRadius: 6,
                      padding: `${clampNum(5 * jScale, 4, 8)}px ${clampNum(12 * jScale, 8, 14)}px`,
                      fontSize: ssz,
                      fontWeight: j.w,
                      color: j.col,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      minWidth: clampNum(130 * jScale, 110, 200),
                      fontFamily: FB,
                    }}
                  >
                    {j.text}
                  </motion.div>
                </div>
              );
            return (
              <div
                key={j.id}
                style={{
                  position: "absolute",
                  left: j.x,
                  top: j.y,
                  transform: `translate(-50%,-50%) rotate(${j.rot}deg)`,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.4, rotate: rand(-20, 20) }}
                  animate={{
                    opacity: dop,
                    scale: isHl5 ? 1.22 : isSeqH ? 1.16 : 1,
                    x: ax,
                    y: ay,
                    rotate: 0,
                  }}
                  transition={{
                    opacity: { duration: 0.55 },
                    scale: { duration: isHl5 || isSeqH ? 0.18 : 0.6 },
                    x: isJitter
                      ? { duration: 0.52 + (j.id % 3) * 0.18, ease: "easeInOut", repeat: Infinity }
                      : { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                    y: isJitter
                      ? { duration: 0.6 + (j.id % 4) * 0.15, ease: "easeInOut", repeat: Infinity }
                      : { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: ssz,
                      fontWeight: j.w,
                      color: j.col,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      fontFamily: FB,
                      ...(isPill
                        ? {
                            background: isHl5
                              ? "rgba(46,113,117,0.15)"
                              : isSeqH
                                ? "rgba(46,113,117,0.08)"
                                : "rgba(255,255,255,0.96)",
                            border: isHl5
                              ? "1.5px solid rgba(46,113,117,0.40)"
                              : isSeqH
                                ? "1.5px solid rgba(46,113,117,0.25)"
                                : "1px solid rgba(0,0,0,0.08)",
                            borderRadius: 20,
                            padding: `${clampNum(3 * jScale, 2, 3)}px ${clampNum(9 * jScale, 5, 9)}px`,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          }
                        : {}),
                    }}
                  >
                    {j.text}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {showStage && (
        <motion.div
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1800,
            padding: isMobile ? "0 12px" : "0 24px",
          }}
        >
          <motion.div
            style={{
              transform: stageT,
              transformOrigin: "50% 50%",
              willChange: "transform",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: browserW,
                maxWidth: "100%",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: isSmallPhone ? 8 : isMobile ? 10 : 16,
                background:
                  "linear-gradient(145deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.5) 100%)",
                backdropFilter: "blur(40px) saturate(150%)",
                boxShadow:
                  "inset 0 1px 1px rgba(255,255,255,1),0 24px 64px rgba(0,0,0,0.08),0 0 0 1px rgba(255,255,255,0.4)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: clampNum(8 * jScale, 5, 8),
                  padding: `${clampNum(10 * jScale, 6, 10)}px ${clampNum(16 * jScale, 10, 16)}px`,
                  borderBottom: "1px solid #e8e8ec",
                  background: "linear-gradient(to bottom,#f4f4f7,#ededf1)",
                }}
              >
                <Dot c="#ff5f57" jScale={jScale} />
                <Dot c="#ffbd2e" jScale={jScale} />
                <Dot c="#28c840" jScale={jScale} />
                <div style={{ flex: 1, margin: "0 10px", minWidth: 0 }}>
                  <URLBar browserW={browserW} jScale={jScale} />
                </div>
                {!isSmallPhone && (
                  <>
                    <Dot c="#c5c5cc" jScale={jScale} />
                    <Dot c="#c5c5cc" jScale={jScale} />
                    <Dot c="#c5c5cc" jScale={jScale} />
                  </>
                )}
              </div>
              <TabBar tabs={tabs} subTabs={subTabs} activeTab={activeTab} jScale={jScale} />
              <div
                style={{
                  width: "100%",
                  height: browserInnerH,
                  background: "#fcfcfd",
                  boxShadow: "inset 0 4px 20px rgba(0,0,0,0.03)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: clampNum(-charSize * 0.08, -20, -6),
                    bottom: 0,
                    zIndex: 5,
                    pointerEvents: "none",
                    width: charSize,
                    height: charSize,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <CharacterSprite
                    pose={charPose}
                    size={charSize}
                    style={{ filter: "drop-shadow(0 8px 22px rgba(46,113,117,0.14))" }}
                    isVisible={isVisible}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: isMobile ? "0 12px" : "0 32px",
                    pointerEvents: "none",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isN && narrSceneIdx != null ? (
                      <InnerNarration
                        key={`n${narrSceneIdx}`}
                        beatIdx={narrSceneIdx}
                        jScale={jScale}
                        isMobile={isMobile}
                      />
                    ) : (
                      <motion.div
                        key="search"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          width: "100%",
                          maxWidth: isMobile
                            ? clampNum(browserW * 0.6, 150, 440)
                            : clampNum(browserW * 0.58, 230, 440),
                          pointerEvents: "auto",
                          zIndex: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: `${clampNum(13 * jScale, 9, 15)}px ${clampNum(20 * jScale, 14, 22)}px`,
                            borderRadius: 999,
                            background: "#fff",
                            boxShadow: "inset 0 0 0 1.5px #d1d5db,0 2px 12px rgba(0,0,0,0.05)",
                          }}
                        >
                          <SearchIcon />
                          <div
                            style={{
                              flex: 1,
                              fontSize: clampNum(13 * jScale, 11, 14),
                              color: "#1a202c",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              minHeight: "1.4em",
                              lineHeight: 1.4,
                              fontFamily: FB,
                            }}
                          >
                            {query.length === 0 && !submitted ? (
                              <span style={{ color: "#9ca3af" }}>
                                Ask anything about immigration...
                              </span>
                            ) : (
                              query
                            )}
                            {!submitted && <Blink paused={!isVisible} />}
                          </div>
                          {submitted && (
                            <span
                              style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.1em" }}
                            >
                              ↵
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {endPhase === "list" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {listWords.map((w, i) => {
            /* Settled positions — deliberately crowded, nothing centred or tidy */
            const SX = [-0.24, 0.16, -0.06, 0.28, -0.32, 0.08, -0.18, 0.22];
            const SY = [-0.2, 0.14, -0.32, -0.04, 0.22, -0.26, 0.1, 0.28];
            const ROT = [-9, 5, -14, 7, -5, 11, -7, 4];
            const sx = vw * SX[i],
              sy = vh * SY[i],
              rot = ROT[i];

            /* Words fly in from outside, each from a distinct angle            */
            const θ = (i / 8) * Math.PI * 2;
            const d = Math.max(vw, vh) * 0.7;
            const ex = Math.cos(θ) * d,
              ey = Math.sin(θ) * d;
            const initRot = [-16, 10, -20, 9, -12, 17, -9, 13][i];

            /* Size: wildly uneven — the process feels unscalable               */
            const BASE = [82, 54, 38, 72, 34, 96, 42, 64][i];
            const sz = clampNum(BASE * jScale, BASE * 0.42, BASE);
            const fw = ["900", "700", "500", "800", "500", "900", "600", "800"][i];

            /* Colour: not a single palette — stress-testing the eye             */
            const col = ["#0f172a", TEAL, CRIMSON, "#334155", "#64748b", AMBER, "#475569", TEAL][i];

            const conv = convergingIdx >= i;
            const cd = [0, 0.04, 0.02, 0.06, 0.01, 0.05, 0.03, 0.07][i] ?? 0;
            return (
              <motion.div
                key={w}
                initial={{ opacity: 0, x: ex, y: ey, rotate: initRot, scale: 0.55 }}
                animate={
                  conv
                    ? { opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.04, filter: "blur(28px)" }
                    : { opacity: 1, x: sx, y: sy, rotate: rot, scale: 1, filter: "blur(0px)" }
                }
                transition={
                  conv
                    ? { duration: 0.44, ease: [0.72, 0, 1, 0.28], delay: cd }
                    : { duration: 0.58, ease: [0.16, 1, 0.3, 1], delay: i * 0.11 }
                }
                style={{
                  position: "absolute",
                  fontSize: sz,
                  fontWeight: fw,
                  fontFamily: FD,
                  color: col,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  WebkitFontSmoothing: "antialiased",
                  textShadow: "0 4px 24px rgba(0,0,0,0.10)",
                }}
              >
                {w}
              </motion.div>
            );
          })}
        </div>
      )}

      {endPhase === "cinematic" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 25,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse at 50% 50%,rgba(255,255,255,0.6) 0%,rgba(226,232,240,0.2) 100%)",
            }}
          />
          <div style={{ position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none" }}>
            <AnimatePresence mode="wait">
              {cVis.size > 0 &&
                (() => {
                  const idx = Math.max(...Array.from(cVis));
                  const slide = CIN_SLIDES[idx];
                  return slide ? <EditorialSlide key={idx} slide={slide} /> : null;
                })()}
            </AnimatePresence>
          </div>
        </>
      )}

      {endPhase === "hero" && (
        <HeroFrame
          typeText={typeText}
          isMobile={isMobile}
          isTablet={isTablet}
          vw={vw}
          isVisible={isVisible}
          onSkip={() => {
            aliveRef.current = false;
            setTypeText("Let's map out your visa process.");
          }}
        />
      )}

      {typeText !== "Let's map out your visa process." && (
        <SkipIntroButton
          compact={isMobile}
          IconCmp={Icons.ChevronsRight}
          screenHovered={pointerActive}
          isVisible={isVisible}
          onClick={() => {
            aliveRef.current = false;
            setEndPhase("hero");
            setFade(0);
            setTypeText("Let's map out your visa process.");
            onComplete?.();
          }}
        />
      )}

      <style>{`
        @keyframes _blink{50%{opacity:0}}

        .skip-intro-arrow {
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        button:hover .skip-intro-arrow {
          transform: translateX(3px);
        }
      `}</style>
    </section>
  );
}

function Dot({ c, jScale }) {
  const s = clampNum(10 * jScale, 7, 10);
  return <div style={{ width: s, height: s, borderRadius: "50%", background: c, flexShrink: 0 }} />;
}
function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function Blink({ paused = false }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 1.5,
        height: "1.2em",
        background: "#2e7175",
        marginLeft: 2,
        animation: "_blink 1.0s step-start infinite",
        animationPlayState: paused ? "paused" : "running",
        verticalAlign: "text-top",
      }}
    />
  );
}

function TabBar({ tabs, subTabs, activeTab, jScale }) {
  const activeSubs = activeTab && subTabs[activeTab] ? subTabs[activeTab] : [];
  if (!tabs.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #e8e8ec" }}>
      <style>{`
        .subtabs-scroll::-webkit-scrollbar {
          display: none !important;
        }
        .subtabs-scroll {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
        }
      `}</style>
      <div
        style={{
          display: "flex",
          gap: clampNum(2 * jScale, 1, 2),
          padding: `${clampNum(6 * jScale, 4, 6)}px ${clampNum(8 * jScale, 5, 8)}px 0`,
          background: "#f9f9fb",
        }}
      >
        {tabs.map((t) => (
          <div
            key={t.id}
            style={{
              padding: `${clampNum(5 * jScale, 3, 5)}px ${clampNum(12 * jScale, 7, 12)}px`,
              background: activeTab === t.id ? "#fff" : "transparent",
              borderRadius: clampNum(6 * jScale, 4, 6),
              fontSize: clampNum(11 * jScale, 9, 11),
              fontWeight: 500,
              color: activeTab === t.id ? "#1a202c" : "#6b7280",
              borderTop: activeTab === t.id ? "1px solid #e8e8ec" : "1px solid transparent",
              borderLeft: activeTab === t.id ? "1px solid #e8e8ec" : "1px solid transparent",
              borderRight: activeTab === t.id ? "1px solid #e8e8ec" : "1px solid transparent",
              borderBottom: "none",
              boxShadow: activeTab === t.id ? "0 -1px 4px rgba(0,0,0,0.03)" : "none",
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
      {activeSubs.length > 0 && (
        <div
          className="subtabs-scroll"
          style={{
            display: "flex",
            gap: clampNum(6 * jScale, 4, 6),
            padding: `${clampNum(6 * jScale, 4, 6)}px ${clampNum(10 * jScale, 6, 10)}px`,
            background: "#fff",
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {activeSubs.map((s) => (
            <div
              key={s.id}
              style={{
                fontSize: clampNum(9 * jScale, 7, 9),
                color: "#6b7280",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function URLBar({ browserW, jScale }) {
  const w = clampNum(browserW * 0.45, 160, 360);
  return (
    <div
      style={{
        width: w,
        height: clampNum(22 * jScale, 16, 24),
        borderRadius: clampNum(5 * jScale, 3, 5),
        background: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        padding: `0 ${clampNum(8 * jScale, 5, 8)}px`,
        fontSize: clampNum(10 * jScale, 8, 10),
        color: "#6b7280",
        overflow: "hidden",
      }}
    >
      <span style={{ opacity: 0.5, marginRight: 4 }}>🔒</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        immigration-help.gov
      </span>
    </div>
  );
}
function InnerNarration({ beatIdx, jScale, isMobile }) {
  const b = NARR_BEATS[beatIdx];
  if (!b) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ textAlign: "center", maxWidth: isMobile ? "70%" : "90%" }}
    >
      <div
        style={{
          fontSize: clampNum(14 * jScale, 12, 16),
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(46,113,117,0.7)",
          fontWeight: 600,
          marginBottom: clampNum(8 * jScale, 5, 8),
          fontFamily: FB,
        }}
      >
        {b.eyebrow}
      </div>
      {b.lines.map((ln, i) => (
        <div
          key={i}
          style={{
            fontSize: clampNum(36 * jScale, 28, 48),
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#1e293b",
            fontFamily: FD,
          }}
        >
          {ln.text}
        </div>
      ))}
      {b.sub && (
        <div
          style={{
            fontSize: clampNum(11 * jScale, 9, 11),
            color: "#6b7280",
            marginTop: clampNum(10 * jScale, 6, 10),
            fontFamily: FB,
          }}
        >
          {b.sub}
        </div>
      )}
    </motion.div>
  );
}
function EditorialSlide({ slide }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: -20 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8vw",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "clamp(12px,1.6vw,16px)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(46,113,117,0.65)",
          fontWeight: 600,
          marginBottom: "clamp(14px,2vw,24px)",
          fontFamily: FB,
        }}
      >
        {slide.eyebrow}
      </div>
      {slide.lines.map((ln, i) => (
        <div
          key={i}
          style={{
            fontSize: "clamp(42px,10vw,110px)",
            fontWeight: 900,
            lineHeight: 0.96,
            letterSpacing: "-0.04em",
            color: "#1e293b",
            fontFamily: FD,
          }}
        >
          {ln.text}
        </div>
      ))}
      {slide.sub && (
        <div
          style={{
            fontSize: "clamp(10px,1.8vw,20px)",
            color: "#6b7280",
            marginTop: "clamp(16px,2.4vw,32px)",
            fontFamily: FB,
          }}
        >
          {slide.sub}
        </div>
      )}
    </motion.div>
  );
}
function HeroFrame({ typeText, isMobile, isTablet, vw, onSkip, isVisible = true }) {
  const [hasJourney, setHasJourney] = useState(false);
  const line1Full = "Let's";
  const line2Full = "map out your";
  const line3Full = "visa process.";
  const line2Start = line1Full.length + 1;
  const line3Start = line2Start + line2Full.length + 1;
  const isLine2Started = typeText.length >= line2Start;
  const isLine3Started = typeText.length >= line3Start;
  const line1Text = typeText.slice(0, line1Full.length);
  const line2Text = typeText.slice(line2Start, line2Start + line2Full.length);
  const line3Text = typeText.slice(line3Start, line3Start + line3Full.length);
  const isDone = typeText === "Let's map out your visa process.";

  useEffect(() => {
    const controller = new AbortController();

    async function fetchExistingJourney() {
      try {
        const response = await fetch("/api/journeys?limit=1", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          setHasJourney(false);
          return;
        }

        const result = await response.json();
        setHasJourney(Array.isArray(result?.data) && result.data.length > 0);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setHasJourney(false);
        }
      }
    }

    fetchExistingJourney();

    return () => controller.abort();
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "24px 6vw" : "32px 8vw",
        background: HERO_BG,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          width: "min(760px, 100%)",
          padding: isMobile ? "10px 0" : "14px 0",
          textAlign: "center",
          marginTop: isMobile ? 16 : 28,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 0,
            position: "relative",
            zIndex: 2,
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: isMobile
                ? "clamp(34px, 8.6vw, 46px)"
                : isTablet
                  ? "clamp(46px, 6.2vw, 62px)"
                  : "78px",
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              color: "#161f2d",
              margin: 0,
              fontFamily: FD,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: isMobile ? "0.9em" : isTablet ? "0.92em" : "0.85em",
              }}
            >
              {line1Text}
              {!isLine2Started && !isDone && <Blink paused={!isVisible} />}
            </span>
            <span
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "nowrap",
                marginTop: "3px",
                fontSize: isMobile ? "1.05em" : isTablet ? "1.06em" : "1em",
              }}
            >
              {line2Text}
              {isLine2Started && !isLine3Started && !isDone && <Blink paused={!isVisible} />}
            </span>
            <span
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "nowrap",
                marginTop: "3px",
                fontSize: isMobile ? "0.9em" : isTablet ? "0.92em" : "0.85em",
              }}
            >
              {line3Text}
              {isLine3Started && !isDone && <Blink paused={!isVisible} />}
            </span>
          </motion.h1>

          <div
            style={{
              marginTop: isMobile ? 20 : 20,
              maxWidth: 420,
              fontSize: isMobile ? 12 : 18,
              lineHeight: 1.5,
              color: JB,
              fontFamily: FB,
              textAlign: "left",
              position: "relative",
              left: isMobile ? "0px" : "-20px",
            }}
          >
            Every step, every requirement,
            <br />
            <span style={{ display: "inline-block", width: isMobile ? "0px" : "100px" }} />
            connected in one clear timeline.
          </div>

          <motion.button
            type="button"
            onClick={() => {
              window.location.href = hasJourney ? "/my-journeys" : "/visa-category";
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
              y: -3,
              scale: 1.04,
              backgroundColor: "#000000",
              boxShadow: "0 8px 20px rgba(11,19,31,0.22)",
            }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: isMobile ? 16 : 20,
              padding: "12px 28px",
              background: TEAL,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              fontFamily: FB,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(11, 19, 31, 0.15)",
            }}
          >
            {hasJourney ? "Resume your journey" : "Start your journey"}
          </motion.button>
        </div>

        {/* Map illustration — positioned relative to the centered text container */}
        <motion.img
          src="/assets/images/illustartions/map.png"
          alt="Map illustration"
          initial={{ opacity: 0 }}
          animate={{ opacity: typeText === "Let's map out your visa process." ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "absolute",
            pointerEvents: "none",
            zIndex: 1,
            ...(isMobile
              ? {
                  marginTop: 36,
                  marginBottom: 36,
                  top: "13%",
                  left: "33%",
                  width: "75%",
                }
              : {
                  // Values selected to look identical to 80% screen zoom layout proportions
                  top: "38%",
                  left: "30%",
                  width: "73%",
                  maxWidth: "none",
                }),
          }}
        />
      </motion.div>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <Icons.ChevronDown size={28} style={{ color: "#0b131f", opacity: 0.6 }} />
      </div>
    </div>
  );
}
