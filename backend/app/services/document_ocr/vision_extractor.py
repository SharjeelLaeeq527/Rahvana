# backend/app/services/document_ocr/vision_extractor.py
#
# Gemini Vision fallback for document OCR, built on the OpenAI Agents SDK.
#
# The free English OCR (OCR.space) used by the Next.js extract routes only reads
# the Latin/English side of a document, so it returns nothing useful for an Urdu
# Nikah Nama or a handwritten certificate. When that happens, the Next.js route
# calls the /documents/vision-extract endpoint, which runs THIS extractor: it
# sends the image straight to a vision model and asks for the same canonical
# fields the text parsers produce.
#
# We reuse the project's established setup (see whatsapp_assistant/main.py): the
# OpenAI Agents SDK driving Gemini through its OpenAI-compatible endpoint via
# OpenAIChatCompletionsModel + the GEMINI_API_KEY. No OpenAI key is needed.
#
# Output keys are MasterProfile dot-paths (types/profile.ts) so the values flow
# through the rest of the pipeline (profile merge → autofill → journey widgets)
# exactly like the OCR.space path.

import base64
import json
import logging
import os
import re
from datetime import datetime

from agents import (
    Agent,
    AsyncOpenAI,
    ModelSettings,
    OpenAIChatCompletionsModel,
    Runner,
    set_tracing_disabled,
)

logger = logging.getLogger(__name__)

# config.py exposes GEMINI_KEY; whatsapp_assistant reads GEMINI_API_KEY. Accept
# either so this works regardless of which name the deployment set.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_KEY")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
MODEL_NAME = "gemini-2.5-flash"  # multimodal; same family as the WhatsApp agent

set_tracing_disabled(disabled=True)

# Build the shared model once at import. Guard on the key so a missing env var
# degrades gracefully (extractor returns ok=False) instead of crashing the app.
_model = None
if GEMINI_API_KEY:
    _provider = AsyncOpenAI(api_key=GEMINI_API_KEY, base_url=GEMINI_BASE_URL)
    _model = OpenAIChatCompletionsModel(model=MODEL_NAME, openai_client=_provider)
else:
    logger.warning("[vision_extractor] GEMINI_API_KEY/GEMINI_KEY not set — vision fallback disabled")


# Per-document field specs. `keys` are the exact JSON keys (MasterProfile
# dot-paths) we ask the model to return; `date_keys` must be strict YYYY-MM-DD.
SPECS = {
    "passport": {
        "keys": [
            "name.first",
            "name.last",
            "dateOfBirth",
            "sex",
            "nationality",
            "passportNumber",
            "passportIssueDate",
            "passportPlaceOfIssue",
            "passportBookNumber",
            "passportExpiry",
            "passportCountry",
        ],
        "date_keys": ["dateOfBirth", "passportIssueDate", "passportExpiry"],
        "instructions": (
            "You are a meticulous passport reader. You are given the biographic "
            "(photo) page of a passport, which may be of any nationality and may be "
            "a photo or scan. Read the holder's details exactly as printed. Use full "
            "country names for nationality (passportCountry = the issuing country). "
            "Report sex as exactly 'Male' or 'Female'. Also read, when printed on the "
            "page: passportIssueDate (date of issue), passportPlaceOfIssue (the issuing "
            "authority / place of issue), and passportBookNumber (the passport booklet "
            "number, separate from the main passport number, on some passports). Do not "
            "invent values you cannot see; omit any field that is not printed."
        ),
    },
    "marriage": {
        "keys": [
            "relationship.marriageDate",
            "relationship.dateOfRegistration",
            "relationship.marriagePlace.city",
            "relationship.marriagePlace.state",
            "relationship.marriagePlace.country",
            "relationship.marriageRegistrationNumber",
            "relationship.husbandName",
            "relationship.husbandFatherName",
            "relationship.wifeName",
            "relationship.wifeFatherName",
        ],
        "date_keys": ["relationship.marriageDate", "relationship.dateOfRegistration"],
        "instructions": (
            "You are a meticulous reader of Pakistani marriage documents — either a "
            "NADRA Marriage Registration Certificate (MRC, often 'Form RS-2') or a "
            "Nikah Nama. The text may be in Urdu, English, or both, and may be "
            "handwritten. Read these fields exactly as printed:\n"
            "- relationship.marriageDate: the DATE OF MARRIAGE (the nikah / wedding "
            "date). This is NOT the registration date, issue date, or print date, and "
            "NOT anyone's date of birth.\n"
            "- relationship.dateOfRegistration: the date the marriage was REGISTERED "
            "(labelled 'Date of Registration'), if shown separately.\n"
            "- relationship.marriagePlace.city / .state / .country: the place where the "
            "marriage took place (city, then province/state, then country).\n"
            "- relationship.marriageRegistrationNumber: the Registration No / MRC No / "
            "Certificate No — a code containing digits (e.g. '22102-9876543-2'). NEVER "
            "return a plain word like 'GOVERNMENT' or a heading; it must contain digits.\n"
            "- relationship.husbandName: the full name of the husband / bridegroom.\n"
            "- relationship.husbandFatherName: the husband's father's name.\n"
            "- relationship.wifeName: the full name of the wife / bride.\n"
            "- relationship.wifeFatherName: the wife's father's name.\n"
            "Do NOT read the WITNESSES, the CNIC / ID-card numbers, or the addresses. "
            "Convert every date to the Gregorian calendar in YYYY-MM-DD format."
        ),
    },
    "cnic": {
        "keys": [
            "name.first",
            "name.last",
            "nativeFullName",
            "dateOfBirth",
            "cnic",
        ],
        "date_keys": ["dateOfBirth"],
        "instructions": (
            "You are a meticulous reader of the Pakistani CNIC (Computerized National "
            "Identity Card). The card is bilingual (Urdu and English) and may be a "
            "photo or scan. Read the CARD HOLDER's own name (given name into "
            "name.first, family/last name into name.last) — NOT the father's or "
            "husband's name. ALSO read the holder's FULL NAME written in URDU script "
            "(the native alphabet) into nativeFullName, exactly as printed in Urdu. "
            "Read the holder's DATE OF BIRTH only — never the date of issue or date of "
            "expiry. Read the 13-digit Identity Number and format it exactly as "
            "00000-0000000-0 for the 'cnic' key. Convert the date of birth to the "
            "Gregorian calendar."
        ),
    },
    "birth": {
        "keys": [
            "name.first",
            "name.last",
            "dateOfBirth",
            "placeOfBirth.city",
            "placeOfBirth.state",
            "placeOfBirth.country",
            "father.name.first",
            "father.name.last",
            "father.dateOfBirth",
            "mother.name.first",
            "mother.name.last",
            "mother.dateOfBirth",
        ],
        "date_keys": ["dateOfBirth", "father.dateOfBirth", "mother.dateOfBirth"],
        "instructions": (
            "You are a meticulous reader of birth certificates — typically a NADRA "
            "Computerized Birth Certificate or a 'Form-B' (Child Registration "
            "Certificate) from Pakistan. The text may be in Urdu, English, or both, "
            "and may be handwritten. Read the CHILD's own name into name.first "
            "(given) and name.last (family). Read the child's DATE OF BIRTH into "
            "dateOfBirth — never the registration, issue, or print date. Read the place "
            "of birth: city into placeOfBirth.city, the province/state into "
            "placeOfBirth.state, and country into placeOfBirth.country, when present. "
            "ALSO read the parents: the father's given name into father.name.first and "
            "family name into father.name.last, and the mother's given name into "
            "mother.name.first and family name into mother.name.last. If the parents' "
            "own dates of birth are printed, read them into father.dateOfBirth and "
            "mother.dateOfBirth (do NOT confuse them with the child's date of birth). "
            "Convert every date to the Gregorian calendar in YYYY-MM-DD format."
        ),
    },
    "divorce": {
        "keys": [
            "relationship.priorMarriage.spouseName",
            "relationship.priorMarriage.dateMarriageEnded",
            "relationship.priorMarriage.howEnded",
            "relationship.priorMarriage.country",
        ],
        "date_keys": ["relationship.priorMarriage.dateMarriageEnded"],
        "instructions": (
            "You are a meticulous reader of documents that prove a PRIOR marriage "
            "ended — either a divorce certificate / decree / Talaq registration, or a "
            "death certificate of a former spouse. The text may be in Urdu, English, "
            "or both, and may be handwritten. Read these fields:\n"
            "- relationship.priorMarriage.spouseName: the FORMER spouse's full name "
            "(the ex-husband / ex-wife, or the deceased spouse).\n"
            "- relationship.priorMarriage.dateMarriageEnded: the date the marriage "
            "ended — the date the divorce / Talaq became effective, or the date of "
            "death. NOT the original marriage date.\n"
            "- relationship.priorMarriage.howEnded: return EXACTLY 'divorce' if the "
            "document is a divorce / Talaq / dissolution, or EXACTLY 'death' if it is "
            "a death certificate.\n"
            "- relationship.priorMarriage.country: the country where it took place.\n"
            "Do NOT read witnesses or ID-card numbers. Convert every date to the "
            "Gregorian calendar in YYYY-MM-DD format."
        ),
    },
}


def _prepare_image(data: bytes, mime_type: str) -> tuple[bytes, str]:
    """
    Normalise the upload into something the vision model can read directly:
      - a PDF (any size) → render its FIRST page to a PNG;
      - a very large image → downscale so the request stays fast and within limits;
      - anything else → returned unchanged.
    The Next.js routes send PDFs and large files straight here (they bypass the free
    OCR.space text engine, which only takes images < 1 MB), so this is where they get
    turned into a clean image for Gemini.
    """
    is_pdf = (mime_type or "").lower() == "application/pdf" or data[:5] == b"%PDF-"
    if is_pdf:
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(stream=data, filetype="pdf")
            page = doc.load_page(0)  # the identity page is essentially always page 1
            pix = page.get_pixmap(matrix=fitz.Matrix(200 / 72, 200 / 72))  # ~200 DPI
            png = pix.tobytes("png")
            doc.close()
            logger.info("[vision_extractor] rendered PDF page 1 → PNG (%d bytes)", len(png))
            return png, "image/png"
        except Exception:
            logger.exception("[vision_extractor] PDF render failed; sending raw bytes")
            return data, mime_type

    # Large image → downscale (Gemini handles big images but it is slower and can hit
    # request limits; 2000px max keeps document text legible while shrinking the file).
    if len(data) > 4 * 1024 * 1024:
        try:
            import io

            from PIL import Image

            img = Image.open(io.BytesIO(data)).convert("RGB")
            img.thumbnail((2000, 2000))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            logger.info(
                "[vision_extractor] downscaled large image %d → %d bytes",
                len(data),
                buf.tell(),
            )
            return buf.getvalue(), "image/jpeg"
        except Exception:
            logger.exception("[vision_extractor] image downscale failed; sending raw bytes")

    return data, mime_type


def _is_iso_date(value: str) -> bool:
    """True only for a strict YYYY-MM-DD string that is a real calendar date."""
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def _safe_json(text: str):
    """Tolerant JSON parse — strips ```json fences / prose the model may add."""
    text = (text or "").strip()
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except Exception:
            return None


async def extract_fields(image_bytes: bytes, mime_type: str, doc_type: str) -> dict:
    """
    Extract canonical fields from a document image with the vision model.

    Always returns a dict (never raises):
      { "fields": {...}, "confidence": {...}, "warnings": [...],
        "source": "gemini-vision" | "none", "ok": bool }
    """
    result = {"fields": {}, "confidence": {}, "warnings": [], "source": "none", "ok": False}

    spec = SPECS.get(doc_type)
    if spec is None:
        result["warnings"].append(f"Unsupported document type: {doc_type}")
        return result

    if _model is None:
        result["warnings"].append("Vision fallback is not configured on the server.")
        return result

    # Turn PDFs / oversized images into a clean image the model can read.
    image_bytes, mime_type = _prepare_image(image_bytes, mime_type)

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type or 'image/jpeg'};base64,{b64}"

    keys_list = ", ".join(f'"{k}"' for k in spec["keys"])
    prompt = (
        "Read the attached document image and extract the requested fields.\n"
        f"Return ONLY a JSON object using exactly these keys: {keys_list}.\n"
        "Omit any key you cannot read confidently — never guess or invent a value.\n"
        "Read every digit of each date carefully and double-check the year, month, "
        "and day against the image before answering — do not approximate a year.\n"
        "Every date MUST be the Gregorian date in strict YYYY-MM-DD format."
    )

    agent = Agent(
        name="Document Vision Extractor",
        instructions=spec["instructions"],
        model=_model,
        model_settings=ModelSettings(temperature=0.0),
    )

    try:
        run = await Runner.run(
            starting_agent=agent,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": data_url, "detail": "high"},
                    ],
                }
            ],
        )
    except Exception:
        logger.exception("[vision_extractor] Gemini vision call failed")
        result["warnings"].append("Vision extraction failed.")
        return result

    raw = (run.final_output if hasattr(run, "final_output") and run.final_output else str(run)).strip()
    parsed = _safe_json(raw)
    if not isinstance(parsed, dict):
        result["warnings"].append("Vision model returned an unreadable response.")
        return result

    for key in spec["keys"]:
        value = parsed.get(key)
        if not isinstance(value, str):
            continue
        value = value.strip()
        if not value:
            continue
        if key in spec["date_keys"] and not _is_iso_date(value):
            # Model was asked for YYYY-MM-DD; skip a malformed date rather than
            # push garbage into the forms.
            result["warnings"].append(f"Could not read a clean date for {key}.")
            continue
        result["fields"][key] = value
        result["confidence"][key] = 0.7  # AI read, not a structured MRZ → mid confidence

    if result["fields"]:
        result["ok"] = True
        result["source"] = "gemini-vision"

    return result
