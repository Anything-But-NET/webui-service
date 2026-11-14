import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-brand">
          {eyebrow}
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-16 w-full border border-border" />
      <div className="border border-border bg-card divide-y divide-border">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-12 px-4 flex items-center gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
