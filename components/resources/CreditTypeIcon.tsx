import Image from "next/image";

/**
 * Credit-cost icon for standalone resources: the Rahvana "seed jar".
 *
 * public/assets/images/seed-jar.webp is the watercolour corked seed jar (blue
 * string, bird tag) cut from its white background and saved at 281px tall (~24 KB),
 * several times the largest size it is shown at (38px), so it stays sharp on
 * high-DPI screens and when zoomed. It is one cached file shared by every
 * card, served as-is (unoptimized) so there is no blurry placeholder swap.
 *
 * `kind` is kept so a section can get its own variant later; today all three
 * share the jar.
 */
export type CreditIconKind = "tools" | "guides" | "services";

/** What users call the wallet currency. Change it here to rename the price labels. */
export const CURRENCY_LABEL = "jarthings";

/*
 * Price text matches the header wallet balance and the card footer actions:
 * a bold, tabular teal number with a lighter label in the same teal.
 */
const NUMBER_CLS =
  "text-[15px] font-bold leading-none tabular-nums text-[#0d7377] dark:text-[#32e0c4]";
const LABEL_CLS = "font-medium leading-none text-[#0d7377]/80 dark:text-[#32e0c4]/80";

const SEED_JAR_SRC = "/assets/images/seed-jar.webp";
/** Artwork is 322 x 281; width follows the height. */
const ASPECT_RATIO = 322 / 281;

function SeedJarSvg({ size, className = "" }: { size: number; className?: string }) {
  return (
    <Image
      src={SEED_JAR_SRC}
      alt=""
      aria-hidden="true"
      width={Math.max(1, Math.round(size * ASPECT_RATIO))}
      height={size}
      unoptimized
      draggable={false}
      className={`inline-block shrink-0 align-middle select-none ${className}`}
    />
  );
}

export interface CreditTypeIconProps {
  kind: CreditIconKind;
  size?: number;
  className?: string;
  /** When provided, displays the amount cleanly beside the jar */
  amount?: number | string | null;
  /** Label after the amount (defaults to CURRENCY_LABEL when amount is present) */
  suffix?: string | false;
  /** Optional layout style: "inline" (default) or "stacked" */
  layout?: "inline" | "stacked";
  /** Optional extra classes for the container */
  amountClassName?: string;
}

export default function CreditTypeIcon({
  size = 28,
  className = "",
  amount,
  suffix = CURRENCY_LABEL,
  layout = "inline",
  amountClassName = "",
}: CreditTypeIconProps) {
  const icon = <SeedJarSvg size={size} className={className} />;

  // Standalone icon mode
  if (amount === undefined || amount === null) {
    return icon;
  }

  if (layout === "stacked") {
    return (
      <div className={`inline-flex items-center gap-1.5 select-none ${amountClassName}`}>
        {icon}
        <div className="flex flex-col justify-center leading-tight">
          <span className={NUMBER_CLS}>{amount}</span>
          {suffix && (
            <span className={`mt-0.5 text-[12px] ${LABEL_CLS}`}>
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${amountClassName}`}>
      {icon}
      <div className="flex items-baseline gap-1 leading-none">
        <span className={NUMBER_CLS}>{amount}</span>
        {suffix && (
          <span className={`text-[13px] ${LABEL_CLS}`}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
