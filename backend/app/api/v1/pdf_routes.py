# backend/app/api/v1/pdf_routes.py
from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional

import fitz
import hmac
import io
import logging
import os

from app.services.pdf_filler import PDFFillerService
from app.services.ds260_generator import DS260GeneratorService
from app.services.police_letter_generator import PoliceLetterGeneratorService
from app.services.authority_letter_generator import AuthorityLetterGeneratorService

router = APIRouter()
logger = logging.getLogger(__name__)

# Letters the public police-verification guides generate; not plan-gated.
PUBLIC_LETTER_FORMS = {"police_verification", "authority_letter"}


def _full_fill_allowed(form_id: str, only_first_page: bool, token: Optional[str]) -> bool:
    """A full USCIS form fill is a paid Smart Form Filler result. Only the
    Next.js route /api/visa-forms/{formCode}/pdf may ask for it, after checking
    the user's entitlement; it proves that with PDF_FILL_INTERNAL_TOKEN.
    Page-1 previews and the public letters stay open. Until the token is set in
    the environment the check is skipped (logged) so a deploy cannot break PDFs."""
    if only_first_page or form_id.lower() in PUBLIC_LETTER_FORMS:
        return True
    expected = os.getenv("PDF_FILL_INTERNAL_TOKEN")
    if not expected:
        logger.warning("PDF_FILL_INTERNAL_TOKEN is not set: full PDF fills are not gated")
        return True
    return bool(token) and hmac.compare_digest(token, expected)

class FillRequest(BaseModel):
    formId: str
    data: Dict[str, Any]
    onlyFirstPage: bool = False

@router.post("/fill-pdf")
async def fill_pdf(request: FillRequest, x_internal_token: Optional[str] = Header(default=None)):
    if not _full_fill_allowed(request.formId, request.onlyFirstPage, x_internal_token):
        raise HTTPException(status_code=403, detail="Full PDF requires Smart Form Filler access.")
    try:
        if request.formId.lower() == "ds260":
             generator = DS260GeneratorService()
             output = generator.generate_pdf(form_data=request.data)
        elif request.formId.lower() == "police_verification":
             generator = PoliceLetterGeneratorService()
             province = request.data.get('province', '')
             output = generator.generate_pdf(form_data=request.data, province=province)
        elif request.formId.lower() == "authority_letter":
             generator = AuthorityLetterGeneratorService()
             output = generator.generate_pdf(form_data=request.data)
        else:
             pdf_service = PDFFillerService(form_id=request.formId)
             output = pdf_service.fill_pdf(form_data=request.data)
        
        # If requested, slice only the first page
        if request.onlyFirstPage:
            pdf_bytes = output.getvalue()
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if len(doc) > 0:
                doc.select([0])
                new_output = io.BytesIO()
                doc.save(new_output, garbage=4, deflate=True, clean=True)
                new_output.seek(0)
                output = new_output
            doc.close()

        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={request.formId}_filled.pdf"}
        )
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

@router.get("/debug-pdf-fields/{form_id}")
async def debug_pdf_fields(form_id: str):
    try:
        pdf_service = PDFFillerService(form_id=form_id)
        doc = fitz.open(pdf_service.pdf_path)
        fields = [
            {
                "page": page_num + 1,
                "name": w.field_name,
                "type": w.field_type_string,
                "value": w.field_value,
                "rect": list(w.rect),
            }
            for page_num, page in enumerate(doc)
            for w in page.widgets()
        ]
        doc.close()

        return {
            "form_id": form_id,
            "pdf_path": pdf_service.pdf_path,
            "total_pdf_fields": len(fields),
            "mapped_in_config": len(pdf_service.field_mapping),
              "fields": fields,
        }
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
