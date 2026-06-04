# scratch/test_checkbox_alive.py
import fitz
import os

pdf_path = "./backend/pdfs/i130.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130.pdf"

output_path = "./scratch/test_filled.pdf"
doc = fitz.open(pdf_path)
page = doc[0] # Keep page alive
widgets = list(page.widgets())

# Find the first checkbox
cb = None
for w in widgets:
    if w.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
        cb = w
        break

if cb:
    print("Found checkbox:", cb.field_name)
    print("Original value:", repr(cb.field_value))
    cb.field_value = "Yes"
    cb.update()
    print("After update, value in memory:", repr(cb.field_value))
else:
    print("No checkbox found on page 1")

doc.save(output_path)
doc.close()

# Reload and check
doc2 = fitz.open(output_path)
page2 = doc2[0]
cb2 = None
for w in page2.widgets():
    if w.field_name == cb.field_name:
        cb2 = w
        break

print("--- RELOADED ---")
if cb2:
    print("Saved value:", repr(cb2.field_value))
else:
    print("Saved checkbox not found")
doc2.close()
