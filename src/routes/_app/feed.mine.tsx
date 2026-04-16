import { createFileRoute } from "@tanstack/react-router";
import { FeedList } from "@/components/feed-list";

export const Route = createFileRoute("/_app/feed/mine")({
  head: () => ({ meta: [{ title: "My Feed — TechPulse" }] }),
  component: MyFeed,
});

function MyFeed() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">My Feed</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Articles matching your preferred sectors. Update them in{" "}
        <a href="/settings" className="text-primary hover:underline">Settings</a>.
      </p>
      <FeedList mine emptyMessage="No matches yet — pick more sectors in Settings." />
    </div>
  );
}
