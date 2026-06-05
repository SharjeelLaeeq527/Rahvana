import logging
import os
import io
import tempfile
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
import asyncio

import pikepdf
from PIL import Image
import fitz  # PyMuPDF
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response

# Configure Logging
logger = logging.getLogger(__name__)

router = APIRouter()

class PDFProcessor:
    """Handle EXTREME PDF compression with logging and speed optimization"""

    @staticmethod
    def _compress_image(image_bytes: bytes, img_quality: int, max_dimension: int) -> Optional[bytes]:
        """CPU-bound work for a single image. PIL releases the GIL during
        decode/resize/encode, so calling this from a thread pool gives real
        parallelism."""
        pil_image = Image.open(io.BytesIO(image_bytes))
        width, height = pil_image.size

        # Resize only if needed
        if width > max_dimension or height > max_dimension:
            ratio = min(max_dimension / width, max_dimension / height)
            pil_image = pil_image.resize(
                (int(width * ratio), int(height * ratio)),
                Image.Resampling.LANCZOS,
            )

        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')

        # NOTE: optimize=True is intentionally OFF — it runs a second encoding
        # pass that roughly doubles encode time for ~tiny size gains.
        img_buffer = io.BytesIO()
        pil_image.save(img_buffer, format='JPEG', quality=img_quality)
        return img_buffer.getvalue()

    @staticmethod
    def process_pdf_sync(input_bytes: bytes, password: Optional[str] = None) -> tuple[bytes, dict]:
        original_size = len(input_bytes)
        temp_files = []
        
        try:
            # Setup temporary files
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_input:
                tmp_input.write(input_bytes)
                tmp_input.flush()
                input_path = tmp_input.name
                temp_files.append(input_path)
            
            intermediate_path = input_path.replace('.pdf', '_intermediate.pdf')
            output_path = input_path.replace('.pdf', '_compressed.pdf')
            temp_files.append(intermediate_path)
            temp_files.append(output_path)
            
            logger.info(f"Starting compression. Original size: {original_size} bytes.")
            
            # Hardcoded settings
            img_quality = 60
            max_dimension = 1024
            
            # --- STEP 1: Collect every unique image once ---
            doc = fitz.open(input_path)
            logger.info(f"Processing PDF with {len(doc)} pages...")

            # Map each unique image (xref) to the first page that references it.
            # Deduping here means an image reused across N pages is only
            # decoded/encoded ONCE instead of N times.
            xref_page: dict[int, int] = {}
            for page_num in range(len(doc)):
                for img_info in doc[page_num].get_images():
                    xref = img_info[0]
                    if xref not in xref_page:
                        xref_page[xref] = page_num

            jobs = []  # (xref, image_bytes)
            for xref in xref_page:
                try:
                    extracted = doc.extract_image(xref)
                except Exception as e:
                    logger.warning(f"Failed to extract image {xref}: {e}")
                    continue
                if not extracted:
                    continue
                # Skip small/already compressed JPEGs
                if extracted['ext'].lower() in ('jpeg', 'jpg') and extracted['size'] < 50 * 1024:
                    continue
                jobs.append((xref, extracted["image"]))

            # --- STEP 2: Compress images in parallel ---
            def _worker(job):
                xref, image_bytes = job
                try:
                    return xref, PDFProcessor._compress_image(image_bytes, img_quality, max_dimension)
                except Exception as e:
                    logger.warning(f"Failed to process image {xref}: {e}")
                    return xref, None

            if jobs:
                workers = min(8, (os.cpu_count() or 4))
                with ThreadPoolExecutor(max_workers=workers) as pool:
                    results = list(pool.map(_worker, jobs))
            else:
                results = []

            # Replace must touch the doc, so do it sequentially on the main thread.
            for xref, compressed_image_bytes in results:
                if not compressed_image_bytes:
                    continue
                try:
                    doc[xref_page[xref]].replace_image(xref, stream=compressed_image_bytes)
                except Exception as e:
                    logger.warning(f"Failed to replace image {xref}: {e}")

            logger.info("Image optimization complete. Starting structural saving.")

            # Save with structure cleanup. Dropped clean=True (sanitizes content
            # streams — slow); garbage collection + deflate stay.
            doc.save(
                intermediate_path,
                garbage=4,
                deflate=True
            )
            doc.close()

            # --- STEP 3: Quick Structure Cleanup with pikepdf ---
            with pikepdf.open(intermediate_path, password=password or '') as pdf:
                try:
                    with pdf.open_metadata() as meta:
                        meta.clear()
                except Exception:
                    pass

                # Dropped linearize=True — it adds a server-side reordering pass
                # for faster web viewing that we don't need here.
                pdf.save(
                    output_path,
                    compress_streams=True,
                    stream_decode_level=pikepdf.StreamDecodeLevel.generalized,
                    object_stream_mode=pikepdf.ObjectStreamMode.generate
                )
            
            # Read final file
            with open(output_path, 'rb') as f:
                compressed_bytes = f.read()
            
            compressed_size = len(compressed_bytes)
            
            # Fallback if compressed is larger than original
            if compressed_size >= original_size:
                compressed_bytes = input_bytes
                compressed_size = original_size
                reduction = 0.0
            else:
                reduction = ((original_size - compressed_size) / original_size) * 100
            
            metadata = {
                'original_size': original_size,
                'compressed_size': compressed_size,
                'reduction_percentage': round(reduction, 2),
                'was_encrypted': password is not None
            }
            
            logger.info(f"Compression complete. Reduced by {metadata['reduction_percentage']}%.")
            return compressed_bytes, metadata
            
        except pikepdf.PasswordError:
            logger.error("Invalid password provided.")
            raise ValueError("Invalid password for encrypted PDF")
        except Exception as e:
            logger.critical(f"Critical compression failure: {str(e)}", exc_info=True)
            raise Exception(f"Compression failed: {str(e)}")
            
        finally:
            # Robust Cleanup
            for path in temp_files:
                if os.path.exists(path):
                    try:
                        os.unlink(path)
                    except OSError:
                        pass
    
    @staticmethod
    async def compress_pdf(
        input_bytes: bytes,
        password: Optional[str] = None
    ) -> tuple[bytes, dict]:
        # Offload the entire CPU-bound compression process to thread pool safely
        loop = asyncio.get_running_loop()
        with ThreadPoolExecutor(max_workers=3) as pool:
            return await loop.run_in_executor(
                pool, 
                PDFProcessor.process_pdf_sync, 
                input_bytes, 
                password
            )

@router.post("/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None)
):
    """Compress PDF file with MAXIMUM AGGRESSION and SPEED"""
    
    logger.info(f"Request received for file: {file.filename}")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    content = await file.read()
    
    # Render and Vercel limits exist, we reject >100MB here, and proxy handles what it handles
    if len(content) > 100 * 1024 * 1024:
        logger.error(f"File size {len(content)} exceeds 100MB limit.")
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 100MB")
    
    try:
        compressed_bytes, metadata = await PDFProcessor.compress_pdf(
            content, 
            password=password
        )
        
        headers = {
            "Content-Disposition": f'attachment; filename="compressed_{file.filename}"',
            "X-Original-Size": str(metadata['original_size']),
            "X-Compressed-Size": str(metadata['compressed_size']),
            "X-Reduction": str(metadata['reduction_percentage']),
            "Access-Control-Expose-Headers": "X-Original-Size, X-Compressed-Size, X-Reduction",
            "Cache-Control": "no-cache"  # Prevent caching issues
        }
        
        return Response(
            content=compressed_bytes,
            media_type="application/pdf",
            headers=headers
        )
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Final response error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")
