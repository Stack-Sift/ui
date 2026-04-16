import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSummary } from "@/server/summaries";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

type Audience = "general" | "software_engineer" | "data_engineer" | "devops" | "product_manager";

const TABS: { value: Audience; label: string }[] = [
  { value: "general", label: "General" },
  { value: "software_engineer", label: "Software Eng" },
  { value: "data_engineer", label: "Data Eng" },
  { value: "devops", label: "DevOps" },
  { value: "product_manager", label: "Product" },
];

type Article = {
  id: string;
  title: string;
  url: string;
  author: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
  sector_slugs: string[];
  source: { name: string; slug: string } | null;
};

export const Route = createFileRoute("/_app/article/$id")({
  head: () => ({ meta: [{ title: "Article — TechPulse" }] }),
  component: ArticlePage,
});

function ArticlePage() {
  const { id } = Route.useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [audience, setAudience] = useState<Audience>("general");
  const [summaries, setSummaries] = useState<Record<Audience, { summary: string; key_points: string[] } | "loading" | undefined>>({} as never);
  const summaryFn = useServerFn(getSummary);

  useEffect(() => {
    supabase
      .from("articles")
      .select("id, title, url, author, excerpt, content, image_url, published_at, sector_slugs, source:sources(name, slug)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setArticle({
          ...data,
          source: Array.isArray(data.source) ? data.source[0] ?? null : data.source,
        } as Article);
      });
  }, [id]);

  useEffect(() => {
    if (!article) return;
    if (summaries[audience]) return;
    setSummaries((s) => ({ ...s, [audience]: "loading" }));
    summaryFn({ data: { articleId: article.id, audience } })
      .then((r) => setSummaries((s) => ({ ...s, [audience]: { summary: r.summary, key_points: r.key_points } })))
      .catch((e) => {
        toast.error(e?.message ?? "Failed to generate summary");
        setSummaries((s) => ({ ...s, [audience]: undefined }));
      });
  }, [article, audience, summaryFn, summaries]);

  if (!article) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  const current = summaries[audience];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link to="/feed" className="mb-4 inline-block text-sm text-muted-foreground hover:text-primary">
        ← Back to feed
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <article>
          <div className="text-xs text-muted-foreground">
            {article.source?.name}
            {article.published_at && <> · {new Date(article.published_at).toLocaleDateString()}</>}
            {article.author && <> · {article.author}</>}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {article.sector_slugs.map((s) => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))}
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Read original <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {article.excerpt && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
          )}
          {article.content && (
            <div className="prose prose-neutral dark:prose-invert mt-6 max-w-none whitespace-pre-wrap text-foreground">
              {article.content}
            </div>
          )}
        </article>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-card-foreground">AI Summary</h2>
            </div>
            <Tabs value={audience} onValueChange={(v) => setAudience(v as Audience)}>
              <TabsList className="grid w-full grid-cols-5 text-xs">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
                ))}
              </TabsList>
              {TABS.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-4">
                  {current === "loading" || (audience === t.value && !current) ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : audience === t.value && current && typeof current !== "string" ? (
                    <div>
                      <p className="text-sm leading-relaxed text-card-foreground">{current.summary}</p>
                      {current.key_points.length > 0 && (
                        <>
                          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Key points
                          </h3>
                          <ul className="mt-2 space-y-1.5 text-sm text-card-foreground">
                            {current.key_points.map((p, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-primary">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ) : null}
                </TabsContent>
              ))}
            </Tabs>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Summaries are generated on demand and cached.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
