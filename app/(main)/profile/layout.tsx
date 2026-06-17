import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* pt-24 clears the fixed SiteHeader (≈64px) so the page title isn't cropped. */}
      <div className="w-full site-main-px pt-24 pb-16">
        <div className="flex justify-center">
          {/* Main Content */}
          <div className="w-full max-w-5xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
