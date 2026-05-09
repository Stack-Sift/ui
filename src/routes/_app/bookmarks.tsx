import { createFileRoute } from "@tanstack/react-router";
import { FeedList } from "@/components/feed-list";
import { FeedRouteSkeleton } from "@/components/feed-skeleton";
import { ErrorFallback } from "@/components/error-fallback";

export const Route = createFileRoute("/_app/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — Stack Sift" },
      { name: "description", content: "Articles you've saved for later." },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingMs: 0,
  pendingComponent: () => <FeedRouteSkeleton rows={3} />,
  errorComponent: ({ error, reset }) => <ErrorFallback error={error} reset={reset} variant="panel" />,
  component: BookmarksPage,
});

function BookmarksPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Bookmarks</h1>
      <p className="mb-6 text-sm text-muted-foreground">Articles you've saved.</p>
      <FeedList bookmarksOnly emptyMessage="You haven't bookmarked anything yet." />
    </div>
  );
}
