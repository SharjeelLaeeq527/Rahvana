"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, User, ShieldCheck, Camera, Pencil, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCandidate } from "@/app/context/CandidateContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import type { CandidateProfile } from "@/types/candidate";
import { JourneyPlanBadge } from "@/app/components/shared/JourneyPlanBadge";
import { uploadJourneyImage } from "@/lib/journey/imageUploadHelper";
import { getCandidateJourneyKey } from "@/lib/candidate/candidateSyncService";
import type { JourneyProgressRecord } from "@/lib/journey/journeyProgressService";

interface CandidateProfileLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyCode?: string;
  journeyName?: string;
  journeyRoute: string;
  candidates?: CandidateProfile[];
  journeys?: JourneyProgressRecord[];
}

const RAHVANA_AVATAR_THEMES = [
  {
    bg: "from-[#0a5a5d] via-[#0d7377] to-[#14a0a6]",
    ring: "group-hover:ring-[#0d7377]/30 dark:group-hover:ring-teal-400/40",
    shadow: "group-hover:shadow-[0_14px_34px_rgba(13,115,119,0.28)]",
  },
  {
    bg: "from-[#0d7377] via-[#128286] to-[#32e0c4]",
    ring: "group-hover:ring-[#32e0c4]/40 dark:group-hover:ring-teal-300/40",
    shadow: "group-hover:shadow-[0_14px_34px_rgba(50,224,196,0.25)]",
  },
  {
    bg: "from-[#114b4f] via-[#1a686d] to-[#55aaa8]",
    ring: "group-hover:ring-teal-500/30 dark:group-hover:ring-teal-400/40",
    shadow: "group-hover:shadow-[0_14px_34px_rgba(13,115,119,0.22)]",
  },
  {
    bg: "from-[#063e41] via-[#0b5b5f] to-[#15aab0]",
    ring: "group-hover:ring-[#0d7377]/30 dark:group-hover:ring-teal-400/40",
    shadow: "group-hover:shadow-[0_14px_34px_rgba(13,115,119,0.28)]",
  },
];

export function CandidateProfileLauncherModal({
  isOpen,
  onClose,
  journeyCode = "IR-5",
  journeyName = "IR-5 Parents Visa",
  journeyRoute,
  candidates: propCandidates,
  journeys,
}: CandidateProfileLauncherModalProps) {
  const router = useRouter();
  const candidateCtx = useCandidate();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Candidate name editing state
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [candidateNameInput, setCandidateNameInput] = useState("");

  // Candidate photo upload state
  const [uploadingCandidateId, setUploadingCandidateId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Filter or prioritize candidates for this specific category (e.g. IR-5)
  const allCandidates = propCandidates ?? candidateCtx.candidates ?? [];
  const relevantCandidates = allCandidates.filter((c) => {
    if (!journeyCode) return true;
    const cat = c.visaCategory?.toUpperCase() || "";
    const target = journeyCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanCat = cat.replace(/[^A-Z0-9]/g, "");
    return cleanCat.includes(target) || target.includes(cleanCat) || cat === "";
  });

  const displayCandidates = relevantCandidates.length > 0 ? relevantCandidates : allCandidates;

  const getCandidateProgress = (candidateId: string) => {
    if (!journeys || journeys.length === 0) {
      return { percent: 0, completed: 0, total: 28 };
    }
    const targetKey = getCandidateJourneyKey(journeyCode || "IR-5", candidateId)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const match = journeys.find(
      (j) => (j.journey_id || "").toLowerCase().replace(/[^a-z0-9]/g, "") === targetKey
    );

    if (!match) {
      return { percent: 0, completed: 0, total: 28 };
    }

    const completed = match.completed_steps_count ?? match.completed_steps?.length ?? 0;
    const total =
      match.total_steps_count && match.total_steps_count > 0
        ? match.total_steps_count
        : Math.max(completed * 2, 28);
    const percent = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));

    return { percent, completed, total };
  };

  const handleSelectCandidate = (candidate: CandidateProfile) => {
    // If currently editing name, don't trigger selection
    if (editingCandidateId === candidate.id) return;

    candidateCtx.setActiveCandidateId(candidate.id);
    onClose();
    router.push(journeyRoute);
  };

  const handleAddCandidate = () => {
    onClose();
    router.push(`/pricing?visa=${encodeURIComponent(journeyCode)}&action=add_candidate`);
  };

  const startEditCandidateName = (e: React.MouseEvent, candidate: CandidateProfile) => {
    e.stopPropagation();
    setEditingCandidateId(candidate.id);
    setCandidateNameInput(candidate.customName || candidate.fullName || candidate.label || "");
  };

  const saveCandidateName = (candidateId: string) => {
    const trimmed = candidateNameInput.trim();
    if (!trimmed) {
      setEditingCandidateId(null);
      return;
    }

    candidateCtx.updateCandidate(candidateId, {
      fullName: trimmed,
      customName: trimmed,
      label: trimmed,
    });
    setEditingCandidateId(null);
    showToast("Candidate name updated!", "success");
  };

  const cancelEditCandidateName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCandidateId(null);
    setCandidateNameInput("");
  };

  const handleTriggerPhotoUpload = (e: React.MouseEvent, candidateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const input = fileInputRefs.current[candidateId];
    if (input) {
      input.click();
    }
  };

  const handleCandidatePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    candidateId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCandidateId(candidateId);
    try {
      const { url } = await uploadJourneyImage(file, "candidate", candidateId);
      if (url) {
        candidateCtx.updateCandidate(candidateId, { avatarUrl: url });
        showToast("Candidate photo updated!", "success");
      }
    } catch (err) {
      console.error("[CandidateProfileLauncherModal] Photo upload error:", err);
      showToast("Could not upload candidate photo.", "error");
    } finally {
      setUploadingCandidateId(null);
      e.target.value = "";
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop matching Rahvana modals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl sm:p-10 lg:p-12 dark:border-slate-800 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 rounded-full p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center">
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold text-[#0d7377] dark:border-teal-500/30 dark:bg-teal-950/40 dark:text-teal-300">
              <span>{journeyName}</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-slate-100">
              Who&apos;s continuing this journey?
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400">
              Select a candidate profile to load their personal document vault, step-by-step
              roadmap, and isolated progress.
            </p>
          </div>

          {/* Profile Tiles Grid */}
          <div className="mt-9 flex flex-wrap items-start justify-center gap-6 sm:gap-8 lg:gap-10">
            {displayCandidates.map((candidate, idx) => {
              const theme = RAHVANA_AVATAR_THEMES[idx % RAHVANA_AVATAR_THEMES.length];
              const displayName =
                candidate.customName || candidate.fullName || candidate.label || "Candidate";
              const initials = displayName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0].toUpperCase())
                .join("");

              const isEditingThis = editingCandidateId === candidate.id;
              const isUploadingThis = uploadingCandidateId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement | SVGElement | null;
                    if (
                      target?.closest?.("button") ||
                      target?.closest?.("input") ||
                      editingCandidateId === candidate.id ||
                      uploadingCandidateId === candidate.id
                    ) {
                      return;
                    }
                    handleSelectCandidate(candidate);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (!isEditingThis) {
                        e.preventDefault();
                        handleSelectCandidate(candidate);
                      }
                    }
                  }}
                  className="group flex flex-col items-center focus:outline-none"
                >
                  {/* Hidden File Input for Avatar Upload */}
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[candidate.id] = el;
                    }}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleCandidatePhotoChange(e, candidate.id)}
                  />

                  {/* Avatar Tile */}
                  <div
                    className={`relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br sm:h-28 sm:w-28 sm:rounded-3xl ${theme.bg} shadow-md transition-all duration-200 group-hover:scale-105 group-hover:ring-4 ${theme.ring} ${theme.shadow}`}
                  >
                    {candidate.avatarUrl ? (
                      <Image
                        src={candidate.avatarUrl}
                        alt={displayName}
                        fill
                        unoptimized={candidate.avatarUrl.startsWith("data:")}
                        sizes="112px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-2xl font-black tracking-wider text-white sm:text-3xl">
                        {initials || <User className="h-10 w-10 text-white/90" />}
                      </span>
                    )}

                    {/* Upload spinner */}
                    {isUploadingThis && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}

                    {/* Camera Upload Badge Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTriggerPhotoUpload(e, candidate.id);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      title="Upload or change photo"
                      className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-slate-950/70 text-white shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-teal-300 hover:bg-[#0d7377] dark:border-slate-700"
                    >
                      <Camera className="h-3.5 w-3.5 text-teal-300" />
                    </button>
                  </div>

                  {/* Name & Relation Label */}
                  <div className="mt-3 flex flex-col items-center text-center">
                    {isEditingThis ? (
                      <div
                        className="mt-0.5 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={candidateNameInput}
                          onChange={(e) => setCandidateNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveCandidateName(candidate.id);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingCandidateId(null);
                            }
                          }}
                          placeholder="Candidate Name"
                          className="w-28 rounded-lg border border-teal-500/50 bg-white px-2 py-1 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-[#0d7377]/40 focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saveCandidateName(candidate.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0d7377] text-white hover:bg-[#0a5a5d]"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelEditCandidateName(e);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span
                          title={displayName}
                          className="max-w-[130px] truncate text-xs font-bold text-slate-800 transition-colors group-hover:text-[#0d7377] sm:text-sm dark:text-slate-200 dark:group-hover:text-teal-400"
                        >
                          {displayName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEditCandidateName(e, candidate);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          title="Change name"
                          className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 opacity-60 transition-all hover:bg-slate-100 hover:text-[#0d7377] hover:opacity-100 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {candidate.relation && (
                      <span className="mt-0.5 text-[11px] font-medium text-[#0d7377] dark:text-teal-400">
                        {candidate.relation}
                      </span>
                    )}

                    <div className="mt-1.5">
                      <JourneyPlanBadge tier={candidate.tier || "free"} />
                    </div>

                    {/* Candidate Roadmap Progress */}
                    {(() => {
                      const candProgress = getCandidateProgress(candidate.id);
                      return (
                        <div className="mt-3 w-28 sm:w-32 text-center">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>Progress</span>
                            <span className="font-bold text-[#0d7377] dark:text-teal-400">
                              {candProgress.percent}%
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-[#0d7377] to-[#32e0c4] transition-all duration-500"
                              style={{ width: `${candProgress.percent}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                            {candProgress.completed} of {candProgress.total} steps
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}

            {/* Add Profile Card */}
            <div
              onClick={handleAddCandidate}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAddCandidate();
                }
              }}
              className="group flex flex-col items-center focus:outline-none"
            >
              {/* Plus Tile */}
              <div className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[#0d7377]/30 bg-[#f0f9fa]/80 shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_12px_28px_rgba(13,115,119,0.18)] hover:border-[#0d7377] hover:bg-[#e4f4f5] sm:h-28 sm:w-28 sm:rounded-3xl dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-teal-400 dark:hover:bg-slate-800/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0d7377]/40 text-[#0d7377] transition-all duration-200 group-hover:border-[#0d7377] group-hover:bg-[#0d7377] group-hover:text-white dark:border-teal-500/40 dark:text-teal-300 dark:group-hover:bg-teal-600">
                  <Plus className="h-5 w-5" />
                </div>
              </div>

              {/* Label */}
              <div className="mt-3 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-700 transition-colors group-hover:text-[#0d7377] sm:text-sm dark:text-slate-300 dark:group-hover:text-teal-400">
                  Add Profile
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Add another Parent
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-10 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#0d7377] dark:text-teal-400" />
              <span>
                Each candidate profile operates in a fully isolated journey with independent
                document vaults.
              </span>
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
