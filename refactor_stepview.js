const fs = require('fs');
const path = require('path');

const filePath = 'd:\\arachnie_work\\updated_work\\app\\(tools)\\(visa)\\visa-category\\ir-category\\[visa-journey]\\components\\v2\\StepView.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Unified ID Handling
content = content.replace(/currentStep\.id/g, 'sId');
content = content.replace(/nextStep\?\.id/g, '(nextStep?.step_key || (nextStep as any)?.id)');
content = content.replace(/prevStep\?\.id/g, '(prevStep?.step_key || (prevStep as any)?.id)');
content = content.replace(/s\.id ===/g, '(s.step_key || (s as any).id) ===');

// 2. Type/Data Schema Fallbacks
content = content.replace(/currentStep\.type ===/g, '(currentStep.step_type || (currentStep as any).type) ===');
content = content.replace(/currentStep\?\.type/g, '(currentStep?.step_key ? currentStep.step_type : (currentStep as any)?.type)');

content = content.replace(/currentStep\.toolData/g, '(currentStep.tool_data || (currentStep as any).toolData)');
content = content.replace(/currentStep\.questData/g, '(currentStep.quest_data || (currentStep as any).questData)');
content = content.replace(/currentStep\.filingData/g, '(currentStep.filing_data || (currentStep as any).filingData)');
content = content.replace(/currentStep\.documentItems/g, '(currentStep.document_items || (currentStep as any).documentItems)');

// 3. renderToolStep Destructuring
content = content.replace(
  'const { title, subtitle, chips, launchModule, supportCards } = tool;',
  'const title = tool.title || tool.step_name; const subtitle = tool.subtitle || tool.step_description; const chips = tool.chips || []; const launchModule = tool.launch_module || tool.launchModule; const supportCards = tool.support_cards || tool.supportCards;'
);

// 4. renderToolStep specialized logic for Step 6
content = content.replace('tool.id === "uscis-account-setup"', 'sId === "step_1_6"');
content = content.replace('"I-06"', '"step_1_6"');

// 5. Button label and nested props
content = content.replace(/launchModule\.buttonLabel/g, '(launchModule.button_label || launchModule.buttonLabel)');
content = content.replace(/item\.guideUrl/g, '(item.guide_url || item.guideUrl)');
content = content.replace(/tool\.relevantTools/g, '(tool.relevant_tools || tool.relevantTools)');
content = content.replace(/rt\.labelUr/g, '(rt.label_ur || rt.labelUr)');

// 6. renderFilingStep fixes
content = content.replace('const activeIdxInStage = activeStepsInStage.findIndex(', 'const activeIdxInChapter = (currentStep as any).display_order ? (currentStep as any).display_order - 1 : activeStepsInStage.findIndex(');
content = content.replace(/activeIdxInStage/g, 'activeIdxInChapter');

fs.writeFileSync(filePath, content);
console.log("Successfully refactored StepView.tsx using node script.");
