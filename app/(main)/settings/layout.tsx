import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;1,500&display=swap');

        * {
          font-family: 'Figtree', system-ui, -apple-system, sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Lora', Georgia, serif;
        }
      `}</style>

      {children}
    </>
  );
}

