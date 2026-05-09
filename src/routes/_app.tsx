import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <AppLayoutSkeleton />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function AppLayoutSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background" aria-busy="true" aria-live="polite">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 md:flex">
        <Skeleton className="mb-3 h-8 w-32" />
        <Skeleton className="mb-1 h-7 w-full" />
        <Skeleton className="mb-1 h-7 w-full" />
        <Skeleton className="mt-4 h-3 w-12" />
        <div className="mt-2 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-9 w-9" />
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <div className="mt-6 grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
