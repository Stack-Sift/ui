import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedList } from "@/components/feed-list";

export const Route = createFileRoute("/_app/sector/$slug")({
  head: () => ({ meta: [{ title: "Sector — TechPulse" }] }),
  component: SectorPage,
});

function SectorPage() {
  const { slug } = Route.useParams();
  const [name, setName] = useState(slug);

  useEffect(() => {
    supabase.from("sectors").select("name").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data?.name) setName(data.name);
    });
  }, [slug]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">{name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">All articles tagged in this sector.</p>
      <FeedList sectorSlug={slug} emptyMessage="No articles in this sector yet." />
    </div>
  );
}
