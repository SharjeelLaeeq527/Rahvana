// Imports
import ir1SpouseQuestionnaire from "./ir-1-spouse/questionnaire.json";
import ir5ParentQuestionnaire from "./ir-5-parent/questionnaire.json";
import ir2ChildQuestionnaire from "./ir-2-child/questionnaire.json";
import type { Questionnaire } from "@/types/review";

export const QUESTIONNAIRES: Record<string, Questionnaire> = {
   // Categories
  "ir-1-spouse": ir1SpouseQuestionnaire as Questionnaire,
  "ir-5-parent": ir5ParentQuestionnaire as Questionnaire,
  "ir-2-child": ir2ChildQuestionnaire as Questionnaire,
};