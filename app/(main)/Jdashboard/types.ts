export interface DashboardStepItem {
  stepIdx: number;
  stepNumber: number;
  name: string;
  shortInstruction?: string;
  isDone?: boolean;
  isCurrent?: boolean;
  isLocked?: boolean;
  time?: string;
}

export interface DashboardChapter {
  n: number;
  t: string;
  d: number;
  tot: number;
  st?: string;
  col: string;
  a: string;
  m: string;
  b: string;
  la: string;
  lm: string;
  lb: string;
  cur?: number;
  steps?: DashboardStepItem[];
}

export interface DashboardAlert {
  id: string;
  tag?: string;
  t: string;
  s: string;
  n: number;
  m: string;
  d: string;
  f: string;
  blk?: boolean;
  chapterIdx?: number;
  stepIdx?: number;
}

export interface DashboardKeyDate {
  y: number;
  m: number;
  d: number;
  t: string;
  c: string;
  s: string;
  custom?: boolean;
}

export interface DashboardSubScores {
  evidenceCoverage: { val: string; denom: string; pct: number };
  consistency: { val: string; denom: string; pct: number };
  completeness: { val: string; denom: string; pct: number };
  riskDeductions: { val: string; denom: string; pct: number };
}

export interface DashboardOptions {
  data?: any;
  state?: any;
  journeyTitle?: string;
  nextAction?: {
    stepName: string;
    chapterName: string;
    chapterIdx: number;
    stepIdx: number;
    shortInstruction?: string;
  };
  caseStrength?: {
    score: number;
    band: "Critical" | "Needs attention" | "Good" | "Excellent" | string;
    subScores?: DashboardSubScores;
  };
  alerts?: DashboardAlert[];
  chapters?: DashboardChapter[];
  stepNames?: string[][];
  keyDates?: DashboardKeyDate[];
  receiptNumber?: string;
  receiptRecord?: any;
  autoCheckEnabled?: boolean;
  interviewDate?: Date | string | null;
  dqDate?: Date | string | null;
  medicalDate?: Date | string | null;
  priorityDate?: Date | string | null;
  tier?: "free" | "basic" | "premium" | "executive" | string;
  activeMilestoneIndex?: number;
  onUpgradeRequired?: (featureKey: string) => void;
  onSelectChapter?: (chapterIdx: number) => void;
  onSelectStep?: (chapterIdx: number, stepIdx: number) => void;
  onLaunchTool?: (toolKey: string) => void;
  onToggleAutoCheck?: (enabled: boolean) => void;
  onOpenVault?: () => void;
  onOpenRequests?: () => void;
  onOpenFavorites?: () => void;
  onOpenWallet?: () => void;
  onOpenGuides?: () => void;
  onOpenTools?: () => void;
  onOpenServices?: () => void;
  onOpenCaseStrength?: () => void;
}

