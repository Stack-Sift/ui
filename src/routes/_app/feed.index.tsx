import { createFileRoute } from "@tanstack/react-router";
import { FeedList } from "@/components/feed-list";

export const Route = createFileRoute("/_app/feed/")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({ meta: [{ title: "All News — TechPulse" }] }),
  component: AllFeed,
});

function AllFeed() {
  const { q } = Route.useSearch();
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
        {q ? `Results for "${q}"` : "All News"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Latest from top engineering blogs.
      </p>
      <FeedList search={q} />
    </div>
  );
}
