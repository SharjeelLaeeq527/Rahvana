# backend/app/api/v1/pdf_routes.py
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any

import fitz
import io

from app.services.pdf_filler import PDFFillerService
from app.services.ds260_generator import DS260GeneratorService
from app.services.police_letter_generator import PoliceLetterGeneratorService
from app.services.authority_letter_generator import AuthorityLetterGeneratorService

router = APIRouter()

class FillRequest(BaseModel):
    formId: str
    data: Dict[str, Any]
    onlyFirstPage: bool = False

@router.post("/fill-pdf")
async def fill_pdf(request: FillRequest):
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
