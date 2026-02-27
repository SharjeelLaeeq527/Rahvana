import type { Metadata } from "next";
import "./globals.css";
import { ClientHeader } from "./components/layout/ClientHeader";
import { AuthProvider } from "./context/AuthContext";
// import { ThemeProvider } from "./components/theme-provider";
import { ClientWidgets } from "./components/layout/ClientWidgets";
import Footer from "./components/layout/Footer";
import { ToastProvider } from "./components/shared/ToastProvider";

export const metadata: Metadata = {
  title: "Rahvana",
  description: "Rahvana provides step-by-step guidance, smart tools, and expert support to help you reunite with loved ones.",
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
        </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
