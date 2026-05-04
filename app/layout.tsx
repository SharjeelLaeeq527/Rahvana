import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ClientHeader } from "./components/layout/ClientHeader";
import { AuthProvider } from "./context/AuthContext";
// import { ThemeProvider } from "./components/theme-provider";
import { ClientWidgets } from "./components/layout/ClientWidgets";
import Footer from "./components/layout/Footer";
import { ToastProvider } from "./components/shared/ToastProvider";
import { LanguageProvider } from "./context/LanguageContext";
import { PlanProvider } from "./context/PlanContext";
// import { PlanTierDevToggle } from "./components/entitlements/PlanTierDevToggle"; // DEV ONLY — uncomment for local testing
import { ToolsGuard } from "./(tools)/ToolsGuard";

export const metadata: Metadata = {
  title: "Rahvana",
  description:
    "Rahvana provides step-by-step guidance, smart tools, and expert support to help you reunite with loved ones.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-background">
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-TNW3YZDTCR"
        />
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
            <PlanProvider>
            <LanguageProvider>
              {/* <ThemeProvider
            attribute="class"
            // un comment if you want bydefault device theme
            // defaultTheme="system"
            // enableSystem
            disableTransitionOnChange
          > */}
              <ClientHeader />
              <ToolsGuard>{children}</ToolsGuard>
              <ClientWidgets />
              <Footer />
              {/* </ThemeProvider> */}
            </LanguageProvider>
              {/* <PlanTierDevToggle /> */} {/* DEV ONLY — uncomment for local testing */}
            </PlanProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}