"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/app/components/shared/ToastProvider";

interface FeatureAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureAnnouncementModal({ open, onOpenChange }: FeatureAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [featureUrl, setFeatureUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!title || !description || !featureUrl) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/announce-feature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, featureUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message, "success");
      } else {
        showToast("Failed to notify users", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to notify users", "error");
    } finally {
      setLoading(false);
      setTitle("");
      setDescription("");
      setFeatureUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95%] bg-background overflow-hidden rounded-2xl p-0">
        <div className="relative w-full overflow-hidden px-8 py-10 guide-grid-bg">
          {/* Background Blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full bg-secondary/10 blur-2xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Announce New Feature</h2>
              <p className="text-muted-foreground mt-2">
                Inform users about newly launched features or improvements.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Feature Title</label>
                <input
                  type="text"
                  placeholder="e.g. Smart Visa Eligibility Checker"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={4}
                  placeholder="Explain what this feature does and why users should try it..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                />
              </div>

              {/* Feature URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Feature URL</label>
                <input
                  type="url"
                  placeholder="https://www.rahvana.com/new-feature"
                  value={featureUrl}
                  onChange={(e) => setFeatureUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-md hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {loading ? "Publishing..." : "Publish Announcement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
