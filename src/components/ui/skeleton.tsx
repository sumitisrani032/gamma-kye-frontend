interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-surface-tertiary ${className}`} />
  );
}

/** Pre-built skeleton patterns */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <Skeleton className="h-3 w-1/4" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
