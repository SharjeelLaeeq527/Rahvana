
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
    os.getenv("PASSPORT_MIN_FACE_CONFIDENCE", "0.65")
)
MIN_FACE_AREA_RATIO = float(
    os.getenv("PASSPORT_MIN_FACE_AREA_RATIO", "0.08")
)
MAX_FACE_AREA_RATIO = float(
    os.getenv("PASSPORT_MAX_FACE_AREA_RATIO", "0.65")
)

MIN_BLUR_SCORE = float(os.getenv("PASSPORT_MIN_BLUR_SCORE", "25"))
MIN_BRIGHTNESS = float(os.getenv("PASSPORT_MIN_BRIGHTNESS", "35"))
MAX_BRIGHTNESS = float(os.getenv("PASSPORT_MAX_BRIGHTNESS", "245"))

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


# Passport photo validation
def validate_passport_image(image_bytes: bytes) -> ValidatedPassportImage:
    """
    Screen a portrait for basic image quality and face framing.

    This is a technical screening step, not a guarantee of compliance
    with official passport or visa photo requirements.
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

    # Blur screening.
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    if blur_score < MIN_BLUR_SCORE:
        _reject(
            "IMAGE_TOO_BLURRY",
            "The image appears blurry. Please upload a sharper photo.",
        )

    # Average brightness screening.
    brightness = float(np.mean(gray))

    if brightness < MIN_BRIGHTNESS:
        _reject(
            "IMAGE_TOO_DARK",
            "The image appears too dark. Use more even lighting.",
        )

    if brightness > MAX_BRIGHTNESS:
        _reject(
            "IMAGE_TOO_BRIGHT",
            "The image appears overexposed. Reduce the lighting.",
        )

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
    face_area_ratio = (face_width * face_height) / (width * height)

    if face_area_ratio < MIN_FACE_AREA_RATIO:
        _reject(
            "FACE_TOO_SMALL",
            "Your face appears too small. Move closer to the camera.",
        )

    if face_area_ratio > MAX_FACE_AREA_RATIO:
        _reject(
            "FACE_TOO_LARGE",
            "Your face appears too large or cropped. Move farther away.",
        )

    center_x = (x1 + x2) / 2 / width
    center_y = (y1 + y2) / 2 / height

    if not 0.20 <= center_x <= 0.80:
        _reject(
            "FACE_OFF_CENTER",
            "Position your face closer to the horizontal center.",
        )

    if not 0.15 <= center_y <= 0.80:
        _reject(
            "FACE_OFF_CENTER",
            "Adjust the framing so your face is more centrally positioned.",
        )

    # Normalize orientation and encoding before background removal.
    normalized = io.BytesIO()
    image.save(normalized, format="PNG")

    return ValidatedPassportImage(
        image=image,
        image_bytes=normalized.getvalue(),
        face_bbox=(x1, y1, x2, y2),
        confidence=confidence,
    )
