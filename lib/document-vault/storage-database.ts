// Server-side Database Storage Manager for Document Vault
// Handles document metadata storage in Supabase (SERVER-SIDE ONLY)

import { SupabaseClient } from '@supabase/supabase-js';
import { UploadedDocument, DocumentVaultConfig, DocumentRole, VisaCategory } from './types';

/**
 * Server-side database storage manager
 * Handles document metadata storage in Supabase
 * NOTE: This file should ONLY be imported in API routes (server-side)
 */
export class DocumentDatabaseStorage {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Gets all documents for a user
   */
  async getAllDocuments(userId: string): Promise<UploadedDocument[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    return (data || []).map(this.mapDatabaseToDocument);
  }

  /**
   * Saves document metadata to database
   * Handles case where compressed columns may not exist yet
   */
  async saveDocument(document: UploadedDocument): Promise<UploadedDocument> {
    const dbDocument = this.mapDocumentToDatabase(document);

    // First try with all columns
    let { data, error } = await this.supabase
      .from('documents')
      .upsert(dbDocument)
      .select()
      .single();

    // If error mentions unknown column, retry without compressed columns
    if (error && error.message && error.message.includes('compressed')) {
      console.warn('Compressed columns not in database, saving without them...');
      const {
        has_compressed_version: _hasCompressed,
        compressed_filename: _compressedFilename,
        compressed_file_size: _compressedFileSize,
        compressed_storage_path: _compressedStoragePath,
        ...basicDoc
      } = dbDocument;
      // Suppress unused variable warnings - these are intentionally destructured out
      void _hasCompressed;
      void _compressedFilename;
      void _compressedFileSize;
      void _compressedStoragePath;

      const retryResult = await this.supabase
        .from('documents')
        .upsert(basicDoc)
        .select()
        .single();

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Error saving document:', error);
      throw error;
    }

    return this.mapDatabaseToDocument(data);
  }

  /**
   * Deletes document from database
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }

    return true;
  }

  /**
   * Gets document by ID
   */
  async getDocument(
    documentId: string,
    userId: string
  ): Promise<UploadedDocument | null> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching document:', error);
      throw error;
    }

    return data ? this.mapDatabaseToDocument(data) : null;
  }

  /**
   * Gets documents by definition ID
   */
  async getDocumentsByDefId(
    documentDefId: string,
    userId: string
  ): Promise<UploadedDocument[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('document_def_id', documentDefId)
      .order('version', { ascending: true });

    if (error) {
      console.error('Error fetching documents by def ID:', error);
      throw error;
    }

    return (data || []).map(this.mapDatabaseToDocument);
  }

  /**
   * Updates document status
   */
  async updateDocumentStatus(
    documentId: string,
    userId: string,
    status: UploadedDocument['status']
  ): Promise<UploadedDocument> {
    const { data, error } = await this.supabase
      .from('documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating document status:', error);
      throw error;
    }

    return this.mapDatabaseToDocument(data);
  }

  /**
   * Updates document metadata
   */
  async updateDocument(
    documentId: string,
    userId: string,
    updates: Partial<UploadedDocument>
  ): Promise<UploadedDocument> {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.expirationDate !== undefined) {
      dbUpdates.expiration_date = updates.expirationDate?.toISOString();
    }
    if (updates.notes !== undefined) {
      dbUpdates.notes = updates.notes;
    }
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
    }
    if (updates.isExpired !== undefined) {
      dbUpdates.is_expired = updates.isExpired;
    }

    const { data, error } = await this.supabase
      .from('documents')
      .update(dbUpdates)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      throw error;
    }

    return this.mapDatabaseToDocument(data);
  }

  /**
   * Saves vault configuration
   */
  async saveVaultConfig(config: DocumentVaultConfig): Promise<DocumentVaultConfig> {
    const dbConfig = {
      user_id: config.userId,
      visa_category: config.visaCategory,
      scenario_flags: config.scenarioFlags || {},
      case_id: config.caseId,
      petitioner_name: config.petitionerName,
      beneficiary_name: config.beneficiaryName,
      joint_sponsor_name: config.jointSponsorName,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('document_vault_config')
      .upsert(dbConfig, {
        onConflict: 'user_id', // Specify the unique constraint column
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving vault config:', error);
      throw error;
    }

    return this.mapDatabaseToConfig(data);
  }

  /**
   * Gets vault configuration
   */
  async getVaultConfig(userId: string): Promise<DocumentVaultConfig | null> {
    const { data, error } = await this.supabase
      .from('document_vault_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching vault config:', error);
      throw error;
    }

    return data ? this.mapDatabaseToConfig(data) : null;
  }

  /**
   * Deletes all vault data for user
   */
  async clearAllData(userId: string): Promise<boolean> {
    // Delete all documents
    const { error: docsError } = await this.supabase
      .from('documents')
      .delete()
      .eq('user_id', userId);

    if (docsError) {
      console.error('Error deleting documents:', docsError);
      throw docsError;
    }

    // Delete config
    const { error: configError } = await this.supabase
      .from('document_vault_config')
      .delete()
      .eq('user_id', userId);

    if (configError) {
      console.error('Error deleting config:', configError);
      throw configError;
    }

    return true;
  }

  // Mark as Read
  async markDocumentAsRead(documentId: string, userId: string): Promise<UploadedDocument> {
    const { data, error } = await this.supabase
      .from('documents')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking document as read:', error);
      throw error;
    }

    return this.mapDatabaseToDocument(data);
  }

  // Mark all documents as Read
  async markAllDocumentsAsRead(userId: string): Promise<UploadedDocument[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false) // Only update unread documents
      .select();

    if (error) {
      console.error('Error marking documents as read:', error);
      throw error;
    }

    return data.map((row) => this.mapDatabaseToDocument(row));
  }

  /**
   * Maps database row to UploadedDocument
   */
  private mapDatabaseToDocument(data: Record<string, unknown>): UploadedDocument {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      documentDefId: data.document_def_id as string,
      originalFilename: data.original_filename as string,
      standardizedFilename: data.standardized_filename as string,
      fileSize: Number(data.file_size),
      mimeType: data.mime_type as string,
      storagePath: data.storage_path as string,
      // Compressed file info
      hasCompressedVersion: (data.has_compressed_version as boolean) || false,
      compressedFilename: data.compressed_filename as string | undefined,
      compressedFileSize: data.compressed_file_size ? Number(data.compressed_file_size) : undefined,
      compressedStoragePath: data.compressed_storage_path as string | undefined,
      // Metadata
      uploadedAt: new Date(data.uploaded_at as string),
      uploadedBy: data.uploaded_by as DocumentRole,
      version: data.version as number,
      expirationDate: data.expiration_date
        ? new Date(data.expiration_date as string)
        : undefined,
      isExpired: data.is_expired as boolean,
      isRead: data.is_read as boolean,
      status: data.status as UploadedDocument['status'],
      notes: data.notes as string | undefined,
    };
  }

  /**
   * Maps UploadedDocument to database row
   * Note: Compressed file columns are optional - will be ignored if not in DB
   */
  private mapDocumentToDatabase(
    document: UploadedDocument
  ): Record<string, unknown> {
    const dbDoc: Record<string, unknown> = {
      id: document.id,
      user_id: document.userId,
      document_def_id: document.documentDefId,
      original_filename: document.originalFilename,
      standardized_filename: document.standardizedFilename,
      file_size: document.fileSize,
      mime_type: document.mimeType,
      storage_path: document.storagePath,
      // Metadata
      uploaded_at: document.uploadedAt.toISOString(),
      uploaded_by: document.uploadedBy,
      version: document.version,
      expiration_date: document.expirationDate?.toISOString(),
      is_expired: document.isExpired,
      is_read: document.isRead,
      status: document.status,
      notes: document.notes,
    };

    // Add compressed file info if available (columns may not exist in DB yet)
    if (document.hasCompressedVersion) {
      dbDoc.has_compressed_version = true;
      dbDoc.compressed_filename = document.compressedFilename;
      dbDoc.compressed_file_size = document.compressedFileSize;
      dbDoc.compressed_storage_path = document.compressedStoragePath;
    }

    return dbDoc;
  }

  /**
   * Maps database row to DocumentVaultConfig
   */
  private mapDatabaseToConfig(data: Record<string, unknown>): DocumentVaultConfig {
    return {
      userId: data.user_id as string,
      visaCategory: data.visa_category as VisaCategory,
      scenarioFlags: (data.scenario_flags as Record<string, unknown>) || {},
      caseId: data.case_id as string | undefined,
      petitionerName: data.petitioner_name as string | undefined,
      beneficiaryName: data.beneficiary_name as string | undefined,
      jointSponsorName: data.joint_sponsor_name as string | undefined,
    };
  }
}
