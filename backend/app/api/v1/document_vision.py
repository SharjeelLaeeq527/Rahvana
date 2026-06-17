# backend/app/api/v1/document_vision.py
#
# Vision OCR fallback endpoint. The Next.js extract routes
# (app/api/documents/extract-passport, extract-marriage) call this ONLY when the
# free English OCR (OCR.space) fails to read a document — e.g. an Urdu Nikah Nama
# or a handwritten certificate. It runs the OpenAI Agents SDK against Gemini
# Vision and returns the same canonical-field shape the text parsers produce.

import logging

from fastapi import APIRouter, File, Form, UploadFile

from app.services.document_ocr.vision_extractor import extract_fields

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/documents/vision-extract")
async def vision_extract(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
):
    """
    Extract canonical fields from a document image with the vision model.

    Form fields:
      - file: the document image (already downscaled client-side before upload)
      - doc_type: "passport" | "marriage" | "cnic" | "birth"

    Always returns 200 with:
      { "fields": {...}, "confidence": {...}, "warnings": [...],
        "source": "gemini-vision" | "none", "ok": bool }
    The caller treats ok=false as "nothing extra found" and keeps the OCR result.
    """
    image_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    logger.info(
        "[document-vision] doc_type=%s file=%s size=%d",
        doc_type,
        file.filename,
        len(image_bytes),
    )
    return await extract_fields(image_bytes, mime_type, doc_type)
