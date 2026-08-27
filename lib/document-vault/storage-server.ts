// Server-side File Storage Manager for Document Vault
// Handles actual file I/O operations (SERVER-SIDE ONLY)

import { getRelativeStoragePath } from "./file-utils";
import fs from "fs/promises";
import path from "path";
import { createClient as createClientJs } from "@supabase/supabase-js";
import { decryptFile } from "./file-encryption";

function getStorageSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClientJs(supabaseUrl, serviceRoleKey);
}

/**
 * Server-side file storage manager
 * Handles actual file I/O operations
 * NOTE: This file should ONLY be imported in API routes (server-side)
 */
export class DocumentFileManager {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), "uploads", "document-vault");
  }

  /**
   * Saves uploaded file to local filesystem
   */
  async saveFile(
    file: File | Buffer,
    userId: string,
    documentId: string,
    standardizedFilename: string
  ): Promise<{ success: boolean; storagePath?: string; error?: string }> {
    try {
      // Ensure directory exists
      const dirPath = path.join(this.uploadsDir, userId, documentId);
      await fs.mkdir(dirPath, { recursive: true });

      // Full file path
      const filePath = path.join(dirPath, standardizedFilename);

      // Write file
      if (Buffer.isBuffer(file)) {
        await fs.writeFile(filePath, file);
      } else {
        // File is a browser File object
        const buffer = Buffer.from(await (file as File).arrayBuffer());
        await fs.writeFile(filePath, buffer);
      }

      // Return relative path for database storage
      const relativePath = getRelativeStoragePath(userId, documentId, standardizedFilename);

      return { success: true, storagePath: relativePath };
    } catch (error) {
      console.error("Error saving file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Reads file from filesystem
   */
  async readFile(
    storagePath: string,
    userId: string
  ): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    try {
      const supabase = getStorageSupabase();
  
      const { data, error } = await supabase.storage
        .from("document-vault")
        .download(storagePath);
  
      if (error || !data) {
        return {
          success: false,
          error: error?.message ?? "File not found",
        };
      }
  
      const encryptedBuffer = Buffer.from(await data.arrayBuffer());
  
      const decryptedBuffer = decryptFile(encryptedBuffer, userId);
  
      return {
        success: true,
        buffer: decryptedBuffer,
      };
    } catch (error) {
      console.error("Error reading file:", error);
  
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Deletes file from filesystem
   */
  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), "uploads", storagePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Lists all files for a user
   */
  async listUserFiles(userId: string): Promise<string[]> {
    try {
      const userDir = path.join(this.uploadsDir, userId);
      const files: string[] = [];

      const walk = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else {
            const relativePath = path.relative(this.uploadsDir, fullPath);
            files.push(relativePath);
          }
        }
      };

      await walk(userDir);
      return files;
    } catch (error) {
      console.error("Error listing user files:", error);
      return [];
    }
  }

  /**
   * Gets file size
   */
  async getFileSize(storagePath: string): Promise<number> {
    try {
      const fullPath = path.join(process.cwd(), "uploads", storagePath);
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Checks if file exists
   */
  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), "uploads", storagePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copies file to new location
   */
  async copyFile(sourceStoragePath: string, targetStoragePath: string): Promise<boolean> {
    try {
      const sourcePath = path.join(process.cwd(), "uploads", sourceStoragePath);
      const targetPath = path.join(process.cwd(), "uploads", targetStoragePath);

      // Ensure target directory exists
      await fs.mkdir(path.dirname(targetPath), { recursive: true });

      await fs.copyFile(sourcePath, targetPath);
      return true;
    } catch (error) {
      console.error("Error copying file:", error);
      return false;
    }
  }

  /**
   * Gets total storage used by user (in bytes)
   */
  async getUserStorageSize(userId: string): Promise<number> {
    try {
      const files = await this.listUserFiles(userId);
      let totalSize = 0;

      for (const file of files) {
        const size = await this.getFileSize(file);
        totalSize += size;
      }

      return totalSize;
    } catch (error) {
      console.error("Error calculating storage size:", error);
      return 0;
    }
  }

  /**
   * Cleans up orphaned files (files without metadata)
   */
  async cleanupOrphanedFiles(userId: string, validStoragePaths: string[]): Promise<number> {
    try {
      const allFiles = await this.listUserFiles(userId);
      let deletedCount = 0;

      for (const file of allFiles) {
        if (!validStoragePaths.includes(file)) {
          const deleted = await this.deleteFile(file);
          if (deleted) deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up orphaned files:", error);
      return 0;
    }
  }
}
