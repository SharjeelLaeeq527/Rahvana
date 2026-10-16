# app/api/routes/remove_bg.py
import io
import logging
import os
import warnings
from functools import lru_cache
from pathlib import Path

# Configure rembg's model directory BEFORE importing rembg.
# Anchor to the backend root (not the process CWD) so weights resolve to a
# stable location regardless of how the server is launched.
# Override U2NET_HOME in the deployment environment if needed.
os.environ.setdefault(
    "U2NET_HOME", str(Path(__file__).resolve().parents[3] / ".u2net")
)

import cv2
import httpx
import numpy as np
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from PIL import Image, ImageOps, UnidentifiedImageError
from rembg import remove
from rembg.session_factory import new_session

from app.services.passport_photo_validation import (
    MAX_IMAGE_PIXELS,
    MAX_UPLOAD_BYTES,
    PassportPhotoValidationError,
    validate_passport_image,
)

router = APIRouter()
logger = logging.getLogger(__name__)

REMOVE_BG_API_KEY = os.getenv("REMOVE_BG_API_KEY", "").strip()
REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg"

# Keep dimensions bounded even for general background-removal requests.
MAX_OUTPUT_PIXELS = MAX_IMAGE_PIXELS


# LRU cache the rembg session to avoid reloading the model on every request.
@lru_cache(maxsize=1)
def get_rembg_session():
    """Initialize and reuse the local rembg model session."""
    return new_session("u2netp")


# Upload reading and validation helpers
async def read_upload(file: UploadFile) -> bytes:
    """Read a bounded upload and close the uploaded file."""
    try:
        content = await file.read(MAX_UPLOAD_BYTES + 1)
    finally:
        await file.close()

    if not content:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "EMPTY_FILE",
                "message": "Please upload an image.",
            },
        )

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": (
                    f"Image must not exceed "
                    f"{MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
                ),
            },
        )

    return content


def normalize_general_image(image_bytes: bytes) -> bytes:
    """
    Decode and normalize a general image for background removal.
    Preserves transparency and applies EXIF orientation.
    Does not require a face.
    """
    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning,
            )

            with Image.open(io.BytesIO(image_bytes)) as source:
                if getattr(source, "n_frames", 1) != 1:
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "code": "ANIMATED_IMAGE",
                            "message": "Please upload a single-frame image.",
                        },
                    )

                width, height = source.size

                if width * height > MAX_OUTPUT_PIXELS:
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "code": "IMAGE_TOO_LARGE",
                            "message": "The image dimensions are too large.",
                        },
                    )

                source.verify()

            with Image.open(io.BytesIO(image_bytes)) as source:
                image = ImageOps.exif_transpose(source).convert("RGBA")

        output = io.BytesIO()
        image.save(output, format="PNG")
        return output.getvalue()

    except HTTPException:
        raise
    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        OSError,
        ValueError,
        SyntaxError,
    ) as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_IMAGE",
                "message": "The uploaded file is not a supported, valid image.",
            },
        ) from exc


# Remove background using either remove.bg or local rembg, with compositing on white.
async def remove_bg_with_api(image_bytes: bytes) -> bytes:
    """Remove the image background using the external remove.bg API."""
    if not REMOVE_BG_API_KEY:
        raise RuntimeError("REMOVE_BG_API_KEY is not configured.")

    timeout = httpx.Timeout(60.0, connect=10.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            REMOVE_BG_API_URL,
            files={
                "image_file": (
                    "image.png",
                    image_bytes,
                    "image/png",
                )
            },
            data={"size": "auto"},
            headers={"X-Api-Key": REMOVE_BG_API_KEY},
        )

    if response.status_code != 200:
        # Avoid logging the API key or provider response body.
        logger.warning(
            "remove.bg returned HTTP %s",
            response.status_code,
        )
        raise RuntimeError(
            f"remove.bg request failed with HTTP {response.status_code}."
        )

    if not response.content:
        raise RuntimeError("remove.bg returned an empty response.")

    return response.content


# Image compositing and encoding helpers
def composite_on_white(image_bytes: bytes) -> np.ndarray:
    """Safely composite a transparent image onto white."""
    try:
        with Image.open(io.BytesIO(image_bytes)) as source:
            width, height = source.size

            if width <= 0 or height <= 0:
                raise ValueError("Invalid image dimensions.")

            if width * height > MAX_OUTPUT_PIXELS:
                raise ValueError("Processed image dimensions are too large.")

            rgba = source.convert("RGBA")

        white = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        white.alpha_composite(rgba)

        return cv2.cvtColor(
            np.asarray(white.convert("RGB")),
            cv2.COLOR_RGB2BGR,
        )

    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        OSError,
        ValueError,
    ) as exc:
        raise ValueError(
            "The background-removal provider returned an invalid image."
        ) from exc


def remove_bg_locally(image_bytes: bytes) -> np.ndarray:
    """Remove the background using rembg as the local fallback."""
    removed = remove(
        image_bytes,
        session=get_rembg_session(),
    )

    return composite_on_white(removed)


async def remove_background(image_bytes: bytes) -> np.ndarray:
    """
    Prefer remove.bg when configured; otherwise use local rembg.
    A provider/network/response failure triggers the local fallback.
    """
    if REMOVE_BG_API_KEY:
        try:
            logger.info("Attempting remove.bg background removal")

            result_bytes = await remove_bg_with_api(image_bytes)

            return await run_in_threadpool(
                composite_on_white,
                result_bytes,
            )

        except Exception as exc:
            logger.warning(
                "remove.bg failed; using local fallback (%s)",
                type(exc).__name__,
            )

    return await run_in_threadpool(
        remove_bg_locally,
        image_bytes,
    )


# Passport photo processing helpers
def face_center_crop(
    img_bgr: np.ndarray,
    face_bbox: tuple[int, int, int, int],
    original_size: tuple[int, int],
    output_width: int,
    output_height: int,
) -> np.ndarray:
    """
    Crop around the validated MediaPipe face.

    The crop follows the requested output aspect ratio and adds white
    padding when the requested crop extends beyond the source image.
    """
    img_height, img_width = img_bgr.shape[:2]
    original_width, original_height = original_size

    x1, y1, x2, y2 = face_bbox

    # Background-removal providers may return different dimensions.
    scale_x = img_width / original_width
    scale_y = img_height / original_height

    x1 = int(x1 * scale_x)
    y1 = int(y1 * scale_y)
    x2 = int(x2 * scale_x)
    y2 = int(y2 * scale_y)

    face_width = max(1, x2 - x1)
    face_height = max(1, y2 - y1)

    center_x = (x1 + x2) // 2
    center_y = int((y1 + y2) / 2 - face_height * 0.10)

    aspect_ratio = output_width / output_height

    # Leave room around the face while preserving the target aspect ratio.
    crop_height = max(
        int(face_height * 2.2),
        int(face_width * 2.2 / aspect_ratio),
        1,
    )
    crop_width = max(int(crop_height * aspect_ratio), 1)

    left = center_x - crop_width // 2
    top = center_y - crop_height // 2
    right = left + crop_width
    bottom = top + crop_height

    pad_left = max(0, -left)
    pad_top = max(0, -top)
    pad_right = max(0, right - img_width)
    pad_bottom = max(0, bottom - img_height)

    if any((pad_left, pad_top, pad_right, pad_bottom)):
        img_bgr = cv2.copyMakeBorder(
            img_bgr,
            pad_top,
            pad_bottom,
            pad_left,
            pad_right,
            cv2.BORDER_CONSTANT,
            value=(255, 255, 255),
        )

        left += pad_left
        right += pad_left
        top += pad_top
        bottom += pad_top

    cropped = img_bgr[top:bottom, left:right]

    if cropped.size == 0:
        raise ValueError("Unable to create a valid face-centered crop.")

    return cv2.resize(
        cropped,
        (output_width, output_height),
        interpolation=cv2.INTER_LANCZOS4,
    )


def enhance_image(img_bgr: np.ndarray) -> np.ndarray:
    """Apply restrained brightness adjustment and denoising."""
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    l_channel = cv2.convertScaleAbs(
        l_channel,
        alpha=1.0,
        beta=5,
    )

    enhanced = cv2.cvtColor(
        cv2.merge((l_channel, a_channel, b_channel)),
        cv2.COLOR_LAB2BGR,
    )

    return cv2.bilateralFilter(
        enhanced,
        d=5,
        sigmaColor=15,
        sigmaSpace=15,
    )


def encode_jpeg(img_bgr: np.ndarray, quality: int) -> bytes:
    """Encode a BGR image as JPEG."""
    success, buffer = cv2.imencode(
        ".jpg",
        img_bgr,
        [cv2.IMWRITE_JPEG_QUALITY, quality],
    )

    if not success:
        raise RuntimeError("JPEG encoding failed.")

    return buffer.tobytes()


# Passport photo processing helpers
async def read_and_validate_passport(file: UploadFile):
    """Validate a portrait before calling either background remover."""
    image_bytes = await read_upload(file)

    try:
        return await run_in_threadpool(
            validate_passport_image,
            image_bytes,
        )

    except PassportPhotoValidationError as exc:
        status_code = (
            413 if exc.code == "FILE_TOO_LARGE" else 422
        )

        raise HTTPException(
            status_code=status_code,
            detail={
                "code": exc.code,
                "message": exc.message,
            },
        ) from exc

    except RuntimeError as exc:
        logger.exception("MediaPipe detector initialization/inference failed")

        raise HTTPException(
            status_code=503,
            detail={
                "code": "VALIDATION_SERVICE_UNAVAILABLE",
                "message": "Photo validation is temporarily unavailable.",
            },
        ) from exc


# Shared response helper
def image_response(
    image_bytes: bytes,
    filename: str,
    *,
    attachment: bool = False,
) -> Response:
    disposition = "attachment" if attachment else "inline"

    return Response(
        content=image_bytes,
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


# ENDPOINT 1: General background removal
@router.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    """
    Remove the background from a general image.

    Does not require a face and preserves the processed image dimensions.
    The transparent result is composited onto white and returned as JPEG.
    """
    try:
        original_bytes = await read_upload(file)

        normalized_bytes = await run_in_threadpool(
            normalize_general_image,
            original_bytes,
        )

        result_bgr = await remove_background(normalized_bytes)

        jpeg_bytes = await run_in_threadpool(
            encode_jpeg,
            result_bgr,
            95,
        )

        return image_response(
            jpeg_bytes,
            "background_removed.jpg",
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Background removal failed")

        raise HTTPException(
            status_code=500,
            detail={
                "code": "BACKGROUND_REMOVAL_FAILED",
                "message": (
                    "Unable to remove the background. Please try again."
                ),
            },
        ) from exc


# ENDPOINT 2: Passport Photo Processing
@router.post("/passport-photo")
async def create_passport_photo(
    file: UploadFile = File(...),
    width: int = Query(default=600, ge=100, le=2000),
    height: int = Query(default=600, ge=100, le=2000),
    quality: int = Query(default=95, ge=50, le=100),
):
    """
    Validate a portrait, remove its background, center the face,
    composite on white, and return a JPEG at the requested dimensions.
    """
    try:
        validated = await read_and_validate_passport(file)

        original_size = validated.image.size

        # Validation happens before paid API or local background removal.
        result_bgr = await remove_background(validated.image_bytes)

        result_bgr = await run_in_threadpool(
            face_center_crop,
            result_bgr,
            validated.face_bbox,
            original_size,
            width,
            height,
        )

        result_bgr = await run_in_threadpool(
            enhance_image,
            result_bgr,
        )

        jpeg_bytes = await run_in_threadpool(
            encode_jpeg,
            result_bgr,
            quality,
        )

        return image_response(
            jpeg_bytes,
            f"passport_photo_{width}x{height}.jpg",
            attachment=True,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Passport photo processing failed")

        raise HTTPException(
            status_code=500,
            detail={
                "code": "PHOTO_PROCESSING_FAILED",
                "message": (
                    "Unable to process this photo. Please try again."
                ),
            },
        ) from exc
