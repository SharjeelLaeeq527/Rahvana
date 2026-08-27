"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PolicyData } from "@/lib/policy-data";
import { SquareArrowOutUpRight, Info } from "lucide-react";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";

interface PolicyPageProps {
  policy: PolicyData;
}

export default function PolicyPage({ policy }: PolicyPageProps) {
  const [activeSection, setActiveSection] = useState(policy.sections[0]?.id || "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: 0,
      }
    );

    policy.sections.forEach(({ id }) => {
      const section = document.getElementById(id);

      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, [policy.sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setActiveSection(id);
  };

  const otherPolicies = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookie-policy", label: "Cookie Policy" },
    { href: "/acceptable-use", label: "Acceptable Use Policy" },
  ].filter((policyLink) => !policyLink.href.includes(policy.slug));

  return (
    <div className="rahvana-policy-page">
      <header className="rahvana-policy-hero">
        <div className="rahvana-policy-container rahvana-policy-hero-inner">
          <div className="rahvana-policy-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="rahvana-policy-breadcrumb-link">
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <span aria-current="page">{policy.title}</span>
          </div>

          <div className="rahvana-policy-hero-copy">
            <span className="rahvana-policy-badge">{policy.badge}</span>

            <h1>{policy.title}</h1>

            <p className="rahvana-policy-description">{policy.description}</p>

            <div className="rahvana-policy-meta">
              <span>
                Effective Date: <strong>{policy.effectiveDate}</strong>
              </span>

              <span>
                Website: <strong>{policy.website}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="rahvana-policy-container rahvana-policy-main">
        <div className="rahvana-policy-mobile-contents">
          <label htmlFor="rahvana-policy-section-picker">Contents</label>

          <select
            id="rahvana-policy-section-picker"
            value={activeSection}
            onChange={(event) => scrollTo(event.target.value)}
          >
            {policy.sections.map((section) => (
              <option value={section.id} key={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>

        <div className="rahvana-policy-layout">
          <aside className="rahvana-policy-sidebar">
            <div className="rahvana-policy-sidebar-inner custom-scrollbar">
              <h2>Contents</h2>

              <nav aria-label="Policy sections">
                {policy.sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollTo(section.id)}
                    className={
                      activeSection === section.id
                        ? "rahvana-policy-contents-link is-active"
                        : "rahvana-policy-contents-link"
                    }
                    aria-current={activeSection === section.id ? "location" : undefined}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <article className="rahvana-policy-article">
            {policy.importantNotice && (
              <ExpandableTooltip
                icon={<Info className="h-5 w-5" />}
                title="Important Disclaimer"
                message={policy.importantNotice.text}
                defaultOpen={true}
              />
            )}

            <div className="rahvana-policy-sections">
              {policy.sections.map((section) => (
                <section key={section.id} id={section.id} className="rahvana-policy-section">
                  <h2>{section.title}</h2>

                  <div className="rahvana-policy-section-content">{section.content}</div>
                </section>
              ))}
            </div>

            <footer className="rahvana-policy-footer">
              {otherPolicies.map((policyLink) => (
                <Link key={policyLink.href} href={policyLink.href}>
                  {policyLink.label} <SquareArrowOutUpRight className="h-4 w-4" />
                </Link>
              ))}
            </footer>
          </article>
        </div>
      </main>

      <style>{`
        .rahvana-policy-page {
          --rahvana-primary: #0d7377;
          --rahvana-primary-hover: #0a5a5d;
          --rahvana-light-teal: #e8f6f6;
          --rahvana-heading: #0a1128;
          --rahvana-secondary: #67737e;
          --rahvana-background: #f8fafa;
          --rahvana-border: #e0f0f0;
          --rahvana-white: #ffffff;

          min-height: 100vh;
          overflow-x: clip;
          color: var(--rahvana-heading);
          background: var(--rahvana-background);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: 15px;
          line-height: 1.75;
          -webkit-font-smoothing: antialiased;
        }

        .rahvana-policy-page *,
        .rahvana-policy-page *::before,
        .rahvana-policy-page *::after {
          box-sizing: border-box;
        }

        .rahvana-policy-page button,
        .rahvana-policy-page select {
          font: inherit;
        }

        .rahvana-policy-page button:focus-visible,
        .rahvana-policy-page a:focus-visible,
        .rahvana-policy-page select:focus-visible {
          outline: 3px solid rgba(13, 115, 119, 0.3);
          outline-offset: 3px;
        }

        .rahvana-policy-container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .rahvana-policy-hero {
          border-bottom: 1px solid var(--rahvana-border);
          background: rgba(255, 255, 255, 0.92);
        }

        .rahvana-policy-hero-inner {
          padding: 28px 0 50px;
        }

        .rahvana-policy-breadcrumb {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 44px;
          color: #89939a;
          font-size: 13px;
          line-height: 1.4;
        }

        .rahvana-policy-breadcrumb-link {
          color: var(--rahvana-primary);
          text-decoration: none;
        }

        .rahvana-policy-breadcrumb-link:hover {
          color: var(--rahvana-primary-hover);
        }

        .rahvana-policy-hero-copy {
          max-width: 790px;
        }

        .rahvana-policy-badge {
          display: inline-flex;
          align-items: center;
          padding: 7px 12px;
          border: 1px solid #c5e5e5;
          border-radius: 999px;
          color: var(--rahvana-primary);
          background: var(--rahvana-light-teal);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.055em;
          text-transform: uppercase;
        }

        .rahvana-policy-hero h1 {
          margin: 19px 0 12px;
          color: var(--rahvana-heading);
          font-size: clamp(42px, 5vw, 60px);
          font-weight: 800;
          letter-spacing: -0.045em;
          line-height: 1.05;
        }

        .rahvana-policy-description {
          max-width: 650px;
          margin: 0;
          color: var(--rahvana-secondary);
          font-size: 18px;
          line-height: 1.6;
        }

        .rahvana-policy-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 30px;
          margin-top: 27px;
          color: var(--rahvana-secondary);
          font-size: 13px;
          line-height: 1.5;
        }

        .rahvana-policy-meta strong {
          color: var(--rahvana-heading);
          font-weight: 700;
        }

        .rahvana-policy-main {
          padding-top: 64px;
          padding-bottom: 96px;
        }

        .rahvana-policy-layout {
          display: grid;
          grid-template-columns: 225px minmax(0, 735px);
          align-items: start;
          justify-content: center;
          gap: 85px;
        }

        .rahvana-policy-sidebar {
          min-width: 0;
          position: sticky;
          top: 28px;
          align-self: start;
          height: fit-content;
        }

        .rahvana-policy-sidebar-inner {
          max-height: calc(100vh - 56px);
          overflow-y: auto;
        }

        .rahvana-policy-sidebar h2,
        .rahvana-policy-mobile-contents label {
          margin: 0 0 16px;
          color: var(--rahvana-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .rahvana-policy-sidebar nav {
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--rahvana-border);
        }

        .rahvana-policy-contents-link {
          position: relative;
          margin-left: -1px;
          padding: 7px 11px 7px 15px;
          border: 0;
          border-left: 2px solid transparent;
          color: var(--rahvana-secondary);
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          line-height: 1.35;
          text-align: left;
          transition:
            color 160ms ease,
            background-color 160ms ease,
            border-color 160ms ease;
        }

        .rahvana-policy-contents-link:hover {
          color: var(--rahvana-primary);
          background: rgba(232, 246, 246, 0.6);
        }

        .rahvana-policy-contents-link.is-active {
          border-left-color: var(--rahvana-primary);
          color: var(--rahvana-primary-hover);
          background: var(--rahvana-light-teal);
          font-weight: 700;
        }

        .rahvana-policy-article {
          min-width: 0;
        }

        .rahvana-policy-notice {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-bottom: 55px;
          padding: 17px 19px;
          border: 1px solid #cae7e7;
          border-radius: 9px;
          background: var(--rahvana-light-teal);
          box-shadow: 0 5px 18px rgba(13, 115, 119, 0.04);
        }

        .rahvana-policy-notice-icon {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-top: 2px;
          border: 1.5px solid var(--rahvana-primary);
          border-radius: 50%;
          color: var(--rahvana-primary);
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
        }

        .rahvana-policy-notice p {
          margin: 0;
          color: #355e61;
          font-size: 14px;
          line-height: 1.55;
        }

        .rahvana-policy-sections {
          display: flex;
          flex-direction: column;
          gap: 56px;
        }

        .rahvana-policy-section {
          scroll-margin-top: 28px;
        }

        .rahvana-policy-section h2 {
          margin: 0 0 17px;
          color: var(--rahvana-heading);
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.25;
        }

        .rahvana-policy-section-content {
          color: var(--rahvana-secondary);
          font-size: 15px;
          line-height: 1.78;
        }

        .rahvana-policy-section-content p {
          margin: 0 0 17px;
        }

        .rahvana-policy-section-content p:last-child {
          margin-bottom: 0;
        }

        .rahvana-policy-section-content h3 {
          margin: 25px 0 7px;
          color: var(--rahvana-heading);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.4;
        }

        .rahvana-policy-section-content ul,
        .rahvana-policy-section-content ol {
          margin: 9px 0 0;
          padding-left: 24px;
        }

        .rahvana-policy-section-content li {
          margin: 8px 0;
          padding-left: 4px;
        }

        .rahvana-policy-section-content li::marker {
          font-weight: 700;
        }

        .rahvana-policy-section-content strong {
          color: #42525c;
          font-weight: 700;
        }

        .rahvana-policy-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 23px;
          margin-top: 68px;
          padding-top: 25px;
          border-top: 1px solid var(--rahvana-border);
        }

        .rahvana-policy-footer a {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          color: var(--rahvana-primary);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .rahvana-policy-footer a:hover {
          color: var(--rahvana-primary-hover);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .rahvana-policy-mobile-contents {
          display: none;
        }

        @media (max-width: 850px) {
          .rahvana-policy-container {
            width: min(100% - 32px, 735px);
          }
        
          .rahvana-policy-layout {
            display: block;
          }
        
          .rahvana-policy-sidebar {
            display: none;
          }
        
          .rahvana-policy-mobile-contents {
            display: block;
            margin-bottom: 35px;
          }
        
          .rahvana-policy-mobile-contents select {
            width: 100%;
            padding: 12px 13px;
            border: 1px solid var(--rahvana-border);
            border-radius: 7px;
            color: var(--rahvana-heading);
            background: var(--rahvana-white);
            font-size: 14px;
          }
        
          /* Hide policy links on mobile/tablet */
          .rahvana-policy-footer {
            display: none;
          }
        }

        @media (max-width: 560px) {
          .rahvana-policy-hero-inner {
            padding-top: 20px;
            padding-bottom: 35px;
          }

          .rahvana-policy-breadcrumb {
            margin-bottom: 36px;
          }

          .rahvana-policy-hero h1 {
            margin-top: 17px;
            font-size: 42px;
          }

          .rahvana-policy-description {
            font-size: 16px;
            line-height: 1.55;
          }

          .rahvana-policy-meta {
            display: grid;
            gap: 8px;
            margin-top: 22px;
          }

          .rahvana-policy-main {
            padding-top: 37px;
            padding-bottom: 74px;
          }

          .rahvana-policy-notice {
            margin-bottom: 43px;
            padding: 15px;
          }

          .rahvana-policy-sections {
            gap: 35px;
          }

          .rahvana-policy-section h2 {
            font-size: 21px;
          }

          .rahvana-policy-section-content {
            font-size: 14px;
            line-height: 1.72;
          }
        }
      `}</style>
    </div>
  );
}
