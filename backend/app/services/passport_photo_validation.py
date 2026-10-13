
# app/services/passport_photo_validation.py
import io
import os
import threading
import warnings
from dataclasses import dataclass
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app.services.accessory_detection import detect_forbidden_accessories


# Configuration
BACKEND_ROOT = Path(__file__).resolve().parents[2]

_configured_model_path = Path(
    os.getenv(
        "MEDIAPIPE_FACE_MODEL_PATH",
        str(BACKEND_ROOT / "models" / "blaze_face_full_range_sparse.tflite"),
    )
).expanduser()

MODEL_PATH = (
    _configured_model_path
    if _configured_model_path.is_absolute()
    else BACKEND_ROOT / _configured_model_path
)

MAX_UPLOAD_BYTES = int(
    os.getenv("PASSPORT_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))
)
MAX_IMAGE_PIXELS = int(
    os.getenv("PASSPORT_MAX_IMAGE_PIXELS", "40000000")
)

MIN_IMAGE_WIDTH = int(os.getenv("PASSPORT_MIN_IMAGE_WIDTH", "320"))
MIN_IMAGE_HEIGHT = int(os.getenv("PASSPORT_MIN_IMAGE_HEIGHT", "320"))

MIN_FACE_CONFIDENCE = float(
    os.getenv("PASSPORT_MIN_FACE_CONFIDENCE", "0.5")
)

# Face sizing is measured against image HEIGHT (the passport-standard metric),
# which is independent of aspect ratio, plus an absolute pixel floor so the
# downstream auto-crop never upscales a tiny face into a pixelated result.
MIN_FACE_HEIGHT_RATIO = float(
    os.getenv("PASSPORT_MIN_FACE_HEIGHT_RATIO", "0.16")
)
MAX_FACE_HEIGHT_RATIO = float(
    os.getenv("PASSPORT_MAX_FACE_HEIGHT_RATIO", "0.92")
)
MIN_FACE_PIXEL_HEIGHT = int(os.getenv("PASSPORT_MIN_FACE_PIXEL_HEIGHT", "120"))

# Quality metrics are computed on a resolution-normalized face ROI so the
# threshold behaves the same for a 640px and a 4000px source.
BLUR_ROI_TARGET_PX = int(os.getenv("PASSPORT_BLUR_ROI_TARGET_PX", "512"))
MIN_BLUR_SCORE = float(os.getenv("PASSPORT_MIN_BLUR_SCORE", "40"))
MIN_BRIGHTNESS = float(os.getenv("PASSPORT_MIN_BRIGHTNESS", "45"))
MAX_BRIGHTNESS = float(os.getenv("PASSPORT_MAX_BRIGHTNESS", "235"))

# Accessory enforcement (glasses/hats/masks/headphones) via the ML detector.
ACCESSORY_CHECK_ENABLED = os.getenv(
    "PASSPORT_ACCESSORY_CHECK_ENABLED", "true"
).strip().lower() in {"1", "true", "yes", "on"}

# One detector per application process.
_detector = None
_detector_lock = threading.Lock()
_inference_lock = threading.Lock()


# Data class to hold the validated passport image and its metadata.
@dataclass(frozen=True)
class ValidatedPassportImage:
    image: Image.Image
    image_bytes: bytes
    face_bbox: tuple[int, int, int, int]
    confidence: float


class PassportPhotoValidationError(Exception):
    """Expected validation failure safe to return to the client."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def _reject(code: str, message: str) -> None:
    raise PassportPhotoValidationError(code, message)


# MediaPipe face detector is lazily initialized and reused across requests.
def _get_detector():
    """Lazily initialize and reuse the MediaPipe detector."""
    global _detector

    if _detector is not None:
        return _detector

    with _detector_lock:
        if _detector is not None:
            return _detector

        if not MODEL_PATH.is_file():
            raise RuntimeError(
                f"MediaPipe model file is missing: {MODEL_PATH}"
            )

        options = mp.tasks.vision.FaceDetectorOptions(
            base_options=mp.tasks.BaseOptions(
                model_asset_path=str(MODEL_PATH)
            ),
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            min_detection_confidence=MIN_FACE_CONFIDENCE,
            min_suppression_threshold=0.3,
        )

        _detector = mp.tasks.vision.FaceDetector.create_from_options(options)

    return _detector


# Image decoding and validation
def _decode_image(image_bytes: bytes) -> Image.Image:
    """Decode an image safely and apply its EXIF orientation."""
    if not image_bytes:
        _reject("EMPTY_FILE", "Please upload an image.")

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        _reject(
            "FILE_TOO_LARGE",
            f"Image must not exceed {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    try:
        # Convert Pillow's decompression-bomb warnings into exceptions.
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)

            with Image.open(io.BytesIO(image_bytes)) as source:
                if getattr(source, "n_frames", 1) != 1:
                    _reject(
                        "ANIMATED_IMAGE",
                        "Please upload a single-frame image.",
                    )

                width, height = source.size

                if width * height > MAX_IMAGE_PIXELS:
                    _reject(
                        "IMAGE_TOO_LARGE",
                        "The image dimensions are too large to process safely.",
                    )

                source.verify()

            with Image.open(io.BytesIO(image_bytes)) as source:
                image = ImageOps.exif_transpose(source).convert("RGB")

        return image

    except PassportPhotoValidationError:
        raise
    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        OSError,
        ValueError,
        SyntaxError,
    ) as exc:
        raise PassportPhotoValidationError(
            "INVALID_IMAGE",
            "The uploaded file is not a supported, valid image.",
        ) from exc


# Face region-of-interest helpers
def _face_roi(gray: np.ndarray, bbox: tuple[int, int, int, int]) -> np.ndarray:
    """Crop a slightly padded face region from a grayscale image."""
    img_h, img_w = gray.shape[:2]
    x1, y1, x2, y2 = bbox

    pw = int((x2 - x1) * 0.25)
    ph = int((y2 - y1) * 0.25)

    rx1 = max(0, x1 - pw)
    ry1 = max(0, y1 - ph)
    rx2 = min(img_w, x2 + pw)
    ry2 = min(img_h, y2 + ph)

    return gray[ry1:ry2, rx1:rx2]


def _normalized_blur(roi: np.ndarray) -> float:
    """
    Laplacian-variance sharpness on a resolution-normalized ROI.

    Resizing to a fixed long side makes the score comparable across different
    source resolutions instead of scaling with pixel count.
    """
    if roi.size == 0:
        return float("inf")

    h, w = roi.shape[:2]
    long_side = max(h, w)

    if long_side != BLUR_ROI_TARGET_PX and long_side > 0:
        scale = BLUR_ROI_TARGET_PX / long_side
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        roi = cv2.resize(roi, (new_w, new_h), interpolation=cv2.INTER_AREA)

    return float(cv2.Laplacian(roi, cv2.CV_64F).var())


# Passport photo validation
def validate_passport_image(image_bytes: bytes) -> ValidatedPassportImage:
    """
    Screen a portrait for image quality, face framing, and disallowed accessories.

    The face is detected first so quality metrics (blur, brightness) and the
    sizing rule are computed against the face ROI rather than the whole frame.

    This is a technical screening step, not a guarantee of compliance with
    official passport or visa photo requirements.
    """
    image = _decode_image(image_bytes)
    width, height = image.size

    if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
        _reject(
            "IMAGE_TOO_SMALL",
            f"Image resolution must be at least "
            f"{MIN_IMAGE_WIDTH} x {MIN_IMAGE_HEIGHT} pixels.",
        )

    rgb = np.asarray(image)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    # MediaPipe Tasks expects an SRGB image.
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=np.ascontiguousarray(rgb),
    )

    detector = _get_detector()

    # The same detector instance is reused across requests.
    with _inference_lock:
        result = detector.detect(mp_image)

    detections = result.detections or []

    if not detections:
        _reject(
            "NO_FACE_DETECTED",
            "No face was detected. Upload a clear, front-facing portrait.",
        )

    if len(detections) > 1:
        _reject(
            "MULTIPLE_FACES",
            "Only one person should appear in the photo.",
        )

    detection = detections[0]
    confidence = (
        float(detection.categories[0].score)
        if detection.categories
        else 0.0
    )

    if confidence < MIN_FACE_CONFIDENCE:
        _reject(
            "LOW_FACE_CONFIDENCE",
            "The face could not be detected reliably. Try a clearer photo.",
        )

    bbox = detection.bounding_box

    # Clip the face rectangle to the image boundaries.
    x1 = max(0, min(int(bbox.origin_x), width - 1))
    y1 = max(0, min(int(bbox.origin_y), height - 1))
    x2 = max(x1 + 1, min(int(bbox.origin_x + bbox.width), width))
    y2 = max(y1 + 1, min(int(bbox.origin_y + bbox.height), height))

    face_width = x2 - x1
    face_height = y2 - y1

    # Sizing: aspect-ratio-independent height ratio plus an absolute pixel floor.
    face_height_ratio = face_height / height

    if face_height_ratio < MIN_FACE_HEIGHT_RATIO or face_height < MIN_FACE_PIXEL_HEIGHT:
        _reject(
            "FACE_TOO_SMALL",
            "Your face appears too small or too low-resolution. "
            "Move closer to the camera or use a higher-resolution photo.",
        )

    if face_height_ratio > MAX_FACE_HEIGHT_RATIO:
        _reject(
            "FACE_TOO_LARGE",
            "Your face appears too large or cropped. Move farther away so "
            "your full head fits in the frame.",
        )

    # Centering.
    center_x = (x1 + x2) / 2 / width
    center_y = (y1 + y2) / 2 / height

    if not 0.20 <= center_x <= 0.80:
        _reject(
            "FACE_OFF_CENTER",
            "Position your face closer to the horizontal center.",
        )

    if not 0.12 <= center_y <= 0.85:
        _reject(
            "FACE_OFF_CENTER",
            "Adjust the framing so your face is more centrally positioned.",
        )

    # Quality metrics are sampled on the face ROI, not the whole frame.
    roi = _face_roi(gray, (x1, y1, x2, y2))

    blur_score = _normalized_blur(roi)

    if blur_score < MIN_BLUR_SCORE:
        _reject(
            "IMAGE_TOO_BLURRY",
            "The image appears blurry. Please upload a sharper photo.",
        )

    brightness = float(np.mean(roi))

    if brightness < MIN_BRIGHTNESS:
        _reject(
            "IMAGE_TOO_DARK",
            "The face appears too dark. Use more even lighting.",
        )

    if brightness > MAX_BRIGHTNESS:
        _reject(
            "IMAGE_TOO_BRIGHT",
            "The face appears overexposed. Reduce the lighting.",
        )

    # Accessory enforcement (glasses/hats/masks/headphones) via the ML detector.
    if ACCESSORY_CHECK_ENABLED:
        reason = detect_forbidden_accessories(rgb, (x1, y1, x2, y2))
        if reason:
            _reject("ACCESSORY_NOT_ALLOWED", reason)

    # Normalize orientation and encoding before background removal.
    normalized = io.BytesIO()
    image.save(normalized, format="PNG")

    return ValidatedPassportImage(
        image=image,
        image_bytes=normalized.getvalue(),
        face_bbox=(x1, y1, x2, y2),
        confidence=confidence,
    )
