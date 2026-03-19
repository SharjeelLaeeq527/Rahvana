"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "purpose", title: "1. Purpose" },
  { id: "permitted", title: "2. Permitted Uses" },
  { id: "prohibited", title: "3. Prohibited Activities" },
  { id: "account-sharing", title: "4. Account Sharing" },
  { id: "reporting", title: "5. Reporting Violations" },
  { id: "enforcement", title: "6. Enforcement" },
  { id: "contact", title: "7. Contact" },
];

export default function AcceptableUse() {
  const [activeSection, setActiveSection] = useState("purpose");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-16">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Acceptable Use Policy</span>
          </div>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-1.5 text-teal-700 text-xs font-semibold mb-6 uppercase tracking-wider">
              Legal Document
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Acceptable Use Policy</h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              These guidelines define how Rahvana may and may not be used. Violations may result in account suspension or termination.
            </p>
            <div className="flex flex-wrap gap-6 mt-6 text-sm text-slate-500">
              <span>Effective Date: <span className="text-slate-900 font-medium">March 17, 2026</span></span>
              <span>Applies to: <span className="text-slate-900 font-medium">rahvana.com</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex gap-12 max-w-6xl mx-auto">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contents</p>
              <nav className="flex flex-col gap-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-all font-medium ${
                      activeSection === s.id
                        ? "bg-teal-50 text-teal-700 border-l-4 border-teal-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 hover:bg-white"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 max-w-3xl">
            <div className="prose prose-slate max-w-none
              prose-headings:text-slate-900 prose-headings:font-bold
              prose-p:text-slate-600 prose-p:leading-relaxed
              prose-li:text-slate-600 prose-strong:text-slate-900
              prose-a:text-teal-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline">

              <Section id="purpose" title="1. Purpose">
                <p>This Acceptable Use Policy ("AUP") outlines the rules and guidelines for using Rahvana's immigration roadmap platform. By using our services, you agree to comply with this AUP. Violations may result in account suspension or termination.</p>
              </Section>

              <Section id="permitted" title="2. Permitted Uses">
                <p>Rahvana is designed for:</p>
                <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                  {[
                    "Personal immigration journey tracking and planning",
                    "Organizing documents for various US visa categories and related processes",
                    "Accessing educational immigration resources and guides",
                    "Tracking checklist progress for personal immigration cases",
                  ].map((use) => (
                    <div key={use} className="flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                        <span className="text-teal-600 font-bold text-xs">✓</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{use}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="prohibited" title="3. Prohibited Activities">
                <h3 className="text-base font-bold text-slate-900 mt-6 mb-3">3.1 Legal Violations</h3>
                <div className="not-prose space-y-3 mb-8">
                  {[
                    "Using the platform for any illegal purpose under applicable law",
                    "Submitting false or fraudulent immigration information",
                    "Impersonating USCIS, NVC, or any government agency",
                    "Using the platform to facilitate unauthorized immigration advice for compensation",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
                      <span className="text-red-500 font-bold text-base mt-0.5 shrink-0">✕</span>
                      <p className="text-sm text-red-900 font-medium leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-6 mb-3">3.2 Platform Abuse</h3>
                <div className="not-prose space-y-3 mb-8">
                  {[
                    "Attempting to gain unauthorized access to other user accounts",
                    "Probing, scanning, or testing the vulnerability of our systems",
                    "Introducing malware, viruses, or malicious code",
                    "Attempting to overload our servers through automated requests",
                    "Scraping or harvesting our proprietary content or user data",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
                      <span className="text-red-500 font-bold text-base mt-0.5 shrink-0">✕</span>
                      <p className="text-sm text-red-900 font-medium leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-6 mb-3">3.3 Content Violations</h3>
                <div className="not-prose space-y-3">
                  {[
                    "Uploading content that infringes third-party intellectual property",
                    "Sharing personal information of others without consent",
                    "Distributing offensive, harassing, or abusive content",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
                      <span className="text-red-500 font-bold text-base mt-0.5 shrink-0">✕</span>
                      <p className="text-sm text-red-900 font-medium leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="account-sharing" title="4. Account Sharing">
                <div className="not-prose bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm font-bold text-amber-900 mb-3 uppercase tracking-wide">Account Sharing is Prohibited</p>
                  <p className="text-sm text-amber-800 leading-relaxed font-medium">Rahvana subscriptions are for individual use only. Sharing account credentials is prohibited. Each user must have their own account. If we detect account sharing, we reserve the right to suspend or terminate the account without refund.</p>
                </div>
              </Section>

              <Section id="reporting" title="5. Reporting Violations">
                <p>If you become aware of any violation of this AUP, please report it to us at: <a href="mailto:legal@rahvana.com">legal@rahvana.com</a>. We take all reports seriously and will investigate promptly.</p>
              </Section>

              <Section id="enforcement" title="6. Enforcement">
                <p>Violations of this AUP may result in:</p>
                <div className="not-prose space-y-4 my-6">
                  {[
                    { step: "01", action: "Warning", desc: "Request to remedy the violation immediately" },
                    { step: "02", action: "Suspension", desc: "Temporary suspension of account access" },
                    { step: "03", action: "Termination", desc: "Permanent account termination without refund" },
                    { step: "04", action: "Legal Action", desc: "Referral to law enforcement where warranted" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-6 bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
                      <span className="text-sm font-bold font-mono text-slate-400 w-8 shrink-0">{item.step}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 mb-0.5">{item.action}</p>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="contact" title="7. Contact">
                <ContactCard />
              </Section>
            </div>

            <LegalNav current="acceptable-use" />
          </main>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 whitespace-nowrap">{title}</h2>
        <div className="h-0.5 flex-1 bg-slate-100" />
      </div>
      {children}
    </section>
  );
}

function ContactCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm not-prose">
      <p className="text-sm font-bold text-slate-900 mb-2">Rahvana Legal Team</p>
      <div className="space-y-1.5">
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-50" />
          Email: <a href="mailto:legal@rahvana.com" className="text-teal-600 hover:underline font-medium">legal@rahvana.com</a>
        </p>
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-50" />
          Website: <a href="https://rahvana.com" className="text-teal-600 hover:underline font-medium">rahvana.com</a>
        </p>
      </div>
    </div>
  );
}

function LegalNav({ current }: { current: string }) {
  const pages = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookie-policy", label: "Cookie Policy" },
    { href: "/acceptable-use", label: "Acceptable Use" },
  ];
  return (
    <div className="mt-16 pt-8 border-t border-slate-200">
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Other Legal Documents</p>
      <div className="flex flex-wrap gap-4">
        {pages.filter((p) => !p.href.includes(current)).map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:text-teal-700 transition-all shadow-sm hover:shadow-md"
          >
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
