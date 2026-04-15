"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sections = [
  { id: "acceptance", title: "1. Acceptance" },
  { id: "service", title: "2. Our Service" },
  { id: "payments", title: "3. Payments & Account" },
  { id: "rules", title: "4. User Responsibilities" },
  { id: "liability", title: "5. Limitation of Liability" },
  { id: "updates", title: "6. Updates to Terms" },
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
              By accessing or using Rahvana, you agree to these Terms.
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
                <span className="text-gray-700 font-medium">
                  rahvana.com
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
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
                <strong>Disclaimer:</strong> Rahvana is not a law firm and does
                not provide legal advice. All information is for general
                informational and educational purposes only.
              </p>
            </div>

            <Section id="acceptance" title="1. Acceptance">
              <p>
                By using Rahvana at https://rahvana.com, you confirm that you
                have read, understood, and agree to be bound by these Terms of
                Service. If you do not agree, you must not use the platform.
              </p>
            </Section>

            <Section id="service" title="2. Our Service">
              <p>
                Rahvana is owned and operated by Arachnie Inc, a Delaware,
                United States corporation.
              </p>

              <p>
                Rahvana provides digital immigration support tools including
                case tracking, roadmap generation, document checklists,
                appointment guidance, and related informational services.
              </p>

              <p>
                Rahvana is not a law firm and does not provide legal advice,
                representation, or guarantee any immigration outcome.
              </p>
            </Section>

            <Section id="payments" title="3. Payments & Account">
              <p>
                Some features may require a paid subscription. Payments are
                processed securely through third-party providers such as Stripe.
                We do not store full payment card details.
              </p>

              <p>
                You may cancel your subscription at any time. Account deletion
                requests can be made by contacting support@rahvana.com.
              </p>
            </Section>

            <Section id="rules" title="4. User Responsibilities">
              <p>
                You agree to use Rahvana only for lawful personal immigration
                purposes.
              </p>

              <p>
                You must not misuse the platform, attempt to reverse-engineer,
                copy, resell, or provide access to unauthorized third parties.
              </p>
            </Section>

            <Section id="liability" title="5. Limitation of Liability">
              <p>
                Rahvana is provided on an "as-is" and "as-available" basis
                without warranties of any kind.
              </p>

              <p>
                We are not responsible for any immigration decisions, delays,
                rejections, or outcomes resulting from use of our platform.
              </p>

              <p>
                To the maximum extent permitted by law, our total liability for
                any claim shall not exceed the amount paid by you in the past
                12 months.
              </p>

              <p>
                These Terms are governed by the laws of the State of Delaware,
                United States.
              </p>
            </Section>

            <Section id="updates" title="6. Updates to Terms">
              <p>
                We may modify these Terms at any time. If changes are material,
                we will notify users and update the effective date accordingly.
              </p>
            </Section>

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