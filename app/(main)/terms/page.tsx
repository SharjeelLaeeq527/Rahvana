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
            <Link href="/" className="hover:text-teal-600">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-600">Terms of Service</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium mb-5">
              Legal Document
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>

            <p className="text-gray-500 text-lg">
              By using Rahvana, you agree to these terms.
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
        <div className="flex gap-10">

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

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-10">
              <p className="text-sm text-amber-700">
                <strong>Disclaimer:</strong> Rahvana is not a law firm and
                does not provide legal advice. Consult a licensed immigration
                attorney for legal guidance.
              </p>
            </div>

            {/* 1 */}
            <Section id="acceptance" title="1. Acceptance">
              <p>
                By accessing or using Rahvana at{" "}
                <a href="https://rahvana.com">rahvana.com</a>, you agree to
                these Terms of Service. If you do not agree, please do not use
                our platform.
              </p>
            </Section>

            {/* 2 */}
            <Section id="service" title="2. Our Service">
              <p>
                Rahvana is owned and operated by Arachnie Inc, a Delaware,
                United States corporation.
              </p>

              <p>
                Rahvana provides immigration roadmaps, checklists, case
                tracking tools, appointment scheduling assistance, and related
                features for various US visa processes. It is an informational
                platform only and does not provide legal advice.
              </p>
            </Section>

            {/* 3 */}
            <Section id="payments" title="3. Payments & Account">
              <p>
                Some features of Rahvana may be free, while others (such as
                Rahvana Plus) may require a paid subscription. All payments are
                processed securely by third-party providers such as Stripe.
              </p>

              <p>
                You may cancel your subscription at any time. To delete your
                account and associated data, contact support@rahvana.com.
              </p>
            </Section>

            {/* 4 */}
            <Section id="rules" title="4. Your Responsibilities">
              <p>
                You agree to use Rahvana only for lawful purposes related to
                your personal immigration journey.
              </p>

              <p>
                You must not share your account, misuse the platform, attempt
                to reverse-engineer the system, or use it to provide paid
                services to others.
              </p>
            </Section>

            {/* 5 */}
            <Section id="liability" title="5. Liability">
              <p>
                Rahvana is provided "as is" without warranties of any kind.
                We are not responsible for immigration decisions, delays,
                denials, or outcomes.
              </p>

              <p>
                To the maximum extent permitted by law, our total liability is
                limited to the amount you paid in the past 12 months.
              </p>

              <p>
                These Terms are governed by the laws of Delaware, United States.
              </p>
            </Section>

            {/* 6 */}
            <Section id="updates" title="6. Updates to Terms">
              <p>
                We may update these Terms from time to time. We will notify
                users of significant changes and obtain consent where required.
              </p>
            </Section>

            {/* 7 */}
            <Section id="contact" title="7. Contact">
              <p>Email: support@rahvana.com</p>
              <p>Website: rahvana.com</p>
            </Section>

            <div className="mt-10">
              <Link href="/privacy-policy" className="text-teal-600">
                Privacy Policy
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
