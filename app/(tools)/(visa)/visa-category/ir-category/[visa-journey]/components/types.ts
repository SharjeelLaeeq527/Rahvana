export interface RoadmapStep {
  stepNumber?: number;
  id: string;
  name: string;
  nameUr?: string;
  title?: string;
  titleUr?: string;
  description?: string;
  descriptionUr?: string;
  who?: string;
  whoUr?: string;
  where?: string;
  whereUr?: string;
  actions?: string[];
  actionsUr?: string[];
  output?: string;
  outputUr?: string;
  notes?: string;
  notesUr?: string;
  info?: string;
  warn?: string;
  timeline?: string;
  documents?: string[];
  documentsUr?: string[];
  pakistanSpecific?: string;
  fee?: string;
  filingType?: string;
  inputs?: string[];
  officialSource?: string;
  nextTrigger?: string;
  relevantTools?: {
    label: string;
    labelUr?: string;
    href: string;
    type?: "tool" | "service" | "guide";
  }[];
  possibleOutcomes?: string[];
  scenarioSpecific?: string;
  success?: string;
  successUr?: string;

  // New Journey Engine fields
  type?: "info" | "quest" | "tool" | "tutorial" | "docs" | "filing";
  documentItems?: DocumentItem[];
  filingData?: FilingData;
  questData?: QuestData;
  toolData?: ToolData;
  logic?: string; // visibility logic e.g. "filingMethod === 'online'"
  prerequisites?: string[]; // IDs of steps
  isPersistent?: boolean;
  chapterId?: string | number;
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
  multiPassLogic?: string;
}

export interface QuestData {
  id: string;
  title: string;
  subtitle: string;
  screens: QuestScreen[];
  resultLogic: string;
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
  price: string;
  subtitle: string;
  features: string[];
  icon?: string;
}

export interface FilingData {
  id: string;
  methods: FilingMethod[];
  quiz?: FilingQuiz;
}

export interface FilingQuiz {
  screens: FilingQuizScreen[];
}

export interface FilingQuizScreen {
  id: string;
  question: string;
  helper: string;
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
  guideUrl?: string;
  icon?: string;
  group?: string;
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

export interface ToolData {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  companion?: string;
  chips?: {
    label: string;
    type: "role" | "tool" | "newtab" | "uscis";
  }[];
  launchModule: {
    icon: "form" | "calc" | "search" | "user" | "shield";
    eyebrow: string;
    heading: string;
    features: string[];
    buttonLabel: string;
    href: string;
    note?: string;
  };
  secondaryActions?: SecondaryAction[];
  walletIntegration?: {
    portalType: "USCIS" | "NVC" | "COURIER";
  };
  supportCards?: {
    label: string;
    items: string[];
  }[];
  disclaimer?: string;
}

export interface JourneyState {
  currentChapterId: string | number;
  currentStepId: string;
  completedSteps: string[];
  unresolvedTasks: string[];
  answers: Record<string, any>;
  metadata: Record<string, any>; // e.g., filingMethod: 'online'
}

export interface RoadmapSource {
  label: string;
  labelUr?: string;
  url: string;
}

export interface RoadmapStage {
  id: number | string;
  name: string;
  nameUr?: string;
  title?: string;
  titleUr?: string;
  description?: string;
  descriptionUr?: string;
  timeline?: string;
  icon?: string;
  color?: string;
  scenarioSpecific?: string;
  sources?: RoadmapSource[];
  steps: RoadmapStep[];
  progress?: number; // Calculated progress percentage
}

export interface ScenarioOption {
  id: string;
  title: string;
  desc: string;
}

export interface RoadmapData {
  scenarios: any;

  info?: string;

  infoLink?: string;
  infoLinkText?: string;

  infoLinks?: {
    text: string;
    url: string;
  }[];

  disclaimer?: string;
  disclaimerUr?: string;

  disclaimerLink?: string;
  disclaimerLinkText?: string;

  disclaimerLinks?: {
    text: string;
    url: string;
  }[];

  scenarioNotes: Record<string, string>;

  title?: string;
  titleUr?: string;

  description?: string;
  descriptionUr?: string;

  stages: RoadmapStage[];

  documents?: string[];

  visaOverview?: {
    title: string;
    titleUr?: string;
    text: string;
    textUr?: string;
    flag: string;
    link: string;
    linkText?: string;
  };
}