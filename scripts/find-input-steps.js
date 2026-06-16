const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'visa-category', 'ir-1.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

console.log(`Journey: ${data.journey_name}`);
console.log(`Total Chapters: ${data.chapters.length}\n`);

data.chapters.forEach(ch => {
  console.log(`=== Chapter ${ch.chapter_number}: ${ch.chapter_name} ===`);
  ch.steps.forEach(step => {
    const keys = Object.keys(step);
    const hasQuest = !!step.quest_data;
    const hasFiling = !!step.filing_data;
    const hasTool = !!step.tool_data;
    
    // Check if there are other keys that might hold data inputs
    const ignoreKeys = ['step_key', 'step_number', 'step_name', 'step_short_description', 'step_description', 'step_type', 'who', 'where', 'dependencies', 'visible_when', 'estimated_duration_days', 'is_required', 'display_order', 'actions', 'notes', 'relevant_tools', 'risk_signals', 'output', 'official_source', 'timeline', 'branch', 'pakistanSpecific', 'relevantTools'];
    const extraKeys = keys.filter(k => !ignoreKeys.includes(k));

    console.log(`  Step ${step.step_key} (${step.step_name}) - Type: ${step.step_type}`);
    if (hasQuest) console.log(`    [Quest] id: ${step.quest_data.id}, title: ${step.quest_data.title}`);
    if (hasFiling) console.log(`    [Filing] id: ${step.filing_data.id}`);
    if (hasTool) console.log(`    [Tool] id: ${step.tool_data.id || step.tool_data.title}, wallet_integration: ${JSON.stringify(step.tool_data.wallet_integration)}`);
    if (extraKeys.length > 0) {
      console.log(`    [Extra Keys]: ${extraKeys.join(', ')}`);
      extraKeys.forEach(k => {
        console.log(`      -> ${k}: ${JSON.stringify(step[k]).substring(0, 150)}`);
      });
    }
  });
  console.log('\n');
});
