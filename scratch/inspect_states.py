# scratch/inspect_states.py
import fitz
import os

pdf_path = "./backend/pdfs/i130.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130.pdf"

doc = fitz.open(pdf_path)
page = doc[0]
widgets = list(page.widgets())

checkbox_count = 0
for w in widgets:
    if w.field_type in (fitz.PDF_WIDGET_TYPE_CHECKBOX, fitz.PDF_WIDGET_TYPE_RADIOBUTTON):
        checkbox_count += 1
        print(f"Widget {checkbox_count}: {w.field_name}")
        print(f"  Type: {w.field_type_string}")
        print(f"  Value: {repr(w.field_value)}")
        # Check standard properties
        print(f"  Rect: {w.rect}")
        # Try to print choice_values or choice properties if they exist
        try:
            print(f"  Choice values: {w.choice_values}")
        except AttributeError:
            pass
        if checkbox_count >= 10:
            break

doc.close()
