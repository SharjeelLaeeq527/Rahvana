export interface RoadmapStep {
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
}

export interface ScenarioOption {
  id: string;
  title: string;
  desc: string;
}

export interface RoadmapData {
  scenarios?: ScenarioOption[];
  scenarioNotes?: Record<string, string>;
  title?: string;
  titleUr?: string;
  description?: string;
  descriptionUr?: string;
  stages: RoadmapStage[];
  documents?: string[];
  disclaimer?: string;
  disclaimerUr?: string;
  disclaimerLink?: string;
  disclaimerLinkText?: string;
  disclaimerLinks?: {
    text: string;
    url: string;
  }[];
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
