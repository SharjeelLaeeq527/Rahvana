import Tesseract from "tesseract.js";

export async function parse221gLetter(file: File): Promise<string[]> {
  try {
    // Convert file to URL for Tesseract - it can't read File objects directly
    const imageUrl = URL.createObjectURL(file);

    let text: string;
    try {
      const result = await Tesseract.recognize(imageUrl, "eng", {
        logger: (m) => console.log(m), // For debugging
      });
      text = result.data.text;

      // Clean up URL after OCR
      URL.revokeObjectURL(imageUrl);
    } catch (ocrError) {
      // Clean up URL even if OCR fails
      URL.revokeObjectURL(imageUrl);
      throw ocrError;
    }

    // Detect checkboxes and items (simple pattern matching)
    const lines = text.split("\n").map((line) => line.trim());
    const items: string[] = [];
    lines.forEach((line) => {
      if (line.includes("[x]") || line.includes("checked")) {
        // Detect checked boxes
        const item = line.replace(/\[x\]/gi, "").trim().toUpperCase().replace(/\s+/g, "_");
        if (item) items.push(item); // e.g., 'BIRTH_CERT', 'FINANCIAL_DOCUMENTS'
      }
    });

    // Flag blurry if confidence low (Tesseract provides confidence)
    if (text.length < 100) {
      // Simple blurry check (short text = poor scan)
      throw new Error("Blurry scan");
    }

    return items;
  } catch {
    throw new Error("Parsing failed - blurry or invalid file");
  }
}
