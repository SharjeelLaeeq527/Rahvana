export interface RoadmapStep {
  id: string;
  name: string;
  who?: "petitioner" | "beneficiary" | "both" | string;
  where?: string;
  timeline?: string;
  fee?: string;

  actions?: string[];
  inputs?: string[];
  documents?: string[];

  output?: string;
  notes?: string;
  pakistanSpecific?: string;
}
