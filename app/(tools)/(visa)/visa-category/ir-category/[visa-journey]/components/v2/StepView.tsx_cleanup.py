import sys

file_path = r'c:\Users\HP\Desktop\arachnie\Arachnie\app\(tools)\(visa)\visa-category\ir-category\[visa-journey]\components\v2\StepView.tsx'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Lines are 1-indexed in view_file.
    # To delete 1243 to 2526:
    start_delete = 1243 - 1
    end_delete = 2526 - 1

    new_lines = lines[:start_delete] + lines[end_delete + 1:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print(f"Successfully deleted lines 1243 to 2526. Total lines now: {len(new_lines)}")
except Exception as e:
    print(f"Error: {e}")
