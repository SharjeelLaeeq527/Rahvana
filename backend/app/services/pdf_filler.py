# backend/app/services/pdf_filler.py
import re
import os
import io
import fitz
from typing import Dict
import logging

logger = logging.getLogger(__name__)

def is_complex_script(text: str) -> bool:
    """Detects if text contains Urdu, Arabic or other complex scripts that need font/alignment adjustments."""
    return bool(re.search(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]', text))

from app.core.form_configs import i130_config 
from app.core.form_configs import i864_config
from app.core.form_configs import i130a_config
from app.core.form_configs import i129f_config
from app.core.form_configs import i912_config
from app.core.form_configs import i864a_config
from app.core.form_configs import i864ez_config
from app.core.form_configs import i693_config
from app.core.form_configs import i485_config
# from app.core.form_configs import ds260_config

# Master mapping: formId → FIELD_MAPPING
FORM_CONFIGS = {
    "i130": i130_config.FIELD_MAPPING,
    "i864": i864_config.FIELD_MAPPING,
    "i130a": i130a_config.FIELD_MAPPING,
    "i129f": i129f_config.FIELD_MAPPING,
    "i912": i912_config.FIELD_MAPPING,
    "i864a": i864a_config.FIELD_MAPPING,
    "i864ez": i864ez_config.FIELD_MAPPING,
    "i693": i693_config.FIELD_MAPPING,
    "i485": i485_config.FIELD_MAPPING,
    # "ds260": ds260_config.FIELD_MAPPING,
    # "i485": i485_config.FIELD_MAPPING,
    # "i765": i765_config.FIELD_MAPPING,
}

# Auto-find PDF templates
def find_pdf_template(form_id: str) -> str:
    # form_id is already normalized (e.g., 'i130a')
    # Try with hyphen if it looks like a USCIS form
    hyphenated = form_id
    if form_id.startswith('i') and len(form_id) > 1:
        hyphenated = f"i-{form_id[1:]}"
        
    candidates = [
        f"./pdfs/{form_id}.pdf",
        f"./pdfs/{hyphenated}.pdf",
        f"./pdfs/{form_id.upper()}.pdf",
        f"./pdfs/{hyphenated.upper()}.pdf",
        f"../pdfs/{form_id}.pdf",
        f"../pdfs/{hyphenated}.pdf",
        os.path.join(os.path.dirname(__file__), "..", "..", "pdfs", f"{form_id}.pdf"),
        os.path.join(os.path.dirname(__file__), "..", "..", "pdfs", f"{hyphenated}.pdf"),
        f"C:/Users/HP/Desktop/arachnie/Arachnie/backend/pdfs/{form_id}.pdf",
        f"C:/Users/HP/Desktop/arachnie/Arachnie/backend/pdfs/{hyphenated}.pdf",
    ]
    
    for path in candidates:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            logger.info(f"Found PDF: {abs_path}")
            return abs_path
    
    raise FileNotFoundError(f"PDF not found for form: {form_id}")

class PDFFillerService:
    def __init__(self, form_id: str):
        # Normalize form_id (match frontend logic)
        self.form_id = re.sub(r'[^a-z0-9]', '', form_id.lower())
        
        if self.form_id not in FORM_CONFIGS:
            raise ValueError(f"Form '{form_id}' (normalized: '{self.form_id}') not supported. Available: {list(FORM_CONFIGS.keys())}")
        
        self.field_mapping = FORM_CONFIGS[self.form_id]
        self.pdf_path = find_pdf_template(self.form_id)

    def fill_pdf(self, form_data: Dict[str, any]) -> io.BytesIO:
        # Extract petitioner details for autofilling page 12 (Additional Info)
        petitioner_family = str(form_data.get("family_name", "")).strip()
        petitioner_given = str(form_data.get("given_name", "")).strip()
        petitioner_middle = str(form_data.get("middle_name", "")).strip()
        petitioner_alien = str(form_data.get("a_number", "")).strip()

        # Auto-propagate primary Alien Number to all header Alien Number fields i485
        primary_alien = form_data.get("p1_alien_number") or form_data.get("p1_item4_alien_number")
        if primary_alien is not None:
            primary_alien_str = str(primary_alien).strip()
            if primary_alien_str:
                for key in self.field_mapping.keys():
                    if key.endswith("_header_alien_number") or key in ("p1_alien_number", "p1_item4_alien_number"):
                        form_data[key] = primary_alien_str

        # Auto-propagate primary Names to header/last-page repeating name fields
        if self.form_id == "i485":
            family = form_data.get("p1_legal_family_name")
            given = form_data.get("p1_legal_given_name")
            middle = form_data.get("p1_legal_middle_name")
            if family:
                form_data["p14_applicant_last_name"] = family
            if given:
                form_data["p14_applicant_first_name"] = given
            if middle:
                form_data["p14_applicant_middle_name"] = middle
        elif self.form_id == "i130a":
            family = form_data.get("p1_family_name")
            given = form_data.get("p1_given_name")
            middle = form_data.get("p1_middle_name")
            if family:
                form_data["p7_header_family_name"] = family
            if given:
                form_data["p7_header_given_name"] = given
            if middle:
                form_data["p7_header_middle_name"] = middle

        doc = fitz.open(self.pdf_path)
        filled_count = 0
        unfilled = []
        
        # Extract additional info blocks if present
        additional_blocks = form_data.pop("additional_info_blocks", [])
        if isinstance(additional_blocks, str):
            import json
            try:
                additional_blocks = json.loads(additional_blocks)
            except Exception as e:
                logger.error(f"Error parsing additional_info_blocks JSON: {e}")
                additional_blocks = []


        for frontend_key, value in form_data.items():
            pdf_field_name = self.field_mapping.get(frontend_key)
            if not pdf_field_name:
                unfilled.append(frontend_key)
                continue

            str_value = str(value or "").strip()
            if not str_value:
                continue

            field_found = False
            for page in doc:
                for widget in page.widgets():
                    if widget.field_name == pdf_field_name or \
                       widget.field_name.split('.')[-1] == pdf_field_name.split('.')[-1]:
                        try:
                             if widget.field_type in (fitz.PDF_WIDGET_TYPE_CHECKBOX, fitz.PDF_WIDGET_TYPE_RADIOBUTTON):
                                val_lower = str(value).lower().strip()
                                is_checked = val_lower in ["yes", "true", "1", "on"]
                                if not is_checked:
                                    field_lower = (widget.field_name or "").lower()
                                    if val_lower == "male" and "male" in field_lower and "female" not in field_lower:
                                        is_checked = True
                                    elif val_lower == "female" and "female" in field_lower:
                                        is_checked = True
                                widget.field_value = "Yes" if is_checked else "Off"
                             else:
                                widget.field_value = str_value
                                
                                # Fix for Urdu/Arabic alignment and cutting
                                if is_complex_script(str_value):
                                    # Complex scripts (Urdu) often have larger descenders/ascenders.
                                    # Reducing font size slightly and ensuring it's not too large for the box.
                                    # We also try to set a neutral font if possible, though PDF viewers usually override this.
                                    widget.text_fontsize = 8 
                                    widget.field_text_justification = 1 # Center alignment
                                    # Set multi-line flag (1 << 12) which sometimes changes vertical alignment behavior
                                    widget.field_flags |= 4096 
                                    
                             widget.update()
                             filled_count += 1
                             field_found = True
                        except Exception as e:
                            logger.error(f"Error filling {pdf_field_name}: {e}")
            
            if not field_found:
                unfilled.append(frontend_key)

        logger.info(f"Filled {filled_count} fields for {self.form_id.upper()}")
        if unfilled:
            logger.warning(f"Unfilled keys: {unfilled[:20]}")

        # Fill additional blocks (this will duplicate Part 9 page if necessary)
        if additional_blocks:
            self._fill_additional_blocks(doc, additional_blocks)

        # Autofill petitioner/applicant name and A-number on the last page & duplicated pages for all forms
        family_val = str(form_data.get("petitioner_familyName") or form_data.get("p1_legal_family_name") or form_data.get("pt1_l6a_familyname") or form_data.get("p1_family_name") or "").strip()
        given_val = str(form_data.get("petitioner_givenName") or form_data.get("p1_legal_given_name") or form_data.get("pt1_l6b_givenname") or form_data.get("p1_given_name") or "").strip()
        middle_val = str(form_data.get("petitioner_middleName") or form_data.get("p1_legal_middle_name") or form_data.get("pt1_l6c_middlename") or form_data.get("p1_middle_name") or "").strip()
        alien_val = str(form_data.get("petitioner_alienNumber") or form_data.get("p1_alien_number") or form_data.get("pt1_l1_aliennumber") or form_data.get("p1_item4_alien_number") or "").strip()

        start_header_page = max(0, len(doc) - (len(additional_blocks) // 5 + 2))
        for page_idx in range(start_header_page, len(doc)):
            page = doc[page_idx]
            for widget in page.widgets():
                w_name = widget.field_name or ""
                if not widget.field_value:
                    if any(fn in w_name for fn in ["FamilyName", "familyname", "Family_Name"]) and family_val:
                        widget.field_value = family_val
                        widget.update()
                    elif any(gn in w_name for gn in ["GivenName", "givenname", "Given_Name"]) and given_val:
                        widget.field_value = given_val
                        widget.update()
                    elif any(mn in w_name for mn in ["MiddleName", "middlename", "Middle_Name"]) and middle_val:
                        widget.field_value = middle_val
                        widget.update()
                    elif any(an in w_name for an in ["AlienNumber", "aliennumber", "Alien_Number"]) and alien_val:
                        widget.field_value = alien_val
                        widget.update()

        output = io.BytesIO()
        doc.save(output, garbage=4, deflate=True, clean=True)
        doc.close()
        output.seek(0)
        return output

    def _fill_additional_blocks(self, doc: fitz.Document, additional_blocks: list):
        if not additional_blocks:
            return
        
        src_doc = fitz.open(self.pdf_path)
        last_page_idx = len(doc) - 1
        last_page_widgets = list(doc[last_page_idx].widgets())
        
        # USCIS standard names for Additional Info blocks usually contain 'AdditionalInfo'
        add_infos = sorted([w for w in last_page_widgets if 'AdditionalInfo' in w.field_name], key=lambda w: w.field_name)
        
        if not add_infos:
            logger.warning("No AdditionalInfo blocks found on the last page. Cannot process additional_info_blocks.")
            src_doc.close()
            return
            
        blocks_per_page = len(add_infos)
        current_page_idx = last_page_idx
        block_idx_on_page = 0
        
        for block_data in additional_blocks:
            if block_idx_on_page >= blocks_per_page:
                # Duplicate the last page from src_doc
                doc.insert_pdf(src_doc, from_page=last_page_idx, to_page=last_page_idx)
                current_page_idx = len(doc) - 1
                new_page = doc[current_page_idx]
                
                # Rename all widgets on this new page to avoid mirroring
                copy_suffix = f"_copy{current_page_idx}"
                for w in new_page.widgets():
                    if w.field_name:
                        w.field_name = f"{w.field_name}{copy_suffix}"
                        w.update()
                    
                block_idx_on_page = 0
                
            page_obj = doc[current_page_idx]
            page_widgets = list(page_obj.widgets())
            
            p_nums = sorted([w for w in page_widgets if w.field_name and 'PageNumber' in w.field_name], key=lambda x: x.field_name)
            pt_nums = sorted([w for w in page_widgets if w.field_name and 'PartNumber' in w.field_name], key=lambda x: x.field_name)
            it_nums = sorted([w for w in page_widgets if w.field_name and 'ItemNumber' in w.field_name], key=lambda x: x.field_name)
            a_infos = sorted([w for w in page_widgets if w.field_name and 'AdditionalInfo' in w.field_name], key=lambda x: x.field_name)
            
            if block_idx_on_page < len(p_nums):
                p_nums[block_idx_on_page].field_value = str(block_data.get('page_number', ''))
                p_nums[block_idx_on_page].update()
            if block_idx_on_page < len(pt_nums):
                pt_nums[block_idx_on_page].field_value = str(block_data.get('part_number', ''))
                pt_nums[block_idx_on_page].update()
            if block_idx_on_page < len(it_nums):
                it_nums[block_idx_on_page].field_value = str(block_data.get('item_number', ''))
                it_nums[block_idx_on_page].update()
            if block_idx_on_page < len(a_infos):
                a_infos[block_idx_on_page].field_value = str(block_data.get('info', ''))
                a_infos[block_idx_on_page].update()
                
            block_idx_on_page += 1
            
        src_doc.close()