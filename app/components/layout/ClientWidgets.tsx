"use client";
import { usePathname } from "next/navigation";
import FeedbackButton from "../FeedbackButton";
import { FollowUpManager } from "../followup/FollowUpManager";
import { SaveGuideAnimation } from "../shared/SaveGuideAnimation";


export function ClientWidgets() {
  const pathname = usePathname();
  
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isGuidePage = pathname.includes("/guides/");
  
  if (isAuthPage) return null;

  // Only show the global one if NOT on a guide page (guides have their own)
  if (isGuidePage) return null;

  return (
    <>
      <FeedbackButton />
      <FollowUpManager />
      <SaveGuideAnimation />
    </>
  );
}
