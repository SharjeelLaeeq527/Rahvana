"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { usePlan } from "@/app/context/PlanContext";

export default function ResourceLaunchButton({
  href,
  size = "detail",
  className = "",
}: {
  href: string;
  className?: string;
  size?: "detail" | "card";
}) {
  const router = useRouter();
  const plan = usePlan();
  const label = plan.tier === "free" ? "Explore Tool" : "Launch Tool";

  const sizeClasses =
    size === "card"
      ? "px-3.5 py-1.5 text-[12px]"
      : "px-7 py-3.5 text-[15px]";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(href);
      }}
      className={`inline-flex items-center justify-center rounded-full border border-[#0d7377] bg-white font-semibold text-[#0d7377] transition-all duration-200 hover:bg-[#0d7377] hover:text-white hover:shadow-lg hover:shadow-[#0d7377]/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#0d7377]/20 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${className}`}
    >
      {label}
      <ArrowRight className={`${size === "card" ? "ml-1.5 h-3.5 w-3.5" : "ml-2 h-4 w-4"}`} />
    </button>
  );
}