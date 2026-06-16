// lib/document-ocr/clientImage.ts
//
// Client-side image downscaling so uploads fit under the OCR.space free-tier
// 1MB limit before we send them to /api/documents/extract-passport.
// Browser-only (uses FileReader / Image / canvas) — call from client components.

// OCR.space free tier rejects files > 1MB.
const FILE_LIMIT_BYTES = 1 * 1024 * 1024;

/** Downscale an image File on the client so it fits under the OCR size limit. */
export async function resizeImageIfNeeded(file: File): Promise<File> {
  if (file.size <= FILE_LIMIT_BYTES || !file.type.startsWith("image/")) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const maxDim = 1600;
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  // Step quality down until under the limit.
  for (const quality of [0.8, 0.6, 0.45, 0.3]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (blob && blob.size <= FILE_LIMIT_BYTES) {
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    }
  }
  return file; // best effort — server will reject if still too big
}
