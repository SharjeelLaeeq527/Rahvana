import json
import os

file_path = r'd:\arachnie_work\updated_work\data\visa-category\ir-1.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Rename stages to chapters
if 'stages' in data:
    data['chapters'] = data.pop('stages')

# 2. Update top-level chapter keys and step keys for Chapter 1
if 'chapters' in data and len(data['chapters']) > 0:
    for cIdx, chapter in enumerate(data['chapters']):
        chapter['chapter_key'] = f'chapter_{cIdx+1}'
        chapter['chapter_name'] = chapter.pop('name', chapter.get('chapter_name', ''))
        chapter['chapter_description'] = chapter.pop('description', chapter.get('chapter_description', ''))
        chapter['chapter_number'] = chapter.pop('order', chapter.get('chapter_number', cIdx + 1))
        
        # Map steps for the whole roadmap to ensure consistency
        # We use snake_case for everything
        for i, step in enumerate(chapter['steps']):
            old_id = step.get('id')
            # If it's a legacy ID (integer or "I-01" etc), map it
            if old_id and old_id.startswith('I-'):
                step['step_key'] = f'step_{cIdx+1}_{int(old_id.split("-")[1])}'
            elif old_id and not step.get('step_key'):
                step['step_key'] = f'step_{cIdx+1}_{i+1}'
            
            # Already renamed in previous failed edits?
            if not step.get('step_key') and step.get('id'):
                step['step_key'] = step.get('id')

            # Standardize names/descriptions
            if 'name' in step: step['step_name'] = step.pop('name')
            if 'description' in step: step['step_description'] = step.pop('description')
            if 'type' in step: step['step_type'] = step.pop('type')
            
            # Common snake_case refactor
            nested_renames = {
                'toolData': 'tool_data',
                'questData': 'quest_data',
                'filingData': 'filing_data',
                'documentItems': 'document_items',
                'relevantTools': 'relevant_tools'
            }
            for old, new in nested_renames.items():
                if old in step:
                    step[new] = step.pop(old)
            
            # Nested fields
            if 'tool_data' in step:
                td = step['tool_data']
                if 'launchModule' in td: td['launch_module'] = td.pop('launchModule')
                if 'supportCards' in td: td['support_cards'] = td.pop('supportCards')
                lm = td.get('launch_module', {})
                if 'buttonLabel' in lm: lm['button_label'] = lm.pop('buttonLabel')
            
            if 'quest_data' in step:
                qd = step['quest_data']
                if 'resultLogic' in qd: qd['result_logic'] = qd.pop('resultLogic')
            
            if 'document_items' in step:
                for item in step['document_items']:
                    if 'guideUrl' in item: item['guide_url'] = item.pop('guideUrl')
            
            if 'relevant_tools' in step:
                for rt in step['relevant_tools']:
                    if 'labelUr' in rt: rt['label_ur'] = rt.pop('labelUr')
            
            # Add backend required fields
            if 'dependencies' not in step: step['dependencies'] = []
            if 'visible_when' not in step: step['visible_when'] = {}
            if 'estimated_duration_days' not in step: step['estimated_duration_days'] = 1
            if 'is_required' not in step: step['is_required'] = True
            if 'display_order' not in step: step['display_order'] = i + 1

# Save back
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Successfully refactored ir-1.json to snake_case and Chapters/Step Keys.")
