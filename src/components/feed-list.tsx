import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ArticleCardData } from "@/components/article-card";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";

type Options = {
  sectorSlug?: string;
  mine?: boolean;
  bookmarksOnly?: boolean;
  search?: string;
};

type PreferenceRow = {
  preferred_domain: string | null;
  tech_preferences: string[] | null;
  interests: string[] | null;
};

const TREND_WEIGHT: Record<string, number> = {
  hot: 4,
  trending: 3,
  rising: 2,
  new: 1,
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function scoreArticle(article: ArticleCardData, preferences?: PreferenceRow | null) {
  const trend = TREND_WEIGHT[normalize(article.trend_score ?? "")] ?? 0;
  if (!preferences) return trend;

  const techTerms = new Set((preferences.tech_preferences ?? []).map(normalize));
  const tagMatches = article.tags.filter((tag) => techTerms.has(normalize(tag))).length;

  const interestDomains = new Set((preferences.interests ?? []).map(normalize));
  const articleDomain = article.domain ? normalize(article.domain) : null;
  const interestMatch = articleDomain ? interestDomains.has(articleDomain) : false;
  const preferredDomainMatch =
    preferences.preferred_domain && articleDomain
      ? normalize(preferences.preferred_domain) === articleDomain
      : false;

  return trend + tagMatches * 3 + (interestMatch ? 2 : 0) + (preferredDomainMatch ? 2 : 0);
}

export function useFeed(opts: Options) {
  const [articles, setArticles] = useState<ArticleCardData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setArticles(null);
    setError(null);

    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;

    let preferences: PreferenceRow | null = null;
    if (opts.mine && userId) {
      const { data: pref } = await supabase
        .from("profiles")
        .select("preferred_domain, tech_preferences, interests")
        .eq("id", userId)
        .maybeSingle();
      preferences = pref as PreferenceRow | null;
    }

    let bookmarkIds: string[] | null = null;
    if (opts.bookmarksOnly) {
      bookmarkIds = JSON.parse(localStorage.getItem("stack-sift-bookmarks") ?? "[]") as string[];
      if (bookmarkIds.length === 0) {
        setArticles([]);
        return;
      }
    }

    let query = supabase
      .from("blog_entries")
      .select("id, title, url, source_name, domain, tags, trend_score, estimated_read_min, summary_for_dev, summary_for_cto, summary_for_pm, summary_for_data_sci, summary_for_founder, summary_for_designer, published_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(100);

    if (bookmarkIds) query = query.in("id", bookmarkIds);
    if (opts.search) query = query.ilike("title", `%${opts.search}%`);

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
      setArticles([]);
      return;
    }

    const userBookmarks = new Set(JSON.parse(localStorage.getItem("stack-sift-bookmarks") ?? "[]") as string[]);
    const techTerms = new Set((preferences?.tech_preferences ?? []).map(normalize));
    const interestDomains = new Set((preferences?.interests ?? []).map(normalize));

    const mapped = (data ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        source_name: a.source_name,
        domain: a.domain,
        tags: a.tags ?? [],
        trend_score: a.trend_score,
        estimated_read_min: a.estimated_read_min,
        published_at: a.published_at,
        summary:
          a.summary_for_dev ??
          a.summary_for_cto ??
          a.summary_for_pm ??
          a.summary_for_data_sci ??
          a.summary_for_founder ??
          a.summary_for_designer ??
          null,
        bookmarked: userBookmarks.has(a.id),
      })) as ArticleCardData[];

    const filtered = mapped.filter((article) => {
      if (opts.sectorSlug && !article.tags.map(normalize).includes(normalize(opts.sectorSlug))) return false;
      if (!opts.mine || !preferences) return true;
      const articleDomain = article.domain ? normalize(article.domain) : null;
      const hasTagMatch = article.tags.some((tag) => techTerms.has(normalize(tag)));
      const hasInterestMatch = articleDomain ? interestDomains.has(articleDomain) : false;
      const hasPreferredDomainMatch =
        preferences.preferred_domain && articleDomain
          ? normalize(preferences.preferred_domain) === articleDomain
          : false;
      const noPreferences = techTerms.size === 0 && interestDomains.size === 0 && !preferences.preferred_domain;
      return hasTagMatch || hasInterestMatch || hasPreferredDomainMatch || noPreferences;
    });

    setArticles(filtered.sort((a, b) => scoreArticle(b, preferences) - scoreArticle(a, preferences)));
  }, [opts.sectorSlug, opts.mine, opts.bookmarksOnly, opts.search]);

  useEffect(() => {
    load();
  }, [load]);

  return { articles, error, reload: load };
}

export function FeedList(props: Options & { emptyMessage?: string }) {
  const { articles, error } = useFeed(props);

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  if (articles === null) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {props.emptyMessage ?? "No articles yet."}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}
