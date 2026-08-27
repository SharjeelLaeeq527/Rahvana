"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/ui/spinner";
import type { PassportFields } from "@/lib/document-ocr/passportParser";
import { crossCheckPassport, type CrossCheckResult } from "@/lib/document-ocr/crossCheck";

// OCR.space free tier rejects files > 1MB, so we downscale large images first.
const FILE_LIMIT_BYTES = 1 * 1024 * 1024;

const FIELD_ORDER: { key: keyof PassportFields; label: string }[] = [
  { key: "name.first", label: "Given name" },
  { key: "name.last", label: "Surname" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "nationality", label: "Nationality" },
  { key: "passportNumber", label: "Passport number" },
  { key: "passportExpiry", label: "Passport expiry" },
  { key: "passportCountry", label: "Issuing country" },
];

type ExtractResponse = {
  docType: string;
  fields: PassportFields;
  confidence: Partial<Record<keyof PassportFields, number>>;
  source: string;
  warnings: string[];
  error?: string;
};

/** Read a MasterProfile dot-path ("name.first") out of a profile_details blob. */
function readPath(obj: Record<string, unknown> | null, path: string): string {
  if (!obj) return "";
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[key];
    else return "";
  }
  return cur == null ? "" : String(cur);
}

/** Downscale an image File on the client so it fits under the OCR size limit. */
async function resizeImageIfNeeded(file: File): Promise<File> {
  if (file.size <= FILE_LIMIT_BYTES || !file.type.startsWith("image/")) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const maxDim = 1600;
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  // Step quality down until under the limit.
  for (const quality of [0.8, 0.6, 0.45, 0.3]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (blob && blob.size <= FILE_LIMIT_BYTES) {
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    }
  }
  return file; // best effort — server will reject if still too big
}

export interface PassportOcrToolProps {
  /** Render without the outer Card chrome (e.g. inside a Dialog/modal). */
  embedded?: boolean;
  /** Called after fields are successfully saved to the profile. */
  onSaved?: (fields: PassportFields) => void;
}

export default function PassportOcrTool({ embedded = false, onSaved }: PassportOcrToolProps = {}) {
  const [storedDetails, setStoredDetails] = useState<Record<string, unknown> | null>(null);
  const [fields, setFields] = useState<PassportFields>({});
  const [confidence, setConfidence] = useState<ExtractResponse["confidence"]>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [crossCheck, setCrossCheck] = useState<CrossCheckResult | null>(null);

  const [fileName, setFileName] = useState<string>("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing profile values once, so we can cross-check what we extract.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const json = await res.json();
        const details = json?.profile?.profile_details;
        if (!cancelled && details && typeof details === "object") {
          setStoredDetails(details as Record<string, unknown>);
        }
      } catch {
        /* non-fatal: cross-check just won't have a baseline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function runCrossCheck(extracted: PassportFields) {
    const stored: Partial<Record<keyof PassportFields, string>> = {};
    for (const { key } of FIELD_ORDER) {
      const val = readPath(storedDetails, key);
      if (val) stored[key] = val;
    }
    setCrossCheck(crossCheckPassport(extracted, stored));
  }

  async function handleFile(file: File) {
    setError(null);
    setSaved(false);
    setOcrLoading(true);
    setFileName(file.name);
    try {
      const prepared = await resizeImageIfNeeded(file);

      const formData = new FormData();
      formData.append("file", prepared, prepared.name);

      const res = await fetch("/api/documents/extract-passport", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json().catch(() => null)) as ExtractResponse | null;

      if (!res.ok || !json) {
        setError(json?.error || "Could not read this passport. Please try a clearer photo.");
        return;
      }

      setFields(json.fields || {});
      setConfidence(json.confidence || {});
      setWarnings(json.warnings || []);
      setHasResult(true);
      runCrossCheck(json.fields || {});
    } catch {
      setError("Something went wrong while processing the image.");
    } finally {
      setOcrLoading(false);
    }
  }

  function updateField(key: keyof PassportFields, value: string) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      runCrossCheck(next);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || "Could not save to your profile.");
        return;
      }
      setSaved(true);
      // Reflect the new values as the stored baseline for future cross-checks.
      setStoredDetails((prev) => {
        const next = { ...(prev || {}) } as Record<string, unknown>;
        for (const { key } of FIELD_ORDER) {
          const v = fields[key];
          if (!v) continue;
          if (key.includes(".")) {
            const [a, b] = key.split(".");
            const parent = (next[a] as Record<string, unknown>) || {};
            next[a] = { ...parent, [b]: v };
          } else {
            next[key] = v;
          }
        }
        return next;
      });
      setCrossCheck(null);
      onSaved?.(fields);
    } catch {
      setError("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const body = (
    <div className="space-y-6">
      {/* Upload zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <p className="text-sm text-muted-foreground">
            {fileName ? `Selected: ${fileName}` : "Click or drag a passport image / PDF here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Large images are automatically resized.
          </p>
        </div>

        {ocrLoading && <Loader size="md" text="Reading passport..." />}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t read it</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mismatch warning vs stored profile */}
        {crossCheck && crossCheck.mismatches.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Some details don&apos;t match your saved profile</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                {crossCheck.mismatches.map((m) => (
                  <li key={m.key}>
                    <strong>{m.label}:</strong> passport says &ldquo;{m.newValue}&rdquo;, saved
                    value is &ldquo;{m.oldValue}&rdquo;. Please confirm which is correct.
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* OCR confidence / missing-field warnings */}
        {hasResult && warnings.length > 0 && (
          <Alert>
            <AlertTitle>Please double-check these</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Editable fields */}
        {hasResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELD_ORDER.map(({ key, label }) => {
                const conf = confidence[key];
                return (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key} className="flex items-center gap-2">
                      {label}
                      {typeof conf === "number" && conf < 0.6 && (
                        <span className="text-xs text-amber-600">(low confidence)</span>
                      )}
                    </Label>
                    <Input
                      id={key}
                      value={fields[key] ?? ""}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  </div>
                );
              })}
            </div>

            {saved && (
              <Alert>
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>Details saved to your profile.</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Confirm & Save to Profile"}
              </Button>
            </div>
          </div>
        )}
    </div>
  );

  if (embedded) return body;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Passport Auto-Fill</CardTitle>
        <CardDescription>
          Upload a clear photo or scan of the passport. We&apos;ll read the details and let you
          confirm before saving. Nothing is submitted automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
