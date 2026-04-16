import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";

export type ArticleCardData = {
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  sector_slugs: string[];
  source: { name: string; slug: string } | null;
  bookmarked: boolean;
};

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(article.bookmarked);
  const [busy, setBusy] = useState(false);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setBusy(true);
    if (saved) {
      const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("article_id", article.id);
      if (!error) setSaved(false);
      else toast.error(error.message);
    } else {
      const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, article_id: article.id });
      if (!error) setSaved(true);
      else toast.error(error.message);
    }
    setBusy(false);
  };

  return (
    <article className="group rounded-lg border border-border bg-card transition hover:shadow-sm">
      <Link to="/article/$id" params={{ id: article.id }} className="block p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {article.source && (
              <span className="font-medium text-foreground">{article.source.name}</span>
            )}
            {article.published_at && (
              <>
                <span>·</span>
                <time>{new Date(article.published_at).toLocaleDateString()}</time>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleBookmark} disabled={busy} aria-label="Bookmark">
            {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-card-foreground group-hover:text-primary">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {article.sector_slugs.slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {s}
            </Badge>
          ))}
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            Original <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Link>
    </article>
  );
}
