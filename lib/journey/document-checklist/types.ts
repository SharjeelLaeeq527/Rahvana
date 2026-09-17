export type DocumentCategory = "ceac_required" | "needs_attention" | "post_appointment";
export type ExpirationStatus = "valid" | "expiring_soon" | "expired";
export type UploadStatus = "uploaded" | "not_uploaded";

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
  category: DocumentCategory;
  needs_attention?: boolean;
  attention_reason?: string;
}

export interface GroupedDocuments {
  ceac_required: DocumentChecklistItem[];
  needs_attention: DocumentChecklistItem[];
  post_appointment: DocumentChecklistItem[];
}
