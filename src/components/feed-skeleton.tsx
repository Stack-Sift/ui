import { Skeleton } from "@/components/ui/skeleton";

export function FeedRouteSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8" aria-busy="true" aria-live="polite">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 grid gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
