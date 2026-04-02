"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "acceptance", title: "1. Acceptance" },
  { id: "service", title: "2. Our Service" },
  { id: "payments", title: "3. Payments & Account" },
  { id: "rules", title: "4. Your Responsibilities" },
  { id: "liability", title: "5. Liability" },
  { id: "updates", title: "6. Updates" },
  { id: "contact", title: "7. Contact" },
];

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState("acceptance");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="site-main-px site-main-py">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
            <Link href="/" className="hover:text-teal-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-600">Terms of Service</span>
          </div>
          <div className="">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium mb-5">
              Legal Document
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              By using Rahvana, you agree to these terms.
            </p>
            <div className="flex flex-wrap gap-6 mt-5 text-sm text-gray-400">
              <span>
                Effective Date:{" "}
                <span className="text-gray-700 font-medium">
                  March 17, 2026
                </span>
              </span>
              <span>
                Applies to:{" "}
                <span className="text-gray-700 font-medium">rahvana.com</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="site-main-px site-main-py">
        <div className="flex gap-10">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Contents
              </p>
              <nav className="flex flex-col gap-0.5">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${
                      activeSection === s.id
                        ? "bg-teal-50 text-teal-700 border-l-2 border-teal-600 font-medium"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 w-full">
            <div
              className="prose prose-gray max-w-none w-full
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-li:text-gray-700 prose-strong:text-gray-800
              prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline"
            >
              <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-10">
                <span className="text-amber-500 mt-0.5">⚠️</span>
                <p className="text-sm text-amber-700">
                  <strong>Disclaimer:</strong> Rahvana is not a law firm and
                  does not provide legal advice. Consult a licensed immigration
                  attorney for legal guidance.
                </p>
              </div>

              <Section id="acceptance" title="1. Acceptance">
                <p>
                  By accessing or using Rahvana at{" "}
                  <a href="https://rahvana.com">rahvana.com</a>, you agree to
                  these Terms of Service. If you do not agree, please do not use
                  our platform.
                </p>
              </Section>

              <Section id="service" title="2. Our Service">
                <p>
                  Rahvana provides immigration roadmaps, checklists, and tools
                  for various US visa categories and related processes. It is an
                  informational platform only — not legal advice.
                </p>
              </Section>

              <Section id="payments" title="3. Payments & Account">
                <p>
                  Access to basic Rahvana tools is currently free.{" "}
                  <strong>Rahvana Plus</strong> is a premium yearly
                  subscription. All payments are processed securely by Stripe.
                  You may cancel your subscription at any time from your account
                  settings. To permanently close your account and delete your
                  data, please contact{" "}
                  <a href="mailto:support@rahvana.com">support@rahvana.com</a>.
                  For billing questions, reach out to our support team.
                </p>
              </Section>

              <Section id="rules" title="4. Your Responsibilities">
                <p>
                  Use Rahvana only for personal, lawful immigration purposes. Do
                  not share your account, attempt to reverse-engineer the
                  platform, or use it to offer paid immigration services to
                  others.
                </p>
              </Section>

              <Section id="liability" title="5. Liability">
                <p>
                  Rahvana is provided "as is." We are not liable for immigration
                  application outcomes or visa denials. Our total liability is
                  limited to amounts you paid in the 12 months prior to any
                  claim. These Terms are governed by the laws of Delaware,
                  United States.
                </p>
              </Section>

              <Section id="updates" title="6. Updates to Terms">
                <p>
                  We may update these terms from time to time. We will notify
                  you of any significant changes and obtain active consent
                  before they apply to you. We will also provide a
                  plain-language summary of what has changed.
                </p>
              </Section>

              <Section id="contact" title="7. Contact">
                <ContactCard />
              </Section>
            </div>
            <LegalNav current="terms" />
          </main>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      {children}
    </section>
  );
}

function ContactCard() {
  return (
    <div className="bg-teal-50 border border-teal-100 rounded-xl p-6   not-prose">
      <p className="text-sm font-semibold text-gray-800 mb-3">
        Rahvana Legal Team
      </p>
      <div className="space-y-1.5">
        {/* <p className="text-sm text-gray-500">Email: <a href="mailto:legal@rahvana.com" className="text-teal-600 hover:underline">legal@rahvana.com</a></p> */}
        <p className="text-sm text-gray-500">
          Email:{" "}
          <a
            href="mailto:support@rahvana.com"
            className="text-teal-600 hover:underline"
          >
            support@rahvana.com
          </a>
        </p>
        <p className="text-sm text-gray-500">
          Website:{" "}
          <a
            href="https://rahvana.com"
            className="text-teal-600 hover:underline"
          >
            rahvana.com
          </a>
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
  ];
  return (
    <div className="mt-16 pt-8 border-t border-gray-200">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
        Other Legal Documents
      </p>
      <div className="flex flex-wrap gap-3">
        {pages
          .filter((p) => !p.href.includes(current))
          .map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="px-4 py-2 bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-lg text-sm text-gray-600 hover:text-teal-700 transition-all"
            >
              {p.label}
            </Link>
          ))}
      </div>
    </div>
  );
}
