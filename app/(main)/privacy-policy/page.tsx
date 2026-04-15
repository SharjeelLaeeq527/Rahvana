"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "information", title: "1. Information We Collect" },
  { id: "how-we-use", title: "2. How We Use It" },
  { id: "sharing", title: "3. Sharing" },
  { id: "your-rights", title: "4. Your Rights" },
  { id: "retention", title: "5. Retention & Breach" },
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
              How we collect, use, and protect your information.
            </p>

            <div className="flex gap-6 mt-5 text-sm text-gray-400">
              <span>
                Effective Date:{" "}
                <span className="text-gray-700 font-medium">
                  March 17, 2026
                </span>
              </span>
              <span>
                Applies to:{" "}
                <span className="text-gray-700 font-medium">
                  rahvana.com
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="site-main-px site-main-py">
        <div className="flex gap-10 mx-auto">

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

          <main className="flex-1">

            {/* 1 */}
            <Section id="information" title="1. Information We Collect">
              <p>
                We collect your name, email, and payment information
                (processed securely by Stripe — we never store card details).
              </p>

              <p>
                We may also collect immigration-related information that you
                voluntarily provide, including visa details, case data, and
                identifiers such as receipt numbers (e.g., USCIS or NVC case
                numbers), which are considered personally identifiable
                information (PII).
              </p>

              <p>
                We also collect basic usage data such as pages visited and
                features used to improve our platform.
              </p>
            </Section>

            {/* 2 */}
            <Section id="how-we-use" title="2. How We Use It">
              <p>
                To create and manage your account, process payments, send
                important service updates, and improve Rahvana.
              </p>

              <p>
                Immigration-related data such as receipt numbers and case
                identifiers are used to provide features like case tracking,
                appointment scheduling, DS-160/DS-260 assistance, and
                personalized guidance.
              </p>

              <p>
                We do not sell your data to anyone, ever.
              </p>
            </Section>

            {/* 3 */}
            <Section id="sharing" title="3. Sharing">
              <p>
                We do not sell or rent your data. We only share it with trusted
                service providers (such as Stripe) or when required by law.
              </p>
            </Section>

            {/* 4 */}
            <Section id="your-rights" title="4. Your Rights">
              <p>
                You can request access, correction, or deletion of your data at
                any time by emailing support@rahvana.com.
              </p>
            </Section>

            {/* 5 */}
            <Section id="retention" title="5. Data Retention & Breach">
              <p>
                We retain your data while your account is active, or up to 2
                years after inactivity.
              </p>
              <p>
                In case of a data breach, we will notify users within 72 hours.
              </p>
            </Section>

            {/* 6 */}
            <Section id="ownership" title="6. Ownership & Updates">
              <p>
                Rahvana is owned and operated by Arachnie Inc, a Delaware,
                United States corporation.
              </p>

              <p>
                If ownership changes, users will be notified and given control
                over their data.
              </p>

              <p>
                We may update this policy and will notify users of major
                changes.
              </p>
            </Section>

            {/* 7 */}
            <Section id="security" title="7. Security">
              <p>
                We use SSL encryption and industry-standard security practices.
              </p>

              <p>
                Immigration-related data is securely handled and protected using
                appropriate safeguards.
              </p>

              <p>
                No system is 100% secure, but we take strong precautions.
              </p>
            </Section>

            {/* 8 */}
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