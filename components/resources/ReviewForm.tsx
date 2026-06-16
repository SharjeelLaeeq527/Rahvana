"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

const GOLD = "#d99a00";

/**
 * "Write a review" island for /resources/[slug]. Lets a signed-in user submit
 * (or edit) their review for the tool. Reviews are moderated, so on success we
 * tell the user it's pending approval rather than showing it live.
 */
export default function ReviewForm({
  slug,
  accent,
  tint,
}: {
  slug: string;
  accent: string;
  tint: string;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (isLoading) return null;

  // Signed-out: prompt to sign in, preserving return path.
  if (!user) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full border px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
        style={{ borderColor: accent, color: accent }}
      >
        Sign in to write a review
      </Link>
    );
  }

  if (done) {
    return (
      <div
        className="mt-6 rounded-2xl border p-4 text-[13px] leading-relaxed"
        style={{ borderColor: `${accent}40`, backgroundColor: tint }}
      >
        <p className="text-foreground/90">
          Thanks — your review was submitted and is <strong>pending approval</strong>. It&apos;ll
          appear here once our team reviews it.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: accent }}
      >
        Write a review
      </button>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    if (rating < 1) {
      setError("Please pick a star rating.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug: slug,
          rating,
          body: body.trim(),
          location: location.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background p-5">
      <p className="text-[13.5px] font-semibold text-foreground">Write your review</p>

      {/* Star picker */}
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1;
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="text-[26px] leading-none transition-transform hover:scale-110"
              style={{ color: active ? GOLD : "#d6d6d6" }}
            >
              ★
            </button>
          );
        })}
        {rating > 0 && (
          <span className="ml-1.5 text-[12.5px] font-medium text-muted-foreground">
            {rating} / 5
          </span>
        )}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder="Share how this tool helped your case…"
        className="mt-4 w-full resize-y rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13.5px] leading-relaxed outline-none transition focus:border-foreground/30"
      />
      <div className="mt-1 text-right text-[11px] text-muted-foreground">{body.length}/2000</div>

      {error && <p className="mt-2 text-[12.5px] font-medium text-red-600">{error}</p>}

      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        maxLength={80}
        placeholder="Your city or role (optional, e.g. Lahore)"
        className="mt-3 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13.5px] outline-none transition focus:border-foreground/30"
      />

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="rounded-full px-4 py-2.5 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
        Reviews are checked by our team before they appear publicly.
      </p>
    </div>
  );
}
