/**
 * lib/document-vault/file-encryption.ts
 *
 * SERVER-SIDE ONLY — File-level AES-256-GCM encryption for Document Vault
 *
 * How it works:
 *  1. User uploads a file (PDF, image, etc.)
 *  2. Server derives a unique key: SHA-256(PORTAL_WALLET_SECRET + userId)
 *  3. File bytes are encrypted with AES-256-GCM + random 16-byte IV
 *  4. Encrypted blob is stored in Supabase Storage
 *  5. Owner sees: "x9k2LmN3..." — completely unreadable
 *  6. On download: server decrypts using same key → user gets original file
 *
 * Key Design:
 *  - Per-user derived key → even if you have the master secret,
 *    you need the userId to recreate the key and decrypt
 *  - Random IV per upload → same file uploaded twice looks different
 *  - Auth tag → tamper detection (file can't be silently modified)
 *
 * Format stored in Supabase Storage:
 *  [4 bytes: magic "RVLT"] [1 byte: version=1] [16 bytes: IV]
 *  [16 bytes: authTag] [remaining: ciphertext]
 */

import crypto from 'crypto';

const MAGIC = Buffer.from('RVLT'); // 4 bytes – identifies encrypted files
const VERSION = 1;

/**
 * Derives a 32-byte encryption key unique to each user.
 * Key = SHA-256(masterSecret + ":" + userId)
 *
 * Even if PORTAL_WALLET_SECRET is exposed, the attacker needs
 * each individual userId to decrypt that user's files.
 */
function deriveUserKey(userId: string): Buffer {
  const masterSecret = process.env.PORTAL_WALLET_SECRET;
  if (!masterSecret) {
    throw new Error(
      '[file-encryption] PORTAL_WALLET_SECRET is not set in environment variables'
    );
  }
  return crypto
    .createHash('sha256')
    .update(`${masterSecret}:${userId}`)
    .digest();
}

/**
 * Encrypts a file buffer. Returns an encrypted Buffer.
 *
 * @param fileBuffer  - Raw file bytes (PDF, image, etc.)
 * @param userId      - Owner's Supabase user ID
 * @returns Encrypted buffer ready to store in Supabase Storage
 */
export function encryptFile(fileBuffer: Buffer, userId: string): Buffer {
  const key = deriveUserKey(userId);
  const iv = crypto.randomBytes(16); // fresh random IV every time

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Layout: MAGIC(4) + VERSION(1) + IV(16) + authTag(16) + ciphertext
  return Buffer.concat([
    MAGIC,
    Buffer.from([VERSION]),
    iv,
    authTag,
    ciphertext,
  ]);
}

/**
 * Decrypts an encrypted file buffer. Returns original file bytes.
 *
 * @param encryptedBuffer - Encrypted bytes from Supabase Storage
 * @param userId          - Owner's Supabase user ID
 * @returns Decrypted file buffer
 */
export function decryptFile(encryptedBuffer: Buffer, userId: string): Buffer {
  // Validate header
  const magic = encryptedBuffer.subarray(0, 4);
  if (!magic.equals(MAGIC)) {
    throw new Error(
      '[file-encryption] Invalid file header — not an encrypted Document Vault file'
    );
  }

  const version = encryptedBuffer[4];
  if (version !== VERSION) {
    throw new Error(
      `[file-encryption] Unsupported encryption version: ${version}`
    );
  }

  // Parse layout: MAGIC(4) + VERSION(1) + IV(16) + authTag(16) + ciphertext
  const iv = encryptedBuffer.subarray(5, 21);
  const authTag = encryptedBuffer.subarray(21, 37);
  const ciphertext = encryptedBuffer.subarray(37);

  const key = deriveUserKey(userId);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error(
      '[file-encryption] Decryption failed — file may be tampered or key mismatch'
    );
  }
}

/**
 * Checks whether a buffer is an encrypted Document Vault file.
 * Safe to call on any buffer (no exceptions).
 */
export function isEncryptedFile(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return buffer.subarray(0, 4).equals(MAGIC);
}
