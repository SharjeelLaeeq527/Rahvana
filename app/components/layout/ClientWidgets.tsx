"use client";

// import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Dynamic import with ssr: false to avoid hydration mismatch from browser extensions
// const FloatingChatWidget = dynamic(
//   () => import("../chat/FloatingChatWidget").then((mod) => mod.FloatingChatWidget),
//   { ssr: false }
// );

export function ClientWidgets() {
  const pathname = usePathname();
  
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  
  if (isAuthPage) return null;

  // return <FloatingChatWidget />;
}
