"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/app/components/shared/ToastProvider";
import { BookOpen, Send, Mail, Users } from "lucide-react";

interface BlogAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ArticleSummary {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  heroImage?: string;
}

export function BlogAnnouncementModal({ open, onOpenChange }: BlogAnnouncementModalProps) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeSubscribers, setActiveSubscribers] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const { showToast } = useToast();

  const selectedArticle = articles.find((a) => a.slug === selectedSlug);

  useEffect(() => {
    if (open) {
      fetch("/api/admin/announce-blog")
        .then((res) => res.json())
        .then((data) => {
          if (data.articles) setArticles(data.articles);
          if (typeof data.activeSubscribers === "number") setActiveSubscribers(data.activeSubscribers);
        })
        .catch(console.error);
    }
  }, [open]);

  const handleArticleSelect = (slug: string) => {
    setSelectedSlug(slug);
    const chosen = articles.find((a) => a.slug === slug);
    if (chosen) {
      setTitle(chosen.title);
      setDescription("");
    }
  };

  const handleBroadcast = async (isTestOnly = false) => {
    if (!selectedSlug) {
      showToast("Please select an article to broadcast", "error");
      return;
    }

    if (isTestOnly) setIsTestLoading(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/admin/announce-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          customTitle: title || undefined,
          customDescription: description || undefined,
          isTestOnly,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        if (!isTestOnly) onOpenChange(false);
      } else {
        showToast(data.error || "Broadcast failed", "error");
      }
    } catch {
      showToast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
      setIsTestLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95%] max-h-[90vh] flex flex-col bg-background overflow-hidden rounded-2xl p-0">
        <div className="relative w-full overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="h-4 w-4" />
              <span>Knowledge Center Newsletter</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mt-1">Broadcast Guide to Subscribers</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Send an email update about a published blog guide. Emails are sent <strong>only to active blog subscribers</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 px-4 py-2.5 text-xs text-teal-800 dark:text-teal-300">
            <Users className="h-4 w-4 shrink-0" />
            <span>Target Audience: <strong>{activeSubscribers}</strong> active blog subscriber(s).</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Select Published Guide</label>
              <select
                value={selectedSlug}
                onChange={(e) => handleArticleSelect(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                <option value="">-- Choose an article from Knowledge Center --</option>
                {articles.map((art) => (
                  <option key={art.slug} value={art.slug}>
                    [{art.category}] {art.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedArticle?.heroImage && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Article Image Preview</label>
                <div className="relative h-28 w-full overflow-hidden rounded-xl border border-border bg-muted/30">
                  <img
                    src={selectedArticle.heroImage}
                    alt={selectedArticle.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Subject / Headline</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Email headline"
                className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Custom Summary / Takeaway (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Leave blank to use the article's default BLUF / summary..."
                className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => handleBroadcast(true)}
                disabled={isTestLoading || !selectedSlug}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                <span>{isTestLoading ? "Sending test..." : "Send Test to My Email"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleBroadcast(false)}
                  disabled={loading || !selectedSlug || activeSubscribers === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0d4f49] hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{loading ? "Broadcasting..." : `Send to ${activeSubscribers} Subscribers`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
