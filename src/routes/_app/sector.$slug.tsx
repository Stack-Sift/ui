import { createFileRoute } from "@tanstack/react-router";
import { FeedList } from "@/components/feed-list";
import { FeedRouteSkeleton } from "@/components/feed-skeleton";
import { ErrorFallback } from "@/components/error-fallback";

export const Route = createFileRoute("/_app/sector/$slug")({
  head: ({ params }) => {
    const title = `${params.slug} articles — Stack Sift`;
    const description = `All Stack Sift articles tagged with ${params.slug}.`;
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
  component: SectorPage,
});

function SectorPage() {
  const { slug } = Route.useParams();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold capitalize tracking-tight text-foreground">{slug}</h1>
      <p className="mb-6 text-sm text-muted-foreground">All articles tagged with this topic.</p>
      <FeedList sectorSlug={slug} emptyMessage="No articles with this tag yet." />
    </div>
  );
}
