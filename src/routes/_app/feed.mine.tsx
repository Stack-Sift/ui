import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { FeedList } from "@/components/feed-list";
import { FeedRouteSkeleton } from "@/components/feed-skeleton";
import { ErrorFallback } from "@/components/error-fallback";

export const Route = createFileRoute("/_app/feed/mine")({
  head: () => ({
    meta: [
      { title: "My Feed — Stack Sift" },
      { name: "description", content: "Articles ranked for you using your interests, preferred domain, and tech preferences." },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingMs: 0,
  pendingComponent: () => <FeedRouteSkeleton />,
  errorComponent: ({ error, reset }) => <ErrorFallback error={error} reset={reset} variant="panel" />,
  component: MyFeed,
});

function MyFeed() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);
  if (loading || !user) return <FeedRouteSkeleton />;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">My Feed</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Articles matching your interests, preferred domain, and tech preferences. Update them in{" "}
        <a href="/settings" className="text-primary hover:underline">Settings</a>.
      </p>
      <FeedList mine emptyMessage="No matches yet. Pick more interests in Settings." />
    </div>
  );
}
