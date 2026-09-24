import type { Metadata } from "next";
import Script from "next/script";
import { IR5_ENABLED } from "@/lib/feature-flags";
import "./globals.css";
import { ClientHeader } from "./components/layout/ClientHeader";
import { AuthProvider } from "./context/AuthContext";
// import { ThemeProvider } from "./components/theme-provider";
import { ClientWidgets } from "./components/layout/ClientWidgets";
import Footer from "./components/layout/Footer";
import { ToastProvider } from "./components/shared/ToastProvider";
import { LanguageProvider } from "./context/LanguageContext";
import { PlanProvider } from "./context/PlanContext";
import { UserProfileProvider } from "./context/UserProfileContext";
import { CandidateProvider } from "./context/CandidateContext";
import { PlanTierDevToggle } from "./components/entitlements/PlanTierDevToggle"; // DEV ONLY — uncomment for local testing
import { ToolsGuard } from "./(tools)/ToolsGuard";
import { QuickAccessProvider } from "./context/QuickAccessContext";
import { Analytics } from "@vercel/analytics/react";
import { JsonLd } from "./components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rahvana.com";

// IR-5 is hidden on production (see lib/feature-flags): drop IR-5 from the
// site-wide SEO copy so the category is not advertised while it is gated off.
const VISA_LIST_FULL = IR5_ENABLED ? "IR-1, IR-5, CR-1, and F-1" : "IR-1, CR-1, and F-1";
const VISA_LIST_SHORT = IR5_ENABLED ? "IR-1, IR-5, and family" : "IR-1 and family";

const ROOT_STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rahvana",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-512.png`,
    description: `Rahvana provides step-by-step guidance, smart tools, and expert support for U.S. immigration journeys including ${VISA_LIST_FULL} visas.`,
    sameAs: [
      "https://twitter.com/rahvana",
      "https://www.linkedin.com/company/rahvana",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      availableLanguage: ["English", "Urdu"],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rahvana",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/resources?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export const metadata: Metadata = {
  // ── Canonical base URL (required for all absolute OG image URLs) ───────────
  metadataBase: new URL(SITE_URL),

  // ── Default title / description (per-page exports override these) ──────────
  title: {
    default: "Rahvana — U.S. Immigration Made Simple",
    template: "%s · Rahvana",
  },
  description: `Rahvana guides couples and families through the ${VISA_LIST_FULL} visa process with step-by-step roadmaps, smart document tools, and expert support.`,

  // ── Keywords (GEO signal — helps AI models understand the site topic) ───────
  keywords: [
    "Rahvana",
    "Rahvana immigration",
    "IR-1 visa",
    ...(IR5_ENABLED ? ["IR-5 visa"] : []),
    "CR-1 visa",
    "spouse visa",
    ...(IR5_ENABLED ? ["parent visa"] : []),
    "U.S. immigration",
    "immigration platform",
    "visa roadmap",
    "USCIS forms",
    "Pakistan to USA visa",
    "immigration tools",
    "NVC processing",
    "K-1 visa",
  ],

  // ── Authors / brand entity (improves AI citation attribution) ─────────────
  authors: [{ name: "Rahvana", url: SITE_URL }],
  creator: "Rahvana",
  publisher: "Rahvana",

  // ── Open Graph defaults ────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rahvana",
    title: "Rahvana — U.S. Immigration Made Simple",
    description: `Guided ${VISA_LIST_SHORT} visa journeys with smart tools, document vaults, and expert support.`,
    url: SITE_URL,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Rahvana — U.S. Immigration Platform",
      },
    ],
  },

  // ── Twitter / X card ───────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Rahvana — U.S. Immigration Made Simple",
    description: `Guided ${VISA_LIST_SHORT} visa journeys with smart tools, document vaults, and expert support.`,
    images: ["/opengraph-image.png"],
  },

  // ── Favicon / app icons ────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon4.ico", sizes: "any" },
      { url: "/favicon-512.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-512.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },

  // ── Robots default (public pages are indexable) ────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body suppressHydrationWarning className="bg-background">
        <JsonLd schema={ROOT_STRUCTURED_DATA} />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-TNW3YZDTCR" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-TNW3YZDTCR');
          `}
        </Script>
        <Script id="apply-saved-color-preset" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var raw = localStorage.getItem('rahvana-color-lab');
                if (!raw) return;
                var saved = JSON.parse(raw);
                var root = document.documentElement;

                var setVar = function (name, value) {
                  if (typeof value === 'string' && value.trim()) {
                    root.style.setProperty(name, value);
                  }
                };

                setVar('--button-solid-bg', saved.primary);
                setVar('--button-outline-border', saved.secondary);
                setVar('--button-outline-text', saved.background);
                setVar('--feedback-button-bg', saved.feedback);
                setVar('--feedback-button-hero', saved.feedbackHero);
              } catch (e) {
                // Fall back to CSS defaults.
              }
            })();
          `}
        </Script>
        <ToastProvider>
          <AuthProvider>
            <UserProfileProvider>
              <CandidateProvider>
                <PlanProvider>
                  <QuickAccessProvider>
                    <LanguageProvider>
                      {/* <ThemeProvider
                  attribute="class"
                  // un comment if you want bydefault device theme
                  // defaultTheme="system"
                  disableTransitionOnChange
                > */}
                      <ClientHeader />
                      <ToolsGuard>{children}</ToolsGuard>
                      <ClientWidgets />
                      <Footer />
                      {/* </ThemeProvider> */}
                    </LanguageProvider>
                  </QuickAccessProvider>
                  <PlanTierDevToggle />
                  {/* DEV ONLY — uncomment for local testing */}
                </PlanProvider>
              </CandidateProvider>
            </UserProfileProvider>
          </AuthProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
