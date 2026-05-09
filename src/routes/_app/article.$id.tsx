import { createFileRoute, getRouteApi, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorFallback } from "@/components/error-fallback";

type Audience = "dev" | "cto" | "pm" | "data_sci" | "founder" | "designer";

const TABS: { value: Audience; label: string }[] = [
  { value: "dev", label: "Dev" },
  { value: "cto", label: "CTO" },
  { value: "pm", label: "PM" },
  { value: "data_sci", label: "Data" },
  { value: "founder", label: "Founder" },
  { value: "designer", label: "Design" },
];

type Article = {
  id: string;
  title: string;
  url: string;
  source_name: string | null;
  domain: string | null;
  tags: string[] | null;
  trend_score: string | null;
  estimated_read_min: number | null;
  summary_for_cto: string | null;
  summary_for_dev: string | null;
  summary_for_pm: string | null;
  summary_for_data_sci: string | null;
  summary_for_founder: string | null;
  summary_for_designer: string | null;
  published_at: string | null;
};

const ARTICLE_COLUMNS =
  "id, title, url, source_name, domain, tags, trend_score, estimated_read_min, summary_for_cto, summary_for_dev, summary_for_pm, summary_for_data_sci, summary_for_founder, summary_for_designer, published_at";

export const Route = createFileRoute("/_app/article/$id")({
  head: ({ params }) => ({
    meta: [{ title: "Article — Stack Sift" }],
    links: [{ rel: "canonical", href: `/article/${params.id}` }],
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_entries")
      .select(ARTICLE_COLUMNS)
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { article: data as Article };
  },
  pendingMs: 0,
  pendingComponent: ArticleSkeleton,
  errorComponent: ({ error, reset }) => <ErrorFallback error={error} reset={reset} />,
  component: ArticlePage,
});

const articleRoute = getRouteApi("/_app/article/$id");

function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8" aria-busy="true" aria-live="polite">
      <Skeleton className="mb-4 h-4 w-24" />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-3 h-9 w-3/4" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="mt-6 h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function ArticlePage() {
  const { article } = articleRoute.useLoaderData() as { article: Article };
  const [audience, setAudience] = useState<Audience>("dev");

  const summaries: Record<Audience, string | null> = {
    dev: article.summary_for_dev,
    cto: article.summary_for_cto,
    pm: article.summary_for_pm,
    data_sci: article.summary_for_data_sci,
    founder: article.summary_for_founder,
    designer: article.summary_for_designer,
  };
  const current = summaries[audience];
  const description =
    summaries.dev ?? summaries.cto ?? summaries.pm ?? summaries.data_sci ?? summaries.founder ?? summaries.designer ?? article.title;

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description,
      url: article.url,
      mainEntityOfPage: article.url,
      datePublished: article.published_at ?? undefined,
      author: article.source_name ? { "@type": "Organization", name: article.source_name } : undefined,
      publisher: article.source_name ? { "@type": "Organization", name: article.source_name } : undefined,
      keywords: (article.tags ?? []).join(", ") || undefined,
      articleSection: article.domain ?? undefined,
      timeRequired: article.estimated_read_min ? `PT${article.estimated_read_min}M` : undefined,
    }),
    [article, description],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousTitle = document.title;
    document.title = `${article.title} — Stack Sift`;

    const setMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", article.title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", "article");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", article.title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    return () => {
      document.title = previousTitle;
    };
  }, [article.title, description]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link to="/feed" className="mb-4 inline-block text-sm text-muted-foreground hover:text-primary">
        ← Back to feed
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <article>
          <div className="text-xs text-muted-foreground">
            {article.source_name}
            {article.published_at && <> · {new Date(article.published_at).toLocaleDateString()}</>}
            {article.estimated_read_min && <> · {article.estimated_read_min} min read</>}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {article.domain && <Badge variant="outline">{article.domain}</Badge>}
            {article.trend_score && <Badge className="capitalize">{article.trend_score}</Badge>}
            {(article.tags ?? []).map((s) => (
              <Badge key={s} variant="secondary" className="capitalize">{s}</Badge>
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

          {current && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{current}</p>
          )}
        </article>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-card-foreground">AI Summary</h2>
            </div>
            <Tabs value={audience} onValueChange={(v) => setAudience(v as Audience)}>
              <TabsList className="grid w-full grid-cols-3 text-xs">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
                ))}
              </TabsList>
              {TABS.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-4">
                  {audience === t.value && summaries[t.value] ? (
                    <p className="text-sm leading-relaxed text-card-foreground">{summaries[t.value]}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No summary is available for this role yet.</p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Summaries come from the blog_entries role-specific summary fields.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
