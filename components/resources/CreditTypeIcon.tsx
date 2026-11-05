import Image from "next/image";

/**
 * Credit-cost icon for standalone resources, one brand image per section.
 * The team is reviewing the candidate images (public/assets/images) —
 * swap an entry here to change it everywhere that section's "N Credits" rows
 * render (My Resources cards and /resources detail pages).
 */
export type CreditIconKind = "tools" | "guides" | "services";

const CREDIT_ICONS: Record<CreditIconKind, string> = {
  tools: "/assets/images/SeedJar3.png",
  guides: "/assets/images/SeedJar3.png",
  services: "/assets/images/SeedJar3.png",
};

// Aspect ratios for trimmed candidate jar images
const ICON_ASPECT_RATIOS: Record<string, number> = {
  "/assets/images/SeedJar.png": 613 / 948,
  "/assets/images/SeedJar2.png": 620 / 1317,
  "/assets/images/SeedJar3.png": 686 / 1063,
  "/assets/images/currencyicon.png": 180 / 307,
  "/assets/images/currencyicon2.png": 181 / 447,
};
const DEFAULT_ASPECT_RATIO = 686 / 1063;

export interface CreditTypeIconProps {
  kind: CreditIconKind;
  size?: number;
  className?: string;
  /** When provided, displays the amount cleanly beside the jar */
  amount?: number | string | null;
  /** Label after the amount (defaults to "credits" when amount is present) */
  suffix?: string | false;
  /** Optional layout style: "inline" (default) or "stacked" */
  layout?: "inline" | "stacked";
  /** Optional extra classes for the container */
  amountClassName?: string;
}

export default function CreditTypeIcon({
  kind,
  size = 28,
  className = "",
  amount,
  suffix = "credits",
  layout = "inline",
  amountClassName = "",
}: CreditTypeIconProps) {
  const iconSrc = CREDIT_ICONS[kind] || "/assets/images/SeedJar3.png";
  const aspectRatio = ICON_ASPECT_RATIOS[iconSrc] || DEFAULT_ASPECT_RATIO;
  const calculatedWidth = Math.max(1, Math.round(size * aspectRatio));

  const imageElement = (
    <Image
      src={iconSrc}
      alt=""
      width={calculatedWidth}
      height={size}
      unoptimized
      priority
      style={{
        height: `${size}px`,
        width: "auto",
      }}
      aria-hidden="true"
      className={`inline-block shrink-0 object-contain align-middle select-none ${className}`}
    />
  );

  // Standalone icon mode
  if (amount === undefined || amount === null) {
    return imageElement;
  }

  // Stacked layout option (non-bold, clean)
  if (layout === "stacked") {
    return (
      <div className={`inline-flex items-center gap-1.5 select-none ${amountClassName}`}>
        {imageElement}
        <div className="flex flex-col justify-center leading-tight">
          <span className="font-normal tabular-nums text-[16px] leading-none text-[#0d7377] dark:text-[#32e0c4]">
            {amount}
          </span>
          {suffix && (
            <span className="mt-0.5 text-[11px] font-normal leading-none text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Clean, unboxed inline lockup — normal weight, no shadows, no halos
  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${amountClassName}`}>
      {imageElement}
      <div className="flex items-baseline gap-1 leading-none">
        <span className="font-normal tabular-nums text-[17px] leading-none text-[#0d7377] dark:text-[#32e0c4]">
          {amount}
        </span>
        {suffix && (
          <span className="text-[12px] font-normal leading-none text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
