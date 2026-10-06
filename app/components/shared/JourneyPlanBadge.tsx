import Image from "next/image";

type JourneyPlanBadgeProps = {
  tier?: string | null;
  className?: string;
  showLabel?: boolean;
  iconOnly?: boolean;
};

const TIER_STYLES: Record<string, string> = {
  executive:
    "border-amber-200/80 bg-linear-to-r from-amber-50/95 to-yellow-100/80 text-amber-900 shadow-amber-950/10",
  premium:
    "border-violet-200/80 bg-linear-to-r from-violet-50/95 to-indigo-100/80 text-violet-900 shadow-violet-950/10",
  basic:
    "border-teal-200/80 bg-linear-to-r from-teal-50/95 to-emerald-100/80 text-teal-900 shadow-teal-950/10",
  free: "border-slate-200/90 bg-white/75 text-slate-600 shadow-slate-950/5",
};

const TIER_IMAGES: Record<string, string> = {
  executive: "/icons/Executive.png",
  premium: "/icons/Premium.png",
  basic: "/icons/Basic.png",
  free: "/icons/Free.png",
};

/** Compact, consistent icon-only plan marker for a specific journey. */
export function JourneyPlanBadge({
  tier,
  className = "",
  showLabel = false,
  iconOnly = true,
}: JourneyPlanBadgeProps) {
  const normalizedTier = tier?.toLowerCase() || "free";
  const label =
    normalizedTier === "free"
      ? "Free"
      : normalizedTier.charAt(0).toUpperCase() + normalizedTier.slice(1);
  const style = TIER_STYLES[normalizedTier] ?? TIER_STYLES.free;
  const image = TIER_IMAGES[normalizedTier] ?? TIER_IMAGES.free;

  if (iconOnly || !showLabel) {
    return (
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border shadow-sm backdrop-blur-xl ${style} ${className}`}
        title={`${label} Plan`}
        aria-label={`${label} journey plan`}
      >
        <Image
          src={image}
          alt={`${label} plan`}
          width={16}
          height={16}
          className="h-4 w-4 object-contain"
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold tracking-[0.12em] uppercase shadow-sm backdrop-blur-xl ${style} ${className}`}
      title={`${label} Plan`}
      aria-label={`${label} journey plan`}
    >
      <Image
        src={image}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 object-contain"
        aria-hidden="true"
      />

      <span className="hidden md:block">{label}</span>
    </span>
  );
}