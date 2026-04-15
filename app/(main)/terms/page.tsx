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
              <span className="text-gray-600">Terms</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">
              Terms of Service
            </h1>

            <p className="text-gray-500 text-lg">
              By using Rahvana, you agree to these terms.
            </p>

          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 sm:px-6 lg:px-12 py-10">
        <div className="max-w-6xl mx-auto flex gap-10">

          {/* SIDEBAR */}
          <aside className="hidden lg:block w-64">
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

            <Section id="acceptance" title="1. Acceptance">
              <p>
                By using Rahvana, you agree to these Terms of Service.
              </p>
            </Section>

            <Section id="service" title="2. Our Service">
              <p>
                Rahvana is owned and operated by Arachnie Inc, Delaware, USA.
              </p>

              <p>
                We provide immigration tools including tracking, scheduling,
                and guidance (not legal advice).
              </p>
            </Section>

            <Section id="payments" title="3. Payments & Account">
              <p>
                Some features are free. Premium features may require payment via Stripe.
              </p>
            </Section>

            <Section id="rules" title="4. Your Responsibilities">
              <p>
                Use the platform only for lawful purposes and do not misuse or reverse-engineer it.
              </p>
            </Section>

            <Section id="liability" title="5. Liability">
              <p>
                We are not responsible for immigration outcomes or decisions.
              </p>
            </Section>

            <Section id="updates" title="6. Updates">
              <p>
                We may update these terms and notify users when needed.
              </p>
            </Section>

            <Section id="contact" title="7. Contact">
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
