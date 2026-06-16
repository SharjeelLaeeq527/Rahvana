# scratch/test_states_fixed.py
import fitz
import os

pdf_path = "./backend/pdfs/i130.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130.pdf"

def test_value(val):
    output_path = f"./scratch/test_val_{val}.pdf"
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    cb_name = None
    cb = None
    for w in page.widgets():
        if w.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
            cb = w
            cb_name = w.field_name
            break
            
    if cb:
        cb.field_value = val
        cb.update()
        doc.save(output_path)
    doc.close()
    
    doc2 = fitz.open(output_path)
    cb2 = None
    for w in doc2[0].widgets():
        if w.field_name == cb_name:
            cb2 = w
            break
            
    res = cb2.field_value if cb2 else "NOT FOUND"
    doc2.close()
    return res

print("Setting to 'Yes' saves as:", repr(test_value("Yes")))
print("Setting to '1' saves as:", repr(test_value("1")))
print("Setting to True saves as:", repr(test_value(True)))
print("Setting to 'Off' saves as:", repr(test_value("Off")))
print("Setting to False saves as:", repr(test_value(False)))
print("Setting to 'On' saves as:", repr(test_value("On")))
