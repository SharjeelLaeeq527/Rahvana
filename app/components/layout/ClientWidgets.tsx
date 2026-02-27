"use client";
import { usePathname } from "next/navigation";


export function ClientWidgets() {
  const pathname = usePathname();
  
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  
  if (isAuthPage) return null;

}
