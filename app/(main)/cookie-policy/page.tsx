"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "what", title: "1. What Are Cookies?" },
  { id: "types", title: "2. Cookies We Use" },
  { id: "managing", title: "3. Managing Cookies" },
  { id: "consent", title: "4. Your Consent" },
  { id: "contact", title: "5. Contact" },
];

export default function CookiePolicy() {
  const [activeSection, setActiveSection] = useState("what");

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
            <span className="text-gray-600">Cookie Policy</span>
          </div>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium mb-5">
              Legal Document
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              How we use cookies on rahvana.com.
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
              className="prose prose-gray max-w-none
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-li:text-gray-700 prose-strong:text-gray-800
              prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline"
            >
              <Section id="what" title="1. What Are Cookies?">
                <p>
                  Cookies are small files stored in your browser that help
                  websites remember you and work properly.
                </p>
              </Section>

              <Section id="types" title="2. Cookies We Use">
                <ul>
                  <li>
                    <strong>Essential:</strong> Keep you logged in and secure.
                    Cannot be disabled.
                  </li>
                  <li>
                    <strong>Payment (Stripe):</strong> Fraud prevention during
                    checkout. Required for payments.
                  </li>
                  <li>
                    <strong>Functional:</strong> Remember your preferences and
                    save your progress.
                  </li>
                  <li>
                    <strong>Analytics:</strong> Understand how visitors use
                    Rahvana (anonymous data).
                  </li>
                </ul>
              </Section>

              <Section id="managing" title="3. Managing Cookies">
                <p>
                  You can control or disable cookies through your browser
                  settings. Disabling essential cookies may prevent login and
                  core features from working. To opt out of Google Analytics,
                  visit{" "}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    tools.google.com/dlpage/gaoptout
                  </a>
                  .
                </p>
              </Section>

              <Section id="consent" title="4. Your Consent">
                <p>
                  By using Rahvana, you consent to our use of essential and
                  payment cookies. You may opt out of analytics cookies at any
                  time via your browser settings.
                </p>
              </Section>

              <Section id="contact" title="5. Contact">
                <ContactCard />
              </Section>
            </div>
            <LegalNav current="cookie-policy" />
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
    <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 not-prose">
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
