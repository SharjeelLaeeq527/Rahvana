import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-12 sm:pt-16">
      {/* Add Google Fonts for Figtree and Lora */}
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
    </div>
  );
}
