import { createFileRoute } from "@tanstack/react-router";
import { FeedList } from "@/components/feed-list";

export const Route = createFileRoute("/_app/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — TechPulse" }] }),
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
