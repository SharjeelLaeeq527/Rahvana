import { ReactNode } from "react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="site-main-px site-main-py">
        <div className="flex justify-center">
          {/* Main Content */}
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
