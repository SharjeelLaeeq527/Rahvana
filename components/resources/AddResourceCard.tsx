import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * "Add more" card shown at the end of each My Resources tab. Links to the
 * relevant pricing tab (Tools / Guides / Services) so the user can buy more.
 */
export default function AddResourceCard({
  href,
  label,
  index = 0,
}: {
  href: string;
  label: string;
  index?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[220px] flex-col items-center justify-center rounded-[30px] p-6 mt-6
        border-[1.5px] border-dashed border-border bg-card/40 text-muted-foreground
        transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary/5 hover:text-primary
        cursor-pointer animate-fade-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border transition-all duration-300 group-hover:scale-110 group-hover:border-primary">
        <Plus className="h-7 w-7" />
      </span>
      <span className="text-base font-semibold">{label}</span>
    </Link>
  );
}
