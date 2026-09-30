// types/passport-photo.ts

export const STANDALONE_PASSPORT_PHOTOS_KEY = "standalone_passport_photo_history";
export const STANDALONE_PASSPORT_PHOTO_DRAFT_KEY = "standalone_passport_photo_draft";

export function getJourneyPassportPhotosKey(journeySlug: string, candidateId?: string): string {
  return `journey_${journeySlug}_${candidateId || "primary"}_passport_photo_history`;
}

export function getJourneyPassportPhotoDraftKey(journeySlug: string, candidateId?: string): string {
  return `journey_${journeySlug}_${candidateId || "primary"}_passport_photo_draft`;
}

export interface PassportPhotoItem {
  id: string;
  dataUrl: string; // Base64 data URL
  presetName: string;
  width: number;
  height: number;
  createdAt: string;
  fileName?: string;
  fileSize?: number;
}

export interface PassportPhotoDraft {
  currentPhoto: PassportPhotoItem | null;
  history: PassportPhotoItem[];
  updatedAt: string;
}
