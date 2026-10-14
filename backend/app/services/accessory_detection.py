# app/services/accessory_detection.py
"""
Passport-photo accessory enforcement via the Roboflow hosted workflow.

Screens a detected face for accessories that U.S. visa/passport rules forbid,
while permitting the documented exceptions (religious headwear, hearing aids)
and subtle jewelry.

Detection runs on the Roboflow "general-segmentation-api" workflow (a trained
accessory detector), called through the lightweight inference-sdk HTTP client.
Matching is done on lower-cased name fragments so it keeps working across label
spelling variants (e.g. "sunglasses", "Sunglasses", "Tinted Lenses").

Configuration (environment variables):
  ROBOFLOW_API_KEY            required to enable enforcement (never hardcode)
  ROBOFLOW_WORKSPACE          default "hammad-alam"
  ROBOFLOW_WORKFLOW_ID        default "general-segmentation-api"
  ROBOFLOW_ACCESSORY_CLASSES  comma-separated classes to ask the workflow for
  PASSPORT_ACCESSORY_MIN_CONFIDENCE   rejection gate (default 0.5)
  PASSPORT_ACCESSORY_MIN_AREA_RATIO   ignore tiny detections (default 0.01)

Behavior when enabled but unconfigured or unreachable: we raise RuntimeError so
the route returns a clean 503 (fail-closed) rather than silently letting a
disallowed accessory through. Set PASSPORT_ACCESSORY_CHECK_ENABLED=false to skip
enforcement entirely during rollout.
"""

import base64
import io
import logging
import os
import threading

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "").strip()
ROBOFLOW_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "hammad-alam").strip()
ROBOFLOW_WORKFLOW_ID = os.getenv("ROBOFLOW_WORKFLOW_ID", "general-segmentation-api").strip()
ROBOFLOW_SERVERLESS_URL = os.getenv(
    "ROBOFLOW_SERVERLESS_URL", "https://serverless.roboflow.com"
).strip()

# The accessory classes requested from the workflow.
ACCESSORY_CLASSES = os.getenv(
    "ROBOFLOW_ACCESSORY_CLASSES",
    "hat, sunglasses, eyeglasses, Tinted Lenses, Facemask, "
    "Earbuds, Headphones, Hijab, Turban, Jewellery",
).strip()

# A detection must clear this confidence to trigger a rejection.
MIN_CONFIDENCE = float(os.getenv("PASSPORT_ACCESSORY_MIN_CONFIDENCE", "0.5"))
# Detections smaller than this fraction of the head region are ignored (noise).
MIN_AREA_RATIO = float(os.getenv("PASSPORT_ACCESSORY_MIN_AREA_RATIO", "0.01"))

# Allowed accessories take precedence and are NEVER rejected: religious
# headwear, hearing aids, subtle jewelry.
_ALLOWED_FRAGMENTS = (
    "hijab",
    "turban",
    "yarmulke",
    "kippah",
    "headscarf",
    "burkini",
    "taqiyah",
    "kufi",
    "hearingaid",
    "hearing aid",
    "hearing_aid",
    "cochlear",
    "earring",
    "necklace",
    "jewelry",
    "jewellery",
    "piercing",
    "pendant",
)

# Forbidden accessory fragments mapped to the user-facing rejection message.
# Ordered so the most specific rules (sunglasses before eyeglasses) win first.
_FORBIDDEN_RULES = (
    (
        ("sunglass", "sun_glass", "tinted", "shade"),
        "Sunglasses and tinted lenses are not allowed in passport photos. "
        "Please remove them and try again.",
    ),
    (
        ("eyeglass", "glasses", "spectacle", "eyewear"),
        "Eyeglasses are not allowed unless you have a signed doctor's note for "
        "an urgent medical reason. Please remove them or provide a photo without glasses.",
    ),
    (
        ("mask", "face covering", "facecover"),
        "Face masks or anything covering your nose or mouth are not allowed. "
        "Please remove them and try again.",
    ),
    (
        (
            "headphone",
            "earphone",
            "earbud",
            "airpod",
            "headset",
            "earpiece",
            "ear_piece",
            "bluetooth",
        ),
        "Headphones, earbuds, or other wireless devices must be removed. "
        "Please take them out and retake the photo.",
    ),
    (
        ("headband", "hair band", "hairband", "bow", "hairclip", "hair_clip", "clip"),
        "Large hair accessories that cover the hairline or change the head "
        "shape are not allowed. Please remove them and try again.",
    ),
    (
        ("hat", "cap", "beanie", "fedora", "baseball", "beret", "bonnet"),
        "Hats and casual headwear are not allowed unless worn daily for a "
        "documented religious or medical reason, and they must not shadow the face.",
    ),
)

# Shared, lazily-created Roboflow client.
_client = None
_client_lock = threading.Lock()


def _get_client():
    """Build (once) the inference-sdk HTTP client, or fail closed if unconfigured."""
    global _client

    if not ROBOFLOW_API_KEY:
        raise RuntimeError("ROBOFLOW_API_KEY is not configured.")

    if _client is not None:
        return _client

    with _client_lock:
        if _client is not None:
            return _client

        try:
            from inference_sdk import InferenceConfiguration, InferenceHTTPClient
        except ImportError as exc:
            raise RuntimeError(
                "Accessory detection requires the 'inference-sdk' package."
            ) from exc

        _client = InferenceHTTPClient(
            api_url=ROBOFLOW_SERVERLESS_URL,
            api_key=ROBOFLOW_API_KEY,
        ).configure(InferenceConfiguration(api_key_transport="header"))

    return _client


def _match_forbidden(label: str) -> "str | None":
    """Return the rejection message for a label, or None if it is allowed/unknown."""
    if any(frag in label for frag in _ALLOWED_FRAGMENTS):
        return None

    for fragments, message in _FORBIDDEN_RULES:
        if any(frag in label for frag in fragments):
            return message

    return None


def _extract_predictions(node, region_area: float) -> "list[tuple[str, float]]":
    """
    Recursively collect (class_label, area_ratio) pairs from a workflow response.

    Roboflow workflow output shapes vary by the terminal block, so we walk the
    structure and pick up any dict that carries a class/name plus a confidence,
    optionally bounding-box geometry for the area filter.
    """
    found: list[tuple[str, float]] = []

    def visit(obj):
        if isinstance(obj, dict):
            label = obj.get("class") or obj.get("name")
            conf = obj.get("confidence")

            if isinstance(label, str) and conf is not None:
                try:
                    confidence = float(conf)
                except (TypeError, ValueError):
                    confidence = 1.0

                if confidence >= MIN_CONFIDENCE:
                    area = _prediction_area(obj)
                    ratio = (area / region_area) if (area and region_area) else 1.0
                    if ratio >= MIN_AREA_RATIO:
                        found.append((label.lower(), confidence))

            for value in obj.values():
                visit(value)
        elif isinstance(obj, list):
            for value in obj:
                visit(value)

    visit(node)
    return found


def _prediction_area(obj: dict) -> "float | None":
    """Best-effort pixel area for a prediction dict, if geometry is present."""
    if all(k in obj for k in ("width", "height")):
        try:
            return float(obj["width"]) * float(obj["height"])
        except (TypeError, ValueError):
            return None

    if "bbox" in obj and isinstance(obj["bbox"], dict):
        box = obj["bbox"]
        try:
            return float(box.get("width", 0)) * float(box.get("height", 0))
        except (TypeError, ValueError):
            return None

    return None


def _head_region(rgb: np.ndarray, face_bbox: tuple[int, int, int, int]) -> "np.ndarray | None":
    """Crop the padded head region so background objects aren't misread."""
    height, width = rgb.shape[:2]
    x1, y1, x2, y2 = face_bbox

    face_w = max(1, x2 - x1)
    face_h = max(1, y2 - y1)

    rx1 = max(0, x1 - int(face_w * 0.6))
    ry1 = max(0, y1 - int(face_h * 1.0))
    rx2 = min(width, x2 + int(face_w * 0.6))
    ry2 = min(height, y2 + int(face_h * 0.4))

    if rx2 - rx1 < 16 or ry2 - ry1 < 16:
        return None

    return rgb[ry1:ry2, rx1:rx2]


def detect_forbidden_accessories(
    rgb: np.ndarray, face_bbox: tuple[int, int, int, int]
) -> "str | None":
    """
    Screen the portrait for forbidden accessories using the Roboflow workflow.

    Returns a user-friendly rejection message when a disallowed accessory is
    detected, or None when the photo passes.
    """
    client = _get_client()

    crop = _head_region(rgb, face_bbox)
    if crop is None:
        return None

    buffer = io.BytesIO()
    Image.fromarray(crop).save(buffer, format="JPEG", quality=92)
    image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    region_area = float(crop.shape[0] * crop.shape[1])

    try:
        results = client.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={"image": image_b64},
            parameters={"classes": ACCESSORY_CLASSES},
            use_cache=True,
        )
    except Exception as exc:
        # Fail closed so a transient outage/credentials issue surfaces as a 503
        # instead of silently passing a disallowed photo.
        logger.warning("Roboflow accessory workflow call failed: %s", exc)
        raise RuntimeError("Accessory detection service is unavailable.") from exc

    for label, _confidence in _extract_predictions(results, region_area):
        message = _match_forbidden(label)
        if message:
            logger.info("Forbidden accessory detected: %s", label)
            return message

    return None
