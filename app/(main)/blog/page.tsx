import React from "react";
import { ARTICLES } from "@/data/articles";
import BlogSearchSection from "@/components/blog/BlogSearchSection";
import BlogHero from "@/components/blog/BlogHero";
import BlogToolsCTA from "@/components/blog/BlogToolsCTA";
import BlogNewsletterCTA from "@/components/blog/BlogNewsletterCTA";

export const metadata = {
  title: "Rahvana Immigration Blog & Guides | U.S. Visa Research & Consular Insights",
  description:
    "Expert U.S. immigration guides for IR-1, CR-1, and IR-5 visas in Pakistan. Complete NVC document checklists, NADRA Nikah Nama rules, and US Embassy Islamabad interview guides.",
  openGraph: {
    title: "Rahvana Immigration Blog & Guides",
    description:
      "Actionable U.S. spouse and parent visa guides optimized for Pakistani applicants and U.S. Citizen sponsors.",
    images: ["/assets/images/about-card-1.png"],
  },
};

export default function BlogIndexPage() {
  return (
    <div className="bg-background text-foreground min-h-screen pt-[55px] pb-20">
      {/* ── Knowledge Center Hero Banner ── */}
      <BlogHero />

      {/* ── Main Content Container ── */}
      <div className="py-8">
        {/* Search, Popular Searches, Feature Badges, Categories & Articles */}
        <BlogSearchSection articles={ARTICLES} />

        {/* ── Tools CTA Banner ── */}
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 mt-12">
          <BlogToolsCTA />
        </div>

        {/* ── Newsletter Subscription Banner ── */}
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 mt-8">
          <BlogNewsletterCTA />
        </div>
      </div>
    </div>
  );
}

