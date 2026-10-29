"use client";

import React from "react";
import { JourneyServiceModule } from "./JourneyServiceModule";
import { MEDICAL_EXAM_DATA } from "@/app/components/journey-spouse/MedicalExamData";
import type { JourneyServiceRecord } from "@/lib/journey/toolModeGuards";

interface MedicalBookingModuleProps {
  /** Roadmap tool_data (accepted for prop-compatibility; content is data-driven). */
  tool?: unknown;
  record: JourneyServiceRecord | null;
  locked: boolean;
  onOpen: () => void;
  journeyTier?: string;
  onOpenGuide?: (guideUrl: string) => void;
}

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const MedicalBookingModule: React.FC<MedicalBookingModuleProps> = ({
  record,
  locked,
  onOpen,
  journeyTier,
  onOpenGuide,
}) => {
  const d = MEDICAL_EXAM_DATA;
  // Explicit, human-readable reason for the lock, so users know why a second
  // booking is blocked (rather than the small default "Active until {date}" text).
  const lockedHint = record?.referenceDate
    ? `An appointment is already scheduled for ${record.referenceDate}. You can book another once that date has passed.`
    : "You already have an active medical appointment. You can book another once its appointment date passes.";
  return (
    <JourneyServiceModule
      chips={d.chips}
      decision={d.decisionModule}
      guideSteps={d.guideSteps}
      guideEyebrow="Self-service guide"
      disclaimer={d.disclaimer}
      record={record}
      locked={locked}
      lockedHint={lockedHint}
      onOpen={onOpen}
      journeyTier={journeyTier}
      onOpenGuide={onOpenGuide}
      summaryTitle="Your Medical Appointment"
      summaryRows={[
        ["Location", cap(record?.location)],
        ["Appointment date", record?.referenceDate],
        ["Time slot", record?.timeSlot],
      ]}
      summaryEmptyText="No appointment booked yet. Use Rahvana's booking service above to schedule your panel-physician medical exam, or follow the self-service guide."
    />
  );
};

export default MedicalBookingModule;
