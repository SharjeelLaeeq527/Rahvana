export type DocumentCategory = "already_uploaded" | "expirable" | "post_interview";
export type ExpirationStatus = "valid" | "expiring_soon" | "expired";

export interface DocumentChecklistItem {
  id: string;
  document_key: string;
  title: string;
  subtitle?: string;
  icon?: string;
  is_uploaded: boolean;
  is_required: boolean;
  is_expirable: boolean;
  expiry_date?: string;
  expiration_status?: ExpirationStatus;
  days_until_expiry?: number;
  source_steps: string[];
  vault_file_id?: string;
  help_url?: string;
  notes?: string;
  tags?: string[];
}

export interface GroupedDocuments {
  already_uploaded: DocumentChecklistItem[];
  expirable: DocumentChecklistItem[];
  post_interview: DocumentChecklistItem[];
}
