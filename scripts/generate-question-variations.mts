/**
 * Question Variation Generator Script
 * 
 * Reads all question-bank.json files and generates variations using Gemini AI
 * Only generates for questions that don't already have variations
 * 
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CATEGORIES = ["au-student"];
const QUESTION_BANK_BASE = path.join(__dirname, "../data/interview-categories");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const BATCH_SIZE = 10; // Generate variations for 10 questions in 1 API call
const DELAY_BETWEEN_BATCHES_MS = 3000; // 3 seconds between batch calls
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 5000; // Start with 5 second delay for retries

interface Question {
  id: string;
  category: string;
  question: string;
  variations?: string[];
  suggestedAnswer: string;
  [key: string]: unknown;
}

interface QuestionBank {
  categorySlug: string;
  version: string;
  lastUpdated: string;
  questions: Question[];
}

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

async function generateVariationsBatch(
  questions: Array<{ id: string; question: string }>,
  retryCount = 0
): Promise<Map<string, string[]>> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Build prompt for batch of questions
  const questionsList = questions
    .map(
      (q, idx) =>
        `${idx + 1}. [ID: ${q.id}] ${q.question}`
    )
    .join("\n");

  const prompt = `Generate exactly 4 alternative phrasings for EACH of these ${questions.length} visa interview questions. 

Keep the same meaning and intent for each, maintain professional tone, make variations unique.

QUESTIONS:
${questionsList}

RESPONSE FORMAT:
For each question, provide 4 numbered variations. Group by question ID. Use this exact format:

[ID: question-id-1]
1. Variation 1?
2. Variation 2?
3. Variation 3?
4. Variation 4?

[ID: question-id-2]
1. Variation 1?
2. Variation 2?
3. Variation 3?
4. Variation 4?

[Continue for all questions...]

IMPORTANT: Include the [ID: ...] markers exactly as shown above.`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    // Handle rate limiting (429) and quota exceeded (403)
    if (response.status === 429 || response.status === 403) {
      const error = await response.json();
      
      if (retryCount < MAX_RETRIES) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.log(
          `${colors.yellow}⏳ Rate/quota limit hit. Retrying in ${(delayMs / 1000).toFixed(1)}s... (attempt ${retryCount + 1}/${MAX_RETRIES})${colors.reset}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return generateVariationsBatch(questions, retryCount + 1);
      } else {
        throw new Error(
          `Quota limit exceeded after ${MAX_RETRIES} retries. Daily quota exhausted. Try again tomorrow or upgrade to paid tier.`
        );
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the response - extract variations for each question by ID
    const result = new Map<string, string[]>();
    
    // Split by question ID markers
    const idPattern = /\[ID:\s*([^\]]+)\]/g;
    let match;
    const sections: Array<{ id: string; startIdx: number; endIdx: number }> = [];

    while ((match = idPattern.exec(text)) !== null) {
      sections.push({
        id: match[1].trim(),
        startIdx: match.index,
        endIdx: 0,
      });
    }

    // Set end index for each section
    for (let i = 0; i < sections.length; i++) {
      sections[i].endIdx =
        i < sections.length - 1 ? sections[i + 1].startIdx : text.length;
    }

    // Extract variations for each question
    for (const section of sections) {
      const sectionText = text.substring(section.startIdx, section.endIdx);
      const variations = sectionText
        .split("\n")
        .filter((line) => line.match(/^\d+\./))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((v) => v.length > 5)
        .slice(0, 4);

      if (variations.length >= 3) {
        result.set(section.id, variations);
      }
    }

    if (result.size === 0) {
      throw new Error("Could not parse variations from response");
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to generate batch variations: ${error}`);
  }
}

// Load question bank JSON file
function loadQuestionBank(categorySlug: string): QuestionBank {
  const filePath = path.join(
    QUESTION_BANK_BASE,
    categorySlug,
    "question-bank.json"
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Question bank not found: ${filePath}`);
  }

  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as QuestionBank;
}

// Save updated question bank
function saveQuestionBank(categorySlug: string, bank: QuestionBank): void {
  const filePath = path.join(
    QUESTION_BANK_BASE,
    categorySlug,
    "question-bank.json"
  );

  // Update metadata
  bank.lastUpdated = new Date().toISOString().split("T")[0];

  fs.writeFileSync(filePath, JSON.stringify(bank, null, 2));
}

// Process single category with batch variation generation
async function processCategory(categorySlug: string): Promise<void> {
  log(colors.blue, `\n╔════════════════════════════════════════╗`);
  log(colors.blue, `║ Processing: ${categorySlug.padEnd(29)}║`);
  log(colors.blue, `╚════════════════════════════════════════╝`);

  const bank = loadQuestionBank(categorySlug);
  
  // Find questions that need variations
  const questionsNeedingVariations = bank.questions.filter(
    (q) => !q.variations || q.variations.length < 3
  );

  if (questionsNeedingVariations.length === 0) {
    log(colors.green, `  ✓ All ${bank.questions.length} questions already have variations`);
    return;
  }

  log(colors.cyan, `  📊 Found ${questionsNeedingVariations.length} questions needing variations`);
  log(colors.cyan, `  📦 Processing in batches of ${BATCH_SIZE}...\n`);

  let updated = 0;
  let errors = 0;
  let batchNumber = 0;

  // Process in batches
  for (let i = 0; i < questionsNeedingVariations.length; i += BATCH_SIZE) {
    batchNumber++;
    const batch = questionsNeedingVariations.slice(
      i,
      Math.min(i + BATCH_SIZE, questionsNeedingVariations.length)
    );

    try {
      log(
        colors.cyan,
        `  Batch ${batchNumber}: Generating variations for ${batch.length} questions...`
      );

      const batchQuestions = batch.map((q) => ({
        id: q.id,
        question: q.question,
      }));

      const variations = await generateVariationsBatch(batchQuestions);

      // Apply variations back to questions
      for (const question of batch) {
        if (variations.has(question.id)) {
          question.variations = variations.get(question.id);
          log(
            colors.green,
            `    ✓ ${question.id}: Generated ${question.variations!.length} variations`
          );
          updated++;
        } else {
          // Fallback if this question wasn't in parsed response
          log(colors.yellow, `    ⚠ ${question.id}: Using fallback variations`);
          question.variations = [
            `Tell me more about: ${question.question.toLowerCase()}`,
            `Can you explain ${question.question.toLowerCase()}`,
            `How would you address: ${question.question.toLowerCase()}`,
          ];
          updated++;
        }
      }

      log(colors.green, `  ✓ Batch ${batchNumber} complete\n`);

      // Rate limiting between batches - be nice to free tier
      if (i + BATCH_SIZE < questionsNeedingVariations.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)
        );
      }
    } catch (error) {
      log(colors.red, `  ✗ Batch ${batchNumber} failed: ${error}\n`);
      errors++;

      // Set fallback variations for this batch
      for (const question of batch) {
        if (!question.variations || question.variations.length < 3) {
          question.variations = [
            `Tell me more about: ${question.question.toLowerCase()}`,
            `Can you explain ${question.question.toLowerCase()}`,
            `How would you address: ${question.question.toLowerCase()}`,
          ];
          log(colors.yellow, `    Using fallback for ${question.id}`);
          updated++;
        }
      }
    }
  }

  // Save updated bank
  saveQuestionBank(categorySlug, bank);

  log(colors.green, `\n  📊 Summary for ${categorySlug}:`);
  log(colors.green, `     Total Questions: ${bank.questions.length}`);
  log(colors.green, `     Needed Variations: ${questionsNeedingVariations.length}`);
  log(colors.green, `     Updated: ${updated}`);
  if (errors > 0) {
    log(colors.yellow, `     Batches with fallback: ${errors}`);
  }
  log(colors.green, `     ✓ File saved`);
}

// Main execution
async function main(): Promise<void> {
  console.log(
    "\n" +
      colors.cyan +
      "🚀 Question Variation Generator using Gemini AI" +
      colors.reset
  );
  console.log(colors.cyan + "═".repeat(45) + colors.reset);

  if (!GEMINI_API_KEY) {
    log(colors.red, "\n❌ ERROR: GEMINI_API_KEY environment variable not set");
    log(colors.yellow, "\nSet it with:");
    log(colors.yellow, "  export GEMINI_API_KEY='your-key-here'");
    log(colors.yellow, "\nOr on Windows:");
    log(colors.yellow, "  set GEMINI_API_KEY=your-key-here");
    process.exit(1);
  }

  log(colors.green, "\n✓ API Key detected");
  log(colors.cyan, `\nProcessing ${CATEGORIES.length} categories...\n`);
  
  log(colors.yellow, "⚠️  Optimized Batching Strategy for Free Tier:");
  log(colors.yellow, `   • Groups ${BATCH_SIZE} questions per API call (instead of 1)`);
  log(colors.yellow, `   • Reduces API calls from ~80 to ~10 (80x more efficient!)`);
  log(colors.yellow, `   • Per category: 1 API call per ~${BATCH_SIZE} questions`);
  log(colors.yellow, `   • Expected time: ~5-10 minutes for ~80 questions`);
  log(colors.yellow, `   • Can likely cover 1 full category per day with free tier\n`);

  try {
    for (const category of CATEGORIES) {
      await processCategory(category);
    }

    log(colors.green, "\n╔════════════════════════════════════════╗");
    log(colors.green, "║ ✅ All question banks updated!         ║");
    log(colors.green, "╚════════════════════════════════════════╝\n");

    log(colors.green, "Next steps:");
    log(colors.cyan, "  1. Review the questions in your code");
    log(colors.cyan, "  2. Restart your development server");
    log(colors.cyan, "  3. Test the interview - each time should show different variations\n");
    
    log(colors.yellow, "Daily Quota Management:");
    log(colors.yellow, `  • Batching ${BATCH_SIZE} questions per call = ~${Math.ceil(80 / BATCH_SIZE)} API calls for all questions`);
    log(colors.yellow, `  • Free tier limit: ~15 API calls/day, so you can do 1-2 full categories/day`);
    log(colors.yellow, `  • Spread across days: f1-student (day 1), ir-1-spouse (day 2), etc.`);
    log(colors.yellow, `  • If quota hit: script uses fallback variations and continues`);
    log(colors.yellow, `  • Re-run script later to complete remaining questions\n`);
  } catch (error) {
    log(colors.red, `\n❌ Fatal error: ${error}`);
    process.exit(1);
  }
}

// Run
main().catch(console.error);
