import type { Metadata } from "next";
import RahvanaIr1Homepage from "./RahvanaIr1Homepage";

export const metadata: Metadata = {
  title: "IR-1 Homepage | Rahvana",
  description:
    "A guided IR-1 spousal visa roadmap with structured steps, tools, document organization, and progress clarity.",
};

export default function HomepageVariantPage() {
  return <RahvanaIr1Homepage />;
}