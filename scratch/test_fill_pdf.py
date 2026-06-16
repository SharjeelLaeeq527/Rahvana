# scratch/test_fill_pdf.py
import fitz
import os
import io

pdf_path = "./backend/pdfs/i130.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../backend/pdfs/i130.pdf"

# Mock form data sent from frontend
form_data = {
    "relationship_Spouse": "Yes",
    "relationship_Parent": "Off",
    "relationship_BrotherSister": "Off",
    "relationship_Child": "Off",
    "citizen_adoption_Yes": "Off",
    "citizen_adoption_No": "Yes",
    "sex_Male": "Yes",
    "sex_Female": "Off"
}

# The field mapping from i130_config.py
field_mapping = {
    "relationship_Spouse": "form1[0].#subform[0].Pt1Line1_Spouse[0]",
    "relationship_Parent": "form1[0].#subform[0].Pt1Line1_Parent[0]",
    "relationship_BrotherSister": "form1[0].#subform[0].Pt1Line1_Siblings[0]",
    "relationship_Child": "form1[0].#subform[0].Pt1Line1_Child[0]",
    "citizen_adoption_Yes": "form1[0].#subform[0].Pt1Line3_Yes[0]",
    "citizen_adoption_No": "form1[0].#subform[0].Pt1Line3_No[0]",
    "sex_Male": "form1[0].#subform[0].Pt1Line4_Yes[0]",
    "sex_Female": "form1[0].#subform[0].Pt1Line4_No[0]"
}

# Scenario 1: Fill without update()
doc = fitz.open(pdf_path)
for key, value in form_data.items():
    pdf_field_name = field_mapping.get(key)
    if pdf_field_name:
        for page in doc:
            for widget in page.widgets():
                if widget.field_name == pdf_field_name:
                    is_checked = str(value).lower() in ["yes", "true", "1", "on"]
                    widget.field_value = "Yes" if is_checked else "Off"
                    # NO widget.update()
doc.save("./scratch/filled_no_update.pdf")
doc.close()

# Scenario 2: Fill with update()
doc = fitz.open(pdf_path)
for key, value in form_data.items():
    pdf_field_name = field_mapping.get(key)
    if pdf_field_name:
        for page in doc:
            for widget in page.widgets():
                if widget.field_name == pdf_field_name:
                    is_checked = str(value).lower() in ["yes", "true", "1", "on"]
                    widget.field_value = "Yes" if is_checked else "Off"
                    widget.update() # WITH widget.update()
doc.save("./scratch/filled_with_update.pdf")
doc.close()

# Verify values in both saved files
print("Checking filled_no_update.pdf:")
doc_no = fitz.open("./scratch/filled_no_update.pdf")
for name in field_mapping.values():
    for w in doc_no[0].widgets():
        if w.field_name == name:
            print(f"  {name.split('.')[-1]}: {repr(w.field_value)}")
doc_no.close()

print("\nChecking filled_with_update.pdf:")
doc_with = fitz.open("./scratch/filled_with_update.pdf")
for name in field_mapping.values():
    for w in doc_with[0].widgets():
        if w.field_name == name:
            print(f"  {name.split('.')[-1]}: {repr(w.field_value)}")
doc_with.close()
