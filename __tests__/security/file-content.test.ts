jest.mock("file-type", () => ({
  fileTypeFromBuffer: jest.fn(async (buffer: Uint8Array) => {
    const bytes = Array.from(buffer);

    // PDF
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return {
        ext: "pdf",
        mime: "application/pdf",
      };
    }

    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return {
        ext: "png",
        mime: "image/png",
      };
    }

    // JPEG
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return {
        ext: "jpg",
        mime: "image/jpeg",
      };
    }

    return undefined;
  }),
}));

import { validateUploadedFile } from "@/lib/security/file-content";
import { UPLOAD_PROFILES } from "@/lib/security/upload-limits";

function fileFromBytes(name: string, bytes: Uint8Array, type = "application/octet-stream") {
  return new File([bytes], name, { type });
}

const PDF_BYTES = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a,
]);

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

describe("validateUploadedFile", () => {
  it("rejects empty files", async () => {
    const result = await validateUploadedFile(
      fileFromBytes("empty.pdf", new Uint8Array()),
      UPLOAD_PROFILES.vault
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects files over the profile size cap", async () => {
    const oversized = fileFromBytes("big.pdf", PDF_BYTES);
    Object.defineProperty(oversized, "size", { value: UPLOAD_PROFILES.ocrReceipt.maxBytes + 1 });
    const result = await validateUploadedFile(oversized, UPLOAD_PROFILES.ocrReceipt);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects a text file renamed to .pdf (magic-byte fail)", async () => {
    const fakePdf = fileFromBytes(
      "passport.pdf",
      new TextEncoder().encode("hello world"),
      "application/pdf"
    );
    const result = await validateUploadedFile(fakePdf, UPLOAD_PROFILES.vault);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(415);
  });

  it("rejects an executable renamed to .pdf", async () => {
    const mz = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ header
    const result = await validateUploadedFile(
      fileFromBytes("passport.pdf", mz, "application/pdf"),
      UPLOAD_PROFILES.vault
    );
    expect(result.ok).toBe(false);
  });

  it("accepts a real PDF for vault / translation profiles", async () => {
    const file = fileFromBytes("doc.pdf", PDF_BYTES, "application/pdf");
    const vault = await validateUploadedFile(file, UPLOAD_PROFILES.vault);
    expect(vault.ok).toBe(true);
    if (vault.ok) expect(vault.detectedMime).toBe("application/pdf");
  });

  it("accepts JPEG/PNG for OCR extract but not random bytes", async () => {
    const jpeg = await validateUploadedFile(
      fileFromBytes("p.jpg", JPEG_BYTES, "image/jpeg"),
      UPLOAD_PROFILES.ocrExtract
    );
    const png = await validateUploadedFile(
      fileFromBytes("p.png", PNG_BYTES, "image/png"),
      UPLOAD_PROFILES.ocrExtract
    );
    expect(jpeg.ok).toBe(true);
    expect(png.ok).toBe(true);
  });

  it("rejects JPEG on the translation profile (PDF only)", async () => {
    const result = await validateUploadedFile(
      fileFromBytes("scan.jpg", JPEG_BYTES, "image/jpeg"),
      UPLOAD_PROFILES.translation
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(415);
  });
});
