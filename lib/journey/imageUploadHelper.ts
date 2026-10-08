// lib/journey/imageUploadHelper.ts
// Client-side helper for image compression and upload for journeys and candidate profiles

export async function compressImage(file: File, maxDimension: number = 1200): Promise<File | Blob> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function uploadJourneyImage(
  file: File,
  entityType: "journey" | "candidate",
  entityId: string
): Promise<{ url: string }> {
  try {
    const processed = await compressImage(file, entityType === "candidate" ? 600 : 1200);

    const formData = new FormData();
    formData.append("file", processed);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);

    const response = await fetch("/api/journey/upload-image", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return { url: data.url };
      }
    }
  } catch (err) {
    console.warn("[uploadJourneyImage] Upload request error, falling back:", err);
  }

  // Graceful fallback to client data URL if upload failed
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

  return { url: dataUrl };
}
