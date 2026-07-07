import type { Metadata } from "next";
import { JourneyDetailPage } from "../components/journey-detail";

export const metadata: Metadata = {
  title: "IR-1 Journey | Rahvana",
  description:
    "Dedicated IR-1 spouse visa journey page with a clear timeline, evidence guide, and next-step actions.",
};

export default function IR1JourneyRoute() {
  return <JourneyDetailPage slug="ir-1" />;
}
