-- Migration: IR-5 Document Vault multi-candidate support
-- Purpose: allow a single IR-5 journey's vault to hold documents for more than one
--          candidate (Parent 1 / Parent 2), and to share a document across candidates
--          without duplicating the physical file.
--
-- Design (see docs/IR5-DOCUMENT-VAULT-MULTI-CANDIDATE-PLAN.md):
--   * A "candidate" is a sub-scope INSIDE one journey. We do NOT add a journey row.
--   * `documents.candidate_id` (nullable) tags a row to a candidate. NULL = legacy /
--     single-candidate journey => behaves exactly as before (fully backward compatible).
--   * Cross-candidate sharing is modeled as multiple `documents` rows that reuse the SAME
--     `storage_path` (one encrypted blob). No new column is needed for the share link.
--   * `document_vault_config.candidates` holds the per-journey candidate roster (JSONB
--     array of { id, label, name? }). Empty/absent => single-candidate vault.
--
-- This migration is additive and backward-safe: no NOT NULL, no constraint changes, no
-- backfill. Existing IR-1 and single-parent IR-5 rows keep candidate_id = NULL.

-- 1. Tag documents with an optional candidate sub-scope.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS candidate_id TEXT;

-- 2. Index for per-candidate listing within a journey.
CREATE INDEX IF NOT EXISTS idx_documents_journey_candidate
  ON public.documents(journey_id, candidate_id);

-- 3. Index on storage_path for the reference-count check used by safe (shared) deletes.
CREATE INDEX IF NOT EXISTS idx_documents_storage_path
  ON public.documents(storage_path);

-- 4. Per-journey candidate roster on the vault config.
ALTER TABLE public.document_vault_config
  ADD COLUMN IF NOT EXISTS candidates JSONB DEFAULT '[]'::jsonb;
