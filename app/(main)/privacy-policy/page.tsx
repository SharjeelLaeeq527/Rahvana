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
      {/* HERO */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-12 py-10">
          <div className="max-w-6xl mx-auto">
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

              <h1 className="text-4xl font-bold mb-4">
                Privacy Policy
              </h1>

              <p className="text-gray-500 text-lg">
                How we collect, use, and protect your information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 sm:px-6 lg:px-12 py-10">
        <div className="max-w-6xl mx-auto flex gap-10">

          {/* SIDEBAR */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-4">
                Contents
              </p>

              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
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

          {/* CONTENT */}
          <main className="flex-1 max-w-3xl w-full">

            <Section id="information" title="1. Information We Collect">
              <p>
                We collect your name, email, and payment information
                (processed securely by Stripe — we never store card details).
              </p>

              <p>
                We may also collect immigration-related information such as visa
                details, case data, and receipt numbers (e.g., USCIS or NVC case
                numbers), which are considered personally identifiable information (PII).
              </p>

              <p>
                We also collect usage data such as pages visited and features used.
              </p>
            </Section>

            <Section id="how-we-use" title="2. How We Use It">
              <p>
                We use your data to create accounts, process payments, and improve Rahvana.
              </p>

              <p>
                Immigration-related data is used for case tracking, appointment
                scheduling, and application guidance.
              </p>
            </Section>

            <Section id="sharing" title="3. Sharing">
              <p>
                We do not sell your data. We only share it with trusted providers
                like Stripe or when legally required.
              </p>
            </Section>

            <Section id="your-rights" title="4. Your Rights">
              <p>
                You may request access, correction, or deletion of your data anytime
                via support@rahvana.com.
              </p>
            </Section>

            <Section id="retention" title="5. Retention & Breach">
              <p>
                We retain data while your account is active and up to 2 years after inactivity.
              </p>

              <p>
                We notify users of breaches within 72 hours if required.
              </p>
            </Section>

            <Section id="ownership" title="6. Ownership & Updates">
              <p>
                Rahvana is owned and operated by Arachnie Inc, Delaware, USA.
              </p>

              <p>
                We will notify users of ownership or policy changes.
              </p>
            </Section>

            <Section id="security" title="7. Security">
              <p>
                We use SSL encryption and industry-standard security practices.
              </p>

              <p>
                Sensitive immigration data is securely protected.
              </p>
            </Section>

            <Section id="contact" title="8. Contact">
              <p>Email: support@rahvana.com</p>
              <p>Website: rahvana.com</p>
            </Section>

          </main>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: any) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
