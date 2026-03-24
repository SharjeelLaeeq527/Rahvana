/**
 * lib/encryption.ts
 *
 * Upgraded encryption using Node.js native crypto (AES-256-GCM).
 * AES-256-GCM provides:
 *   - Authenticated encryption (tamper detection via authTag)
 *   - Random IV per encryption (no duplicate ciphertext)
 *   - Far stronger than CryptoJS default ECB mode
 *
 * BACKWARD COMPATIBILITY:
 *   - New data  → encrypted with AES-256-GCM (format: "gcm:<iv>:<tag>:<cipher>")
 *   - Old data  → detected by prefix check and decrypted with legacy CryptoJS
 *   - On next re-save, data will be automatically re-encrypted in the new format
 */

import crypto from 'crypto';
import CryptoJS from 'crypto-js'; // kept ONLY for legacy decryption

const RAW_SECRET = process.env.PORTAL_WALLET_SECRET!;

// Derive a fixed 32-byte key from the env secret using SHA-256
function getDerivedKey(): Buffer {
  return crypto.createHash('sha256').update(RAW_SECRET).digest();
}

// ================================
// ENCRYPT — AES-256-GCM (new)
// ================================
export function encrypt(text: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(16); // fresh random IV every time
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16-byte auth tag

  // Format: "gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
  return `gcm:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// ================================
// DECRYPT — with legacy fallback
// ================================
export function decrypt(cipherText: string): string {
  if (!cipherText) return '';

  // NEW format — AES-256-GCM
  if (cipherText.startsWith('gcm:')) {
    try {
      const parts = cipherText.split(':');
      // parts = ['gcm', iv_hex, authTag_hex, cipher_hex]
      if (parts.length !== 4) throw new Error('Invalid GCM format');

      const key = getDerivedKey();
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const encrypted = Buffer.from(parts[3], 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');
    } catch (err) {
      console.error('[decrypt] GCM decryption failed:', err);
      return '';
    }
  }

  // LEGACY format — CryptoJS AES (old data in DB)
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, RAW_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('[decrypt] Legacy CryptoJS decryption failed:', err);
    return '';
  }
}
