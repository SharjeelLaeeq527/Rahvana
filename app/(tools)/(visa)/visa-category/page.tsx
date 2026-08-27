import type { Metadata } from "next";
import { JourneyExplorerPage } from "./components/journey-explorer";

export const metadata: Metadata = {
  title: "Explore Journeys | Rahvana",
  description:
    "Explore immigration pathways, compare live family routes, and move directly into the IR-1 or IR-5 journey pages.",
};

export default function IRCategorySection() {
  return <JourneyExplorerPage />;
}
