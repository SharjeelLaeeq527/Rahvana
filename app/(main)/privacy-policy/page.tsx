"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "information", title: "1. Information We Collect" },
  { id: "how-we-use", title: "2. How We Use It" },
  { id: "sharing", title: "3. Sharing" },
  { id: "your-rights", title: "4. Your Rights" },
  { id: "retention", title: "5. Data Retention & Breach" },
  { id: "ownership", title: "6. Ownership & Updates" },
  { id: "security", title: "7. Security" },
  { id: "contact", title: "8. Contact" },
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
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-5 flex-wrap">
            <Link href="/" className="hover:text-teal-600">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-600">Privacy Policy</span>
          </div>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium mb-5">
              Legal Document
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>

            <p className="text-gray-500 text-base sm:text-lg">
              How we collect, use, and protect your information.
            </p>

            <div className="flex flex-col sm:flex-row sm:gap-6 mt-5 text-sm text-gray-400 gap-2">
              <span>
                Effective Date:{" "}
                <span className="text-gray-700 font-medium">
                  March 17, 2026
                </span>
              </span>
              <span>
                Website:{" "}
                <span className="text-gray-700 font-medium">
                  rahvana.com
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* SIDEBAR */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-8 h-fit">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-4">
              Contents
            </p>

            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`whitespace-nowrap lg:whitespace-normal text-left px-3 py-2 rounded-md text-sm transition ${
                    activeSection === s.id
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </aside>

          {/* CONTENT */}
          <main className="flex-1 max-w-3xl">

            <Section id="information" title="1. Information We Collect">
              <p>
                We collect your name, email, and payment information processed securely via Stripe. We do not store full card details.
              </p>

              <p>
                We may also collect immigration-related data such as visa details, case information, and receipt numbers (USCIS, NVC, or similar identifiers), which are treated as Personally Identifiable Information (PII).
              </p>

              <p>
                We collect usage data such as pages visited and feature interactions to improve our services.
              </p>
            </Section>

            <Section id="how-we-use" title="2. How We Use It">
              <p>
                We use data to provide and improve Rahvana, including account management, payments, and service functionality.
              </p>

              <p>
                Immigration-related data is used for case tracking, document organization, and user assistance features.
              </p>

              <p>
                We do not sell user data.
              </p>
            </Section>

            <Section id="sharing" title="3. Sharing">
              <p>
                We only share data with trusted service providers (e.g., Stripe) or when legally required.
              </p>
            </Section>

            <Section id="your-rights" title="4. Your Rights">
              <p>
                You may request access, correction, or deletion of your data by contacting support@rahvana.com.
              </p>
            </Section>

            <Section id="retention" title="5. Data Retention & Breach">
              <p>
                We retain data while your account is active and up to 2 years after inactivity unless legally required otherwise.
              </p>

              <p>
                In case of a security breach, we will notify affected users within 72 hours where required by law.
              </p>
            </Section>

            <Section id="ownership" title="6. Ownership & Updates">
              <p>
                Rahvana is owned and operated by Arachnie Inc, Delaware, USA.
              </p>

              <p>
                We may update this policy and will notify users of significant changes.
              </p>
            </Section>

            <Section id="security" title="7. Security">
              <p>
                We use SSL encryption and industry-standard safeguards to protect your data.
              </p>

              <p>
                No system is 100% secure, but we take strong measures to protect user information.
              </p>
            </Section>

            <Section id="contact" title="8. Contact">
              <p>Email: support@rahvana.com</p>
              <p>Website: rahvana.com</p>
            </Section>

            <div className="mt-10">
              <Link href="/terms" className="text-teal-600">
                Terms of Service
              </Link>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: any) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="text-lg sm:text-xl font-semibold mb-3">
        {title}
      </h2>
      <div className="space-y-3 text-sm sm:text-base text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
