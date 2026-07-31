export interface RoadmapStepV3 {
  step_key: string;
  step_number: number;
  step_name: string;
  step_short_description: string;
  step_description: string;
  step_type:
    | "informational"
    | "form_fillable"
    | "form_submit"
    | "awaiting_response"
    | "document_upload"
    | "appointment_scheduling"
    | "review"
    | "decision"
    | "quest"
    | "tool"
    | "action"
    | "docs"
    | "filing";
  tool_integration?: string | null;
  dependencies: string[];
  visible_when: Record<string, string | number | boolean | string[] | null>;
  estimated_duration_days: number;
  is_required: boolean;
  display_order: number;

  // UI-specific properties
  who?: string;
  where?: string;
  actions?: string[];
  output?: string;
  notes?: string;
  info?: string;
  warn?: string;
  timeline?: string;
  fee?: string;
  official_source?: string;
  next_trigger?: string;
  relevant_tools?: {
    label: string;
    href: string;
    type?: "tool" | "service" | "guide";
  }[];
  possible_outcomes?: string[];
  scenario_specific?: string;
  success?: string;

  document_items?: DocumentItemV3[];
  filing_data?: FilingDataV3;
  quest_data?: QuestDataV3;
  tool_data?: ToolDataV3;
  action_data?: ActionDataV3;
  logic?: string;
  prerequisites?: string[];
  is_persistent?: boolean;
  chapter_id?: string | number;
  branch?: "online" | "paper" | "both";
  citations?: { text: string; link: string }[];
}

export interface QuestOptionV3 {
  label: string;
  value: string;
  outcome?: "pass" | "caution" | "review" | "stop" | "next" | "pass_direct";
  sub?: string;
}

export interface QuestScreenV3 {
  id: string;
  label?: string;
  question: string;
  helper?: string;
  type: "single" | "multi";
  options: QuestOptionV3[];
  hint?: {
    intro?: string;
    items: string[];
  };
  multi_pass_logic?: string;
}

export interface QuestDataV3 {
  id: string;
  title: string;
  subtitle: string;
  screens: QuestScreenV3[];
  result_logic: string;
}

export interface QuestSuiteV3 {
  id: string;
  title: string;
  subtitle: string;
  quests: QuestDataV3[];
}

export interface FilingMethodV3 {
  id: string;
  name: string;
  title?: string;
  price: string;
  subtitle: string;
  features: string[];
  icon?: string;
  color?: string;
}

export interface FilingDataV3 {
  id: string;
  title?: string;
  subtitle?: string;
  methods: FilingMethodV3[];
  footerNote?: string;
  quiz?: FilingQuizV3;
}

export interface FilingQuizV3 {
  screens: FilingQuizScreenV3[];
}

export interface FilingQuizScreenV3 {
  id: string;
  question: string;
  helper?: string;
  hint?: { items: string[] };
  options: {
    label: string;
    value: string;
    signal: "online" | "paper" | "discuss" | "neutral";
  }[];
}

export interface DocumentItemV3 {
  id: string;
  name: string;
  subtitle?: string;
  tag?: "petitioner" | "beneficiary" | "both" | "other" | "third party";
  guide_url?: string;
  icon?: string;
  group?: string;
}

export interface DocumentGatheringItemV3 {
  id: string;
  icon: string;
  title: string;
  sub: string;
  sections: {
    t: string;
    c: string;
  }[];
}

export interface DocumentGatheringGroupV3 {
  id: string;
  label: string;
  badge: "Required" | "Required if applicable" | "Recommended";
  items: DocumentGatheringItemV3[];
}

export interface ActionCardV3 {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  cta_label?: string;
  href?: string;
}

export interface TutorialStepV3 {
  label: string;
  heading: string;
  instruction: string;
  url?: string;
  screenTitle?: string;
  screenDesc?: string;
  media?: {
    type: "img" | "video";
    src?: string;
  };
  videoMeta?: {
    poster?: string;
  };
  fields?: Array<{
    type: "btn" | "field";
    label?: string;
    placeholder?: string;
    isPassword?: boolean;
  }>;
  note: string | null;
  // Household/visual step additions:
  vlabel?: string;
  visual?: string;
  // Compatibility:
  ss_headline?: string;
  ss_desc?: string;
}

export interface ToolDataV3 {
  type: string;
  title?: string;
  description?: string;
  chips?: Array<{ label: string; type: string }>;
  eyebrow?: { chapter: string; step: string };
  [key: string]: any;
}

export interface GuideStepV3 {
  label: string;
  title: string;
  text: string;
  url?: string;
  visual?: string;
  note?: string;
}

export interface ActionItemV3 {
  title: string;
  description: string;
}

export interface DropdownOptionV3 {
  value: string;
  label: string;
}

export interface ActionDataV3 {
  guide_button_label: string;
  id: string;
  hero_heading: string;
  hero_description?: string;
  badge?: string;
  action_tips?: string[];
  action_button_label?: string;
  action_button_status_heading?: string;
  action_button_status_message?: string;
  second_card_title?: string;
  second_card_subtitle?: string;
  cta_button?: {
    label: string;
    href?: string;
  };
  guide_card?: {
    title: string;
    subtitle: string;
  };
  dropdown_card?: {
    title: string;
    subtitle: string;
    dropdown_options?: DropdownOptionV3[];
  };
  mailing_card?: {
    title: string;
    subtitle: string;
    carrier_placeholder?: string;
    tracking_placeholder?: string;
  };
  action_items_title?: string;
  action_items: ActionItemV3[];
  guide_steps: GuideStepV3[];
  chips?: {
    label: string;
    type: string;
  }[];
}

export interface InlineGuideSectionV3 {
  title: string;
  htmlContent: string;
}

export interface InlineGuideEntryV3 {
  title: string;
  sub: string;
  sourceType: "internal" | "rahvana";
  sections: InlineGuideSectionV3[];
}

export interface RoadmapChapterV3 {
  chapter_key: string;
  chapter_number: number;
  chapter_name: string;
  chapter_description: string;
  estimated_duration_months: number;
  display_order: number;
  steps: RoadmapStepV3[];
  icon?: string;
  id?: number | string;
  name?: string;
  title?: string;
  description?: string;
}

export interface RoadmapDataV3 {
  journey_type: string;
  journey_name: string;
  journey_description: string;
  total_estimated_months: number;
  chapters: RoadmapChapterV3[];
  scenarios?: any;
  info?: string;
  disclaimer?: string;
  // Dynamic Guide and Tutorial Data:
  inline_guide_data?: Record<string, InlineGuideEntryV3>;
  uscis_tutorial_steps?: TutorialStepV3[];
  household_tutorial_steps?: TutorialStepV3[];
  submission_tutorial_steps?: TutorialStepV3[];
}
