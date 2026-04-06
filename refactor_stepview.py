import os
import re

file_path = r'd:\arachnie_work\updated_work\app\(tools)\(visa)\visa-category\ir-category\[visa-journey]\components\v2\StepView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update id checks to use sId or step_key fallbacks
content = content.replace('currentStep?.id', 'sId')
content = content.replace('currentStep.id', 'sId')
content = content.replace('nextStep?.id', '(nextStep?.step_key || (nextStep as any)?.id)')
content = content.replace('prevStep?.id', '(prevStep?.step_key || (prevStep as any)?.id)')
content = content.replace('s.id', '(s.step_key || (s as any).id)')

# 2. Update type checks
content = content.replace('currentStep.type ===', '(currentStep.step_type || (currentStep as any).type) ===')
content = content.replace('currentStep?.type', '(currentStep?.step_key ? currentStep.step_type : (currentStep as any)?.type)')

# 3. Update data objects
content = content.replace('currentStep.toolData', '(currentStep.tool_data || (currentStep as any).toolData)')
content = content.replace('currentStep.questData', '(currentStep.quest_data || (currentStep as any).questData)')
content = content.replace('currentStep.filingData', '(currentStep.filing_data || (currentStep as any).filingData)')
content = content.replace('currentStep.documentItems', '(currentStep.document_items || (currentStep as any).documentItems)')

# 4. Step 1.3 filing logic (compare online vs paper)
content = content.replace('filingData.methods', '(filingData.methods || filing_data.methods)')
content = content.replace('filingData.quiz', '(filingData.quiz || filing_data.quiz)')

# 5. Inner property names in JSX/Logic
content = content.replace('launchModule', '(tool.launch_module || tool.launchModule)')
content = content.replace('supportCards', '(tool.support_cards || tool.supportCards)')
content = content.replace('buttonLabel', '(launchModule.button_label || launchModule.buttonLabel)')
content = content.replace('item.guideUrl', '(item.guide_url || item.guideUrl)')
content = content.replace('tool.relevantTools', '(tool.relevant_tools || tool.relevantTools)')
content = content.replace('rt.labelUr', '(rt.label_ur || rt.labelUr)')

# 6. Specific hardcoded step ID logic (like I-06/step_1_6)
content = content.replace('"I-06"', '"step_1_6"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully refactored StepView.tsx with improved schema-agnostic logic.")
