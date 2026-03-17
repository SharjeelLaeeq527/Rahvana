"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "information", title: "1. Information We Collect" },
  { id: "how-we-use", title: "2. How We Use It" },
  { id: "sharing", title: "3. Sharing" },
  { id: "your-rights", title: "4. Your Rights" },
  { id: "security", title: "5. Security" },
  { id: "contact", title: "6. Contact" },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("information");

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
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-14">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
            <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-600">Privacy Policy</span>
          </div>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium mb-5">
              Legal Document
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              How we collect, use, and protect your information.
            </p>
            <div className="flex flex-wrap gap-6 mt-5 text-sm text-gray-400">
              <span>Effective Date: <span className="text-gray-700 font-medium">March 17, 2026</span></span>
              <span>Applies to: <span className="text-gray-700 font-medium">rahvana.com</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex gap-10 max-w-6xl mx-auto">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Contents</p>
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
          <main className="flex-1 min-w-0 max-w-3xl">
            <div className="prose prose-gray max-w-none
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-p:text-gray-500 prose-p:leading-relaxed
              prose-li:text-gray-500 prose-strong:text-gray-700
              prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline">

              <Section id="information" title="1. Information We Collect">
                <p>We collect your name, email, and payment information (processed securely by Stripe — we never store card details). We also collect basic usage data such as pages visited and features used to improve our platform.</p>
              </Section>

              <Section id="how-we-use" title="2. How We Use It">
                <p>To create and manage your account, process payments, send important service updates, and improve Rahvana. We do not sell your data to anyone.</p>
              </Section>

              <Section id="sharing" title="3. Sharing">
                <p>We do not sell or rent your data. We share it only with service providers who help us operate Rahvana (such as Stripe for payments), and when required by law.</p>
              </Section>

              <Section id="your-rights" title="4. Your Rights">
                <p>You can request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:support@rahvana.com">support@rahvana.com</a>.</p>
              </Section>
                
              <Section id="security" title="5. Security">
                <p>We use SSL encryption and industry-standard security practices. No internet transmission is 100% secure, but we take every reasonable precaution.</p>
              </Section>

              <Section id="contact" title="6. Contact">
                <ContactCard />
              </Section>

            </div>
            <LegalNav current="privacy-policy" />
          </main>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">{title}</h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      {children}
    </section>
  );
}

function ContactCard() {
  return (
    <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 not-prose">
      <p className="text-sm font-semibold text-gray-800 mb-3">Rahvana Legal Team</p>
      <div className="space-y-1.5">
        {/* <p className="text-sm text-gray-500">Email: <a href="mailto:legal@rahvana.com" className="text-teal-600 hover:underline">legal@rahvana.com</a></p> */}
        <p className="text-sm text-gray-500">Email: <a href="mailto:support@rahvana.com" className="text-teal-600 hover:underline">support@rahvana.com</a></p>
        <p className="text-sm text-gray-500">Website: <a href="https://rahvana.com" className="text-teal-600 hover:underline">rahvana.com</a></p>
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
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Other Legal Documents</p>
      <div className="flex flex-wrap gap-3">
        {pages.filter((p) => !p.href.includes(current)).map((p) => (
          <Link key={p.href} href={p.href}
            className="px-4 py-2 bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-lg text-sm text-gray-600 hover:text-teal-700 transition-all">
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  );
}