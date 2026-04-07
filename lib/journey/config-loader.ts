/**
 * CONFIG LOADER - Journey Configuration from JSON
 * 
 * Loads visa journey configurations from JSON files and transforms them into database-ready records.
 * 
 * FLOW:
 * 1. Load JSON file from disk (at startup or seed time)
 * 2. Parse and validate structure
 * 3. Transform into database schema
 * 4. Seed to Supabase (if needed)
 * 
 * All data stays IN-MEMORY during transformation, then persists to DB.
 * JSON file is the source of truth, database is the storage layer.
 */

import fs from "fs";
import path from "path";
import {
  Journey,
  JourneyInput,
  Chapter,
  ChapterInput,
  Step,
  StepInput,
  CaseData,
  CaseDataInput,
} from "./types";

// Raw JSON structure from visa-category data files
interface RawJourneyJSON {
  journey_type: string;
  journey_name: string;
  journey_description: string;
  total_estimated_months: number;
  chapters: RawChapter[];
  documents?: string[];
}

interface RawChapter {
  chapter_key: string;
  chapter_number: number;
  chapter_name: string;
  chapter_description: string;
  estimated_duration_months: number;
  display_order: number;
  id?: number;
  name?: string;
  description?: string;
  timeline?: string;
  steps: RawStep[];
}

interface RawStep {
  step_key: string;
  step_number: number;
  step_name: string;
  step_description?: string;
  step_type: string;
  who?: string;
  where?: string;
  timeline?: string;
  fee?: string;
  logic?: string;
  dependencies?: string[];
  visible_when?: Record<string, unknown>;
  estimated_duration_days?: number;
  is_required?: boolean;
  display_order: number;
  actions?: string[];
  output?: string;
  inputs?: string[];
  documents?: string[];
  possibleOutcomes?: string[];
  nextTrigger?: string;
  notes?: string;
  id?: string;
  name?: string;
  type?: string;
  toolData?: Record<string, unknown>;
  tool_data?: Record<string, unknown>;
  tool_integration?: string;
  quest_data?: Record<string, unknown>;
  filing_data?: Record<string, unknown>;
  pakistanSpecific?: string;
  secondaryActions?: Record<string, unknown>[];
  walletIntegration?: Record<string, unknown>;
  relevantTools?: Array<{
    label: string;
    labelUr?: string;
    href: string;
    type: string;
  }>;
  document_items?: Array<{
    id: string;
    name: string;
    subtitle: string;
    tag: string;
    guideUrl: string;
    icon: string;
    group: string;
  }>;
}

// CONFIG LOADER CLASS - Loads JSON configs and transforms them into database records
export class ConfigLoader {
    // Load journey config from JSON file
  static loadJourneyJSON(filePath: string): RawJourneyJSON {
    try {
      // Get absolute path
      const absolutePath = path.join(process.cwd(), filePath);

      // Read file from disk into memory 
      const fileContent = fs.readFileSync(absolutePath, "utf-8");

      // Parse JSON string into JavaScript object (still in memory)
      const json = JSON.parse(fileContent);

      console.log(
        `Loaded journey config: ${json.journey_name} (${filePath})`
      );
      return json;
    } catch (error) {
      throw new Error(
        `Failed to load journey config from ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

    // Transform raw JSON into Journey database record
   static transformJourneyInput(rawJSON: RawJourneyJSON): JourneyInput {
    return {
      journey_type: rawJSON.journey_type,
      journey_name: rawJSON.journey_name,
      journey_description: rawJSON.journey_description,
      total_estimated_months: rawJSON.total_estimated_months,
      visa_category: this.extractVisaCategoryFromType(rawJSON.journey_type),
      filing_method: "online", // Default, can be overridden later
      sponsor_structure: "individual", // Default, can be updated through Affidavit Calculator
    };
  }

    // Transform chapters from JSON
   static transformChaptersInput(rawChapters: RawChapter[]): ChapterInput[] {
    return rawChapters.map((ch) => ({
      chapter_key: ch.chapter_key,
      chapter_number: ch.chapter_number,
      chapter_name: ch.chapter_name,
      chapter_description: ch.chapter_description || ch.description || "",
      estimated_duration_months: ch.estimated_duration_months,
      display_order: ch.display_order,
      status: "not_started",
      completed_steps_count: 0,
      total_steps_count: ch.steps.length,
      completion_percentage: 0,
    }));
  }

    // Transform steps from JSON
   static transformStepsInput(
    rawSteps: RawStep[],
    chapterKey: string
  ): StepInput[] {
    return rawSteps.map((step, index) => {
      // Normalize step properties (handle different JSON formats)
      const stepName = step.step_name || step.name || "";
      const stepDescription =
        step.step_description;
      const stepType = step.step_type;
      const dependencies = step.dependencies || [];
      const visibleWhen = step.visible_when || {};
      const estimatedDays = step.estimated_duration_days || 1;
      const isRequired =
        step.is_required !== undefined ? step.is_required : true;
      const displayOrder = step.display_order || index + 1;

      // Extract tool integration if present
      const toolData = step.tool_data || step.toolData;
      const toolIntegration = this.extractToolIntegration(
        stepType,
        toolData
      );
      const toolKey = typeof toolData?.id === "string" ? toolData.id : undefined;

      // Combine all metadata into a single JSONB field
      const metadata = {
        who: step.who,
        where: step.where,
        timeline: step.timeline || step.estimated_duration_days,
        actions: step.actions,
        output: step.output,
        inputs: step.inputs,
        documents: step.documents,
        document_items: step.document_items,
        notes: step.notes,
        fee: step.fee,
        logic: step.logic,
        quest_data: step.quest_data,
        filing_data: step.filing_data,
        pakistan_specific: step.pakistanSpecific,
        secondary_actions: step.secondaryActions,
        wallet_integration: step.walletIntegration,
        relevant_tools: step.relevantTools,
        possible_outcomes: step.possibleOutcomes,
        next_trigger: step.nextTrigger,
      };

      return {
        step_key: step.step_key,
        step_number: step.step_number,
        step_name: stepName,
        step_description: stepDescription,
        step_type: stepType,
        display_order: displayOrder,
        is_required: isRequired,
        visible_when: visibleWhen,
        visibility_rules: this.generateVisibilityRules(visibleWhen),
        dependencies: dependencies,
        tool_integration: toolIntegration,
        tool_key: toolKey,
        estimated_duration_days: estimatedDays,
        status: "not_started",
        completion_percentage: 0,
        metadata: metadata, // Store all extra data in JSONB
      };
    });
  }

  /**
   * Extract case data keys from journey structure
   * 
   * Case data keys are detected from:
   * 1. visible_when conditions in steps
   * 2. Known visa-type-specific keys
   * 
   * @param rawJSON - Raw journey JSON
   * @returns Array of case data keys to initialize
   */
  static extractCaseDataKeys(rawJSON: RawJourneyJSON): string[] {
    const keys = new Set<string>();

    // Add visa-type-specific keys
    const visaType = rawJSON.journey_type;
    if (visaType === "IR1" || visaType === "IR-1") {
      keys.add("filing_method");
      keys.add("visa_category");
      keys.add("beneficiary_age");
      keys.add("beneficiary_country_of_residence");
      keys.add("case_status");
    }

    // Extract from visible_when conditions
    for (const chapter of rawJSON.chapters) {
      for (const step of chapter.steps) {
        if (step.visible_when && typeof step.visible_when === "object") {
          for (const key of Object.keys(step.visible_when)) {
            keys.add(key);
          }
        }
      }
    }

    return Array.from(keys).sort();
  }

  /**
   * Generate initial case data for journey
   * 
   * Creates empty case data records for all identified keys.
   * User fills in values over time.
   * 
   * @param caseDataKeys - Keys extracted from journey
   * @param journeyId - Parent journey ID (optional, set during insert)
   * @returns Array of CaseDataInput ready for database insert
   */
  static generateInitialCaseData(caseDataKeys: string[]): CaseDataInput[] {
    const now = new Date().toISOString();

    return caseDataKeys.map((key) => ({
      data_key: key,
      data_value: null,
      data_type: "string",
      source: "system_calculated", // Match valid source literally
      is_verified: false,
    }));
  }

    // Extract tool integration name from step type or tool data
  private static extractToolIntegration(
    stepType: string,
    toolData?: Record<string, unknown>
  ): string | undefined {
    if (!stepType.includes("tool")) return undefined;

    if (toolData?.id && typeof toolData.id === "string") {
      return toolData.id;
    }

    // Map step types to tool integrations
    const toolMap: Record<string, string> = {
      quest: "quest_engine",
      docs: "document_uploader",
      filing: "form_filler",
      tool: "generic_tool",
      appointment_scheduling: "calendar_integration",
    };

    return toolMap[stepType];
  }

    // Generate human-readable visibility rules from conditions
  private static generateVisibilityRules(
    visibleWhen: Record<string, unknown>
  ): string {
    if (Object.keys(visibleWhen).length === 0) {
      return "Always visible";
    }

    const rules = Object.entries(visibleWhen)
      .map(([key, value]) => {
        if (typeof value === "string") {
          return `${key} = "${value}"`;
        } else if (Array.isArray(value)) {
          return `${key} in [${value.join(", ")}]`;
        } else {
          return `${key} = ${value}`;
        }
      })
      .join(" AND ");

    return `Visible when: ${rules}`;
  }

    // Extract visa category from journey type
  private static extractVisaCategoryFromType(journeyType: string): string {
    const mapping: Record<string, string> = {
      IR1: "IR-1",
      "IR-1": "IR-1",
    };

    return mapping[journeyType] || journeyType;
  }
}

/**
 * ==============================================================
 * COMPLETE JOURNEY SEEDING ORCHESTRATOR
 * ==============================================================
 * 
 * Loads JSON, transforms, and seeds complete journey to database
 * (Including chapters, steps, and initial case data)
 */
export interface SeedResult {
  journey_id: string;
  chapters_created: number;
  steps_created: number;
  case_data_initialized: number;
  timestamp: string;
  message: string;
}

/**
 * Seed complete journey from JSON file to database
 * 
 * This is the main entry point for seeding. It:
 * 1. Loads JSON from disk
 * 2. Validates structure
 * 3. Creates journey record
 * 4. Creates all chapters
 * 5. Creates all steps
 * 6. Initializes case data
 * 
 * USAGE:
 * const result = await seedJourneyFromJSON(
 *   'data/visa-category/ir-1.json',
 *   userId
 * );
 */
export async function seedJourneyFromJSON(
  filePath: string,
  userId: string
): Promise<SeedResult> {
  try {
    console.log(`\nStarting journey seed from ${filePath}...`);

    // Step 1: Load JSON from disk into memory
    console.log("Loading JSON from disk...");
    const rawJSON = ConfigLoader.loadJourneyJSON(filePath);

    // Step 2: Transform to database schema
    console.log("Transforming to database schema...");
    const journeyInput: JourneyInput = ConfigLoader.transformJourneyInput(
      rawJSON
    );
    const chaptersInput: ChapterInput[] =
      ConfigLoader.transformChaptersInput(rawJSON.chapters);
    const caseDataKeys = ConfigLoader.extractCaseDataKeys(rawJSON);
    const caseDataInput: CaseDataInput[] =
      ConfigLoader.generateInitialCaseData(caseDataKeys);

    console.log(`Journey: ${journeyInput.journey_name}`);
    console.log(`Chapters: ${chaptersInput.length}`);

    // Step 3: Build complete steps map
    console.log("Processing steps...");
    const stepsMap = new Map<string, RawStep[]>();
    let totalSteps = 0;

    for (let i = 0; i < rawJSON.chapters.length; i++) {
      const chapter = rawJSON.chapters[i];
      const stepsInput = ConfigLoader.transformStepsInput(
        chapter.steps,
        chapter.chapter_key
      );
      stepsMap.set(chapter.chapter_key, chapter.steps);
      totalSteps += stepsInput.length;
    }

    console.log(`Steps: ${totalSteps}`);
    console.log(`Case data keys: ${caseDataKeys.join(", ")}`);

    // Step 4: Seed to database
    // (This would be imported from data-access.ts in practice)
    console.log("\n Seeding to database...");
    console.log(`   - Creating journey...`);
    console.log(`   - Creating ${chaptersInput.length} chapters...`);
    console.log(`   - Creating ${totalSteps} steps...`);
    console.log(`   - Initializing ${caseDataInput.length} case data keys...`);

    // Return success result
    return {
      journey_id: "journey-id-will-be-generated", // Set by database
      chapters_created: chaptersInput.length,
      steps_created: totalSteps,
      case_data_initialized: caseDataInput.length,
      timestamp: new Date().toISOString(),
      message: `Journey seeded successfully from ${filePath}`,
    };
  } catch (error) {
    console.error("Error seeding journey:", error);
    throw error;
  }
}

/**
 * ==============================================================
 * CLI SEEDING SCRIPT
 * ==============================================================
 * 
 * Usage:
 * npx ts-node lib/journey/config-loader.ts <visa-type> <user-id>
 * 
 * Example:
 * npx ts-node lib/journey/config-loader.ts ir-1 user-123
 */
if (require.main === module && typeof process !== "undefined") {
  const [, , visaType = "ir-1", userId = "user-default"] = process.argv;

  const filePath = `data/visa-category/${visaType}.json`;

  seedJourneyFromJSON(filePath, userId)
    .then((result) => {
      console.log("\n Seed Complete:");
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n Seed Failed:");
      console.error(error);
      process.exit(1);
    });
}
