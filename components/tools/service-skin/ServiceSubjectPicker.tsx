"use client";

/**
 * "Booking for" picker shown in the service pane on STANDALONE pages (Medical, Police).
 * Lists the account's beneficiaries plus "Someone else", so a standalone booking can be
 * made for anyone, with or without a journey. Inside a journey the person is fixed by
 * the journey, so the tools show a read-only line there instead.
 */

import type { CandidateProfile } from "@/types/candidate";
import { SOMEONE_ELSE_CANDIDATE_ID } from "@/lib/services/serviceSubject";

/** Candidate tag stored on a standalone booking made for someone who is not a beneficiary. */
export const SOMEONE_ELSE_ID = SOMEONE_ELSE_CANDIDATE_ID;

/** "Amina Khan - Mother"; falls back to the beneficiary label when there is no name yet. */
export function candidateOptionLabel(c: CandidateProfile): string {
  const name = c.fullName && c.fullName !== c.relation ? c.fullName.trim() : "";
  const relation = (c.relation || "").toString().trim();
  const label = (c.label || "").trim();
  if (name && relation && name !== relation) return `${name} - ${relation}`;
  return name || label || relation || "Beneficiary";
}

interface ServiceSubjectPickerProps {
  label: string;
  candidates: CandidateProfile[];
  value: string;
  onChange: (id: string) => void;
  /** Locked after the first step, so a booking never mixes two people's details. */
  disabled?: boolean;
}

export default function ServiceSubjectPicker({
  label,
  candidates,
  value,
  onChange,
  disabled = false,
}: ServiceSubjectPickerProps) {
  return (
    <div className="svk-for svk-pick-for">
      <span id="svk-subject-label">{label}</span>
      <div className="svk-subject">
        <select
          aria-labelledby="svk-subject-label"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          title={disabled ? "Go back to step 1 to change who this is for" : undefined}
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {candidateOptionLabel(c)}
            </option>
          ))}
          <option value={SOMEONE_ELSE_ID}>Someone else</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
