/**
 * Section heading used inside the embedded "My Resources" tabs to separate the
 * user's owned/started items ("My …") from the browsable catalog ("Browse …").
 * Padding is intentionally omitted so it aligns with the grid container it sits in.
 */
export default function ResourceSectionHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`pt-6 ${className ?? ""}`}>
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
