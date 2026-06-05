# scratch/test_no_update.py
import fitz
import os

pdf_path = "./backend/pdfs/i130.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130.pdf"

output_path = "./scratch/test_no_update_filled.pdf"
doc = fitz.open(pdf_path)
page = doc[0]

cb = None
cb_name = None
for w in page.widgets():
    if w.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
        cb = w
        cb_name = w.field_name
        break

if cb:
    cb.field_value = "Yes"
    # No cb.update() called!
    doc.save(output_path)
doc.close()

doc2 = fitz.open(output_path)
cb2 = None
for w in doc2[0].widgets():
    if w.field_name == cb_name:
        cb2 = w
        break

print("Without update(), saved value is:", repr(cb2.field_value if cb2 else "NOT FOUND"))
doc2.close()
