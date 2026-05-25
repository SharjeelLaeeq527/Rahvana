// lib/imageProcessor.ts
// Yeh file ab bilkul perfect hai — No JSX, No Error, Sab Functions + Class Export

interface ProcessingOptions {
  threshold?: number;
  contrast?: number;
  darknessFactor?: number;
  noiseReduction?: boolean;
  edgeSmoothing?: boolean;
  aggressiveMode?: boolean;
}

// ========================
// 1. Main Processor Class
// ========================
export class SignatureImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    const context = this.canvas.getContext("2d", { willReadFrequently: true, alpha: true });
    if (!context) throw new Error("Failed to get canvas context");
    this.ctx = context;
  }

  async processImage(imageData: string, options: ProcessingOptions = {}): Promise<string> {
    const {
      threshold = 160,
      contrast = 2.0,
      darknessFactor = 0.5,
      noiseReduction = true,
      edgeSmoothing = true,
      aggressiveMode = true,
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);

          let imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

          this.advancedBackgroundRemoval(
            imgData.data,
            threshold,
            contrast,
            darknessFactor,
            aggressiveMode
          );

          if (noiseReduction) {
            imgData = this.aggressiveNoiseReduction(imgData, this.canvas.width, this.canvas.height);
          }

          imgData = this.removeIsolatedPixels(imgData, this.canvas.width, this.canvas.height);
          imgData = this.cleanEdges(imgData, this.canvas.width, this.canvas.height);

          this.ctx.putImageData(imgData, 0, 0);

          if (edgeSmoothing) this.applyAdvancedSmoothing();

          resolve(this.canvas.toDataURL("image/png"));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageData;
    });
  }

  private advancedBackgroundRemoval(
    data: Uint8ClampedArray,
    threshold: number,
    contrast: number,
    darknessFactor: number,
    aggressive: boolean
  ): void {
    const adjustedThreshold = aggressive ? threshold - 20 : threshold;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let enhanced = (gray - 128) * contrast + 128;
      enhanced = Math.max(0, Math.min(255, enhanced));

      if (enhanced > adjustedThreshold) {
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = 0; // transparent background
      } else {
        const darkValue = enhanced * darknessFactor;
        const finalDark = Math.max(0, darkValue * 0.8);
        data[i] = data[i + 1] = data[i + 2] = finalDark;
        data[i + 3] = 255;
      }
    }
  }

  private aggressiveNoiseReduction(imgData: ImageData, w: number, h: number): ImageData {
    let data = imgData.data;
    for (let pass = 0; pass < 3; pass++) {
      const copy = new Uint8ClampedArray(data);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (y * w + x) * 4;
          if (data[i + 3] === 0) continue;
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              if (dx || dy) {
                const ni = ((y + dy) * w + (x + dx)) * 4;
                if (data[ni + 3] > 0) neighbors++;
              }
          if (neighbors < 3) copy[i + 3] = 0;
        }
      }
      data = copy;
    }
    return new ImageData(data, w, h);
  }

  private removeIsolatedPixels(imgData: ImageData, w: number, h: number): ImageData {
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);
    for (let y = 2; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] === 0) continue;
        let connected = false;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (Math.abs(dx) + Math.abs(dy) >= 2) {
              const ni = ((y + dy) * w + (x + dx)) * 4;
              if (data[ni + 3] > 0) {
                connected = true;
                break;
              }
            }
        if (!connected) copy[i + 3] = 0;
      }
    return new ImageData(copy, w, h);
  }

  private cleanEdges(imgData: ImageData, w: number, h: number): ImageData {
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] === 0) continue;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        let darkCount = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const ni = ((y + dy) * w + (x + dx)) * 4;
            if (data[ni + 3] > 0 && data[ni] < 100) darkCount++;
          }
        if (brightness > 50 && darkCount < 3) copy[i + 3] = 0;
      }
    return new ImageData(copy, w, h);
  }

  private applyAdvancedSmoothing(): void {
    this.ctx.filter = "blur(0.3px)";
    const temp = document.createElement("canvas");
    temp.width = this.canvas.width;
    temp.height = this.canvas.height;
    const tctx = temp.getContext("2d", { alpha: true });
    if (tctx) {
      // Ensure transparent background
      tctx.clearRect(0, 0, temp.width, temp.height);
      tctx.drawImage(this.canvas, 0, 0);
      this.ctx.filter = "none";
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(temp, 0, 0);
    }
  }

  destroy(): void {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}

// ========================
// 2. Utility Functions (Yeh wahi jo error de rahe the)
// ========================

export const validateImageFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Please upload an image file" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "Image must be under 10MB" };
  }
  return { valid: true };
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const downloadImage = (dataURL: string, filename: string) => {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
