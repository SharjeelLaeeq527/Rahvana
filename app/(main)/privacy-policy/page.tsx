"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "information", title: "1. Information We Collect" },
  { id: "how-we-use", title: "2. How We Use It" },
  { id: "sharing", title: "3. Sharing" },
  { id: "your-rights", title: "4. Your Rights" },
  { id: "retention", title: "5. Data Retention & Security Breach" },
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
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="site-main-px site-main-py">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
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

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>

            <p className="text-gray-500 text-lg">
              This policy explains how we collect, use, and protect your data.
            </p>

            <div className="flex gap-6 mt-5 text-sm text-gray-400">
              <span>
                Effective Date:{" "}
                <span className="text-gray-700 font-medium">
                  March 17, 2026
                </span>
              </span>
              <span>
                Website:{" "}
                <span className="text-gray-700 font-medium">rahvana.com</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="site-main-px site-main-py">
        <div className="flex gap-10 mx-auto">
          {/* Sidebar */}
          <aside className="hidden lg:block w-60">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-4">
                Contents
              </p>

              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded ${
                    activeSection === s.id
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1">

            <Section id="information" title="1. Information We Collect">
              <p>
                We collect personal information such as your name, email
                address, and account details.
              </p>

              <p>
                Payments are processed securely via Stripe. We do not store
                full card details on our servers.
              </p>

              <p>
                We may collect immigration-related information that you
                voluntarily provide, including visa details, case information,
                and identifiers such as receipt numbers (e.g., USCIS, NVC, or
                other government case numbers).
              </p>

              <p>
                Receipt numbers are considered Personally Identifiable
                Information (PII) and are collected to uniquely identify,
                track, and manage user-submitted immigration cases within the
                Rahvana platform.
              </p>

              <p>
                We also collect basic usage data such as pages visited,
                feature usage, and interaction logs to improve our services.
              </p>
            </Section>

            <Section id="how-we-use" title="2. How We Use It">
              <p>
                We use collected data to create and manage accounts, process
                payments, provide services, and improve Rahvana.
              </p>

              <p>
                Immigration-related information (including receipt numbers) is
                used for case tracking, document organization, appointment
                assistance, and personalized immigration guidance.
              </p>

              <p>
                We do not provide legal advice and do not guarantee immigration
                outcomes.
              </p>

              <p>We do not sell your personal data.</p>
            </Section>

            <Section id="sharing" title="3. Sharing">
              <p>
                We do not sell or rent user data. We only share information
                with trusted third-party service providers (such as Stripe) or
                when required by law.
              </p>
            </Section>

            <Section id="your-rights" title="4. Your Rights">
              <p>
                You may request access, correction, or deletion of your data at
                any time by contacting support@rahvana.com.
              </p>
            </Section>

            <Section id="retention" title="5. Data Retention & Security Breach">
              <p>
                We retain user data while the account is active and for up to 2
                years after inactivity unless a longer retention period is
                required by law.
              </p>

              <p>
                In the event of a security breach affecting user data, we will
                notify affected users within 72 hours where legally required.
              </p>
            </Section>

            <Section id="ownership" title="6. Ownership & Updates">
              <p>
                Rahvana is owned and operated by Arachnie Inc, a Delaware,
                United States corporation.
              </p>

              <p>
                If ownership or control of the company changes, users will be
                notified and their data rights will remain protected.
              </p>

              <p>
                We may update this Privacy Policy periodically and will notify
                users of significant changes.
              </p>
            </Section>

            <Section id="security" title="7. Security">
              <p>
                We use SSL encryption and industry-standard security practices
                to protect user data.
              </p>

              <p>
                Immigration-related and sensitive data is stored and processed
                with appropriate technical and organizational safeguards.
              </p>

              <p>
                While we take strong security measures, no system is completely
                secure.
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
    <section id={id} className="mb-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}