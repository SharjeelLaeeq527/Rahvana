# scratch/inspect_all_widgets.py
import fitz
import os

pdf_path = "./backend/pdfs/i130.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130.pdf"

doc = fitz.open(pdf_path)
page = doc[0]
widgets = list(page.widgets())

print(f"Total widgets on page 1: {len(widgets)}")
for i, w in enumerate(widgets):
    print(f"[{i:03d}] Name: {w.field_name}")
    print(f"      Type: {w.field_type_string} ({w.field_type})")
    print(f"      Value: {repr(w.field_value)}")

doc.close()
