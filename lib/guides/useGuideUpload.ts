import { useState } from "react";

export function useGuideUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File, slug: string, stepKey: string) => {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', slug);
      formData.append('stepKey', stepKey);

      const response = await fetch('/api/guides/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    uploading,
    uploadError,
    clearError: () => setUploadError(null)
  };
}