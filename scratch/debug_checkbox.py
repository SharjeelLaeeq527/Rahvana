# scratch/debug_checkbox.py
import fitz
import os

pdf_path = "./backend/pdfs/i130a.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130a.pdf"

print("Opening:", os.path.abspath(pdf_path))
doc = fitz.open(pdf_path)

# Let's inspect the first few widgets on page 1
print("Inspecting first page widgets:")
page = doc[0]
widgets = list(page.widgets())
checkbox_count = 0
for w in widgets:
    if w.field_type in (fitz.PDF_WIDGET_TYPE_CHECKBOX, fitz.PDF_WIDGET_TYPE_RADIOBUTTON):
        checkbox_count += 1
        print(f"Widget {checkbox_count}:")
        print(f"  Name: {w.field_name}")
        print(f"  Type: {w.field_type_string} ({w.field_type})")
        print(f"  Value: {w.field_value}")
        # Test modifying the value
        original_val = w.field_value
        try:
            w.field_value = "Yes"
            w.update()
            print(f"  Set to 'Yes', new value: {w.field_value}")
            w.field_value = original_val
            w.update()
        except Exception as e:
            print(f"  Error setting value: {e}")
        if checkbox_count >= 5:
            break

doc.close()
