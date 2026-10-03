"use client";
import MedicalAppointmentTool from "@/components/tools/MedicalAppointmentTool";
export default function WilcareAppointmentForm() {
  // No props → useResolveToolMode auto-detects "standalone" (no JourneyEnvironment provider).
  return <MedicalAppointmentTool />;
}
