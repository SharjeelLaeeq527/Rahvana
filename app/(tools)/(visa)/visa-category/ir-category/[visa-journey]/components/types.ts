export interface RoadmapStep {
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
    | "docs"
    | "filing";
  tool_integration?: string | null;
  dependencies: string[];
  visible_when: Record<string, string | number | boolean | string[] | null>;
  estimated_duration_days: number;
  is_required: boolean;
  display_order: number;

  // UI-specific properties (now in snake_case)
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

  document_items?: DocumentItem[];
  filing_data?: FilingData;
  quest_data?: QuestData;
  tool_data?: ToolData;
  logic?: string;
  prerequisites?: string[];
  is_persistent?: boolean;
  chapter_id?: string | number;
  branch?: "online" | "paper" | "both";
}

export interface QuestOption {
  label: string;
  value: string;
  outcome?: "pass" | "caution" | "review" | "stop" | "next" | "pass_direct";
  sub?: string;
}

export interface QuestScreen {
  id: string;
  label?: string;
  question: string;
  helper?: string;
  type: "single" | "multi";
  options: QuestOption[];
  hint?: {
    intro?: string;
    items: string[];
  };
  multi_pass_logic?: string;
}

export interface QuestData {
  id: string;
  title: string;
  subtitle: string;
  screens: QuestScreen[];
  result_logic: string;
}

export interface QuestSuite {
  id: string;
  title: string;
  subtitle: string;
  quests: QuestData[];
}

export interface FilingMethod {
  id: string;
  name: string;
  title?: string;
  price: string;
  subtitle: string;
  features: string[];
  icon?: string;
  color?: string;
}

export interface FilingData {
  id: string;
  title?: string;
  subtitle?: string;
  methods: FilingMethod[];
  footerNote?: string;
  quiz?: FilingQuiz;
}

export interface FilingQuiz {
  screens: FilingQuizScreen[];
}

export interface FilingQuizScreen {
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

export interface DocumentItem {
  id: string;
  name: string;
  subtitle?: string;
  tag?: "petitioner" | "beneficiary" | "both" | "other" | "third party";
  guide_url?: string;
  icon?: string;
  group?: string;
}

export interface DocumentGatheringItem {
  id: string;
  icon: string;
  title: string;
  sub: string;
  sections: {
    t: string;
    c: string;
  }[];
}

export interface DocumentGatheringGroup {
  id: string;
  label: string;
  badge: "Required" | "Required if applicable" | "Recommended";
  items: DocumentGatheringItem[];
}

export interface ToolChip {
  label: string;
  type: "role" | "tool" | "newtab" | "uscis" | "path";
}

export interface SupportCard {
  label: string;
  items: string[];
}

export interface SecondaryAction {
  id: string;
  type: "tutorial" | "wallet";
  title: string;
  subtitle: string;
  cta: string;
  icon?: "book" | "wallet" | "shield";
  href?: string;
}

export interface ActionCard {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  cta_label?: string;
  href?: string;
}

export interface TutorialStepData {
  label: string;
  heading: string;
  instruction: string;
  url: string;
  /** Path or URL to a real screenshot. When supplied the image replaces the
   *  structured placeholder. Leave null/undefined to keep the placeholder. */
  screenshot?: string | null;
  ss_label: string;
  ss_headline: string;
  ss_desc: string;
  ss_highlight: string | null;
  caption: string;
  caption_class?: "success" | null;
  note: string | null;
}

export interface FeeBlock {
  label: string; // e.g. "Current online fee"
  amount: string; // e.g. "$625"
  note: string; // e.g. "Form I-130 · online filing"
  details: string[]; // bullet points shown on the right side
}

export interface ToolData {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  companion?: string;
  chips?: {
    label: string;
    type: "role" | "tool" | "newtab" | "uscis" | "path" | "pay" | "final";
  }[];
  launch_module: {
    icon:
      | "form"
      | "calc"
      | "search"
      | "user"
      | "shield"
      | "portal"
      | "upload"
      | "check"
      | "payment"
      | "submit";
    /** Controls the right-end colour of the top accent stripe.
     *  "gold" → payment step, "green" → final submit step (default: blue) */
    stripe_variant?: "blue" | "gold" | "green";
    /** Optional custom background hex for the dark module */
    bg_color?: string;
    eyebrow: string;
    heading: string;
    features: string[];
    button_label?: string;
    button_launched_label?: string;
    href?: string;
    note?: string;
    launched_note?: string;
    type?: string;
    return_note?: { title: string; body: string };
  };
  /** Payment fee display block — shown inside the launch module for step 9 */
  fee_block?: FeeBlock;
  /** Pre-submission checklist — shown inside the launch module for step 10 */
  alert_note?: string;
  review_checklist?: string[];
  guide_card?: { title: string; subtitle: string };
  wallet_card?: { type: string; title: string; subtitle: string };
  tutorial_steps?: TutorialStepData[];
  doc_list?: {
    groups: {
      id: string;
      label: string;
      badge?: string;
      items: any[];
    }[];
  };
  action_cards?: ActionCard[];
  upload_requirements?: string[];
  doc_gathering?: {
    groups: DocumentGatheringGroup[];
  };
  secondary_actions?: SecondaryAction[];
  wallet_integration?: {
    portal_type: "USCIS" | "NVC" | "COURIER";
  };
  support_cards?: {
    label: string;
    items: string[];
  }[];
  disclaimer?: string;
}

export interface JourneyState {
  current_chapter_id: string | number;
  current_step_id: string;
  completed_steps: string[];
  unresolved_tasks: string[];
  answers: Record<string, any>;
  metadata: Record<string, any>;
}

export interface RoadmapSource {
  label: string;
  url: string;
}

export interface RoadmapChapter {
  chapter_key: string;
  chapter_number: number;
  chapter_name: string;
  chapter_description: string;
  estimated_duration_months: number;
  display_order: number;
  steps: RoadmapStep[];

  // Optional legacy support fields
  id?: number | string;
  name?: string;
  title?: string;
  description?: string;
  timeline?: string;
  icon?: string;
  color?: string;
  scenario_specific?: string;
  sources?: RoadmapSource[];
  progress?: number;
}

export interface RoadmapData {
  journey_type: string;
  journey_name: string;
  journey_description: string;
  total_estimated_months: number;
  chapters: RoadmapChapter[];

  // Optional legacy or additional top-level keys
  scenarios?: any;
  info?: string;
  info_links?: {
    text: string;
    url: string;
  }[];
  disclaimer?: string;
  visa_overview?: {
    title: string;
    text: string;
    flag: string;
    link: string;
    link_text?: string;
  };
}
