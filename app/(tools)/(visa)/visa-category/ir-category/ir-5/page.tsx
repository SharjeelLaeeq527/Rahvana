import type { Metadata } from "next";
import { JourneyDetailPage } from "../components/journey-detail";

export const metadata: Metadata = {
  title: "IR-5 Journey | Rahvana",
  description:
    "Dedicated IR-5 parent visa journey page with a clear roadmap, evidence checklist, and sponsor requirements.",
};

export default function IR5JourneyRoute() {
  return <JourneyDetailPage slug="ir-5" />;
}
