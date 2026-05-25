// Client-side Storage Manager for Document Vault
// Uses localStorage to persist document metadata

import { UploadedDocument, DocumentVaultConfig } from "./types";

/**
 * LocalStorage-based document store (client-side only)
 * Uses localStorage to persist document metadata
 */
export class DocumentStorageClient {
  private storageKey: string;

  constructor(userId: string) {
    this.storageKey = `document_vault_${userId}`;
  }

  /**
   * Gets all documents from localStorage
   */
  getAllDocuments(): UploadedDocument[] {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];

    try {
      const docs = JSON.parse(data);
      // Convert date strings back to Date objects
      return docs.map((doc: UploadedDocument) => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt),
        expirationDate: doc.expirationDate ? new Date(doc.expirationDate) : undefined,
      }));
    } catch (error) {
      console.error("Error parsing documents from localStorage:", error);
      return [];
    }
  }

  /**
   * Saves document metadata to localStorage
   */
  saveDocument(document: UploadedDocument): void {
    if (typeof window === "undefined") return;

    const documents = this.getAllDocuments();
    const existingIndex = documents.findIndex((d) => d.id === document.id);

    if (existingIndex >= 0) {
      documents[existingIndex] = document;
    } else {
      documents.push(document);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(documents));
  }

  /**
   * Deletes document from localStorage
   */
  deleteDocument(documentId: string): void {
    if (typeof window === "undefined") return;

    const documents = this.getAllDocuments();
    const filtered = documents.filter((d) => d.id !== documentId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Gets document by ID
   */
  getDocument(documentId: string): UploadedDocument | undefined {
    return this.getAllDocuments().find((d) => d.id === documentId);
  }

  /**
   * Gets documents by definition ID
   */
  getDocumentsByDefId(documentDefId: string): UploadedDocument[] {
    return this.getAllDocuments().filter((d) => d.documentDefId === documentDefId);
  }

  /**
   * Updates document status
   */
  updateDocumentStatus(documentId: string, status: UploadedDocument["status"]): void {
    const doc = this.getDocument(documentId);
    if (doc) {
      doc.status = status;
      this.saveDocument(doc);
    }
  }

  /**
   * Stores vault configuration
   */
  saveVaultConfig(config: DocumentVaultConfig): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(`vault_config_${config.userId}`, JSON.stringify(config));
  }

  /**
   * Gets vault configuration
   */
  getVaultConfig(userId: string): DocumentVaultConfig | null {
    if (typeof window === "undefined") return null;

    const data = localStorage.getItem(`vault_config_${userId}`);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Error parsing vault config:", error);
      return null;
    }
  }

  /**
   * Clears all vault data for user
   */
  clearAllData(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.storageKey);
  }
}

/**
 * Helper function to create unique document ID
 */
export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper function to determine next version number
 */
export function getNextVersionNumber(existingDocuments: UploadedDocument[]): number {
  if (existingDocuments.length === 0) return 1;

  const versions = existingDocuments.map((d) => d.version);
  return Math.max(...versions) + 1;
}
