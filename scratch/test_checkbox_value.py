# scratch/test_checkbox_value.py
import fitz
import os

pdf_path = "./backend/pdfs/i130.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130.pdf"

# Copy the PDF to scratch
output_path = "./scratch/test_filled.pdf"
doc = fitz.open(pdf_path)

# Let's set some checkbox values
w1 = list(doc[0].widgets())[0] # CheckBox1
w2 = list(doc[0].widgets())[1] # Pt1Line1_Spouse

print("W1 name:", w1.field_name)
print("W1 type:", w1.field_type_string)
print("W1 initial value:", repr(w1.field_value))

print("W2 name:", w2.field_name)
print("W2 type:", w2.field_type_string)
print("W2 initial value:", repr(w2.field_value))

# Test w1 (CheckBox1) with Yes, True, 'Yes', '1'
w1.field_value = "Yes"
w1.update()
w2.field_value = "Yes"
w2.update()

doc.save(output_path)
doc.close()

# Reload and check values
doc2 = fitz.open(output_path)
w1_saved = list(doc2[0].widgets())[0]
w2_saved = list(doc2[0].widgets())[1]
print("--- SAVED VALUES ---")
print("W1 saved value:", repr(w1_saved.field_value))
print("W2 saved value:", repr(w2_saved.field_value))
doc2.close()
