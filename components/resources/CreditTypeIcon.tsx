import Image from "next/image";

/**
 * Credit-cost icon for standalone resources, one brand image per section.
 * The team is reviewing the three candidate images (public/assets/images) —
 * swap an entry here to change it everywhere that section's "N Credits" rows
 * render (My Resources cards and /resources detail pages).
 */
export type CreditIconKind = "tools" | "guides" | "services";

const CREDIT_ICONS: Record<CreditIconKind, string> = {
  tools: "/assets/images/rahvana-gold-coin.jpg",
  guides: "/assets/images/rahvana-credit-currency.jpg",
  services: "/assets/images/rahvana-flying-note.jpg",
};

export default function CreditTypeIcon({
  kind,
  size = 14,
  className = "",
}: {
  kind: CreditIconKind;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={CREDIT_ICONS[kind]}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
