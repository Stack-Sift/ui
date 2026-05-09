import { createFileRoute } from "@tanstack/react-router";
import { FeedList } from "@/components/feed-list";
import { FeedRouteSkeleton } from "@/components/feed-skeleton";
import { ErrorFallback } from "@/components/error-fallback";

export const Route = createFileRoute("/_app/feed/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } =>
    typeof s.q === "string" && s.q.length > 0 ? { q: s.q } : {},
  head: ({ match }) => {
    const q = (match.search as { q?: string }).q;
    const title = q ? `Search: ${q} — Stack Sift` : "All News — Stack Sift";
    const description = q
      ? `Stack Sift search results for "${q}".`
      : "Latest curated tech blog entries, ranked by freshness and trend score.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  pendingMs: 0,
  pendingComponent: () => <FeedRouteSkeleton />,
  errorComponent: ({ error, reset }) => <ErrorFallback error={error} reset={reset} variant="panel" />,
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
        Latest entries from the Stack Sift blog database, ranked by freshness and trend score.
      </p>
      <FeedList search={q} />
    </div>
  );
}
