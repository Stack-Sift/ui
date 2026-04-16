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

export function useFeed(opts: Options) {
  const [articles, setArticles] = useState<ArticleCardData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setArticles(null);
    setError(null);

    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;

    let prefSectors: string[] = [];
    if (opts.mine && userId) {
      const { data: pref } = await supabase.from("user_preferences").select("sectors").eq("user_id", userId).maybeSingle();
      prefSectors = pref?.sectors ?? [];
    }

    let bookmarkIds: string[] | null = null;
    if (opts.bookmarksOnly && userId) {
      const { data: bms } = await supabase.from("bookmarks").select("article_id").eq("user_id", userId);
      bookmarkIds = (bms ?? []).map((b) => b.article_id);
      if (bookmarkIds.length === 0) {
        setArticles([]);
        return;
      }
    }

    let query = supabase
      .from("articles")
      .select("id, title, url, excerpt, image_url, published_at, sector_slugs, source:sources(name, slug)")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50);

    if (opts.sectorSlug) query = query.contains("sector_slugs", [opts.sectorSlug]);
    if (opts.mine && prefSectors.length > 0) query = query.overlaps("sector_slugs", prefSectors);
    if (bookmarkIds) query = query.in("id", bookmarkIds);
    if (opts.search) query = query.ilike("title", `%${opts.search}%`);

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
      setArticles([]);
      return;
    }

    let userBookmarks = new Set<string>();
    if (userId && data && data.length > 0) {
      const { data: bms } = await supabase
        .from("bookmarks")
        .select("article_id")
        .eq("user_id", userId)
        .in("article_id", data.map((a) => a.id));
      userBookmarks = new Set((bms ?? []).map((b) => b.article_id));
    }

    setArticles(
      (data ?? []).map((a) => ({
        ...a,
        source: Array.isArray(a.source) ? a.source[0] ?? null : a.source,
        bookmarked: userBookmarks.has(a.id),
      })) as ArticleCardData[],
    );
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
