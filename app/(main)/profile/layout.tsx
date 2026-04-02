import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="w-full site-main-px site-main-py">
        <div className="flex justify-center">
          {/* Main Content */}
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
