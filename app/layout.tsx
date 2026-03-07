import type { Metadata } from "next";
import "./globals.css";
import { ClientHeader } from "./components/layout/ClientHeader";
import { AuthProvider } from "./context/AuthContext";
// import { ThemeProvider } from "./components/theme-provider";
import { ClientWidgets } from "./components/layout/ClientWidgets";
import Footer from "./components/layout/Footer";
import { ToastProvider } from "./components/shared/ToastProvider";
import { LanguageProvider } from "./context/LanguageContext";

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
        <ToastProvider>
          <AuthProvider>
            <LanguageProvider>
              {/* <ThemeProvider
            attribute="class"
            // un comment if you want bydefault device theme
            // defaultTheme="system"
            // enableSystem
            disableTransitionOnChange
          > */}
              <ClientHeader />
              {children}
              <ClientWidgets />
              <Footer />
              {/* </ThemeProvider> */}
            </LanguageProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
