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
            "passportExpiry",
            "passportCountry",
        ],
        "date_keys": ["dateOfBirth", "passportExpiry"],
        "instructions": (
            "You are a meticulous passport reader. You are given the biographic "
            "(photo) page of a passport, which may be of any nationality and may be "
            "a photo or scan. Read the holder's details exactly as printed. Use full "
            "country names for nationality and the issuing country. Report sex as "
            "exactly 'Male' or 'Female'. Do not invent values you cannot see."
        ),
    },
    "marriage": {
        "keys": [
            "relationship.marriageDate",
            "relationship.marriagePlace.city",
            "relationship.marriagePlace.country",
        ],
        "date_keys": ["relationship.marriageDate"],
        "instructions": (
            "You are a meticulous reader of Pakistani marriage documents — either a "
            "NADRA Marriage Registration Certificate (MRC) or a Nikah Nama. The text "
            "may be in Urdu, English, or both, and may be handwritten. Your job is to "
            "find the DATE OF MARRIAGE (the nikah / wedding date). Do NOT return the "
            "registration date, issue date, print date, or any person's date of "
            "birth — only the date the marriage took place. Also read the city of "
            "marriage if present. Convert any date you find to the Gregorian calendar."
        ),
    },
    "cnic": {
        "keys": [
            "name.first",
            "name.last",
            "dateOfBirth",
            "cnic",
        ],
        "date_keys": ["dateOfBirth"],
        "instructions": (
            "You are a meticulous reader of the Pakistani CNIC (Computerized National "
            "Identity Card). The card is bilingual (Urdu and English) and may be a "
            "photo or scan. Read the CARD HOLDER's own name (given name into "
            "name.first, family/last name into name.last) — NOT the father's or "
            "husband's name. Read the holder's DATE OF BIRTH only — never the date of "
            "issue or date of expiry. Read the 13-digit Identity Number and format it "
            "exactly as 00000-0000000-0 for the 'cnic' key. Convert the date of birth "
            "to the Gregorian calendar."
        ),
    },
    "birth": {
        "keys": [
            "name.first",
            "name.last",
            "dateOfBirth",
            "placeOfBirth.city",
            "placeOfBirth.country",
            "father.name.first",
            "father.name.last",
            "mother.name.first",
            "mother.name.last",
        ],
        "date_keys": ["dateOfBirth"],
        "instructions": (
            "You are a meticulous reader of birth certificates — typically a NADRA "
            "Computerized Birth Certificate or a 'Form-B' (Child Registration "
            "Certificate) from Pakistan. The text may be in Urdu, English, or both, "
            "and may be handwritten. Read the CHILD's own name into name.first "
            "(given) and name.last (family). Read the DATE OF BIRTH only — never the "
            "registration, issue, or print date. Read the place of birth city and "
            "country if present. ALSO read the parents: put the father's given name "
            "in father.name.first and his family name in father.name.last, and the "
            "mother's given name in mother.name.first and her family name in "
            "mother.name.last. Convert the date of birth to the Gregorian calendar."
        ),
    },
}


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
